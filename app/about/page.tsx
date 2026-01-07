import Link from 'next/link';
import { Metadata } from 'next';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
    title: 'About Eighty760 | 24/7 Carbon-Free Energy Platform',
    description: 'The open platform for hourly carbon accounting and clean energy portfolio modeling. Learn about our mission and methodology.',
};

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-navy-950">
            <Navigation />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        About Eighty760
                    </h1>
                    <p className="text-xl text-slate-300">
                        The open platform for hourly carbon accounting and 24/7 carbon-free energy modeling.
                    </p>
                </header>

                <div className="prose prose-invert prose-lg max-w-none">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 mb-12">
                        <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
                        <p className="text-slate-300 mb-4">
                            Eighty760 exists to make hour-by-hour carbon accounting accessible, transparent, and actionable.
                            We believe that credible net-zero strategies require moving beyond annual renewable energy credits
                            to true 24/7 carbon-free energy matching.
                        </p>
                        <p className="text-slate-300">
                            By providing free, open-source tools powered by real grid data, we're helping energy managers,
                            sustainability leaders, and climate strategists build portfolios that actually eliminate emissions—every hour of every day.
                        </p>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-6">Why "Eighty760"?</h2>
                    <p className="text-slate-300 mb-4">
                        There are <strong className="text-energy-green">8,760 hours in a year</strong>. Each one matters.
                    </p>
                    <p className="text-slate-300 mb-8">
                        Our name reflects our core belief: that energy and carbon must be accounted for with hourly precision,
                        not annual averages. The grid operates in real-time—your carbon strategy should too.
                    </p>

                    <h2 className="text-2xl font-bold text-white mb-6">Our Approach</h2>
                    <div className="grid md:grid-cols-3 gap-6 my-8">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                            <div className="text-3xl mb-3">🔓</div>
                            <h3 className="text-lg font-semibold text-white mb-2">Open & Transparent</h3>
                            <p className="text-sm text-slate-400">
                                Open-source methodology, documented data sources, and peer-reviewable models.
                            </p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                            <div className="text-3xl mb-3">📊</div>
                            <h3 className="text-lg font-semibold text-white mb-2">Data-Driven</h3>
                            <p className="text-sm text-slate-400">
                                Real ERCOT pricing, NREL weather data, and validated generation models.
                            </p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                            <div className="text-3xl mb-3">🎓</div>
                            <h3 className="text-lg font-semibold text-white mb-2">Educational</h3>
                            <p className="text-sm text-slate-400">
                                We don't just provide tools—we teach the "why" behind hourly carbon accounting.
                            </p>
                        </div>
                    </div>

                    <div className="bg-energy-green/10 border border-energy-green/30 rounded-2xl p-8 my-12">
                        <h2 className="text-2xl font-bold text-white mb-3">Aligned with Industry Standards</h2>
                        <div className="flex flex-wrap gap-3">
                            <span className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-slate-300">EnergyTag Standard</span>
                            <span className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-slate-300">GHG Protocol Scope 2</span>
                            <span className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-slate-300">RE100 Technical Criteria</span>
                            <span className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-slate-300">UN 24/7 CFE Compact</span>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-6">Get Involved</h2>
                    <p className="text-slate-300 mb-6">
                        Eighty760 is a community-driven project. Whether you're an energy professional, data scientist,
                        climate advocate, or just curious about 24/7 CFE, there are ways to contribute:
                    </p>
                    <ul className="text-slate-300 space-y-2">
                        <li><strong className="text-white">Use the tools:</strong> Build scenarios, share results, provide feedback</li>
                        <li><strong className="text-white">Improve the models:</strong> Contribute to our open-source methodology</li>
                        <li><strong className="text-white">Spread the word:</strong> Help educate others about hourly carbon accounting</li>
                        <li><strong className="text-white">Share data:</strong> Help us expand beyond ERCOT to other grid regions</li>
                    </ul>

                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 mt-12 text-center">
                        <h3 className="text-xl font-semibold text-white mb-4">Questions or want to collaborate?</h3>
                        <a
                            href="mailto:contact@eighty760.com"
                            className="inline-block px-8 py-3 bg-energy-green text-navy-950 font-bold rounded-lg hover:bg-energy-green/90 transition"
                        >
                            Get in Touch
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}
