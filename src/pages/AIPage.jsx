import React from 'react';
import { Bot, MapPin } from 'lucide-react';
import { useAIPageData, thaiTime } from '../components/ai/useAIPageData';
import { getWeatherIcon } from '../utils/helpers';
import { getWindDir } from '../utils/weatherHelpers';
import { getPm25Status, getUvStatus, startIndexFromNow, periodSummary } from '../components/ai/dataUtils';
import StickyNav from '../components/ai/StickyNav';
import OverviewSection from '../components/ai/OverviewSection';
import RainSection from '../components/ai/RainSection';
import AirQualitySection from '../components/ai/AirQualitySection';
import ActivitiesSection from '../components/ai/ActivitiesSection';
import WeeklySection from '../components/ai/WeeklySection';

export default function AIPage() {
  const {
    isMobile, weatherData, loadingWeather, windAnalysis, windLoading, windError, windLastFetch, fetchWindAnalysis,
    gistdaSummary, lastUpdated, tmdAvailable, stationRows, rankings, national
  } = useAIPageData();

  if (loadingWeather || !weatherData) {
    return (
      <div className="loading-container" style={{ color: 'var(--text-main)' }}>
        <div className="loading-spinner" />
        <div>กำลังให้ AI ประมวลผล...</div>
        <div>รวบรวมอากาศ ฝน ฝุ่น และคำแนะนำให้พร้อมใช้งาน</div>
      </div>
    );
  }

  const { current, hourly, daily } = weatherData;
  const startIdx = startIndexFromNow(hourly?.time);
  const weatherInfo = getWeatherIcon(current?.weatherCode);
  const maxTemp = Math.round(daily?.temperature_2m_max?.[0] || current?.temp || 0);
  const minTemp = Math.round(daily?.temperature_2m_min?.[0] || current?.temp || 0);
  const rainProb = Math.round(daily?.precipitation_probability_max?.[0] || current?.rainProb || 0);
  const pm25 = Math.round(current?.pm25 || 0);
  const pm25Status = getPm25Status(pm25);
  const uvStatus = getUvStatus(current?.uv);
  const windDirection = getWindDir(current?.windDirection);
  const updateText = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  const trendData = (hourly?.time?.slice(startIdx, startIdx + 24).filter((_, i) => i % 3 === 0) || []).map((time, i) => {
    const di = startIdx + i * 3;
    return {
      time: new Date(time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      temp: Math.round(hourly?.temperature_2m?.[di] || 0),
      rain: Math.round(hourly?.precipitation_probability?.[di] || 0),
      pm25: Math.round(hourly?.pm25?.[di] || 0),
      wind: Math.round(hourly?.wind_speed_10m?.[di] || 0),
      humidity: Math.round(hourly?.relative_humidity_2m?.[di] || 0),
    };
  });

  const hourlyRows = (hourly?.time || [])
    .slice(startIdx, startIdx + 24)
    .filter((_, index) => index % 2 === 0)
    .map((time, index) => {
      const rowIndex = startIdx + index * 2;
      return {
        time: thaiTime(time),
        temp: Math.round(hourly?.temperature_2m?.[rowIndex] || current?.temp || 0),
        feels: Math.round(hourly?.apparent_temperature?.[rowIndex] || current?.feelsLike || 0),
        rain: Math.round(hourly?.precipitation_probability?.[rowIndex] || rainProb || 0),
        pm25: Math.round(hourly?.pm25?.[rowIndex] || pm25 || 0),
        wind: Math.round(hourly?.wind_speed_10m?.[rowIndex] || current?.windSpeed || 0),
        humidity: Math.round(hourly?.relative_humidity_2m?.[rowIndex] || current?.humidity || 0),
      };
    });

  const sixHourForecast = (hourly?.time?.slice(startIdx, startIdx + 6) || []).map((time, i) => {
    const rain = Math.round(hourly?.precipitation_probability?.[startIdx + i] || 0);
    return {
      time: new Date(time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      rain,
      icon: rain > 55 ? '⛈️' : rain > 25 ? '🌧️' : rain > 5 ? '🌦️' : '🌤️',
    };
  });

  const aiPeriods = [
    periodSummary(hourly, startIdx, 'ช่วงเช้า (06:00 - 11:00)', [6,7,8,9,10,11]),
    periodSummary(hourly, startIdx, 'ช่วงบ่าย (12:00 - 16:00)', [12,13,14,15,16]),
    periodSummary(hourly, startIdx, 'ช่วงเย็น (17:00 - 22:00)', [17,18,19,20,21,22]),
  ];

  return (
    <main className="hide-scrollbar fade-in" style={{
      minHeight: '100%',
      background: 'radial-gradient(circle at 55% 0%, rgba(56,189,248,0.13), transparent 34%), var(--bg-app)',
      color: 'var(--text-main)',
      fontFamily: 'Sarabun, sans-serif',
    }}>
      {/* Sticky Navigation + Content */}
      <div style={{ maxWidth: isMobile ? 960 : 1320, margin: '0 auto', padding: isMobile ? '14px' : '22px' }}>
        <StickyNav />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <OverviewSection
            current={current} hourly={hourly} daily={daily}
            startIdx={startIdx} isMobile={isMobile} weatherInfo={weatherInfo}
            maxTemp={maxTemp} minTemp={minTemp} rainProb={rainProb}
            pm25={pm25} pm25Status={pm25Status} uvStatus={uvStatus}
            windDirection={windDirection} updateText={updateText} trendData={trendData}
            gistdaSummary={gistdaSummary}
          />
          <RainSection
            sixHourForecast={sixHourForecast} aiPeriods={aiPeriods}
            rainProb={rainProb} isMobile={isMobile}
            windAnalysis={windAnalysis} windLoading={windLoading} windError={windError}
            windLastFetch={windLastFetch} fetchWindAnalysis={fetchWindAnalysis}
            hourlyRows={hourlyRows}
          />
          <AirQualitySection
            current={current} pm25={pm25} pm25Status={pm25Status}
            uvStatus={uvStatus} windDirection={windDirection} isMobile={isMobile}
            rankings={rankings} national={national}
          />
          <ActivitiesSection
            current={current} rainProb={rainProb} pm25={pm25} isMobile={isMobile}
          />
          <WeeklySection
            daily={daily} current={current}
            maxTemp={maxTemp} minTemp={minTemp} isMobile={isMobile}
          />
        </div>

        <div style={{ marginTop: 20, color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.75rem', justifyContent: 'center' }}>
          <MapPin size={14} color="#2563eb" /> วิเคราะห์จากตำแหน่งปัจจุบันหรือกรุงเทพมหานครเมื่อไม่สามารถเข้าถึง GPS
        </div>
      </div>
    </main>
  );
}
