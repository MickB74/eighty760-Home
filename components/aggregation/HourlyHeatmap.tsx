import React from 'react';

interface HourlyHeatmapProps {
    title: string;
    data: number[][]; // 12 rows (Months), 24 columns (Hours)
    min: number;
    max: number;
    unit: string;
    colorScale: 'grayscale' | 'orange';
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function HourlyHeatmap({ title, data, min, max, unit, colorScale }: HourlyHeatmapProps) {
    const getColor = (value: number): string => {
        const ratio = (value - min) / (max - min || 1);

        if (colorScale === 'grayscale') {
            // White (0) to Black (1)
            const lightness = 100 - (ratio * 100);
            return `hsl(0, 0%, ${lightness}%)`;
        } else {
            // Light orange to dark red/orange
            const hue = 25; // Orange hue
            const saturation = 100;
            const lightness = 85 - (ratio * 60); // 85% (light) to 25% (dark)
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">{title}</h3>

            <div className="flex gap-4">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between text-right pr-2 pt-2" style={{ minWidth: '80px' }}>
                    {MONTHS.map((month, i) => (
                        <div key={month} className="text-xs text-gray-600 dark:text-gray-400" style={{ height: '24px', lineHeight: '24px' }}>
                            {i % 2 === 0 ? month : ''}
                        </div>
                    ))}
                </div>

                {/* Heatmap grid */}
                <div className="flex-1 flex flex-col">
                    <div className="grid grid-rows-12 gap-0" style={{ height: '288px' }}>
                        {data.map((row, monthIdx) => (
                            <div key={monthIdx} className="grid grid-cols-24 gap-0 h-6">
                                {row.map((value, hourIdx) => (
                                    <div
                                        key={hourIdx}
                                        className="w-full h-full"
                                        style={{ backgroundColor: getColor(value) }}
                                        title={`${MONTHS[monthIdx]} ${hourIdx}:00 - ${value.toFixed(2)}${unit}`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* X-axis labels */}
                    <div className="grid grid-cols-24 gap-0 mt-1">
                        {Array.from({ length: 24 }, (_, i) => (
                            <div key={i} className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                                {i % 4 === 0 ? i : ''}
                            </div>
                        ))}
                    </div>
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">Hour of Day</div>
                </div>

                {/* Legend */}
                <div className="flex flex-col justify-between items-center ml-2" style={{ width: '60px', height: '288px' }}>
                    <span className="text-xs text-gray-700 dark:text-gray-300">{max.toFixed(1)}</span>
                    <div
                        className="w-6 flex-1 my-1 rounded"
                        style={{
                            background: colorScale === 'grayscale'
                                ? 'linear-gradient(to bottom, hsl(0, 0%, 0%), hsl(0, 0%, 100%))'
                                : 'linear-gradient(to bottom, hsl(25, 100%, 25%), hsl(25, 100%, 85%))'
                        }}
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{min.toFixed(1)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{unit}</span>
                </div>
            </div>
        </div>
    );
}
