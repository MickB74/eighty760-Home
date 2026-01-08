import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CarbonHeatmapProps {
    className?: string;
}

const HOURS = 24;
const DAYS = 7;

export default function CarbonHeatmap({ className = '' }: CarbonHeatmapProps) {
    const [currentHour, setCurrentHour] = useState(0);

    // Simulate carbon intensity data (0-1 scale, green to red)
    // Pattern: Lower at night, higher during evening peak
    const getCarbonIntensity = (hour: number, day: number): number => {
        // Base pattern: higher in evening (17-21), lower at night (0-6)
        const hourFactor =
            hour >= 17 && hour <= 21 ? 0.8 + Math.random() * 0.2 : // Evening peak
                hour >= 6 && hour <= 9 ? 0.5 + Math.random() * 0.3 :   // Morning
                    hour >= 10 && hour <= 16 ? 0.3 + Math.random() * 0.4 : // Afternoon (solar)
                        0.2 + Math.random() * 0.2;                              // Night

        // Add some weekday/weekend variation
        const dayFactor = day >= 5 ? 0.85 : 1.0; // Weekends slightly lower

        return Math.min(1, hourFactor * dayFactor);
    };

    // Generate grid data
    const gridData = Array.from({ length: DAYS }, (_, day) =>
        Array.from({ length: HOURS }, (_, hour) => getCarbonIntensity(hour, day))
    );

    // Animate through hours
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentHour((prev) => (prev + 1) % HOURS);
        }, 2000); // Change hour every 2 seconds

        return () => clearInterval(interval);
    }, []);

    const getColor = (intensity: number): string => {
        // Green (low carbon) to Red (high carbon)
        if (intensity < 0.33) {
            return `hsl(120, ${60 + intensity * 40}%, ${40 + intensity * 20}%)`; // Green
        } else if (intensity < 0.66) {
            return `hsl(${120 - (intensity - 0.33) * 180}, 70%, 50%)`; // Yellow
        } else {
            return `hsl(${0 + (1 - intensity) * 10}, ${70 + intensity * 30}%, ${30 + intensity * 20}%)`; // Red/Orange
        }
    };

    return (
        <div className={`relative ${className}`}>
            {/* Glassmorphic container */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-xs font-mono text-gray-400 dark:text-slate-400">LIVE RTM DATA</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Hourly Carbon Intensity</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">ERCOT Market • 24-Hour Profile</p>
                    </div>
                    <div className="text-right hidden sm:block">
                        <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">0.92<span className="text-sm text-gray-400 dark:text-slate-500 ml-1">lbs/MWh</span></div>
                        <div className="text-xs brand-text font-medium">AVG INTENSITY</div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-navy-950/50 border rounded-xl border-slate-200 dark:border-white/10 overflow-hidden shadow-inner">
                    {/* Grid */}
                    <div className="space-y-1">
                        {gridData.map((row, dayIdx) => (
                            <div key={dayIdx} className="flex gap-1">
                                {/* Day label */}
                                <div className="w-12 flex items-center justify-end pr-2">
                                    <span className="text-xs text-gray-500 dark:text-slate-500 font-mono">
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIdx]}
                                    </span>
                                </div>

                                {/* Hour cells */}
                                {row.map((intensity, hourIdx) => (
                                    <motion.div
                                        key={hourIdx}
                                        className="flex-1 h-6 rounded-sm relative group cursor-pointer"
                                        style={{ backgroundColor: getColor(intensity) }}
                                        animate={{
                                            scale: currentHour === hourIdx ? 1.1 : 1,
                                            opacity: currentHour === hourIdx ? 1 : 0.85,
                                        }}
                                        transition={{
                                            duration: 0.3,
                                            ease: 'easeInOut',
                                        }}
                                        whileHover={{ scale: 1.15, opacity: 1 }}
                                    >
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                                            <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap font-mono">
                                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIdx]} {hourIdx}:00
                                                <br />
                                                {(intensity * 100).toFixed(0)}% Carbon
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Hour labels */}
                    <div className="flex gap-1 mt-2 ml-12">
                        {Array.from({ length: HOURS }).map((_, idx) => (
                            <div key={idx} className="flex-1 text-center">
                                {idx % 6 === 0 && (
                                    <span className="text-[10px] text-gray-500 dark:text-slate-500 font-mono">{idx}</span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-2 text-xs text-gray-500 dark:text-slate-500">Hour of Day</div>
                </div>
            </div>

            {/* Animated current hour indicator */}
            <motion.div
                className="absolute -right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <div className="bg-energy-green text-navy-950 px-3 py-1 rounded-full text-xs font-bold font-mono shadow-lg">
                    {currentHour}:00
                </div>
            </motion.div>
        </div>
    );
}
