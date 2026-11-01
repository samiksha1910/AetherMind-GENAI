
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, HTTPException

from app.database.connection import get_goals_collection
from app.schemas.goal import GoalCreate, GoalUpdate

router = APIRouter(prefix="/api/goals", tags=["Goals"])


def serialize_goal(goal):
    goal["_id"] = str(goal["_id"])
    if isinstance(goal.get("created_at"), datetime):
        goal["created_at"] = goal["created_at"].isoformat()
    return goal


@router.post("")
def create_goal(goal: GoalCreate):
    try:
        collection = get_goals_collection()
        document = goal.model_dump()
        document["status"] = "In Progress"
        document["created_at"] = datetime.now(timezone.utc)

        result = collection.insert_one(document)
        saved_goal = collection.find_one({"_id": result.inserted_id})

        return {
            "message": "Goal created successfully!",
            "goal": serialize_goal(saved_goal)
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not create goal: {type(error).__name__}"
        )


@router.get("")
def get_goals():
    try:
        collection = get_goals_collection()
        goals = [
            serialize_goal(goal)
            for goal in collection.find().sort("created_at", -1)
        ]
        return {"goals": goals, "total": len(goals)}
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not fetch goals: {type(error).__name__}"
        )


@router.patch("/{goal_id}")
def update_goal(goal_id: str, updates: GoalUpdate):
    if not ObjectId.is_valid(goal_id):
        raise HTTPException(status_code=400, detail="Invalid goal ID")

    changes = updates.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="No updates provided")

    try:
        collection = get_goals_collection()
        result = collection.update_one(
            {"_id": ObjectId(goal_id)},
            {"$set": changes}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Goal not found")

        updated_goal = collection.find_one({"_id": ObjectId(goal_id)})

        return {
            "message": "Goal updated successfully!",
            "goal": serialize_goal(updated_goal)
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not update goal: {type(error).__name__}"
        )


@router.delete("/{goal_id}")
def delete_goal(goal_id: str):
    if not ObjectId.is_valid(goal_id):
        raise HTTPException(status_code=400, detail="Invalid goal ID")

    try:
        collection = get_goals_collection()
        result = collection.delete_one({"_id": ObjectId(goal_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Goal not found")

        return {"message": "Goal deleted successfully!"}
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not delete goal: {type(error).__name__}"
        )
