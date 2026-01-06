'use client';

import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Simulator from '@/components/Simulator';
import Image from 'next/image';

export default function Home() {
    return (
        <main>
            <Navigation />
            <Hero />

            {/* The Problem Section */}
            <section className="py-12 bg-white dark:bg-slate-900 border-y border-gray-200 dark:border-slate-800 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-2xl font-bold brand-text mb-4">The Challenge: Variability</h2>
                            <p className="mb-4 text-gray-600 dark:text-gray-300">
                                Renewable energy sources like wind and solar are inherently variable. A solar farm generates
                                peak energy at midday, often creating a surplus, while failing to address demand during evening
                                peaks or winter mornings.
                            </p>
                            <p className="font-medium text-gray-600 dark:text-gray-300">
                                Eighty760 functions as a &quot;digital twin,&quot; allowing users to simulate the complex interaction
                                between load profiles and generation assets.
                            </p>
                        </div>
                        <div className="p-6 rounded-lg bg-gray-100 dark:bg-slate-700 transition-colors duration-300">
                            <h3 className="text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Traditional vs. 24/7 Matching</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600">
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-gray-100">Annual Net Zero</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Offsets fossil use via annual volume</div>
                                    </div>
                                    <div className="font-bold text-gray-400 dark:text-gray-500">~100% Volumetric</div>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded border-l-4 shadow-sm bg-white dark:bg-slate-800 border-brand dark:border-brand-light">
                                    <div>
                                        <div className="font-bold brand-text">24/7 CFE</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Matches supply & demand hourly</div>
                                    </div>
                                    <div className="font-bold brand-text">Hourly Score</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Simulator />

            {/* Methodology Section */}
            <section id="methodology" className="py-16 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold brand-text mb-8">Methodology & Logic</h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="p-6 rounded-lg hover:shadow-md transition bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
                            <div className="w-10 h-10 rounded-md flex items-center justify-center mb-4 text-xl bg-blue-50 dark:bg-slate-800">☀️</div>
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
                            <div className="w-10 h-10 rounded-md flex items-center justify-center mb-4 text-xl bg-blue-50 dark:bg-slate-800">🌫️</div>
                            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Emissions Analysis</h3>
                            <p className="text-sm mb-4 text-gray-600 dark:text-gray-300">
                                Calculates three distinct carbon metrics to ensure true abatement, not just paper offsets.
                            </p>
                            <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
                                <li><strong>Location-Based:</strong> Total Load × Grid Intensity Factor</li>
                                <li><strong>Market-Based:</strong> Unmatched Load × Grid Intensity Factor</li>
                                <li><strong>Avoided:</strong> Renewable Gen × Grid Intensity Factor</li>
                            </ul>
                            <p className="text-xs mt-3 italic pt-2 text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-slate-800">
                                *The &quot;Grid Intensity Factor&quot; switches between <strong>Hourly Data</strong> and <strong>Annual Averages</strong> depending on the data source selected.
                            </p>
                        </div>

                        <div className="p-6 rounded-lg hover:shadow-md transition lg:col-span-1 md:col-span-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
                            <div className="w-10 h-10 rounded-md flex items-center justify-center mb-4 text-xl bg-blue-50 dark:bg-slate-800">💲</div>
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
                            <Image src="/image.png" alt="Eighty760 Logo" width={240} height={120} className="w-auto object-contain mb-4 h-[120px]" />
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
