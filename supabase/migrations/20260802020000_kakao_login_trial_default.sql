/*
  # 카카오 로그인 도입 - Trial 티어를 신규 가입 기본값으로

  1. Changes
    - profiles.tier CHECK 제약에 'trial' 추가
    - profiles.tier 기본값을 'basic' -> 'trial'로 변경 (카카오로 처음 로그인하면 Trial부터 시작)
    - handle_new_user() 트리거 함수: 신규 가입 시 tier를 'trial'로 부여하고,
      이메일이 없는 소셜 로그인(카카오 등)도 대비해 닉네임/이메일 순으로 표시 이름 결정
*/

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_tier_check CHECK (tier IN ('trial', 'basic', 'plus'));
ALTER TABLE profiles ALTER COLUMN tier SET DEFAULT 'trial';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, tier)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'preferred_username',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1),
      'user'
    ),
    'trial'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;
