import Link from 'next/link';
import { Metadata } from 'next';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
    title: 'Solar + Wind + Storage: The Math Behind 24/7 CFE | Eighty760',
    description: 'How complementary generation sources and battery storage create balanced 24/7 carbon-free energy portfolios.',
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
                        <span className="text-sm text-gray-500 dark:text-slate-500">15 min read • January 2025</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-navy-950 dark:text-white mb-6">
                        Solar + Wind + Storage: The Math Behind a Balanced Portfolio
                    </h1>
                    <p className="text-xl text-gray-700 dark:text-slate-300">
                        Understanding how complementary generation patterns and energy storage work together to achieve high hourly matching rates.
                    </p>
                </header>

                <div className="prose prose-lg max-w-none text-gray-700 dark:text-slate-300 dark:prose-invert">
                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4">The Complementarity Principle</h2>
                    <p className="mb-4">
                        No single renewable technology can provide 24/7 carbon-free energy on its own. Solar only works during
                        daylight hours. Wind is intermittent and unpredictable. The key to high CFE scores is combining resources
                        with <strong className="text-navy-950 dark:text-white">complementary generation patterns</strong>.
                    </p>

                    <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl p-6 my-8 shadow-sm dark:shadow-none">
                        <h3 className="text-lg font-semibold text-emerald-700 dark:text-energy-green mb-3">Texas Generation Patterns (Annual Average)</h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <strong className="text-navy-950 dark:text-white">Solar:</strong>
                                <span className="ml-2">Peak at 1-3 PM (70-90% capacity), zero overnight</span>
                            </div>
                            <div>
                                <strong className="text-navy-950 dark:text-white">Wind:</strong>
                                <span className="ml-2">Often stronger at night and early morning (30-50% capacity), variable during day</span>
                            </div>
                            <div>
                                <strong className="text-navy-950 dark:text-white">Combined:</strong>
                                <span className="ml-2">When solar fades (6-10 PM), wind often picks up—but not always</span>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">The Duck Curve Problem</h2>
                    <p className="mb-4">
                        High solar penetration creates the infamous &quot;duck curve&quot;—a steep evening ramp when the sun sets
                        but electricity demand remains high. This is the hardest period for renewable portfolios to serve:
                    </p>

                    <div className="bg-gray-100 dark:bg-navy-950/50 border border-emerald-500/20 dark:border-energy-green/20 rounded-xl p-6 my-8">
                        <h3 className="text-lg font-semibold text-emerald-700 dark:text-energy-green mb-3">Evening Ramp Challenge (5-9 PM)</h3>
                        <ul className="text-sm space-y-2 mb-0 list-disc pl-4">
                            <li><strong>Solar drops sharply:</strong> From 80% capacity at 5 PM to 0% by 8 PM</li>
                            <li><strong>Demand stays high:</strong> People arrive home, cook dinner, run HVAC</li>
                            <li><strong>Wind is variable:</strong> May or may not be blowing strong during this period</li>
                            <li><strong>Grid carbon peaks:</strong> Gas plants ramp up to fill the gap</li>
                        </ul>
                    </div>
                    <p className="mb-4">
                        This is where battery storage becomes critical—not for generating new energy, but for time-shifting
                        solar generation from midday (when it&apos;s abundant) to evening (when it&apos;s scarce).
                    </p>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Battery Storage: Energy Shifting, Not Expansion</h2>
                    <p className="mb-4">
                        It&apos;s critical to understand what batteries can and cannot do:
                    </p>

                    <div className="space-y-6">
                        <div className="pl-4 border-l-4 border-green-500/50">
                            <h4 className="font-semibold text-navy-950 dark:text-white mb-2">✅ What Batteries DO</h4>
                            <ul className="text-sm space-y-1 list-disc pl-4">
                                <li>Store excess renewable energy during high-generation hours</li>
                                <li>Discharge stored energy during low-generation hours</li>
                                <li>Smooth out renewable intermittency across adjacent hours</li>
                                <li>Improve hourly matching by reallocating when energy is used</li>
                            </ul>
                        </div>
                        <div className="pl-4 border-l-4 border-red-500/50">
                            <h4 className="font-semibold text-navy-950 dark:text-white mb-2">❌ What Batteries DON&apos;T DO</h4>
                            <ul className="text-sm space-y-1 list-disc pl-4">
                                <li>Create new clean energy (they lose 10-15% to round-trip inefficiency)</li>
                                <li>Store energy for weeks or months (4-8 hour duration is typical)</li>
                                <li>Replace the need for sufficient renewable capacity</li>
                                <li>Solve multi-day wind/solar droughts (you still need overbuilding)</li>
                            </ul>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Portfolio Sizing: A Worked Example</h2>
                    <p className="mb-4">
                        Let&apos;s walk through a realistic portfolio design for a 100 MW average load (876,000 MWh/year).
                    </p>

                    <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl p-6 my-8">
                        <h3 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Scenario: Data Center in Houston</h3>

                        <h4 className="font-semibold text-emerald-700 dark:text-energy-green mt-4 mb-2">Step 1: Estimate Capacity Factors</h4>
                        <div className="text-sm space-y-1 mb-4">
                            <div>• Solar (Houston): ~25% annual capacity factor</div>
                            <div>• Wind (West Texas): ~35% annual capacity factor</div>
                            <div>• Battery: 85% round-trip efficiency, ~1.5 cycles/day</div>
                        </div>

                        <h4 className="font-semibold text-emerald-700 dark:text-energy-green mt-4 mb-2">Step 2: Size for Target CFE Score (~90%)</h4>
                        <div className="text-sm space-y-1 mb-4">
                            <div>• <strong>Solar:</strong> 200 MW × 25% CF × 8760 hours = 438,000 MWh/year</div>
                            <div>• <strong>Wind:</strong> 150 MW × 35% CF × 8760 hours = 459,450 MWh/year</div>
                            <div>• <strong>Total Generation:</strong> 897,450 MWh (102% of load—slight overbuilding)</div>
                        </div>

                        <h4 className="font-semibold text-emerald-700 dark:text-energy-green mt-4 mb-2">Step 3: Add Battery for Time-Shifting</h4>
                        <div className="text-sm space-y-1 mb-0">
                            <div>• <strong>Capacity:</strong> 100 MW (1:1 ratio with average load)</div>
                            <div>• <strong>Duration:</strong> 4 hours (400 MWh storage capacity)</div>
                            <div>• <strong>Purpose:</strong> Shift midday solar surplus to evening peak</div>
                        </div>
                    </div>

                    <h3 className="text-xl font-semibold text-navy-950 dark:text-white mb-3 mt-8">Expected Outcomes</h3>
                    <p className="mb-4">
                        With this portfolio design, typical results would be:
                    </p>
                    <ul className="space-y-2 list-disc pl-4 mb-4">
                        <li><strong>CFE Score:</strong> ~88-92% (depending on weather year)</li>
                        <li><strong>Productivity:</strong> ~2,560 MWh/MW (moderate overbuilding)</li>
                        <li><strong>Grid Deficit:</strong> ~70,000-105,000 MWh/year (~8-12% of load)</li>
                        <li><strong>Surplus:</strong> ~90,000-130,000 MWh/year (~10-15% of generation)</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">The CFE-Cost Trade-Off</h2>
                    <p className="mb-4">
                        Chasing 100% CFE requires exponentially increasing capacity—and cost. Here&apos;s why:
                    </p>

                    <div className="bg-gray-100 dark:bg-navy-950/50 border border-emerald-500/20 dark:border-energy-green/20 rounded-xl p-6 my-8">
                        <h3 className="text-lg font-semibold text-emerald-700 dark:text-energy-green mb-3">Diminishing Returns</h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <strong>80% CFE:</strong> May only need 1.0× annual generation (minimal overbuilding)
                            </div>
                            <div>
                                <strong>90% CFE:</strong> Typically requires 1.1-1.2× annual generation
                            </div>
                            <div>
                                <strong>95% CFE:</strong> Often needs 1.3-1.5× annual generation
                            </div>
                            <div>
                                <strong>99% CFE:</strong> Can require 1.8-2.5× or more (massive surplus to cover rare low-wind/cloudy days)
                            </div>
                        </div>
                        <p className="text-xs mt-4 text-gray-600 dark:text-slate-400 mb-0">
                            Each additional percentage point of CFE becomes progressively more expensive as you&apos;re building capacity
                            that only serves a handful of difficult hours per year.
                        </p>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Geographic Diversity</h2>
                    <p className="mb-4">
                        Spreading assets across different locations reduces weather correlation and improves reliability:
                    </p>

                    <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl p-6 my-8">
                        <h3 className="text-lg font-semibold text-navy-950 dark:text-white mb-3">ERCOT Hub Considerations</h3>
                        <ul className="space-y-2 mb-0 list-disc pl-4 text-sm">
                            <li><strong>West Texas (HB_WEST):</strong> Excellent wind resource, strong solar, but price volatility</li>
                            <li><strong>South Texas (HB_SOUTH):</strong> Strong solar, moderate wind, close to load centers</li>
                            <li><strong>Panhandle (HB_PAN):</strong> Best wind in ERCOT, lower solar, transmission constraints</li>
                            <li><strong>Houston (HB_HOUSTON):</strong> High load (good for basis risk), lower renewable resources</li>
                        </ul>
                    </div>
                    <p className="mb-4">
                        Diversifying across hubs means when West Texas wind lulls, Panhandle wind may still be blowing. When South Texas
                        clouds reduce solar, North Texas may be sunny. This geographic spread improves CFE scores by 3-7 percentage points
                        compared to single-location portfolios.
                    </p>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Baseload Technologies</h2>
                    <p className="mb-4">
                        For organizations targeting very high CFE scores (95%+), adding constant baseload generation can be more
                        cost-effective than massive solar/wind/battery overbuilding:
                    </p>

                    <div className="space-y-4">
                        <div className="pl-4 border-l-4 border-emerald-500/30">
                            <h4 className="font-semibold text-navy-950 dark:text-white mb-2">Geothermal (~95% CF)</h4>
                            <p className="text-sm">
                                Constant generation 24/7, no weather dependency. High upfront cost but exceptional reliability.
                                Geographically limited to areas with suitable subsurface conditions.
                            </p>
                        </div>
                        <div className="pl-4 border-l-4 border-emerald-500/30">
                            <h4 className="font-semibold text-navy-950 dark:text-white mb-2">Nuclear (~90% CF)</h4>
                            <p className="text-sm">
                                Reliable baseload with refueling outages every 18-24 months. Large minimum project size
                                (often 300+ MW) makes direct procurement challenging for smaller loads.
                            </p>
                        </div>
                        <div className="pl-4 border-l-4 border-emerald-500/30">
                            <h4 className="font-semibold text-navy-950 dark:text-white mb-2">Biomass/Biogas (~85% CF)</h4>
                            <p className="text-sm">
                                Dispatchable and renewable, but carbon accounting depends on feedstock sourcing and lifecycle analysis.
                            </p>
                        </div>
                    </div>

                    {/* Interactive CTA */}
                    <div className="bg-emerald-50 dark:bg-energy-green/10 border border-emerald-200 dark:border-energy-green/30 rounded-2xl p-8 my-12 shadow-sm dark:shadow-none">
                        <h3 className="text-2xl font-bold text-navy-950 dark:text-white mb-3">Model Your Own Portfolio</h3>
                        <p className="mb-6 text-gray-700 dark:text-slate-300">
                            Experiment with different combinations of solar, wind, and storage to see how CFE scores and costs change.
                            Use real ERCOT pricing and weather data to test your portfolio design.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/aggregation"
                                className="inline-block px-8 py-3 bg-energy-green text-navy-950 font-bold rounded-lg hover:bg-energy-green/90 transition text-center shadow-sm"
                            >
                                Try the Aggregation Tool →
                            </Link>
                            <Link
                                href="/"
                                className="inline-block px-8 py-3 bg-white dark:bg-white/10 text-navy-950 dark:text-white font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-white/20 transition border border-gray-200 dark:border-white/20 text-center shadow-sm"
                            >
                                Portfolio Simulator
                            </Link>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Key Takeaways</h2>
                    <ul className="space-y-2 list-disc pl-4">
                        <li>Solar and wind have complementary patterns—combine them for better hourly matching</li>
                        <li>Batteries shift energy across hours but don&apos;t create new supply</li>
                        <li>Target ~90% CFE for cost-effective portfolios; 95%+ requires significant overbuilding</li>
                        <li>Geographic diversity improves reliability and reduces weather correlation</li>
                        <li>Baseload technologies (geothermal, nuclear) can be more efficient than extreme overbuilding</li>
                        <li>Every portfolio is unique—model your specific load profile and location</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Where the Industry is Heading</h2>
                    <p className="mb-4">
                        As more organizations pursue hourly carbon accounting, portfolio design is evolving:
                    </p>
                    <ul className="space-y-2 list-disc pl-4">
                        <li>Long-duration storage (8-24+ hours) to handle multi-day weather events</li>
                        <li>Advanced firming contracts that guarantee CFE scores rather than capacity</li>
                        <li>Portfolio aggregation across multiple buyers to improve diversity and reduce costs</li>
                        <li>Hybrid PPA structures that combine solar, wind, and storage in single contracts</li>
                    </ul>
                    <p className="mt-4">
                        The math behind balanced portfolios is constantly improving as technologies mature, costs decline,
                        and modeling tools become more sophisticated.
                    </p>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-200 dark:border-white/10">
                    <h3 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Continue Learning</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Link href="/blog/true-cost-ppa" className="p-4 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-transparent hover:border-emerald-500 dark:hover:bg-white/10 transition shadow-sm dark:shadow-none group">
                            <p className="text-sm text-emerald-700 dark:text-energy-green mb-1 group-hover:underline">Next Article</p>
                            <p className="font-semibold text-navy-950 dark:text-white">How to Calculate the True Cost of a PPA</p>
                        </Link>
                        <Link href="/blog/methodology-explained" className="p-4 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-transparent hover:border-emerald-500 dark:hover:bg-white/10 transition shadow-sm dark:shadow-none group">
                            <p className="text-sm text-gray-500 dark:text-slate-500 mb-1 group-hover:text-emerald-700 dark:group-hover:text-slate-300">Technical Deep Dive</p>
                            <p className="font-semibold text-navy-950 dark:text-white">The Eighty760 Methodology</p>
                        </Link>
                    </div>
                </div>
            </article>
        </main>
    );
}
