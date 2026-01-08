'use client';

import { motion } from 'framer-motion';

export default function MetricsBar() {
    const metrics = [
        { value: '8,760', label: 'Hours Modeled Annually', icon: '⏰' },
        { value: '$100M+', label: 'Energy Spend Analyzed', icon: '💰' },
        { value: '5+', label: 'Clean Technologies', icon: '⚡' },
        { value: '26 Years', label: 'Historical Weather Data', icon: '📊' },
    ];

    return (
        <section className="py-12 bg-white dark:bg-navy-950 border-y border-gray-200 dark:border-white/10 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {metrics.map((metric, index) => (
                        <motion.div
                            key={metric.label}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="text-center"
                        >
                            <div className="text-3xl mb-2">{metric.icon}</div>
                            <div className="text-3xl md:text-4xl font-bold brand-text mb-2">
                                {metric.value}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-slate-400">
                                {metric.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
