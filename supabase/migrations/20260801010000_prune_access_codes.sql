/*
  # 접근코드 정리 — 티어별 오너 테스트 코드 1개씩만 남김

  Trial은 이제 로그인/코드 없이 기본 개방되므로 접근코드가 더 이상
  일반 사용자 배포용으로 필요하지 않습니다. 남은 3개는 로그인 없이
  각 등급 화면을 직접 확인하기 위한 오너 전용 코드입니다.
*/

DELETE FROM access_codes
WHERE code NOT IN ('TRIAL-TEST01', 'BASIC-TEST01', 'PLUS-TEST01');

UPDATE access_codes SET agent_name = '오너 테스트 (Trial)' WHERE code = 'TRIAL-TEST01';
UPDATE access_codes SET agent_name = '오너 테스트 (Basic)' WHERE code = 'BASIC-TEST01';
UPDATE access_codes SET agent_name = '오너 테스트 (Pro)' WHERE code = 'PLUS-TEST01';
