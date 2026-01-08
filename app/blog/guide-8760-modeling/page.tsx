import Link from 'next/link';
import { Metadata } from 'next';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
    title: 'Complete Guide to 8760-Hour Energy Modeling | Eighty760',
    description: 'Learn everything about hourly energy analysis, why 8760 matters, and how to build your first carbon-free energy model.',
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
                            Guide
                        </span>
                        <span className="text-sm text-gray-500 dark:text-slate-500">12 min read • January 2025</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-navy-950 dark:text-white mb-6">
                        The Complete Guide to 8760-Hour Energy Modeling
                    </h1>
                    <p className="text-xl text-gray-700 dark:text-slate-300">
                        Everything you need to know about hourly energy analysis and why it&apos;s becoming the industry standard.
                    </p>
                </header>

                <div className="prose prose-lg max-w-none text-gray-700 dark:text-slate-300 dark:prose-invert">
                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4">What is 8760?</h2>
                    <p className="mb-4">
                        <strong className="text-emerald-700 dark:text-energy-green">8,760 is the number of hours in a year.</strong> It represents the
                        shift from annual energy accounting to hour-by-hour precision—a revolutionary change in how we
                        understand and procure clean energy.
                    </p>

                    <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl p-6 my-8 shadow-sm dark:shadow-none">
                        <p className="text-sm font-medium">
                            365 days × 24 hours = <span className="text-emerald-700 dark:text-energy-green font-bold">8,760 hours</span>
                        </p>
                        <p className="text-xs mt-2 text-gray-500 dark:text-slate-400">
                            (8,784 in leap years, but 8760 is the industry standard reference)
                        </p>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Why Hourly Matters</h2>
                    <p className="mb-6">
                        Energy grids operate in real-time, with generation and demand balanced every hour (and actually every few seconds).
                        Carbon intensity varies dramatically:
                    </p>

                    <div className="bg-gray-100 dark:bg-navy-950/50 border border-emerald-500/20 dark:border-energy-green/20 rounded-xl p-6 my-8">
                        <h3 className="text-lg font-semibold text-emerald-700 dark:text-energy-green mb-3">Example: Texas Grid (ERCOT)</h3>
                        <ul className="text-sm space-y-2 mb-0 list-disc pl-4">
                            <li><strong>3 PM (peak solar):</strong> ~300 gCO₂/kWh (low, clean)</li>
                            <li><strong>7 PM (evening peak):</strong> ~500 gCO₂/kWh (high, gas-heavy)</li>
                            <li><strong>3 AM (overnight):</strong> ~450 gCO₂/kWh (coal/gas baseload)</li>
                        </ul>
                        <p className="text-xs mt-4 text-gray-500 dark:text-slate-400">
                            Annual averages mask these critical variations—hourly data reveals when you&apos;re truly carbon-free.
                        </p>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Building Your First 8760 Model</h2>
                    <p className="mb-4">
                        A complete hourly energy model requires three core datasets:
                    </p>

                    <h3 className="text-xl font-semibold text-navy-950 dark:text-white mb-3 mt-8">1. Load Profile (8,760 hourly values)</h3>
                    <p className="mb-4">
                        Your energy consumption for every hour of the year. Sources:
                    </p>
                    <ul className="space-y-2 list-disc pl-4">
                        <li>Smart meter data from your utility</li>
                        <li>Building management system (BMS) hourly logs</li>
                        <li>Typical load profiles for your facility type</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-navy-950 dark:text-white mb-3 mt-8">2. Generation Profiles (8,760 hourly values per asset)</h3>
                    <p className="mb-4">
                        Expected output from each clean energy source. Tools:
                    </p>
                    <ul className="space-y-2 list-disc pl-4">
                        <li><strong>NREL PVGIS:</strong> Solar generation modeling</li>
                        <li><strong>Wind Toolkit:</strong> Wind farm capacity factors</li>
                        <li><strong>Eighty760:</strong> Integrated solar/wind/storage/nuclear modeling</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-navy-950 dark:text-white mb-3 mt-8">3. Grid Carbon Intensity (8,760 hourly values)</h3>
                    <p className="mb-4">
                        Emissions from marginal grid generation. Sources:
                    </p>
                    <ul className="space-y-2 list-disc pl-4">
                        <li>WattTime API (commercial, real-time)</li>
                        <li>Electricity Maps (historical data)</li>
                        <li>ISO/RTO emissions data (ERCOT, CAISO, PJM, etc.)</li>
                    </ul>

                    {/* Interactive CTA */}
                    <div className="bg-emerald-50 dark:bg-energy-green/10 border border-emerald-200 dark:border-energy-green/30 rounded-2xl p-8 my-12 shadow-sm dark:shadow-none">
                        <h3 className="text-2xl font-bold text-navy-950 dark:text-white mb-3">Build Your Model Now</h3>
                        <p className="mb-6 text-gray-700 dark:text-slate-300">
                            Skip the spreadsheet complexity. Use Eighty760&apos;s interactive tools to model your portfolio in minutes,
                            powered by real ERCOT pricing and NREL weather data.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/aggregation"
                                className="inline-block px-8 py-3 bg-energy-green text-navy-950 font-bold rounded-lg hover:bg-energy-green/90 transition text-center shadow-sm"
                            >
                                ERCOT Aggregation Tool →
                            </Link>
                            <Link
                                href="/"
                                className="inline-block px-8 py-3 bg-white dark:bg-white/10 text-navy-950 dark:text-white font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-white/20 transition border border-gray-200 dark:border-white/20 text-center shadow-sm"
                            >
                                Portfolio Simulator
                            </Link>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Common Pitfalls to Avoid</h2>
                    <div className="space-y-6">
                        <div className="pl-4 border-l-4 border-emerald-500/30">
                            <h4 className="font-semibold text-navy-950 dark:text-white mb-2">❌ Using TMY (Typical Meteorological Year) data for actuals</h4>
                            <p className="text-sm">
                                TMY data models average weather—use actual weather year data for real scenarios.
                            </p>
                        </div>
                        <div className="pl-4 border-l-4 border-emerald-500/30">
                            <h4 className="font-semibold text-navy-950 dark:text-white mb-2">❌ Ignoring curtailment and basis risk</h4>
                            <p className="text-sm">
                                Renewable assets can generate when prices are negative—factor in real market dynamics.
                            </p>
                        </div>
                        <div className="pl-4 border-l-4 border-emerald-500/30">
                            <h4 className="font-semibold text-navy-950 dark:text-white mb-2">❌ Assuming 100% matching is always the goal</h4>
                            <p className="text-sm">
                                Overbuilding to hit 100% 24/7 CFE can be economically wasteful—target cost-effective ~80-95%.
                            </p>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">The Future is Hourly</h2>
                    <p className="mb-4">
                        Major corporations, utilities, and policymakers are aligning around hourly carbon accounting:
                    </p>
                    <ul className="space-y-2 list-disc pl-4">
                        <li><strong>Google, Microsoft:</strong> 24/7 CFE goals by 2030</li>
                        <li><strong>UN Compact:</strong> 50+ signatories for 24/7 carbon-free electricity</li>
                        <li><strong>GHG Protocol:</strong> Developing hourly Scope 2 guidance</li>
                    </ul>
                    <p className="mt-4">
                        8760-hour modeling is no longer optional—it&apos;s the new standard for credible net-zero strategies.
                    </p>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-200 dark:border-white/10">
                    <h3 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Continue Learning</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Link href="/blog/solar-wind-storage-math" className="p-4 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-transparent hover:border-emerald-500 dark:hover:bg-white/10 transition shadow-sm dark:shadow-none group">
                            <p className="text-sm text-emerald-700 dark:text-energy-green mb-1 group-hover:underline">Next Article</p>
                            <p className="font-semibold text-navy-950 dark:text-white">Solar + Wind + Storage: The Math</p>
                        </Link>
                        <Link href="/blog/methodology-explained" className="p-4 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-transparent hover:border-emerald-500 dark:hover:bg-white/10 transition shadow-sm dark:shadow-none group">
                            <p className="text-sm text-gray-500 dark:text-slate-500 mb-1 group-hover:text-emerald-700 dark:group-hover:text-slate-300">Deep Dive</p>
                            <p className="font-semibold text-navy-950 dark:text-white">The Eighty760 Methodology</p>
                        </Link>
                    </div>
                </div>
            </article>
        </main>
    );
}
