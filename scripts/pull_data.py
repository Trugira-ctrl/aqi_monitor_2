import os
import json
import requests
from datetime import datetime, timedelta
from pathlib import Path
import time
from datetime import timezone

# Sensor IDs and their corresponding read keys
SENSOR_READ_KEYS = {
    '240075': 'WUBTR5664Q3X3EI0',
    '240049': 'BBDOYF2SHPTPRGPX',
    '239257': '7ALVBLT2KDUVKWJR',
    '239297': '3SDAZTUJXN8VGEDD',
    '239307': '51FQ32Q5BWAEVXOD',
    '239267': 'CYH8HE9T0ENRMJM4',
    '240595': 'ICXCMTXYQKAH9M27',
    '239259': 'ATY12VZYJL3C6K2C',
    '240067': 'SFFKAH9KS0EP1UVG',
    '222835': 'NW86YXIJT79HASPZ',
    '222887': 'GNLTZ7T4Y4HPVYWC',
    '222861': 'QKAG69HBU3KBNYMZ',
    '240091': 'L2DB8WIJYV772HY3',
    '240097': '05IR1MPDI5XWHGK7',
    '240593': '6AMYN258IKYWBKM4',
    '240083': '8PI5WVCSMHBTTFEE',
    '239301': 'SPW3K6Y0UYZPCCGX',
    '240063': '1H1DKG9QJAHBV4R5',
    '235227': 'IZ38M2AXG8JQTL71',
    '240041': '9M26D1US41I4TIRZ'
}

def fetch_sensor_data():
    """Fetch current data from PurpleAir API for all sensors."""
    api_key = os.getenv('PURPLEAIR_KEY')
    if not api_key:
        raise ValueError("PURPLEAIR_KEY environment variable is not set")

    headers = {
        'X-API-Key': api_key,
        'Content-Type': 'application/json'
    }

    # Fields we want to retrieve
    fields = [
        'name',
        'latitude',
        'longitude',
        'pm2.5',
        'pm2.5_10minute',
        'pm2.5_30minute',
        'pm2.5_60minute',
        'pm2.5_6hour',
        'pm2.5_24hour',
        'pm2.5_1week',
        'temperature',
        'humidity',
        'pressure',
        'last_seen'
    ]
    
    all_data = []
    
    try:
        # First, create a group for our sensors
        group_name = f"aqs_sensors_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
        group_data = {
            'name': group_name
        }
        
        # Create the group
        group_response = requests.post(
            'https://api.purpleair.com/v1/groups',
            headers=headers,
            json=group_data
        )
        group_response.raise_for_status()
        group_id = group_response.json()['id']
        
        # Add sensors to the group
        for sensor_id, read_key in SENSOR_READ_KEYS.items():
            member_data = {
                'sensor_index': sensor_id,
                'read_key': read_key
            }
            
            member_response = requests.post(
                f'https://api.purpleair.com/v1/groups/{group_id}/members',
                headers=headers,
                json=member_data
            )
            member_response.raise_for_status()
            
            # Add delay to avoid rate limiting
            time.sleep(1)
        
        # Get data for all sensors in the group
        params = {
            'fields': ','.join(fields)
        }
        
        group_data_response = requests.get(
            f'https://api.purpleair.com/v1/groups/{group_id}',
            headers=headers,
            params=params
        )
        group_data_response.raise_for_status()
        
        # Process the response
        response_data = group_data_response.json()
        if 'data' in response_data:
            for sensor_data in response_data['data']:
                processed_data = dict(zip(fields, sensor_data))
                all_data.append(processed_data)
        
        # Clean up - delete the group
        requests.delete(
            f'https://api.purpleair.com/v1/groups/{group_id}',
            headers=headers
        )
        
    except requests.exceptions.RequestException as e:
        print(f"Error in API request: {e}")
        if hasattr(e.response, 'text'):
            print(f"Response content: {e.response.text}")
        raise
    
    return all_data

def save_raw_data(data):
    """Save raw data to JSON file with timestamp."""
    if not data:
        print("No data to save")
        return None
        
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    raw_dir = Path('data/raw')
    raw_dir.mkdir(parents=True, exist_ok=True)
    
    output_file = raw_dir / f'purpleair_data_{timestamp}.json'
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    return output_file

def main():
    try:
        print("Starting data fetch...")
        # Fetch data from PurpleAir
        data = fetch_sensor_data()
        
        if not data:
            print("No data was fetched from any sensors")
            return
        
        # Save raw data
        output_file = save_raw_data(data)
        if output_file:
            print(f"Data saved to {output_file}")
            print(f"Successfully fetched data for {len(data)} sensors")
        
    except Exception as e:
        print(f"Error in data pull: {e}")
        raise

if __name__ == '__main__':
    main() 