import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("🚨 ไม่พบ GEMINI_API_KEY!");
    return res.status(500).json({ error: "ไม่พบการตั้งค่า API Key ของ AI" });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "No prompt provided" });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 🌟 ท่าไม้ตายสุดท้าย: ระบบ Auto-Fallback! 
    // มันจะไล่ทดสอบโมเดลจากใหม่สุดไปเก่าสุด อันไหนคีย์ของคุณรองรับ มันจะใช้อันนั้นอัตโนมัติ!
    const modelsToTry = [
        "gemini-2.5-flash", // เผื่อไว้ตามที่คุณระบุ
        "gemini-2.0-flash", // รุ่นใหม่ล่าสุดที่ Google เพิ่งปล่อย
        "gemini-1.5-flash", 
        "gemini-1.5-flash-latest",
        "gemini-pro"        // รุ่นคลาสสิก (ไม้ตายก้นหีบ)
    ];

    let text = "";
    let success = false;
    let lastError = "";

    // ลูปทดสอบโมเดล
    for (const modelName of modelsToTry) {
        try {
            console.log(`🚀 กำลังลองเชื่อมต่อกับโมเดล: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName }); 
            const result = await model.generateContent(prompt);
            text = result.response.text(); // ดึงข้อความออกมา
            success = true;
            console.log(`✅ สำเร็จ! โมเดลที่เวิร์กคือ: ${modelName}`);
            break; // เจออันที่ใช้ได้ปุ๊บ หยุดหาทันที
        } catch (err) {
            console.error(`❌ โมเดล ${modelName} ถูกปฏิเสธ:`, err.message);
            lastError = err.message;
        }
    }

    // ถ้าลองหมดแล้วยังใช้ไม่ได้สักอัน
    if (!success) {
         throw new Error("API Key ของคุณไม่รองรับโมเดลใดๆ เลย: " + lastError);
    }

    return res.status(200).json({ jsonText: text });

  } catch (error) {
    console.error("🔥 สรุป Error รวม:", error.message || error);
    return res.status(500).json({ 
        error: "Internal Server Error", 
        details: error.message || "Unknown error occurred" 
    });
  }
}