'use client';

import CarbonHeatmap from './home/CarbonHeatmap';
import { motion } from 'framer-motion';

export default function Hero() {
    const scrollToSimulator = () => {
        document.getElementById('simulator')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <header className="min-h-screen relative overflow-hidden gradient-mesh flex items-center">
            {/* Background overlay for depth */}
            <div className="absolute inset-0 bg-navy-950/80"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Messaging */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                        <div className="inline-block px-4 py-2 mb-6 text-sm font-semibold tracking-wider text-energy-green uppercase bg-energy-green/10 border border-energy-green/20 rounded-full backdrop-blur-sm">
                            Granular Carbon Accounting
                        </div>

                        <h1 className="text-5xl sm:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                            24/7 CFE
                            <br />
                            <span className="text-energy-green">Intelligence</span>
                        </h1>

                        <p className="text-xl mb-8 leading-relaxed text-slate-300">
                            The source of truth for 8,760-hour energy procurement.
                            Model, stress-test, and validate carbon-free electricity strategies
                            with granular, time-matched analysis.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={scrollToSimulator}
                                className="px-8 py-4 text-lg font-bold bg-energy-green text-navy-950 rounded-lg shadow-lg transition hover:bg-energy-green/90 hover:scale-105 transform"
                            >
                                Run Interactive Model
                            </button>
                            <button
                                onClick={() => document.getElementById('methodology')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-8 py-4 text-lg font-semibold text-white bg-white/5 border border-white/10 backdrop-blur-md rounded-lg hover:bg-white/10 transition"
                            >
                                View Methodology
                            </button>
                        </div>

                        {/* Trust signals */}
                        <div className="mt-12 pt-8 border-t border-white/10">
                            <p className="text-sm text-slate-400 mb-3">Aligned with industry standards:</p>
                            <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-mono">
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-md">EnergyTag</span>
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-md">GHG Protocol</span>
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-md">RE100</span>
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-md">TCFD</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Animated Heatmap */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                    >
                        <CarbonHeatmap />
                    </motion.div>
                </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <div className="text-slate-400 text-sm flex flex-col items-center gap-2">
                    <span>Explore Platform</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </motion.div>
        </header>
    );
}
