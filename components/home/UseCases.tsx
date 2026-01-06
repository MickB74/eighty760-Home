import React from 'react';

const cases = [
    {
        title: "Solar vs. Wind Tradeoffs",
        description: "Analyze how different generation mixes align with your specific load shape and grid location.",
        icon: "⚖️"
    },
    {
        title: "Storage Sizing for 24/7",
        description: "Determine exactly how much battery capacity is needed to move from 65% to 85% hour-by-hour matching.",
        icon: "🔋"
    },
    {
        title: "Annual vs. Hourly Reality",
        description: "Reveal the gap between '100% Annual Renewable' claims and actual hourly carbon-free performance.",
        icon: "📉"
    },
    {
        title: "The 'Last 20%' Problem",
        description: "Identify the diminishing returns and exponential costs of chasing the final percentage points of CFE.",
        icon: "🚀"
    }
];

export default function UseCases() {
    return (
        <section className="py-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold brand-text mb-6">What decisions does Eighty760 inform?</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                            Move beyond simple volume targets. Our platform provides the granular data needed for complex VPPA structuring, portfolio sequencing, and boardroom strategy.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-6">
                            {cases.map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="text-2xl pt-1">{item.icon}</div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">{item.title}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Visual Placeholder for a 'Decision Graph' or similar abstract concept */}
                    <div className="relative h-80 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8 flex items-center justify-center overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent"></div>
                        <div className="text-center relative z-10">
                            <div className="text-4xl font-bold text-brand dark:text-brand-light mb-2">Decision-Grade</div>
                            <div className="text-lg text-gray-500 dark:text-gray-400">Modeling Platform</div>
                        </div>
                        {/* Decorative background elements */}
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-100 dark:bg-slate-700 rounded-full opacity-50 blur-2xl group-hover:scale-125 transition duration-1000"></div>
                        <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-100 dark:bg-slate-700 rounded-full opacity-50 blur-2xl group-hover:scale-125 transition duration-1000"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
