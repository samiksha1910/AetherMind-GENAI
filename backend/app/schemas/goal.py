
from typing import Literal
from pydantic import BaseModel, Field


class Milestone(BaseModel):
    title: str
    completed: bool = False


class GoalCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    target_date: str | None = None
    milestones: list[Milestone] = Field(default_factory=list)


class GoalUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    target_date: str | None = None
    status: Literal["In Progress", "Completed"] | None = None
    milestones: list[Milestone] | None = None


# AI GOAL BREAKDOWN SCHEMAS

class GoalBreakdownRequest(BaseModel):
    text: str = Field(min_length=3, max_length=5000)


class GoalBreakdownResponse(BaseModel):
    title: str
    description: str
    milestones: list[Milestone]
