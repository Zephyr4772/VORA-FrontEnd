import os
from huggingface_hub import HfApi

PDF_DIR = r"d:\laww\law\pdfs"

def push_pdfs():
    print(f"Uploading PDF folder: {PDF_DIR}")
    
    # User inputs
    repo_id = input("Enter the Hugging Face repository ID for the PDFs (e.g., your_username/laww-supreme-court-pdfs): ").strip()
    if not repo_id:
        print("Repository ID is required!")
        return

    hf_token = input("Enter your Hugging Face Write Token: ").strip()
    if not hf_token:
        print("Token is required!")
        return

    api = HfApi(token=hf_token)
    
    # Ensure the repo exists (creates a Dataset repo)
    print(f"Creating/verifying dataset repository '{repo_id}'...")
    try:
        api.create_repo(repo_id=repo_id, repo_type="dataset", exist_ok=True)
    except Exception as e:
        print(f"Error creating repository: {e}")
        return

    # Upload the folder
    print("Uploading PDFs... This will take a while but can be resumed if interrupted.")
    api.upload_folder(
        folder_path=PDF_DIR,
        repo_id=repo_id,
        repo_type="dataset",
        path_in_repo="raw_pdfs" # Puts all PDFs inside a 'raw_pdfs' folder on HF
    )
    
    print("PDF upload complete!")
    print(f"View your dataset at: https://huggingface.co/datasets/{repo_id}")

if __name__ == "__main__":
    push_pdfs()
