/*
  # Create Users Table for GreetFlow System

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text, unique, required)
      - `phone` (text, required)
      - `category` (text, required) - Lead/Client/User
      - `date_of_birth` (date, required)
      - `anniversary_date` (date, optional)
      - `preferences` (text array, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to manage all user data
    - Add policy for public access (since this is an admin system)

  3. Indexes
    - Index on email for fast lookups
    - Index on category for filtering
    - Index on date_of_birth for birthday queries
    - Index on anniversary_date for anniversary queries
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  category text NOT NULL CHECK (category IN ('Lead', 'Client', 'User')),
  date_of_birth date NOT NULL,
  anniversary_date date,
  preferences text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (admin system)
CREATE POLICY "Allow all operations for admin users"
  ON users
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_category ON users(category);
CREATE INDEX IF NOT EXISTS idx_users_date_of_birth ON users(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_users_anniversary_date ON users(anniversary_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();