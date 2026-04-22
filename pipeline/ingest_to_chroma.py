import os
import json
import time
import pandas as pd
from tqdm import tqdm
import chromadb
from chromadb.utils import embedding_functions
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Configuration
INDEX_CSV = r"d:\laww\supreme_court_master_index.csv"
JSON_DIR = r"d:\laww\extracted_json"
CHROMA_DIR = r"d:\laww\chroma_db"
COLLECTION_NAME = "supreme_court_judgments"
BATCH_SIZE = 50

def clean_metadata(value):
    """Utility to ensure metadata is ChromaDB compatible (no NaNs/mismatched types)."""
    if pd.isna(value) or value is None:
        return "Not Available"
    return str(value).strip()

def main():
    print("Setting up Vector DB Ingestion Pipeline...")
    
    if not os.path.exists(CHROMA_DIR):
        os.makedirs(CHROMA_DIR)

    # Initialize Chroma Persistent Client
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    
    # Initialize Ollama Embedding Function (Requires Ollama to be running)
    ollama_ef = embedding_functions.OllamaEmbeddingFunction(
        url="http://localhost:11434/api/embeddings",
        model_name="nomic-embed-text",
    )
    
    # Create or Retrieve Vector Collection
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=ollama_ef
    )
    
    # Initialize LangChain Text Splitter
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", " ", ""]
    )
    
    print("Loading Master Index...")
    df = pd.read_csv(INDEX_CSV, low_memory=False)
    
    # Filter out cases that errored in extraction
    if 'status' in df.columns:
        df = df[df['status'] == 'success']
        
    total_cases = len(df)
    print(f"Total Valid Cases for Vectorization: {total_cases}")
    
    cases_list = df.to_dict('records')
    
    # Batch Processing
    for i in tqdm(range(0, total_cases, BATCH_SIZE), desc="Ingesting Batches"):
        batch_cases = cases_list[i:i + BATCH_SIZE]
        
        batch_ids = []
        batch_documents = []
        batch_metadatas = []
        
        for case in batch_cases:
            # 1. Map CSV backward to extracted JSON
            diary_no = case.get('diary_no', '')
            safe_name = str(diary_no).replace('/', '_').replace(':', '_')
            json_path = os.path.join(JSON_DIR, f"{safe_name}.json")
            
            if not os.path.exists(json_path):
                # Fallback to csv_id matching for older JUDIS items
                csv_id = case.get('csv_id', '')
                safe_name = str(csv_id).replace('/', '_').replace(':', '_')
                json_path = os.path.join(JSON_DIR, f"{safe_name}.json")
                                
            if not os.path.exists(json_path):
                continue
                
            # 2. Extract Document JSON Text
            try:
                with open(json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    full_text = data.get('full_text', "")
            except Exception:
                continue
                
            if len(full_text) < 100:
                continue
                
            # 3. Text Splitting (1000 chars, 200 overlap)
            chunks = text_splitter.split_text(full_text)
            
            # 4. Extract Strict Unified Metadata
            meta = {
                "diary_no": clean_metadata(case.get("diary_no")),
                "case_no": clean_metadata(case.get("case_no")),
                "date": clean_metadata(case.get("date", case.get("decision_date"))),
                "bench": clean_metadata(case.get("bench")),
                "judgement_by": clean_metadata(case.get("judgement_by")),
                "outcome": clean_metadata(case.get("outcome")),
                "sections_cited": clean_metadata(case.get("sections_cited")),
                "articles_cited": clean_metadata(case.get("articles_cited")),
            }
            
            for chunk_idx, chunk in enumerate(chunks):
                chunk_id = f"{safe_name}_chunk_{chunk_idx}"
                batch_ids.append(chunk_id)
                batch_documents.append(chunk)
                batch_metadatas.append(meta)
        
        # 5. Insert directly into Vector Database
        if batch_documents:
            try:
                collection.add(
                    ids=batch_ids,
                    documents=batch_documents,
                    metadatas=batch_metadatas
                )
            except Exception as err:
                print(f"Batch Insert Failed: {err}")
                
        # 6. GPU Checkpoint Rest System - Important for RTX 4060 stability
        time.sleep(0.5)

    print("Vector DB Ingestion Completed Perfectly!")

if __name__ == "__main__":
    main()
