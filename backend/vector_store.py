import os
import chromadb

CHROMA_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

def delete_session(session_id: str):
    try:
        client = chromadb.PersistentClient(path=CHROMA_DIR)
        client.delete_collection(f"session_{session_id}")
    except Exception as e:
        print(f"Delete session error: {e}")