# Lex.ai — Supreme Court RAG Intelligence Platform

## Folder Structure

```
d:\laww\
│
├── api.py                  ← START HERE — FastAPI backend (RAG engine)
│                             Run: python -m uvicorn api:app --port 8000
│
├── frontend/               ← React + Vite web app (your custom UI design)
│   └── src/App.tsx           Run: npm run dev  (serves at localhost:5173)
│
├── chroma_db/              ← Vector database (41,876 SC judgments indexed)
│                             DO NOT DELETE or MOVE — api.py reads from here
│
├── Supreme_Court_Vault/    ← Obsidian markdown vault (case notes)
│
├── pipeline/               ← ETL scripts (already run — data is in chroma_db)
│   ├── extract_judis_hybrid.py      Step 1: Extract JUDIS judgments
│   ├── extract_sci_hybrid.py        Step 2: Extract SCI judgments
│   ├── consolidate_master_index.py  Step 3: Merge into master CSV
│   ├── build_obsidian_vault.py      Step 4: Build Obsidian vault
│   └── ingest_to_chroma.py          Step 5: Index into ChromaDB
│
├── data/                   ← Raw data files
│   ├── master_judis_enriched.csv
│   ├── master_sci_enriched.csv
│   ├── supreme_court_master_index.csv
│   ├── skipped_sci_cases.txt
│   └── extracted_json/              Raw judgment JSON files
│
├── utils/                  ← Debugging & test scripts  
│   ├── probe_the_brain.py           Query ChromaDB directly
│   └── test_chain.py                End-to-end chain test
│
└── archive/                ← Old files kept for reference
    └── app.py                       Original Streamlit prototype
```

## How to Run

### Start all 3 services (in separate terminals):

**1. Ollama** (embedding model — must be first)
```
ollama serve
```

**2. FastAPI Backend** (RAG engine)
```
python -m uvicorn api:app --port 8000
```

**3. React Frontend** (your custom UI)
```
cd frontend
npm run dev
```

Then open: **http://localhost:5173**

## Architecture

```
Browser (localhost:5173)
    │  POST /api/query {query, api_key}
    ▼
FastAPI (localhost:8000)  ← api.py
    │  Embeds query → Ollama nomic-embed-text (localhost:11434)
    ▼
ChromaDB (chroma_db/)
    │  Returns top-10 semantically similar case chunks
    ▼
Gemini 2.5-flash
    │  Streams legal analysis as expert analyst
    ▼
Browser
    ├── Case cards shown immediately (case_no, bench, date, outcome)
    └── Analysis text streams token by token
```

## API Key

Enter your **Gemini API key** by clicking the 🔑 icon in the top-right of the UI.
It is saved to localStorage and never sent anywhere except Gemini's API.
