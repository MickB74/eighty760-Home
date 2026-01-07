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
        <main className="min-h-screen bg-navy-950">
            <Navigation />

            <div className="max-w-4xl mx-auto px-6 py-12">
                <header className="mb-12 border-b border-white/10 pb-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                        Methodology & <span className="text-energy-green">Technical Architecture</span>
                    </h1>
                    <p className="text-xl text-slate-300">
                        A detailed breakdown of the data sources, simulation engine, and financial models powering the Eighty760 Aggregation Platform.
                    </p>
                </header>

                <div className="space-y-16">

                    {/* Section 1: Core Simulation Engine */}
                    <section>
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-white">
                            <span className="w-8 h-8 rounded-full bg-energy-green/20 text-energy-green flex items-center justify-center text-sm font-bold">1</span>
                            Core Simulation Engine
                        </h2>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4 text-slate-300">
                            <p>
                                The platform runs a deterministic <strong className="text-white">8,760-hour (hourly) simulation</strong> of the entire year. Unlike simple monthly averages, this captures the volatility and correlation between renewable generation, market prices, and load demand.
                            </p>
                            <p>
                                For every single hour of the year (t=1...8760), the engine performs the following balance check:
                            </p>
                            <div className="bg-navy-950/50 p-4 rounded-lg border border-energy-green/20 font-mono text-sm my-4 text-energy-green">
                                Net_Load(t) = Load(t) - [ Σ Gen_Asset_i(t) + Battery_Discharge(t) - Battery_Charge(t) ]
                            </div>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <strong className="text-white">Matching:</strong> If Generation exceeds Load, the surplus is stored in the battery (if available) or sold to the market/curtailed.
                                </li>
                                <li>
                                    <strong className="text-white">Deficit:</strong> If Load exceeds Generation, the deficit is met by discharging the battery or purchasing &quot;brown power&quot; from the grid.
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 2: Data Sources */}
                    <section>
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-white">
                            <span className="w-8 h-8 rounded-full bg-energy-green/20 text-energy-green flex items-center justify-center text-sm font-bold">2</span>
                            Data Sources & Accuracy
                        </h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-bold mb-3 text-energy-green">Market Pricing (ERCOT)</h3>
                                <p className="text-sm text-slate-300 mb-3">
                                    Pricing data is sourced from <strong className="text-white">GridStatus.io</strong>, providing 15-minute Real-Time Market (RTM) Settlement Point Prices (SPPs).
                                </p>
                                <ul className="text-sm list-disc pl-5 space-y-1 text-slate-300">
                                    <li><strong className="text-white">Source:</strong> ERCOT RTM via GridStatus API.</li>
                                    <li><strong className="text-white">Nodes & Hubs:</strong> We ingest data for key hubs: <code className="text-energy-green">HB_NORTH</code>, <code className="text-energy-green">HB_SOUTH</code>, <code className="text-energy-green">HB_WEST</code>, <code className="text-energy-green">HB_HOUSTON</code>, and <code className="text-energy-green">HB_PAN</code>.</li>
                                    <li><strong className="text-white">Granularity:</strong> 15-minute intervals aggregated to hourly averages for the simulation (8,760 hours/year).</li>
                                    <li><strong className="text-white">Completeness:</strong> Full historical datasets from 2020 through 2025.</li>
                                </ul>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-bold mb-3 text-energy-green">Weather & Engineering Models</h3>
                                <p className="text-sm text-slate-300 mb-3">
                                    Weather data is sourced from <strong className="text-white">Open-Meteo Historic Weather API</strong> (ERA5 Reanalysis).
                                </p>
                                <ul className="text-sm list-disc pl-5 space-y-1 text-slate-300">
                                    <li>
                                        <strong className="text-white">Solar Model:</strong> Uses <code className="text-energy-green">shortwave_radiation</code> (GHI). Assumes Single-Axis Tracking with ~20% AC system efficiency.
                                    </li>
                                    <li>
                                        <strong className="text-white">Wind Model:</strong> Uses <code className="text-energy-green">wind_speed_100m</code>. Mapped to a standard <strong className="text-white">IEC Class 2</strong> onshore turbine power curve.
                                    </li>
                                    <li>
                                        <strong className="text-white">Battery Specs:</strong> Models a 4-hour Li-Ion BESS with <strong className="text-white">85% Round-Trip Efficiency (RTE)</strong> and standard VOM costs.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Financial Modeling */}
                    <section>
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-white">
                            <span className="w-8 h-8 rounded-full bg-energy-green/20 text-energy-green flex items-center justify-center text-sm font-bold">3</span>
                            Financial Modeling
                        </h2>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-slate-300 space-y-4">
                            <p>
                                The platform computes real-time net-cost (or net-profit) for every hour, accounting for:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong className="text-white">PPA Costs:</strong> Fixed or variable pricing for each tech asset ($/MWh).</li>
                                <li><strong className="text-white">Market Revenue:</strong> Surplus power sold at local hub prices or purchased to cover deficit.</li>
                                <li><strong className="text-white">REC Revenue:</strong> Scarcity-based pricing model that captures higher REC value when clean energy is scarce.</li>
                                <li><strong className="text-white">Battery Arbitrage:</strong> Charging during low-price hours and discharging during peak-price hours.</li>
                            </ul>
                            <p className="text-sm italic">
                                All costs and revenues are tracked on an hourly granularity and then aggregated into annual summaries for easy interpretation.
                            </p>
                        </div>
                    </section>

                    {/* Section 4: Key Assumptions */}
                    <section>
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-white">
                            <span className="w-8 h-8 rounded-full bg-energy-green/20 text-energy-green flex items-center justify-center text-sm font-bold">4</span>
                            Key Assumptions & Limitations
                        </h2>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                            <div className="space-y-4 text-sm text-slate-300">
                                {[
                                    { title: "No Transmission Constraints", description: "We assume perfect transmission within ERCOT North. Real nodal congestion may impact prices." },
                                    { title: "Standard Turbine Models", description: "Wind profiles use generic IEC Class 2 curves; actual farm performance may vary." },
                                    { title: "Battery Degradation", description: "Long-term degradation is not modeled in this version." },
                                    { title: "Historical Weather", description: "Simulations use actual historical weather; future projections require climate modeling." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-3">
                                        <span className="font-bold text-energy-green min-w-[200px]">{item.title}</span>
                                        <span>{item.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="pt-8 border-t border-white/10">
                        <p className="text-sm text-slate-400 text-center">
                            For questions or technical inquiries, contact <a href="mailto:contact@eighty760.com" className="text-energy-green hover:underline">contact@eighty760.com</a>
                        </p>
                    </footer>

                </div>
            </div>
        </main>
    );
}
