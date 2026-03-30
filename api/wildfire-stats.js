export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  const apiKey = process.env.FIRMS_API_KEY?.trim();
  if (!apiKey) return new Response(JSON.stringify({ error: "Missing Key" }), { status: 500 });

  try {
    // 1. ดึงข้อมูล CSV (NASA VIIRS_SNPP)
    const url = `https://firms.modaps.eosdis.nasa.gov/api/country/csv/${apiKey}/VIIRS_SNPP_NRT/THA/1`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("NASA API Error");
    
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    lines.shift(); // ตัด Header

    // 2. วิเคราะห์และจัดกลุ่มข้อมูล (Analytics)
    let totalHotspots = 0;
    let highConfidence = 0;
    let regionsCount = { "ภาคเหนือ": 0, "ภาคอีสาน": 0, "ภาคกลาง/ตะวันตก": 0, "ภาคใต้": 0 };

    lines.forEach(line => {
      const values = line.split(',');
      if (values.length < 3) return;
      const lat = parseFloat(values[1]);
      const confidence = values[10];

      if (!isNaN(lat)) {
        totalHotspots++;
        if (confidence === 'h' || confidence === 'n') highConfidence++;

        // แบ่งภูมิภาคคร่าวๆ ด้วย Latitude
        if (lat >= 17.0) regionsCount["ภาคเหนือ"]++;
        else if (lat >= 14.0 && lat < 17.0) regionsCount["ภาคอีสาน"]++;
        else if (lat >= 11.0 && lat < 14.0) regionsCount["ภาคกลาง/ตะวันตก"]++;
        else regionsCount["ภาคใต้"]++;
      }
    });

    // 3. เรียงลำดับพื้นที่ที่วิกฤตที่สุด
    const leaderboard = Object.entries(regionsCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // ส่งชุดข้อมูลสรุปกลับไปให้ Frontend
    return new Response(JSON.stringify({
      total: totalHotspots,
      highRisk: highConfidence,
      leaderboard: leaderboard,
      lastUpdate: new Date().toISOString()
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}