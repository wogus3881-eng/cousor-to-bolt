/*
  # 회원가입 시 profiles 자동 생성 트리거

  기존에는 클라이언트(브라우저)에서 회원가입 직후 profiles 테이블에 직접
  INSERT를 시도했는데, 이메일 인증이 켜져 있는 프로젝트에서는 가입 직후
  아직 로그인 세션이 없는 상태라 RLS 정책(authenticated만 INSERT 가능)에
  막혀 조용히 실패하는 문제가 있었습니다.

  이 트리거는 auth.users에 새 계정이 생기는 순간(이메일 인증 여부와 무관하게)
  DB 자체가 SECURITY DEFINER 권한으로 profiles row를 만들어주므로,
  클라이언트의 로그인 상태와 상관없이 항상 안정적으로 생성됩니다.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, tier)
  VALUES (NEW.id, split_part(NEW.email, '@', 1), 'basic')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 이미 가입했지만 profiles row가 없는 기존 계정도 지금 즉시 채워넣기
INSERT INTO public.profiles (id, display_name, tier)
SELECT id, split_part(email, '@', 1), 'basic'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
