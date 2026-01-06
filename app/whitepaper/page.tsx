'use client';

import React from 'react';
import Navigation from '@/components/Navigation';

export default function WhitepaperPage() {
    return (
        <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
            <Navigation />

            <div className="max-w-4xl mx-auto px-6 py-12">
                <header className="mb-12 border-b border-[var(--border-color)] pb-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[var(--brand-color)] to-blue-400">
                        Methodology & Technical Architecture
                    </h1>
                    <p className="text-xl text-[var(--text-secondary)]">
                        A detailed breakdown of the data sources, simulation engine, and financial models powering the Eighty760 Aggregation Platform.
                    </p>
                </header>

                <div className="space-y-16">

                    {/* Section 1: Core Simulation Engine */}
                    <section>
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-[var(--brand-color)] bg-opacity-20 text-[var(--brand-color)] flex items-center justify-center text-sm font-bold">1</span>
                            Core Simulation Engine
                        </h2>
                        <div className="prose prose-invert max-w-none text-[var(--text-secondary)] space-y-4">
                            <p>
                                The platform runs a deterministic <strong>8,760-hour (hourly) simulation</strong> of the entire year. Unlike simple monthly averages, this captures the volatility and correlation between renewable generation, market prices, and load demand.
                            </p>
                            <p>
                                For every single hour of the year ($t=1...8760$), the engine performs the following balance check:
                            </p>
                            <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)] font-mono text-sm my-4">
                                Net_Load(t) = Load(t) - [ Σ Gen_Asset_i(t) + Battery_Discharge(t) - Battery_Charge(t) ]
                            </div>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <strong>Matching:</strong> If Generation exceeds Load, the surplus is stored in the battery (if available) or sold to the market/curtailed.
                                </li>
                                <li>
                                    <strong>Deficit:</strong> If Load exceeds Generation, the deficit is met by discharging the battery or purchasing &quot;brown power&quot; from the grid.
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 2: Data Sources */}
                    <section>
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-[var(--brand-color)] bg-opacity-20 text-[var(--brand-color)] flex items-center justify-center text-sm font-bold">2</span>
                            Data Sources & Accuracy
                        </h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--border-color)]">
                                <h3 className="text-lg font-bold mb-3 text-[var(--brand-color)]">Market Pricing (ERCOT)</h3>
                                <p className="text-sm text-[var(--text-secondary)] mb-3">
                                    We utilize <strong>15-minute Real-Time Market (RTM) Settlement Point Prices (SPPS)</strong> sourced directly from ERCOT via <em>GridStatus.io</em>.
                                </p>
                                <ul className="text-sm list-disc pl-5 space-y-1 text-[var(--text-secondary)]">
                                    <li><strong>Frequency:</strong> 15-minute intervals aggregated to hourly.</li>
                                    <li><strong>Range:</strong> 2020 through 2025.</li>
                                    <li><strong>Nodes:</strong> Specific Hubs (North, South, West, Houston, Panhandle) to capture basis risk.</li>
                                </ul>
                            </div>
                            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--border-color)]">
                                <h3 className="text-lg font-bold mb-3 text-[var(--brand-color)]">Weather & Generation</h3>
                                <p className="text-sm text-[var(--text-secondary)] mb-3">
                                    Generation profiles are built using historical weather reanalysis data from <em>Open-Meteo</em>.
                                </p>
                                <ul className="text-sm list-disc pl-5 space-y-1 text-[var(--text-secondary)]">
                                    <li><strong>Solar:</strong> Derived from Global Horizontal Irradiance (GHI) and temperature.</li>
                                    <li><strong>Wind:</strong> Derived from 100m wind speeds using standard IEC Class 2 turbine power curves.</li>
                                    <li><strong>Correlation:</strong> Weather data is location-specific, ensuring that a West Texas wind farm reflects actual West Texas wind patterns for the selected year.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Financial Modeling */}
                    <section>
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-[var(--brand-color)] bg-opacity-20 text-[var(--brand-color)] flex items-center justify-center text-sm font-bold">3</span>
                            Financial Modeling
                        </h2>
                        <div className="prose prose-invert max-w-none text-[var(--text-secondary)] space-y-4">
                            <h3 className="text-lg font-semibold text-white mt-4">PPA vs. Market Revenue</h3>
                            <p>
                                The tool models a &quot;Virtual PPA&quot; or Fixed-for-Floating swap structure:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <strong>Settlement Value:</strong> calculated as <code>(Market_Price - Strike_Price) * Volume</code>.
                                </li>
                                <li>
                                    <strong>Nodal Basis Risk:</strong> Generator revenue is calculated at the <em>Generator&apos;s Hub</em> (e.g., West Hub), while the Load pays based on the <em>Load Hub</em> (e.g., North Hub). The spread between these prices represents real-world basis risk.
                                </li>
                            </ul>

                            <h3 className="text-lg font-semibold text-white mt-4">Battery Valuation (CVTA)</h3>
                            <p>
                                We use a proprietary <strong>Comprehensive Value to Aggregator (CVTA)</strong> metric for batteries, which accounts for:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Energy Arbitrage:</strong> Revenue from charging low and discharging high.</li>
                                <li><strong>Ancillary Services:</strong> Estimated revenue from ECRS/Reg-Up reserves.</li>
                                <li><strong>Capacity Costs:</strong> Monthly fixed tolling fees (Capacity Payment).</li>
                                <li><strong>VOM:</strong> Variable Operations & Maintenance costs per MWh cycled.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 4: Operational Metrics */}
                    <section>
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-[var(--brand-color)] bg-opacity-20 text-[var(--brand-color)] flex items-center justify-center text-sm font-bold">4</span>
                            Key Metrics Defined
                        </h2>
                        <div className="grid gap-4">
                            {[
                                { title: "CFE Score (Carbon Free Energy)", desc: "The percentage of total Load MWh matched by Carbon-Free Generation in the same hour." },
                                { title: "LOGH (Lack of Green Hours)", desc: "The percentage of hours in the year where the Load was not fully met by Green Generation (deficit > 0)." },
                                { title: "Productivity", desc: "Total matched MWh divided by the total Nameplate Capacity (MW). Indicates asset utilization efficiency." },
                                { title: "Net Cost / MWh", desc: "The all-in cost of the portfolio (PPA Settlements + Market Purchases - Surplus Sales) divided by Total Load." }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col md:flex-row gap-4 p-4 border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors rounded-lg">
                                    <span className="font-bold text-[var(--brand-color)] min-w-[200px]">{item.title}</span>
                                    <span className="text-[var(--text-secondary)]">{item.desc}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </div>
        </main>
    );
}
