import os
import json
import pickle
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly']

FOLDER_ID = "1mIHalG9mwHC2ukdZzbC-XNDWPILRmMYq"  # Extract from your Google Drive folder URL
OUTPUT_FILE = r"d:\laww\drive_id_map.json"

def get_drive_service():
    """Shows basic usage of the Drive v3 API.
    Prints the names and ids of the first 10 files the user has access to.
    """
    creds = None
    # The file token.pickle stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    token_path = r"d:\laww\token.pickle"
    creds_path = r"d:\laww\credentials.json"
    
    if os.path.exists(token_path):
        with open(token_path, 'rb') as token:
            creds = pickle.load(token)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                creds_path, SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open(token_path, 'wb') as token:
            pickle.dump(creds, token)

    service = build('drive', 'v3', credentials=creds)
    return service

def main():
    service = get_drive_service()
    
    if FOLDER_ID == "YOUR_FOLDER_ID_HERE":
        print("Please edit extract_drive_ids.py and put your FOLDER_ID at the top.")
        return

    print(f"Scanning Google Drive Folder: {FOLDER_ID}")
    
    file_map = {}
    page_token = None
    count = 0
    
    while True:
        results = service.files().list(
            q=f"'{FOLDER_ID}' in parents and trashed = false",
            pageSize=1000,
            fields="nextPageToken, files(id, name)",
            pageToken=page_token
        ).execute()
        
        items = results.get('files', [])
        for item in items:
            file_map[item['name']] = item['id']
            count += 1
            if count % 1000 == 0:
                print(f"Scanned {count} files...")
                
        page_token = results.get('nextPageToken')
        if not page_token:
            break

    print(f"Finished scanning. Total files mapped: {len(file_map)}")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(file_map, f, indent=2)
        
    print(f"Mapping saved to {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
