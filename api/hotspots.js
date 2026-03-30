// บรรทัดนี้คือสูตรโกงที่บอกให้ Vercel ใช้ระบบ Edge (ทำงานเร็วกว่าและรันได้เสถียรกว่า)
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
      status: 405, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const apiKey = process.env.FIRMS_API_KEY?.trim();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing FIRMS_API_KEY" }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    const url = `https://firms.modaps.eosdis.nasa.gov/api/country/csv/${apiKey}/VIIRS_SNPP_NRT/THA/1`;
    const response = await fetch(url);

    if (!response.ok) {
       throw new Error(`NASA API responded with status: ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    lines.shift(); // ตัด Header ออก
    
    const hotspots = lines.map(line => {
      const values = line.split(',');
      if (values.length < 3) return null;
      return {
        lat: parseFloat(values[1]),
        lon: parseFloat(values[2]),
        brightness: parseFloat(values[3]),
        acq_date: values[6],
        acq_time: values[7],
        confidence: values[10] 
      };
    }).filter(spot => spot !== null && !isNaN(spot.lat) && !isNaN(spot.lon));

    // ส่งข้อมูลกลับไปหาหน้าเว็บ
    return new Response(JSON.stringify(hotspots), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
    
  } catch (error) {
    console.error("Hotspots Fetch Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch hotspots data", details: error.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}