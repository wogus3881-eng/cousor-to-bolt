/*
  # 설계사 프로필 사진

  1. Storage
    - agent-photos 버킷 생성 (public read)
    - 본인 폴더(userId/...)에만 업로드·수정·삭제 가능하도록 정책 추가

  2. Changes
    - profiles.agent_photo_url (text, nullable)
    - update_my_agent_profile / get_agent_public_profile 함수에 사진 URL 파라미터·컬럼 추가
      (반환 타입이 바뀌므로 기존 함수는 DROP 후 재생성)
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-photos', 'agent-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read agent photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'agent-photos');

CREATE POLICY "Users can upload own agent photo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'agent-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own agent photo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'agent-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own agent photo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'agent-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agent_photo_url text;

DROP FUNCTION IF EXISTS public.update_my_agent_profile(text, text, text);

CREATE OR REPLACE FUNCTION public.update_my_agent_profile(
  p_display_name text,
  p_agent_title text,
  p_agent_bio text,
  p_agent_photo_url text
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
    agent_bio = NULLIF(trim(p_agent_bio), ''),
    agent_photo_url = NULLIF(trim(p_agent_photo_url), '')
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_my_agent_profile(text, text, text, text) TO authenticated;

DROP FUNCTION IF EXISTS public.get_agent_public_profile(text);

CREATE OR REPLACE FUNCTION public.get_agent_public_profile(p_code text)
RETURNS TABLE(display_name text, agent_title text, agent_bio text, agent_photo_url text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT display_name, agent_title, agent_bio, agent_photo_url
  FROM public.profiles
  WHERE referral_code = upper(trim(p_code))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_agent_public_profile(text) TO anon, authenticated;
