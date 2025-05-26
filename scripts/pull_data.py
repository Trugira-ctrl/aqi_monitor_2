import os
import json
import requests
from datetime import datetime, timedelta
from pathlib import Path
import time
from datetime import timezone

# Sensor IDs and their corresponding read keys
SENSOR_READ_KEYS = {
    ' 222861 - QKAG69HBU3KBNYMZ,
      234741 - Q30I79EW05GJZ37I,
      234747 - 6VJRZCGZ8YU4Q30E,
      235227 - IZ38M2AXG8JQTL71,
      222867 - WWIMCH5Z915CYHAR,
      222887 - GNLTZ7T4Y4HPVYWC,
      222835 - NW86YXIJT79HASPZ,
      234727 - 11TQY94MF2P2Y83H,
      234737 - LTY11VYXE0LM3D7P,
      234749 - OTUINJF7GD8U773N,
      239265 - JYVALQLKQOV5R42P,
      240053 - 94L9ADQ8PI63PYEU,
      240091 - L2DB8WIJYV772HY3,
      240593 - 6AMYN258IKYWBKM4,
      239301 - SPW3K6Y0UYZPCCGX,
      240067 - SFFKAH9KS0EP1UVG,
      239259 - ATY12VZYJL3C6K2C,
      239309 - 2NTUKYSR8LYQI5VO,
      240595 - ICXCMTXYQKAH9M27,
      240061 - WT52J62I3OUUHK4L,
      240059 - NDLJQRC6M7XPJ8BJ,
      240063 - 1H1DKG9QJAHBV4R5,
      239249 - HMG4Y6QTMCMTWRTJ,
      240083 - 8PI5WVCSMHBTTFEE,
      239267 - CYH8HE9T0ENRMJM4,
      239307 - 51FQ32Q5BWAEVXOD,
      240065 - O9YQI2KBO359LU64,
      240047 - 1DGTJVJT65XYQJ5U,
      240041 - 9M26D1US41I4TIRZ,
      239297 - 3SDAZTUJXN8VGEDD,
      240097 - 05IR1MPDI5XWHGK7,
      240587 - F9PI5WSZ95L9BH68,
      239257 - 7ALVBLT2KDUVKWJR,
      240093 - 9CP8PKF57AIGIVJT,
      240057 - J07RWVFBXEZH65Z4,
      240049 - BBDOYF2SHPTPRGPX,
      240071 - 6S68CQEH0A4HQ0JF,
      240075 - WUBTR5664Q3X3EI0,
}

def fetch_sensor_data():
    """Fetch current data from PurpleAir API for all sensors."""
    print("Starting sensor data fetch...")
    read_api_key = os.getenv('PURPLEAIR_READ_KEY')
    if not read_api_key:
        raise ValueError("PURPLEAIR_READ_KEY environment variable must be set")
    print("API key found, proceeding with data fetch...")

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
    
    headers = {
        'X-API-Key': read_api_key,
        'Content-Type': 'application/json'
    }
    
    base_params = {
        'fields': ','.join(fields)
    }
    
    all_data = []
    successful_fetches = 0
    
    try:
        for sensor_id, read_key in SENSOR_READ_KEYS.items():
            try:
                print(f"\nFetching data for sensor {sensor_id}...")
                
                # Create a new params dict for each request
                params = base_params.copy()
                if read_key:
                    params['read_key'] = read_key
                    print(f"Using read key for sensor {sensor_id}")
                
                # Make request for individual sensor
                url = f'https://api.purpleair.com/v1/sensors/{sensor_id}'
                print(f"Request URL: {url}")
                print(f"Request params: {params}")
                
                response = requests.get(url, headers=headers, params=params)
                print(f"Response status code: {response.status_code}")
                
                response.raise_for_status()
                
                sensor_data = response.json()
                if 'sensor' in sensor_data:
                    processed_data = sensor_data['sensor']
                    processed_data['sensor_id'] = sensor_id
                    all_data.append(processed_data)
                    successful_fetches += 1
                    print(f"Successfully fetched data for sensor {sensor_id}")
                else:
                    print(f"No data found for sensor {sensor_id}")
                
                # Add delay to avoid rate limiting
                print("Waiting 2 seconds before next request...")
                time.sleep(2)
                
            except requests.exceptions.RequestException as e:
                print(f"Error fetching data for sensor {sensor_id}: {e}")
                if hasattr(e.response, 'text'):
                    print(f"Response content: {e.response.text}")
                continue
            
    except Exception as e:
        print(f"Error in data fetch: {e}")
        raise
    
    print(f"\nData fetch completed. Successfully fetched data for {successful_fetches} out of {len(SENSOR_READ_KEYS)} sensors.")
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
