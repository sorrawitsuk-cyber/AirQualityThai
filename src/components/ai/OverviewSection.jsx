import React, { useMemo } from 'react';
import { Card, ExpandableDetail, SectionHeader, CustomTooltip } from './SharedUI';
import { MetricCard, OverallScore, SectionTitle, InsightBox, PhaseLabel, GistdaBrief } from './ExtendedUI';
import { riskMeta, pmMeta, heatMeta } from './useAIPageData';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function OverviewSection({
  current, hourly, daily, startIdx, isMobile, weatherInfo,
  maxTemp, minTemp, rainProb, pm25, pm25Status, uvStatus,
  windDirection, updateText, trendData, gistdaSummary
}) {
  const [trendTab, setTrendTab] = React.useState('temp');
  const chartColor = trendTab === 'temp' ? '#ef4444' : trendTab === 'rain' ? '#2563eb' : trendTab === 'pm25' ? '#22c55e' : trendTab === 'wind' ? '#0ea5e9' : '#3b82f6';

  const currentTemp = Math.round(current?.temp || 0);
  const currentFeels = Math.round(current?.feelsLike || currentTemp);
  const currentPm = Math.round(pm25 || 0);
  const currentRain = Math.round(rainProb || 0);
  const currentWind = Math.round(current?.windSpeed || 0);
  const currentHumidity = Math.round(current?.humidity || 0);

  // Overall Score Calculation
  const concernScores = useMemo(() => {
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
    const heatRisk = clamp((currentFeels - 32) * 5.5, 0, 42);
    const pmRisk = clamp(currentPm * 0.72, 0, 38);
    const rainRisk = clamp(currentRain * 0.22, 0, 16);
    const windRisk = clamp((currentWind - 12) * 0.9, 0, 10);
    return { heatRisk, pmRisk, rainRisk, windRisk };
  }, [currentFeels, currentPm, currentRain, currentWind]);

  const overallScore = Math.round(concernScores.heatRisk + concernScores.pmRisk + concernScores.rainRisk + concernScores.windRisk);
  const overallMeta = riskMeta(overallScore);

  const mapInsights = [
    'ตรวจพบจุดความร้อนสะสมและการเผาไหม้ในภาคเหนือและตะวันตกบางส่วน',
    'คุณภาพอากาศและฝุ่นควันอาจถูกพัดพาเข้าสู่พื้นที่ตอนกลางและกรุงเทพมหานครในช่วงบ่าย',
    'พื้นที่เกษตรกรรมมีอัตราความชื้นในดินต่ำลง ควรระวังความเสี่ยงภัยแล้ง',
  ];

  return (
    <Card id="overview" style={{ padding: isMobile ? 18 : 28, scrollMarginTop: 130 }}>
      <SectionHeader title="ภาพรวมสภาพอากาศวันนี้" eyebrow={`อัปเดตล่าสุด ${updateText} น.`} />

      <OverallScore
        score={overallScore}
        meta={overallMeta}
        title={overallScore >= 75 ? 'สภาพอากาศไม่ค่อยเป็นมิตร' : overallScore >= 55 ? 'อากาศแปรปรวน ควรเตรียมพร้อม' : overallScore >= 35 ? 'อากาศปานกลาง ทำกิจกรรมได้' : 'อากาศปลอดโปร่ง เป็นใจ'}
        summary={`คำนวณจากความร้อน (รู้สึก ${currentFeels}°C), PM2.5 (${currentPm}), และโอกาสฝน (${currentRain}%)`}
        isMobile={isMobile}
        details={[
          { label: 'อุณหภูมิ', text: heatMeta(currentFeels).label, color: heatMeta(currentFeels).color },
          { label: 'ฝุ่นควัน', text: pmMeta(currentPm).label, color: pmMeta(currentPm).color },
          { label: 'ฝน', text: currentRain >= 35 ? 'ควรพกร่ม' : 'ปลอดโปร่ง', color: currentRain >= 35 ? '#3b82f6' : '#16a34a' },
        ]}
      />

      <PhaseLabel>ข้อมูลขณะนี้</PhaseLabel>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
        <MetricCard icon="🌡️" label="อุณหภูมิ" value={`${currentTemp}°`} detail={`รู้สึกเหมือน ${currentFeels}°`} meta={heatMeta(currentFeels)} accent="#ef4444" />
        <MetricCard icon="🌫️" label="PM2.5" value={currentPm} meta={pmMeta(currentPm)} accent="#f97316" />
        <MetricCard icon="🌧️" label="โอกาสฝน" value={`${currentRain}%`} detail={`จากแผนที่ดาวเทียม`} accent="#3b82f6" />
        <MetricCard icon="💨" label="ลม" value={`${currentWind} km/h`} detail={windDirection} accent="#8b5cf6" />
        <MetricCard icon="💧" label="ความชื้น" value={`${currentHumidity}%`} detail="ความชื้นสัมพัทธ์" accent="#06b6d4" />
        <MetricCard icon="☀️" label="UV" value={Math.round(current?.uv || 0)} meta={uvStatus} accent={uvStatus.color} />
        <MetricCard icon="🧭" label="ความกดอากาศ" value={`${Math.round(current?.pressure || 0)}`} detail="hPa" accent="#64748b" />
        <MetricCard icon="👁️" label="ทัศนวิสัย" value={`${Math.round((current?.visibility || 0) / 1000)} km`} accent="#64748b" />
      </div>

      <ExpandableDetail label="วิเคราะห์ตำแหน่งปัจจุบันอย่างละเอียด">
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto' }} className="hide-scrollbar">
          {[['temp','อุณหภูมิ'],['rain','ฝน'],['pm25','PM2.5'],['wind','ลม'],['humidity','ความชื้น']].map(([id,lb]) => (
            <button key={id} onClick={() => setTrendTab(id)} style={{
              border: `1px solid ${trendTab===id?'#2563eb':'var(--border-color)'}`,
              background: trendTab===id?'#2563eb':'var(--bg-secondary)',
              color: trendTab===id?'#fff':'var(--text-sub)',
              borderRadius: 10, padding: '7px 12px', fontSize: '0.74rem', fontWeight: 800,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{lb}</button>
          ))}
        </div>
        <div style={{ height: 230, marginLeft: -10, marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 18, right: 12, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="aiTrendFill2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.28} />
                  <stop offset="96%" stopColor={chartColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-sub)' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-sub)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey={trendTab} name={trendTab.toUpperCase()} stroke={chartColor} strokeWidth={3} fill="url(#aiTrendFill2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <SectionTitle icon="🧾" title="สรุปจากแผนที่ (GISTDA)" subtitle="ข้อมูลพื้นที่เสี่ยงจากสถานีและดาวเทียม" />
        <GistdaBrief summary={gistdaSummary} isMobile={isMobile} />
        <InsightBox color="#0ea5e9" title="สรุปเพิ่มเติม">
          {mapInsights.join(' ')}
        </InsightBox>
      </ExpandableDetail>
    </Card>
  );
}
