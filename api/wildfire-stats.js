export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  const apiKey = process.env.FIRMS_API_KEY?.trim();
  if (!apiKey) return new Response(JSON.stringify({ error: "Missing Key" }), { status: 500 });

  try {
    // ดึงข้อมูล CSV (NASA VIIRS_SNPP 24h)
    const url = `https://firms.modaps.eosdis.nasa.gov/api/country/csv/${apiKey}/VIIRS_SNPP_NRT/THA/1`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("NASA API Error");
    
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    lines.shift(); // ตัด Header

    // ตัวแปรสำหรับคำนวณสถิติ
    let totalHotspots = 0;
    let highConfidence = 0;
    // สร้างตะกร้าเก็บข้อมูลรายภูมิภาค
    let regionsCount = { "ภาคเหนือ": 0, "ภาคตะวันออกเฉียงเหนือ": 0, "ภาคกลางและตะวันตก": 0, "ภาคใต้และตะวันออก": 0 };

    lines.forEach(line => {
      const values = line.split(',');
      if (values.length < 3) return;
      const lat = parseFloat(values[1]);
      const confidence = values[10]; // h, n, l

      if (!isNaN(lat)) {
        totalHotspots++;
        if (confidence === 'h' || confidence === 'n') highConfidence++;

        // จัดกลุ่มตามละติจูด (Latitude) แบบคร่าวๆ ของไทย
        if (lat >= 17.0) regionsCount["ภาคเหนือ"]++;
        else if (lat >= 14.0 && lat < 17.0) regionsCount["ภาคตะวันออกเฉียงเหนือ"]++;
        else if (lat >= 11.0 && lat < 14.0) regionsCount["ภาคกลางและตะวันตก"]++;
        else regionsCount["ภาคใต้และตะวันออก"]++;
      }
    });

    // เรียงลำดับจากมากไปน้อย (Leaderboard)
    const leaderboard = Object.entries(regionsCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return new Response(JSON.stringify({
      total: totalHotspots,
      highRisk: highConfidence,
      leaderboard: leaderboard,
      lastUpdate: new Date().toLocaleTimeString('th-TH') + ' น.'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}