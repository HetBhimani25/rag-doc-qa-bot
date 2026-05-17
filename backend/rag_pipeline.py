import os
import uuid
import tempfile
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_groq import ChatGroq
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

# Initialize Groq LLM
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama-3.3-70b-versatile",
    temperature=0.2,
    max_tokens=1024
)

# Lazy load embeddings — only loads when first needed
_embeddings = None

def get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return _embeddings

# Text splitter
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)

CHROMA_DIR = os.getenv("CHROMA_PERSIST_DIR", os.path.join(tempfile.gettempdir(), "chroma_db"))

RAG_PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template="""You are an intelligent document assistant. Use ONLY the context below to answer the question.
If the answer is not in the context, say "I couldn't find that information in the uploaded document."
Be concise, accurate, and helpful.

Context:
{context}

Question: {question}

Answer:"""
)

def process_document(file_path: str, session_id: str) -> int:
    ext = file_path.split('.')[-1].lower()
    if ext == 'pdf':
        loader = PyPDFLoader(file_path)
    else:
        loader = TextLoader(file_path, encoding='utf-8')

    documents = loader.load()
    chunks    = splitter.split_documents(documents)

    Chroma.from_documents(
        documents=chunks,
        embedding=get_embeddings(),        # ← changed
        collection_name=f"session_{session_id}",
        persist_directory=CHROMA_DIR
    )
    return len(chunks)

def answer_question(question: str, session_id: str) -> dict:
    vectorstore = Chroma(
        collection_name=f"session_{session_id}",
        embedding_function=get_embeddings(),   # ← changed
        persist_directory=CHROMA_DIR
    )
    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 4}
    )

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | RAG_PROMPT
        | llm
        | StrOutputParser()
    )

    answer = chain.invoke(question)

    source_docs = retriever.invoke(question)
    sources = list(set([
        f"Page {doc.metadata.get('page', 0) + 1}"
        for doc in source_docs
        if "page" in doc.metadata
    ]))

    return {"answer": answer, "sources": sources}

def get_suggested_questions(session_id: str) -> list:
    vectorstore = Chroma(
        collection_name=f"session_{session_id}",
        embedding_function=get_embeddings(),   # ← changed
        persist_directory=CHROMA_DIR
    )

    docs = vectorstore.similarity_search("main topic overview summary", k=5)
    context = "\n\n".join(doc.page_content for doc in docs)

    completion = llm.invoke(
        f"""Based on the following document content, generate exactly 4 short, specific, 
and relevant questions a user might want to ask about this document.
Return ONLY a JSON array of 4 question strings. No explanation, no markdown, no extra text.

Document content:
{context}

Return format: ["Question 1?", "Question 2?", "Question 3?", "Question 4?"]"""
    )

    import json
    text = completion.content.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)

def analyze_document_type(session_id: str) -> dict:
    vectorstore = Chroma(
        collection_name=f"session_{session_id}",
        embedding_function=get_embeddings(),   # ← changed
        persist_directory=CHROMA_DIR
    )

    docs = vectorstore.similarity_search("main topic purpose goal overview", k=6)
    context = "\n\n".join(doc.page_content for doc in docs)

    completion = llm.invoke(
        f"""Analyze the following document content and determine its type and suggest a structured flow.

Document content:
{context}

Respond ONLY with valid JSON in this exact format:
{{
  "doc_type": "learning" | "product" | "general",
  "title": "<short document title>",
  "description": "<one sentence about what this document covers>",
  "flow": [
    {{"step": 1, "title": "<step title>", "description": "<what to focus on>"}},
    {{"step": 2, "title": "<step title>", "description": "<what to focus on>"}},
    {{"step": 3, "title": "<step title>", "description": "<what to focus on>"}},
    {{"step": 4, "title": "<step title>", "description": "<what to focus on>"}}
  ],
  "summary": "<3-4 sentence document summary>"
}}

Rules:
- If doc_type is "learning": flow should be a learning path
- If doc_type is "product": flow should be implementation steps
- If doc_type is "general": flow should be reading flow"""
    )

    import json
    text = completion.content.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)