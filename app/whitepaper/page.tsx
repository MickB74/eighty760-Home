import React from 'react';
import Navigation from '@/components/Navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Methodology & Technical Architecture | Eighty760",
    description: "Detailed breakdown of the data sources, simulation engine, and financial models powering the Eighty760 Aggregation Platform.",
    openGraph: {
        title: "Methodology & Technical Architecture | Eighty760",
        description: "Detailed breakdown of the data sources, simulation engine, and financial models powering the Eighty760 Aggregation Platform.",
    }
};

export default function WhitepaperPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 font-sans">
            <Navigation />

            <div className="max-w-4xl mx-auto px-6 py-12">
                <header className="mb-12 border-b border-gray-200 dark:border-slate-700 pb-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-brand dark:from-brand-light to-blue-400">
                        Methodology & Technical Architecture
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        A detailed breakdown of the data sources, simulation engine, and financial models powering the Eighty760 Aggregation Platform.
                    </p>
                </header>

                <div className="space-y-16">

                    {/* Section 1: Core Simulation Engine */}
                    <section>
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-energy-green bg-opacity-20 text-energy-green flex items-center justify-center text-sm font-bold">1</span>
                            Core Simulation Engine
                        </h2>
                        <div className="prose prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-4">
                            <p>
                                The platform runs a deterministic <strong>8,760-hour (hourly) simulation</strong> of the entire year. Unlike simple monthly averages, this captures the volatility and correlation between renewable generation, market prices, and load demand.
                            </p>
                            <p>
                                For every single hour of the year ($t=1...8760$), the engine performs the following balance check:
                            </p>
                            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 font-mono text-sm my-4">
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
                            <span className="w-8 h-8 rounded-full bg-energy-green bg-opacity-20 text-energy-green flex items-center justify-center text-sm font-bold">2</span>
                            Data Sources & Accuracy
                        </h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
                                <h3 className="text-lg font-bold mb-3 text-energy-green">Market Pricing (ERCOT)</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                    Pricing data is sourced from <strong>GridStatus.io</strong>, providing 15-minute Real-Time Market (RTM) Settlement Point Prices (SPPs).
                                </p>
                                <ul className="text-sm list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
                                    <li><strong>Source:</strong> ERCOT RTM via GridStatus API.</li>
                                    <li><strong>Nodes & Hubs:</strong> We ingest data for key hubs: <code>HB_NORTH</code>, <code>HB_SOUTH</code>, <code>HB_WEST</code>, <code>HB_HOUSTON</code>, and <code>HB_PAN</code>.</li>
                                    <li><strong>Granularity:</strong> 15-minute intervals aggregated to hourly averages for the simulation (8,760 hours/year).</li>
                                    <li><strong>Completeness:</strong> Full historical datasets from 2020 through 2025.</li>
                                </ul>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
                                <h3 className="text-lg font-bold mb-3 text-energy-green">Weather &amp; Engineering Models</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                    Weather data is sourced from <strong>Open-Meteo Historic Weather API</strong> (ERA5 Reanalysis).
                                </p>
                                <ul className="text-sm list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
                                    <li>
                                        <strong>Solar Model:</strong> Uses <code>shortwave_radiation</code> (GHI). Assumes Single-Axis Tracking with ~20% AC system efficiency.
                                    </li>
                                    <li>
                                        <strong>Wind Model:</strong> Uses <code>wind_speed_100m</code>. Mapped to a standard <strong>IEC Class 2</strong> onshore turbine power curve.
                                    </li>
                                    <li>
                                        <strong>Battery Specs:</strong> Models a 4-hour Li-Ion BESS with <strong>85% Round-Trip Efficiency (RTE)</strong> and standard VOM costs.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Financial Modeling */}
                    <section>
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-energy-green bg-opacity-20 text-energy-green flex items-center justify-center text-sm font-bold">3</span>
                            Financial Modeling
                        </h2>
                        <div className="prose prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-4">
                            <h3 className="text-lg font-semibold text-white mt-4">Virtual PPA (Fixed-for-Floating)</h3>
                            <p>
                                The tool models a &quot;Virtual PPA&quot; structure where settlement is strictly tied to the <strong>Generation Asset&apos;s Location</strong>:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <strong>Settlement Logic:</strong> <code>Settlement = (Asset_Hub_Price - Strike_Price) * Generated_MWh</code>.
                                </li>
                                <li>
                                    <strong>Specific Hubs:</strong> Solar assets settle against the <em>Solar Hub</em> price (e.g., HB_WEST), while Wind assets settle against the <em>Wind Hub</em> price (e.g., HB_PAN).
                                </li>
                                <li>
                                    <strong>Net Cost Calculation:</strong> The client&apos;s total cost is their <strong>Physical Load Bill</strong> (at Load Hub prices) minus the <strong>PPA Settlement Credits</strong>. This accurately captures the basis differential between where power is consumed versus where it is generated.
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
                            <span className="w-8 h-8 rounded-full bg-energy-green bg-opacity-20 text-energy-green flex items-center justify-center text-sm font-bold">4</span>
                            Key Metrics Defined
                        </h2>
                        <div className="grid gap-4">
                            {[
                                { title: "CFE Score (Carbon Free Energy)", desc: "The percentage of total Load MWh matched by Carbon-Free Generation in the same hour." },
                                { title: "LOGH (Lack of Green Hours)", desc: "The percentage of hours in the year where the Load was not fully met by Green Generation (deficit > 0)." },
                                { title: "Productivity", desc: "Total matched MWh divided by the total Nameplate Capacity (MW). Indicates asset utilization efficiency." },
                                { title: "Net Cost / MWh", desc: "The all-in cost of the portfolio (PPA Settlements + Market Purchases - Surplus Sales) divided by Total Load." }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col md:flex-row gap-4 p-4 border-b border-gray-200 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:bg-slate-800 transition-colors rounded-lg">
                                    <span className="font-bold text-energy-green min-w-[200px]">{item.title}</span>
                                    <span className="text-gray-600 dark:text-gray-300">{item.desc}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </div>
        </main>
    );
}
