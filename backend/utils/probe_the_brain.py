import os
import chromadb
from chromadb.utils import embedding_functions

def main():
    CHROMA_DIR = r"d:\laww\chroma_db"
    COLLECTION_NAME = "supreme_court_judgments"
    
    print("Initializing Database Connection...")
    
    if not os.path.exists(CHROMA_DIR):
        print(f"Error: Could not find DB at {CHROMA_DIR}")
        return

    # Use the exact same local Ollama embedding engine for querying
    ollama_ef = embedding_functions.OllamaEmbeddingFunction(
        url="http://localhost:11434/api/embeddings",
        model_name="nomic-embed-text",
    )
    
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    
    try:
        collection = client.get_collection(
            name=COLLECTION_NAME, 
            embedding_function=ollama_ef
        )
    except Exception as e:
        print(f"Failed to load collection: {e}")
        return
    
    # The Deep Probe Query
    query_text = "Right to property vs right to life in land acquisition cases"
    print(f"\nPROBING THE BRAIN: '{query_text}'\n")
    print("=" * 70)
    
    # Execute Vector Search
    results = collection.query(
        query_texts=[query_text],
        n_results=2
    )
    
    if not results or not results['documents']:
        print("No results returned!")
        return
        
    for idx in range(len(results['documents'][0])):
        text_chunk = results['documents'][0][idx]
        meta = results['metadatas'][0][idx]
        distance = results['distances'][0][idx] # Lower distance = closer conceptual match
        
        diary_no = meta.get("diary_no", "Unknown")
        date_str = meta.get("date", "Unknown")
        bench = meta.get("bench", "Unknown")
        outcome = meta.get("outcome", "Unknown")
        
        print(f"\nRESULT #{idx + 1}")
        print(f"SOURCE_DIARY: {diary_no} | DATE: {date_str}")
        print(f"BENCH: {bench[:70]}... | OUTCOME: {outcome}")
        print(f"VECTOR_DISTANCE: {distance:.4f}")
        print("-" * 70)
        print(text_chunk)
        print("=" * 70)

if __name__ == "__main__":
    main()
