import React from 'react';

export const MapSidebar = ({ isMobile, rankedSidebarData, mapCategory, activeModeObj, getRiskLabel, handleRegionClick }) => {
    return (
        <div className={`bg-[var(--bg-card)] rounded-2xl md:rounded-[20px] p-4 border border-[var(--border-color)] flex flex-col z-10 shrink-0 ${isMobile ? 'w-full' : 'w-[320px]'}`}>
             <h3 className="m-0 mb-1 text-base text-[var(--text-main)] font-bold">
                📍 {mapCategory === 'risk' ? 'พื้นที่เสี่ยงสูงสุด (Top 15)' : 'จัดอันดับค่าสูงสุด (Top 15)'}
             </h3>
             <p className="m-0 mb-3 text-xs font-bold" style={{ color: activeModeObj?.color }}>{activeModeObj?.desc}</p>
             
             <div className="flex-1 overflow-y-auto pr-1 hide-scrollbar">
                {rankedSidebarData.map((st, idx) => (
                   <div 
                       key={st.stationID} 
                       onClick={() => handleRegionClick(st)} 
                       className="flex items-center justify-between p-2.5 md:p-3 bg-[var(--bg-tertiary)] rounded-xl mb-2 cursor-pointer border border-[var(--border-color)] transition-transform hover:-translate-y-0.5 hover:shadow-md"
                       style={{ borderLeftWidth: '5px', borderLeftColor: st.color }}
                   >
                      <div>
                          <div className="text-sm md:text-sm font-bold text-[var(--text-main)]">{idx+1}. จ.{st.areaTH.replace('จังหวัด', '')}</div>
                          {mapCategory === 'risk' && <div className="text-[10px] text-[var(--text-sub)] mt-0.5">สถานะ: {getRiskLabel(st.displayVal)}</div>}
                      </div>
                      <div className="bg-[var(--bg-card)] px-2.5 py-1 rounded-lg text-center border border-[var(--border-color)]">
                          <div className="text-base font-black" style={{ color: st.color }}>
                              {st.displayVal} <span className="text-[10px] text-[var(--text-sub)] font-normal">{mapCategory==='basic' ? activeModeObj?.unit : ''}</span>
                          </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
    );
};

export const MapControls = ({ isMobile, showControls, setShowControls, handleAutoLocate, basemapStyle, setBasemapStyle, polyOpacity, setPolyOpacity, activeModeObj }) => {
    return (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2.5 items-end">
            {isMobile && (
                <button 
                    onClick={() => setShowControls(!showControls)} 
                    className="w-10 h-10 rounded-full bg-slate-800 text-white border border-[var(--border-color)] text-lg shadow-lg flex items-center justify-center"
                >
                    {showControls ? '✕' : '⚙️'}
                </button>
            )}

            {(showControls || !isMobile) && (
                <div className="flex flex-col gap-2.5 items-end animate-[fadeIn_0.2s_ease]">
                    <button 
                        onClick={handleAutoLocate} 
                        className="bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] px-3 py-2 rounded-xl font-bold text-sm cursor-pointer shadow-md"
                    >
                        📍 พิกัดของฉัน
                    </button>
                    
                    <div className="bg-[var(--bg-nav-blur)] backdrop-blur-md p-3 rounded-2xl border border-[var(--border-color)] w-36 shadow-lg">
                        <div className="text-xs font-bold text-[var(--text-main)] mb-2">รูปแบบแผนที่</div>
                        <select 
                            value={basemapStyle} 
                            onChange={(e) => setBasemapStyle(e.target.value)} 
                            className="w-full bg-[var(--bg-secondary)] text-[var(--text-main)] border-none p-1.5 rounded-lg text-xs outline-none"
                        >
                            <option value="dark">สีเข้ม (Dark)</option>
                            <option value="light">สีสว่าง (Light)</option>
                            <option value="osm">ถนน (Street)</option>
                            <option value="satellite">ดาวเทียม</option>
                        </select>
                        <div className="text-xs font-bold text-[var(--text-main)] mt-3 mb-2">ความทึบเลเยอร์</div>
                        <input 
                            type="range" min="0.1" max="1" step="0.1" 
                            value={polyOpacity} 
                            onChange={(e) => setPolyOpacity(parseFloat(e.target.value))} 
                            className="w-full" style={{ accentColor: activeModeObj?.color }} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export const MapLegend = ({ mapCategory, activeModeObj, getDynamicLegendContent }) => {
    return (
        <div className="absolute bottom-4 left-4 z-[1000] bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)] shadow-md flex flex-col gap-1.5 max-w-[calc(100%-30px)] md:max-w-none">
            <div className="text-[10px] font-bold text-[var(--text-sub)]">
                เกณฑ์ระดับ {activeModeObj?.name}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-2">
                {getDynamicLegendContent().map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-[var(--text-main)]">
                        <span className="inline-block w-2.5 h-2.5 rounded-full border border-[var(--border-color)]" style={{ background: item.c }}></span>
                        <span className="font-bold">{item.r}</span> <span className="opacity-80 text-[10px]">({item.l})</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
