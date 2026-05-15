from langchain.prompts import PromptTemplate

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