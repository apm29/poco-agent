import asyncio
import base64
import json
import os
from typing import Any

import httpx
import websockets

from app.core.computer import ComputerClient
from app.hooks.base import AgentHook, ExecutionContext
from app.utils.serializer import serialize_message

POCO_PLAYWRIGHT_MCP_PREFIX = "mcp____poco_playwright__"


class BrowserScreenshotHook(AgentHook):
    """Capture a screenshot after each browser tool call and upload it to the manager.

    This hook is intentionally best-effort: failures should never block the agent execution.
    """

    def __init__(
        self,
        *,
        client: ComputerClient,
        cdp_endpoint: str | None = None,
    ) -> None:
        self._client = client
        self._cdp_endpoint = (
            (cdp_endpoint or os.environ.get("POCO_BROWSER_CDP_ENDPOINT", "")).strip()
            or "http://127.0.0.1:9222"
        ).rstrip("/")
        self._tool_name_by_use_id: dict[str, str] = {}
        self._scheduled: set[str] = set()
        self._tasks: set[asyncio.Task[None]] = set()

    async def on_teardown(self, context: ExecutionContext) -> None:
        # Best-effort flush pending screenshot tasks.
        if not self._tasks:
            return

        pending = list(self._tasks)
        self._tasks.clear()
        try:
            done, still_pending = await asyncio.wait(pending, timeout=8.0)
            # Avoid leaking tasks beyond teardown; cancellation is best-effort.
            for task in still_pending:
                task.cancel()
            _ = done
        except Exception:
            return

    async def on_agent_response(self, context: ExecutionContext, message: Any) -> None:
        payload = serialize_message(message)
        if not isinstance(payload, dict):
            return

        content = payload.get("content", [])
        if not isinstance(content, list):
            return

        for block in content:
            if not isinstance(block, dict):
                continue

            block_type = str(block.get("_type", "") or "")

            if "ToolUseBlock" in block_type:
                tool_use_id = block.get("id")
                tool_name = block.get("name")
                if isinstance(tool_use_id, str) and isinstance(tool_name, str):
                    self._tool_name_by_use_id[tool_use_id] = tool_name
                continue

            if "ToolResultBlock" not in block_type:
                continue

            tool_use_id = block.get("tool_use_id")
            if not isinstance(tool_use_id, str) or not tool_use_id:
                continue

            tool_name = self._tool_name_by_use_id.get(tool_use_id)
            if not tool_name or not tool_name.startswith(POCO_PLAYWRIGHT_MCP_PREFIX):
                continue

            # Avoid capturing screenshots for explicit screenshot tool calls.
            if tool_name.endswith("screenshot") or "screenshot" in tool_name:
                continue

            if tool_use_id in self._scheduled:
                continue
            self._scheduled.add(tool_use_id)

            task = asyncio.create_task(
                self._capture_and_upload(
                    session_id=context.session_id,
                    tool_use_id=tool_use_id,
                )
            )
            self._tasks.add(task)
            task.add_done_callback(lambda t: self._tasks.discard(t))

    async def _capture_and_upload(self, *, session_id: str, tool_use_id: str) -> None:
        try:
            png_bytes = await self._capture_png()
            if not png_bytes:
                return
            await self._client.upload_browser_screenshot(
                session_id=session_id,
                tool_use_id=tool_use_id,
                png_bytes=png_bytes,
            )
        except Exception:
            return

    async def _capture_png(self) -> bytes | None:
        ws_url = await self._resolve_page_ws_url()
        if not ws_url:
            return None

        payload = await self._cdp_capture_screenshot(ws_url)
        if not payload:
            return None

        try:
            return base64.b64decode(payload, validate=True)
        except Exception:
            return None

    async def _resolve_page_ws_url(self) -> str | None:
        # Prefer /json/list to get a page target (Page.captureScreenshot works on page sessions).
        url = f"{self._cdp_endpoint}/json/list"
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                targets = resp.json()
        except Exception:
            return None

        if not isinstance(targets, list):
            return None

        for item in targets:
            if not isinstance(item, dict):
                continue
            if item.get("type") != "page":
                continue
            ws_url = item.get("webSocketDebuggerUrl")
            if isinstance(ws_url, str) and ws_url.strip():
                return ws_url.strip()
        return None

    async def _cdp_capture_screenshot(self, ws_url: str) -> str | None:
        try:
            async with websockets.connect(ws_url, max_size=20 * 1024 * 1024) as ws:
                # Ensure Page domain is enabled for consistent screenshots.
                await ws.send(json.dumps({"id": 1, "method": "Page.enable"}))
                await ws.send(
                    json.dumps(
                        {
                            "id": 2,
                            "method": "Page.captureScreenshot",
                            "params": {"format": "png"},
                        }
                    )
                )

                while True:
                    raw = await asyncio.wait_for(ws.recv(), timeout=2.5)
                    message = json.loads(raw)
                    if not isinstance(message, dict):
                        continue
                    if message.get("id") != 2:
                        continue
                    result = message.get("result")
                    if not isinstance(result, dict):
                        return None
                    data = result.get("data")
                    return data if isinstance(data, str) and data else None
        except Exception:
            return None
