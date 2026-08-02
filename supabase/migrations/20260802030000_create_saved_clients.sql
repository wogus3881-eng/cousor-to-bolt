/*
  # Pro 전용 고객 정보 저장 · 불러오기

  1. New Tables
    - saved_clients
      - id (uuid, primary key)
      - user_id (uuid, references auth.users) — 저장한 설계사 본인
      - label (text) — 고객 구분용 이름/메모
      - inputs (jsonb) — SimulatorInputs 스냅샷
      - created_at, updated_at (timestamptz)

  2. Security
    - RLS enabled
    - 본인 행만 CRUD 가능 (다른 설계사가 저장한 고객정보는 볼 수 없음)
*/

CREATE TABLE IF NOT EXISTS saved_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  inputs jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE saved_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved clients"
  ON saved_clients FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS saved_clients_user_id_idx ON saved_clients (user_id, updated_at DESC);
