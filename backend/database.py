from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
db = client["rag-docbot"]

users_col    = db["users"]
sessions_col = db["sessions"]
chats_col    = db["chats"]
bookmarks_col = db["bookmarks"]