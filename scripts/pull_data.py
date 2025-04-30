import os
import json
import requests
from datetime import datetime, timedelta
from pathlib import Path

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

def fetch_historical_data():
    """Fetch historical data from PurpleAir API for all sensors."""
    api_key = os.getenv('PURPLEAIR_KEY')
    if not api_key:
        raise ValueError("PURPLEAIR_KEY environment variable is not set")

    headers = {
        'X-API-Key': api_key
    }

    # Calculate date range for last 2 weeks
    end_date = datetime.now()
    start_date = end_date - timedelta(days=14)
    
    # Convert to Unix timestamps
    start_timestamp = int(start_date.timestamp())
    end_timestamp = int(end_date.timestamp())

    all_data = []
    for sensor_id, read_key in SENSOR_READ_KEYS.items():
        try:
            # Build URL with read key for private sensors
            url = f'https://api.purpleair.com/v1/sensors/{sensor_id}/history'
            params = {
                'start_timestamp': start_timestamp,
                'end_timestamp': end_timestamp,
                'average': 3600,  # 1-hour averages
                'fields': 'pm2.5,temperature,humidity,pressure'
            }
            
            if read_key:
                params['read_key'] = read_key
            
            # Fetch sensor data
            print(f"Fetching historical data for sensor {sensor_id}...")
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            sensor_data = response.json()
            sensor_data['sensor_id'] = sensor_id
            
            # Get sensor metadata
            metadata_url = f'https://api.purpleair.com/v1/sensors/{sensor_id}'
            if read_key:
                metadata_url += f'?read_key={read_key}'
            
            metadata_response = requests.get(metadata_url, headers=headers)
            metadata_response.raise_for_status()
            
            # Combine historical data with metadata
            sensor_data['metadata'] = metadata_response.json()
            all_data.append(sensor_data)
            
            print(f"Successfully fetched data for sensor {sensor_id}")
            
        except requests.exceptions.RequestException as e:
            print(f"Error fetching data for sensor {sensor_id}: {e}")
            continue

    return all_data

def save_raw_data(data):
    """Save raw data to JSON file with timestamp."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    raw_dir = Path('data/raw')
    raw_dir.mkdir(parents=True, exist_ok=True)
    
    output_file = raw_dir / f'purpleair_historical_data_{timestamp}.json'
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    return output_file

def main():
    try:
        print("Starting historical data fetch...")
        # Fetch historical data from PurpleAir
        data = fetch_historical_data()
        
        if not data:
            print("No data was fetched from any sensors")
            return
        
        # Save raw data
        output_file = save_raw_data(data)
        print(f"Historical data saved to {output_file}")
        print(f"Successfully fetched data for {len(data)} sensors")
        
    except Exception as e:
        print(f"Error in data pull: {e}")
        raise

if __name__ == '__main__':
    main() 