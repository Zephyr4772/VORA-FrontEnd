"""
Lex.ai — FastAPI Backend
Serves the React frontend's RAG queries via:
  POST /api/query   → streaming NDJSON (analysis chunks + case metadata)
  GET  /api/health  → simple health check
"""

import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List

import chromadb
from chromadb.utils import embedding_functions
import google.generativeai as genai

# ── Constants ─────────────────────────────────────────────────────────────────
CHROMA_DIR = r"d:\laww\chroma_db"
COLLECTION_NAME = "supreme_court_judgments"

DEFAULT_SYSTEM_PROMPT = """You are a senior Indian legal analyst with deep expertise in \
Supreme Court jurisprudence. You have studied every major judgment, doctrine, \
and judicial philosophy since 1950.

You will be given a set of relevant case excerpts as evidence. \
Your job is NOT to summarise these cases. Your job is to REASON across them \
like a legal expert would.

When answering:
1. Identify the pattern across the provided cases — outcomes, reasoning styles, \
   which arguments the bench accepted or rejected
2. Combine that pattern with your own knowledge of Indian law, judicial history, \
   and constitutional doctrine
3. Give a direct, opinionated analytical answer the way a senior advocate would \
   brief a junior before a hearing
4. Always cite which specific cases support your analysis
5. If the cases show a clear tendency, SAY SO directly — \
   "This bench consistently..." or "The data suggests..."
6. If you need more context, say what additional information would change your analysis

Never say "based on the provided context there is no information."
If the cases don't directly answer the question, use them as partial evidence \
and fill the gaps with your legal expertise.
You are an analyst, not a search engine."""

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Lex.ai API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── DB (lazy, cached per process) ─────────────────────────────────────────────
_collection = None

def get_collection():
    global _collection
    if _collection is not None:
        return _collection
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    ollama_ef = embedding_functions.OllamaEmbeddingFunction(
        url="http://localhost:11434/api/embeddings",
        model_name="nomic-embed-text",
    )
    _collection = client.get_collection(name=COLLECTION_NAME, embedding_function=ollama_ef)
    return _collection

# ── Request model ─────────────────────────────────────────────────────────────
class QueryRequest(BaseModel):
    query: str
    api_key: str                                    # 'ollama-local' skips Gemini
    n_results: int = 10
    # Multi-select filters (new)
    outcomes: Optional[List[str]] = None            # ["allowed", "dismissed", ...]
    year_from: Optional[int] = None                 # e.g. 1990
    year_to: Optional[int] = None                   # e.g. 2024
    sections: Optional[List[str]] = None            # ["302", "420", ...]
    # Single-value filters (kept for compat)
    outcome: Optional[str] = None                   # legacy single-outcome
    bench_includes: Optional[str] = None
    author_judge: Optional[str] = None
    section: Optional[str] = None                   # legacy single section
    articles: Optional[List[str]] = None

# ── Where-clause builder ───────────────────────────────────────────────────────
def build_where_clause(req: QueryRequest):
    conditions = []

    # Bench filter
    if req.bench_includes and req.bench_includes.strip():
        conditions.append({"bench": {"$contains": req.bench_includes.strip().upper()}})

    # Author filter
    if req.author_judge and req.author_judge.strip():
        conditions.append({"judgement_by": {"$contains": req.author_judge.strip().upper()}})

    # Multi-outcome filter (new) — OR across selected outcomes
    effective_outcomes = req.outcomes if req.outcomes else (
        [req.outcome] if req.outcome and req.outcome != "All" else []
    )
    if effective_outcomes:
        if len(effective_outcomes) == 1:
            conditions.append({"outcome": {"$eq": effective_outcomes[0]}})
        else:
            conditions.append({"$or": [{"outcome": {"$eq": o}} for o in effective_outcomes]})

    # Sections (multi, new) — OR logic
    effective_sections = req.sections if req.sections else (
        [req.section] if req.section and req.section.strip() else []
    )
    if effective_sections:
        sec_conds = [{"sections_cited": {"$contains": s.strip()}} for s in effective_sections]
        if len(sec_conds) == 1:
            conditions.append(sec_conds[0])
        else:
            conditions.append({"$or": sec_conds})

    # Articles
    if req.articles:
        art_conds = [{"articles_cited": {"$contains": a}} for a in req.articles]
        if len(art_conds) == 1:
            conditions.append(art_conds[0])
        else:
            conditions.append({"$or": art_conds})

    if not conditions:
        return None
    if len(conditions) == 1:
        return conditions[0]
    return {"$and": conditions}


def year_in_range(date_str: str, year_from: Optional[int], year_to: Optional[int]) -> bool:
    """Post-filter by year since ChromaDB can't do numeric range on string dates."""
    if year_from is None and year_to is None:
        return True
    import re
    m = re.search(r'\b(19|20)\d{2}\b', str(date_str))
    if not m:
        return True  # keep unknown-date cases
    y = int(m.group(0))
    if year_from and y < year_from:
        return False
    if year_to and y > year_to:
        return False
    return True


def build_llm_prompt(query: str, results: dict) -> tuple[str, list]:
    docs   = results["documents"][0]
    metas  = results["metadatas"][0]
    total  = len(docs)

    # Outcome distribution
    outcome_counts: dict = {}
    for m in metas:
        v = m.get("outcome", "unknown")
        outcome_counts[v] = outcome_counts.get(v, 0) + 1

    pattern = f"RETRIEVED CASE PATTERN ANALYSIS:\nTotal cases retrieved: {total}\n"
    for v, c in sorted(outcome_counts.items(), key=lambda x: -x[1]):
        pattern += f"  - {v}: {c}/{total} ({round(c/total*100)}%)\n"

    benches = list(set(str(m.get("bench", "")) for m in metas))
    pattern += f"Benches involved: {', '.join(benches[:3])}\n\n"

    case_cards = []
    context_blocks = []
    for i, (doc, meta) in enumerate(zip(docs, metas)):
        case_no   = str(meta.get("case_no", "Unknown"))
        bench     = str(meta.get("bench", "Unknown"))
        date_val  = str(meta.get("date", "Unknown"))
        outcome   = str(meta.get("outcome", "Unknown"))
        diary_no  = str(meta.get("diary_no", "Unknown"))
        sections  = str(meta.get("sections_cited", "N/A"))[:120]

        context_blocks.append(
            f"--- Case {i+1} ---\n"
            f"Case No: {case_no}\nDate: {date_val}\nBench: {bench}\n"
            f"Outcome: {outcome.upper()}\nSections Cited: {sections}\n"
            f"Excerpt: {doc[:800]}\n---"
        )
        case_cards.append({
            "id": i + 1,
            "case_no": case_no,
            "bench": bench,
            "date": date_val,
            "outcome": outcome,
            "diary_no": diary_no,
            "excerpt": doc[:500],
        })

    llm_prompt = (
        f"USER QUERY: {query}\n\n"
        f"{pattern}"
        f"INDIVIDUAL CASE CONTEXT:\n"
        + "\n".join(context_blocks)
        + "\n\nBased on the pattern analysis above and the individual cases, "
          "provide your expert legal analysis. The outcome distribution is your "
          "primary evidence for tendency analysis."
    )
    return llm_prompt, case_cards

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/query")
async def query_endpoint(req: QueryRequest):
    """
    Returns a Server-Sent Events / NDJSON stream.
    Each line is a JSON object with one of:
      {"type": "cases",   "data": [...]}          ← sent first, immediately
      {"type": "chunk",   "text": "..."}           ← streamed Gemini analysis
      {"type": "done"}                             ← signals end
      {"type": "error",   "message": "..."}

    If api_key == 'ollama-local', only case retrieval is done;
    Ollama analysis runs entirely on the frontend.
    """
    try:
        collection = get_collection()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Vector DB unavailable: {e}")

    if not req.api_key:
        raise HTTPException(status_code=400, detail="api_key is required")

    is_ollama = req.api_key == "ollama-local"

    # Configure Gemini only when needed
    if not is_ollama:
        genai.configure(api_key=req.api_key)

    where_clause = build_where_clause(req)

    try:
        fetch_n = req.n_results * 3 if (req.year_from or req.year_to) else req.n_results
        if where_clause:
            results = collection.query(
                query_texts=[req.query],
                n_results=min(fetch_n, 100),
                where=where_clause,
            )
        else:
            results = collection.query(
                query_texts=[req.query],
                n_results=min(fetch_n, 100),
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrieval error: {e}")

    if not results or not results.get("documents") or not results["documents"][0]:
        async def empty_stream():
            yield json.dumps({"type": "error", "message": "No matching cases found in the vault."}) + "\n"
            yield json.dumps({"type": "done"}) + "\n"
        return StreamingResponse(empty_stream(), media_type="application/x-ndjson")

    # Post-filter by year range (ChromaDB can't do this natively on string dates)
    if req.year_from or req.year_to:
        docs  = results["documents"][0]
        metas = results["metadatas"][0]
        filtered = [(d, m) for d, m in zip(docs, metas)
                    if year_in_range(str(m.get("date", "")), req.year_from, req.year_to)]
        filtered = filtered[:req.n_results]
        if not filtered:
            async def empty_year_stream():
                yield json.dumps({"type": "error", "message": "No cases found in the selected year range."}) + "\n"
                yield json.dumps({"type": "done"}) + "\n"
            return StreamingResponse(empty_year_stream(), media_type="application/x-ndjson")
        results = {
            "documents": [[d for d, _ in filtered]],
            "metadatas": [[m for _, m in filtered]],
        }

    llm_prompt, case_cards = build_llm_prompt(req.query, results)

    # ── Ollama path: just return cases, frontend does LLM ─────────────────────
    if is_ollama:
        async def ollama_stream():
            yield json.dumps({"type": "cases", "data": case_cards}) + "\n"
            yield json.dumps({"type": "done"}) + "\n"
        return StreamingResponse(ollama_stream(), media_type="application/x-ndjson")

    # ── Gemini path: stream analysis ──────────────────────────────────────────
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=DEFAULT_SYSTEM_PROMPT,
        generation_config=genai.types.GenerationConfig(temperature=0.2),
    )

    async def stream_response():
        # 1. Send case cards immediately
        yield json.dumps({"type": "cases", "data": case_cards}) + "\n"

        # 2. Stream Gemini response
        try:
            response = model.generate_content(llm_prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield json.dumps({"type": "chunk", "text": chunk.text}) + "\n"
        except Exception as e:
            yield json.dumps({"type": "error", "message": str(e)}) + "\n"

        yield json.dumps({"type": "done"}) + "\n"

    return StreamingResponse(stream_response(), media_type="application/x-ndjson")
