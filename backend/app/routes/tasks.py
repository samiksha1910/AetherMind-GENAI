
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal

from app.schemas.task import ExtractedTask
from app.database.connection import get_tasks_collection

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


def serialize_task(task):
    task["_id"] = str(task["_id"])
    if isinstance(task.get("created_at"), datetime):
        task["created_at"] = task["created_at"].isoformat()
    return task


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    description: str | None = None
    category: str | None = None
    priority: Literal["Low", "Medium", "High"] | None = None
    due_date: str | None = None
    status: Literal["Pending", "In Progress", "Completed"] | None = None


@router.post("")
def create_task(task: ExtractedTask):
    try:
        collection = get_tasks_collection()
        document = task.model_dump(mode="json")
        document["created_at"] = datetime.now(timezone.utc)

        result = collection.insert_one(document)
        saved_task = collection.find_one({"_id": result.inserted_id})

        return {
            "message": "Task saved successfully!",
            "task": serialize_task(saved_task)
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save task: {type(error).__name__}"
        )


@router.get("")
def get_all_tasks():
    try:
        collection = get_tasks_collection()
        tasks = [
            serialize_task(task)
            for task in collection.find().sort("created_at", -1)
        ]
        return {"tasks": tasks, "total": len(tasks)}
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not fetch tasks: {type(error).__name__}"
        )


@router.patch("/{task_id}")
def update_task(task_id: str, updates: TaskUpdate):
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID")

    changes = updates.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="No updates provided")

    try:
        collection = get_tasks_collection()
        result = collection.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": changes}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Task not found")

        updated_task = collection.find_one({"_id": ObjectId(task_id)})
        return {
            "message": "Task updated successfully!",
            "task": serialize_task(updated_task)
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not update task: {type(error).__name__}"
        )


@router.delete("/{task_id}")
def delete_task(task_id: str):
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID")

    try:
        collection = get_tasks_collection()
        result = collection.delete_one({"_id": ObjectId(task_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Task not found")

        return {"message": "Task deleted successfully!"}
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not delete task: {type(error).__name__}"
        )
