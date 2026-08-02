/*
  # 저장된 고객에 월 고정비 스냅샷 추가

  1. Changes
    - saved_clients.fixed_costs (jsonb, not null, default 전부 0) 컬럼 추가
      Step1의 월 고정비 입력값(주거비/통신비/대출/차량/생활비/기타)을
      SimulatorInputs와 별도로 저장 — 시뮬레이션 계산 입력이 아니라
      상담 화면 표시용 스냅샷이라 별도 컬럼으로 분리.
    - 기존 저장된 고객 행은 기본값(전부 0)으로 채워짐
*/

ALTER TABLE saved_clients
  ADD COLUMN IF NOT EXISTS fixed_costs jsonb NOT NULL
  DEFAULT '{"housing":0,"telecom":0,"loan":0,"car":0,"living":0,"other":0}'::jsonb;
