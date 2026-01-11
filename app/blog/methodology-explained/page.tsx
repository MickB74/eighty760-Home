import Link from 'next/link';
import { Metadata } from 'next';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
    title: 'The Eighty760 Methodology Explained | Hourly Carbon Modeling',
    description: 'A transparent look at our data sources, modeling approach, and validation process for hourly carbon accounting.',
};

export default function Article() {
    return (
        <main className="min-h-screen bg-gray-50 dark:bg-navy-950 transition-colors duration-300">
            <Navigation />
            <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 mt-16">
                <nav className="mb-8">
                    <Link href="/blog" className="text-emerald-700 dark:text-energy-green hover:underline text-sm font-medium">
                        ← Back to Resources
                    </Link>
                </nav>

                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-xs font-semibold px-3 py-1 bg-emerald-100 dark:bg-energy-green/10 text-emerald-800 dark:text-energy-green rounded-full">
                            Technical
                        </span>
                        <span className="text-sm text-gray-500 dark:text-slate-500">10 min read • January 2025</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-navy-950 dark:text-white mb-6">
                        The Eighty760 Methodology: How We Model Hourly Carbon
                    </h1>
                    <p className="text-xl text-gray-700 dark:text-slate-300">
                        A transparent look at the data sources, modeling approaches, and validation processes behind our 24/7 carbon-free energy simulations.
                    </p>
                </header>

                <div className="prose prose-lg max-w-none text-gray-700 dark:text-slate-300 dark:prose-invert">
                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4">Why Transparency Matters</h2>
                    <p className="mb-4">
                        Energy modeling involves countless assumptions, data sources, and simplifications. As hourly carbon accounting
                        becomes more prevalent in corporate sustainability strategies, it&apos;s critical that modeling tools are
                        transparent about their methodology.
                    </p>
                    <p className="mb-4">
                        This article documents exactly how Eighty760 works—from raw data sources to final CFE scores—so you can
                        understand the strengths and limitations of the analysis.
                    </p>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Data Sources</h2>

                    <h3 className="text-xl font-semibold text-navy-950 dark:text-white mb-3 mt-8">ERCOT Real-Time Market Pricing</h3>
                    <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl p-6 my-6">
                        <ul className="space-y-2 mb-0 list-disc pl-4">
                            <li><strong>Source:</strong> GridStatus.io API</li>
                            <li><strong>Coverage:</strong> 2010-2025 (15-minute RTM Settlement Point Prices)</li>
                            <li><strong>Hub Locations:</strong> HB_NORTH, HB_SOUTH, HB_WEST, HB_HOUSTON, HB_PAN</li>
                            <li><strong>Resolution:</strong> Aggregated to hourly averages for 8760-hour profiles</li>
                            <li><strong>Purpose:</strong> Calculate market value, settlement revenue, and basis risk</li>
                        </ul>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                        Historical ERCOT pricing captures real market dynamics including scarcity events, negative prices during
                        high renewable periods, and seasonal variations. This allows for realistic PPA settlement modeling.
                    </p>

                    <h3 className="text-xl font-semibold text-navy-950 dark:text-white mb-3 mt-8">Historical Weather Data</h3>
                    <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl p-6 my-6">
                        <ul className="space-y-2 mb-0 list-disc pl-4">
                            <li><strong>Source:</strong> Open-Meteo Historical Weather API (ERA5 reanalysis)</li>
                            <li><strong>Coverage:</strong> 2020-2025 actual weather years</li>
                            <li><strong>Variables:</strong> Solar irradiance (GHI, DHI, DNI), temperature, wind speed at hub height</li>
                            <li><strong>Resolution:</strong> Hourly data for specific GPS coordinates</li>
                            <li><strong>Purpose:</strong> Drive realistic solar and wind generation profiles</li>
                        </ul>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                        Using actual historical weather (not TMY) allows you to see how your portfolio would have performed during
                        specific years, including extreme weather events like Winter Storm Uri (Feb 2021).
                    </p>

                    <h3 className="text-xl font-semibold text-navy-950 dark:text-white mb-3 mt-8">Generation Models</h3>
                    <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl p-6 my-6">
                        <ul className="space-y-2 mb-0 list-disc pl-4">
                            <li><strong>Solar:</strong> NREL PVWatts-inspired model with irradiance, temperature derating, system losses</li>
                            <li><strong>Wind:</strong> Power curve methodology using hub-height wind speeds and regional capacity factors</li>
                            <li><strong>Geothermal:</strong> 95% capacity factor (constant baseload with maintenance downtime)</li>
                            <li><strong>Nuclear:</strong> 90% capacity factor (constant baseload with refueling outages)</li>
                            <li><strong>CCS Gas:</strong> Dispatchable with 95% carbon capture rate</li>
                        </ul>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Load Profile Modeling</h2>
                    <p className="mb-4">
                        Different facility types have dramatically different load patterns. Eighty760 includes four archetypal profiles:
                    </p>

                    <div className="bg-gray-100 dark:bg-navy-950/50 border border-emerald-500/20 dark:border-energy-green/20 rounded-xl p-6 my-8">
                        <h3 className="text-lg font-semibold text-emerald-700 dark:text-energy-green mb-3">Load Archetypes</h3>
                        <div className="space-y-4 text-sm">
                            <div>
                                <strong className="text-navy-950 dark:text-white">Data Center:</strong>
                                <span className="ml-2">Flat 24/7 load with ~95% capacity factor (maintenance downtime)</span>
                            </div>
                            <div>
                                <strong className="text-navy-950 dark:text-white">Manufacturing:</strong>
                                <span className="ml-2">Two-shift operation (6 AM - 10 PM), weekday heavy with reduced weekend load</span>
                            </div>
                            <div>
                                <strong className="text-navy-950 dark:text-white">Office:</strong>
                                <span className="ml-2">Business hours (8 AM - 6 PM), weekday only, strong HVAC seasonal variation</span>
                            </div>
                            <div>
                                <strong className="text-navy-950 dark:text-white">Flat:</strong>
                                <span className="ml-2">Perfectly uniform hourly load (useful for isolating generation patterns)</span>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Financial Calculations</h2>

                    <h3 className="text-xl font-semibold text-navy-950 dark:text-white mb-3 mt-8">PPA Settlement Value</h3>
                    <p className="mb-4">
                        For each renewable asset, hourly settlement is calculated as:
                    </p>
                    <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl p-6 my-6 font-mono text-sm">
                        Settlement = (Market Price - Strike Price) × Generation<br />
                        Total Cost = Strike Price × Generation<br />
                        Market Value = Market Price × Generation
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                        This captures <strong>basis risk</strong>—if your solar plant is in West Texas but your load is in Houston,
                        you&apos;re exposed to the price difference between HB_WEST and HB_HOUSTON.
                    </p>

                    <h3 className="text-xl font-semibold text-navy-950 dark:text-white mb-3 mt-8">REC Accounting</h3>
                    <p className="mb-4">
                        Renewable Energy Certificates are tracked separately from energy settlement:
                    </p>
                    <ul className="space-y-2 list-disc pl-4 mb-4">
                        <li><strong>REC Cost:</strong> Applied to grid purchases (deficit hours)</li>
                        <li><strong>REC Income:</strong> Generated from surplus renewable energy sold to grid</li>
                        <li><strong>Net REC Cost:</strong> Total REC expense minus REC sales revenue</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-navy-950 dark:text-white mb-3 mt-8">Battery CVTA (Capacity Value & Tolling Agreement)</h3>
                    <p className="mb-4">
                        Battery storage is modeled using a two-party tolling structure:
                    </p>
                    <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl p-6 my-6">
                        <p className="font-semibold mb-2">Owner (Asset Owner):</p>
                        <ul className="space-y-1 mb-4 list-disc pl-4 text-sm">
                            <li>Receives fixed monthly capacity payment ($/MW-month)</li>
                            <li>Receives VOM payment for energy throughput ($/MWh)</li>
                            <li>Penalized if actual RTE falls below guaranteed RTE</li>
                        </ul>
                        <p className="font-semibold mb-2">Buyer (Trading House):</p>
                        <ul className="space-y-1 mb-0 list-disc pl-4 text-sm">
                            <li>Pays fixed tolling fee and VOM charges</li>
                            <li>Captures arbitrage revenue from buy-low-sell-high operations</li>
                            <li>May receive ancillary services revenue (ERCOT frequency regulation, etc.)</li>
                        </ul>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Key Metrics Explained</h2>

                    <div className="space-y-6">
                        <div className="pl-4 border-l-4 border-emerald-500/30">
                            <h4 className="font-semibold text-navy-950 dark:text-white mb-2">CFE Score (Hourly Match %)</h4>
                            <p className="text-sm">
                                Percentage of load hours where carbon-free generation (including battery discharge) meets or exceeds demand.
                                This is the core metric for 24/7 carbon-free energy.
                            </p>
                        </div>
                        <div className="pl-4 border-l-4 border-emerald-500/30">
                            <h4 className="font-semibold text-navy-950 dark:text-white mb-2">Productivity (MWh/MW)</h4>
                            <p className="text-sm">
                                Total clean energy generated divided by total installed capacity. Measures portfolio efficiency and
                                indicates overbuilding level.
                            </p>
                        </div>
                        <div className="pl-4 border-l-4 border-emerald-500/30">
                            <h4 className="font-semibold text-navy-950 dark:text-white mb-2">LOGH (Loss of Green Hours)</h4>
                            <p className="text-sm">
                                Number of hours where load exceeds carbon-free generation. Inverse of CFE score, useful for reliability
                                analysis.
                            </p>
                        </div>
                        <div className="pl-4 border-l-4 border-emerald-500/30">
                            <h4 className="font-semibold text-navy-950 dark:text-white mb-2">Settlement Value</h4>
                            <p className="text-sm">
                                Net financial impact of PPA contracts: (Market Revenue - PPA Cost). Positive settlement means your
                                portfolio generated more market value than you paid for it.
                            </p>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Assumptions & Limitations</h2>
                    <p className="mb-4">
                        No model is perfect. Here are the key simplifications and assumptions to be aware of:
                    </p>
                    <ul className="space-y-2 list-disc pl-4">
                        <li><strong>Perfect foresight dispatch:</strong> Battery optimization assumes perfect price forecasting</li>
                        <li><strong>No transmission constraints:</strong> All generation is deliverable to load</li>
                        <li><strong>No curtailment modeling:</strong> Renewable assets always generate when available</li>
                        <li><strong>Static capacity factors:</strong> No degradation or performance improvement over time</li>
                        <li><strong>Annual analysis only:</strong> Multi-year contract terms and escalation not modeled</li>
                        <li><strong>No ancillary service co-optimization:</strong> Battery may earn more in actual markets</li>
                    </ul>

                    {/* Interactive CTA */}
                    <div className="bg-emerald-50 dark:bg-energy-green/10 border border-emerald-200 dark:border-energy-green/30 rounded-2xl p-8 my-12 shadow-sm dark:shadow-none">
                        <h3 className="text-2xl font-bold text-navy-950 dark:text-white mb-3">Explore the Data Yourself</h3>
                        <p className="mb-6 text-gray-700 dark:text-slate-300">
                            Every chart and table in Eighty760 is built from the methodology described above. Try the tools to
                            see hourly data in action.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/aggregation"
                                className="inline-block px-8 py-3 bg-energy-green text-navy-950 font-bold rounded-lg hover:bg-energy-green/90 transition text-center shadow-sm"
                            >
                                ERCOT Aggregation Tool →
                            </Link>
                            <Link
                                href="/analysis"
                                className="inline-block px-8 py-3 bg-white dark:bg-white/10 text-navy-950 dark:text-white font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-white/20 transition border border-gray-200 dark:border-white/20 text-center shadow-sm"
                            >
                                Portfolio Analysis
                            </Link>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Continuous Improvement</h2>
                    <p className="mb-4">
                        This methodology is continuously evolving. As new data sources become available, modeling techniques improve,
                        and industry standards develop, Eighty760 will be updated to reflect best practices.
                    </p>
                    <p>
                        Questions or suggestions? Reach out to discuss how we can make hourly carbon modeling more accurate and accessible.
                    </p>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-200 dark:border-white/10">
                    <h3 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Continue Learning</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Link href="/blog/solar-wind-storage-math" className="p-4 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-transparent hover:border-emerald-500 dark:hover:bg-white/10 transition shadow-sm dark:shadow-none group">
                            <p className="text-sm text-emerald-700 dark:text-energy-green mb-1 group-hover:underline">Next Article</p>
                            <p className="font-semibold text-navy-950 dark:text-white">Solar + Wind + Storage: The Math</p>
                        </Link>
                        <Link href="/blog/true-cost-ppa" className="p-4 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-transparent hover:border-emerald-500 dark:hover:bg-white/10 transition shadow-sm dark:shadow-none group">
                            <p className="text-sm text-gray-500 dark:text-slate-500 mb-1 group-hover:text-emerald-700 dark:group-hover:text-slate-300">Related</p>
                            <p className="font-semibold text-navy-950 dark:text-white">How to Calculate the True Cost of a PPA</p>
                        </Link>
                    </div>
                </div>
            </article>
        </main>
    );
}
