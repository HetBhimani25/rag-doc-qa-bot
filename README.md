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
| **Embeddings** | HuggingFace (all-MiniLM-L6-v2) *[Cloud API offloaded in prod for memory efficiency]* |
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

## 🚀 Run Locally

### Backend

1. Navigate to the backend folder:
```bash
cd backend
```

2. Create a virtual environment and activate it:
```bash
# Create venv
python -m venv venv

# Activate venv (Windows)
venv\Scripts\activate

# Activate venv (Linux/macOS)
# source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the `backend/` directory:
```text
GROQ_API_KEY=your_groq_api_key
MONGODB_URI=mongodb://localhost:27017/docwhiz
JWT_SECRET=your_jwt_secret_key
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=7
ALLOWED_ORIGINS=http://localhost:3000
HUGGINGFACEHUB_API_TOKEN=your_huggingface_access_token_optional
```

5. Run the FastAPI server:
```bash
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
