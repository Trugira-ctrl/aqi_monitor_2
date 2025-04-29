/*
  # Add email field to sensors table

  1. Changes
    - Add email column to sensors table for storing responsible person's email
    - Update existing sensors with default email addresses
    - Add check constraint to ensure valid email format

  2. Security
    - No changes to existing security policies
*/

-- Add email column to sensors table
ALTER TABLE sensors ADD COLUMN IF NOT EXISTS email text;

-- Add check constraint for email format
ALTER TABLE sensors 
  ADD CONSTRAINT email_format_check 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Update existing sensors with default email addresses
UPDATE sensors SET email = CASE id
  WHEN '240075' THEN 'sensor240075@example.com'
  WHEN '240049' THEN 'sensor240049@example.com'
  WHEN '239257' THEN 'sensor239257@example.com'
  WHEN '239297' THEN 'sensor239297@example.com'
  WHEN '239307' THEN 'sensor239307@example.com'
  WHEN '239267' THEN 'sensor239267@example.com'
  WHEN '240595' THEN 'sensor240595@example.com'
  WHEN '239259' THEN 'sensor239259@example.com'
  WHEN '240067' THEN 'sensor240067@example.com'
  WHEN '222835' THEN 'sensor222835@example.com'
  WHEN '222887' THEN 'sensor222887@example.com'
  WHEN '222861' THEN 'sensor222861@example.com'
END;