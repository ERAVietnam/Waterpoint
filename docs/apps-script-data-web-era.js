// ============================================================================
// APPS SCRIPT — Google Sheet "DATA WEB ERA"
// Paste vao: mo Sheet "DATA WEB ERA" → Extensions (Tien ich) → Apps Script
// → xoa Code.gs cu → paste toan bo file nay → LUU → Deploy lai (New version,
// URL KHONG doi).
//
// Khac ban cu o APPS_SCRIPT.md (forest-onsen):
//   1. Tab WATERPOINT (landing VR Waterpoint, formId WP_VR_POPUP) duoc them
//      cot Email (Q) nhu tab PHU GIA BAO LOC.
//   2. Trigger email them tab WATERPOINT → gui ve cuong.letrong@era.com.vn.
// ============================================================================

// ===== 1. NHẬN LEAD TỪ WEBSITE (Web App) =====
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Tìm tab theo tên, không phân biệt hoa thường & trim khoảng trắng
    const targetName = String(data.sheet || "").trim();
    const allSheets = ss.getSheets();
    const matchedSheet = allSheets.find(
      (s) => s.getName().trim().toLowerCase() === targetName.toLowerCase()
    );
    const sheet = matchedSheet || ss.getActiveSheet();

    Logger.log("Received sheet: " + data.sheet);
    Logger.log("Matched sheet: " + (matchedSheet ? matchedSheet.getName() : "NOT FOUND"));
    Logger.log("Payload: " + JSON.stringify(data));

    // 22/09: WATERPOINT (landing VR) cũng có cột Email như PGBL
    const name = targetName.toLowerCase();
    const hasEmail = name === "phú gia bảo lộc" || name === "waterpoint";

    const baseHeaders = [
      "Timestamp", "Họ tên", "SĐT", "URL gốc",
      "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
      "adclid", "adclida", "mglnd",
      "IP", "Form ID", "User Agent", "Sản phẩm"
    ];

    const firstRow = sheet.getRange(1, 1, 1, baseHeaders.length);
    if (firstRow.getValues()[0][0] === "") {
      firstRow.setValues([baseHeaders]);
    }
    // Ghi header cột Email (Q) nếu tab chưa có
    if (hasEmail && sheet.getRange(1, 17).getValue() === "") {
      sheet.getRange(1, 17).setValue("Email");
    }

    const baseRow = [
      data.timestamp || new Date().toISOString(),  // A: Timestamp
      data.hoten || "",                            // B: Họ tên
      data.sdt || "",                              // C: SĐT
      data.url || "",                              // D: URL gốc
      data.utm_source || "",                       // E: utm_source
      data.utm_medium || "",                       // F: utm_medium
      data.utm_campaign || "",                     // G: utm_campaign
      data.utm_term || "",                         // H: utm_term
      data.utm_content || "",                      // I: utm_content
      data.adclid || "",                           // J: adclid
      data.adclida || "",                          // K: adclida
      data.mglnd || "",                            // L: mglnd
      data.ip || "",                               // M: IP
      data.formId || "",                           // N: Form ID
      data.userAgent || "",                        // O: User Agent
      data.sanpham || "",                          // P: Sản phẩm
    ];

    if (hasEmail) {
      sheet.appendRow([
        ...baseRow,
        data.email || ""    // Q: Email
      ]);
    } else {
      sheet.appendRow(baseRow);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== 2. GỬI EMAIL THÔNG BÁO KHÁCH MỚI (chạy bằng trigger theo thờ i gian) =====
function checkAndSendEmailNewCustomers() {
  var tabs = [
    {
      sheetName: "ECO RETREAT - FOREST ONSEN",
      subject: "Khách hàng mới đăng ký - FOREST ONSEN",
      propKey: "LAST_PROCESSED_ROW" // giữ key cũ để không reset mốc đã xử lý
    },
    {
      sheetName: "ECO RETREAT - RỪNG PHƯỢNG",
      subject: "Khách hàng mới đăng ký - RỪNG PHƯỢNG",
      propKey: "LAST_PROCESSED_ROW_RP"
    },
    {
      sheetName: "PHÚ GIA BẢO LỘC",
      subject: "Khách hàng mới đăng ký - PHÚ GIA BẢO LỘC",
      propKey: "LAST_PROCESSED_ROW_PGBL"
    },
    {
      sheetName: "WATERPOINT",
      subject: "Khách hàng mới đăng ký - WATERPOINT",
      propKey: "LAST_PROCESSED_ROW_WP"
    }
  ];

  var emailAddress = "cuong.letrong@era.com.vn";
  var props = PropertiesService.getScriptProperties();

  for (var t = 0; t < tabs.length; t++) {
    var tab = tabs[t];
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tab.sheetName);
    if (!sheet) continue;

    var lastRow = sheet.getLastRow();
    var lastProcessedRowStr = props.getProperty(tab.propKey);

    // LẦN ĐẦU CHẠY: đặt mốc là dòng hiện tại, không gửi mail cho khách cũ
    if (lastProcessedRowStr === null) {
      props.setProperty(tab.propKey, lastRow.toString());
      continue;
    }

    var lastProcessedRow = parseInt(lastProcessedRowStr);
    if (lastRow <= lastProcessedRow) continue;

    var startRow = lastProcessedRow + 1;
    var numRows = lastRow - lastProcessedRow;
    var data = sheet.getRange(startRow, 1, numRows, sheet.getLastColumn()).getValues();

    for (var i = 0; i < data.length; i++) {
      var rowData = data[i];
      var timestamp = rowData[0] ? rowData[0] : "";
      var name = rowData[1] ? rowData[1] : "Chưa cập nhật";
      var phone = rowData[2] ? rowData[2] : "Chưa cập nhật";
      var url = rowData[3] ? rowData[3] : "";
      var sanpham = rowData.length > 15 && rowData[15] ? rowData[15] : "";
      var email = rowData.length > 16 && rowData[16] ? rowData[16] : "";

      if (!name && !phone) continue;

      var body = "Chào bạn,\n\nCó một khách hàng mới vừa để lại thông tin trên hệ thống. Chi tiết như sau:\n\n" +
                 "- Thờ i gian: " + timestamp + "\n" +
                 "- Họ tên: " + name + "\n" +
                 "- Số điện thoại: " + phone + "\n" +
                 (email ? "- Email: " + email + "\n" : "") +
                 (sanpham ? "- Sản phẩm quan tâm: " + sanpham + "\n" : "") +
                 "- URL gốc: " + url + "\n\n" +
                 "Vui lòng truy cập file Google Sheets 'DATA WEB ERA' để xem đầy đủ thông tin.";

      MailApp.sendEmail(emailAddress, tab.subject, body);
    }

    props.setProperty(tab.propKey, lastRow.toString());
  }
}
