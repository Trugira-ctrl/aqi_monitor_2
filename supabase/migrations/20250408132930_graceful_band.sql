/*
  # Notification System Implementation

  1. New Tables
    - `notification_preferences`
      - User preferences for different notification types
      - Controls opt-in/opt-out settings
    
    - `notification_templates`
      - Predefined templates for different notification types
      - Supports HTML and plain text formats

    - `notifications`
      - Stores all sent notifications
      - Tracks read/unread status
      - Links to templates and preferences

  2. Security
    - Enable RLS on all tables
    - Add policies for public access where needed
*/

-- Create enum for notification types
CREATE TYPE notification_type AS ENUM (
  'sensor_offline',
  'sensor_error',
  'system_update',
  'maintenance'
);

-- Create enum for notification priority
CREATE TYPE notification_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  text_content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  type notification_type NOT NULL,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(email, type)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES notification_templates(id),
  type notification_type NOT NULL,
  priority notification_priority NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access on templates"
  ON notification_templates
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access on preferences"
  ON notification_preferences
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert/update on preferences"
  ON notification_preferences
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access on notifications"
  ON notifications
  FOR SELECT
  TO public
  USING (true);

-- Insert default templates
INSERT INTO notification_templates (type, name, subject, html_content, text_content) 
VALUES 
(
  'sensor_offline',
  'Sensor Offline Alert',
  'Alert: Sensors Offline',
  '
  <h1>⚠️ ALERT: Sensors Offline</h1>
  <p>The following sensors have been offline for more than 3 hours:</p>
  <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
    <thead>
      <tr style="background-color: #f3f4f6;">
        <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Sensor ID</th>
        <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Last Seen</th>
        <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Hours Offline</th>
      </tr>
    </thead>
    <tbody>
      {{#sensors}}
      <tr>
        <td style="padding: 12px; border: 1px solid #e5e7eb;">{{id}}</td>
        <td style="padding: 12px; border: 1px solid #e5e7eb;">{{lastSeen}}</td>
        <td style="padding: 12px; border: 1px solid #e5e7eb;">{{hoursOffline}}</td>
      </tr>
      {{/sensors}}
    </tbody>
  </table>
  <p style="margin-top: 20px;">
    <a href="{{dashboardUrl}}" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px;">
      View Dashboard
    </a>
  </p>
  ',
  'ALERT: Sensors Offline

The following sensors have been offline for more than 3 hours:

{{#sensors}}
- Sensor {{id}}
  Last seen: {{lastSeen}}
  Hours offline: {{hoursOffline}}

{{/sensors}}

View dashboard: {{dashboardUrl}}'
),
(
  'sensor_error',
  'Sensor Error Alert',
  'Alert: Sensor Errors Detected',
  '
  <h1>⚠️ ALERT: Sensor Errors Detected</h1>
  <p>The following sensors are reporting errors:</p>
  <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
    <thead>
      <tr style="background-color: #f3f4f6;">
        <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Sensor ID</th>
        <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Error</th>
        <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Time</th>
      </tr>
    </thead>
    <tbody>
      {{#sensors}}
      <tr>
        <td style="padding: 12px; border: 1px solid #e5e7eb;">{{id}}</td>
        <td style="padding: 12px; border: 1px solid #e5e7eb;">{{error}}</td>
        <td style="padding: 12px; border: 1px solid #e5e7eb;">{{time}}</td>
      </tr>
      {{/sensors}}
    </tbody>
  </table>
  <p style="margin-top: 20px;">
    <a href="{{dashboardUrl}}" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px;">
      View Dashboard
    </a>
  </p>
  ',
  'ALERT: Sensor Errors Detected

The following sensors are reporting errors:

{{#sensors}}
- Sensor {{id}}
  Error: {{error}}
  Time: {{time}}

{{/sensors}}

View dashboard: {{dashboardUrl}}'
),
(
  'system_update',
  'System Update Notification',
  'System Update: {{title}}',
  '
  <h1>🔄 System Update: {{title}}</h1>
  <div style="margin: 20px 0;">
    <p>{{message}}</p>
    {{#actions}}
    <div style="margin-top: 10px;">
      <a href="{{url}}" style="background-color: #4f46e5; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">
        {{label}}
      </a>
    </div>
    {{/actions}}
  </div>
  ',
  'System Update: {{title}}

{{message}}

{{#actions}}
{{label}}: {{url}}
{{/actions}}'
),
(
  'maintenance',
  'Maintenance Notification',
  'Scheduled Maintenance: {{title}}',
  '
  <h1>🔧 Scheduled Maintenance: {{title}}</h1>
  <div style="margin: 20px 0;">
    <p><strong>When:</strong> {{scheduledTime}}</p>
    <p><strong>Duration:</strong> {{duration}}</p>
    <p><strong>Impact:</strong> {{impact}}</p>
    <p>{{message}}</p>
  </div>
  ',
  'Scheduled Maintenance: {{title}}

When: {{scheduledTime}}
Duration: {{duration}}
Impact: {{impact}}

{{message}}'
);