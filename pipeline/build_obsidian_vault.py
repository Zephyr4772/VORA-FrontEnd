import os
import re
import ast
import pandas as pd
from tqdm import tqdm

# --- Configuration ---
CSV_PATH = r"d:\laww\supreme_court_master_index.csv"
VAULT_DIR = r"d:\laww\Supreme_Court_Vault"

def clean_none(value):
    if pd.isna(value) or value is None:
        return "Unknown"
    val_str = str(value).strip()
    return val_str if val_str else "Unknown"

def clean_judge_name(name):
    if pd.isna(name) or not str(name).strip():
        return "Unknown Judge"
    name = str(name).upper()
    
    # Aggressively strip honorifics
    honorifics = [
        r"\bHON'?BLE\b", r"\bMR\.\b", r"\bMRS\.\b", r"\bMS\.\b", 
        r"\bJUSTICE\b", r"\bDR\.\b", r"\bCHIEF\b", r"\bTHE\b",
        r"\bSRI\b", r"\bSMT\.\b", r"\bMR\b", r"\bMRS\b", 
        r"\bMS\b", r"\bDR\b"
    ]
    for h in honorifics:
        name = re.sub(h, '', name)
        
    cleaned = " ".join(name.split()).title()
    return cleaned if cleaned else "Unknown Judge"

def parse_bench(bench_str):
    if pd.isna(bench_str) or not str(bench_str).strip():
        return ["Unknown Bench"]
    # Split across standard delimiters used in Indian Courts
    parts = re.split(r',|\bAND\b|&', str(bench_str), flags=re.IGNORECASE)
    judges = [clean_judge_name(p) for p in parts if p.strip()]
    return judges if judges else ["Unknown Bench"]

def parse_cited_lists(cited_str):
    if pd.isna(cited_str) or str(cited_str).strip() in ['[]', '']:
        return []
    try:
        # Convert string repr of list "['S.302 IPC']" back to a python list
        return ast.literal_eval(str(cited_str))
    except Exception:
        return []

def main():
    print("Initializing Obsidian Architect...")
    
    if not os.path.exists(VAULT_DIR):
        os.makedirs(VAULT_DIR)

    print("Loading Master Index...")
    df = pd.read_csv(CSV_PATH, low_memory=False)
    
    # Standardize Dates
    print("Normalizing timestamps...")
    # 'date' column might be under 'judgment_dates' depending on scrape
    date_col = 'judgment_dates'
    df['datetime_obj'] = pd.to_datetime(df[date_col], errors='coerce')
    
    # Process sequentially with tqdm
    total_records = len(df)
    
    print(f"Building nodes for {total_records} cases. This will be fast!")
    
    for idx, row in tqdm(df.iterrows(), total=total_records, desc="Deploying Vault"):
        
        # 1. Metadata Normalization
        diary_no = clean_none(row.get('diary_no'))
        case_no = clean_none(row.get('case_no')).replace('"', "'")
        
        # Safe URL generation for Obsidian Links (Can't contain '/' or ':')
        safe_name = str(diary_no).replace('/', '_').replace(':', '_')
        if safe_name == "Unknown":
            safe_name = str(row.get('csv_id', f"unknown_row_{idx}"))
        
        # Date Logic
        dt = row['datetime_obj']
        if pd.notna(dt):
            year = str(dt.year)
            month = dt.strftime('%B')  # e.g., November
            full_date_str = dt.strftime('%Y-%m-%d')
        else:
            year = "Unknown_Year"
            month = "Unknown_Month"
            full_date_str = "Unknown_Date"
            
        # Target Directory
        target_dir = os.path.join(VAULT_DIR, year, month)
        os.makedirs(target_dir, exist_ok=True)
        file_path = os.path.join(target_dir, f"{safe_name}.md")
        
        # 2. Extract Entities
        petitioner = clean_none(row.get('pet')).replace('"', "'")
        respondent = clean_none(row.get('res')).replace('"', "'")
        outcome = clean_none(row.get('outcome')).lower().replace(' ', '_')
        if outcome == "unknown": outcome = "unspecified"
        
        author_raw = clean_none(row.get('judgement_by'))
        author_cleaned = clean_judge_name(author_raw)
        
        bench_raw = clean_none(row.get('bench'))
        bench_list = parse_bench(bench_raw)
        bench_links = " ".join([f"[[{j}]]" for j in bench_list])
        
        # Citations Processing
        sections = parse_cited_lists(row.get('sections_cited'))
        articles = parse_cited_lists(row.get('articles_cited'))
        
        # Merge citations into bullet blocks
        citations = []
        for s in sections: citations.append(f"- [[{s}]]")
        for a in articles: citations.append(f"- [[{a}]]")
            
        if citations:
            citation_bullets = "\n".join(citations)
        else:
            citation_bullets = "*No explicit citations strictly extracted.*"

        # 3. Create Markdown Content Injection
        md_content = f"""---
diary_no: "{diary_no}"
case_no: "{case_no}"
date: "{full_date_str}"
bench: "{bench_raw}"
author: "{author_raw}"
outcome: "{outcome}"
---

# [[{petitioner}]] vs. [[{respondent}]]

**Status:** #outcome/{outcome}  
**Date:** [[{full_date_str}]] | [[{year}-{month}]] | [[{year}]]
**Bench:** {bench_links}
**Author:** [[{author_cleaned}]]

## ⚖️ Cited Authority
{citation_bullets}

## 📝 Judgment Summary
*(Consult local vault database or trigger local RAG agent for deep context)*
[Open Source Text File](file:///d:/laww/extracted_json/{safe_name}.json)
"""

        # Write to Output File
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(md_content)
        except Exception as e:
            # Just quietly skip weird pathing edge cases
            continue

    print("\n" + "="*50)
    print("✅ Obsidian Graph Population Complete!")
    print(f"The vault is ready at: {VAULT_DIR}")
    print("="*50)

if __name__ == "__main__":
    main()
