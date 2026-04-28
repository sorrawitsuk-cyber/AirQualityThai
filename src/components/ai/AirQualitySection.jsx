import React from 'react';
import { Wind, Sparkles, Sun } from 'lucide-react';
import { Card, BigStat, ExpandableDetail, SectionHeader, StatusBadge } from './SharedUI';
import { SectionTitle, RankingMini, MetricCard } from './ExtendedUI';

export default function AirQualitySection({ current, pm25, pm25Status, uvStatus, windDirection, isMobile, rankings, national }) {
  const gaugePercent = Math.min((pm25 / 150) * 100, 100);

  return (
    <Card id="airquality" style={{ padding: isMobile ? 18 : 28, scrollMarginTop: 130 }}>
      <SectionHeader title="คุณภาพอากาศและสถิติภาพรวม" icon={Wind} eyebrow="PM2.5 UV และสภาพลม" />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        {/* PM2.5 gauge */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 18, border: '1px solid var(--border-color)', padding: 22, textAlign: 'center' }}>
          <Sparkles size={28} color={pm25Status.color} />
          <div style={{ fontSize: '2.8rem', fontWeight: 900, color: pm25Status.color, lineHeight: 1.1, marginTop: 8 }}>
            {pm25}
          </div>
          <div style={{ color: 'var(--text-sub)', fontSize: '0.78rem', fontWeight: 700 }}>PM2.5 (µg/m³)</div>
          <StatusBadge text={pm25Status.text} color={pm25Status.color} />
          <div style={{ marginTop: 14, height: 8, background: 'var(--border-color)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              width: `${gaugePercent}%`, height: '100%', borderRadius: 99,
              background: `linear-gradient(90deg, #22c55e, #f59e0b, #ef4444)`,
              transition: 'width 0.8s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-sub)', marginTop: 4 }}>
            <span>ดี</span><span>ปานกลาง</span><span>มีผลกระทบ</span>
          </div>
        </div>

        {/* UV + Wind */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 18, border: '1px solid var(--border-color)', flex: 1 }}>
            <BigStat value={Math.round(current?.uv || 0)} label={`ดัชนี UV — ${uvStatus.text}`} color={uvStatus.color} icon={Sun} />
          </div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 18, border: '1px solid var(--border-color)', flex: 1 }}>
            <BigStat value={Math.round(current?.windSpeed || 0)} unit="km/h" label={`ลม ${windDirection || ''}`} color="#0284c7" icon={Wind} />
          </div>
        </div>
      </div>

      <ExpandableDetail label="ดูสถิติย้อนหลังและพื้นที่เสี่ยง" defaultOpen={false}>
        {/* Rankings */}
        <SectionTitle icon="🕘" title="สถิติย้อนหลังและอันดับสถานี" subtitle="แยกออกจากข้อมูลปัจจุบัน เพื่อให้เห็นพื้นที่เด่น" />
        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))', marginBottom: 18 }}>
          <RankingMini title="ร้อนสุดเมื่อวาน" items={rankings?.yesterdayHeat?.length ? rankings.yesterdayHeat : (rankings?.heat || [])} unit="°" accent="#ef4444" />
          <RankingMini title="ฝุ่นสูงเมื่อวาน" items={rankings?.yesterdayPm25?.length ? rankings.yesterdayPm25 : (rankings?.pm25 || [])} unit="" accent="#f97316" />
          <RankingMini title="พื้นที่ฝนเด่นตอนนี้" items={rankings?.rain || []} unit="%" accent="#3b82f6" />
          <RankingMini title="เย็นสุดจากสถานี" items={rankings?.cool || []} unit="°" accent="#06b6d4" />
        </div>

        {/* Top Risks and National */}
        <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
          <div>
            <SectionTitle icon="🏙️" title="จังหวัดที่ควรจับตา" subtitle={`วิเคราะห์จาก ${national?.stationCount || 0} สถานี โดยถ่วงน้ำหนักความร้อน ฝุ่น ฝน และลม`} />
            <div style={{ display: 'grid', gap: '10px' }}>
              {(rankings?.risk || []).slice(0, 5).map((row, index) => (
                <div key={row.id} style={{ alignItems: 'center', background: row.riskMeta.bg, border: `1px solid ${row.riskMeta.border}`, borderRadius: '16px', display: 'grid', gap: '10px', gridTemplateColumns: '34px 1fr auto', padding: '12px' }}>
                  <span style={{ alignItems: 'center', background: 'var(--analysis-rank-badge)', borderRadius: 999, color: row.riskMeta.color, display: 'flex', fontSize: '0.78rem', fontWeight: 950, height: 30, justifyContent: 'center', width: 30 }}>{index + 1}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'var(--text-main)', fontSize: '0.84rem', fontWeight: 950, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</div>
                    <div style={{ color: 'var(--text-sub)', fontSize: '0.7rem', marginTop: 3 }}>ร้อน {row.feelsLike}° · PM2.5 {row.pm25} · ฝน {row.rain}%</div>
                  </div>
                  <div style={{ color: row.riskMeta.color, fontSize: '0.86rem', fontWeight: 950, textAlign: 'right' }}>{row.riskScore}<span style={{ fontSize: '0.65rem' }}>/100</span></div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle icon="📊" title="ภาพรวมจากสถานีทั้งหมด" subtitle="ตัวเลขเฉลี่ยระดับประเทศ" />
            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(2, 1fr)' }}>
              <MetricCard icon="🌡️" label="เฉลี่ยอุณหภูมิ" value={`${national?.temp || 0}°`} detail={`รู้สึกเฉลี่ย ${national?.feelsLike || 0}°`} accent="#f97316" />
              <MetricCard icon="🌫️" label="เฉลี่ย PM2.5" value={national?.pm25 || 0} detail="จากสถานีที่อ่านได้" accent="#22c55e" />
              <MetricCard icon="🌧️" label="เฉลี่ยโอกาสฝน" value={`${national?.rain || 0}%`} detail={`ครอบคลุม ${national?.stationCount || 0} สถานี`} accent="#3b82f6" />
              <MetricCard icon="🏙️" label="พื้นที่เสี่ยงสุด" value={national?.topRisk?.name || '-'} detail={national?.topRisk ? `${national.topRisk.riskScore}/100` : 'ยังไม่พบ'} accent={national?.topRisk?.riskMeta?.color || '#0ea5e9'} />
            </div>
          </div>
        </div>
      </ExpandableDetail>
    </Card>
  );
}
