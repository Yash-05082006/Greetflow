/*
  # Create Email Logs Table for GreetFlow System

  1. New Tables
    - `email_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `template_id` (uuid, foreign key to templates)
      - `recipient_email` (text, required)
      - `recipient_name` (text, required)
      - `subject` (text, required)
      - `content` (text, required)
      - `status` (text, required) - sent/failed/pending
      - `error_message` (text, optional)
      - `sent_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `email_logs` table
    - Add policy for public access (admin system)

  3. Foreign Keys
    - Link to users table
    - Link to templates table
*/

CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  template_id uuid REFERENCES templates(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  recipient_name text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'pending')) DEFAULT 'pending',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (admin system)
CREATE POLICY "Allow all operations for admin users"
  ON email_logs
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_id ON email_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);