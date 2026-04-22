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
JSON_OUT_DIR = r"d:\laww\extracted_json" # Append to the same folder
MASTER_CSV_OUT = r"d:\laww\master_sci_enriched.csv" # Separate CSV for safety

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
    
    if text_len < 100:
        row_data['status'] = 'scanned'
        return row_data
        
    row_data['status'] = 'success'
    row_data['is_short_order'] = (text_len < 500)
    
    # Outcome Extraction
    outcomes_found = P_OUTCOME.findall(text)
    if outcomes_found:
        row_data['outcome'] = outcomes_found[-1].lower()
        
    # Citation extraction
    cit_match = P_CITATION.search(text)
    if cit_match:
        row_data['citation_extracted'] = cit_match.group(1).strip()
        row_data['has_citation'] = True

    # Sections & Articles cited
    sections = list(set(P_SECTIONS.findall(text)))
    articles = list(set(P_ARTICLES.findall(text)))
    row_data['sections_cited'] = str([f"S.{s[0]} {s[1]}".strip() for s in sections])
    row_data['articles_cited'] = str([f"Art.{a}" for a in articles])

    # Save to individual JSON
    safe_name = str(row_data.get('diary_no', row_data.get('csv_id', 'unknown'))).replace('/', '_').replace(':', '_')
    json_path = os.path.join(JSON_OUT_DIR, f"{safe_name}.json")
    
    try:
        with open(json_path, 'w', encoding='utf-8') as f:
            json_record = row_data.copy()
            json_record['full_text'] = text  
            json.dump(json_record, f, indent=4)
    except Exception as e:
        row_data['status'] = f"json_write_error: {str(e)}"

    return row_data

def main():
    print("Initializing Phase 2 SCI Engine...")
    
    print(f"Scanning local PDFs in {PDF_DIR}...")
    if not os.path.exists(PDF_DIR):
        print(f"Error: {PDF_DIR} does not exist.")
        return
        
    all_pdfs_set = set([f for f in os.listdir(PDF_DIR) if f.lower().endswith('.pdf')])
    
    print(f"Loading CSV from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    
    sci_rows = []
    
    for _, row in df.iterrows():
        temp_link = str(row.get('temp_link', ''))
        
        # Partition 2: Modern SCI cases
        if 'supremecourt' in temp_link:
            diary_clean = str(row.get('diary_no', '')).replace('/', '-')
            expected_filename = f"{diary_clean}___{temp_link.replace('/', '__')}"
            
            if expected_filename in all_pdfs_set:
                row_dict = row.to_dict()
                row_dict['csv_id'] = expected_filename
                sci_rows.append((row_dict, os.path.join(PDF_DIR, expected_filename)))

    print(f"Found {len(sci_rows)} matched modern SCI cases in the CSV.")
    
    if len(sci_rows) == 0:
        print("No cases to process. Exiting.")
        return

    test_mode = False
    batch_to_run = sci_rows[:50] if test_mode else sci_rows

    enriched_results = []
    with Pool(NUM_PROCESSES) as pool:
        for result in tqdm(pool.imap_unordered(process_file_task, batch_to_run), total=len(batch_to_run), desc="Extracting Modern SCI Data"):
            enriched_results.append(result)

    if enriched_results:
        fieldnames = list(enriched_results[0].keys())
        if 'full_text' in fieldnames:
            fieldnames.remove('full_text') 

        with open(MASTER_CSV_OUT, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for res in enriched_results:
                writer.writerow({k: res.get(k, '') for k in fieldnames})
                
    print("\n" + "="*50)
    print("PHASE 2 BATCH COMPLETE!")
    print(f"Processed: {len(enriched_results)} cases.")
    print(f"Saved CSV: {MASTER_CSV_OUT}")
    print("="*50)
    
if __name__ == '__main__':
    from multiprocessing import freeze_support
    freeze_support()
    main()
