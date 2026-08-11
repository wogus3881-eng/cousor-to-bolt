/*
  # 설계사 본인 리드 조회 허용

  1. Changes
    - consultations에 SELECT 정책 추가: agent_id가 본인의 profiles.referral_code와
      일치하는 행만 조회 가능 (Pro 전용 "내 고객용 링크" 기능, /leads 페이지에서 사용)
    - 기존 anon INSERT 정책은 그대로 유지되며, 이 정책은 조회 권한만 추가함
*/

CREATE POLICY "Users can read own leads"
  ON consultations FOR SELECT
  TO authenticated
  USING (agent_id = (SELECT referral_code FROM profiles WHERE id = auth.uid()));
