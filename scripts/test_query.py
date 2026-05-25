import requests
import json
import sys

payload = {
    "query": "hi",
    "api_key": "ollama-local",
    "provider": "ollama",
    "model_name": "qwen2.5:latest",
    "n_results": 5,
    "search_cases": False
}

try:
    with requests.post("http://127.0.0.1:8001/api/query", json=payload, stream=True) as r:
        if r.status_code != 200:
            print(f"Error {r.status_code}: {r.text}")
            sys.exit(1)
        for line in r.iter_lines():
            if line:
                print(line.decode('utf-8'))
except Exception as e:
    print(f"Exception: {e}")
