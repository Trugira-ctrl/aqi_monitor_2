import os
import json
import pandas as pd
from datetime import datetime
from pathlib import Path
from typing import Optional

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False

try:
    import gspread
    from oauth2client.service_account import ServiceAccountCredentials
    GSPREAD_AVAILABLE = True
except ImportError:
    GSPREAD_AVAILABLE = False

def get_latest_raw_data() -> dict:
    """Get the most recent raw data file."""
    raw_dir = Path('data/raw')
    if not raw_dir.exists():
        raise FileNotFoundError("No raw data directory found")
    
    files = list(raw_dir.glob('purpleair_data_*.json'))
    if not files:
        raise FileNotFoundError("No raw data files found")
    
    latest_file = max(files, key=lambda x: x.stat().st_mtime)
    with open(latest_file) as f:
        return json.load(f)

def process_data(raw_data: list) -> pd.DataFrame:
    """Process raw PurpleAir data into a DataFrame matching sensor_reports schema."""
    processed_rows = []
    
    for sensor_data in raw_data:
        try:
            # Extract relevant fields matching sensor_reports table schema
            row = {
                'sensor_id': sensor_data['sensor_id'],
                'latitude': sensor_data['sensor']['latitude'],
                'longitude': sensor_data['sensor']['longitude'],
                'last_seen': datetime.fromtimestamp(sensor_data['data_time_stamp']),
                'pm25': sensor_data['sensor']['pm2_5'],
                'temperature': sensor_data['sensor']['temperature'],
                'humidity': sensor_data['sensor']['humidity'],
                'pressure': sensor_data['sensor']['pressure'],
                'status': 'active',  # Default status
                'error': None,  # No error by default
                'created_at': datetime.now()
            }
            processed_rows.append(row)
        except KeyError as e:
            print(f"Error processing sensor data: {e}")
            continue
    
    return pd.DataFrame(processed_rows)

def store_in_supabase(df: pd.DataFrame) -> bool:
    """Store data in Supabase sensor_reports table."""
    if not SUPABASE_AVAILABLE:
        return False
        
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    if not (supabase_url and supabase_key):
        return False
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Convert DataFrame to list of dictionaries
        records = df.to_dict('records')
        
        # Upsert data into sensor_reports table
        result = supabase.table('sensor_reports').upsert(
            records,
            on_conflict='sensor_id,last_seen'  # Prevent duplicate reports
        ).execute()
        return True
    except Exception as e:
        print(f"Error storing data in Supabase: {e}")
        return False

def store_in_sheets(df: pd.DataFrame) -> bool:
    """Store data in Google Sheets if credentials are available."""
    if not GSPREAD_AVAILABLE:
        return False
        
    gcp_creds = os.getenv('GCP_CREDS')
    if not gcp_creds:
        return False
    
    try:
        # Write credentials to temporary file
        creds_file = Path('gcp-creds.json')
        with open(creds_file, 'w') as f:
            f.write(gcp_creds)
        
        # Set up Google Sheets
        scope = ['https://spreadsheets.google.com/feeds',
                'https://www.googleapis.com/auth/drive']
        credentials = ServiceAccountCredentials.from_json_keyfile_name(
            str(creds_file), scope)
        client = gspread.authorize(credentials)
        
        # Open spreadsheet and append data
        sheet = client.open("AQI Data").sheet1
        
        # Add headers if sheet is empty
        if not sheet.get_all_records():
            sheet.append_row(df.columns.tolist())
        
        # Append data
        sheet.append_rows(df.values.tolist())
        
        # Clean up
        creds_file.unlink()
        return True
    except Exception as e:
        print(f"Error storing data in Google Sheets: {e}")
        return False

def main():
    try:
        # Get latest raw data
        raw_data = get_latest_raw_data()
        
        # Process data
        df = process_data(raw_data)
        
        # Store data
        stored = False
        if store_in_supabase(df):
            stored = True
            print("Data stored in Supabase")
        elif store_in_sheets(df):
            stored = True
            print("Data stored in Google Sheets")
        
        if not stored:
            raise Exception("Failed to store data in any backend")
            
    except Exception as e:
        print(f"Error in data processing: {e}")
        raise

if __name__ == '__main__':
    main() 