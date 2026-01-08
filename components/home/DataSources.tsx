'use client';

import { motion } from 'framer-motion';

export default function DataSources() {
    const sources = [
        { name: 'NREL PVGIS', description: 'Solar & Weather Data' },
        { name: 'ERCOT RTM', description: 'Real-Time Market Prices' },
        { name: 'EnergyTag', description: 'Granular Tracking Standard' },
        { name: 'GHG Protocol', description: 'Carbon Accounting Framework' },
    ];

    return (
        <section className="py-16 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-white/10 transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-lg font-semibold text-gray-900 dark:text-white mb-8"
                >
                    Built on Industry-Leading Data & Standards
                </motion.h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {sources.map((source, index) => (
                        <motion.div
                            key={source.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="flex flex-col items-center"
                        >
                            <div className="font-bold text-gray-800 dark:text-slate-200 mb-1">
                                {source.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-400">
                                {source.description}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
