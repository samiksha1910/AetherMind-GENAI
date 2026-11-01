
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.routes.ai import router as ai_router
from app.routes.tasks import router as tasks_router
from app.routes.goals import router as goals_router

app = FastAPI(
    title="AetherMind API",
    description="Personal AI Chief of Staff",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Welcome to AetherMind API"}


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "AetherMind backend is running"
    }


app.include_router(ai_router)
app.include_router(tasks_router)
app.include_router(goals_router)