INSERT INTO access_codes (code, agent_name, tier, is_active) VALUES
  ('BASIC-001', 'Basic 01', 'basic', true),
  ('BASIC-002', 'Basic 02', 'basic', true),
  ('BASIC-003', 'Basic 03', 'basic', true),
  ('BASIC-004', 'Basic 04', 'basic', true),
  ('BASIC-005', 'Basic 05', 'basic', true)
ON CONFLICT (code) DO UPDATE SET
  agent_name = EXCLUDED.agent_name,
  tier = EXCLUDED.tier,
  is_active = EXCLUDED.is_active;
