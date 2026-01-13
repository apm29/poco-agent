import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.scheduler.scheduler_config import scheduler
from app.core.settings import get_settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()

    logger.info("Starting APScheduler...")
    scheduler.start()
    logger.info("APScheduler started")

    if settings.workspace_cleanup_enabled:
        from app.services.cleanup_service import CleanupService

        logger.info("Initializing workspace cleanup service...")
        CleanupService(scheduler)
        logger.info("Workspace cleanup service initialized")

    yield

    logger.info("Shutting down APScheduler...")
    scheduler.shutdown()
    logger.info("APScheduler shut down")
