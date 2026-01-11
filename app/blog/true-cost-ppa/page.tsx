import Link from 'next/link';
import { Metadata } from 'next';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
    title: 'How to Calculate the True Cost of a PPA | Eighty760',
    description: 'Beyond the strike price: understanding basis risk, settlement value, and REC revenue in power purchase agreements.',
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
                            Financial
                        </span>
                        <span className="text-sm text-gray-500 dark:text-slate-500">12 min read • January 2025</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-navy-950 dark:text-white mb-6">
                        How to Calculate the True Cost of a PPA
                    </h1>
                    <p className="text-xl text-gray-700 dark:text-slate-300">
                        Beyond the strike price: understanding basis risk, settlement value, REC revenue, and the hidden costs
                        in renewable power purchase agreements.
                    </p>
                </header>

                <div className="prose prose-lg max-w-none text-gray-700 dark:text-slate-300 dark:prose-invert">
                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4">The Strike Price Illusion</h2>
                    <p className="mb-4">
                        When evaluating a solar or wind PPA, most people focus on a single number: the <strong>strike price</strong>
                        (e.g., $30/MWh). But the strike price is only one component of the total economic picture. The true cost
                        of a PPA depends on:
                    </p>
                    <ul className="space-y-2 list-disc pl-4 mb-4">
                        <li>Basis risk (locational price differences)</li>
                        <li>Settlement value (market revenue vs. PPA cost)</li>
                        <li>REC revenue or costs</li>
                        <li>Shape risk (when the asset generates vs. when you need power)</li>
                        <li>Contract structure (physical delivery vs. financial settlement)</li>
                    </ul>
                    <p className="mb-4">
                        Understanding these factors is essential for accurate financial modeling and procurement decisions.
                    </p>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">PPA Fundamentals: Physical vs. Financial</h2>

                    <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl p-6 my-8">
                        <h3 className="text-lg font-semibold text-navy-950 dark:text-white mb-3">Physical Delivery PPA</h3>
                        <p className="text-sm mb-2">
                            You receive actual electrons from the renewable asset. Common in regulated markets or when the asset
                            is behind-the-meter (on-site).
                        </p>
                        <p className="text-xs text-gray-600 dark:text-slate-400 mb-0">
                            <strong>Pricing:</strong> Pay the strike price for all energy delivered. Simple accounting but requires
                            load matching.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl p-6 my-8">
                        <h3 className="text-lg font-semibold text-navy-950 dark:text-white mb-3">Financial Settlement PPA (Virtual PPA / Contract for Differences)</h3>
                        <p className="text-sm mb-2">
                            No physical delivery. The PPA is a financial contract where you pay (or receive) the difference between
                            the market price and the strike price.
                        </p>
                        <p className="text-xs text-gray-600 dark:text-slate-400 mb-0">
                            <strong>Pricing:</strong> Hourly settlement = (Market Price - Strike Price) × Generation. You still buy
                            your actual load from the grid separately.
                        </p>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Understanding Basis Risk</h2>
                    <p className="mb-4">
                        <strong className="text-navy-950 dark:text-white">Basis risk</strong> is the exposure to price differences
                        between where your renewable asset generates and where your load is located.
                    </p>

                    <div className="bg-gray-100 dark:bg-navy-950/50 border border-emerald-500/20 dark:border-energy-green/20 rounded-xl p-6 my-8">
                        <h3 className="text-lg font-semibold text-emerald-700 dark:text-energy-green mb-3">ERCOT Example: West Texas Solar → Houston Load</h3>
                        <div className="text-sm space-y-2">
                            <div>
                                <strong>Hour 15 (3 PM, high solar generation):</strong>
                            </div>
                            <div className="pl-4 space-y-1">
                                <div>• HB_WEST price: $18/MWh (abundant solar depresses local prices)</div>
                                <div>• HB_HOUSTON price: $32/MWh (higher demand, transmission constraints)</div>
                                <div>• Basis spread: <span className="text-red-600 dark:text-red-400">-$14/MWh</span> (asset earns less than load pays)</div>
                            </div>
                            <div className="mt-3">
                                <strong>Hour 19 (7 PM, evening peak, no solar):</strong>
                            </div>
                            <div className="pl-4 space-y-1">
                                <div>• HB_WEST price: $75/MWh (gas generation)</div>
                                <div>• HB_HOUSTON price: $95/MWh (tight supply, high demand)</div>
                                <div>• Basis spread: <span className="text-red-600 dark:text-red-400">-$20/MWh</span> (but solar isn&apos;t generating)</div>
                            </div>
                        </div>
                        <p className="text-xs mt-4 text-gray-600 dark:text-slate-400 mb-0">
                            Your solar PPA settles at HB_WEST prices, but you buy your load at HB_HOUSTON prices. The basis spread
                            reduces the economic value of the PPA.
                        </p>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Settlement Value Calculation</h2>
                    <p className="mb-4">
                        For a financial PPA, the settlement value shows whether you&apos;re economically ahead or behind:
                    </p>

                    <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl p-6 my-8 font-mono text-sm">
                        <div className="mb-3">
                            <strong>Market Revenue:</strong> Σ (Market Price × Generation)
                        </div>
                        <div className="mb-3">
                            <strong>PPA Cost:</strong> Σ (Strike Price × Generation)
                        </div>
                        <div className="pt-3 border-t border-gray-200 dark:border-white/10">
                            <strong>Settlement Value:</strong> Market Revenue - PPA Cost
                        </div>
                    </div>

                    <h3 className="text-xl font-semibold text-navy-950 dark:text-white mb-3 mt-8">Worked Example</h3>
                    <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl p-6 my-8">
                        <p className="font-semibold mb-3">100 MW Wind Farm, $28/MWh Strike Price, 35% Capacity Factor</p>
                        <div className="text-sm space-y-2">
                            <div>• <strong>Annual Generation:</strong> 100 MW × 35% × 8760 hours = 306,600 MWh</div>
                            <div>• <strong>PPA Cost:</strong> 306,600 MWh × $28/MWh = <span className="text-red-600 dark:text-red-400">$8,584,800</span></div>
                            <div>• <strong>Average Market Price:</strong> $42/MWh (based on 2024 ERCOT HB_WEST average)</div>
                            <div>• <strong>Market Revenue:</strong> 306,600 MWh × $42/MWh = <span className="text-green-600 dark:text-green-400">$12,877,200</span></div>
                            <div className="pt-2 border-t border-gray-200 dark:border-white/10">
                                <strong>Settlement Value:</strong> $12,877,200 - $8,584,800 = <span className="text-green-600 dark:text-green-400">+$4,292,400</span>
                            </div>
                        </div>
                        <p className="text-xs mt-4 text-gray-600 dark:text-slate-400 mb-0">
                            Positive settlement means the PPA is economically favorable—the asset generated more market value than
                            you paid for it. This can offset grid purchases when wind isn&apos;t blowing.
                        </p>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Renewable Energy Certificates (RECs)</h2>
                    <p className="mb-4">
                        RECs represent the environmental attributes of renewable generation and are often bundled with PPAs.
                        Their treatment significantly affects total cost:
                    </p>

                    <div className="space-y-6">
                        <div className="pl-4 border-l-4 border-emerald-500/30">
                            <h4 className="font-semibold text-navy-950 dark:text-white mb-2">Bundled PPA (RECs Included)</h4>
                            <p className="text-sm">
                                RECs transfer to the buyer automatically. You can claim the renewable energy for carbon accounting.
                                Strike price is typically higher ($25-35/MWh) to reflect REC value.
                            </p>
                        </div>
                        <div className="pl-4 border-l-4 border-emerald-500/30">
                            <h4 className="font-semibold text-navy-950 dark:text-white mb-2">Unbundled PPA (RECs Retained)</h4>
                            <p className="text-sm">
                                Generator keeps RECs and sells them separately. Strike price is lower ($18-25/MWh), but you must
                                purchase RECs separately if you want to make renewable energy claims (~$2-5/MWh).
                            </p>
                        </div>
                    </div>

                    <h3 className="text-xl font-semibold text-navy-950 dark:text-white mb-3 mt-8">REC Economics in 24/7 CFE</h3>
                    <p className="mb-4">
                        For hourly carbon accounting, REC costs depend on your surplus/deficit profile:
                    </p>
                    <ul className="space-y-2 list-disc pl-4 mb-4">
                        <li><strong>Surplus hours:</strong> You generate RECs from excess renewable production (REC income)</li>
                        <li><strong>Deficit hours:</strong> You must buy RECs to cover grid purchases (REC expense)</li>
                        <li><strong>Net REC cost:</strong> Total expense minus income, typically $1-4/MWh of load</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Negative Price Exposure</h2>
                    <p className="mb-4">
                        In markets with high renewable penetration, prices can go negative during periods of excess generation
                        (e.g., sunny, windy spring afternoons in ERCOT):
                    </p>

                    <div className="bg-gray-100 dark:bg-navy-950/50 border border-red-500/20 dark:border-red-400/20 rounded-xl p-6 my-8">
                        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-3">Negative Price Scenario</h3>
                        <div className="text-sm space-y-2">
                            <div>• Market Price: <span className="text-red-600 dark:text-red-400">-$15/MWh</span> (oversupply, grid paying to offload power)</div>
                            <div>• Your Solar PPA Strike: $30/MWh</div>
                            <div>• Solar Generation: 80 MW</div>
                            <div className="pt-2 border-t border-gray-200 dark:border-white/10">
                                <strong>Hourly Settlement:</strong> (-$15 - $30) × 80 MW = <span className="text-red-600 dark:text-red-400">-$3,600</span>
                            </div>
                        </div>
                        <p className="text-xs mt-4 text-gray-600 dark:text-slate-400 mb-0">
                            You lose money on this hour because the asset is generating when the market doesn&apos;t want power.
                            2024 ERCOT saw ~50-100 hours of negative prices, mostly during high solar/wind periods.
                        </p>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Battery CVTA: A Different Model</h2>
                    <p className="mb-4">
                        Battery storage uses a different contract structure called a <strong>Capacity Value & Tolling Agreement (CVTA)</strong>:
                    </p>

                    <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl p-6 my-8">
                        <h3 className="text-lg font-semibold text-navy-950 dark:text-white mb-3">CVTA Structure</h3>
                        <div className="text-sm space-y-3">
                            <div>
                                <strong className="text-emerald-700 dark:text-energy-green">Owner Receives:</strong>
                                <div className="pl-4 mt-1 space-y-1">
                                    <div>• Fixed capacity payment (e.g., $8,000/MW-month)</div>
                                    <div>• Variable O&M (e.g., $3/MWh of throughput)</div>
                                    <div>• Performance penalties if RTE falls below guaranteed level</div>
                                </div>
                            </div>
                            <div>
                                <strong className="text-purple-700 dark:text-purple-400">Buyer (Operator) Receives:</strong>
                                <div className="pl-4 mt-1 space-y-1">
                                    <div>• Arbitrage revenue (buy low, sell high)</div>
                                    <div>• Ancillary service revenue (ERCOT frequency regulation)</div>
                                    <div>• Operational control to optimize dispatch</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Total Cost of Energy: The Complete Picture</h2>
                    <p className="mb-4">
                        To compare different PPA structures and portfolios, calculate the all-in cost per MWh of load:
                    </p>

                    <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl p-6 my-8 font-mono text-sm">
                        <div className="space-y-2">
                            <div><strong>Total Cost = </strong></div>
                            <div className="pl-4">+ PPA Costs (renewable strike prices × generation)</div>
                            <div className="pl-4">+ Grid Purchases (deficit hours at market price)</div>
                            <div className="pl-4">+ Net REC Cost (if applicable)</div>
                            <div className="pl-4">+ Battery Tolling Fees (if applicable)</div>
                            <div className="pl-4">- Surplus Sales Revenue (excess renewable at market price)</div>
                            <div className="pl-4">- Settlement Gains (if market revenue exceeds PPA cost)</div>
                            <div className="pt-2 border-t border-gray-200 dark:border-white/10">
                                <strong>Average Cost/MWh = Total Cost ÷ Total Load (MWh)</strong>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">Key Contract Terms to Negotiate</h2>
                    <p className="mb-4">
                        When structuring a PPA, these terms have major financial impact:
                    </p>

                    <ul className="space-y-2 list-disc pl-4">
                        <li><strong>Settlement Hub:</strong> Match your load location to minimize basis risk</li>
                        <li><strong>Term Length:</strong> Longer terms (15-20 years) get better pricing but lock in costs</li>
                        <li><strong>Escalation:</strong> Fixed vs. CPI-indexed strike prices</li>
                        <li><strong>Curtailment rights:</strong> Can you tell the asset to stop generating during negative prices?</li>
                        <li><strong>Capacity guarantees:</strong> P50 (50% probability) vs. P90 (90% probability) generation</li>
                        <li><strong>Early termination:</strong> Penalties for breaking the contract</li>
                    </ul>

                    {/* Interactive CTA */}
                    <div className="bg-emerald-50 dark:bg-energy-green/10 border border-emerald-200 dark:border-energy-green/30 rounded-2xl p-8 my-12 shadow-sm dark:shadow-none">
                        <h3 className="text-2xl font-bold text-navy-950 dark:text-white mb-3">Model Your PPA Economics</h3>
                        <p className="mb-6 text-gray-700 dark:text-slate-300">
                            Use Eighty760&apos;s tools to calculate settlement value, basis risk, and total cost for different
                            PPA structures using real ERCOT pricing data.
                        </p>
                        <Link
                            href="/aggregation"
                            className="inline-block px-8 py-3 bg-energy-green text-navy-950 font-bold rounded-lg hover:bg-energy-green/90 transition shadow-sm"
                        >
                            ERCOT Aggregation Tool →
                        </Link>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">The Bottom Line</h2>
                    <p className="mb-4">
                        The &quot;true cost&quot; of a PPA is rarely just the strike price. Depending on market conditions, location,
                        and contract structure, your effective cost per MWh can vary by ±30-50% from the headline number.
                    </p>
                    <p className="mb-4">
                        Organizations moving toward 24/7 CFE goals need sophisticated financial analysis that accounts for:
                    </p>
                    <ul className="space-y-2 list-disc pl-4">
                        <li>Hourly settlement dynamics, not just annual averages</li>
                        <li>Geographic basis risk between assets and load</li>
                        <li>Shape risk (when renewable generation occurs vs. when you need power)</li>
                        <li>REC accounting in surplus/deficit portfolios</li>
                        <li>Battery and storage contract economics</li>
                    </ul>
                    <p className="mt-4">
                        As the energy industry shifts toward hourly carbon accounting, transparent and accurate PPA cost modeling
                        becomes essential for informed procurement decisions.
                    </p>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-200 dark:border-white/10">
                    <h3 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Continue Learning</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Link href="/blog/methodology-explained" className="p-4 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-transparent hover:border-emerald-500 dark:hover:bg-white/10 transition shadow-sm dark:shadow-none group">
                            <p className="text-sm text-emerald-700 dark:text-energy-green mb-1 group-hover:underline">Deep Dive</p>
                            <p className="font-semibold text-navy-950 dark:text-white">The Eighty760 Methodology</p>
                        </Link>
                        <Link href="/blog/solar-wind-storage-math" className="p-4 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-transparent hover:border-emerald-500 dark:hover:bg-white/10 transition shadow-sm dark:shadow-none group">
                            <p className="text-sm text-gray-500 dark:text-slate-500 mb-1 group-hover:text-emerald-700 dark:group-hover:text-slate-300">Related</p>
                            <p className="font-semibold text-navy-950 dark:text-white">Solar + Wind + Storage: The Math</p>
                        </Link>
                    </div>
                </div>
            </article>
        </main>
    );
}
