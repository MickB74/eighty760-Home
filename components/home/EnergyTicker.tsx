'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TickerData {
    load: number;
    gasPrice: number;
    carbonIntensity: number;
    solarOutput: number;
    windOutput: number;
    timestamp?: string;
    isRealData?: boolean;
    isRealLoad?: boolean;
}

export default function EnergyTicker() {
    const [data, setData] = useState<TickerData | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/ticker');
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error('Failed to fetch ticker data', err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    // Placeholder if loading
    const displayData = data || {
        load: 54200,
        gasPrice: 3.10,
        carbonIntensity: 380,
        solarOutput: 8500,
        windOutput: 12000,
        timestamp: new Date().toISOString(),
        isRealData: false
    };

    const items = [
        { label: 'ERCOT LOAD', value: `${displayData.load.toLocaleString()} MW`, color: 'text-blue-600 dark:text-blue-400' },
        { label: 'HENRY HUB', value: `$${displayData.gasPrice.toFixed(2)}`, color: 'text-green-600 dark:text-green-400' },
        { label: 'CARBON ITY', value: `${displayData.carbonIntensity} g/kWh`, color: 'text-gray-600 dark:text-gray-400' },
        { label: 'SOLAR', value: `${displayData.solarOutput.toLocaleString()} MW`, color: 'text-yellow-600 dark:text-yellow-400' },
        { label: 'WIND', value: `${displayData.windOutput.toLocaleString()} MW`, color: 'text-cyan-600 dark:text-cyan-400' },
        {
            label: displayData.isRealLoad ? 'UPDATED' : 'DATA SOURCE',
            value: displayData.isRealLoad && displayData.timestamp ? new Date(displayData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'SIMULATED',
            color: displayData.isRealLoad ? 'text-gray-900 dark:text-white' : 'text-amber-600 dark:text-amber-500'
        },
    ];

    // Duplicate list for seamless infinite scroll
    const marqueeItems = [...items, ...items, ...items, ...items];

    return (
        <div className="w-full bg-white/95 dark:bg-navy-950/90 border-b border-slate-200 dark:border-white/10 backdrop-blur-md overflow-hidden z-50 h-10 flex items-center absolute top-0 left-0">
            <motion.div
                className="flex whitespace-nowrap"
                animate={{ x: [0, "-25%"] }}
                transition={{
                    repeat: Infinity,
                    duration: 20,
                    ease: "linear"
                }}
            >
                {marqueeItems.map((item, i) => (
                    <div key={i} className="flex items-center px-8 text-xs font-mono tracking-wider">
                        <span className="text-gray-500 mr-2 font-bold">{item.label}:</span>
                        <span className={`${item.color} font-medium`}>{item.value}</span>
                        <span className="ml-8 text-slate-300 dark:text-white/10">|</span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
