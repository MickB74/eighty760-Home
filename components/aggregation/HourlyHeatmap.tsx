import React from 'react';
import InfoTooltip from '@/components/shared/InfoTooltip';

interface HourlyHeatmapProps {
    title: string;
    data: number[][]; // 12 rows (Months), 24 columns (Hours)
    min?: number;
    max?: number;
    unit?: string;
    colorScale?: (value: number, min: number, max: number) => string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function HourlyHeatmap({ title, data, min = 0, max = 1, unit = '', colorScale }: HourlyHeatmapProps) {
    // Flatten to find true max/min if not provided
    const allValues = data.flat();
    const effectiveMin = min ?? Math.min(...allValues);
    const effectiveMax = max ?? Math.max(...allValues);

    const getColor = (value: number) => {
        if (colorScale) return colorScale(value, effectiveMin, effectiveMax);

        // Default Blue scale
        const ratio = (value - effectiveMin) / (effectiveMax - effectiveMin || 1);
        // White to Brand Blue (#285477)
        // 255->40, 255->84, 255->119
        const r = Math.round(255 - (255 - 40) * ratio);
        const g = Math.round(255 - (255 - 84) * ratio);
        const b = Math.round(255 - (255 - 119) * ratio);
        return `rgb(${r}, ${g}, ${b})`;
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>

            <div className="flex">
                {/* Y-Axis Labels (Months) */}
                <div className="flex flex-col justify-between pr-2 py-4">
                    {MONTHS.map(m => (
                        <span key={m} className="text-xs text-gray-500 text-right h-6 leading-6">{m}</span>
                    ))}
                </div>

                <div className="flex-1 overflow-x-auto">
                    {/* Heatmap Grid */}
                    <div className="grid grid-rows-12 gap-[1px]">
                        {data.map((row, mIdx) => (
                            <div key={mIdx} className="grid grid-cols-24 gap-[1px]">
                                {row.map((val, hIdx) => (
                                    <div
                                        key={hIdx}
                                        className="h-6 w-full min-w-[12px] group relative hover:border hover:border-gray-500 z-0 hover:z-10"
                                        style={{ backgroundColor: getColor(val) }}
                                    >
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-900 text-white text-xs p-1 rounded z-20 whitespace-nowrap">
                                            {MONTHS[mIdx]} {hIdx}:00 - {val.toFixed(2)}{unit}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* X-Axis Labels (Hours) */}
                    <div className="grid grid-cols-24 gap-[1px] mt-1">
                        {HOURS.map(h => (
                            <div key={h} className="text-[10px] text-gray-400 text-center">
                                {h % 3 === 0 ? h : ''}
                            </div>
                        ))}
                    </div>
                    <div className="text-center text-xs text-gray-400 mt-1">Hour of Day</div>
                </div>

                {/* Legend (Simple Gradient) */}
                <div className="ml-4 flex flex-col items-center justify-between py-4 h-[300px]">
                    <div className="text-xs text-gray-500">{effectiveMax.toFixed(unit === '%' ? 0 : 1)}{unit}</div>
                    <div className="w-4 flex-1 my-1 rounded bg-gradient-to-b from-[#285477] to-white border border-gray-100"></div>
                    <div className="text-xs text-gray-500">{effectiveMin.toFixed(unit === '%' ? 0 : 1)}{unit}</div>
                </div>
            </div>
        </div>
    );
}
