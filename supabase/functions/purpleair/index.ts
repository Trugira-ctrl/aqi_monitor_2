const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface PurpleAirError {
  error: string;
  description?: string;
}

interface SensorData {
  sensor?: {
    last_seen?: number;
    latitude?: number;
    longitude?: number;
  };
}

// Mapping of sensor IDs to their read keys
const sensorReadKeys: Record<string, string> = {
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
  '240593': '6AMYN258IKYWBKM4', // Updated key for 240593
  // New sensors
  '240083': '8PI5WVCSMHBTTFEE',
  '239301': 'SPW3K6Y0UYZPCCGX',
  '240063': '1H1DKG9QJAHBV4R5',
  '235227': 'IZ38M2AXG8JQTL71',
  '240041': '9M26D1US41I4TIRZ'
};

const PURPLEAIR_API_KEY = '34F83441-0783-11F0-A3B4-42010A800010';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 10;
const requestTimestamps: number[] = [];

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Sleep function for delay between retries
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to check and update rate limit
function checkRateLimit(): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Remove timestamps outside the current window
  while (requestTimestamps.length > 0 && requestTimestamps[0] < windowStart) {
    requestTimestamps.shift();
  }
  
  // Check if we're within the rate limit
  if (requestTimestamps.length < MAX_REQUESTS_PER_WINDOW) {
    requestTimestamps.push(now);
    return true;
  }
  
  return false;
}

// Function to fetch data from PurpleAir API with retries and rate limiting
async function fetchPurpleAirData(url: string, apiKey: string, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Check rate limit before making request
      if (!checkRateLimit()) {
        // If rate limited, wait for the window to reset
        const waitTime = RATE_LIMIT_WINDOW - (Date.now() - requestTimestamps[0]);
        console.log(`Rate limit reached, waiting ${waitTime}ms...`);
        await sleep(waitTime);
        
        // Recheck rate limit after waiting
        if (!checkRateLimit()) {
          throw new Error('Rate limit exceeded');
        }
      }

      console.log(`Attempt ${attempt}: Making request to PurpleAir API: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      console.log(`Attempt ${attempt}: Response status: ${response.status}`);
      console.log(`Attempt ${attempt}: Response headers:`, Object.fromEntries(response.headers.entries()));

      // If we get a 429, wait longer before retrying
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        const delay = retryAfter * 1000;
        console.log(`Rate limited by PurpleAir API, waiting ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      // If it's not a 500 error, return the response immediately
      if (response.status !== 500) {
        return response;
      }

      // If it's the last attempt, return the error response
      if (attempt === retries) {
        return response;
      }

      // Calculate delay with exponential backoff
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed with status 500, retrying in ${delay}ms...`);
      await sleep(delay);
    } catch (error) {
      // Log detailed error information
      console.error(`Error in attempt ${attempt}:`, {
        error,
        message: error.message,
        name: error.name,
        cause: error.cause,
        stack: error.stack
      });

      // If it's the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const url = new URL(req.url);
    const sensorId = url.searchParams.get('sensorId');

    if (!sensorId) {
      return new Response(
        JSON.stringify({ error: 'Sensor ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const readKey = sensorReadKeys[sensorId];
    if (!readKey) {
      console.error(`No read key found for sensor ${sensorId}`);
      return new Response(
        JSON.stringify({
          error: 'Invalid sensor ID',
          details: `No read key available for sensor ${sensorId}`
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update the URL to include only the fields we need
    const purpleAirUrl = `https://api.purpleair.com/v1/sensors/${sensorId}?fields=last_seen,latitude,longitude&read_key=${readKey}`;
    console.log(`Fetching data for sensor ${sensorId}`);

    const purpleAirResponse = await fetchPurpleAirData(purpleAirUrl, PURPLEAIR_API_KEY);
    const contentType = purpleAirResponse.headers.get('content-type') || '';

    if (!purpleAirResponse.ok) {
      let errorDetails: PurpleAirError;
      
      if (contentType.includes('application/json')) {
        try {
          errorDetails = await purpleAirResponse.json();
        } catch {
          errorDetails = {
            error: 'Failed to parse error response',
            description: 'Invalid JSON in error response'
          };
        }
      } else {
        errorDetails = {
          error: 'PurpleAir API temporarily unavailable',
          description: 'The service is experiencing issues. Please try again later.'
        };
      }

      console.error(`PurpleAir API error for sensor ${sensorId}:`, errorDetails);

      return new Response(
        JSON.stringify({
          error: `PurpleAir API error: ${purpleAirResponse.status}`,
          details: errorDetails.description || errorDetails.error
        }),
        {
          status: purpleAirResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let data: SensorData;
    try {
      data = await purpleAirResponse.json();
      console.log(`Raw PurpleAir response for sensor ${sensorId}:`, JSON.stringify(data, null, 2));
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }

      // Ensure sensor data exists with default values
      if (!data.sensor) {
        data.sensor = {};
      }

      // Set default values for required fields
      data.sensor.last_seen = data.sensor.last_seen || 0;
      data.sensor.latitude = data.sensor.latitude || 0;
      data.sensor.longitude = data.sensor.longitude || 0;

      console.log(`Successfully fetched data for sensor ${sensorId}`);
      
      return new Response(
        JSON.stringify(data),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error(`Error parsing response for sensor ${sensorId}:`, error);
      return new Response(
        JSON.stringify({
          error: 'Response parsing error',
          details: 'Failed to parse PurpleAir API response',
          sensor_id: sensorId
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Edge function error:', {
      error: error,
      message: error.message,
      name: error.name,
      cause: error.cause,
      stack: error.stack
    });
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        name: error.name
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});