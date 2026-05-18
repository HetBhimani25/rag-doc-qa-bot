# 🧙‍♂️ DocWhiz — AI-Powered Document Q&A Bot

> Upload any PDF or TXT document and get instant AI-powered answers using RAG technology

🔗 **Live Demo:** https://docwhiz-frontend.vercel.app  
🔗 **Backend API:** https://docwhiz-backend.onrender.com

---

## ✨ Features

- 📄 Upload PDF/TXT documents and chat with them instantly
- 💬 AI-powered Q&A using full RAG pipeline
- 🔍 Keyword highlighting in answers
- ⭐ Bookmark important answers with navigate-back feature
- 🎓 Smart document type detection (Learning / Product / General)
- 🗺️ Auto-generates structured learning/implementation flow
- ✦ AI-suggested questions regenerated after every answer
- 💾 Persistent chat history per user per document
- 📁 Multi-document support with sidebar
- 🔐 JWT Authentication (Register/Login)
- 🗑️ Delete documents with cascade cleanup

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js, Context API, React Router |
| **Backend** | Python, FastAPI |
| **AI/LLM** | LangChain, Groq (llama-3.3-70b-versatile) |
| **Embeddings** | HuggingFace (all-MiniLM-L6-v2) |
| **Vector DB** | ChromaDB |
| **Database** | MongoDB Atlas (motor async) |
| **Auth** | JWT (python-jose + passlib) |
| **Deployment** | Vercel (Frontend) + Render (Backend) |

---

## 🔬 RAG Pipeline

PDF/TXT Upload
↓
Text Chunking (RecursiveCharacterTextSplitter)
chunk_size=1000, overlap=200
↓
Vector Embeddings (HuggingFace all-MiniLM-L6-v2)
↓
ChromaDB Storage (session-isolated collections)
↓
User Question → Similarity Search (k=4)
↓
Retrieved Chunks + Groq LLM (llama-3.3-70b)
↓
Answer + Source Pages + Keyword Highlights

---

## 🧠 AI Features

- **RAG Q&A** — Answers grounded only in uploaded document
- **Smart Doc Analyzer** — Detects Learning/Product/General type, generates structured flow
- **AI Suggested Questions** — Groq analyzes document and suggests 4 relevant questions, regenerated after each answer
- **Keyword Highlighter** — Highlights matched query keywords in answers

---

## 📁 Project Structure

rag-doc-qa-bot/
├── backend/
│   ├── main.py              # FastAPI routes (auth, documents, chat, bookmarks)
│   ├── rag_pipeline.py      # RAG logic, doc type analyzer, question suggester
│   ├── auth.py              # JWT authentication
│   ├── database.py          # MongoDB async connection
│   ├── models.py            # Pydantic request models
│   ├── vector_store.py      # ChromaDB session management
│   └── requirements.txt
└── frontend/
├── src/
│   ├── components/
│   │   ├── ChatBox.js       # Chat UI, keyword highlight, bookmarks
│   │   ├── DocSidebar.js    # Document list sidebar
│   │   ├── DocFlowPanel.js  # Smart learning/product flow display
│   │   ├── Navbar.js
│   │   └── UploadZone.js
│   ├── pages/
│   │   ├── Home.js
│   │   ├── Bookmarks.js
│   │   ├── Login.js
│   │   └── Register.js
│   ├── context/AuthContext.js
│   └── services/api.js
└── public/

---

## 🚀 Run Locally

### Backend
```bash

cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

Create .env file
GROQ_API_KEY=groq_api_key
MONGODB_URI=mongodb://localhost:27017/docwhiz
JWT_SECRET=your_secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=7
ALLOWED_ORIGINS=http://localhost:3000uvicorn main:app --reload --port 8000

uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm start
```

---


## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login user |
| POST | `/upload` | Upload & process document |
| GET | `/documents` | Get user's documents |
| DELETE | `/documents/{id}` | Delete document + cascade |
| POST | `/ask` | Ask question (RAG) |
| GET | `/history/{session_id}` | Get chat history |
| POST | `/bookmarks` | Add bookmark |
| GET | `/bookmarks` | Get all bookmarks |
| DELETE | `/bookmarks/{id}` | Delete bookmark |
| POST | `/suggest-questions` | AI-generated questions |

---

## 👨‍💻 Author

**Het Bhimani**  
[GitHub](https://github.com/HetBhimani25) · [LinkedIn](https://www.linkedin.com/in/hetbhimani)
