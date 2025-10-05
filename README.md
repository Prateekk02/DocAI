# QuickDoc AI

RAG-powered PDF Q&A system.

## Setup
1. Backend: `cd backend && pip install -r requirements.txt`
2. Add OPENAI_API_KEY to environment
3. Run: `uvicorn main:app --reload`
4. Frontend: `cd frontend && npm install && npm run dev`

## Features
- PDF upload & indexing
- LangGraph RAG pipeline
- Real-time Q&A
- Source citations