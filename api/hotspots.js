// api/hotspots.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.FIRMS_API_KEY; 
  if (!apiKey) {
    return res.status(500).json({ error: "Missing FIRMS_API_KEY" });
  }

  try {
    // ใช้ https เพื่อป้องกัน Error บน Vercel Production
    const url = `https://firms.modaps.eosdis.nasa.gov/api/country/csv/${apiKey}/VIIRS_SNPP_NRT/THA/1`;
    const response = await fetch(url);
    
    if (!response.ok) {
       throw new Error(`NASA API responded with status: ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    lines.shift(); // ลบหัวตาราง (Header)
    
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

    return res.status(200).json(hotspots);
  } catch (error) {
    console.error("Hotspots Fetch Error:", error);
    return res.status(500).json({ error: "Failed to fetch hotspots data" });
  }
}