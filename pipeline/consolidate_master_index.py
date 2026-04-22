import pandas as pd
import os

def main():
    judis_path = r"d:\laww\master_judis_enriched.csv"
    sci_path = r"d:\laww\master_sci_enriched.csv"
    out_path = r"d:\laww\supreme_court_master_index.csv"
    
    print("Initializing Master Database Consolidation...")
    
    # 1. Load the CSVs
    if os.path.exists(judis_path):
        print(f"Loading JUDIS Master: {judis_path}...")
        df_judis = pd.read_csv(judis_path, low_memory=False)
        print(f"   -> {len(df_judis)} records found.")
    else:
        print(f"   Error: Could not find {judis_path}. Exiting.")
        return
        
    if os.path.exists(sci_path):
        print(f"Loading SCI Master: {sci_path}...")
        df_sci = pd.read_csv(sci_path, low_memory=False)
        print(f"   -> {len(df_sci)} records found.")
    else:
        print(f"   Error: Could not find {sci_path}. Exiting.")
        return

    # 2. Concatenate
    print("\nMerging databases into unified index...")
    df_merged = pd.concat([df_judis, df_sci], ignore_index=True)
    print(f"Total merged rows prior to deduplication: {len(df_merged)}")

    # 3. Column Alignment (Backfilling '[]' for missing cases)
    if 'sections_cited' not in df_merged.columns:
        df_merged['sections_cited'] = '[]'
    if 'articles_cited' not in df_merged.columns:
        df_merged['articles_cited'] = '[]'
        
    df_merged['sections_cited'] = df_merged['sections_cited'].fillna('[]')
    df_merged['articles_cited'] = df_merged['articles_cited'].fillna('[]')

    # 4. Deduplication
    print("\nScrubbing database for duplicate diary_no entries...")
    initial_len = len(df_merged)
    # Ensure no NaN diary_no values break the drop_duplicates logic
    df_merged = df_merged.dropna(subset=['diary_no'])
    df_merged = df_merged.drop_duplicates(subset=['diary_no'], keep='last')
    dupes_removed = initial_len - len(df_merged)
    print(f"Removed {dupes_removed} duplicate records.")

    # 5. Validation & Summary Stats
    print("\n" + "="*50)
    print("FINAL DATABASE HEALTH REPORT")
    print("="*50)
    
    if 'status' in df_merged.columns:
        stats = df_merged['status'].value_counts()
        for stat_type, count in stats.items():
            print(f"- {stat_type.upper():<10}: {count:,}")
            
        total_valid = df_merged[df_merged['status'] == 'success'].shape[0]
        print("-" * 50)
        print(f"VECTOR-READY CASES: {total_valid:,}")
    else:
        print("Warning: 'status' column not found, skipping stats.")
    print("="*50)

    # 6. Save Final Source of Truth
    print(f"\nSerializing unified index to {out_path}...")
    df_merged.to_csv(out_path, index=False)
    print("Master Index Generated Successfully! Ready for Vectorization.")

if __name__ == "__main__":
    main()
