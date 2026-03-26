import { Jimp, intToRGBA } from 'jimp';

// ฟังก์ชันแปลงองศาลม เป็นทิศทางที่คนเข้าใจง่าย
const getWindDirectionText = (degree) => {
    if (degree === undefined || degree === null) return '';
    if (degree >= 337.5 || degree < 22.5) return 'เหนือ';
    if (degree >= 22.5 && degree < 67.5) return 'ตะวันออกเฉียงเหนือ';
    if (degree >= 67.5 && degree < 112.5) return 'ตะวันออก';
    if (degree >= 112.5 && degree < 157.5) return 'ตะวันออกเฉียงใต้';
    if (degree >= 157.5 && degree < 202.5) return 'ใต้';
    if (degree >= 202.5 && degree < 247.5) return 'ตะวันตกเฉียงใต้';
    if (degree >= 247.5 && degree < 292.5) return 'ตะวันตก';
    if (degree >= 292.5 && degree < 337.5) return 'ตะวันตกเฉียงเหนือ';
    return '';
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { lat, lon, windDir, windSpeed } = req.body;
  if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon' });

  try {
    const rvRes = await fetch('https://api.api-ninjas.com/v1/weather'); // เลี่ยงปัญหาด้วย public
    const rvDataRes = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    const rvData = await rvDataRes.json();
    const latestTime = rvData.radar.past[rvData.radar.past.length - 1].time;

    const zoom = 10;
    const n = Math.pow(2, zoom);
    const x = (lon + 180) / 360 * n;
    const latRad = lat * Math.PI / 180;
    const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;

    const tileX = Math.floor(x);
    const tileY = Math.floor(y);
    
    const pixelX = Math.floor((x - tileX) * 256);
    const pixelY = Math.floor((y - tileY) * 256);

    const tileUrl = `https://tilecache.rainviewer.com/v2/radar/${latestTime}/256/${zoom}/${tileX}/${tileY}/2/1_1.png`;

    const image = await Jimp.read(tileUrl);
    const hexColor = image.getPixelColor(pixelX, pixelY);
    const rgba = intToRGBA(hexColor); 

    let alertLevel = 0;

    if (rgba.a > 0) {
        if (rgba.r > 200 && rgba.g < 100) { 
            alertLevel = 3; // หนักมาก
        } else if (rgba.r > 200 && rgba.g > 150) { 
            alertLevel = 2; // ปานกลาง
        } else { 
            alertLevel = 1; // อ่อน
        }
    }

    // คำนวณคำบรรยายทิศทางฝน
    let windText = '';
    if (alertLevel > 0 && windSpeed !== undefined) {
        const dirText = getWindDirectionText(windDir);
        windText = windSpeed > 5 ? `กลุ่มฝนมีแนวโน้มเคลื่อนตัวไปทางทิศ${dirText} (ตามทิศทางลม ${windSpeed} กม./ชม.)` : 'สภาพลมค่อนข้างสงบ กลุ่มฝนอาจแช่ตัวอยู่ในพื้นที่สักระยะ';
    }

    return res.status(200).json({
      radarTime: new Date(latestTime * 1000).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' }),
      alertLevel: alertLevel,
      windText: windText
    });

  } catch (error) {
    console.error("Radar Scanner Error:", error);
    return res.status(500).json({ error: error.message });
  }
}