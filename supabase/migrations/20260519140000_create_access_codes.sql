/*
  # Pro access codes for invite-only routes

  1. New Tables
    - access_codes
      - code (text, primary key)
      - agent_name (text)
      - tier ('basic' | 'plus')
      - is_active (boolean)
      - created_at (timestamptz)

  2. Security
    - RLS enabled
    - Anonymous SELECT allowed (client validates by exact code match)
*/

CREATE TABLE IF NOT EXISTS access_codes (
  code text PRIMARY KEY,
  agent_name text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('basic', 'plus')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read access codes for validation"
  ON access_codes FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO access_codes (code, agent_name, tier, is_active) VALUES
  ('BASIC-TEST01', '테스트 설계사 A', 'basic', true),
  ('PLUS-TEST01', '테스트 설계사 B', 'plus', true),
  ('PLUS-TEST02', '테스트 설계사 C', 'plus', true)
ON CONFLICT (code) DO NOTHING;
