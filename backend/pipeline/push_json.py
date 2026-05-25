import os
from datasets import load_dataset
from huggingface_hub import HfApi

JSONL_FILE = r"d:\laww\laww_dataset.jsonl"

def push_json():
    print(f"Preparing to upload JSONL dataset: {JSONL_FILE}")
    
    # User inputs
    repo_id = input("Enter the Hugging Face repository ID for the extracted JSON data (e.g., your_username/laww-supreme-court-json): ").strip()
    if not repo_id:
        print("Repository ID is required!")
        return

    hf_token = input("Enter your Hugging Face Write Token: ").strip()
    if not hf_token:
        print("Token is required!")
        return
        
    print("Loading dataset into memory (this might take a minute)...")
    try:
        dataset = load_dataset("json", data_files=JSONL_FILE, split="train")
    except Exception as e:
        print(f"Error loading JSONL file: {e}")
        return
        
    print(f"Successfully loaded dataset with {len(dataset)} cases.")
    print(f"Uploading dataset to '{repo_id}'...")
    
    # Push to hub
    try:
        dataset.push_to_hub(repo_id, token=hf_token)
        print("Dataset upload complete!")
        print(f"View your dataset at: https://huggingface.co/datasets/{repo_id}")
    except Exception as e:
        print(f"Error uploading dataset: {e}")

if __name__ == "__main__":
    push_json()
