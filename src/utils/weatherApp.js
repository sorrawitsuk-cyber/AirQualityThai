export const AQI_LEVELS = [
  { max: 15, label: 'ดีมาก', color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.34)' },
  { max: 25, label: 'ดี', color: '#22c55e', glow: 'rgba(34, 197, 94, 0.32)' },
  { max: 37.5, label: 'ปานกลาง', color: '#eab308', glow: 'rgba(234, 179, 8, 0.30)' },
  { max: 75, label: 'เริ่มมีผลกระทบ', color: '#f97316', glow: 'rgba(249, 115, 22, 0.34)' },
  { max: 150, label: 'อันตราย', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.38)' },
  { max: Infinity, label: 'อันตรายมาก', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.42)' },
];

export function getAqiLevel(pm25 = 0) {
  const value = Number(pm25) || 0;
  return AQI_LEVELS.find((level) => value <= level.max) || AQI_LEVELS[0];
}

export function formatNumber(value, fallback = '-') {
  return value === null || value === undefined || Number.isNaN(Number(value))
    ? fallback
    : Math.round(Number(value)).toLocaleString('th-TH');
}

export function formatTime(value) {
  if (!value) return '--:--';
  return new Date(value).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

export function shortDate(value, options = {}) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('th-TH', {
    weekday: options.weekday || 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function cleanProvinceName(name = '') {
  return String(name).replace('จังหวัด', '').trim();
}

export function getStationPm25(station) {
  return Number(station?.AQILast?.PM25?.value || 0);
}

export function getStationTemp(station, stationTemps = {}) {
  return Number(stationTemps?.[station?.stationID]?.temp || 0);
}

export function getStationRain(station, stationTemps = {}) {
  return Number(stationTemps?.[station?.stationID]?.rainProb || 0);
}

export function getRiskTone({ pm25 = 0, feelsLike = 0, rainProb = 0 }) {
  if (pm25 > 75 || feelsLike >= 42) return { label: 'เสี่ยงสูง', color: '#ef4444' };
  if (rainProb >= 70 || pm25 > 37.5 || feelsLike >= 38) return { label: 'ควรระวัง', color: '#f97316' };
  if (rainProb >= 40 || pm25 > 25 || feelsLike >= 35) return { label: 'ติดตาม', color: '#eab308' };
  return { label: 'ใช้งานได้ดี', color: '#22c55e' };
}

export function buildQuickAdvice(current = {}) {
  const pm25 = Number(current.pm25 || 0);
  const feelsLike = Number(current.feelsLike || current.temp || 0);
  const rainProb = Number(current.rainProb || 0);
  const uv = Number(current.uv || 0);
  const parts = [];

  if (feelsLike >= 42) parts.push('ร้อนจัดมาก เลี่ยงแดดช่วงเที่ยงถึงบ่ายและดื่มน้ำถี่ขึ้น');
  else if (feelsLike >= 38) parts.push('อากาศร้อนอบอ้าว วางกิจกรรมกลางแจ้งช่วงเช้าหรือเย็น');

  if (pm25 > 75) parts.push('ฝุ่นสูงระดับอันตราย งดวิ่งกลางแจ้งและใช้หน้ากาก N95');
  else if (pm25 > 37.5) parts.push('ฝุ่นเริ่มกระทบสุขภาพ กลุ่มเสี่ยงควรลดเวลาอยู่นอกอาคาร');

  if (rainProb >= 70) parts.push('มีโอกาสฝนสูง พกร่มและเผื่อเวลาเดินทาง');
  else if (rainProb >= 40) parts.push('มีโอกาสฝนเป็นช่วง จับตาช่วงบ่ายถึงเย็น');

  if (uv >= 8) parts.push('UV สูงมาก ใช้กันแดด หมวก และเลี่ยงแดดตรง');

  if (!parts.length) return 'วันนี้สภาพอากาศโดยรวมใช้ชีวิตได้ปกติ เหมาะกับกิจกรรมกลางแจ้งแบบไม่เร่งรีบ';
  return parts.join(' · ');
}

export function scoreActivity(day = {}, activity = 'outdoor') {
  let score = 100;
  const rain = Number(day.rain || 0);
  const heat = Number(day.heat || day.maxTemp || 0);
  const pm25 = Number(day.pm25 || 0);
  const uv = Number(day.uv || 0);
  const wind = Number(day.wind || 0);

  if (activity === 'laundry') {
    score -= rain * 0.9;
    score += Math.min(wind, 20) * 0.9;
    if (heat > 36) score += 7;
  } else if (activity === 'exercise') {
    score -= pm25 * 0.9;
    score -= Math.max(0, heat - 31) * 7;
    score -= rain * 0.45;
    score -= Math.max(0, uv - 6) * 7;
  } else if (activity === 'travel') {
    score -= rain * 0.7;
    score -= Math.max(0, heat - 35) * 5;
    score -= Math.max(0, wind - 25) * 3;
  } else {
    score -= rain * 0.55;
    score -= pm25 * 0.5;
    score -= Math.max(0, heat - 34) * 5;
    score -= Math.max(0, uv - 7) * 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function stationRankings(stations = [], stationTemps = {}) {
  const rows = stations.map((station) => ({
    id: station.stationID,
    name: cleanProvinceName(station.areaTH || station.nameTH),
    station,
    temp: getStationTemp(station, stationTemps),
    pm25: getStationPm25(station),
    rain: getStationRain(station, stationTemps),
    lat: station.lat,
    lng: station.long,
  }));

  return {
    hottest: rows.filter((x) => x.temp).sort((a, b) => b.temp - a.temp).slice(0, 5),
    dustiest: rows.filter((x) => x.pm25).sort((a, b) => b.pm25 - a.pm25).slice(0, 5),
    wettest: rows.filter((x) => x.rain).sort((a, b) => b.rain - a.rain).slice(0, 5),
    rows,
  };
}
