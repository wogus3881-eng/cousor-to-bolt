/*
  # Trial 티어 추가 (인스타그램 체험판 배포용)

  1. Changes
    - access_codes.tier CHECK 제약을 ('basic', 'plus')에서
      ('trial', 'basic', 'plus')로 확장
  2. Seed
    - TRIAL-TEST01 ~ TRIAL-TEST05 코드 추가
*/

ALTER TABLE access_codes DROP CONSTRAINT IF EXISTS access_codes_tier_check;

ALTER TABLE access_codes
  ADD CONSTRAINT access_codes_tier_check CHECK (tier IN ('trial', 'basic', 'plus'));

INSERT INTO access_codes (code, agent_name, tier, is_active) VALUES
  ('TRIAL-TEST01', '체험판 1', 'trial', true),
  ('TRIAL-TEST02', '체험판 2', 'trial', true),
  ('TRIAL-TEST03', '체험판 3', 'trial', true),
  ('TRIAL-TEST04', '체험판 4', 'trial', true),
  ('TRIAL-TEST05', '체험판 5', 'trial', true)
ON CONFLICT (code) DO UPDATE SET
  agent_name = EXCLUDED.agent_name,
  tier = EXCLUDED.tier,
  is_active = EXCLUDED.is_active;
