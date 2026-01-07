from fastapi import FastAPI

from app.core.errors.exception_handlers import setup_exception_handlers
from app.core.middleware import setup_middleware
from app.core.observability.logging import configure_logging
from app.core.settings import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(debug=settings.debug)

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
    )

    setup_middleware(app)
    setup_exception_handlers(app, debug=settings.debug)

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(app, host=settings.host, port=settings.port)
