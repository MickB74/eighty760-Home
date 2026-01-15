'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface PriceData {
    [key: string]: string; // Dynamic keys
}

interface TickerResponse {
    prices: PriceData;
    timestamp?: string;
    isRealData?: boolean;
}

export default function PriceTicker() {
    const [data, setData] = useState<TickerResponse | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/ticker');
                if (res.ok) {
                    const json = await res.json();
                    if (json.prices) {
                        setData(json);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch price ticker data', err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // 30s updates for prices
        return () => clearInterval(interval);
    }, []);

    const displayPrices = data?.prices || {
        HB_NORTH: "28.50", HB_SOUTH: "27.80", HB_WEST: "22.10", HB_HOUSTON: "31.40",
        LZ_NORTH: "28.90", LZ_SOUTH: "28.10", LZ_WEST: "23.50", LZ_HOUSTON: "32.80"
    };

    const items = [
        { label: 'HB_NORTH', value: displayPrices.HB_NORTH },
        { label: 'HB_SOUTH', value: displayPrices.HB_SOUTH },
        { label: 'HB_WEST', value: displayPrices.HB_WEST },
        { label: 'HB_HOUSTON', value: displayPrices.HB_HOUSTON },
        { label: 'LZ_NORTH', value: displayPrices.LZ_NORTH },
        { label: 'LZ_SOUTH', value: displayPrices.LZ_SOUTH },
        { label: 'LZ_WEST', value: displayPrices.LZ_WEST },
        { label: 'LZ_HOUSTON', value: displayPrices.LZ_HOUSTON },
        {
            label: data?.isRealData ? 'UPDATED' : 'DATA SOURCE',
            value: data?.isRealData && data?.timestamp ? new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'SIMULATED'
        },
    ];

    // Marquee duplication
    const marqueeItems = [...items, ...items, ...items];

    return (
        <div className="w-full bg-slate-900 border-b border-slate-800 overflow-hidden h-10 flex items-center absolute top-[72px] left-0 z-30">
            <div className="absolute left-0 h-full bg-slate-900 px-4 flex items-center z-10 border-r border-slate-800 shadow-md">
                <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">Real-Time LMP</span>
            </div>

            <motion.div
                className="flex whitespace-nowrap pl-32"
                animate={{ x: [0, "-33.33%"] }}
                transition={{
                    repeat: Infinity,
                    duration: 30,
                    ease: "linear"
                }}
            >
                {marqueeItems.map((item, i) => (
                    <div key={i} className="flex items-center px-6 text-sm font-mono">
                        <span className="text-slate-500 mr-2 font-semibold">{item.label}</span>
                        <span className="text-emerald-400 font-bold">${item.value}</span>
                        <span className="ml-6 text-slate-800">|</span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
