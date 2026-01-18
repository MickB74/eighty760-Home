'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TickerData {
    load: number;
    gasPrice: number;
    carbonIntensity: number;
    solarOutput: number;
    windOutput: number;
    gasOutput: number;
    coalOutput: number;
    nuclearOutput: number;
    timestamp?: string;
    isRealData?: boolean;
    isRealLoad?: boolean;
    isRealGas?: boolean;
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

    // Placeholder if loading - show 0/empty, do NOT use made up numbers
    const displayData = data || {
        load: 0,
        gasPrice: 0,
        carbonIntensity: 0,
        solarOutput: 0,
        windOutput: 0,
        gasOutput: 0,
        coalOutput: 0,
        nuclearOutput: 0,
        timestamp: new Date().toISOString(),
        isRealData: false,
        isRealLoad: false,
        isRealGas: false
    };

    const formatValue = (val: number, isCurrency: boolean = false, suffix: string = '') => {
        if (val === 0 || val === null || val === undefined) return 'N/A';
        return `${isCurrency ? '$' : ''}${val.toLocaleString(undefined, { maximumFractionDigits: isCurrency ? 2 : 0 })}${suffix}`;
    };

    const items = [
        { label: 'ERCOT LOAD', value: formatValue(displayData.load, false, ' MW'), color: 'text-blue-600 dark:text-blue-400' },
        { label: 'HENRY HUB', value: formatValue(displayData.gasPrice, true, ''), color: displayData.isRealGas ? 'text-green-600 dark:text-green-400 font-bold' : 'text-green-600/70 dark:text-green-400/70' },
        { label: 'CO2 INTENSITY', value: displayData.carbonIntensity > 0 ? `${Math.round(displayData.carbonIntensity)} g/kWh` : 'N/A', color: 'text-gray-600 dark:text-gray-400' },
        { label: 'SOLAR', value: `${displayData.solarOutput >= 0 ? displayData.solarOutput.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A'} MW`, color: 'text-yellow-600 dark:text-yellow-400' },
        { label: 'WIND', value: `${displayData.windOutput >= 0 ? displayData.windOutput.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A'} MW`, color: 'text-cyan-600 dark:text-cyan-400' },
        { label: 'NAT GAS', value: `${displayData.gasOutput > 0 ? displayData.gasOutput.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A'} MW`, color: 'text-orange-600 dark:text-orange-400' },
        { label: 'COAL', value: `${displayData.coalOutput > 0 ? displayData.coalOutput.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A'} MW`, color: 'text-slate-700 dark:text-slate-300' },
        { label: 'NUCLEAR', value: `${displayData.nuclearOutput > 0 ? displayData.nuclearOutput.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A'} MW`, color: 'text-purple-600 dark:text-purple-400' },
        {
            label: (displayData.isRealLoad || displayData.isRealGas) ? 'UPDATED' : 'STATUS',
            value: (displayData.isRealLoad || displayData.isRealGas) && displayData.timestamp ? new Date(displayData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (data ? 'OFFLINE' : 'LOADING...'),
            color: (displayData.isRealLoad || displayData.isRealGas) ? 'text-gray-900 dark:text-white' : 'text-amber-600 dark:text-amber-500'
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
                    duration: 30, // Slower for readability
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
