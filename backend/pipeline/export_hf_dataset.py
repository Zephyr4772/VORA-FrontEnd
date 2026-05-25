import os
import json
import sys

JSON_DIR = r"d:\laww\data_and_json\extracted_json"
OUTPUT_FILE = r"d:\laww\laww_dataset.jsonl"

def main():
    print(f"Starting dataset export from {JSON_DIR}...")
    
    if not os.path.exists(JSON_DIR):
        print(f"Error: {JSON_DIR} does not exist.")
        return

    json_files = [f for f in os.listdir(JSON_DIR) if f.endswith('.json')]
    total_files = len(json_files)
    print(f"Found {total_files} JSON files to process.")
    
    success_count = 0
    error_count = 0
    
    # Open the output file in write mode
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as out_f:
        for i, file_name in enumerate(json_files):
            file_path = os.path.join(JSON_DIR, file_name)
            try:
                with open(file_path, 'r', encoding='utf-8') as in_f:
                    data = json.load(in_f)
                    
                    if len(data.get("full_text", "")) < 100:
                        continue
                        
                    out_f.write(json.dumps(data, ensure_ascii=False) + '\n')
                    success_count += 1
            except Exception as e:
                error_count += 1
                
            if i % 1000 == 0:
                print(f"Processed {i}/{total_files} files...", flush=True)
                
    print(f"\nExport complete!")
    print(f"Successfully exported {success_count} records to {OUTPUT_FILE}")
    if error_count > 0:
        print(f"Encountered errors reading {error_count} files.")
        
    print("\nNext steps to publish to Hugging Face:")
    print("1. Create an account on huggingface.co")
    print("2. pip install huggingface_hub datasets")
    print("3. huggingface-cli login")
    print("4. Python script to push: from datasets import load_dataset; dataset = load_dataset('json', data_files='laww_dataset.jsonl'); dataset.push_to_hub('your_username/laww-supreme-court')")

if __name__ == "__main__":
    main()
