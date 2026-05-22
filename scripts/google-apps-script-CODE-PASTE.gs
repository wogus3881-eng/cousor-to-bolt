var SPREADSHEET_ID = '여기에_스프레드시트_ID';
var SHEET_NAME = 'Sheet1';
var DRIVE_FOLDER_ID = '여기에_구글드라이브_폴더_ID';

function doPost(e) {
  try {
    if (!e) return jsonOut({ ok: false, error: 'no_event' });

    var raw = e.postData && e.postData.contents ? String(e.postData.contents).trim() : '';
    var name = '', birthDate = '', phone = '', time = '', location = '', source = '', agentId = '';
    var pdfBase64 = '', pdfFileName = '', thirdPartyAgreed = '미동의';

    if (raw && raw.charAt(0) === '{') {
      try {
        var j = JSON.parse(raw);
        name        = (j.name        || '').toString();
        birthDate   = (j.birthDate   || '').toString();
        phone       = (j.phone       || '').toString();
        time        = (j.time        || '').toString();
        location    = (j.location    || '').toString();
        source      = (j.source      || '').toString();
        agentId     = (j.agentId     || '').toString();
        pdfBase64   = (j.pdfBase64   || '').toString();
        pdfFileName = (j.pdfFileName || '').toString();
        thirdPartyAgreed = (j.thirdPartyAgreed ? '동의' : '미동의').toString();
      } catch (ignore) {}
    }

    var pdfLink = '';
    if (pdfBase64 && pdfFileName) {
      try {
        var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
        var decoded = Utilities.base64Decode(pdfBase64);
        var blob = Utilities.newBlob(decoded, 'application/pdf', pdfFileName);
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        pdfLink = file.getDownloadUrl();
      } catch (pdfErr) {
        Logger.log('PDF 저장 오류: ' + pdfErr);
        pdfLink = 'PDF 오류';
      }
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) return jsonOut({ ok: false, error: 'sheet_not_found' });

    sheet.appendRow([
      new Date(),
      name,
      birthDate,
      phone,
      time,
      location,
      source,
      agentId,
      thirdPartyAgreed,
      pdfLink,
    ]);

    return jsonOut({ ok: true, pdfLink: pdfLink });
  } catch (err) {
    Logger.log(err);
    return jsonOut({ ok: false, error: String(err) });
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
