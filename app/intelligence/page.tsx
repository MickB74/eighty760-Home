
'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { motion } from 'framer-motion';

interface Insight {
    _id: string;
    title: string;
    content: string; // Summary
    source: string;
    url: string;
    relevanceReasoning: string;
    tags: string[];
    ingestedDate: string;
    category: string;
}

export default function IntelligenceDashboard() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const res = await fetch('/api/insights');
                const json = await res.json();
                if (json.success) {
                    setInsights(json.insights);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchInsights();
    }, []);

    // Placeholder if no data (Demo Mode)
    const displayInsights = insights.length > 0 ? insights : [
        {
            _id: 'demo1',
            title: 'ERCOT Contingency Reserve Service (ECRS) Deployment Impact on Real-Time Prices',
            content: 'ECRS deployments have suppressed scarcity pricing signals by retaining capacity offline until critical thresholds, effectively lowering the price cap during moderate stress events. This indicates a shift in revenue from energy-only markets to ancillary services.',
            source: 'Potomac Economics (IMM)',
            url: '#',
            relevanceReasoning: 'Critical for revenue modeling of battery storage assets participating in AS markets.',
            tags: ['ERCOT', 'Ancillary Services', 'Price Foundation'],
            ingestedDate: new Date().toISOString(),
            category: 'ISO Update'
        },
        {
            _id: 'demo2',
            title: 'Google and Microsoft 24/7 CFE Procurement Standard V2',
            content: 'New joint RFI suggests a move towards "time-matched" attribute certificates that must be retired within the same hour of consumption, rejecting monthly netting. This validates the hourly accounting thesis.',
            source: 'Clean Energy wire',
            url: '#',
            relevanceReasoning: 'Direct validation of the 24/7 CFE hourly matching product thesis.',
            tags: ['Market Signals', 'Corporate Procurement', '24/7 CFE'],
            ingestedDate: new Date().toISOString(),
            category: 'Press'
        }
    ];

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-navy-950 transition-colors duration-300">
            <Navigation />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16">
                <header className="mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-navy-950 dark:text-white mb-2">
                        Market Intelligence <span className="text-emerald-500">Signal</span>
                    </h1>
                    <p className="text-gray-600 dark:text-slate-400">
                        Zero noise. AI-filtered insights relevant to <span className="font-semibold text-emerald-600 dark:text-emerald-400">Hourly CFE</span>, <span className="font-semibold text-emerald-600 dark:text-emerald-400">Scope 2 Credibility</span>, and <span className="font-semibold text-emerald-600 dark:text-emerald-400">Grid Alignment</span>.
                    </p>
                </header>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: Weekly Signal Memo */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-white dark:bg-navy-900 border border-emerald-100 dark:border-white/10 rounded-2xl p-8 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <svg className="w-32 h-32 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                            </div>

                            <h2 className="text-xl font-bold text-navy-950 dark:text-white mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Weekly Signal Memo
                            </h2>

                            <div className="prose dark:prose-invert max-w-none">
                                <p className="text-lg leading-relaxed mb-4">
                                    <strong>Market Shift:</strong> This week's signals indicate a hardening of "hourly matching" standards among hyperscalers. The release of the "V2 Procurement Standard" effectively deprecates annual netting for future data center contracts in PJM and ERCOT.
                                </p>
                                <p className="mb-4">
                                    <strong>Why it matters:</strong> This significantly increases the premium for <span className="text-emerald-600 dark:text-emerald-400 font-semibold">firm</span> renewable shape. Solar-only portfolios will face steep discounts as the "time-value" of generation becomes a transactable attribute.
                                </p>
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border-l-4 border-emerald-500">
                                    <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm uppercase tracking-wide mb-1">Actionable Insight</h4>
                                    <p className="text-sm text-emerald-900 dark:text-emerald-100 m-0">
                                        Review currently modelled PPA settlement values (Financial Tab) using the "Stress Test" scenario. The divergence between "As-Generated" and "Baseload" value is widening.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-lg font-semibold text-gray-500 dark:text-slate-400 mb-4 uppercase tracking-wider text-sm">Tagged Insights Stream</h3>
                            <div className="space-y-4">
                                {displayInsights.map((insight) => (
                                    <motion.div
                                        key={insight._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 p-6 rounded-xl hover:border-emerald-500/50 transition-colors group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded uppercase">
                                                    {insight.category}
                                                </span>
                                                <span className="text-xs text-slate-400">{new Date(insight.ingestedDate).toLocaleDateString()}</span>
                                            </div>
                                            <a href={insight.url} target="_blank" rel="noopener" className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wide hover:underline">
                                                Source: {insight.source} ↗
                                            </a>
                                        </div>
                                        <h4 className="text-lg font-bold text-navy-950 dark:text-white mb-2 group-hover:text-emerald-500 transition-colors">
                                            {insight.title}
                                        </h4>
                                        <p className="text-gray-600 dark:text-slate-300 mb-4 text-sm leading-relaxed">
                                            {insight.content}
                                        </p>

                                        <div className="bg-slate-50 dark:bg-black/20 p-3 rounded text-xs text-slate-500 dark:text-slate-400 italic mb-3">
                                            Relevance: {insight.relevanceReasoning}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {insight.tags.map(tag => (
                                                <span key={tag} className="text-[10px] uppercase font-semibold text-slate-500 border border-slate-200 dark:border-white/10 px-2 py-1 rounded-full">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Filters & Analysis */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 rounded-xl p-6 sticky top-24">
                            <h3 className="font-bold text-navy-950 dark:text-white mb-4">Focus Areas</h3>
                            <div className="space-y-2">
                                {['Hourly CFE Credibility', 'ERCOT Market Design', 'Time-Based EACs', 'Scope 2 Accounting', 'Battery Storage Revenue'].map(filter => (
                                    <label key={filter} className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 cursor-pointer hover:text-emerald-500 transition-colors">
                                        <input type="checkbox" className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" defaultChecked />
                                        {filter}
                                    </label>
                                ))}
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5">
                                <h3 className="font-bold text-navy-950 dark:text-white mb-2">Manually Add Insight</h3>
                                <p className="text-xs text-gray-500 mb-4">Found a link? Paste it here to run the relevance vector check.</p>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    className="w-full text-sm p-2 rounded border border-gray-300 dark:border-white/10 bg-transparent dark:text-white mb-2"
                                />
                                <button className="w-full py-2 bg-navy-950 dark:bg-white/10 text-white font-semibold text-xs uppercase tracking-wide rounded hover:bg-emerald-600 dark:hover:bg-white/20 transition-colors">
                                    Analyze & Ingest
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
