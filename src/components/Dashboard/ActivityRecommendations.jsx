import React from 'react';
import { 
    getExerciseStatus, getLaundryStatus, getWateringStatus, 
    getSprayStatus, getDrivingStatus, getCampingStatus 
} from '../../utils/weatherHelpers';

export default function ActivityRecommendations({ current, chartData = [], isMobile, cardBg, borderColor, subTextColor }) {
  const exercise = getExerciseStatus(current);
  const laundry = getLaundryStatus(current);
  const watering = getWateringStatus(current);
  const spray = getSprayStatus(current);
  const driving = getDrivingStatus(current);
  const camping = getCampingStatus(current);

  const next3 = chartData.slice(1, 4); // next 3 hours

  const ActivityCard = ({ title, icon, status, desc, color }) => (
    <div style={{ background: cardBg, borderRadius: '20px', padding: '15px', border: `1px solid ${borderColor}`, borderLeft: `4px solid ${color}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>{icon}</div>
        <div style={{ fontSize: '0.8rem', color: subTextColor, fontWeight: 'bold' }}>{title}</div>
        <div style={{ fontSize: '1.2rem', fontWeight: '900', color: color }}>{status}</div>
        <div style={{ fontSize: '0.7rem', color: subTextColor, marginTop: '5px' }}>{desc}</div>
        
        {next3.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '10px', borderTop: `1px dashed ${borderColor}` }}>
               {next3.map((h, i) => (
                   <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <span style={{ fontSize: '0.65rem', color: subTextColor }}>{h.time}</span>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ fontSize: '0.9rem' }}>{h.icon}</span>
                        <span style={{ color: '#60a5fa', fontSize: '0.65rem', fontWeight: 'bold' }}>{h.rain}%</span>
                     </div>
                  </div>
               ))}
            </div>
        )}
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '10px', flexShrink: 0, marginBottom: '20px' }}>
        <ActivityCard title="ออกกำลังกาย" icon="🏃‍♂️" status={exercise.text} desc={exercise.desc} color={exercise.color} />
        <ActivityCard title="ซักผ้า / ล้างรถ" icon="👕" status={laundry.text} desc={laundry.desc} color={laundry.color} />
        <ActivityCard title="รดน้ำต้นไม้" icon="💧" status={watering.text} desc={watering.desc} color={watering.color} />
        <ActivityCard title="ฉีดพ่นยา/ปุ๋ย" icon="🚁" status={spray.text} desc={spray.desc} color={spray.color} />
        <ActivityCard title="ขับขี่เดินทาง" icon="🚘" status={driving.text} desc={driving.desc} color={driving.color} />
        <ActivityCard title="เที่ยว / ตั้งแคมป์" icon="⛺" status={camping.text} desc={camping.desc} color={camping.color} />
    </div>
  );
}
