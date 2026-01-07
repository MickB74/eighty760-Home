import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Complete Guide to 8760-Hour Energy Modeling | Eighty760',
    description: 'Learn everything about hourly energy analysis, why 8760 matters, and how to build your first carbon-free energy model.',
};

export default function Article() {
    return (
        <main className="min-h-screen bg-navy-950">
            <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <nav className="mb-8">
                    <Link href="/blog" className="text-energy-green hover:underline text-sm">
                        ← Back to Resources
                    </Link>
                </nav>

                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-xs font-semibold px-3 py-1 bg-energy-green/10 text-energy-green rounded-full">
                            Guide
                        </span>
                        <span className="text-sm text-slate-500">12 min read • January 2025</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        The Complete Guide to 8760-Hour Energy Modeling
                    </h1>
                    <p className="text-xl text-slate-300">
                        Everything you need to know about hourly energy analysis and why it's becoming the industry standard.
                    </p>
                </header>

                <div className="prose prose-invert prose-lg max-w-none">
                    <h2 className="text-2xl font-bold text-white mb-4">What is 8760?</h2>
                    <p className="text-slate-300 mb-4">
                        <strong className="text-energy-green">8,760 is the number of hours in a year.</strong> It represents the
                        shift from annual energy accounting to hour-by-hour precision—a revolutionary change in how we
                        understand and procure clean energy.
                    </p>

                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 my-8">
                        <p className="text-slate-300 text-sm">
                            365 days × 24 hours = <span className="text-energy-green font-bold">8,760 hours</span>
                        </p>
                        <p className="text-slate-400 text-xs mt-2">
                            (8,784 in leap years, but 8760 is the industry standard reference)
                        </p>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4 mt-12">Why Hourly Matters</h2>
                    <p className="text-slate-300 mb-6">
                        Energy grids operate in real-time, with generation and demand balanced every hour (and actually every few seconds).
                        Carbon intensity varies dramatically:
                    </p>

                    <div className="bg-navy-950/50 border border-energy-green/20 rounded-xl p-6 my-8">
                        <h3 className="text-lg font-semibold text-energy-green mb-3">Example: Texas Grid (ERCOT)</h3>
                        <ul className="text-slate-300 text-sm space-y-2 mb-0">
                            <li><strong>3 PM (peak solar):</strong> ~300 gCO₂/kWh (low, clean)</li>
                            <li><strong>7 PM (evening peak):</strong> ~500 gCO₂/kWh (high, gas-heavy)</li>
                            <li><strong>3 AM (overnight):</strong> ~450 gCO₂/kWh (coal/gas baseload)</li>
                        </ul>
                        <p className="text-slate-400 text-xs mt-4">
                            Annual averages mask these critical variations—hourly data reveals when you're truly carbon-free.
                        </p>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4 mt-12">Building Your First 8760 Model</h2>
                    <p className="text-slate-300 mb-4">
                        A complete hourly energy model requires three core datasets:
                    </p>

                    <h3 className="text-xl font-semibold text-white mb-3 mt-8">1. Load Profile (8,760 hourly values)</h3>
                    <p className="text-slate-300 mb-4">
                        Your energy consumption for every hour of the year. Sources:
                    </p>
                    <ul className="text-slate-300 space-y-2">
                        <li>Smart meter data from your utility</li>
                        <li>Building management system (BMS) hourly logs</li>
                        <li>Typical load profiles for your facility type</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-white mb-3 mt-8">2. Generation Profiles (8,760 hourly values per asset)</h3>
                    <p className="text-slate-300 mb-4">
                        Expected output from each clean energy source. Tools:
                    </p>
                    <ul className="text-slate-300 space-y-2">
                        <li><strong>NREL PVGIS:</strong> Solar generation modeling</li>
                        <li><strong>Wind Toolkit:</strong> Wind farm capacity factors</li>
                        <li><strong>Eighty760:</strong> Integrated solar/wind/storage/nuclear modeling</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-white mb-3 mt-8">3. Grid Carbon Intensity (8,760 hourly values)</h3>
                    <p className="text-slate-300 mb-4">
                        Emissions from marginal grid generation. Sources:
                    </p>
                    <ul className="text-slate-300 space-y-2">
                        <li>WattTime API (commercial, real-time)</li>
                        <li>Electricity Maps (historical data)</li>
                        <li>ISO/RTO emissions data (ERCOT, CAISO, PJM, etc.)</li>
                    </ul>

                    {/* Interactive CTA */}
                    <div className="bg-energy-green/10 border border-energy-green/30 rounded-2xl p-8 my-12">
                        <h3 className="text-2xl font-bold text-white mb-3">Build Your Model Now</h3>
                        <p className="text-slate-300 mb-6">
                            Skip the spreadsheet complexity. Use Eighty760's interactive tools to model your portfolio in minutes,
                            powered by real ERCOT pricing and NREL weather data.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/aggregation"
                                className="inline-block px-8 py-3 bg-energy-green text-navy-950 font-bold rounded-lg hover:bg-energy-green/90 transition text-center"
                            >
                                ERCOT Aggregation Tool →
                            </Link>
                            <Link
                                href="/"
                                className="inline-block px-8 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition border border-white/20 text-center"
                            >
                                Portfolio Simulator
                            </Link>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4 mt-12">Common Pitfalls to Avoid</h2>
                    <div className="space-y-6">
                        <div className="pl-4 border-l-2 border-energy-green/30">
                            <h4 className="font-semibold text-white mb-2">❌ Using TMY (Typical Meteorological Year) data for actuals</h4>
                            <p className="text-slate-300 text-sm">
                                TMY data models average weather—use actual weather year data for real scenarios.
                            </p>
                        </div>
                        <div className="pl-4 border-l-2 border-energy-green/30">
                            <h4 className="font-semibold text-white mb-2">❌ Ignoring curtailment and basis risk</h4>
                            <p className="text-slate-300 text-sm">
                                Renewable assets can generate when prices are negative—factor in real market dynamics.
                            </p>
                        </div>
                        <div className="pl-4 border-l-2 border-energy-green/30">
                            <h4 className="font-semibold text-white mb-2">❌ Assuming 100% matching is always the goal</h4>
                            <p className="text-slate-300 text-sm">
                                Overbuilding to hit 100% 24/7 CFE can be economically wasteful—target cost-effective ~80-95%.
                            </p>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4 mt-12">The Future is Hourly</h2>
                    <p className="text-slate-300 mb-4">
                        Major corporations, utilities, and policymakers are aligning around hourly carbon accounting:
                    </p>
                    <ul className="text-slate-300 space-y-2">
                        <li><strong>Google, Microsoft:</strong> 24/7 CFE goals by 2030</li>
                        <li><strong>UN Compact:</strong> 50+ signatories for 24/7 carbon-free electricity</li>
                        <li><strong>GHG Protocol:</strong> Developing hourly Scope 2 guidance</li>
                    </ul>
                    <p className="text-slate-300 mt-4">
                        8760-hour modeling is no longer optional—it's the new standard for credible net-zero strategies.
                    </p>
                </div>

                <div className="mt-16 pt-8 border-t border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Continue Learning</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Link href="/blog/solar-wind-storage-math" className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition">
                            <p className="text-sm text-energy-green mb-1">Next Article</p>
                            <p className="font-semibold text-white">Solar + Wind + Storage: The Math</p>
                        </Link>
                        <Link href="/blog/methodology-explained" className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition">
                            <p className="text-sm text-slate-500 mb-1">Deep Dive</p>
                            <p className="font-semibold text-white">The Eighty760 Methodology</p>
                        </Link>
                    </div>
                </div>
            </article>
        </main>
    );
}
