
import logging

from fastapi import APIRouter, HTTPException

from app.schemas.task import (
    TaskExtractionRequest,
    TaskExtractionResponse,
)
from app.schemas.goal import (
    GoalBreakdownRequest,
    GoalBreakdownResponse,
)
from app.services.gemini_service import (
    extract_tasks,
    break_down_goal,
)

router = APIRouter(prefix="/api/ai", tags=["AI Assistant"])

logger = logging.getLogger(__name__)


@router.post("/extract", response_model=TaskExtractionResponse)
def extract(request: TaskExtractionRequest):
    try:
        result = extract_tasks(request.text, request.source)
        return result

    except RuntimeError as error:
        logger.exception("Gemini configuration error")
        raise HTTPException(status_code=500, detail=str(error))

    except Exception as error:
        logger.exception("Gemini extraction failed: %s", type(error).__name__)
        raise HTTPException(
            status_code=502,
            detail=f"AI extraction failed: {type(error).__name__}. Check backend terminal."
        )


@router.post("/breakdown-goal", response_model=GoalBreakdownResponse)
def breakdown_goal(request: GoalBreakdownRequest):
    try:
        result = break_down_goal(request.text)
        return result

    except RuntimeError as error:
        logger.exception("Gemini configuration error")
        raise HTTPException(status_code=500, detail=str(error))

    except Exception as error:
        logger.exception("Goal breakdown failed: %s", type(error).__name__)
        raise HTTPException(
            status_code=502,
            detail=f"Goal breakdown failed: {type(error).__name__}. Check backend terminal."
        )
