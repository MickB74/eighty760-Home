'use client';

import HeroSimulator from './home/HeroSimulator';
import { motion } from 'framer-motion';
import Link from 'next/link';
import EnergyTicker from './home/EnergyTicker';

import PriceTicker from './home/PriceTicker';

export default function Hero() {

    return (
        <header className="min-h-screen relative overflow-hidden gradient-mesh flex items-center pt-32">
            <EnergyTicker />

            <PriceTicker />
            {/* Background overlay for depth */}
            <div className="absolute inset-0 bg-white/80 dark:bg-navy-950/80 transition-colors duration-300"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Messaging */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                        <h1 className="text-5xl sm:text-7xl font-extrabold text-navy-950 dark:text-white mb-6 leading-tight tracking-tight">
                            24/7 Carbon Matching
                            <br />
                            <span className="brand-text">Without the Guesswork</span>
                        </h1>

                        <p className="text-xl mb-8 leading-relaxed text-gray-600 dark:text-slate-300">
                            See exactly how solar, wind, storage, and clean firm power match your load—hour by hour, all year long. <strong>Get the full picture before you sign a PPA.</strong>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/aggregation"
                                className="px-8 py-4 text-lg font-bold bg-energy-green text-navy-950 rounded-lg shadow-lg transition hover:bg-energy-green/90 hover:scale-105 transform text-center"
                            >
                                Start Analysis →
                            </Link>
                            <button
                                onClick={() => document.getElementById('methodology')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-8 py-4 text-lg font-semibold text-navy-950 dark:text-white bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md rounded-lg hover:bg-white/60 dark:hover:bg-white/10 transition"
                            >
                                How It Works
                            </button>
                        </div>

                        {/* Quantitative Trust Signals */}
                        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/10">
                            <div className="grid grid-cols-3 gap-8">
                                <div>
                                    <p className="text-3xl font-bold brand-text">8,760</p>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">Hours Modeled</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold brand-text">5+</p>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">Technologies</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold brand-text">Historical</p>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">Hub Pricing</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Animated Heatmap */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                    >
                        <HeroSimulator />
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
