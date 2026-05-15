import os
import chromadb
from langchain_huggingface import HuggingFaceEmbeddings

CHROMA_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def delete_session(session_id: str):
    try:
        client = chromadb.PersistentClient(path=CHROMA_DIR)
        client.delete_collection(f"session_{session_id}")
    except Exception as e:
        print(f"Delete session error: {e}")