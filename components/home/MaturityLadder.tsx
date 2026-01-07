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
                <h2 className="text-3xl font-bold brand-text mb-4">Energy Procurement Maturity</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-12">
                    Eighty760 is the bridge from <strong>Level 2</strong> to <strong>Level 4</strong>.
                </p>

                <div className="relative">
                    {/* Graphic Ladder */}
                    <div className="flex flex-col-reverse space-y-reverse space-y-2">
                        {levels.map((lvl) => {
                            const isFocus = lvl.level >= 2 && lvl.level <= 4;
                            return (
                                <div
                                    key={lvl.level}
                                    className={`relative flex items-center p-4 rounded-lg border transition-all duration-300 ${isFocus
                                            ? 'bg-white dark:bg-slate-900 border-energy-green shadow-md scale-105 z-10'
                                            : 'bg-white/50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700 text-gray-500 scale-95 opacity-70'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mr-6 flex-shrink-0 ${isFocus ? 'bg-energy-green text-navy-950' : 'bg-gray-200 dark:bg-slate-700 text-gray-500'
                                        }`}>
                                        {lvl.level}
                                    </div>
                                    <div className="text-left">
                                        <h3 className={`font-bold ${isFocus ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>
                                            {lvl.title}
                                        </h3>
                                        <p className="text-xs uppercase tracking-wider font-semibold opacity-70">
                                            {lvl.desc}
                                        </p>
                                    </div>

                                    {/* Annotations for the bridge */}
                                    {lvl.level === 3 && (
                                        <div className="absolute -right-4 md:-right-12 translate-x-full hidden md:flex items-center">
                                            <span className="text-energy-green text-2xl mr-2">←</span>
                                            <span className="text-sm font-bold text-energy-green bg-energy-green/10 backdrop-blur-sm px-3 py-1 rounded-full whitespace-nowrap">
                                                Eighty760 Sweet Spot
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
