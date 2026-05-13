/*
  Consultation: PDF URL + 추가 입력 컬럼
  Storage: consultation-reports 버킷 (공개 URL로 상담사 전달 단순화 — 운영 시 서명 URL로 전환 권장)
*/

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS report_url text,
  ADD COLUMN IF NOT EXISTS retirement_age integer,
  ADD COLUMN IF NOT EXISTS annual_salary bigint,
  ADD COLUMN IF NOT EXISTS monthly_expense bigint,
  ADD COLUMN IF NOT EXISTS birth_date text,
  ADD COLUMN IF NOT EXISTS location text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'consultation-reports',
  'consultation-reports',
  true,
  5242880,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = true, file_size_limit = 5242880, allowed_mime_types = ARRAY['application/pdf']::text[];

DROP POLICY IF EXISTS "consultation_reports_insert_anon" ON storage.objects;
CREATE POLICY "consultation_reports_insert_anon"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'consultation-reports');

DROP POLICY IF EXISTS "consultation_reports_insert_authenticated" ON storage.objects;
CREATE POLICY "consultation_reports_insert_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'consultation-reports');

DROP POLICY IF EXISTS "consultation_reports_select_public" ON storage.objects;
CREATE POLICY "consultation_reports_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'consultation-reports');
