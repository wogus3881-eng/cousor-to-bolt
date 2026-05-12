/*
  # Create consultations table

  1. New Tables
    - `consultations`
      - `id` (uuid, primary key)
      - `name` (text) - applicant name
      - `phone` (text) - contact number
      - `preferred_time` (text) - preferred consultation time
      - `current_age` (integer) - user's current age
      - `retirement_age` (integer) - desired retirement age
      - `annual_salary` (bigint) - annual salary in KRW
      - `monthly_expense` (bigint) - desired monthly living expense in KRW
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Allow authenticated and anonymous inserts (public form submission)
    - No read policy for public (admin-only via service role)
*/

CREATE TABLE IF NOT EXISTS consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  preferred_time text NOT NULL,
  current_age integer,
  retirement_age integer,
  annual_salary bigint,
  monthly_expense bigint,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a consultation"
  ON consultations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
