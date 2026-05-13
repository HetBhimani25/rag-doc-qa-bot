# RAG-Based Document Q&A Bot

An AI-powered document intelligence system where users can upload PDF or
text documents and ask natural language questions about their content using
a Retrieval-Augmented Generation (RAG) pipeline.

## 🚀 Features

- Upload PDF/text documents and query them in natural language
- RAG pipeline: document chunking → embedding → vector storage → retrieval
- Optimized prompt templates for accurate, hallucination-reduced answers
- Multi-document sessions with isolated vector namespaces per user
- FastAPI REST backend consumed by a React.js chat-style frontend

## 🛠️ Tech Stack

**Frontend:** React.js  
**Backend:** Python, FastAPI  
**AI / LLM:** OpenAI API, LangChain, Prompt Engineering  
**Vector DB:** ChromaDB  
**Document Processing:** PyPDF2, LangChain Text Splitters  

## 📁 Project Structure

rag-doc-qa-bot/
├── backend/                  # Python FastAPI backend
│   ├── main.py               # FastAPI app & routes
│   ├── rag_pipeline.py       # LangChain RAG logic
│   ├── vector_store.py       # ChromaDB integration
│   ├── prompt_templates.py   # Prompt engineering
│   └── requirements.txt
├── frontend/                 # React.js frontend
│   ├── src/
│   │   ├── components/
│   │   └── pages/
└── README.md

## ⚙️ Setup & Installation

### Prerequisites
- Python >= 3.10
- Node.js >= 18.x
- OpenAI API Key

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Add your OPENAI_API_KEY in .env
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## 🔑 Environment Variables

```env
OPENAI_API_KEY=your_openai_api_key
CHROMA_PERSIST_DIR=./chroma_db
```

## 🗺️ Roadmap

- [x] Project setup & folder structure
- [ ] FastAPI server setup
- [ ] PDF ingestion & chunking
- [ ] ChromaDB vector store integration
- [ ] LangChain RAG pipeline
- [ ] Prompt template optimization
- [ ] React.js chat UI
- [ ] Multi-document session support

## 👤 Author

**Het Bhimani**  
[LinkedIn](https://linkedin.com/in/hetbhimani) • [GitHub](https://github.com/HetBhimani25)
