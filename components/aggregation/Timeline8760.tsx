'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TimelineHourData {
    hour: number;
    timestamp: string;
    solar: number;
    wind: number;
    nuclear: number;
    battery: number;
    load: number;
    matched: number;
    deficit: number;
    overgeneration: number;
    carbonIntensity: number;
}

interface TimelineProps {
    loadProfile: number[];
    matchedProfile: number[];
    solarGen?: number[];
    windGen?: number[];
    nuclearGen?: number[];
    batteryDischarge?: number[];
    onHourChange?: (hour: number) => void; // NEW: Callback to notify parent of hour changes
}

export default function Timeline8760({ loadProfile, matchedProfile, solarGen, windGen, nuclearGen, batteryDischarge, onHourChange }: TimelineProps) {
    const [hoveredHour, setHoveredHour] = useState<number | null>(null);
    const [selectedHour, setSelectedHour] = useState<number>(0); // Changed default to 0 (Jan 1, 1st hour)
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Prepare hourly data
    const hourlyData: TimelineHourData[] = loadProfile.map((load, i) => {
        const matched = matchedProfile[i] || 0;
        const deficit = Math.max(0, load - matched);

        // Calculate total clean generation for this hour
        const s = solarGen?.[i] || 0;
        const w = windGen?.[i] || 0;
        const n = nuclearGen?.[i] || 0;
        const b = batteryDischarge?.[i] || 0;
        const totalGen = s + w + n + b;

        const overgeneration = Math.max(0, totalGen - load);

        return {
            hour: i,
            timestamp: formatHourToDate(i),
            solar: s,
            wind: w,
            nuclear: n,
            battery: b,
            load,
            matched,
            deficit,
            overgeneration,
            carbonIntensity: deficit > 0 ? 500 : 200 // Simplified
        };
    });

    // Draw timeline on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const barWidth = width / 8760;

        // Split height: Top 70% for Load/Deficit, Bottom 30% for Overgeneration
        const zeroLineY = height * 0.7;
        const topHeight = zeroLineY;
        const bottomHeight = height - zeroLineY;

        ctx.clearRect(0, 0, width, height);

        // Draw zero line
        ctx.beginPath();
        ctx.moveTo(0, zeroLineY);
        ctx.lineTo(width, zeroLineY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        // Draw each hour as a vertical bar
        hourlyData.forEach((data, i) => {
            const x = i * barWidth;

            // --- DRAW TOP BAR (Load / Deficit) ---
            if (data.load > 0) {
                const matchRate = data.matched / data.load;

                // Color based on match rate (green = good, red = bad)
                const hue = matchRate * 120; // 0 = red, 120 = green
                ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;

                // Height logic:
                // We want matched + deficit to fill the space if load is high? 
                // Currently logic seems to be: height based on deficitRatio? 
                // Let's stick to the previous visual logic: 
                // It seemed to show Deficit as a bar.
                // Re-reading previous code: `barHeight = Math.max(2, deficitRatio * height)`
                // If match is 100%, deficitRatio is 0, barHeight is 2px (tiny green bar).
                // If deficit is 100%, deficitRatio is 1, barHeight is full height (red bar).
                // So the chart primarily visualizes GRID DEFICIT.

                const deficitRatio = data.deficit / data.load;
                const barHeight = Math.max(2, deficitRatio * topHeight);

                // Draw upwards from zeroLineY
                ctx.fillRect(x, zeroLineY - barHeight, Math.max(1, barWidth), barHeight);
            }

            // --- DRAW BOTTOM BAR (Overgeneration) ---
            if (data.overgeneration > 0) {
                // Normalize overgeneration height relative to load? 
                // Or just clamp it?
                // Let's assume max overgen is roughly 2x load for scaling, or just use ratio.
                const overgenRatio = Math.min(1, data.overgeneration / (data.load || 1));
                const overgenHeight = Math.max(2, overgenRatio * bottomHeight);

                // Cyan color for clean excess
                ctx.fillStyle = '#06b6d4'; // cyan-500
                ctx.fillRect(x, zeroLineY, Math.max(1, barWidth), overgenHeight);
            }
        });

        // Draw hover indicator
        if (hoveredHour !== null) {
            const x = hoveredHour * barWidth;
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 1, 0, barWidth + 2, height);
        }

        // Draw selected hour indicator
        const x = selectedHour * barWidth;
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(x - 1.5, 0, barWidth + 3, height);
        ctx.setLineDash([]);

    }, [hourlyData, hoveredHour, selectedHour]);

    // Store callback in ref to prevent infinite loops
    const onHourChangeRef = useRef(onHourChange);
    useEffect(() => {
        onHourChangeRef.current = onHourChange;
    }, [onHourChange]);

    // Notify parent when the displayed hour changes
    useEffect(() => {
        const currentHour = hoveredHour !== null ? hoveredHour : selectedHour;
        onHourChangeRef.current?.(currentHour);
    }, [hoveredHour, selectedHour]);

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const hour = Math.floor((x / rect.width) * 8760);
        setHoveredHour(Math.max(0, Math.min(8759, hour)));
    };

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const hour = Math.floor((x / rect.width) * 8760);
        setSelectedHour(Math.max(0, Math.min(8759, hour)));
    };

    const currentData = hoveredHour !== null ? hourlyData[hoveredHour] : hourlyData[selectedHour];

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-1">8760-Hour Timeline Explorer</h3>
                <p className="text-sm text-slate-400">Hover to explore any hour of the year. Click to lock position.</p>
            </div>

            {/* Stats Panel */}
            <div className="bg-navy-950/50 border border-energy-green/20 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                    <div>
                        <div className="text-xs text-slate-500">Hour</div>
                        <div className="text-lg font-bold text-energy-green">{currentData.hour.toLocaleString()}</div>
                        <div className="text-xs text-slate-400">{currentData.timestamp}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500">Load</div>
                        <div className="text-lg font-bold text-white">{currentData.load.toFixed(1)} MWh</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500">Matched</div>
                        <div className="text-lg font-bold text-green-500">{currentData.matched.toFixed(1)} MWh</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500">Grid Deficit</div>
                        <div className={`text-lg font-bold ${currentData.deficit > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {currentData.deficit.toFixed(1)} MWh
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500">Overgeneration</div>
                        <div className={`text-lg font-bold ${currentData.overgeneration > 0 ? 'text-cyan-500' : 'text-slate-500'}`}>
                            {currentData.overgeneration?.toFixed(1) || '0.0'} MWh
                        </div>
                    </div>
                </div>

                {/* Generation Breakdown */}
                <div className="flex gap-3 text-xs">
                    {currentData.solar > 0 && (
                        <div className="flex items-center gap-1">
                            <span>☀️</span>
                            <span className="text-slate-400">{currentData.solar.toFixed(0)} MWh</span>
                        </div>
                    )}
                    {currentData.wind > 0 && (
                        <div className="flex items-center gap-1">
                            <span>💨</span>
                            <span className="text-slate-400">{currentData.wind.toFixed(0)} MWh</span>
                        </div>
                    )}
                    {currentData.nuclear > 0 && (
                        <div className="flex items-center gap-1">
                            <span>⚛️</span>
                            <span className="text-slate-400">{currentData.nuclear.toFixed(0)} MWh</span>
                        </div>
                    )}
                    {currentData.battery > 0 && (
                        <div className="flex items-center gap-1">
                            <span>🔋</span>
                            <span className="text-slate-400">{currentData.battery.toFixed(0)} MWh</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Canvas Timeline */}
            <div ref={containerRef} className="relative">
                <canvas
                    ref={canvasRef}
                    width={1200}
                    height={140}
                    className="w-full h-32 cursor-crosshair rounded-lg border border-white/10"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHoveredHour(null)}
                    onClick={handleClick}
                />

                {/* Month Labels */}
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>Jan</span>
                    <span>Mar</span>
                    <span>May</span>
                    <span>Jul</span>
                    <span>Sep</span>
                    <span>Nov</span>
                    <span>Dec</span>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs text-slate-400 mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>High CFE</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span>Medium CFE</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Grid Dependent</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-cyan-500 rounded"></div>
                    <span>Overgeneration</span>
                </div>
            </div>
        </div>
    );
}

function formatHourToDate(hour: number): string {
    const date = new Date(2024, 0, 1);
    date.setHours(date.getHours() + hour);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' });
}
