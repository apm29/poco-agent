import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from app.core.errors.error_codes import ErrorCode
from app.core.errors.exceptions import AppException
from app.schemas.response import Response

logger = logging.getLogger(__name__)


def setup_exception_handlers(app: FastAPI, *, debug: bool) -> None:
    """Register exception handlers for the FastAPI application.

    Sets up handlers for custom application exceptions, FastAPI HTTPExceptions,
    and general unhandled exceptions.

    Args:
        app: FastAPI application instance.
        debug: If True, include error details in general exception responses.
    """

    @app.exception_handler(AppException)
    async def app_exception_handler(
        request: Request, exc: AppException
    ) -> JSONResponse:
        """Handle custom application exceptions.

        Args:
            request: The request that raised the exception.
            exc: The application exception.

        Returns:
            JSONResponse with code=400 and error details from the exception.
        """
        return Response.error(
            code=exc.code,
            message=exc.message,
            data=exc.details,
            status_code=400,
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(
        request: Request, exc: HTTPException
    ) -> JSONResponse:
        """Handle FastAPI HTTP exceptions.

        Preserves the original HTTP status code from the exception.

        Args:
            request: The request that raised the exception.
            exc: The FastAPI HTTPException.

        Returns:
            JSONResponse with the original status code and error details.
        """
        message = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        data = exc.detail if isinstance(exc.detail, dict) else None

        return Response.error(
            code=exc.status_code,
            message=message,
            data=data,
            status_code=exc.status_code,
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """Handle unexpected exceptions.

        Logs the exception and returns a generic error response. In debug mode,
        includes the exception type and message in the response.

        Args:
            request: The request that raised the exception.
            exc: The unhandled exception.

        Returns:
            JSONResponse with code=500 and a generic error message.
        """
        logger.exception("Unhandled exception")

        data = {"type": type(exc).__name__, "message": str(exc)} if debug else None

        return Response.error(
            code=ErrorCode.INTERNAL_ERROR.code,
            message=ErrorCode.INTERNAL_ERROR.message,
            data=data,
            status_code=500,
        )
