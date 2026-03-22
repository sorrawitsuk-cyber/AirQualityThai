function fetchAndSaveToFirebase() {
  var PROJECT_ID = "thai-env-dashboard"; 

  Logger.log("=== 🟢 เริ่มต้นการดึงข้อมูล PM2.5 ===");

  // ดูดข้อมูลฝุ่นจาก Air4Thai (187 จุด)
  var aqiUrl = "https://air4thai.pcd.go.th/services/getNewAQI_JSON.php?_t=" + new Date().getTime();
  try {
    var aqiRes = UrlFetchApp.fetch(aqiUrl, { 'validateHttpsCertificates': false, 'muteHttpExceptions': true });
    var aqiData = JSON.parse(aqiRes.getContentText());
    var stations = aqiData.stations || [];
    Logger.log("✅ ดึงข้อมูล Air4Thai สำเร็จ: " + stations.length + " สถานี");
    
    // โยนขึ้น Firebase ทันที (สภาพอากาศไม่ต้องดึงแล้ว ไปดึงที่หน้าเว็บแทน)
    var payloadString = JSON.stringify({
      stations: stations,
      lastUpdated: new Date().toISOString()
    });
    
    var firestoreUrl = "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID + "/databases/(default)/documents/weatherData/latest";
    var firestorePayload = { fields: { jsonData: { stringValue: payloadString }, timestamp: { timestampValue: new Date().toISOString() } } };
    var options = { method: 'patch', contentType: 'application/json', payload: JSON.stringify(firestorePayload), muteHttpExceptions: true };
    
    var finalRes = UrlFetchApp.fetch(firestoreUrl, options);
    if (finalRes.getResponseCode() === 200) Logger.log("🎉 อัปเดตข้อมูลขึ้น Firebase เรียบร้อยแล้ว!");
    else Logger.log("❌ อัปเดต Firebase ล้มเหลว");

  } catch (e) {
    Logger.log("❌ Error: " + e);
  }
}