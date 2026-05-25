import chromadb
from chromadb.utils import embedding_functions

client = chromadb.PersistentClient(path=r"d:\laww\chroma_db")
ef = embedding_functions.OllamaEmbeddingFunction(
    url="http://localhost:11434/api/embeddings",
    model_name="nomic-embed-text"
)
col = client.get_collection("supreme_court_judgments", embedding_function=ef)
print("Total docs in ChromaDB vault:", col.count())

results = col.query(query_texts=["right to privacy fundamental right"], n_results=3)
for i, (doc, meta) in enumerate(zip(results["documents"][0], results["metadatas"][0])):
    print(f"Case {i+1}: {meta.get('case_no','?')} | {meta.get('outcome','?')} | {meta.get('date','?')}")
print("FULL CHAIN OK")
