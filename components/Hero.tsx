export default function Hero() {
    const scrollToSimulator = () => {
        document.getElementById('simulator')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <header className="pt-16 pb-12 bg-white dark:bg-slate-900 transition-colors duration-300">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl sm:text-5xl font-extrabold brand-text mb-6 leading-tight">
                    Understand how 24/7 Carbon-Free energy affects your portfolio
                </h1>
                <p className="text-lg mb-8 max-w-2xl mx-auto leading-relaxed text-gray-600 dark:text-gray-300">
                    Eighty760 models, analyzes, and optimizes clean energy portfolios against the rigorous standard of
                    meeting demand with carbon-free energy every hour of the day.
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={scrollToSimulator}
                        className="px-8 py-3 text-lg font-bold text-white rounded-md shadow-md transition hover:opacity-90 bg-brand dark:bg-brand-light"
                    >
                        Try Interactive Simulator
                    </button>
                </div>
            </div>
        </header>
    );
}
