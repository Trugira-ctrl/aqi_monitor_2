import 'dotenv/config';
import fs from 'fs';
import { setTimeout } from 'timers/promises';
import fetch from 'node-fetch';

class PurpleAirMonitor {
  constructor() {
    this.apiKey = process.env.PURPLEAIR_API_KEY;
    this.sensorIndexes = [
      '240075', '240049', '239257', '239297', 
      '239307', '239267', '240595', '239259', 
      '240067', '222835', '222887'
    ];
    this.baseUrl = 'https://api.purpleair.com/v1/sensors';
    this.supabaseUrl = process.env.VITE_SUPABASE_URL;
    this.supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    // Configure logging
    this.logFile = 'sensor_monitor.log';
    this.log('PurpleAir Monitor initialized');
    this.log(`Monitoring ${this.sensorIndexes.length} sensors`);
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${level} - ${message}\n`;
    
    // Log to console
    console.log(logMessage.trim());
    
    // Log to file
    fs.appendFileSync(this.logFile, logMessage);
  }

  async getSensorData(sensorIndex) {
    try {
      const url = `${this.baseUrl}/${sensorIndex}`;
      const response = await fetch(url, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.log(`Error fetching data for sensor ${sensorIndex}: ${error.message}`, 'ERROR');
      return null;
    }
  }

  async checkSensorStatus() {
    const currentTime = Date.now() / 1000; // Convert to Unix timestamp
    const offlineSensors = [];

    for (const sensorIndex of this.sensorIndexes) {
      const data = await this.getSensorData(sensorIndex);
      if (!data) {
        this.log(`Failed to get data for sensor ${sensorIndex}`, 'ERROR');
        continue;
      }

      const sensor = data.sensor || {};
      const lastSeen = sensor.last_seen;
      const name = sensor.name || `Sensor ${sensorIndex}`;

      if (lastSeen) {
        const timeDifference = currentTime - lastSeen;
        const hoursOffline = timeDifference / 3600;

        if (hoursOffline > 3) {
          offlineSensors.push({
            name,
            index: sensorIndex,
            hours: Math.round(hoursOffline * 10) / 10,
            lastSeen: new Date(lastSeen * 1000).toISOString()
          });
          this.log(`Sensor ${name} (ID: ${sensorIndex}) hasn't reported in ${Math.round(hoursOffline * 10) / 10} hours`, 'WARNING');
        }
      } else {
        this.log(`No last_seen data for sensor ${sensorIndex}`, 'WARNING');
      }
    }

    if (offlineSensors.length > 0) {
      // Trigger email notification via Edge Function
      try {
        const response = await fetch(`${this.supabaseUrl}/functions/v1/notify`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to send notification: ${response.status}`);
        }

        const result = await response.json();
        this.log(`Notification sent successfully: ${JSON.stringify(result)}`, 'INFO');
      } catch (error) {
        this.log(`Failed to send notification: ${error.message}`, 'ERROR');
      }
    }
  }

  async run(checkInterval = 300000) { // 5 minutes default
    this.log('Starting PurpleAir sensor monitoring');
    
    while (true) {
      try {
        await this.checkSensorStatus();
        await setTimeout(checkInterval);
      } catch (error) {
        this.log(`Error in monitoring loop: ${error.message}`, 'ERROR');
        await setTimeout(60000); // Wait a minute before retrying if there's an error
      }
    }
  }
}

// Start the monitor
const monitor = new PurpleAirMonitor();
monitor.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});