import React from 'react';

export const RiskModal = ({ selectedHotspot, setSelectedHotspot, isMobile, activeModeObj, getRiskLabel }) => {
    return (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex justify-center items-center p-5" onClick={() => setSelectedHotspot(null)}>
            <div className="animate-[fadeIn_0.3s_ease] bg-[var(--bg-card)] p-6 rounded-3xl w-full max-w-[420px] border border-[var(--border-color)] shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedHotspot(null)} className="absolute top-4 right-4 bg-[var(--bg-secondary)] border-none w-8 h-8 rounded-full text-[var(--text-main)] cursor-pointer font-bold hover:bg-[var(--border-color)] transition-colors">✕</button>
                
                <div className="mb-4 pb-4 border-b border-[var(--border-color)]">
                    <div className="text-xs text-[var(--text-sub)] font-bold mb-1">ข้อมูลวิเคราะห์ความเสี่ยงรายพื้นที่</div>
                    <h2 className={`m-0 text-[var(--text-main)] font-bold ${isMobile ? 'text-lg' : 'text-xl'}`}>📍 จ.{selectedHotspot.station.areaTH.replace('จังหวัด','')}</h2>
                </div>

                <div className="flex gap-4 items-center mb-5">
                    <div className="w-20 h-20 rounded-full text-white flex flex-col justify-center items-center shrink-0 border-4 border-[var(--bg-card)] outline focus:outline-none" style={{ background: selectedHotspot.color, outlineColor: selectedHotspot.color, outlineWidth: '2px', outlineStyle: 'solid' }}>
                        <span className="text-3xl font-black leading-none">{selectedHotspot.riskScore}</span>
                        <span className="text-[10px] font-bold mt-1">คะแนน</span>
                    </div>
                    <div>
                        <div className="text-base font-bold" style={{ color: selectedHotspot.color }}>{activeModeObj?.name}</div>
                        <div className="text-sm text-[var(--text-main)] mt-1">สถานะ: <span className="font-bold">{getRiskLabel(selectedHotspot.riskScore)}</span></div>
                        <div className="text-[11px] text-[var(--text-sub)] mt-1.5 leading-relaxed">
                            {selectedHotspot.riskScore >= 6 ? 'หากคะแนนตั้งแต่ 6 ขึ้นไป แนะนำให้เตรียมรับมือและดูแลสุขภาพเป็นพิเศษ' : 'สภาพอากาศอยู่ในเกณฑ์ปกติ สามารถทำกิจกรรมได้ตามความเหมาะสม'}
                        </div>
                    </div>
                </div>

                <h4 className="m-0 mb-3 text-[var(--text-main)] text-[15px]">🔬 ปัจจัยหลักที่ส่งผลต่อความเสี่ยง:</h4>
                <div className="flex flex-col gap-3">
                    {selectedHotspot.factors.map((factor, i) => (
                        <div key={i}>
                            <div className="flex justify-between text-xs mb-1.5 text-[var(--text-main)]">
                                <span className="font-bold">{factor.label} <span className="text-[var(--text-sub)] font-normal">(สัดส่วน {factor.weight}%)</span></span>
                                <span>{factor.val} <span className="text-[var(--text-sub)]">{factor.unit}</span></span>
                            </div>
                            <div className="w-full h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(factor.risk / 10) * 100}%`, background: factor.color }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const BasicModal = ({ selectedHotspot, setSelectedHotspot, isMobile, getBasicColor, getWindDirection, getUvText }) => {
    return (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex justify-center items-center p-5" onClick={() => setSelectedHotspot(null)}>
          <div className="animate-[fadeIn_0.3s_ease] bg-[var(--bg-card)] p-6 rounded-3xl w-full max-w-[420px] border border-[var(--border-color)] shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedHotspot(null)} className="absolute top-4 right-4 bg-[var(--bg-secondary)] border-none w-8 h-8 rounded-full text-[var(--text-main)] cursor-pointer font-bold hover:bg-[var(--border-color)] transition-colors">✕</button>
              
              <div className="mb-5 pb-4 border-b border-[var(--border-color)]">
                  <div className="text-xs text-[var(--text-sub)] font-bold mb-1">ข้อมูลสภาพอากาศปัจจุบัน</div>
                  <h2 className={`m-0 text-[var(--text-main)] font-bold ${isMobile ? 'text-lg' : 'text-xl'}`}>📍 จ.{selectedHotspot.station.areaTH.replace('จังหวัด','')}</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--bg-secondary)] p-4 rounded-2xl flex flex-col gap-1 border-l-4" style={{ borderColor: getBasicColor(selectedHotspot.pm25, 'pm25') }}>
                      <span className="text-[11px] text-[var(--text-sub)] font-bold">😷 ฝุ่น PM2.5</span>
                      <span className="text-xl font-black" style={{ color: getBasicColor(selectedHotspot.pm25, 'pm25') }}>{selectedHotspot.pm25} <span className="text-[10px] text-[var(--text-sub)] font-normal">µg/m³</span></span>
                  </div>
                  <div className="bg-[var(--bg-secondary)] p-4 rounded-2xl flex flex-col gap-1 border-l-4" style={{ borderColor: getBasicColor(selectedHotspot.data.temp, 'temp') }}>
                      <span className="text-[11px] text-[var(--text-sub)] font-bold">🌡️ อุณหภูมิ</span>
                      <span className="text-xl font-black" style={{ color: getBasicColor(selectedHotspot.data.temp, 'temp') }}>{Math.round(selectedHotspot.data.temp || 0)}°C</span>
                  </div>
                  <div className="bg-[var(--bg-secondary)] p-4 rounded-2xl flex flex-col gap-1 border-l-4" style={{ borderColor: getBasicColor(selectedHotspot.data.feelsLike, 'heat') }}>
                      <span className="text-[11px] text-[var(--text-sub)] font-bold">🥵 ดัชนีความร้อน</span>
                      <span className="text-xl font-black" style={{ color: getBasicColor(selectedHotspot.data.feelsLike, 'heat') }}>{Math.round(selectedHotspot.data.feelsLike || 0)}°C</span>
                  </div>
                  <div className="bg-[var(--bg-secondary)] p-4 rounded-2xl flex flex-col gap-1 border-l-4" style={{ borderColor: getBasicColor(selectedHotspot.data.rainProb, 'rain') }}>
                      <span className="text-[11px] text-[var(--text-sub)] font-bold">☔ โอกาสฝนตก</span>
                      <span className="text-xl font-black" style={{ color: getBasicColor(selectedHotspot.data.rainProb, 'rain') }}>{selectedHotspot.data.rainProb || 0} <span className="text-[10px] text-[var(--text-sub)] font-normal">%</span></span>
                  </div>
                  <div className="col-span-2 bg-[var(--bg-secondary)] p-4 rounded-2xl flex flex-col gap-1 border-l-4" style={{ borderColor: getBasicColor(selectedHotspot.data.windSpeed, 'wind') }}>
                      <span className="text-[11px] text-[var(--text-sub)] font-bold">🌬️ ลมกระโชกสูงสุด และทิศทางลม</span>
                      <div className="flex justify-between items-center">
                          <span className="text-xl font-black" style={{ color: getBasicColor(selectedHotspot.data.windSpeed, 'wind') }}>{Math.round(selectedHotspot.data.windSpeed || 0)} <span className="text-[10px] text-[var(--text-sub)] font-normal">km/h</span></span>
                          <div className="flex items-center gap-2 bg-[var(--bg-card)] px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
                              <span className="text-lg">{getWindDirection(selectedHotspot.data.windDir).arrow}</span>
                              <span className="text-[11px] text-[var(--text-main)] font-bold">ลม{getWindDirection(selectedHotspot.data.windDir).name}</span>
                          </div>
                      </div>
                  </div>
                  <div className="col-span-2 bg-[var(--bg-secondary)] p-4 rounded-2xl flex flex-col gap-1 border-l-4" style={{ borderColor: getBasicColor(selectedHotspot.data.uv, 'uv') }}>
                      <span className="text-[11px] text-[var(--text-sub)] font-bold">☀️ รังสี UV</span>
                      <span className="text-xl font-black" style={{ color: getBasicColor(selectedHotspot.data.uv, 'uv') }}>{Math.round(selectedHotspot.data.uv || 0)} <span className="text-[11px] text-[var(--text-main)] font-normal">- {getUvText(selectedHotspot.data.uv)}</span></span>
                  </div>
              </div>
          </div>
        </div>
    );
};

export const ReferenceModal = ({ showReferenceModal, setShowReferenceModal }) => {
    if (!showReferenceModal) return null;
    return (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex justify-center items-center p-5" onClick={() => setShowReferenceModal(false)}>
            <div className="animate-[fadeIn_0.3s_ease] bg-[var(--bg-card)] p-6 rounded-3xl w-full max-w-[550px] max-h-[85vh] overflow-y-auto hide-scrollbar border border-[var(--border-color)] shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowReferenceModal(false)} className="absolute top-4 right-4 bg-[var(--bg-secondary)] border-none w-8 h-8 rounded-full text-[var(--text-main)] cursor-pointer font-bold hover:bg-[var(--border-color)] transition-colors">✕</button>
                
                <h2 className="m-0 mb-1 text-[var(--text-main)] text-xl flex items-center gap-2 font-bold">📚 หลักการและทฤษฎีอ้างอิง</h2>
                <p className="text-[var(--text-sub)] text-sm mb-5 leading-relaxed">การประเมินดัชนีความเสี่ยงในระบบ อ้างอิงจากแบบจำลองและมาตรฐานทางวิทยาศาสตร์ระดับสากล เพื่อความแม่นยำในการเตือนภัย</p>

                <div className="flex flex-col gap-4">
                    <div className="bg-[var(--bg-secondary)] p-4 rounded-2xl border-l-4 border-pink-500">
                        <div className="text-sm font-bold text-[var(--text-main)] mb-1">🫁 สุขภาพและทางเดินหายใจ</div>
                        <div className="text-xs text-[var(--text-sub)] mb-1"><strong>อ้างอิง:</strong> งานวิจัยอาชีวเวชศาสตร์ และ EPA Air Quality Index</div>
                        <div className="text-xs text-[var(--text-main)] leading-relaxed">การสัมผัสความร้อนสูงจะทำให้เยื่อบุทางเดินหายใจระคายเคือง กลไกการกรองฝุ่นตามธรรมชาติลดลง ดัชนีนี้จึงนำความเข้มข้นของ PM2.5 (70%) มาคูณร่วมกับ อุณหภูมิความร้อน (30%) เพื่อสะท้อนผลกระทบต่อปอดที่แท้จริง</div>
                    </div>
                    <div className="bg-[var(--bg-secondary)] p-4 rounded-2xl border-l-4 border-blue-500">
                        <div className="text-sm font-bold text-[var(--text-main)] mb-1">🏕️ กิจกรรมกลางแจ้ง</div>
                        <div className="text-xs text-[var(--text-sub)] mb-1"><strong>อ้างอิง:</strong> มาตรฐานความปลอดภัย OSHA (Occupational Safety)</div>
                        <div className="text-xs text-[var(--text-main)] leading-relaxed">การดำเนินกิจกรรมหรืองานกลางแจ้ง ไม่ได้ขึ้นอยู่กับฝนเพียงอย่างเดียว ดัชนีนี้ประเมินความปลอดภัยครอบคลุมทั้งอุปสรรคทางกายภาพ (ฝน 40%, ลม 30%) และภัยคุกคามทางสุขภาพ (ความร้อน 20%, UV 10%)</div>
                    </div>
                    <div className="bg-[var(--bg-secondary)] p-4 rounded-2xl border-l-4 border-orange-500">
                        <div className="text-sm font-bold text-[var(--text-main)] mb-1">🔥 ความเสี่ยงไฟป่า</div>
                        <div className="text-xs text-[var(--text-sub)] mb-1"><strong>อ้างอิง:</strong> แบบจำลอง Canadian Forest Fire Weather Index (FWI)</div>
                        <div className="text-xs text-[var(--text-main)] leading-relaxed">ประเมินสภาวะที่เอื้อต่อการลุกลามของไฟ โดยคำนวณจากความเร็วลมที่เป็นตัวพัดพา (45%) ผสานกับสภาพอากาศที่ทำให้เชื้อเพลิงแห้งติดไฟง่าย คือ ความชื้นสัมพัทธ์ต่ำ (35%) และอุณหภูมิสูง (20%)</div>
                    </div>
                    <div className="bg-[var(--bg-secondary)] p-4 rounded-2xl border-l-4 border-red-500">
                        <div className="text-sm font-bold text-[var(--text-main)] mb-1">🥵 เฝ้าระวังโรคลมแดด</div>
                        <div className="text-xs text-[var(--text-sub)] mb-1"><strong>อ้างอิง:</strong> องค์การอนามัยโลก (WHO) และดัชนี WBGT</div>
                        <div className="text-xs text-[var(--text-main)] leading-relaxed">การประเมินโรคลมแดดที่แม่นยำ ต้องคำนวณ <b>"ภาระความร้อนรวม"</b> ที่ร่างกายได้รับ ดัชนีนี้จึงผสานอุณหภูมิอากาศ (60%) เข้ากับรังสีความร้อนจากดวงอาทิตย์หรือ UV (40%) เพื่อประเมินความเสี่ยงต่อภาวะหน้ามืดเฉียบพลัน</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
