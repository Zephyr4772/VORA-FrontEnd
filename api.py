"""
VORA — FastAPI Backend
Serves the React frontend's RAG queries via:
  POST /api/query   → streaming NDJSON (analysis chunks + case metadata)
  GET  /api/health  → simple health check
"""

import os
import json
import io
import zipfile
import requests
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
DRIVE_MAP_FILE = r"d:\laww\drive_id_map.json"

# Load drive map into memory once
drive_id_map = {}
if os.path.exists(DRIVE_MAP_FILE):
    try:
        with open(DRIVE_MAP_FILE, 'r', encoding='utf-8') as f:
            drive_id_map = json.load(f)
    except Exception as e:
        print(f"Error loading drive map: {e}")

DEFAULT_SYSTEM_PROMPT = """
You are VORA — a senior Indian legal intelligence system with encyclopaedic knowledge of \
Indian constitutional law, statutory law, Supreme Court jurisprudence, High Court precedents, \
and legal doctrine spanning from 1950 to present day.

You have been trained on decades of legal reasoning. You think like a Supreme Court senior \
advocate with 30 years of practice: precise, opinionated, evidence-driven, and deeply aware \
of how the Indian judiciary actually behaves versus what the law says on paper.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE OPERATING RULES — READ BEFORE EVERY RESPONSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULE 1 — JUDGE THE QUERY FIRST
Before doing anything else, silently evaluate what the user actually wants. \
Not all queries require case law. Use the following decision framework:

  → If the query is CONVERSATIONAL (greetings, thanks, general chat):
    Respond naturally as a knowledgeable legal expert would in conversation. \
    Do NOT reference any retrieved cases. Do not force legal content into the reply.

  → If the query is a GENERAL LEGAL QUESTION (definitions, explanations, procedures, \
    doctrine, "what is X", "explain Y", "how does Z work"):
    Answer from your own deep legal knowledge. Do NOT reference the retrieved cases \
    unless they are genuinely illuminating. The user asked for an explanation, not a \
    case search result.

  → If the query is a CASE RESEARCH REQUEST (precedent hunting, judicial tendency \
    analysis, "how have courts ruled on X", "is there precedent for Y", \
    "cases involving Z", specific outcome analysis):
    This is your primary research mode. Use the retrieved cases as your primary \
    evidence base and analyse them deeply.

  → If the query is MIXED (needs both explanation AND case evidence):
    First explain the legal concept clearly, then layer in the case evidence. \
    Separate the explanation from the analysis clearly.

RULE 2 — ASSESS CASE RELEVANCE RUTHLESSLY
You will be given retrieved cases from a vector database. Vector search is not perfect. \
Some retrieved cases may be tangentially related or outright irrelevant to the user's \
actual question. You MUST evaluate each case before using it.

  → If a case is directly on point: cite it prominently with case number and outcome.
  → If a case is partially relevant: use it as supporting context, acknowledge the limitation.
  → If a retrieved case is IRRELEVANT to the query: IGNORE IT ENTIRELY. \
    Do not mention it. Do not pad your response with irrelevant citations to appear thorough. \
    It is far better to answer from your own knowledge than to cite misleading cases.
  → If NO retrieved cases are relevant: answer entirely from your legal expertise. \
    Never say "I cannot answer because no cases were found." That is a failure mode.

RULE 3 — DEPTH OF ANALYSIS
When performing case analysis, do not summarise. Do not list. Reason.

  1. PATTERN RECOGNITION: What does the distribution of outcomes tell you? \
     Is there a clear judicial tendency or is it split? Note if outcomes vary by bench \
     composition, year, or the specific legal question raised.

  2. REASONING ARCHAEOLOGY: Why did benches rule the way they did? \
     What arguments did they accept? What did they reject? What doctrine did they \
     apply or distinguish?

  3. CONSTITUTIONAL / STATUTORY ANCHORING: Ground your analysis in the relevant \
     provisions of the Constitution, IPC, CrPC, CPC, Evidence Act, or the applicable \
     statute. Name the specific sections and how they were interpreted.

  4. PRACTICAL IMPLICATION: What does this mean for a practitioner TODAY? \
     What argument does this body of precedent support? What risk does it pose?

  5. COUNTERARGUMENT: Identify the strongest opposing argument. \
     A real senior advocate prepares both sides.

RULE 4 — CITE PRECISELY
When referencing cases, always include: Case Number + Year + Outcome. \
Never say "a case ruled that..." without identifying which case. \
If you are citing from your own training knowledge (not the retrieved cases), \
say so — e.g., "From established precedent, in Maneka Gandhi v. Union of India (1978)..."

RULE 5 — TONE AND DIRECTNESS
  → Be direct. Never hedge excessively or refuse to take a position.
  → If the case law shows a clear tendency, say it plainly: \
    "The Supreme Court has consistently..." or "This bench tends to..."
  → If the law is genuinely unsettled, say that too — but explain WHY it is unsettled \
    and what factors determine the outcome.
  → Never say "based on the provided context I cannot determine..." \
    You are a legal expert, not a document retrieval system. \
    Use the cases as evidence, fill gaps with expertise.
  → Do not pad responses. Do not repeat the user's question back to them. \
    Do not add unnecessary caveats like "please consult a lawyer." \
    The user IS a legal professional or researcher — treat them as one.

RULE 6 — STRUCTURE
For simple/conversational queries: respond in natural prose, no headers needed.
For analytical queries: use clear structure — but make it feel like a senior brief, \
not a school essay. Use bold sparingly for key legal terms or case citations.
For deep analysis: use sections if the answer genuinely requires it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWLEDGE BOUNDARIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your primary jurisdiction is India. You have deep knowledge of:
  - The Constitution of India (all Articles, Schedules, Amendments)
  - IPC / BNS, CrPC / BNSS, CPC, Evidence Act / BSA
  - The full body of Supreme Court jurisprudence
  - Major High Court precedents
  - Administrative and regulatory law
  - Arbitration (Arbitration & Conciliation Act, 1996)
  - Commercial law, company law, IPR, taxation law

You also have working knowledge of international law, comparative constitutional law, \
and UNCITRAL / WTO frameworks where they intersect with Indian law.

If a question falls outside Indian law, say so — but still provide what you know \
about the relevant international or foreign jurisdiction.
"""

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="VORA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
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
    api_key: str
    provider: str = "gemini"                        # 'gemini' or 'ollama'
    model_name: str = "gemini-2.5-flash"            # Model name to use
    n_results: int = 10
    search_cases: bool = True                       # If False, skip ChromaDB
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

class ZipRequest(BaseModel):
    urls: List[str]

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

        # Determine Download URL using drive ID map
        drive_link = None
        target_prefix = f"{diary_no}___"
        
        # If diary_no is invalid like -0, fallback to case_no
        if diary_no == "-0" or not diary_no:
            # try to use case_no if possible, formatting might be tricky so we do a substring search
            target_prefix = str(case_no).replace("/", "-") + "___" if case_no else None

        if target_prefix:
            for fname, d_id in drive_id_map.items():
                if fname.startswith(target_prefix) or (case_no and str(case_no).replace("/", "-") in fname):
                    drive_link = f"https://drive.google.com/uc?export=download&id={d_id}"
                    break

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
            "download_url": drive_link
        })

    llm_prompt = (
        f"USER QUERY: {query}\n\n"
        f"━━━ RETRIEVED CASE EVIDENCE (assess relevance before using) ━━━\n"
        f"The following {total} cases were retrieved from the database via semantic search.\n"
        f"They MAY or MAY NOT be relevant to the user's actual question.\n"
        f"Apply RULE 2: evaluate each case — use it, partially use it, or discard it.\n\n"
        f"{pattern}"
        f"INDIVIDUAL CASES:\n"
        + "\n".join(context_blocks)
        + "\n\n━━━ END OF RETRIEVED EVIDENCE ━━━\n\n"
        "Now respond to the user's query by applying all operating rules. "
        "If none of the retrieved cases are relevant, ignore them and answer from your legal expertise. "
        "If the query is conversational or a general question, respond accordingly without forcing case citations."
    )
    return llm_prompt, case_cards

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/models")
def get_models():
    """Fetch available Ollama models from the host machine."""
    try:
        import requests
        r = requests.get("http://localhost:11434/api/tags", timeout=2)
        if r.status_code == 200:
            return r.json()
        return {"models": []}
    except:
        return {"models": []}

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

    if not req.api_key and req.provider == "gemini":
        raise HTTPException(status_code=400, detail="api_key is required for Gemini")

    is_ollama = (req.provider == "ollama" or req.api_key == "ollama-local")

    # Configure Gemini only when needed
    if not is_ollama:
        genai.configure(api_key=req.api_key)

    # Skip RAG if search_cases is False
    if not req.search_cases:
        results = None
        case_cards = []
        llm_prompt = f"USER QUERY: {req.query}\n\nPlease provide expert legal analysis based on your general knowledge. Do not reference any specific retrieved cases as none were requested."
    else:
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

    # ── Ollama path ───────────────────────────────────────────────────────────────
    if is_ollama:
        async def ollama_stream():
            yield json.dumps({"type": "cases", "data": case_cards}) + "\n"
            try:
                import requests
                payload = {
                    "model": req.model_name if req.provider == "ollama" else "llama3",
                    "system": DEFAULT_SYSTEM_PROMPT,
                    "prompt": llm_prompt,
                    "stream": True
                }
                with requests.post("http://localhost:11434/api/generate", json=payload, stream=True) as r:
                    for line in r.iter_lines():
                        if line:
                            data = json.loads(line.decode("utf-8"))
                            if not data.get("done"):
                                chunk_payload = {"type": "chunk", "text": data.get("response", "")}
                                yield json.dumps(chunk_payload) + "\n"
                yield json.dumps({"type": "done"}) + "\n"
            except Exception as e:
                err_payload = {"type": "error", "message": f"Ollama Error: {e}"}
                yield json.dumps(err_payload) + "\n"
        return StreamingResponse(ollama_stream(), media_type="application/x-ndjson")

    # ── Gemini path with Ollama Fallback ──────────────────────────────────────
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
                    chunk_payload = {"type": "chunk", "text": chunk.text}
                    yield json.dumps(chunk_payload) + "\n"

            yield json.dumps({"type": "done"}) + "\n"
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "quota" in err_str.lower():
                notice_payload = {"type": "error", "message": "\n\n**Notice:** Gemini quota reached. Falling back to local Ollama (llama3)...\n\n"}
                yield json.dumps(notice_payload) + "\n"
                try:
                    import requests
                    req_payload = {
                        "model": "llama3",
                        "system": DEFAULT_SYSTEM_PROMPT,
                        "prompt": llm_prompt,
                        "stream": True
                    }
                    with requests.post("http://localhost:11434/api/generate", json=req_payload, stream=True) as r:
                        for line in r.iter_lines():
                            if line:
                                data = json.loads(line.decode("utf-8"))
                                if not data.get("done"):
                                    chunk_payload = {"type": "chunk", "text": data.get("response", "")}
                                    yield json.dumps(chunk_payload) + "\n"
                    yield json.dumps({"type": "done"}) + "\n"
                except Exception as ollama_err:
                    err_payload = {"type": "error", "message": f"Fallback to Ollama failed: {ollama_err}"}
                    yield json.dumps(err_payload) + "\n"
            else:
                err_payload = {"type": "error", "message": err_str}
                yield json.dumps(err_payload) + "\n"

    return StreamingResponse(stream_response(), media_type="application/x-ndjson")

@app.post("/api/download_zip")
def download_zip_endpoint(req: ZipRequest):
    """
    Downloads the provided Google Drive URLs on the backend, 
    compresses them into an in-memory ZIP file, and streams it back to the client.
    """
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED, False) as zip_file:
        for i, url in enumerate(req.urls):
            try:
                resp = requests.get(url, timeout=15)
                if resp.status_code == 200:
                    filename = f"case_document_{i+1}.pdf"
                    if "Content-Disposition" in resp.headers:
                        import re
                        m = re.search('filename="(.*)"', resp.headers["Content-Disposition"])
                        if m:
                            filename = m.group(1)
                    zip_file.writestr(filename, resp.content)
            except Exception as e:
                print(f"Error downloading URL {url}: {e}")

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=selected_cases.zip"}
    )
