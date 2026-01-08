import Link from 'next/link';
import { Metadata } from 'next';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
    title: 'Why 100% Renewable ≠ 100% Clean | Eighty760',
    description: 'Understanding the critical difference between annual renewable energy certificates and true 24/7 carbon-free energy matching.',
};

export default function Article() {
    return (
        <main className="min-h-screen bg-gray-50 dark:bg-navy-950 transition-colors duration-300">
            <Navigation />
            <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 mt-16">
                {/* Breadcrumb */}
                <nav className="mb-8">
                    <Link href="/blog" className="text-emerald-700 dark:text-energy-green hover:underline text-sm font-medium">
                        ← Back to Resources
                    </Link>
                </nav>

                {/* Article Header */}
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-xs font-semibold px-3 py-1 bg-emerald-100 dark:bg-energy-green/10 text-emerald-800 dark:text-energy-green rounded-full">
                            Fundamentals
                        </span>
                        <span className="text-sm text-gray-500 dark:text-slate-500">8 min read • January 2025</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-navy-950 dark:text-white mb-6">
                        Why 100% Renewable ≠ 100% Clean
                    </h1>
                    <p className="text-xl text-gray-700 dark:text-slate-300">
                        The illusion of annual renewable energy certificates and why hourly matching matters for real carbon impact.
                    </p>
                </header>

                {/* Article Content */}
                <div className="prose prose-lg max-w-none text-gray-700 dark:text-slate-300 dark:prose-invert">
                    <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl p-8 mb-8 shadow-sm dark:shadow-none">
                        <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4">The Annual Matching Illusion</h2>
                        <p className="mb-4">
                            Many companies proudly claim "100% renewable energy" by purchasing Renewable Energy Certificates (RECs)
                            that match their annual consumption. But here&apos;s the problem: <strong className="text-emerald-700 dark:text-energy-green">the grid doesn&apos;t work on an annual basis.</strong>
                        </p>
                        <p>
                            When your data center is running at 3 AM and the sun isn&apos;t shining, those solar RECs you bought
                            don&apos;t power your servers—coal and gas do. Annual matching creates an accounting fiction that masks real carbon emissions.
                        </p>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">The Hourly Reality</h2>
                    <p className="mb-4">
                        Carbon intensity varies dramatically hour by hour. A truly carbon-free energy strategy must match
                        clean generation to load in real-time, across all 8,760 hours of the year.
                    </p>

                    <div className="bg-gray-100 dark:bg-navy-950/50 border border-emerald-500/20 dark:border-energy-green/20 rounded-xl p-6 my-8">
                        <h3 className="text-lg font-semibold text-emerald-700 dark:text-energy-green mb-3">Key Insight</h3>
                        <p className="text-sm mb-0 text-gray-700 dark:text-slate-300">
                            Google&apos;s 2020 study found that while they achieved 67% annual renewable matching,
                            their true hourly carbon-free energy was only <strong>61%</strong>—a 6 percentage point gap that represents
                            millions of tons of uncounted emissions.
                        </p>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">What 24/7 CFE Means</h2>
                    <p className="mb-4">
                        24/7 Carbon-Free Energy (CFE) means matching clean generation to load <em>every single hour</em>.
                        This requires a fundamentally different approach to energy procurement:
                    </p>
                    <ul className="space-y-2 mb-8 list-disc pl-4">
                        <li>Diversified generation: Solar for day, wind for night, nuclear/geothermal for baseload</li>
                        <li>Energy storage: Batteries to shift renewable generation across hours</li>
                        <li>Geographic diversity: Portfolio spread across regions to reduce weather correlation</li>
                        <li>Transparent accounting: Hourly matching data, not annual aggregates</li>
                    </ul>

                    {/* CTA to Simulator */}
                    <div className="bg-emerald-50 dark:bg-energy-green/10 border border-emerald-200 dark:border-energy-green/30 rounded-2xl p-8 my-12 shadow-sm dark:shadow-none">
                        <h3 className="text-2xl font-bold text-navy-950 dark:text-white mb-3">See the Difference Yourself</h3>
                        <p className="mb-6 text-gray-700 dark:text-slate-300">
                            Use our interactive simulator to model solar, wind, and storage portfolios.
                            See how hourly matching reveals the real carbon story.
                        </p>
                        <Link
                            href="/aggregation"
                            className="inline-block px-8 py-3 bg-energy-green text-navy-950 font-bold rounded-lg hover:bg-energy-green/90 transition shadow-sm"
                        >
                            Try the ERCOT Aggregation Tool →
                        </Link>
                    </div>

                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4 mt-12">The Path Forward</h2>
                    <p className="mb-4">
                        The shift from annual to hourly carbon accounting is already underway. Google, Microsoft, and other
                        tech leaders have committed to 24/7 CFE by 2030. The UN&apos;s 24/7 Carbon-free Energy Compact now has
                        over 50 signatories.
                    </p>
                    <p>
                        <strong className="text-navy-950 dark:text-white">The question is not whether hourly matching will become standard—it&apos;s whether
                            you&apos;ll be ahead of the curve or scrambling to catch up.</strong>
                    </p>
                </div>

                {/* Related Articles */}
                <div className="mt-16 pt-8 border-t border-gray-200 dark:border-white/10">
                    <h3 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Continue Learning</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Link href="/blog/guide-8760-modeling" className="p-4 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-transparent hover:border-emerald-500 dark:hover:bg-white/10 transition shadow-sm dark:shadow-none group">
                            <p className="text-sm text-emerald-700 dark:text-energy-green mb-1 group-hover:underline">Next Article</p>
                            <p className="font-semibold text-navy-950 dark:text-white">The Complete Guide to 8760-Hour Modeling</p>
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
