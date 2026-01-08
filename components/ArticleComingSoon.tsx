// Article 3-5 Placeholders - Coming Soon
import Link from 'next/link';

export default function ComingSoon({ title, description }: { title: string; description: string }) {
    return (
        <main className="min-h-screen bg-gray-50 dark:bg-navy-950 flex items-center justify-center px-4 transition-colors duration-300">
            <div className="max-w-2xl w-full">
                <Link href="/blog" className="inline-flex items-center text-sm brand-text hover:underline mb-8">
                    ← Back to Resources
                </Link>

                <h1 className="text-3xl md:text-4xl font-bold text-navy-950 dark:text-white mb-4">
                    {title}
                </h1>

                <p className="text-lg text-gray-600 dark:text-slate-300 mb-8">
                    This detailed guide is currently being finalized by our research team.
                    It will include interactive 8760 visualizations and downloadable datasets.
                </p>

                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-8 shadow-md dark:shadow-none">
                    <p className="text-sm text-gray-500 dark:text-slate-300 mb-4">
                        Get notified when this article is published:
                    </p>

                    <div className="flex gap-3">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:border-energy-green transition-colors"
                        />
                        <button className="px-6 py-2 bg-energy-green text-navy-950 font-bold rounded-lg hover:bg-energy-green/90 transition">
                            Notify Me
                        </button>
                    </div>

                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-4">
                        We respect your inbox. No spam, ever.
                    </p>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        Need this data for a project right now?
                    </p>
                    <div className="flex gap-4">
                        <a
                            href="mailto:research@eighty760.com"
                            className="text-sm brand-text hover:underline"
                        >
                            Contact Research Team
                        </a>
                    </div>
                </div>

                <div className="mt-8 flex gap-4">
                    <Link
                        href="/aggregation"
                        className="px-6 py-2 bg-slate-200 dark:bg-white/10 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-white/20 transition border border-transparent dark:border-white/20"
                    >
                        Run Simulation
                    </Link>
                    <Link
                        href="/whitepaper"
                        className="px-6 py-2 bg-slate-200 dark:bg-white/10 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-white/20 transition border border-transparent dark:border-white/20"
                    >
                        Read Whitepaper
                    </Link>
                </div>
            </div>
        </main>
    );
}
