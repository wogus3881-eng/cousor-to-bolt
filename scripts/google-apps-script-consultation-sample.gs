/**
 * 상담 신청 웹앱용 샘플 (스프레드시트에 기본 상담 정보 저장)
 *
 * 웹앱 배포 URL(exec)은 프론트 ConsultationForm.tsx 의 fetch 주소와 동일해야 함 (여기서 수정하지 않음).
 * 아래는 스프레드시트 파일 ID만 넣으면 됨 (시트 URL의 d/ 와 /edit 사이).
 *
 * ConsultationForm.tsx 가 보내는 필드:
 *   name, birthDate, phone, time, location, source
 *
 * 사용법:
 * 1) 스프레드시트에 헤더 행을 맞춤 (아래 HEADER_ROW 예시 참고)
 * 2) SPREADSHEET_ID / SHEET_NAME 수정
 * 3) 기존 doPost 가 있으면 appendRow 부분만 합치거나 컬럼 순서를 기존 시트에 맞게 조정
 */

var SPREADSHEET_ID = '스프레드시트_ID를_여기에_붙여넣기';
var SHEET_NAME = 'Sheet1'; // 또는 실제 시트 이름

/** 1행 헤더 예시 — 실제 시트와 열 순서를 반드시 일치시키세요 */
// | 접수일시 | 이름 | 생년월일 | 연락처 | 희망시간 | 지역 | 유입경로 |

function parsePayload(e) {
  if (!e) {
    return null;
  }
  var raw = e.postData && e.postData.contents ? String(e.postData.contents).trim() : '';
  if (raw && raw.charAt(0) === '{') {
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }
  return {
    name: e.parameter.name || '',
    birthDate: e.parameter.birthDate || '',
    phone: e.parameter.phone || '',
    time: e.parameter.time || '',
    location: e.parameter.location || '',
    source: e.parameter.source || ''
  };
}

function doPost(e) {
  var data = parsePayload(e);
  if (!data) {
    return jsonOut({ ok: false, error: 'no_event_or_payload' });
  }

  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) {
    return jsonOut({ ok: false, error: 'sheet_not_found' });
  }

  sheet.appendRow([
    new Date(),
    data.name || '',
    data.birthDate || '',
    data.phone || '',
    data.time || '',
    data.location || '',
    data.source || '',
  ]);

  return jsonOut({ ok: true });
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
