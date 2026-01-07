'use client';

import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Simulator from '@/components/Simulator';
import ComparisonTable from '@/components/home/ComparisonTable';
import HowItWorks from '@/components/home/HowItWorks';
import UseCases from '@/components/home/UseCases';
import MaturityLadder from '@/components/home/MaturityLadder';
import Image from 'next/image';

export default function Home() {
    return (
        <main>
            <Navigation />
            <Hero />

            <ComparisonTable />
            <HowItWorks />

            <Simulator />

            <UseCases />
            <MaturityLadder />

            {/* Methodology Section */}
            <section id="methodology" className="py-16 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold brand-text mb-8">Methodology & Logic</h2>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <div className="p-6 rounded-lg hover:shadow-md transition bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
                            <div className="w-10 h-10 rounded-md flex items-center justify-center mb-4 text-xl bg-energy-green/10 backdrop-blur-sm">☀️</div>
                            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Generation Modeling</h3>
                            <p className="text-sm mb-4 text-gray-600 dark:text-gray-300">
                                Leveraging NREL&apos;s PVGIS and ERA5 weather data, our model generates high-fidelity hourly generation
                                profiles. We utilize Typical Meteorological Year (TMY) data to ensure statistical reliability, while
                                accounting for seasonal variability and localized weather patterns.
                            </p>
                            <div className="p-3 rounded text-xs font-mono bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                                Seasonality = 1 + 0.4 * cos(day - peak)
                            </div>
                        </div>



                        <div className="p-6 rounded-lg hover:shadow-md transition bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
                            <div className="w-10 h-10 rounded-md flex items-center justify-center mb-4 text-xl bg-energy-green/10 backdrop-blur-sm">💲</div>
                            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Scarcity Pricing Model</h3>
                            <p className="text-sm mb-4 text-gray-600 dark:text-gray-300">
                                REC values scale based on grid stress.
                            </p>
                            <div className="grid grid-cols-4 gap-2 mt-4">
                                <div className="text-center">
                                    <div className="h-16 rounded bg-gray-100 dark:bg-slate-700"></div>
                                    <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">Mid-Day</p>
                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">0.45x</p>
                                </div>
                                <div className="text-center">
                                    <div className="h-24 rounded bg-gray-300 dark:bg-slate-600"></div>
                                    <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">Shoulder</p>
                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">1.0x</p>
                                </div>
                                <div className="text-center">
                                    <div className="h-32 rounded bg-gray-400 dark:bg-slate-500"></div>
                                    <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">Evening</p>
                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">1.2x</p>
                                </div>
                                <div className="text-center">
                                    <div className="h-40 rounded bg-gray-600 dark:bg-slate-400"></div>
                                    <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">Critical</p>
                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">2.0x</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <Image src="/logo.png" alt="Eighty760 Logo" width={720} height={360} className="w-auto object-contain mb-4 h-[360px]" />
                        </div>
                        <div className="md:text-right">
                            <p className="text-sm mb-4 md:mb-0 text-gray-600 dark:text-gray-400">
                                Based on <a href="/whitepaper" className="hover:text-brand dark:hover:text-brand-light transition-colors underline decoration-dotted underline-offset-4">Methodology & Technical Architecture</a>
                            </p>
                            <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">© 2026 Eighty760 Simulation Framework</p>
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    );
}
