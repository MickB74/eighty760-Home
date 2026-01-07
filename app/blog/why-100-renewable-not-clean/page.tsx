import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Why 100% Renewable ≠ 100% Clean | Eighty760',
    description: 'Understanding the critical difference between annual renewable energy certificates and true 24/7 carbon-free energy matching.',
};

export default function Article() {
    return (
        <main className="min-h-screen bg-navy-950">
            <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                {/* Breadcrumb */}
                <nav className="mb-8">
                    <Link href="/blog" className="text-energy-green hover:underline text-sm">
                        ← Back to Resources
                    </Link>
                </nav>

                {/* Article Header */}
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-xs font-semibold px-3 py-1 bg-energy-green/10 text-energy-green rounded-full">
                            Fundamentals
                        </span>
                        <span className="text-sm text-slate-500">8 min read • January 2025</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Why 100% Renewable ≠ 100% Clean
                    </h1>
                    <p className="text-xl text-slate-300">
                        The illusion of annual renewable energy certificates and why hourly matching matters for real carbon impact.
                    </p>
                </header>

                {/* Article Content */}
                <div className="prose prose-invert prose-lg max-w-none">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">The Annual Matching Illusion</h2>
                        <p className="text-slate-300 mb-4">
                            Many companies proudly claim "100% renewable energy" by purchasing Renewable Energy Certificates (RECs)
                            that match their annual consumption. But here's the problem: <strong className="text-energy-green">the grid doesn't work on an annual basis.</strong>
                        </p>
                        <p className="text-slate-300">
                            When your data center is running at 3 AM and the sun isn't shining, those solar RECs you bought
                            don't power your servers—coal and gas do. Annual matching creates an accounting fiction that masks real carbon emissions.
                        </p>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4 mt-12">The Hourly Reality</h2>
                    <p className="text-slate-300 mb-4">
                        Carbon intensity varies dramatically hour by hour. A truly carbon-free energy strategy must match
                        clean generation to load in real-time, across all 8,760 hours of the year.
                    </p>

                    <div className="bg-navy-950/50 border border-energy-green/20 rounded-xl p-6 my-8">
                        <h3 className="text-lg font-semibold text-energy-green mb-3">Key Insight</h3>
                        <p className="text-slate-300 text-sm mb-0">
                            Google's 2020 study found that while they achieved 67% annual renewable matching,
                            their true hourly carbon-free energy was only <strong>61%</strong>—a 6 percentage point gap that represents
                            millions of tons of uncounted emissions.
                        </p>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4 mt-12">What 24/7 CFE Means</h2>
                    <p className="text-slate-300 mb-4">
                        24/7 Carbon-Free Energy (CFE) means matching clean generation to load <em>every single hour</em>.
                        This requires a fundamentally different approach to energy procurement:
                    </p>
                    <ul className="text-slate-300 space-y-2 mb-8">
                        <li>Diversified generation: Solar for day, wind for night, nuclear/geothermal for baseload</li>
                        <li>Energy storage: Batteries to shift renewable generation across hours</li>
                        <li>Geographic diversity: Portfolio spread across regions to reduce weather correlation</li>
                        <li>Transparent accounting: Hourly matching data, not annual aggregates</li>
                    </ul>

                    {/* CTA to Simulator */}
                    <div className="bg-energy-green/10 border border-energy-green/30 rounded-2xl p-8 my-12">
                        <h3 className="text-2xl font-bold text-white mb-3">See the Difference Yourself</h3>
                        <p className="text-slate-300 mb-6">
                            Use our interactive simulator to model solar, wind, and storage portfolios.
                            See how hourly matching reveals the real carbon story.
                        </p>
                        <Link
                            href="/aggregation"
                            className="inline-block px-8 py-3 bg-energy-green text-navy-950 font-bold rounded-lg hover:bg-energy-green/90 transition"
                        >
                            Try the ERCOT Aggregation Tool →
                        </Link>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4 mt-12">The Path Forward</h2>
                    <p className="text-slate-300 mb-4">
                        The shift from annual to hourly carbon accounting is already underway. Google, Microsoft, and other
                        tech leaders have committed to 24/7 CFE by 2030. The UN's 24/7 Carbon-free Energy Compact now has
                        over 50 signatories.
                    </p>
                    <p className="text-slate-300">
                        <strong className="text-white">The question is not whether hourly matching will become standard—it's whether
                            you'll be ahead of the curve or scrambling to catch up.</strong>
                    </p>
                </div>

                {/* Related Articles */}
                <div className="mt-16 pt-8 border-t border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Continue Learning</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Link href="/blog/guide-8760-modeling" className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition">
                            <p className="text-sm text-energy-green mb-1">Next Article</p>
                            <p className="font-semibold text-white">The Complete Guide to 8760-Hour Modeling</p>
                        </Link>
                        <Link href="/blog/solar-wind-storage-math" className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition">
                            <p className="text-sm text-slate-500 mb-1">Related</p>
                            <p className="font-semibold text-white">Solar + Wind + Storage: The Math</p>
                        </Link>
                    </div>
                </div>
            </article>
        </main>
    );
}
