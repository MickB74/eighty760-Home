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
            <section className="py-12" style={{ backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-2xl font-bold brand-text mb-4">The Challenge: Variability</h2>
                            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                                Renewable energy sources like wind and solar are inherently variable. A solar farm generates
                                peak energy at midday, often creating a surplus, while failing to address demand during evening
                                peaks or winter mornings.
                            </p>
                            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                                Eighty760 functions as a &quot;digital twin,&quot; allowing users to simulate the complex interaction
                                between load profiles and generation assets.
                            </p>
                        </div>
                        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                            <h3 className="stMetricLabel mb-3">Traditional vs. 24/7 Matching</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                                    <div>
                                        <div className="font-bold" style={{ color: 'var(--text-primary)' }}>Annual Net Zero</div>
                                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Offsets fossil use via annual volume</div>
                                    </div>
                                    <div className="font-bold" style={{ color: 'var(--text-tertiary)' }}>~100% Volumetric</div>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded border-l-4 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--brand-color)' }}>
                                    <div>
                                        <div className="font-bold brand-text">24/7 CFE</div>
                                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Matches supply & demand hourly</div>
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
            <section id="methodology" className="py-16" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold brand-text mb-8">Methodology & Logic</h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="p-6 rounded-lg hover:shadow-md transition" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                            <div className="w-10 h-10 rounded-md flex items-center justify-center mb-4 text-xl" style={{ backgroundColor: '#E3F2FD' }}>☀️</div>
                            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Generation Modeling</h3>
                            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                                Leveraging NREL&apos;s PVGIS and ERA5 weather data, our model generates high-fidelity hourly generation
                                profiles. We utilize Typical Meteorological Year (TMY) data to ensure statistical reliability, while
                                accounting for seasonal variability and localized weather patterns.
                            </p>
                            <div className="p-3 rounded text-xs font-mono" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
                                Seasonality = 1 + 0.4 * cos(day - peak)
                            </div>
                        </div>

                        <div className="p-6 rounded-lg hover:shadow-md transition" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                            <div className="w-10 h-10 rounded-md flex items-center justify-center mb-4 text-xl" style={{ backgroundColor: '#E3F2FD' }}>🌫️</div>
                            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Emissions Analysis</h3>
                            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                                Calculates three distinct carbon metrics to ensure true abatement, not just paper offsets.
                            </p>
                            <ul className="text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
                                <li><strong>Location-Based:</strong> Total Load × Grid Intensity Factor</li>
                                <li><strong>Market-Based:</strong> Unmatched Load × Grid Intensity Factor</li>
                                <li><strong>Avoided:</strong> Renewable Gen × Grid Intensity Factor</li>
                            </ul>
                            <p className="text-xs mt-3 italic pt-2" style={{ color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-color)' }}>
                                *The &quot;Grid Intensity Factor&quot; switches between <strong>Hourly Data</strong> and <strong>Annual Averages</strong> depending on the data source selected.
                            </p>
                        </div>

                        <div className="p-6 rounded-lg hover:shadow-md transition lg:col-span-1 md:col-span-2" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                            <div className="w-10 h-10 rounded-md flex items-center justify-center mb-4 text-xl" style={{ backgroundColor: '#E3F2FD' }}>💲</div>
                            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Scarcity Pricing Model</h3>
                            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                                REC values scale based on grid stress.
                            </p>
                            <div className="grid grid-cols-4 gap-2 mt-4">
                                <div className="text-center">
                                    <div className="h-16 rounded" style={{ backgroundColor: '#F3F4F6' }}></div>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Mid-Day</p>
                                    <p className="text-xs font-bold">0.45x</p>
                                </div>
                                <div className="text-center">
                                    <div className="h-24 rounded" style={{ backgroundColor: '#D1D5DB' }}></div>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Shoulder</p>
                                    <p className="text-xs font-bold">1.0x</p>
                                </div>
                                <div className="text-center">
                                    <div className="h-32 rounded" style={{ backgroundColor: '#9CA3AF' }}></div>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Evening</p>
                                    <p className="text-xs font-bold">1.2x</p>
                                </div>
                                <div className="text-center">
                                    <div className="h-40 rounded" style={{ backgroundColor: '#4B5563' }}></div>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Critical</p>
                                    <p className="text-xs font-bold">2.0x</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12" style={{ backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <Image src="/image.png" alt="Eighty760 Logo" width={240} height={120} className="w-auto object-contain mb-4" style={{ height: '120px' }} />
                        </div>
                        <div className="md:text-right">
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Based on <a href="/whitepaper.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--brand-color)] transition-colors underline decoration-dotted underline-offset-4">Technical Whitepaper Version 1.0</a>
                            </p>
                            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>© 2025 Eighty760 Simulation Framework</p>
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    );
}
