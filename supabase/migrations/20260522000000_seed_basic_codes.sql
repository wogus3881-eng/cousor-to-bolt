/*
  # Seed Basic access codes and Henry plus code
*/

INSERT INTO access_codes (code, tier, agent_name, is_active) VALUES
('BASIC-001', 'basic', 'Basic 01', true),
('BASIC-002', 'basic', 'Basic 02', true),
('BASIC-003', 'basic', 'Basic 03', true),
('BASIC-004', 'basic', 'Basic 04', true),
('BASIC-005', 'basic', 'Basic 05', true),
('HENRY', 'plus', 'Henry 전용', true)
ON CONFLICT (code) DO NOTHING;
