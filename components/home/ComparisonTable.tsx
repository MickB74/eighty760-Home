import React from 'react';

export default function ComparisonTable() {
    return (
        <section className="py-16 bg-white dark:bg-slate-900 border-y border-gray-100 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold brand-text mb-4">Why Eighty760?</h2>
                    <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Most tools track what happened yesterday. We help you plan what to buy for tomorrow.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="p-4 border-b-2 border-gray-200 dark:border-slate-700 w-1/3"></th>
                                <th className="p-4 border-b-2 border-brand dark:border-brand-light bg-blue-50/50 dark:bg-slate-800/50 text-brand dark:text-brand-light font-bold text-lg w-2/3">
                                    Eighty760
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-sm md:text-base">
                            <tr className="border-b border-gray-100 dark:border-slate-800">
                                <td className="p-4 font-medium text-gray-900 dark:text-gray-100">Primary Function</td>
                                <td className="p-4 bg-blue-50/30 dark:bg-slate-800/30 font-semibold text-brand-dark dark:text-brand-light">Scenario & Portfolio Modeling</td>
                            </tr>
                            <tr className="border-b border-gray-100 dark:border-slate-800">
                                <td className="p-4 font-medium text-gray-900 dark:text-gray-100">Time Horizon</td>
                                <td className="p-4 bg-blue-50/30 dark:bg-slate-800/30 font-semibold text-brand-dark dark:text-brand-light">Forward-looking (Planning)</td>
                            </tr>
                            <tr className="border-b border-gray-100 dark:border-slate-800">
                                <td className="p-4 font-medium text-gray-900 dark:text-gray-100">Key Value</td>
                                <td className="p-4 bg-blue-50/30 dark:bg-slate-800/30 font-semibold text-brand-dark dark:text-brand-light">Procurement Decision Support</td>
                            </tr>
                            <tr className="border-b border-gray-100 dark:border-slate-800">
                                <td className="p-4 font-medium text-gray-900 dark:text-gray-100">Granularity</td>
                                <td className="p-4 bg-blue-50/30 dark:bg-slate-800/30 font-semibold text-brand-dark dark:text-brand-light">Hourly (8760)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
