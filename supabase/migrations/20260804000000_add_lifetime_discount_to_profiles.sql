/*
  # 최초 구독자 평생 할인 프로모션 추적

  1. Changes
    - profiles.lifetime_discount_krw (integer, not null, default 0) 컬럼 추가
      "선착순 10명 평생 1만원 할인" 이벤트 대상자에게 관리자가 결제 처리 시
      수동으로 10000을 입력해두는 용도. 결제가 이메일로 수동 처리되기 때문에,
      매달 결제 확인할 때 이 값을 참고해서 할인 적용 여부를 잊지 않도록 함.
    - 자동 결제·할인 로직은 없음 — 순수 관리자 참고용 기록 컬럼.

  2. Notes
    - 몇 명이 등록됐는지는 `SELECT count(*) FROM profiles WHERE lifetime_discount_krw > 0;`로 확인
    - 신규 구독 첫 달 50% 할인은 전원 대상 상시 정책이라 별도 컬럼 불필요
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS lifetime_discount_krw integer NOT NULL DEFAULT 0;
