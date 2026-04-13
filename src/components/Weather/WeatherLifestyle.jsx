import React from 'react';

export const WeatherLifestyle = ({ current, exercise, laundry, watering, spray, driving, camping, aqiText }) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 mb-4">
          <div className="bg-[var(--bg-card)] rounded-2xl md:rounded-3xl p-5 border border-[var(--border-color)] shadow-sm">
              <div className="flex items-center gap-2 text-[var(--text-sub)] font-bold text-sm">
                  <span className="text-xl">☀️</span> รังสีอัลตราไวโอเลต (UV)
              </div>
              <div className="text-3xl font-black text-[var(--text-main)] mt-2">
                  {current?.uv || 0} <span className="text-base font-normal text-[var(--text-sub)]">
                      {current?.uv > 8 ? 'สูงมาก' : current?.uv > 5 ? 'สูง' : current?.uv > 2 ? 'ปานกลาง' : 'ต่ำ'}
                  </span>
              </div>
              <div className="w-full h-2 bg-gradient-to-r from-green-500 via-yellow-500 via-orange-500 via-red-500 to-purple-500 rounded-full mt-4 relative">
                  <div className="absolute -top-1 w-4 h-4 bg-white border-[3px] border-slate-900 rounded-full shadow-md -translate-x-1/2" style={{ left: `${Math.min(((current?.uv || 0) / 11) * 100, 100)}%` }}></div>
              </div>
          </div>

          <div className="bg-[var(--bg-card)] rounded-2xl md:rounded-3xl p-5 border border-[var(--border-color)] shadow-sm">
              <div className="flex items-center gap-2 text-[var(--text-sub)] font-bold text-sm">
                  <span className="text-xl">😷</span> คุณภาพอากาศ (PM2.5)
              </div>
              <div className="text-3xl font-black text-[var(--text-main)] mt-2">
                  {current?.pm25 || 0} <span className="text-base font-normal text-[var(--text-sub)]">
                      {aqiText}
                  </span>
              </div>
              <div className="w-full h-2 bg-gradient-to-r from-sky-500 via-green-500 via-yellow-500 via-orange-500 to-red-500 rounded-full mt-4 relative">
                  <div className="absolute -top-1 w-4 h-4 bg-white border-[3px] border-slate-900 rounded-full shadow-md -translate-x-1/2" style={{ left: `${Math.min(((current?.pm25 || 0) / 100) * 100, 100)}%` }}></div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 shrink-0 mb-5">
          <LifestyleCard icon="🏃‍♂️" title="ออกกำลังกาย" data={exercise} />
          <LifestyleCard icon="👕" title="ซักผ้า / ล้างรถ" data={laundry} />
          <LifestyleCard icon="💧" title="รดน้ำต้นไม้" data={watering} />
          <LifestyleCard icon="🚁" title="ฉีดพ่นยา/ปุ๋ย" data={spray} />
          <LifestyleCard icon="🚘" title="ขับขี่เดินทาง" data={driving} />
          <LifestyleCard icon="⛺" title="เที่ยว / ตั้งแคมป์" data={camping} />
      </div>
    </>
  );
};

const LifestyleCard = ({ icon, title, data }) => (
    <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-color)] flex flex-col shadow-sm transition-transform hover:-translate-y-1">
        <div className="text-2xl mb-1">{icon}</div>
        <div className="text-[11px] text-[var(--text-sub)] font-bold">{title}</div>
        <div className="text-lg font-black" style={{ color: data.color }}>{data.text}</div>
        <div className="text-[10px] text-[var(--text-sub)] mt-auto pt-1">{data.desc}</div>
    </div>
);

export const TopStats = ({ top5Heat, top5Cool, top5PM25, top5Rain, isMobile }) => {
    return (
        <div className="shrink-0 mb-5">
            <h3 className="m-0 mb-3 text-lg text-[var(--text-main)] flex items-center gap-2 font-bold">
                📊 สถิติ Top 5 ระดับประเทศ (อัปเดตเรียลไทม์)
            </h3>
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'}`}>
                
                <StatCard title="🔥 ร้อนจัดที่สุด" data={top5Heat} color="#ef4444" unit="°" />
                <StatCard title="❄️ เย็นสบายที่สุด" data={top5Cool} color="#3b82f6" unit="°" />
                <StatCard title="😷 ฝุ่น PM2.5 สูงสุด" data={top5PM25} color="#f97316" unit="" />
                <StatCard title="☔ โอกาสฝนตกสูงสุด" data={top5Rain} color="#0ea5e9" unit="%" />

            </div>
        </div>
    );
};

const StatCard = ({ title, data, color, unit }) => (
    <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-color)] shadow-sm">
        <div className="text-sm font-bold mb-3 pb-1 border-b border-[var(--border-color)]" style={{ color }}>{title}</div>
        {data.map((st, i) => (
            <div key={i} className="flex justify-between text-xs md:text-sm mb-1.5">
                <span className="text-[var(--text-main)] truncate mr-2">{i+1}. {st.name}</span>
                <span className="font-bold shrink-0" style={{ color }}>{st.val}{unit}</span>
            </div>
        ))}
    </div>
);
