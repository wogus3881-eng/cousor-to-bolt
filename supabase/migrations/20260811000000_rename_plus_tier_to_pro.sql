/*
  # tier 값 'plus' → 'pro' 이름 변경

  화면에는 이미 "Pro"로 표시되는데 DB/코드에는 'plus'로 저장되어 있어 혼동을 일으켰습니다.
  화면 라벨과 저장값을 일치시킵니다.

  1. Changes
    - profiles.tier: 기존 'plus' 데이터를 'pro'로 변경 후, CHECK 제약을 ('trial','basic','pro')로 교체
    - access_codes.tier: 기존 'plus' 데이터를 'pro'로 변경 후, CHECK 제약을 ('trial','basic','pro')로 교체
      (코드 문자열 자체, 예: 'PLUS-TEST01', 'HENRY'는 그대로 둡니다 — 이미 배포된 코드라 값만 안 바뀌면 무방)
*/

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_tier_check;
UPDATE profiles SET tier = 'pro' WHERE tier = 'plus';
ALTER TABLE profiles ADD CONSTRAINT profiles_tier_check CHECK (tier IN ('trial', 'basic', 'pro'));

ALTER TABLE access_codes DROP CONSTRAINT IF EXISTS access_codes_tier_check;
UPDATE access_codes SET tier = 'pro' WHERE tier = 'plus';
ALTER TABLE access_codes ADD CONSTRAINT access_codes_tier_check CHECK (tier IN ('trial', 'basic', 'pro'));
