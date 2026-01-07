import Link from 'next/link';
import { Metadata } from 'next';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
    title: 'Resources & Insights | Eighty760',
    description: 'Learn about 24/7 carbon-free energy, 8760-hour modeling, and hourly matching through in-depth guides and analysis.',
};

const articles = [
    {
        slug: 'why-100-renewable-not-clean',
        title: 'Why 100% Renewable ≠ 100% Clean',
        description: 'The illusion of annual renewable energy certificates and why hourly matching matters for real carbon impact.',
        category: 'Fundamentals',
        readTime: '8 min read',
        date: 'January 2025'
    },
    {
        slug: 'guide-8760-modeling',
        title: 'The Complete Guide to 8760-Hour Energy Modeling',
        description: 'Everything you need to know about hourly energy analysis and why it\'s becoming the industry standard.',
        category: 'Guide',
        readTime: '12 min read',
        date: 'January 2025'
    },
    {
        slug: 'solar-wind-storage-math',
        title: 'Solar + Wind + Storage: The Math Behind a Balanced Portfolio',
        description: 'How complementary generation sources and battery storage create 24/7 carbon-free energy portfolios.',
        category: 'Technical',
        readTime: '10 min read',
        date: 'January 2025'
    },
    {
        slug: 'true-cost-ppa',
        title: 'How to Calculate the True Cost of a PPA',
        description: 'Beyond the strike price: understanding basis risk, settlement value, and REC revenue in power purchase agreements.',
        category: 'Procurement',
        readTime: '9 min read',
        date: 'January 2025'
    },
    {
        slug: 'methodology-explained',
        title: 'The Eighty760 Methodology: How We Model Hourly Carbon',
        description: 'A transparent look at our data sources, modeling approach, and validation process for hourly carbon accounting.',
        category: 'Methodology',
        readTime: '15 min read',
        date: 'January 2025'
    },
];

export default function BlogPage() {
    return (
        <main className="min-h-screen bg-navy-950">
            <Navigation />
            {/* Hero Section */}
            <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-block px-4 py-2 mb-6 text-sm font-semibold tracking-wider text-energy-green uppercase bg-energy-green/10 border border-energy-green/20 rounded-full backdrop-blur-sm">
                        Resources & Insights
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Learn About 24/7 Carbon-Free Energy
                    </h1>
                    <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
                        In-depth guides, analysis, and perspectives on hourly carbon accounting,
                        energy procurement, and the future of clean energy portfolios.
                    </p>

                    {/* Email Sign-up */}
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-xl mx-auto">
                        <h3 className="text-lg font-semibold text-white mb-2">📬 Subscribe to 8760 Insights</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Get weekly analysis on 24/7 CFE, market trends, and new modeling capabilities.
                        </p>
                        <form className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="email"
                                placeholder="your@email.com"
                                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-energy-green"
                            />
                            <button
                                type="submit"
                                className="px-6 py-2 bg-energy-green text-navy-950 font-bold rounded-lg hover:bg-energy-green/90 transition"
                            >
                                Subscribe
                            </button>
                        </form>
                        <p className="text-xs text-slate-500 mt-2">No spam. Unsubscribe anytime.</p>
                    </div>
                </div>
            </section>

            {/* Articles Grid */}
            <section className="pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-6">
                        {articles.map((article) => (
                            <Link
                                key={article.slug}
                                href={`/blog/${article.slug}`}
                                className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-energy-green/30 transition-all"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-xs font-semibold px-3 py-1 bg-energy-green/10 text-energy-green rounded-full">
                                        {article.category}
                                    </span>
                                    <span className="text-xs text-slate-500">{article.readTime}</span>
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-energy-green transition">
                                    {article.title}
                                </h2>
                                <p className="text-slate-400 text-sm mb-4">
                                    {article.description}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">{article.date}</span>
                                    <span className="text-energy-green text-sm font-medium group-hover:translate-x-1 transition-transform">
                                        Read more →
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
