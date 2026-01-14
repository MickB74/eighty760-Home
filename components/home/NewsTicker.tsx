'use client';

import { motion } from 'framer-motion';

export default function NewsTicker() {
    // Simulated live news headlines
    const headlines = [
        "ERCOT: Grid operating normally, sufficient generation available.",
        "MARKET: Solar output hits new daily record of 18 GW.",
        "WEATHER: Cold front approaching North Texas, demand expected to rise.",
        "REGULATORY: PUC discusses new battery storage interconnection rules.",
        "PRICE ALERT: Real-time prices stable at $25/MWh.",
        "INDUSTRY: Texas leads nation in new utility-scale wind capacity.",
    ];

    // Duplicated for seamless loop
    const marqueeContent = [...headlines, ...headlines, ...headlines];

    return (
        <div className="w-full bg-white/5 border-b border-white/5 backdrop-blur-sm overflow-hidden z-40 h-8 flex items-center absolute top-10 left-0">
            {/* Label */}
            <div className="absolute left-0 h-full bg-navy-950/80 px-4 flex items-center z-10 border-r border-white/10">
                <span className="text-[10px] font-bold tracking-widest text-red-400 uppercase">Breaking News</span>
            </div>

            <motion.div
                className="flex whitespace-nowrap pl-32" // Padding left to clear the absolute label
                animate={{ x: [0, -1000] }}
                transition={{
                    repeat: Infinity,
                    duration: 40, // Slower than the data ticker
                    ease: "linear"
                }}
            >
                {marqueeContent.map((item, i) => (
                    <div key={i} className="flex items-center px-8 text-[11px] font-medium tracking-wide text-slate-300">
                        <span>{item}</span>
                        <span className="ml-8 text-white/5 mx-2">•</span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
