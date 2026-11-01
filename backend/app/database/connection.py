
import os
from pymongo import MongoClient

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "aethermind")

client = None
database = None


def connect_to_mongodb():
    global client, database

    if not MONGODB_URI:
        raise RuntimeError("MONGODB_URI is missing from backend/.env")

    if client is None:
        client = MongoClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=10000
        )
        client.admin.command("ping")
        database = client[MONGODB_DATABASE]

    return database


def get_tasks_collection():
    db = connect_to_mongodb()
    return db["tasks"]


def get_goals_collection():
    db = connect_to_mongodb()
    return db["goals"]
