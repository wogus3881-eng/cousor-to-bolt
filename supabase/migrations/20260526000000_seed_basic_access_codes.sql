/*
  # Basic 접근 코드 5개 추가 시드
  BASIC-TEST01 ~ BASIC-TEST05
*/

INSERT INTO access_codes (code, agent_name, tier, is_active) VALUES
  ('BASIC-TEST01', '테스트 Basic 1', 'basic', true),
  ('BASIC-TEST02', '테스트 Basic 2', 'basic', true),
  ('BASIC-TEST03', '테스트 Basic 3', 'basic', true),
  ('BASIC-TEST04', '테스트 Basic 4', 'basic', true),
  ('BASIC-TEST05', '테스트 Basic 5', 'basic', true)
ON CONFLICT (code) DO UPDATE SET
  agent_name = EXCLUDED.agent_name,
  tier = EXCLUDED.tier,
  is_active = EXCLUDED.is_active;
