'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function NewsTicker() {
    const [headlines, setHeadlines] = useState<string[]>([
        "Loading live energy news...",
    ]);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch('/api/news');
                if (res.ok) {
                    const json = await res.json();
                    if (json.headlines && json.headlines.length > 0) {
                        setHeadlines(json.headlines);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch news:", err);
            }
        };

        fetchNews();
        // Refresh every 5 minutes
        const interval = setInterval(fetchNews, 300000);
        return () => clearInterval(interval);
    }, []);

    // Duplicated for seamless loop
    const marqueeContent = [...headlines, ...headlines, ...headlines];

    return (
        <div className="w-full bg-white/5 border-b border-white/5 backdrop-blur-sm overflow-hidden z-40 h-8 flex items-center relative">
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
                        <a
                            href={`https://news.google.com/search?q=${encodeURIComponent(item)}&hl=en-US&gl=US&ceid=US:en`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-energy-green transition-colors cursor-pointer"
                        >
                            {item}
                        </a>
                        <span className="ml-8 text-white/5 mx-2">•</span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
