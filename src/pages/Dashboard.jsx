import React, { useContext, useState, useEffect, useMemo, useRef } from 'react';
import { WeatherContext } from '../context/WeatherContext';
import { useWeatherData } from '../hooks/useWeatherData';
import { WeatherHero, WeatherStats, Forecast24h, Forecast7Days } from '../components/Weather/WeatherComponents';
import { WeatherLifestyle, TopStats } from '../components/Weather/WeatherLifestyle';

export default function Dashboard() {
  const { stations, stationTemps, lastUpdated } = useContext(WeatherContext);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showFilter, setShowFilter] = useState(false);
  const [geoData, setGeoData] = useState([]);
  const [geoError, setGeoError] = useState(false);

  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const { 
      weatherData, loadingWeather, locationName, setLocationName, fetchWeatherByCoords,
      selectedProv, setSelectedProv, selectedDist, setSelectedDist
  } = useWeatherData();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setShowFilter(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetch('/thai_geo.json')
      .then(res => res.json())
      .then(data => setGeoData(Array.isArray(data) ? data : (data.data || [])))
      .catch(e => setGeoError(true));
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current?.offsetLeft);
    setScrollLeft(scrollRef.current?.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const sortedStations = useMemo(() => {
    return [...(stations || [])].sort((a, b) => a.areaTH.localeCompare(b.areaTH, 'th'));
  }, [stations]);

  const currentAmphoes = useMemo(() => {
    if (!geoData || geoData.length === 0 || !selectedProv) return [];
    const cleanProv = selectedProv.replace('จังหวัด', '').trim();
    const pObj = geoData.find(p => {
      const pName = String(p.name_th || p.nameTh || p.name || '').replace('จังหวัด', '').trim();
      return pName === cleanProv || pName.includes(cleanProv);
    });

    if (pObj) {
      const distArray = pObj.amphure || pObj.amphures || pObj.district || [];
      return [...distArray].map(a => ({
        id: a.id || Math.random(), 
        name: String(a.name_th || a.nameTh || a.name || '').trim()
      })).filter(a => a.name !== "").sort((a, b) => a.name.localeCompare(b.name, 'th'));
    }
    return [];
  }, [geoData, selectedProv]);

  const handleProvChange = (e) => {
    const pName = e.target.value;
    setSelectedProv(pName); setSelectedDist('');
    const found = stations?.find(s => s.areaTH === pName);
    if (found) { 
      fetchWeatherByCoords(found.lat, found.long); 
      setLocationName(pName); 
    }
  };

  const handleDistChange = async (e) => {
    const dName = e.target.value;
    setSelectedDist(dName);
    if (!dName) return;
    setLocationName(`${dName}, ${selectedProv}`);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dName + ' ' + selectedProv)}&limit=1`);
      const data = await res.json();
      if (data?.[0]) fetchWeatherByCoords(parseFloat(data[0].lat), parseFloat(data[0].lon));
    } catch (err) { console.error(err); }
  };

  const top5Heat = useMemo(() => {
    return [...(stations || [])].map(st => ({ name: st.areaTH.replace('จังหวัด',''), val: Math.round(stationTemps?.[st.stationID]?.temp || -99) })).filter(st => st.val !== -99).sort((a, b) => b.val - a.val).slice(0, 5);
  }, [stations, stationTemps]);

  const top5Cool = useMemo(() => {
    return [...(stations || [])].map(st => ({ name: st.areaTH.replace('จังหวัด',''), val: Math.round(stationTemps?.[st.stationID]?.temp || 999) })).filter(st => st.val !== 999).sort((a, b) => a.val - b.val).slice(0, 5);
  }, [stations, stationTemps]);

  const top5PM25 = useMemo(() => {
    return [...(stations || [])].map(st => ({ name: st.areaTH.replace('จังหวัด',''), val: st.AQILast?.PM25?.value || 0 })).filter(st => st.val > 0).sort((a, b) => b.val - a.val).slice(0, 5);
  }, [stations]);

  const top5Rain = useMemo(() => {
    return [...(stations || [])].map(st => ({ name: st.areaTH.replace('จังหวัด',''), val: stationTemps?.[st.stationID]?.rainProb || 0 })).filter(st => st.val > 0).sort((a, b) => b.val - a.val).slice(0, 5);
  }, [stations, stationTemps]);

  if (loadingWeather || !weatherData) return (
    <div className="loading-container bg-[var(--bg-app)] text-[var(--text-main)]">
        <div className="loading-spinner w-20 h-20 relative mb-6"></div>
        <div className="text-xl font-black mt-4 bg-gradient-to-r from-sky-500 via-purple-500 to-pink-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradientText_3s_linear_infinite]">กำลังประมวลผลข้อมูลสภาพอากาศ...</div>
        <div className="text-sm text-[var(--text-sub)] mt-2 opacity-80">เตรียมพร้อมข้อมูลพื้นที่ของคุณ</div>
    </div>
  );

  const { current, hourly, daily, coords } = weatherData;

  const nowMs = Date.now();
  const startIdx = hourly?.time?.findIndex(t => new Date(t).getTime() >= nowMs - 3600000) || 0;
  const chartData = (hourly?.time?.slice(startIdx, startIdx + 24) || []).map((t, i) => {
    const rIdx = startIdx + i;
    return {
      time: new Date(t).getHours().toString().padStart(2, '0') + ':00',
      temp: Math.round(hourly?.temperature_2m?.[rIdx] || 0),
      rain: hourly?.precipitation_probability?.[rIdx] || 0,
      rainAmount: hourly?.precipitation?.[rIdx] || 0,
      pm25: Math.round(hourly?.pm25?.[rIdx] || 0)
    };
  });

  const getWindDir = (deg) => {
    if (deg >= 337.5 || deg < 22.5) return 'เหนือ';
    if (deg >= 22.5 && deg < 67.5) return 'ตอ.เฉียงเหนือ';
    if (deg >= 67.5 && deg < 112.5) return 'ตะวันออก';
    if (deg >= 112.5 && deg < 157.5) return 'ตอ.เฉียงใต้';
    if (deg >= 157.5 && deg < 202.5) return 'ใต้';
    if (deg >= 202.5 && deg < 247.5) return 'ตต.เฉียงใต้';
    if (deg >= 247.5 && deg < 292.5) return 'ตะวันตก';
    if (deg >= 292.5 && deg < 337.5) return 'ตต.เฉียงเหนือ';
    return '-';
  };

  let alertBanner = null;
  if (current?.pm25 > 75) alertBanner = { type: 'PM2.5', color: '#ef4444', icon: '😷', text: 'มลพิษระดับอันตราย ควรสวมหน้ากาก N95 และงดกิจกรรมกลางแจ้ง' };
  else if (current?.rainProb > 70) alertBanner = { type: 'Rain', color: '#3b82f6', icon: '⛈️', text: 'มีพายุฝนฟ้าคะนองในพื้นที่' };
  else if (current?.feelsLike >= 42) alertBanner = { type: 'Heat', color: '#ea580c', icon: '🔥', text: 'ดัชนีความร้อนวิกฤต ระวังโรคลมแดด' };

  const maxTemp = Math.round(daily?.temperature_2m_max?.[0] || 0);
  const dailyRainProb = daily?.precipitation_probability_max?.[0] || 0;
  let briefingText = `วันนี้สภาพอากาศโดยรวม อุณหภูมิสูงสุดจะอยู่ที่ ${maxTemp}°C `;
  if (dailyRainProb > 40) briefingText += `และมีโอกาสเกิดฝนตก ${dailyRainProb}% แนะนำให้พกร่มหรืออุปกรณ์กันฝนก่อนออกจากบ้านครับ ☔`;
  else if (maxTemp >= 38) briefingText += `อากาศค่อนข้างร้อนจัด ควรดื่มน้ำบ่อยๆ และหลีกเลี่ยงการทำกิจกรรมกลางแจ้งเป็นเวลานานครับ 🥤`;
  else if (current?.pm25 > 37.5) briefingText += `ค่าฝุ่น PM2.5 ค่อนข้างสูง แนะนำให้สวมหน้ากากอนามัยเมื่อออกนอกอาคารครับ 😷`;
  else briefingText += `อากาศเป็นใจ เหมาะสำหรับการทำกิจกรรมนอกบ้านหรือซักผ้าครับ ✨`;

  let exercise = { text: 'ดีเยี่ยม', color: '#0ea5e9', desc: 'อากาศดีมาก ฝุ่นน้อย' };
  if (current?.pm25 > 75 || current?.feelsLike > 39 || current?.rainProb > 60) exercise = { text: 'งดกิจกรรม', color: '#ef4444', desc: 'สภาพอากาศไม่เหมาะสม' };
  else if (current?.pm25 > 37.5 || current?.feelsLike > 35) exercise = { text: 'ลดเวลา', color: '#f97316', desc: 'มีผลกระทบต่อสุขภาพ' };
  else if (current?.pm25 > 25) exercise = { text: 'พอใช้', color: '#eab308', desc: 'คุณภาพอากาศปานกลาง' };
  else if (current?.pm25 > 15) exercise = { text: 'ดี', color: '#22c55e', desc: 'คุณภาพอากาศดี' };

  let laundry = { text: 'ทำได้เลย', color: '#22c55e', desc: 'แดดดี ฝนไม่ตก' };
  if (current?.rainProb > 50 || current?.rain > 0) laundry = { text: 'ไม่แนะนำ', color: '#ef4444', desc: 'มีความเสี่ยงฝนตก' };
  else if (current?.rainProb > 20) laundry = { text: 'มีความเสี่ยง', color: '#eab308', desc: 'ควรจับตาดูเมฆฝน' };

  let watering = { text: 'ควรรดน้ำ', color: '#3b82f6', desc: 'ดินอาจแห้ง ดินขาดน้ำ' };
  if (current?.rainProb > 60 || current?.rain > 0) watering = { text: 'ไม่ต้องรด', color: '#94a3b8', desc: 'ฝนจะตกช่วยรดให้' };

  let spray = { text: 'ฉีดพ่นได้', color: '#22c55e', desc: 'ลมสงบ น้ำยาไม่ปลิว' };
  if (current?.windSpeed > 15) spray = { text: 'ลมแรงไป', color: '#ef4444', desc: 'น้ำยาอาจปลิวสูญเปล่า' };
  else if (current?.rainProb > 40) spray = { text: 'เสี่ยงฝนชะล้าง', color: '#f97316', desc: 'ฝนอาจชะล้างน้ำยา' };

  let driving = { text: 'ปลอดภัย', color: '#22c55e', desc: 'ทัศนวิสัยเคลียร์ ถนนแห้ง' };
  if ((current?.visibility / 1000) < 2 || current?.rainProb > 60) driving = { text: 'เพิ่มระมัดระวัง', color: '#ef4444', desc: 'ทัศนวิสัยต่ำ/ถนนลื่น' };
  else if ((current?.visibility / 1000) < 5 || current?.rainProb > 30) driving = { text: 'ระวังฝนระยะสั้น', color: '#eab308', desc: 'อาจมีฝนปรอย/หมอกลง' };

  let camping = { text: 'บรรยากาศดี', color: '#22c55e', desc: 'อากาศโปร่ง เหมาะจัดทริป' };
  if (current?.rainProb > 50 || current?.windSpeed > 25) camping = { text: 'เลื่อนไปก่อน', color: '#ef4444', desc: 'เสี่ยงพายุและลมแรง' };
  else if (current?.pm25 > 37.5 || current?.feelsLike > 38) camping = { text: 'ไม่น่าสบายนัก', color: '#f97316', desc: 'ฝุ่นหนาหรือร้อนจัด' };

  const aqiText = current?.pm25 > 75 ? 'มีผลกระทบวิกฤต' : current?.pm25 > 37.5 ? 'เริ่มมีผลกระทบ' : current?.pm25 > 25 ? 'ปานกลาง' : current?.pm25 > 15 ? 'คุณภาพอากาศดี' : 'อากาศดีมาก';

  return (
    <div className="w-full h-full bg-[var(--bg-app)] flex justify-center overflow-y-auto hide-scrollbar text-[var(--text-main)] font-[Sarabun,sans-serif]">
      <div className="w-full max-w-7xl flex flex-col gap-4 p-4 md:p-8 pb-12 lg:pb-8">

        {alertBanner && (
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl text-white font-bold shadow-lg animate-[fadeIn_0.3s_ease] shrink-0" style={{ background: alertBanner.color }}>
                <span className="text-2xl">{alertBanner.icon}</span> <span className="text-sm md:text-base">{alertBanner.text}</span>
            </div>
        )}

        {showFilter && (
            <div className="flex flex-wrap items-center gap-3 bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] animate-[fadeIn_0.3s_ease] shrink-0">
              <select value={selectedProv} onChange={handleProvChange} className="flex-1 min-w-[140px] bg-[var(--bg-secondary)] text-sky-500 border-none font-bold text-sm p-3 rounded-xl outline-none cursor-pointer">
                <option value="">-- เลือกจังหวัด --</option>
                {sortedStations.map(p => <option key={p.stationID} value={p.areaTH}>{p.areaTH}</option>)}
              </select>
              <select value={selectedDist} onChange={handleDistChange} disabled={!selectedProv || geoData.length === 0 || currentAmphoes.length === 0} className={`flex-1 min-w-[140px] bg-[var(--bg-secondary)] text-[var(--text-main)] border-none font-bold text-sm p-3 rounded-xl outline-none cursor-pointer ${(!selectedProv || currentAmphoes.length === 0) ? 'opacity-50' : ''}`}>
                <option value="">
                  {geoError ? '⚠️ โหลดไฟล์ล้มเหลว' : geoData.length === 0 ? 'กำลังดึงข้อมูล...' : (!selectedProv ? '-- เลือกอำเภอ --' : (currentAmphoes.length === 0 ? '⚠️ ไม่พบข้อมูล' : '-- เลือกอำเภอ --'))}
                </option>
                {currentAmphoes.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
            </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 shrink-0">
          <div className="flex flex-col gap-4 flex-1 lg:w-7/12 min-w-0">
            <WeatherHero locationName={locationName} coords={coords} current={current} isMobile={isMobile} showFilter={showFilter} setShowFilter={setShowFilter} />
            <WeatherStats current={current} getWindDir={getWindDir} chartData={chartData} />
          </div>

          <div className="flex flex-col gap-4 flex-1 lg:w-5/12 min-w-0 shrink-0">
            <Forecast24h 
              chartData={chartData} scrollRef={scrollRef} 
              handleMouseDown={handleMouseDown} handleMouseLeave={handleMouseLeave} 
              handleMouseUp={handleMouseUp} handleMouseMove={handleMouseMove} isDragging={isDragging} 
            />
            <Forecast7Days daily={daily} isMobile={isMobile} />
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-5 rounded-2xl md:rounded-3xl border border-[var(--border-color)] flex items-start gap-4 mb-2 shrink-0">
            <span className="text-4xl text-sky-500">🤖</span>
            <div>
                <h4 className="m-0 mb-1 text-[var(--text-main)] font-black text-base md:text-lg">สรุปสภาพอากาศวันนี้</h4>
                <p className="m-0 text-[var(--text-sub)] text-sm md:text-base leading-relaxed tracking-wide">{briefingText}</p>
            </div>
        </div>

        <WeatherLifestyle current={current} exercise={exercise} laundry={laundry} watering={watering} spray={spray} driving={driving} camping={camping} aqiText={aqiText} />
        
        <TopStats top5Heat={top5Heat} top5Cool={top5Cool} top5PM25={top5PM25} top5Rain={top5Rain} isMobile={isMobile} />

        <div className="bg-[var(--bg-card)] rounded-2xl md:rounded-3xl p-5 border border-[var(--border-color)] overflow-hidden shrink-0">
            <h3 className="m-0 mb-4 text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                <span className="text-xl">⛈️</span> เรดาร์สภาพอากาศ (เรดาร์ฝน)
            </h3>
            <div className={`w-full ${isMobile ? 'h-64' : 'h-80'} rounded-xl overflow-hidden`}>
                <iframe 
                    width="100%" height="100%" 
                    src={`https://embed.windy.com/embed2.html?lat=${coords?.lat || 13.75}&lon=${coords?.lon || 100.5}&zoom=8&level=surface&overlay=rain&product=ecmwf&menu=&message=true&marker=true`} 
                    style={{ border: 'none' }} title="Radar Map"
                ></iframe>
            </div>
        </div>

        <div className="text-center mt-6 py-6 border-t border-[var(--border-color)] opacity-70 shrink-0">
           <div className="text-xs font-bold text-[var(--text-sub)]">ข้อมูลจาก Open-Meteo API • OpenStreetMap • GISTDA</div>
           <div className="text-[10px] text-[var(--text-sub)] mt-2">อัปเดตระบบล่าสุด: {lastUpdated ? new Date(lastUpdated).toLocaleString('th-TH') : '-'}</div>
        </div>

        <div className="h-16 shrink-0 w-full md:hidden"></div>

      </div>
    </div>
  );
}