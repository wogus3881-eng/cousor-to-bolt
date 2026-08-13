/*
  # 강의용 임시 Pro 접근코드 11개

  1. Changes
    - 2026-08-13 강의 참석자용 Pro 접근코드 11개 시딩 (LEC0813-01 ~ LEC0813-11)
    - 강의 종료 후에는 각 코드의 is_active를 false로 바꾸면 즉시 비활성화됨
      (예: UPDATE access_codes SET is_active = false WHERE code LIKE 'LEC0813-%';)
*/

INSERT INTO access_codes (code, agent_name, tier, is_active) VALUES
  ('LEC0813-01', '2026-08-13 강의 참석자', 'pro', true),
  ('LEC0813-02', '2026-08-13 강의 참석자', 'pro', true),
  ('LEC0813-03', '2026-08-13 강의 참석자', 'pro', true),
  ('LEC0813-04', '2026-08-13 강의 참석자', 'pro', true),
  ('LEC0813-05', '2026-08-13 강의 참석자', 'pro', true),
  ('LEC0813-06', '2026-08-13 강의 참석자', 'pro', true),
  ('LEC0813-07', '2026-08-13 강의 참석자', 'pro', true),
  ('LEC0813-08', '2026-08-13 강의 참석자', 'pro', true),
  ('LEC0813-09', '2026-08-13 강의 참석자', 'pro', true),
  ('LEC0813-10', '2026-08-13 강의 참석자', 'pro', true),
  ('LEC0813-11', '2026-08-13 강의 참석자', 'pro', true)
ON CONFLICT (code) DO NOTHING;
