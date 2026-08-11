/*
  # 설계사 공개 프로필 (고객용 링크 소개 페이지용)

  1. Changes
    - profiles.agent_title (text, nullable) — 소속/직함
    - profiles.agent_bio (text, nullable) — 소개글

  2. New Functions
    - update_my_agent_profile(name, title, bio): 본인 프로필만 수정 가능한
      SECURITY DEFINER 함수. tier 컬럼은 이 함수로 손댈 수 없어서 기존
      "본인이 등급을 스스로 못 올린다"는 원칙이 그대로 유지됨.
    - get_agent_public_profile(code): referral_code로 이름/소속/소개글만
      공개 조회. 익명 방문자(고객)가 소개 페이지를 보기 위해 필요하며,
      id·tier 등 다른 정보는 노출하지 않음.

  3. Security
    - profiles 테이블 자체에는 여전히 UPDATE RLS 정책이 없음(직접 수정 불가).
      두 함수를 통해서만, 그것도 본인 행/공개 필드만 접근 가능.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agent_title text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agent_bio text;

CREATE OR REPLACE FUNCTION public.update_my_agent_profile(
  p_display_name text,
  p_agent_title text,
  p_agent_bio text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET
    display_name = COALESCE(NULLIF(trim(p_display_name), ''), display_name),
    agent_title = NULLIF(trim(p_agent_title), ''),
    agent_bio = NULLIF(trim(p_agent_bio), '')
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_my_agent_profile(text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_agent_public_profile(p_code text)
RETURNS TABLE(display_name text, agent_title text, agent_bio text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT display_name, agent_title, agent_bio
  FROM public.profiles
  WHERE referral_code = upper(trim(p_code))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_agent_public_profile(text) TO anon, authenticated;
