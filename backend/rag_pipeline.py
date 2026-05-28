import os
import uuid
import tempfile
import httpx
from typing import List
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_groq import ChatGroq
from langchain_chroma import Chroma
from langchain_core.embeddings import Embeddings
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

# Custom HuggingFace serverless API Embeddings class to bypass LangChain/HuggingFaceHub client bugs
class CustomHFEmbeddings(Embeddings):
    def __init__(self, model: str, api_token: str):
        self.model = model
        self.token = api_token
        self.api_url = f"https://router.huggingface.co/hf-inference/models/{self.model}/pipeline/feature-extraction"
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def _embed(self, texts: List[str]) -> List[List[float]]:
        import time
        max_retries = 3
        last_err = None
        for attempt in range(max_retries):
            try:
                response = httpx.post(
                    self.api_url,
                    headers=self.headers,
                    json={"inputs": texts, "options": {"wait_for_model": True}},
                    timeout=60.0
                )
                if response.status_code != 200:
                    raise ValueError(f"HuggingFace API error {response.status_code}: {response.text}")
                
                res = response.json()
                if not isinstance(res, list):
                    raise ValueError(f"Unexpected response format from HuggingFace API: {res}")
                return res
            except (httpx.ConnectError, httpx.ConnectTimeout, httpx.RequestError) as e:
                last_err = e
                print(f"Network connection/DNS error on attempt {attempt + 1}: {e}. Retrying in 2 seconds...")
                time.sleep(2)
        raise ValueError(f"Failed to connect to HuggingFace API after {max_retries} attempts. Details: {last_err}")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        # Batch to prevent payload size limits
        batch_size = 16
        embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            embeddings.extend(self._embed(batch))
        return embeddings

    def embed_query(self, text: str) -> List[float]:
        return self._embed([text])[0]

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
        hf_token = os.getenv("HUGGINGFACEHUB_API_TOKEN") or os.getenv("HF_TOKEN")
        if hf_token:
            print("Using cloud CustomHFEmbeddings (memory efficient)")
            _embeddings = CustomHFEmbeddings(
                model="sentence-transformers/all-MiniLM-L6-v2",
                api_token=hf_token
            )
        else:
            print("WARNING: HUGGINGFACEHUB_API_TOKEN / HF_TOKEN not found in environment variables.")
            print("Falling back to local HuggingFaceEmbeddings (which loads PyTorch and consumes ~400MB+ RAM).")
            from langchain_huggingface import HuggingFaceEmbeddings
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

def get_suggested_questions(session_id: str, previous_questions: list = None) -> list:
    vectorstore = Chroma(
        collection_name=f"session_{session_id}",
        embedding_function=get_embeddings(),   # ← changed
        persist_directory=CHROMA_DIR
    )

    docs = vectorstore.similarity_search("main topic overview summary", k=5)
    context = "\n\n".join(doc.page_content for doc in docs)

    exclusion_rule = ""
    if previous_questions:
        exclusion_rule = "\nDO NOT suggest any of these previously asked questions or anything extremely similar:\n"
        for q in previous_questions:
            exclusion_rule += f"- {q}\n"

    completion = llm.invoke(
        f"""Based on the following document content, generate exactly 4 short, specific questions.

CRITICAL RULES:
1. The EXACT ANSWER to every question you suggest MUST be explicitly written within the provided Document content.
2. Do not suggest hypothetical, external, or generic questions. Ensure the document directly answers the question.
3. Return ONLY a JSON array of 4 question strings. No explanation, no markdown, no extra text.
{exclusion_rule}
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