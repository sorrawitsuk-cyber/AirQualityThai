import React from 'react';
import { CalendarDays } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, ExpandableDetail, SectionHeader, CustomTooltip } from './SharedUI';
import { SectionTitle, InsightBox } from './ExtendedUI';
import { heatMeta, pmMeta } from './useAIPageData';

export default function WeeklySection({ daily, current, isMobile }) {
  const currentTemp = Math.round(current?.temp || 0);
  const currentFeels = Math.round(current?.feelsLike || currentTemp);
  const currentPm = Math.round(current?.pm25 || 0);
  const currentRain = Math.round(current?.rainProb || 0);
  const currentWind = Math.round(current?.windSpeed || 0);
  const visibilityKm = Math.max(0, (Number(current?.visibility) || 10000) / 1000).toFixed(1);

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
  
  const dailyRows = (daily?.time || []).slice(0, 7).map((time, index) => ({
    day: index === 0 ? 'วันนี้' : new Date(time).toLocaleDateString('th-TH', { weekday: 'short' }),
    date: new Date(time).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
    max: Math.round(daily?.temperature_2m_max?.[index] || currentTemp),
    min: Math.round(daily?.temperature_2m_min?.[index] || currentTemp - 4),
    heat: Math.round(daily?.apparent_temperature_max?.[index] || currentFeels),
    rain: Math.round(daily?.precipitation_probability_max?.[index] || 0),
    uv: Number(daily?.uv_index_max?.[index] || 0).toFixed(1),
  }));

  const riskCards = [
    {
      icon: '🥵',
      title: 'ความร้อน',
      value: `${currentFeels}°`,
      meta: heatMeta(currentFeels),
      text: currentFeels >= 38 ? 'ลดกิจกรรมกลางแดดช่วง 11:00-15:00 และดื่มน้ำให้ถี่ขึ้น' : 'ทำกิจกรรมกลางแจ้งได้ แต่ควรพักเป็นช่วง',
      score: clamp((currentFeels - 30) * 7, 10, 92),
    },
    {
      icon: '🌫️',
      title: 'ฝุ่น PM2.5',
      value: currentPm,
      meta: pmMeta(currentPm),
      text: currentPm >= 50 ? 'กลุ่มเสี่ยงควรลดเวลานอกอาคารและพกหน้ากาก' : 'คุณภาพอากาศยังเหมาะกับกิจกรรมทั่วไป',
      score: clamp(currentPm * 1.1, 8, 95),
    },
    {
      icon: '🌧️',
      title: 'ฝน',
      value: `${currentRain}%`,
      meta: currentRain >= 70 ? { label: 'เสี่ยงฝนสูง', color: '#3b82f6' } : currentRain >= 40 ? { label: 'มีโอกาสฝน', color: '#f59e0b' } : { label: 'ฝนน้อย', color: '#16a34a' },
      text: currentRain >= 40 ? 'เตรียมร่มและเลี่ยงเดินทางช่วงเมฆฝนก่อตัว' : 'เดินทางได้ค่อนข้างสะดวก',
      score: clamp(currentRain, 8, 95),
    },
    {
      icon: '💨',
      title: 'ลมและทัศนวิสัย',
      value: `${currentWind} km/h`,
      meta: currentWind >= 30 ? { label: 'ลมแรง', color: '#ef4444' } : currentWind >= 18 ? { label: 'ลมปานกลาง', color: '#f59e0b' } : { label: 'ปกติ', color: '#16a34a' },
      text: `ทัศนวิสัยประมาณ ${visibilityKm} กม. เหมาะกับการเดินทางทั่วไป`,
      score: clamp(currentWind * 2.3, 8, 80),
    },
  ];

  return (
    <Card id="weekly" style={{ padding: isMobile ? 18 : 28, scrollMarginTop: 130 }}>
      <SectionHeader title="แนวโน้ม 7 วันและความเสี่ยง" icon={CalendarDays} eyebrow="วางแผนเดินทาง หรือกิจกรรมล่วงหน้า" />

      <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        <div>
          <SectionTitle icon="📅" title="แนวโน้ม 7 วัน" subtitle="รวมอุณหภูมิสูงสุด ต่ำสุด ความร้อน ฝน และ UV เพื่อดูภาพรวมทั้งสัปดาห์" />
          <div style={{ height: 280, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyRows} margin={{ bottom: 0, left: -18, right: 10, top: 14 }}>
                <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-sub)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: 'var(--text-sub)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line dataKey="max" name="สูงสุด" stroke="#f97316" strokeWidth={3} type="monotone" />
                <Line dataKey="min" name="ต่ำสุด" stroke="#3b82f6" strokeWidth={3} type="monotone" />
                <Line dataKey="heat" name="ดัชนีความร้อน" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <ExpandableDetail label="ดูพยากรณ์รายวันเพิ่มเติม" defaultOpen={!isMobile}>
            <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', marginTop: '12px' }}>
              {dailyRows.map((day) => (
                <div key={day.date} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '10px' }}>
                  <div style={{ color: 'var(--text-main)', fontSize: '0.72rem', fontWeight: 900 }}>{day.day}</div>
                  <div style={{ color: 'var(--text-sub)', fontSize: '0.66rem', marginTop: 2 }}>{day.date}</div>
                  <div style={{ color: '#f97316', fontSize: '0.92rem', fontWeight: 950, marginTop: 8 }}>{day.max}° / {day.min}°</div>
                  <div style={{ color: '#3b82f6', fontSize: '0.7rem', fontWeight: 800, marginTop: 4 }}>ฝน {day.rain}% · UV {day.uv}</div>
                </div>
              ))}
            </div>
            <InsightBox color="#f97316" title="แนวโน้มสำคัญ">
              พรุ่งนี้คาดว่าอุณหภูมิ {dailyRows[1]?.max}°/{dailyRows[1]?.min}° โอกาสฝน {dailyRows[1]?.rain}% และ UV {dailyRows[1]?.uv} ใช้เทียบกับวันนี้เพื่อวางแผนงานกลางแจ้งล่วงหน้า
            </InsightBox>
          </ExpandableDetail>
        </div>

        <div>
          <SectionTitle icon="⚠️" title="ความเสี่ยงที่ควรรู้" subtitle="จัดกลุ่มความเสี่ยงให้อ่านง่าย พร้อมสิ่งที่ควรทำทันที" />
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
            {riskCards.map((risk) => {
              const bg = risk.score >= 75 ? 'rgba(239,68,68,0.1)' : risk.score >= 50 ? 'rgba(249,115,22,0.12)' : 'rgba(22,163,74,0.11)';
              const border = risk.score >= 75 ? 'rgba(239,68,68,0.3)' : risk.score >= 50 ? 'rgba(249,115,22,0.32)' : 'rgba(22,163,74,0.28)';
              return (
                <div key={risk.title} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '18px', padding: '14px' }}>
                  <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ alignItems: 'center', display: 'flex', gap: '8px', minWidth: 0 }}>
                      <span style={{ fontSize: '1.15rem' }}>{risk.icon}</span>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{risk.title}</strong>
                    </div>
                    <span style={{ color: risk.meta.color, fontSize: '0.74rem', fontWeight: 950 }}>{risk.meta.label}</span>
                  </div>
                  <div style={{ color: risk.meta.color, fontSize: '1.45rem', fontWeight: 950, marginTop: '10px' }}>{risk.value}</div>
                  <div style={{ color: 'var(--text-sub)', fontSize: '0.74rem', lineHeight: 1.55, marginTop: '6px' }}>{risk.text}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
