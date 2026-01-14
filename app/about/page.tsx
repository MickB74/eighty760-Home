import Link from 'next/link';
import { Metadata } from 'next';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
    title: 'About Eighty760 | 24/7 Carbon-Free Energy Platform',
    description: 'The open platform for hourly carbon accounting and clean energy portfolio modeling. Learn about our mission and methodology.',
};

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-gray-50 dark:bg-navy-950 transition-colors duration-300">
            <Navigation />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 mt-16">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-navy-950 dark:text-white mb-6">
                        About <span className="brand-text">Eighty760</span>
                    </h1>
                    <p className="text-xl text-gray-700 dark:text-slate-300">
                        An open platform for high-resolution temporal carbon accounting and stochastic power systems modeling.
                    </p>
                </header>

                <div className="space-y-16">
                    {/* Mission */}
                    <section>
                        <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4">Missions & Objectives</h2>
                        <p className="text-lg text-gray-700 dark:text-slate-300 mb-4">
                            Our primary objective is to advance the decarbonization of electrical grids through rigorous, transparent, and high-fidelity data analysis. We contend that traditional volumetric matching—annualized renewable energy purchasing—is an insufficient metric that fails to capture the temporal and locational physics of power systems.
                        </p>
                        <p className="text-lg text-gray-700 dark:text-slate-300">
                            True grid decarbonization necessitates <span className="brand-text font-bold">24/7 Carbon-Free Energy (CFE)</span> matching, aligning load consumption with clean generation on an hourly, or sub-hourly, basis.
                        </p>
                    </section>

                    {/* Why 8760 */}
                    <section>
                        <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4">The "8760" Paradigm</h2>
                        <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm dark:shadow-none">
                            <p className="text-lg text-gray-700 dark:text-slate-300 mb-6">
                                The nomenclature "Eighty760" references the <span className="font-mono text-xl font-bold brand-text mx-1">8,760</span> hours in a standard calendar year, representing the fundamental temporal unit of modern grid operations.
                            </p>
                            <p className="text-gray-700 dark:text-slate-300 mb-4">
                                Contemporary corporate sustainability strategies predominantly rely on unbundled Renewable Energy Certificates (RECs) to claim "100% renewable" status. This retrospective accounting method obfuscates the reality that consumption frequently coincides with carbon-intensive marginal generation during periods of renewable intermittency (e.g., nocturnal hours or wind droughts).
                            </p>
                            <p className="text-gray-700 dark:text-slate-300">
                                Eighty760 employs granular hourly modeling to expose these "carbon deficits" and algorithmically identifies the optimal portfolio composition—integrating intermittent renewables, baseload generation, and energy storage—to mitigate emissions with verifiable physical simultaneity.
                            </p>
                        </div>
                    </section>


                    {/* Technology */}
                    <section>
                        <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4">Methodology & Architecture</h2>
                        <div className="grid md:grid-cols-2 gap-8 mb-16">
                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-6 border border-gray-200 dark:border-white/10">
                                <h3 className="text-lg font-semibold text-energy-green-dark dark:text-energy-green mb-2">Stochastic Generation Modeling</h3>
                                <p className="text-gray-700 dark:text-slate-300">
                                    Our simulation engine utilizes <strong>ERA5 reanalysis data</strong> to model variable renewable energy (VRE) production profiles with high meteorological fidelity. This allows for the realistic representation of inter-annual variability and correlation between generation assets and load demand.
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-6 border border-gray-200 dark:border-white/10">
                                <h3 className="text-lg font-semibold text-energy-green-dark dark:text-energy-green mb-2">Portfolio Optimization</h3>
                                <p className="text-gray-700 dark:text-slate-300">
                                    The "Smart Fill" algorithm leverages heuristic optimization techniques to right-size generation capacities and energy storage duration. The objective function minimizes the Levelized Cost of Energy (LCOE) while satisfying constraint targets for Carbon-Free Energy (CFE) scores, accounting for curtailment risks and storage round-trip efficiency.
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-6 border border-gray-200 dark:border-white/10">
                                <h3 className="text-lg font-semibold text-energy-green-dark dark:text-energy-green mb-2">Techno-Economic Analysis</h3>
                                <p className="text-gray-700 dark:text-slate-300">
                                    We integrate historical Locational Marginal Pricing (LMP) from the ERCOT Real-Time Market (2020-2025) to model financial performance. The model captures battery arbitrage revenue, basis risk exposure, and market purchase costs during scarcity intervals, providing a comprehensive view of economic viability.
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-6 border border-gray-200 dark:border-white/10">
                                <h3 className="text-lg font-semibold text-energy-green-dark dark:text-energy-green mb-2">Backcasting & Stress Testing</h3>
                                <p className="text-gray-700 dark:text-slate-300">
                                    Understanding tail risk is critical for grid resilience. Our Weather Performance module backcasts portfolio configurations against extreme historical meteorological events—such as the 2021 Winter Storm Uri and the 2023 Heat Dome—to quantify performance under stress conditions.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Get Involved */}
                    <section>
                        <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-6">Research & Collaboration</h2>
                        <p className="text-gray-700 dark:text-slate-300 mb-6">
                            Eighty760 operates as an open platform for energy systems research. We invite collaboration from energy analysts, data scientists, and policy researchers to advance the methodology of hourly carbon accounting:
                        </p>
                        <ul className="text-gray-700 dark:text-slate-300 space-y-2 list-disc list-inside ml-4">
                            <li><strong className="text-navy-950 dark:text-white">Scenario Modeling:</strong> Utilize the platform to develop and validate decarbonization pathways.</li>
                            <li><strong className="text-navy-950 dark:text-white">Algorithmic Enhancement:</strong> Contribute to the refinement of our open-source optimization models.</li>
                            <li><strong className="text-navy-950 dark:text-white">Data Expansion:</strong> Assist in integrating datasets from other ISOs/RTOs beyond ERCOT.</li>
                            <li><strong className="text-navy-950 dark:text-white">Policy Advocacy:</strong> Leverage granular data to support evidence-based energy policy formulation.</li>
                        </ul>

                        <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-8 mt-12 text-center shadow-lg dark:shadow-none">
                            <h3 className="text-xl font-semibold text-navy-950 dark:text-white mb-4">Academic Inquiries & Collaboration</h3>
                            <a
                                href="mailto:contact@eighty760.com"
                                className="inline-block px-8 py-3 bg-energy-green text-navy-950 font-bold rounded-lg hover:bg-energy-green/90 transition shadow-md"
                            >
                                Contact Research Team
                            </a>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
