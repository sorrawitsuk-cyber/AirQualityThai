import { useCallback } from 'react';

export const useRiskAnalysis = (stationTemps, darkMode, activeRiskMode) => {

    const getBasicVal = useCallback((station, mode) => {
        if (!station || !stationTemps[station.stationID]) return null;
        const data = stationTemps[station.stationID];
        switch(mode) {
            case 'pm25': return station.AQILast?.PM25?.value || 0;
            case 'temp': return Math.round(data.temp || 0);
            case 'heat': return Math.round(data.feelsLike || 0);
            case 'rain': return data.rainProb || 0;
            case 'wind': return Math.round(data.windSpeed || 0);
            case 'uv': return data.uv || 0;
            default: return 0;
        }
    }, [stationTemps]);

    const getBasicColor = useCallback((val, mode) => {
        if (val === null || val === undefined || val === '') return darkMode ? '#334155' : '#cbd5e1';
        if (mode === 'pm25') return val >= 75 ? '#ef4444' : val >= 37.5 ? '#f97316' : val >= 25 ? '#eab308' : val >= 15 ? '#22c55e' : '#0ea5e9';
        if (mode === 'temp' || mode === 'heat') return val >= 39 ? '#ef4444' : val >= 35 ? '#f97316' : val >= 29 ? '#eab308' : val >= 23 ? '#22c55e' : '#3b82f6';
        if (mode === 'rain') return val >= 70 ? '#1e3a8a' : val >= 40 ? '#3b82f6' : val >= 10 ? '#60a5fa' : '#94a3b8';
        if (mode === 'wind') return val >= 40 ? '#ef4444' : val >= 20 ? '#f97316' : val >= 10 ? '#eab308' : '#22c55e';
        if (mode === 'uv') return val >= 8 ? '#a855f7' : val >= 6 ? '#ef4444' : val >= 3 ? '#ea580c' : val >= 1 ? '#eab308' : '#22c55e';
        return darkMode ? '#334155' : '#cbd5e1';
    }, [darkMode]);

    const calculateRisk = useCallback((station) => {
        const data = stationTemps[station.stationID] || {};
        const pm25 = station.AQILast?.PM25?.value || 0;
        const temp = data.temp || 0;
        const wind = data.windSpeed || 0;
        const rain = data.rainProb || 0;
        const uv = data.uv || 0;
        const hum = data.humidity || 50;

        const nPm = Math.min(pm25 / 75 * 10, 10); 
        const nTemp = Math.max(0, Math.min((temp - 28) / 12 * 10, 10)); 
        const nWind = Math.min(wind / 35 * 10, 10); 
        const nRain = Math.min(rain / 80 * 10, 10); 
        const nUv = Math.min(uv / 11 * 10, 10); 
        const nHumDry = Math.max(0, 10 - (hum / 100 * 10)); 

        let score = 0;
        let factors = [];

        if (activeRiskMode === 'respiratory') {
            score = (nPm * 0.7) + (nTemp * 0.3);
            factors = [{ label: 'มลพิษฝุ่น PM2.5', val: pm25, unit: 'µg', risk: nPm, weight: 70, color: '#f97316' }, { label: 'อุณหภูมิความร้อน', val: temp, unit: '°C', risk: nTemp, weight: 30, color: '#ef4444' }];
        } else if (activeRiskMode === 'outdoor') {
            score = (nRain * 0.4) + (nWind * 0.3) + (nTemp * 0.2) + (nUv * 0.1);
            factors = [{ label: 'โอกาสเกิดฝนตก', val: rain, unit: '%', risk: nRain, weight: 40, color: '#3b82f6' }, { label: 'ความเร็วลมกระโชก', val: wind, unit: 'km/h', risk: nWind, weight: 30, color: '#0ea5e9' }, { label: 'อุณหภูมิความร้อน', val: temp, unit: '°C', risk: nTemp, weight: 20, color: '#ef4444' }, { label: 'ความเข้มรังสี UV', val: uv, unit: 'Idx', risk: nUv, weight: 10, color: '#a855f7' }];
        } else if (activeRiskMode === 'wildfire') {
            score = (nWind * 0.45) + (nHumDry * 0.35) + (nTemp * 0.20);
            factors = [{ label: 'ความเร็วลมกระโชก', val: wind, unit: 'km/h', risk: nWind, weight: 45, color: '#0ea5e9' }, { label: 'ความแห้งแล้งของอากาศ', val: hum, unit: '%', risk: nHumDry, weight: 35, color: '#eab308' }, { label: 'อุณหภูมิความร้อน', val: temp, unit: '°C', risk: nTemp, weight: 20, color: '#ef4444' }];
        } else if (activeRiskMode === 'heatstroke') {
            score = (nTemp * 0.6) + (nUv * 0.4);
            factors = [{ label: 'อุณหภูมิความร้อน', val: temp, unit: '°C', risk: nTemp, weight: 60, color: '#ef4444' }, { label: 'ความเข้มรังสี UV', val: uv, unit: 'Idx', risk: nUv, weight: 40, color: '#a855f7' }];
        }

        return { score: Math.min(Math.round(score * 10) / 10, 10), factors };
    }, [activeRiskMode, stationTemps]);

    const getRiskColor = useCallback((score) => {
        if (score === null || score === undefined) return darkMode ? '#334155' : '#cbd5e1';
        if (score >= 8) return '#ef4444'; 
        if (score >= 6) return '#f97316'; 
        if (score >= 4) return '#eab308'; 
        if (score >= 0) return '#22c55e'; 
        return darkMode ? '#334155' : '#cbd5e1'; 
    }, [darkMode]);

    const getRiskLabel = (score) => {
        if (score >= 8) return 'ความเสี่ยงสูงมาก';
        if (score >= 6) return 'ควรเฝ้าระวัง';
        if (score >= 4) return 'ปานกลาง';
        return 'สถานการณ์ปกติ';
    };

    return { getBasicVal, getBasicColor, calculateRisk, getRiskColor, getRiskLabel };
};
