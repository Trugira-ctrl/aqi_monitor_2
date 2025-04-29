import { Resend } from 'npm:resend@3.2.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.8';
import Mustache from 'npm:mustache@4.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

interface SensorReport {
  sensor_id: string;
  last_seen: string;
  status: string;
  pm25?: number;
  temperature?: number;
  humidity?: number;
  error?: string;
  sensors?: {
    email: string;
  };
}

interface NotificationTemplate {
  id: string;
  type: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Resend
const resend = new Resend(Deno.env.get('RESEND_API_KEY')!);

// Offline threshold in seconds (12 hours)
const OFFLINE_THRESHOLD = 12 * 3600;

async function getNotificationTemplate(type: string): Promise<NotificationTemplate | null> {
  try {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('type', type)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to fetch notification template:', error);
    return null;
  }
}

async function recordNotification(
  templateId: string,
  type: string,
  priority: string,
  subject: string,
  content: string,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        template_id: templateId,
        type,
        priority,
        subject,
        content,
        metadata
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to record notification:', error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: corsHeaders
      }
    );
  }

  try {
    // Get inactive sensors and their associated emails
    const { data: inactiveSensors, error: queryError } = await supabase
      .from('sensor_reports')
      .select(`
        sensor_id,
        last_seen,
        status,
        pm25,
        temperature,
        humidity,
        error,
        sensors (
          email
        )
      `)
      .eq('status', 'inactive')
      .order('last_seen', { ascending: false });

    if (queryError) {
      throw new Error(`Database query error: ${queryError.message}`);
    }

    if (!inactiveSensors || inactiveSensors.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No inactive sensors found' }),
        { headers: corsHeaders }
      );
    }

    // Get notification template
    const template = await getNotificationTemplate('sensor_offline');
    if (!template) {
      throw new Error('Notification template not found');
    }

    // Group sensors by email
    const sensorsByEmail = inactiveSensors.reduce((acc, sensor) => {
      if (!sensor.sensors?.email) return acc;
      
      const email = sensor.sensors.email;
      if (!acc[email]) acc[email] = [];
      
      const currentTime = Date.now();
      const lastSeenTime = new Date(sensor.last_seen).getTime();
      const offlineDuration = (currentTime - lastSeenTime) / 1000;

      // Only include sensors that have been offline for more than the threshold
      if (offlineDuration > OFFLINE_THRESHOLD) {
        acc[email].push({
          id: sensor.sensor_id,
          lastSeen: new Date(sensor.last_seen).toLocaleString(),
          hoursOffline: Math.round(offlineDuration / 3600 * 10) / 10,
          pm25: sensor.pm25,
          temperature: sensor.temperature,
          humidity: sensor.humidity
        });
      }
      
      return acc;
    }, {} as Record<string, any[]>);

    let emailsSent = 0;
    const emailPromises = Object.entries(sensorsByEmail).map(async ([email, sensors]) => {
      if (sensors.length === 0) return;

      try {
        // Prepare template data
        const templateData = {
          sensors,
          dashboardUrl: Deno.env.get('APP_URL') || 'https://your-dashboard-url.com'
        };

        // Render email content
        const subject = Mustache.render(template.subject, templateData);
        const htmlContent = Mustache.render(template.html_content, templateData);
        const textContent = Mustache.render(template.text_content, templateData);

        // Send email notification
        const { data: emailResponse, error: emailError } = await resend.emails.send({
          from: 'AQI Monitor <notifications@sandtech.dev>',
          to: [email],
          subject,
          html: htmlContent,
          text: textContent,
        });

        if (emailError) throw emailError;

        emailsSent++;

        // Record the notification
        await recordNotification(
          template.id,
          'sensor_offline',
          'high',
          subject,
          htmlContent,
          {
            sensors,
            emailId: emailResponse?.id,
            recipientEmail: email
          }
        );

        // Record in sensor_notifications
        await supabase
          .from('sensor_notifications')
          .insert({
            sensor_ids: sensors.map(s => s.id),
            sent_at: new Date().toISOString(),
          });

        return { email, success: true };
      } catch (error) {
        console.error(`Failed to process notification for ${email}:`, error);
        return { email, success: false, error };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const successfulEmails = results.filter(
      (result): result is PromiseFulfilledResult<{ email: string; success: true }> =>
        result.status === 'fulfilled' && result.value?.success
    );

    return new Response(
      JSON.stringify({ 
        message: 'Notifications processed',
        emailCount: emailsSent,
        totalEmails: Object.keys(sensorsByEmail).length,
        successfulEmails: successfulEmails.length
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Notification error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});