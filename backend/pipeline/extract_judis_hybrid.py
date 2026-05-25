import os
import re
import json
import csv
import pandas as pd
import fitz  # PyMuPDF
from multiprocessing import Pool
from tqdm import tqdm

# --- ⚙️ CONFIGURATION ---
PDF_DIR = r"d:\laww\law\pdfs"
CSV_PATH = r"d:\laww\law\judgments.csv"
NUM_PROCESSES = 10

# Outputs
JSON_OUT_DIR = r"d:\laww\extracted_json"
MASTER_CSV_OUT = r"d:\laww\master_judis_enriched.csv"
SKIPPED_TXT_OUT = r"d:\laww\skipped_sci_cases.txt"

# Create JSON output directory if it doesn't exist
os.makedirs(JSON_OUT_DIR, exist_ok=True)

# Regex Patterns
P_OUTCOME = re.compile(r"(dismissed|allowed|disposed(?: of)?|acquitted|convicted|set aside|upheld|remanded)", re.IGNORECASE)
P_CITATION = re.compile(r"CITATION:\s*(.{5,200}?)(?:\n[A-Z]{3,}:|$)", re.IGNORECASE)

P_SECTIONS = re.compile(
    r'\b(?:Section|S\.)\s*(\d+[A-Za-z]?)'
    r'(?:\s+of\s+(?:the\s+)?([A-Z][A-Za-z\s]+?(?:Act|Code|Rules)'
    r'(?:\s*\d{4})?))?',
    re.IGNORECASE
)
P_ARTICLES = re.compile(r'\bArticle\s+(\d+[A-Za-z]?)', re.IGNORECASE)

def process_file_task(task_args):
    """ Worker function to process each PDF. Needs to take a single argument for the map function. """
    row_data, pdf_path = task_args
    
    # Initialize base fields
    row_data['status'] = 'processing'
    row_data['text_length'] = 0
    row_data['is_short_order'] = False
    row_data['outcome'] = ''
    row_data['has_citation'] = False
    row_data['citation_extracted'] = ''
    
    try:
        doc = fitz.open(pdf_path)
        text = "\n".join([page.get_text("text") for page in doc])
        text = text.replace('\xa0', ' ')
        doc.close()
    except Exception as e:
        row_data['status'] = f"error: {str(e)}"
        return row_data

    text_len = len(text.strip())
    row_data['text_length'] = text_len
    
    # Check if scanned
    if text_len < 100:
        row_data['status'] = 'scanned'
        return row_data
        
    row_data['status'] = 'success'
    row_data['is_short_order'] = (text_len < 500)
    
    # Outcome Extraction (last occurrence)
    outcomes_found = P_OUTCOME.findall(text)
    if outcomes_found:
        row_data['outcome'] = outcomes_found[-1].lower()
        
    # Citation extraction
    cit_match = P_CITATION.search(text)
    if cit_match:
        citation_text = cit_match.group(1).strip()
        row_data['citation_extracted'] = citation_text
        row_data['has_citation'] = True

    # Sections & Articles cited
    sections = list(set(P_SECTIONS.findall(text)))
    articles = list(set(P_ARTICLES.findall(text)))
    row_data['sections_cited'] = str([f"S.{s[0]} {s[1]}".strip() for s in sections])
    row_data['articles_cited'] = str([f"Art.{a}" for a in articles])

    # Save to individual JSON
    # Clean diary_no for safe filename usage
    safe_name = str(row_data.get('diary_no', row_data.get('csv_id', 'unknown'))).replace('/', '_').replace(':', '_')
    json_path = os.path.join(JSON_OUT_DIR, f"{safe_name}.json")
    
    try:
        with open(json_path, 'w', encoding='utf-8') as f:
            json_record = row_data.copy()
            json_record['full_text'] = text  # Include full text only in the JSON!
            json.dump(json_record, f, indent=4)
    except Exception as e:
        row_data['status'] = f"json_write_error: {str(e)}"

    return row_data

def main():
    print("🚀 Initializing Phase 1 JUDIS Hybrid Engine...")
    
    # 1. Map existing PDFs by their numeric ID
    print(f"Scanning local PDFs in {PDF_DIR}...")
    if not os.path.exists(PDF_DIR):
        print(f"❌ Error: {PDF_DIR} does not exist.")
        return
        
    all_pdfs = [f for f in os.listdir(PDF_DIR) if f.lower().endswith('.pdf')]
    pdf_map = {}
    for pdf_filename in all_pdfs:
        # e.g., 64149-1995__jonew__judis__10591.pdf -> 10591
        match = re.search(r'(\d+)\.pdf$', pdf_filename, re.IGNORECASE)
        if match:
            pdf_id = match.group(1)
            pdf_map[pdf_id] = os.path.join(PDF_DIR, pdf_filename)
    
    print(f"Mapped {len(pdf_map)} unique JUDIS PDFs.")

    # 2. Read and filter the CSV
    print(f"Loading CSV from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    
    judis_rows = []
    skipped_modern_cases = []
    
    for _, row in df.iterrows():
        temp_link = str(row.get('temp_link', ''))
        
        # Partition 1: Is this a JUDIS case?
        if 'jonew/judis/' in temp_link:
            csv_id = temp_link.split('/')[-1].replace('.pdf', '')
            
            # Partition 2: Does it exist physically in our folder?
            if csv_id in pdf_map:
                row_dict = row.to_dict()
                row_dict['csv_id'] = csv_id
                judis_rows.append((row_dict, pdf_map[csv_id]))
        else:
            skipped_modern_cases.append(temp_link)

    print(f"Found {len(judis_rows)} matched JUDIS cases in the CSV.")
    print(f"Skipping {len(skipped_modern_cases)} modern/non-JUDIS cases for Phase 2.")
    
    # Write skipped cases to manifest
    with open(SKIPPED_TXT_OUT, 'w', encoding='utf-8') as sf:
        sf.write("\n".join(skipped_modern_cases))
    
    if len(judis_rows) == 0:
        print("No cases to process. Exiting.")
        return

    # SMOKE TEST FLAG
    # Change test_mode to False to run the full massive batch
    test_mode = False
    batch_to_run = judis_rows[:50] if test_mode else judis_rows
    
    if test_mode:
        print("\n🧪 RUNNING 50-FILE SMOKE TEST (change 'test_mode' in the script to run full dataset)")

    # 3. Multiprocessing Extraction
    enriched_results = []
    with Pool(NUM_PROCESSES) as pool:
        for result in tqdm(pool.imap_unordered(process_file_task, batch_to_run), total=len(batch_to_run), desc="Extracting Hybrid Data"):
            enriched_results.append(result)

    # 4. Save Master CSV
    # Extract keys dynamically from the first valid result to ensure we get all CSV + extracted columns
    if enriched_results:
        fieldnames = list(enriched_results[0].keys())
        # Make sure full_text doesn't accidentally end up in the Master CSV (we stripped it anyway)
        if 'full_text' in fieldnames:
            fieldnames.remove('full_text') 

        with open(MASTER_CSV_OUT, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for res in enriched_results:
                writer.writerow({k: res.get(k, '') for k in fieldnames})
                
    print("\n" + "="*50)
    print("✅ BATCH COMPLETE!")
    print(f"Processed: {len(enriched_results)} cases.")
    print(f"Saved CSV: {MASTER_CSV_OUT}")
    print(f"Saved JSONs: {JSON_OUT_DIR}/")
    print(f"Saved Skipped Manifest: {SKIPPED_TXT_OUT}")
    print("="*50)
    
if __name__ == '__main__':
    # Fix for multiprocessing on Windows
    # (Optional but generally prevents recursive spawn loops)
    from multiprocessing import freeze_support
    freeze_support()
    main()
