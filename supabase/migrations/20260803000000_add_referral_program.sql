/*
  # 추천인 코드 프로그램

  1. Changes
    - profiles.referral_code (text, unique) — 본인 고유 추천 코드, 가입 시 자동 발급
    - profiles.referred_by_code (text, nullable) — 가입 시 입력한 추천인의 코드
      (존재하지 않는 코드를 입력하면 무시하고 NULL로 저장)
    - handle_new_user() 트리거: 신규 가입 시 referral_code 자동 생성,
      raw_user_meta_data->>'ref' 값이 유효한 기존 추천코드면 referred_by_code로 저장

  2. New Functions
    - generate_referral_code(): 6자리 랜덤 코드 생성 (충돌 시 재시도)
    - get_my_referral_stats(): 본인의 추천코드와 지금까지 추천한 가입자 수를 반환.
      profiles RLS는 본인 행만 SELECT 가능하므로, 몇 명을 추천했는지 세려면
      이 SECURITY DEFINER 함수를 통해서만 가능 (다른 사람 행을 직접 조회하지는 못함).

  3. Notes
    - 결제·구독은 현재 이메일 문의 기반 수동 처리이며 자동 결제 시스템이 없습니다.
      "다음달 50% 할인" 같은 추천 보상은 이 컬럼으로 추천 관계만 기록해두고,
      실제 할인 적용은 결제 처리 시 관리자가 Supabase 대시보드에서 profiles.referred_by_code를
      보고 수동으로 적용해야 합니다.
*/

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  already_exists boolean;
BEGIN
  LOOP
    code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO already_exists;
    EXIT WHEN NOT already_exists;
  END LOOP;
  RETURN code;
END;
$$;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by_code text;

UPDATE profiles SET referral_code = public.generate_referral_code() WHERE referral_code IS NULL;

ALTER TABLE profiles ALTER COLUMN referral_code SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_referral_code_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_referral_code_key UNIQUE (referral_code);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS profiles_referred_by_code_idx ON profiles (referred_by_code);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  ref_input text;
  ref_valid text;
BEGIN
  ref_input := upper(trim(NEW.raw_user_meta_data->>'ref'));
  IF ref_input IS NOT NULL AND ref_input <> '' THEN
    SELECT referral_code INTO ref_valid FROM public.profiles WHERE referral_code = ref_input;
  END IF;

  INSERT INTO public.profiles (id, display_name, tier, referral_code, referred_by_code)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'preferred_username',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1),
      'user'
    ),
    'trial',
    public.generate_referral_code(),
    ref_valid
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_referral_stats()
RETURNS TABLE(referral_code text, referred_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.referral_code, (SELECT count(*) FROM public.profiles r WHERE r.referred_by_code = p.referral_code)
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_referral_stats() TO authenticated;
