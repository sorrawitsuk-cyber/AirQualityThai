export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ไม่พบการตั้งค่า API Key" });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "No prompt provided" });
  }

  try {
    console.log("🚀 [Overhaul] ยิงตรงเข้า Gemini 1.5 Flash พร้อมบังคับ JSON...");
    
    // ใช้ 1.5-flash และใช้ endpoint มาตรฐาน
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
            temperature: 0.2,
            // 🌟 ท่าไม้ตาย: บังคับให้ Google ส่งกลับมาเป็น JSON แท้ๆ 100%
            responseMimeType: "application/json" 
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("🔥 Google API Error:", data);
      return res.status(response.status).json({ error: "Google API Error", details: data });
    }

    const text = data.candidates[0].content.parts[0].text;
    console.log("✅ Gemini ตอบกลับสำเร็จ!");
    
    return res.status(200).json({ jsonText: text });

  } catch (error) {
    console.error("🔥 Backend Error:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}