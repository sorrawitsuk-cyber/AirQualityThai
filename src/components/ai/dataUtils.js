export const getPm25Status = (v) => {
  const n = Number(v) || 0;
  if (n <= 15) return { text: 'ดีมาก', color: '#10b981' };
  if (n <= 25) return { text: 'ดี', color: '#22c55e' };
  if (n <= 37.5) return { text: 'ปานกลาง', color: '#f59e0b' };
  if (n <= 75) return { text: 'เริ่มมีผล', color: '#f97316' };
  return { text: 'มีผลกระทบ', color: '#ef4444' };
};

export const getUvStatus = (v) => {
  const n = Number(v) || 0;
  if (n <= 2) return { text: 'ต่ำ', color: '#22c55e' };
  if (n <= 5) return { text: 'ปานกลาง', color: '#f59e0b' };
  if (n <= 7) return { text: 'สูง', color: '#f97316' };
  if (n <= 10) return { text: 'สูงมาก', color: '#ef4444' };
  return { text: 'อันตราย', color: '#8b5cf6' };
};

export const startIndexFromNow = (times = []) => {
  const idx = times.findIndex((t) => new Date(t).getTime() >= Date.now() - 3600000);
  return idx >= 0 ? idx : 0;
};

export const avg = (items) => {
  const vals = items.filter((v) => Number.isFinite(Number(v))).map(Number);
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
};

export const periodSummary = (hourly, startIdx, label, hours) => {
  const indices = (hourly?.time || []).reduce((acc, time, i) => {
    if (i < startIdx) return acc;
    if (hours.includes(new Date(time).getHours())) acc.push(i);
    return acc;
  }, []).slice(0, 6);
  const temps = indices.map((i) => hourly?.temperature_2m?.[i]).filter((v) => v != null);
  const rains = indices.map((i) => hourly?.precipitation_probability?.[i]).filter((v) => v != null);
  const rain = Math.round(avg(rains));
  const min = temps.length ? Math.round(Math.min(...temps)) : '--';
  const max = temps.length ? Math.round(Math.max(...temps)) : '--';
  return {
    label, rain, tempText: `${min}-${max}°C`,
    desc: rain >= 60 ? 'มีโอกาสฝนฟ้าคะนอง' : rain >= 30 ? 'มีเมฆและฝนบางช่วง' : 'ท้องฟ้าโปร่งถึงมีเมฆบางส่วน',
  };
};
