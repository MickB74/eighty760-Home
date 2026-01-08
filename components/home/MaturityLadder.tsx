import React from 'react';

const levels = [
    { level: 1, title: "Annual REC Matching", desc: "Compliance-focused" },
    { level: 2, title: "Market-Based Scope 2", desc: "Cost optimization" },
    { level: 3, title: "Hourly Awareness", desc: "Shadow metrics tracking" },
    { level: 4, title: "Portfolio Optimization", desc: "Strategic asset selection" },
    { level: 5, title: "24/7 CFE Strategy", desc: "Complete decarbonization" }
];

export default function MaturityLadder() {
    return (
        <section className="py-16 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl font-bold brand-text mb-12">Energy Procurement Maturity</h2>

                <div className="relative">
                    {/* Graphic Ladder */}
                    <div className="flex flex-col-reverse space-y-reverse space-y-2">
                        {levels.map((lvl) => {
                            return (
                                <div
                                    key={lvl.level}
                                    className="relative flex items-center p-4 rounded-lg border transition-all duration-300 bg-white dark:bg-slate-900 border-energy-green shadow-md"
                                >
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mr-6 flex-shrink-0 bg-energy-green text-navy-950">
                                        {lvl.level}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100">
                                            {lvl.title}
                                        </h3>
                                        <p className="text-xs uppercase tracking-wider font-semibold opacity-70">
                                            {lvl.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
