import requests
import json
import sys

payload = {
    "model": "qwen2.5:latest",
    "prompt": "hi",
    "stream": True
}

try:
    with requests.post("http://localhost:11434/api/generate", json=payload, stream=True) as r:
        if r.status_code != 200:
            print(f"Error {r.status_code}: {r.text}")
            sys.exit(1)
        for line in r.iter_lines():
            if line:
                print(line.decode('utf-8'))
except Exception as e:
    print(f"Exception: {e}")
