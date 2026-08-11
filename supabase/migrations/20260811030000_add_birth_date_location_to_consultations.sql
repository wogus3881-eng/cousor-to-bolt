/*
  # consultations에 birth_date, location 컬럼 추가

  ConsultationForm이 제출 시 이 두 값을 함께 저장하려고 시도하지만
  테이블에 컬럼이 없어 매번 insert가 조용히 실패하고 있었음(콘솔 warn만 찍힘).
  그래서 상담 신청이 완료돼도 consultations에는 한 건도 쌓이지 않았음.

  1. Changes
    - consultations.birth_date (text, nullable)
    - consultations.location (text, nullable)
*/

ALTER TABLE consultations ADD COLUMN IF NOT EXISTS birth_date text;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS location text;
