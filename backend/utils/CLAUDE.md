# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

**Lex.ai** is a Legal RAG (Retrieval-Augmented Generation) platform for Indian Supreme Court judgments.

### Core Pipeline
```
PDFs (law/pdfs) → ETL (pipeline/*.py) → ChromaDB (chroma_db/)
                             ↓
                        API (api.py) + React (webpage/)
```

### Tech Stack
- **Backend**: FastAPI, ChromaDB, Google Gemini 2.5 Flash
- **Embeddings**: Ollama (nomic-embed-text on localhost:11434)
- **Frontend**: React + TypeScript + Vite
- **PDF Processing**: PyMuPDF (fitz), pandas

### Data Flow
1. **ETL Pipeline**: Extracts judgments from PDFs → outputs JSON + CSV index → builds Obsidian vault → indexes to ChromaDB
2. **Query Flow**: User query → Ollama embeddings → ChromaDB semantic search (top-10) → Gemini analysis → streaming NDJSON response

## Running the Application

### Prerequisites
- **Ollama** running: `ollama serve` (must be running before API)
- **Gemini API key** for the LLM

### Services (run in separate terminals)
```bash
# 1. FastAPI Backend
python -m uvicorn api:app --port 8000

# 2. React Frontend
cd webpage
npm run dev
```

Frontend at `localhost:5173`

## Key Files

| File | Purpose |
|------|---------|
| `api.py` | FastAPI backend with `/api/query` (RAG endpoint) and `/api/health` |
| `webpage/src/App.tsx` | React app with full RAG integration (filters, streaming, case cards) |
| `pipeline/extract_judis_hybrid.py` | Step 1: Extract PDF judgments |
| `pipeline/ingest_to_chroma.py` | Step 5: Index judgments to ChromaDB |
| `Supreme_Court_Vault/` | Obsidian markdown vault of all cases |
| `chroma_db/` | Vector database (47,400 judgments indexed) |

## Configuration Constants (hardcoded paths)
- `CHROMA_DIR = r"d:\laww\chroma_db"`
- `COLLECTION_NAME = "supreme_court_judgments"`
- PDF source: `d:\laww\law\pdfs`
- JSON output: `d:\laww\extracted_json`
- Master index: `d:\laww\supreme_court_master_index.csv`
