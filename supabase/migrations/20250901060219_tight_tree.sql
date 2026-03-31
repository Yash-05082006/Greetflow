/*
  # Create Templates Table for GreetFlow System

  1. New Tables
    - `templates`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `category` (text, required)
      - `age_group` (text, required)
      - `content` (text, required) - HTML content
      - `description` (text, required)
      - `design` (jsonb, required) - Design configuration
      - `usage_count` (integer, default 0)
      - `is_custom` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `templates` table
    - Add policy for public access (admin system)

  3. Indexes
    - Index on category for filtering
    - Index on age_group for filtering
    - Index on usage_count for popularity sorting
*/

CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Birthday', 'Anniversary', 'Event Invitation', 'Greeting')),
  age_group text NOT NULL CHECK (age_group IN ('Children (8-15)', 'Teens (15-18)', 'Adults (18+)')),
  content text NOT NULL,
  description text NOT NULL,
  design jsonb NOT NULL DEFAULT '{}',
  usage_count integer DEFAULT 0,
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (admin system)
CREATE POLICY "Allow all operations for admin users"
  ON templates
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_age_group ON templates(age_group);
CREATE INDEX IF NOT EXISTS idx_templates_usage_count ON templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_templates_is_custom ON templates(is_custom);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();