from fastapi import FastAPI

from app.core.middleware.request_context import RequestContextMiddleware
from app.core.middleware.request_logging import RequestLoggingMiddleware


def setup_middleware(app: FastAPI) -> None:
    # Inner -> outer: add order matters (Starlette wraps last-added as the outermost).
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(RequestContextMiddleware)
