// Article 3-5 Placeholders - Coming Soon
import Link from 'next/link';

export default function ComingSoon({ title, description }: { title: string; description: string }) {
    return (
        <main className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
            <div className="max-w-2xl text-center">
                <div className="mb-6">
                    <span className="text-6xl">📝</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    {title}
                </h1>
                <p className="text-lg text-slate-300 mb-8">
                    {description}
                </p>
                <div className="bg-energy-green/10 border border-energy-green/30 rounded-2xl p-6 mb-8">
                    <p className="text-sm text-slate-300 mb-4">
                        This article is currently in development. Sign up to be notified when it's published.
                    </p>
                    <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="your@email.com"
                            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-energy-green"
                        />
                        <button
                            type="submit"
                            className="px-6 py-2 bg-energy-green text-navy-950 font-bold rounded-lg hover:bg-energy-green/90 transition"
                        >
                            Notify Me
                        </button>
                    </form>
                </div>
                <div className="space-y-3">
                    <Link
                        href="/blog"
                        className="block text-energy-green hover:underline"
                    >
                        ← Back to Resources
                    </Link>
                    <p className="text-slate-500 text-sm">In the meantime, explore our interactive tools:</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/aggregation"
                            className="px-6 py-2 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition border border-white/20"
                        >
                            ERCOT Aggregation
                        </Link>
                        <Link
                            href="/"
                            className="px-6 py-2 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition border border-white/20"
                        >
                            Portfolio Simulator
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
