'use client';

import React from 'react';

interface ResultsHeatmapProps {
    data: number[];  // 8760 hourly values
    title: string;
    min?: number;
    max?: number;
    unit?: string;
}

export default function ResultsHeatmap({ data, title, min, max, unit = '' }: ResultsHeatmapProps) {
    // Calculate min/max if not provided
    const dataMin = min !== undefined ? min : Math.min(...data);
    const dataMax = max !== undefined ? max : Math.max(...data);

    // Helper to get color based on value (red = bad/low, green = good/high)
    const getColor = (value: number) => {
        if (dataMax === dataMin) return 'rgb(34, 197, 94)'; // green-500

        const normalized = (value - dataMin) / (dataMax - dataMin);

        // Red (low) -> Yellow (mid) -> Green (high)
        if (normalized < 0.5) {
            // Red to Yellow
            // Red: (239, 68, 68) -> Yellow: (234, 179, 8)
            const r = Math.round(239 + (234 - 239) * (normalized * 2));
            const g = Math.round(68 + (179 - 68) * (normalized * 2));
            const b = Math.round(68 + (8 - 68) * (normalized * 2));
            return `rgb(${r}, ${g}, ${b})`;
        } else {
            // Yellow to Green
            // Yellow: (234, 179, 8) -> Green: (34, 197, 94)
            const r = Math.round(234 + (34 - 234) * ((normalized - 0.5) * 2));
            const g = Math.round(179 + (197 - 179) * ((normalized - 0.5) * 2));
            const b = Math.round(8 + (94 - 8) * ((normalized - 0.5) * 2));
            return `rgb(${r}, ${g}, ${b})`;
        }
    };

    // Aggregate to 52 weeks x 24 hours (simplified view)
    const weeks = 52;
    const hoursPerDay = 24;
    const weeklyData: number[][] = [];

    for (let week = 0; week < weeks; week++) {
        const weekData: number[] = [];
        for (let hour = 0; hour < hoursPerDay; hour++) {
            // Average all days in this week for this hour
            let sum = 0;
            let count = 0;
            for (let day = 0; day < 7; day++) {
                const hourIndex = (week * 7 + day) * 24 + hour;
                if (hourIndex < data.length) {
                    sum += data[hourIndex];
                    count++;
                }
            }
            weekData.push(count > 0 ? sum / count : 0);
        }
        weeklyData.push(weekData);
    }

    return (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <p className="text-sm text-slate-400">52-Week × 24-Hour Visualization</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-red-500"></div>
                        <span className="text-slate-400">Low</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                        <span className="text-slate-400">High</span>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                    {/* Hour labels */}
                    <div className="flex mb-1">
                        <div className="w-12"></div>
                        {[0, 6, 12, 18].map((hour) => (
                            <div key={hour} className="flex-1 text-center text-xs text-slate-400" style={{ marginLeft: hour === 0 ? '0' : `${(hour / 24) * 100}%` }}>
                                {hour}:00
                            </div>
                        ))}
                    </div>

                    {/* Heatmap grid */}
                    <div className="space-y-0.5">
                        {weeklyData.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex items-center gap-1">
                                <div className="w-12 text-xs text-slate-400 text-right pr-2">
                                    W{weekIndex + 1}
                                </div>
                                <div className="flex gap-0.5 flex-1">
                                    {week.map((value, hourIndex) => (
                                        <div
                                            key={hourIndex}
                                            className="group relative cursor-pointer transition-all hover:scale-110 hover:z-10"
                                            style={{
                                                width: `${100 / hoursPerDay}%`,
                                                height: '8px',
                                                backgroundColor: getColor(value),
                                                borderRadius: '1px'
                                            }}
                                            title={`Week ${weekIndex + 1}, Hour ${hourIndex}: ${value.toFixed(2)} ${unit}`}
                                        >
                                            {/* Tooltip on hover */}
                                            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-navy-950 border border-energy-green/20 rounded text-xs whitespace-nowrap z-20">
                                                <div className="text-energy-green font-bold">{value.toFixed(2)} {unit}</div>
                                                <div className="text-slate-400">W{weekIndex + 1}, {hourIndex}:00</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="mt-4 flex justify-between text-xs text-slate-400">
                        <span>Min: {dataMin.toFixed(2)} {unit}</span>
                        <span>Avg: {(data.reduce((a, b) => a + b, 0) / data.length).toFixed(2)} {unit}</span>
                        <span>Max: {dataMax.toFixed(2)} {unit}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
