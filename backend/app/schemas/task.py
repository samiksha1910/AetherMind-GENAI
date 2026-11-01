
from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class TaskExtractionRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)
    source: Literal["Text", "Voice"] = "Text"


class ExtractedTask(BaseModel):
    title: str
    description: str = ""
    category: str = "General"
    priority: Literal["Low", "Medium", "High"] = "Medium"
    due_date: date | None = None
    status: Literal["Pending", "In Progress", "Completed"] = "Pending"
    source: Literal["Text", "Voice"] = "Text"


class TaskExtractionResponse(BaseModel):
    tasks: list[ExtractedTask]
