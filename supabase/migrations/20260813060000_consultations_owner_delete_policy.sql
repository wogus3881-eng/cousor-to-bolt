/*
  # 설계사 본인 리드 삭제 허용

  1. Changes
    - consultations에 DELETE 정책 추가: agent_id가 본인의 profiles.referral_code와
      일치하는 행만 삭제 가능 (Pro 전용 "내 고객용 링크" 리드 관리 화면, /leads 페이지에서 사용)
*/

CREATE POLICY "Users can delete own leads"
  ON consultations FOR DELETE
  TO authenticated
  USING (agent_id = (SELECT referral_code FROM profiles WHERE id = auth.uid()));
