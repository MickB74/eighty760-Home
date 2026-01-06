export default function Hero() {
    const scrollToSimulator = () => {
        document.getElementById('simulator')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <header className="pt-20 pb-16 bg-white dark:bg-slate-900 transition-colors duration-300">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="inline-block px-3 py-1 mb-6 text-sm font-semibold tracking-wider text-brand dark:text-brand-light uppercase bg-blue-50 dark:bg-slate-800 rounded-full">
                    Model, stress-test, and explain 24/7 CFE
                </div>
                <h1 className="text-4xl sm:text-6xl font-extrabold brand-text mb-6 leading-tight tracking-tight">
                    24/7 Carbon-Free Electricity,<br />
                    <span className="text-brand-light">Modeled Hour by Hour</span>
                </h1>
                <p className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed text-gray-600 dark:text-gray-300">
                    A scenario-planning platform for corporate buyers evaluating clean electricity portfolios beyond annual matching.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={scrollToSimulator}
                        className="px-8 py-4 text-lg font-bold text-white rounded-lg shadow-lg transition hover:opacity-90 bg-brand dark:bg-brand-light hover:translate-y-[-1px]"
                    >
                        Run a Demo Scenario
                    </button>
                    <button
                        onClick={() => document.getElementById('methodology')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-8 py-4 text-lg font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                    >
                        How it Works
                    </button>
                </div>
            </div>
        </header>
    );
}
