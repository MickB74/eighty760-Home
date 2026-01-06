import React from 'react';

const steps = [
    {
        id: 1,
        title: "Load Profile (8760)",
        description: "We start with your hourly consumption data for a full year.",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-brand dark:text-brand-light">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
        )
    },
    {
        id: 2,
        title: "Gen Profiles",
        description: "Model wind, solar, and storage generation hour-by-hour based on location.",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-brand dark:text-brand-light">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
            </svg>
        )
    },
    {
        id: 3,
        title: "Hourly Matching",
        description: "Calculate supply vs demand for every single hour (8,760 data points).",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-brand dark:text-brand-light">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
        )
    },
    {
        id: 4,
        title: "Residual Grid Risk",
        description: "Identify exactly when and how much you are exposed to dirty grid power.",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-brand dark:text-brand-light">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
        )
    },
    {
        id: 5,
        title: "CFE Score",
        description: "True Carbon-Free Energy score, not just '100% renewable' on paper.",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-brand dark:text-brand-light">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
        )
    }
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-20 bg-gray-50 dark:bg-slate-800 border-y border-gray-200 dark:border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold brand-text mb-4">How it Works</h2>
                    <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        From raw data to actionable 24/7 intelligence in seconds.
                    </p>
                </div>

                <div className="relative">
                    {/* Connection Line (Desktop) */}
                    <div className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-gray-200 dark:bg-slate-600 -z-10 transform -translate-y-1/2"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                        {steps.map((step, index) => (
                            <div key={step.id} className="relative flex flex-col items-center text-center p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm lg:shadow-none lg:bg-transparent lg:dark:bg-transparent z-10">
                                <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 border-2 border-brand dark:border-brand-light flex items-center justify-center mb-6 shadow-sm">
                                    {step.icon}
                                </div>
                                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">{step.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {step.description}
                                </p>
                                {/* Mobile/Tablet Arrow */}
                                {index < steps.length - 1 && (
                                    <div className="lg:hidden mt-6 text-gray-300 dark:text-slate-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
