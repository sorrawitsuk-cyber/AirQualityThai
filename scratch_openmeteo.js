import { provinces77 } from './src/provinces77.js';

const timestamp = Date.now();
const chunk = provinces77.slice(0, 1);
const lats = chunk.map(p => p.lat).join(',');
const lons = chunk.map(p => p.lon).join(',');

const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m&daily=temperature_2m_max&timezone=Asia%2FBangkok&past_days=7&forecast_days=8&_t=${timestamp}`;

const aUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lons}&current=pm2_5&hourly=pm2_5&timezone=Asia%2FBangkok&past_days=7&forecast_days=7&_t=${timestamp}`;

async function test() {
    const wRes = await fetch(wUrl);
    const wData = await wRes.json();
    console.log("Weather daily dates (length " + (wData[0]?.daily?.time?.length || wData.daily?.time?.length) + "):", wData[0]?.daily?.time || wData.daily?.time);
    
    const aRes = await fetch(aUrl);
    const aData = await aRes.json();
    console.log("Air hourly time (length " + (aData[0]?.hourly?.time?.length || aData.hourly?.time?.length) + ")");
}
test();
