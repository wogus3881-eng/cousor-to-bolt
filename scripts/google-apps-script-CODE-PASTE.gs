/**
 * ============================================================
 * 이 파일 전체를 구글 앱스 스크립트 편집기의 Code.gs 에 붙여넣기
 * (기존 코드를 덮어쓸지, doPost 만 합칠지 본인 프로젝트에 맞게)
 *
 * [필수] 아래 두 값만 본인 것으로 수정:
 *   1) SPREADSHEET_ID  → 스프레드시트 URL 의 .../d/여기/edit
 *   2) SHEET_NAME     → 데이터 넣을 탭 이름 (기본 Sheet1)
 *
 * 스프레드시트 1행 헤더:
 *   접수일시 | 이름 | 생년월일 | 연락처 | 희망시간 | 지역 | 유입경로
 *
 * 프론트(이 저장소 ConsultationForm): fetch + JSON.stringify + no-cors
 *
 * 웹앱 배포: 배포 → 배포 관리 → 기존 웹앱 → 버전만 갱신(URL 유지) 권장
 *   실행: 나 / 액세스: 누구나(또는 익명 포함 가능한 수준)
 * ============================================================
 */

var SPREADSHEET_ID = '스프레드시트_ID를_여기에_붙여넣기';
var SHEET_NAME = 'Sheet1';

/** 프론트: fetch + JSON.stringify → postData.contents 에 JSON 문자열 (type 이 json 이 아닐 수 있음) */
function doPost(e) {
  try {
    if (!e) {
      return jsonOut({ ok: false, error: 'no_event' });
    }

    var name = '';
    var birthDate = '';
    var phone = '';
    var time = '';
    var location = '';
    var source = '';
    var raw = e.postData && e.postData.contents ? String(e.postData.contents).trim() : '';
    if (raw && raw.charAt(0) === '{') {
      try {
        var j = JSON.parse(raw);
        name = (j.name || '').toString();
        birthDate = (j.birthDate || '').toString();
        phone = (j.phone || '').toString();
        time = (j.time || '').toString();
        location = (j.location || '').toString();
        source = (j.source || '').toString();
      } catch (ignore) {}
    }

    if (!name) {
      var p = e.parameter;
      name = (p.name || '').toString();
      birthDate = (p.birthDate || '').toString();
      phone = (p.phone || '').toString();
      time = (p.time || '').toString();
      location = (p.location || '').toString();
      source = (p.source || '').toString();
    }

    Logger.log(
      JSON.stringify({ name: name, birthDate: birthDate, phone: phone, time: time, location: location, source: source }),
    );

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return jsonOut({ ok: false, error: 'sheet_not_found:' + SHEET_NAME });
    }

    // 열 순서: 접수일시, 이름, 생년월일, 연락처, 희망시간, 지역, 유입경로
    sheet.appendRow([
      new Date(),
      name,
      birthDate,
      phone,
      time,
      location,
      source,
    ]);

    return jsonOut({ ok: true });
  } catch (err) {
    Logger.log(err);
    return jsonOut({ ok: false, error: String(err) });
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
