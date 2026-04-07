// api/weather-proxy.js
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    // ตั้งค่าเวลาดึงข้อมูลไม่ให้เกิน 9 วินาที (ก่อน Vercel จะตัด)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(decodeURIComponent(url), {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: "Upstream Error", details: errorText });
    }

    const data = await response.json();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate'); // ช่วยจำค่าไว้ 1 นาที ลดภาระ Proxy
    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy crash:', error);
    return res.status(502).json({ 
      error: "Bad Gateway", 
      message: error.name === 'AbortError' ? "Request Timeout" : error.message 
    });
  }
}