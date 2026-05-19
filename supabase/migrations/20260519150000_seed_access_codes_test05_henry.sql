/*
  # Additional Pro access codes: PLUS-TEST01~05 and Henry
*/

INSERT INTO access_codes (code, agent_name, tier, is_active) VALUES
  ('PLUS-TEST01', '테스트 설계사 1', 'plus', true),
  ('PLUS-TEST02', '테스트 설계사 2', 'plus', true),
  ('PLUS-TEST03', '테스트 설계사 3', 'plus', true),
  ('PLUS-TEST04', '테스트 설계사 4', 'plus', true),
  ('PLUS-TEST05', '테스트 설계사 5', 'plus', true),
  ('HENRY', 'Henry', 'plus', true)
ON CONFLICT (code) DO UPDATE SET
  agent_name = EXCLUDED.agent_name,
  tier = EXCLUDED.tier,
  is_active = EXCLUDED.is_active;
