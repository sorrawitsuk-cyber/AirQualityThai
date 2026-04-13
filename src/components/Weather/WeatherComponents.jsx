import React from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, LabelList } from 'recharts';

export const WeatherHero = ({ locationName, coords, current, isMobile, showFilter, setShowFilter }) => {
  const isRaining = current?.rainProb > 30;
  const isHot = current?.feelsLike >= 38;
  const currentHour = new Date().getHours();
  const isNight = currentHour >= 18 || currentHour < 6; 

  const weatherIcon = isRaining ? '🌧️' : (isNight ? '🌙' : (isHot ? '☀️' : '🌤️'));
  const weatherText = isRaining ? 'มีโอกาสฝนตก' : (isNight ? 'ท้องฟ้าโปร่งยามค่ำคืน' : (isHot ? 'แดดร้อนจัด' : 'อากาศดี มีเมฆบางส่วน'));
  
  let bgGradient = isNight ? 'bg-gradient-to-br from-indigo-950 to-slate-900' : 'bg-gradient-to-br from-sky-400 to-sky-500';
  if (isRaining) bgGradient = 'bg-gradient-to-br from-slate-700 to-slate-900'; 
  else if (isHot && !isNight) bgGradient = 'bg-gradient-to-br from-orange-500 to-red-800';

  const aqiBg = current?.pm25 > 75 ? 'bg-red-500' : current?.pm25 > 37.5 ? 'bg-orange-500' : current?.pm25 > 25 ? 'bg-yellow-500' : current?.pm25 > 15 ? 'bg-green-500' : 'bg-sky-500';
  const aqiText = current?.pm25 > 75 ? 'มีผลกระทบต่อสุขภาพ' : current?.pm25 > 37.5 ? 'เริ่มมีผลกระทบ' : current?.pm25 > 25 ? 'ปานกลาง' : current?.pm25 > 15 ? 'คุณภาพอากาศดี' : 'อากาศดีมาก';

  return (
    <div className={`relative flex flex-col p-6 text-white rounded-3xl shadow-2xl transition-all duration-500 shrink-0 ${bgGradient} ${isMobile ? 'rounded-2xl p-5' : 'md:p-8'}`}>
        <div className="flex justify-between items-start w-full mb-4">
          <div>
            <h2 className="m-0 text-2xl md:text-3xl font-black leading-tight text-white drop-shadow-md">{locationName}</h2>
            <div className="text-xs opacity-80 mt-1">พิกัด: {coords?.lat?.toFixed(2)}, {coords?.lon?.toFixed(2)}</div>
          </div>
          <button 
            onClick={() => setShowFilter(!showFilter)} 
            className="flex justify-center items-center w-10 h-10 border-none rounded-full cursor-pointer shrink-0 backdrop-blur-md bg-white/20 hover:bg-white/30 transition-colors"
          >
              <span className="text-xl">{showFilter ? '✖️' : '🔍'}</span>
          </button>
        </div>

        <div className="flex items-center gap-4 self-center mt-2">
          <span className="text-7xl md:text-8xl leading-none drop-shadow-lg">{weatherIcon}</span>
          <span className="text-7xl md:text-8xl font-black leading-none drop-shadow-lg">{Math.round(current?.temp || 0)}°</span>
        </div>
        <div className="text-xl md:text-2xl font-bold mt-4 self-center text-center drop-shadow-md">{weatherText}</div>
        <div className="text-sm opacity-90 self-center mt-1">รู้สึกเหมือน {Math.round(current?.feelsLike || 0)}°C</div>
        
        <div className={`mt-5 px-5 py-1.5 rounded-full font-black text-sm shadow-lg self-center ${aqiBg} text-white`}>
            😷 PM2.5: {current?.pm25 || '-'} µg/m³ <span className="opacity-90 font-medium ml-1">({aqiText})</span>
        </div>
    </div>
  );
};

export const WeatherStats = ({ current, getWindDir, chartData }) => {
  const getSunTime = (dateStr) => dateStr ? new Date(dateStr).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}) : '--:--';
  const cardClass = "bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col justify-center transition-all hover:shadow-md";
  const labelClass = "text-xs font-bold text-[var(--text-sub)] mb-1";
  const valClass = "text-xl font-black text-[var(--text-main)]";
  const descClass = "text-[10px] text-[var(--text-sub)] whitespace-nowrap overflow-hidden text-ellipsis mt-1";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 shrink-0">
        <div className={cardClass}>
            <div className={labelClass}>💧 ความชื้น</div>
            <div className={valClass}>{Math.round(current?.humidity || 0)} <span className="text-sm">%</span></div>
            <div className={descClass}>{current?.humidity > 60 ? 'ค่อนข้างชื้น' : 'กำลังดี'}</div>
        </div>
        <div className={cardClass}>
            <div className={labelClass}>🌬️ ลมพัด ({getWindDir(current?.windDirection)})</div>
            <div className={valClass}>{Math.round(current?.windSpeed || 0)} <span className="text-sm">กม./ชม.</span></div>
            <div className={descClass}>{current?.windSpeed > 15 ? 'ลมแรง' : 'ลมสงบ'}</div>
        </div>
        <div className={cardClass}>
            <div className={labelClass}>☔ ฝนตก/ปริมาณ</div>
            <div className={valClass}>{chartData[0]?.rain || 0} <span className="text-sm">%</span></div>
            <div className={descClass}>{current?.precipitation > 0 ? `ปริมาณ ${current?.precipitation} mm` : 'ไม่มีฝนตก'}</div>
        </div>
        <div className={cardClass}>
            <div className={labelClass}>👁️ ทัศนวิสัย</div>
            <div className={valClass}>{(current?.visibility / 1000).toFixed(1)} <span className="text-sm">กม.</span></div>
            <div className={descClass}>{current?.visibility < 2000 ? 'มีหมอกหนา' : 'เคลียร์'}</div>
        </div>
        <div className={cardClass}>
            <div className={labelClass}>🧭 ความกดอากาศ</div>
            <div className={valClass}>{Math.round(current?.pressure || 0)} <span className="text-sm">hPa</span></div>
        </div>
        <div className={cardClass}>
            <div className={labelClass}>🌅 ดวงอาทิตย์</div>
            <div className="text-sm font-bold text-[var(--text-main)]">ขึ้น {getSunTime(current?.sunrise)}</div>
            <div className="text-sm font-bold text-[var(--text-main)]">ตก {getSunTime(current?.sunset)}</div>
        </div>
    </div>
  );
};

export const Forecast24h = ({ chartData, scrollRef, handleMouseDown, handleMouseLeave, handleMouseUp, handleMouseMove, isDragging }) => {
  const CustomXAxisTick = ({ x, y, payload }) => {
    const item = chartData[payload.index];
    if (!item) return null;
    const pmColor = item.pm25 > 75 ? '#ef4444' : item.pm25 > 37.5 ? '#f97316' : item.pm25 > 25 ? '#eab308' : item.pm25 > 15 ? '#22c55e' : '#0ea5e9';
    return (
      <g transform={`translate(${x},${y})`}>
        <foreignObject x={-40} y={10} width={80} height={90}>
          <div className="flex flex-col items-center text-xs font-bold font-[Sarabun,sans-serif] text-center leading-tight">
            <span className="text-[var(--text-sub)]">{item.time}</span>
            <span className="text-blue-500 mt-1">☔ {item.rain}%<br/>{item.rainAmount > 0 ? `(${item.rainAmount}mm)` : ''}</span>
            <span className="mt-1" style={{ color: pmColor }}>😷 {item.pm25}</span>
          </div>
        </foreignObject>
      </g>
    );
  };

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl md:rounded-3xl p-4 md:p-6 border border-[var(--border-color)] shrink-0 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="m-0 text-base font-bold text-[var(--text-main)]">⏱️ 24 ชั่วโมงข้างหน้า</h3>
          <span className="text-xs text-[var(--text-sub)] bg-[var(--bg-secondary)] px-2 py-1 rounded-md">เลื่อนซ้ายขวาได้ ↔️</span>
        </div>
        <div 
            ref={scrollRef}
            onMouseDown={handleMouseDown} onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}
            className={`w-full overflow-x-auto overflow-y-hidden pb-2 hide-scrollbar ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
        >
            <div className="w-[1400px] h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 15, left: 15, bottom: 60 }}>
                    <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="50%" stopColor="#f97316" stopOpacity={0.4}/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="lineTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={1}/>
                        <stop offset="50%" stopColor="#f97316" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={1}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="time" axisLine={false} tickLine={false} interval={0} tick={<CustomXAxisTick />} />
                    <Area type="monotone" dataKey="temp" stroke="url(#lineTemp)" strokeWidth={4} fillOpacity={1} fill="url(#colorTemp)">
                        <LabelList dataKey="temp" position="top" offset={10} style={{ fill: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 'bold' }} formatter={(val) => `${val}°`} />
                    </Area>
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
  );
};

export const Forecast7Days = ({ daily, isMobile }) => {
  return (
    <div className="bg-[var(--bg-card)] rounded-2xl md:rounded-3xl p-4 md:p-6 border border-[var(--border-color)] shrink-0 shadow-sm flex flex-col h-full">
        <h3 className="m-0 text-base font-bold text-[var(--text-main)] mb-4">📅 พยากรณ์ 7 วัน</h3>
        <div className="flex flex-col gap-4">
            {daily?.time?.map((t, idx) => (
                <div key={idx} className={`flex flex-col pb-3 ${idx !== 6 ? 'border-b border-[var(--border-color)]' : ''}`}>
                    
                    <div className="flex items-center gap-3">
                        <div className="text-sm md:text-base font-bold text-[var(--text-main)] w-12 shrink-0">{idx === 0 ? 'วันนี้' : new Date(t).toLocaleDateString('th-TH', {weekday:'short'})}</div>
                        <div className="text-2xl text-center w-8 shrink-0">{daily.weathercode[idx] > 50 ? '🌧️' : '🌤️'}</div>
                        <div className="flex items-center gap-2 flex-1">
                            <span className="text-xs font-bold text-[var(--text-sub)] w-6 text-right shrink-0">{Math.round(daily?.temperature_2m_min?.[idx] || 0)}°</span>
                            <div className="flex-1 h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden relative">
                                <div className="absolute left-1/5 right-1/5 top-0 bottom-0 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full"></div>
                            </div>
                            <span className="text-sm font-black text-[var(--text-main)] w-6 shrink-0">{Math.round(daily?.temperature_2m_max?.[idx] || 0)}°</span>
                        </div>
                    </div>

                    <div className="ml-0 md:ml-12 flex justify-between mt-2 bg-[var(--bg-overlay)] px-3 py-1.5 rounded-lg text-[10px] font-bold text-[var(--text-sub)]">
                        <div className="flex items-center gap-1">
                            <span className="text-sm">☔</span> 
                            {daily?.precipitation_probability_max?.[idx] || 0}% 
                            {daily?.precipitation_sum?.[idx] > 0 && <span className="opacity-70 ml-0.5">({daily.precipitation_sum[idx]}mm)</span>}
                        </div>
                        <div className="flex items-center gap-1"><span className="text-sm">🥵</span> {Math.round(daily?.apparent_temperature_max?.[idx] || 0)}°</div>
                        <div className="flex items-center gap-1">
                            <span className="text-sm">😷</span> 
                            <span className={daily?.pm25_max?.[idx] > 75 ? 'text-red-500' : daily?.pm25_max?.[idx] > 37.5 ? 'text-orange-500' : daily?.pm25_max?.[idx] > 25 ? 'text-yellow-500' : daily?.pm25_max?.[idx] > 15 ? 'text-green-500' : 'text-sky-500' }>
                            {daily?.pm25_max?.[idx] || 0} <span className="text-[8px]">µg</span>
                            </span>
                        </div>
                    </div>

                </div>
            ))}
        </div>
    </div>
  );
};
