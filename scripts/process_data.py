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
    
    files = list(raw_dir.glob('purpleair_historical_data_*.json'))
    if not files:
        raise FileNotFoundError("No raw data files found")
    
    latest_file = max(files, key=lambda x: x.stat().st_mtime)
    with open(latest_file) as f:
        return json.load(f)

def process_data(raw_data: list) -> pd.DataFrame:
    """Process raw PurpleAir historical data into a DataFrame matching sensor_reports schema."""
    processed_rows = []
    
    for sensor_data in raw_data:
        try:
            # Get sensor metadata
            metadata = sensor_data.get('metadata', {}).get('sensor', {})
            sensor_id = str(sensor_data.get('sensor_id'))
            
            # Get historical data points
            data_points = sensor_data.get('data', [])
            timestamps = sensor_data.get('time_stamps', [])
            
            if not data_points or not timestamps:
                print(f"No historical data found for sensor {sensor_id}")
                continue
                
            # Process each data point
            for timestamp, data_point in zip(timestamps, data_points):
                try:
                    row = {
                        'sensor_id': sensor_id,
                        'latitude': metadata.get('latitude'),
                        'longitude': metadata.get('longitude'),
                        'last_seen': datetime.fromtimestamp(timestamp),
                        'pm25': data_point[0],  # pm2.5 is first field
                        'temperature': data_point[1],  # temperature is second field
                        'humidity': data_point[2],  # humidity is third field
                        'pressure': data_point[3],  # pressure is fourth field
                        'status': 'active',
                        'error': None,
                        'created_at': datetime.now()
                    }
                    
                    # Only add the row if we have valid coordinates and pm25 data
                    if (row['latitude'] is not None and 
                        row['longitude'] is not None and 
                        row['pm25'] is not None):
                        processed_rows.append(row)
                        
                except (IndexError, TypeError) as e:
                    print(f"Error processing data point for sensor {sensor_id}: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error processing sensor {sensor_id}: {e}")
            continue
    
    if not processed_rows:
        print("No valid data points were processed")
        return pd.DataFrame()
        
    df = pd.DataFrame(processed_rows)
    print(f"Processed {len(df)} data points from {len(raw_data)} sensors")
    return df

def store_in_supabase(df: pd.DataFrame) -> bool:
    """Store data in Supabase sensor_reports table."""
    if not SUPABASE_AVAILABLE:
        return False
        
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    if not (supabase_url and supabase_key):
        return False
    
    try:
        # Initialize Supabase client without proxy
        supabase: Client = create_client(
            supabase_url,
            supabase_key,
            options={
                'headers': {
                    'Authorization': f'Bearer {supabase_key}'
                }
            }
        )
        
        # Convert DataFrame to list of dictionaries
        records = df.to_dict('records')
        
        if not records:
            print("No valid records to store")
            return False
            
        # Process in batches to avoid request size limits
        batch_size = 1000
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            # Upsert data into sensor_reports table
            result = supabase.table('sensor_reports').upsert(
                batch,
                on_conflict='sensor_id,last_seen'  # Prevent duplicate reports
            ).execute()
            print(f"Stored batch of {len(batch)} records in Supabase")
        
        print(f"Successfully stored all {len(records)} records in Supabase")
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
        
        # Process in batches to avoid request size limits
        batch_size = 1000
        for i in range(0, len(df), batch_size):
            batch = df.iloc[i:i + batch_size]
            sheet.append_rows(batch.values.tolist())
            print(f"Stored batch of {len(batch)} records in Google Sheets")
        
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
        
        if df.empty:
            print("No valid data to store")
            return
        
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