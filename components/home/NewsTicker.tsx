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
        <div className="w-full bg-slate-50 dark:bg-navy-950 border-t border-slate-200 dark:border-white/5 backdrop-blur-sm overflow-hidden z-[100] h-8 flex items-center fixed bottom-0 left-0">
            {/* Label */}
            <div className="absolute left-0 h-full bg-slate-100 dark:bg-navy-950/80 px-4 flex items-center z-10 border-r border-slate-200 dark:border-white/10">
                <span className="text-[10px] font-bold tracking-widest text-red-400 uppercase">Breaking News</span>
            </div>

            <motion.div
                className="flex whitespace-nowrap pl-32" // Padding left to clear the absolute label
                animate={{ x: [0, "-33.33%"] }}
                transition={{
                    repeat: Infinity,
                    duration: 40, // Slower than the data ticker
                    ease: "linear"
                }}
            >
                {marqueeContent.map((headline, i) => (
                    <a
                        key={i}
                        href={`https://news.google.com/search?q=${encodeURIComponent(headline)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mx-8 text-sm font-medium text-blue-900 hover:text-blue-600 dark:text-blue-200 dark:hover:text-white transition-colors flex items-center"
                    >
                        <span>{headline}</span>
                        <span className="ml-8 text-slate-300 dark:text-white/5 mx-2">•</span>
                    </a>
                ))}
            </motion.div>
        </div>
    );
}
