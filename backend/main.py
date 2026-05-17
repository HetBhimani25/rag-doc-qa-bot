import os
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from datetime import datetime

from models import *
from database import users_col, sessions_col, chats_col, bookmarks_col
from auth import hash_password, verify_password, create_token, get_current_user
from rag_pipeline import process_document, answer_question, get_suggested_questions, analyze_document_type
from vector_store import delete_session as delete_vector_session

load_dotenv()

app = FastAPI(title="DocWhiz API")

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.on_event("startup")
async def startup_db_check():
    try:
        await users_col.find_one({})
        print("✅ MongoDB connected")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")

# ── HEALTH ──
@app.get("/")
def root():
    return {"message": "RAG Doc Q&A Bot Running"}

@app.get("/health")
def health():
    return {"status": "ok"}


# ── AUTH ──
@app.post("/auth/register")
async def register(req: RegisterRequest):
    existing = await users_col.find_one({"email": req.email})
    if existing:
        raise HTTPException(400, "Email already registered")

    user_id = str(uuid.uuid4())
    user = {
        "_id":       user_id,
        "name":      req.name,
        "email":     req.email,
        "password":  hash_password(req.password),
        "created_at": datetime.utcnow().isoformat()
    }
    await users_col.insert_one(user)
    token = create_token(user_id)
    return {"token": token, "user": {"id": user_id, "name": req.name, "email": req.email}}


@app.post("/auth/login")
async def login(req: LoginRequest):
    user = await users_col.find_one({"email": req.email})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(400, "Invalid credentials")

    token = create_token(user["_id"])
    return {"token": token, "user": {"id": user["_id"], "name": user["name"], "email": user["email"]}}


# ── DOCUMENTS ──
@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    allowed = ["pdf", "txt"]
    ext = file.filename.split('.')[-1].lower()
    if ext not in allowed:
        raise HTTPException(400, "Only PDF and TXT files are supported")

    session_id = str(uuid.uuid4())[:8]
    file_path  = f"{UPLOAD_DIR}/{session_id}_{file.filename}"

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    try:
        chunk_count = process_document(file_path, session_id)

        # Analyze document type
        doc_analysis = analyze_document_type(session_id)

        # Save session to MongoDB
        session = {
            "_id":        session_id,
            "user_id":    current_user["_id"],
            "filename":   file.filename,
            "chunks":     chunk_count,
            "doc_type":   doc_analysis.get("doc_type", "general"),
            "doc_title":  doc_analysis.get("title", file.filename),
            "doc_desc":   doc_analysis.get("description", ""),
            "doc_flow":   doc_analysis.get("flow", []),
            "doc_summary": doc_analysis.get("summary", ""),
            "created_at": datetime.utcnow().isoformat()
        }
        await sessions_col.insert_one(session)

        return {
            "session_id":  session_id,
            "filename":    file.filename,
            "chunks":      chunk_count,
            "doc_analysis": doc_analysis,
            "message":     f"Document processed into {chunk_count} chunks!"
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to process document: {str(e)}")


@app.get("/documents")
async def get_documents(current_user: dict = Depends(get_current_user)):
    sessions = await sessions_col.find(
        {"user_id": current_user["_id"]}
    ).sort("created_at", -1).to_list(50)
    return sessions


@app.delete("/documents/{session_id}")
async def delete_document(session_id: str, current_user: dict = Depends(get_current_user)):
    session = await sessions_col.find_one({"_id": session_id, "user_id": current_user["_id"]})
    if not session:
        raise HTTPException(404, "Document not found")

    await sessions_col.delete_one({"_id": session_id})
    await chats_col.delete_many({"session_id": session_id})
    await bookmarks_col.delete_many({"session_id": session_id})
    delete_vector_session(session_id)
    return {"message": "Document deleted"}


# ── CHAT ──
@app.post("/ask")
async def ask_question_route(
    req: QuestionRequest,
    current_user: dict = Depends(get_current_user)
):
    if not req.question.strip():
        raise HTTPException(400, "Question cannot be empty")
    try:
        result = answer_question(req.question, req.session_id)

        # Save to chat history
        chat = {
            "_id":        str(uuid.uuid4()),
            "user_id":    current_user["_id"],
            "session_id": req.session_id,
            "question":   req.question,
            "answer":     result["answer"],
            "sources":    result["sources"],
            "created_at": datetime.utcnow().isoformat()
        }
        await chats_col.insert_one(chat)

        return result
    except Exception as e:
        raise HTTPException(500, f"Failed to answer: {str(e)}")


@app.get("/history/{session_id}")
async def get_chat_history(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    chats = await chats_col.find(
        {"session_id": session_id, "user_id": current_user["_id"]}
    ).sort("created_at", 1).to_list(200)
    return chats


# ── BOOKMARKS ──
@app.post("/bookmarks")
async def add_bookmark(
    req: BookmarkRequest,
    current_user: dict = Depends(get_current_user)
):
    bookmark = {
        "_id":        str(uuid.uuid4()),
        "user_id":    current_user["_id"],
        "session_id": req.session_id,
        "question":   req.question,
        "answer":     req.answer,
        "sources":    req.sources,
        "created_at": datetime.utcnow().isoformat()
    }
    await bookmarks_col.insert_one(bookmark)
    return {"message": "Bookmarked!", "id": bookmark["_id"]}


@app.get("/bookmarks")
async def get_bookmarks(current_user: dict = Depends(get_current_user)):
    bookmarks = await bookmarks_col.find(
        {"user_id": current_user["_id"]}
    ).sort("created_at", -1).to_list(100)
    return bookmarks


@app.delete("/bookmarks/{bookmark_id}")
async def delete_bookmark(bookmark_id: str, current_user: dict = Depends(get_current_user)):
    await bookmarks_col.delete_one({"_id": bookmark_id, "user_id": current_user["_id"]})
    return {"message": "Bookmark removed"}


# ── AI FEATURES ──
@app.post("/suggest-questions")
async def suggest_questions_route(
    req: SuggestRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        questions = get_suggested_questions(req.session_id)
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(500, f"Failed to generate questions: {str(e)}")