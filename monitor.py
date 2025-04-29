import os
import time
import logging
from datetime import datetime, timezone
from urllib.request import Request, urlopen
import json
from urllib.error import URLError
from http.client import HTTPResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('sensor_monitor.log'),
        logging.StreamHandler()
    ]
)

class PurpleAirMonitor:
    def __init__(self):
        self.api_key = os.environ.get('PURPLEAIR_API_KEY')
        self.sensor_indexes = [
            '240075', '240049', '239257', '239297', 
            '239307', '239267', '240595', '239259', 
            '240067', '222835', '222887'
        ]
        self.base_url = 'https://api.purpleair.com/v1/sensors'
        
        logging.info("PurpleAir Monitor initialized")
        logging.info(f"Monitoring {len(self.sensor_indexes)} sensors")

    def get_sensor_data(self, sensor_index):
        try:
            url = f"{self.base_url}/{sensor_index}"
            headers = {
                'X-API-Key': self.api_key,
                'Content-Type': 'application/json'
            }
            
            request = Request(
                url,
                headers=headers,
                method='GET'
            )
            
            with urlopen(request) as response:
                if isinstance(response, HTTPResponse):
                    data = response.read()
                    return json.loads(data)
                return None
                
        except URLError as e:
            logging.error(f"Error fetching data for sensor {sensor_index}: {e}")
            return None
        except Exception as e:
            logging.error(f"Unexpected error for sensor {sensor_index}: {e}")
            return None

    def log_notification(self, subject, message):
        logging.warning("\n=== NOTIFICATION ===")
        logging.warning(f"Subject: {subject}")
        logging.warning(message)
        logging.warning("==================\n")

    def check_sensor_status(self):
        current_time = datetime.now(timezone.utc).timestamp()
        offline_sensors = []

        for sensor_index in self.sensor_indexes:
            data = self.get_sensor_data(sensor_index)
            if not data:
                logging.error(f"Failed to get data for sensor {sensor_index}")
                continue

            sensor = data.get('sensor', {})
            last_seen = sensor.get('last_seen')
            name = sensor.get('name', f'Sensor {sensor_index}')

            if last_seen:
                time_difference = current_time - last_seen
                hours_offline = time_difference / 3600

                if hours_offline > 3:  # Changed threshold to 3 hours
                    offline_sensors.append({
                        'name': name,
                        'index': sensor_index,
                        'hours': round(hours_offline, 1),
                        'last_seen': datetime.fromtimestamp(last_seen, timezone.utc).isoformat()
                    })
                    logging.warning(
                        f"Sensor {name} (ID: {sensor_index}) hasn't reported in {round(hours_offline, 1)} hours"
                    )
            else:
                logging.warning(f"No last_seen data for sensor {sensor_index}")

        if offline_sensors:
            message = "The following sensors have been offline for more than 3 hours:\n\n"
            for sensor in offline_sensors:
                message += f"- {sensor['name']} (ID: {sensor['index']})\n"
                message += f"  Last seen: {sensor['last_seen']}\n"
                message += f"  Hours offline: {sensor['hours']}\n\n"
            
            self.log_notification(
                "PurpleAir Sensors Offline Alert",
                message
            )

    def run(self, check_interval=300):  # 5 minutes default
        logging.info("Starting PurpleAir sensor monitoring")
        while True:
            try:
                self.check_sensor_status()
                time.sleep(check_interval)
            except Exception as e:
                logging.error(f"Error in monitoring loop: {e}")
                time.sleep(60)  # Wait a minute before retrying if there's an error

if __name__ == "__main__":
    monitor = PurpleAirMonitor()
    monitor.run()