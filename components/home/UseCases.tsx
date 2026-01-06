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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold brand-text mb-6">What decisions does Eighty760 inform?</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                        Move beyond simple volume targets. Our platform provides the granular data needed for complex VPPA structuring, portfolio sequencing, and boardroom strategy.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {cases.map((item, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                            <div className="text-3xl pt-1">{item.icon}</div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">{item.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-snug">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
