import React from 'react';
import { Dumbbell } from 'lucide-react';
import { Card, SectionHeader } from './SharedUI';
import { SectionTitle, Panel } from './ExtendedUI';
import ActivityRecommendations from '../Dashboard/ActivityRecommendations';

export default function ActivitiesSection({ current, rainProb, pm25, isMobile }) {
  const currentTemp = Math.round(current?.temp || 0);
  const currentFeels = Math.round(current?.feelsLike || currentTemp);
  const currentPm = Math.round(pm25 || 0);
  const currentRain = Math.round(rainProb || 0);
  const currentWind = Math.round(current?.windSpeed || 0);
  const currentHumidity = Math.round(current?.humidity || 0);
  const currentUv = Number(current?.uv || 0);

  const compactActivities = [
    {
      icon: '👕',
      title: 'ซักผ้า / ล้างรถ',
      score: currentRain >= 45 ? 5.8 : 8.8,
      text: currentRain >= 45 ? 'พอใช้ ควรดูเมฆฝนก่อน' : 'เหมาะ ช่วงก่อนบ่าย',
      color: currentRain >= 45 ? '#f59e0b' : '#16a34a',
    },
    {
      icon: '🏃',
      title: 'ออกกำลังกาย',
      score: currentFeels >= 38 || currentPm >= 50 ? 4.6 : 7.4,
      text: currentFeels >= 38 ? 'เลี่ยงแดดจัด' : 'เหมาะช่วงเช้า/เย็น',
      color: currentFeels >= 38 || currentPm >= 50 ? '#f97316' : '#16a34a',
    },
    {
      icon: '🚗',
      title: 'เดินทาง',
      score: currentRain >= 60 ? 5.2 : 7.8,
      text: currentRain >= 60 ? 'ระวังฝนและถนนลื่น' : 'เดินทางได้ค่อนข้างดี',
      color: currentRain >= 60 ? '#f59e0b' : '#16a34a',
    },
  ];

  const primaryAdvice = [
    currentFeels >= 38 ? 'เลี่ยงแดดช่วงเที่ยงถึงบ่าย และวางแผนงานกลางแจ้งเป็นช่วงสั้น' : 'กิจกรรมกลางแจ้งทำได้ดีขึ้นในช่วงเช้าหรือเย็น',
    currentRain >= 40 ? 'พกร่มหรือเสื้อกันฝน โดยเฉพาะช่วงบ่ายถึงเย็น' : 'ฝนไม่ใช่ปัจจัยหลักตอนนี้ แต่ควรดูเรดาร์ก่อนเดินทางไกล',
    currentPm >= 50 ? 'กลุ่มเด็ก ผู้สูงอายุ และผู้มีโรคทางเดินหายใจควรลดกิจกรรมกลางแจ้ง' : 'ฝุ่นยังอยู่ในระดับที่รับมือได้สำหรับคนทั่วไป',
    currentUv >= 8 ? 'รังสี UV สูง ควรใช้กันแดด หมวก หรือร่มเมื่ออยู่กลางแจ้งนาน' : 'UV ไม่สูงมาก แต่ยังควรป้องกันผิวตามปกติ',
  ];

  return (
    <Card id="activities" style={{ padding: isMobile ? 18 : 28, scrollMarginTop: 130 }}>
      <SectionHeader title="กิจกรรมและคำแนะนำ" icon={Dumbbell} eyebrow="ประเมินจากอุณหภูมิ ฝน ฝุ่น และลม" />

      <div style={{ display: 'grid', gap: '18px', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        {isMobile ? (
          <div>
            <SectionTitle icon="🎯" title="กิจกรรมที่เหมาะตอนนี้" subtitle="สรุป 3 กิจกรรมสำคัญบนมือถือ ส่วน Radar เต็มเหมาะกับจอใหญ่" />
            <div style={{ display: 'grid', gap: '10px' }}>
              {compactActivities.map((item) => (
                <div key={item.title} style={{
                  alignItems: 'center',
                  background: `${item.color}10`,
                  border: `1px solid ${item.color}30`,
                  borderRadius: '16px',
                  display: 'grid',
                  gap: '10px',
                  gridTemplateColumns: '36px 1fr auto',
                  padding: '12px',
                }}>
                  <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'var(--text-main)', fontSize: '0.84rem', fontWeight: 950 }}>{item.title}</div>
                    <div style={{ color: 'var(--text-sub)', fontSize: '0.72rem', fontWeight: 750, marginTop: '3px' }}>{item.text}</div>
                  </div>
                  <div style={{ color: item.color, fontSize: '1rem', fontWeight: 950 }}>{item.score.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ActivityRecommendations
            current={{
              ...current,
              temp: currentTemp,
              feelsLike: currentFeels,
              rainProb: currentRain,
              windSpeed: currentWind,
              humidity: currentHumidity,
              pm25: currentPm,
            }}
            isMobile={isMobile}
            cardBg="var(--bg-secondary)"
            borderColor="var(--border-color)"
            subTextColor="var(--text-sub)"
          />
        )}

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '20px' }}>
          <SectionTitle icon="🧠" title="คำแนะนำแบบเข้าใจง่าย" subtitle="สรุปสิ่งที่ควรทำจากข้อมูลตอนนี้และแนวโน้มใกล้ตัว" />
          <div style={{ display: 'grid', gap: '10px' }}>
            {primaryAdvice.map((advice, index) => (
              <div key={advice} style={{
                alignItems: 'flex-start',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                display: 'flex',
                gap: '10px',
                padding: '12px',
              }}>
                <span style={{ alignItems: 'center', background: '#0ea5e91f', borderRadius: 999, color: '#0ea5e9', display: 'flex', flex: '0 0 28px', fontSize: '0.78rem', fontWeight: 950, height: 28, justifyContent: 'center' }}>{index + 1}</span>
                <span style={{ color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.58 }}>{advice}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
