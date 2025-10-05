from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFLoader
from langgraph.graph import StateGraph, END
from typing import TypedDict, List
import os
import tempfile
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global vector store 
vector_store = None

# RAG state
class RAGState(TypedDict):
    question: str
    document: List[str]
    answer: str
    
# Nodes

# Doc retrieval node
def retrieve_doc(state: RAGState) -> RAGState:
    """Retrieve relevant document"""
    global vector_store
    if vector_store is None:
        state['document'] = []
        return state
    
    docs = vector_store.similarity_search(state['question'], k=3)
    state['document'] = [doc.page_content for doc in docs] # type: ignore #ignore-type
    return state

# Answer generation node

def generate_answer(state:RAGState) -> RAGState:
    """Generate answer using LLM"""
    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
    
    context = "\n\n".join(state['document'])
    prompt = f"""Based on the following context , answer the question 
    If the answser is not in the context, say "I don't have enough information."
    Context:{context} \n
    Question: {state["question"]} \n\n
    Answer:   
    """
    response = llm.invoke(prompt)
    if isinstance(response.content, str):
        state['answer'] = response.content
    else:
        state['answer'] = str(response.content)
    return state

# Graph
workflow = StateGraph(RAGState)
workflow.add_node("retrieve", retrieve_doc)
workflow.add_node("generate", generate_answer)
workflow.add_edge("retrieve", "generate")
workflow.add_edge("generate", END)
workflow.set_entry_point("retrieve")

rag_chain = workflow.compile()


# API Endpoints

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload and index PDF"""
    global vector_store
    
    # Save temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp:
        content = await file.read()
        temp.write(content)
        temp_path = temp.name
    
    # Load and split PDF
    loader = PyPDFLoader(temp_path)
    documents = loader.load()
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size = 1000,
        chunk_overlap = 200
    )
    splits = text_splitter.split_documents(documents)
    
    # Creating vector embeddings    
    embeddings = OpenAIEmbeddings()
    
    if vector_store is None:
        vector_store = FAISS.from_documents(splits, embeddings)
    else:
        vector_store.add_documents(splits)
    
    os.unlink(temp_path)
    
    return {
        "message": "PDF indexed successfully",
        "chunks": len(splits)
    }
    
@app.post("/ask")
async def ask_question(data: dict):
    """Ask question using RAG"""
    question = data.get("question")
    
    if not question: 
        return {"error": "Question is required"}
    
    if vector_store is None:
        return {"error": "No documents uploaded"}
    
    initial_state: RAGState = {
        "question": question,
        "answer": "",
        "document": []        
    } 
    
    # Run LangGraph
    result = rag_chain.invoke(initial_state)
    
    return {
        "answer": result['answer'],
        "sources": result["document"][:2]
    }

@app.get("/health")
async def health():
    return {"status": "ok", "has_documents": vector_store is not None}
    
    
    