/*
  # 회원가입 로그인 + 동시 세션 1개 제한

  1. New Tables
    - profiles
      - id (uuid, primary key, references auth.users)
      - tier ('basic' | 'plus') — 관리자(service role)만 변경 가능, 본인은 읽기만 가능
      - display_name (text)
      - created_at (timestamptz)
    - active_sessions
      - user_id (uuid, primary key, references auth.users)
      - session_token (text) — 로그인할 때마다 새로 발급, 새 로그인이 이전 로그인을 덮어씀
      - updated_at (timestamptz)

  2. Security
    - RLS enabled on both tables
    - profiles: 본인 행만 SELECT 가능. INSERT는 본인 id로만 가능(가입 시 1회).
      tier는 UPDATE 정책을 아예 만들지 않아 클라이언트에서 셀프 업그레이드 불가 —
      Plus 등급 부여는 Supabase 대시보드 또는 service role로만 가능.
    - active_sessions: 본인 행만 SELECT/INSERT/UPDATE 가능. 로그인 시 새 세션
      토큰으로 덮어써서, 다른 기기의 이전 로그인을 자동으로 무효화합니다.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic', 'plus')),
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile on signup"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 의도적으로 UPDATE 정책 없음: tier(등급)는 본인이 스스로 못 올리게 막기 위함.
-- 등급 변경은 Supabase 대시보드에서 관리자가 직접 처리하세요.

CREATE TABLE IF NOT EXISTS active_sessions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own session"
  ON active_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session"
  ON active_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session"
  ON active_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
