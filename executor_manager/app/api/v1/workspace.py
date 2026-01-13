from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.core.errors.error_codes import ErrorCode
from app.core.errors.exceptions import AppException
from app.schemas.response import Response, ResponseSchema
from app.services.workspace_manager import WorkspaceManager

router = APIRouter(prefix="/workspace", tags=["workspace"])
workspace_manager = WorkspaceManager()


@router.get("/stats", response_model=ResponseSchema[dict])
async def get_workspace_stats() -> JSONResponse:
    """Get workspace disk usage statistics."""
    stats = workspace_manager.get_disk_usage()
    return Response.success(data=stats)


@router.get("/users/{user_id}", response_model=ResponseSchema[list])
async def get_user_workspaces(user_id: str) -> JSONResponse:
    """Get all workspaces for a user."""
    workspaces = workspace_manager.get_user_workspaces(user_id)
    return Response.success(data=workspaces)


@router.post("/archive/{user_id}/{session_id}", response_model=ResponseSchema[dict])
async def archive_workspace(
    user_id: str,
    session_id: str,
    keep_days: int = Query(default=7, ge=1, le=90),
) -> JSONResponse:
    """Archive workspace."""
    archive_path = workspace_manager.archive_workspace(
        user_id=user_id,
        session_id=session_id,
        keep_days=keep_days,
    )

    if archive_path:
        return Response.success(
            data={"archive_path": archive_path},
            message="Workspace archived successfully",
        )
    else:
        raise AppException(error_code=ErrorCode.WORKSPACE_ARCHIVE_FAILED)


@router.delete("/{user_id}/{session_id}", response_model=ResponseSchema[dict])
async def delete_workspace(
    user_id: str,
    session_id: str,
    force: bool = Query(default=False),
) -> JSONResponse:
    """Delete workspace."""
    success = workspace_manager.delete_workspace(
        user_id=user_id,
        session_id=session_id,
        force=force,
    )

    if success:
        return Response.success(
            data={"user_id": user_id, "session_id": session_id},
            message="Workspace deleted successfully",
        )
    else:
        raise AppException(error_code=ErrorCode.WORKSPACE_DELETE_FAILED)
