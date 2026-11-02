
import os
import logging
from pymongo import MongoClient

logger = logging.getLogger(__name__)

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "aethermind")

client = None
database = None


def connect_to_mongodb():
    global client, database

    if not MONGODB_URI:
        raise RuntimeError("MONGODB_URI is missing from environment variables.")

    # Reconnect if either connection object is missing.
    if client is None or database is None:
        try:
            new_client = MongoClient(
                MONGODB_URI,
                serverSelectionTimeoutMS=10000
            )

            new_client.admin.command("ping")
            new_database = new_client[MONGODB_DATABASE]

            # Assign only after the connection succeeds.
            client = new_client
            database = new_database

            logger.info("MongoDB connected successfully.")

        except Exception:
            logger.exception("MongoDB connection failed.")
            raise

    return database


def get_tasks_collection():
    return connect_to_mongodb()["tasks"]


def get_goals_collection():
    return connect_to_mongodb()["goals"]
