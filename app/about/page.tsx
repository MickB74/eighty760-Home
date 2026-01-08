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
                    <p className="text-xl text-gray-600 dark:text-slate-300">
                        The open platform for hourly carbon accounting and 24/7 carbon-free energy modeling.
                    </p>
                </header>

                <div className="space-y-16">
                    {/* Mission */}
                    <section>
                        <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4">Our Mission</h2>
                        <p className="text-lg text-gray-600 dark:text-slate-300 mb-4">
                            To accelerate the transition to a truly decarbonized grid by providing transparent, granular,
                            and actionable data. We believe that annual matching is an outdated accounting method that fails
                            to reflect the physical reality of the grid.
                        </p>
                        <p className="text-lg text-gray-600 dark:text-slate-300">
                            True decarbonization requires matching energy consumption with carbon-free generation
                            <span className="brand-text font-bold"> every hour of every day</span>.
                        </p>
                    </section>

                    {/* Why 8760 */}
                    <section>
                        <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-4">Why "Eighty760"?</h2>
                        <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-sm dark:shadow-none">
                            <p className="text-lg text-gray-600 dark:text-slate-300 mb-6">
                                There are <span className="font-mono text-xl font-bold brand-text mx-1">8,760</span> hours in a standard year.
                            </p>
                            <p className="text-gray-600 dark:text-slate-300 mb-4">
                                Most organizations still claim "100% renewable" status by buying Renewable Energy Certificates (RECs)
                                equal to their annual consumption. This masks the reality that they are often consuming fossil-fuel
                                power when the sun isn't shining or the wind isn't blowing.
                            </p>
                            <p className="text-gray-600 dark:text-slate-300">
                                Eighty760 brings visibility to every single one of those hours, exposing the "carbon gaps"
                                and identifying the optimal mix of wind, solar, and storage to close them.
                            </p>
                        </div>
                    </section>



                    {/* Get Involved */}
                    <section>
                        <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-6">Get Involved</h2>
                        <p className="text-gray-600 dark:text-slate-300 mb-6">
                            Eighty760 is a community-driven project. Whether you're an energy professional, data scientist,
                            climate advocate, or just curious about 24/7 CFE, there are ways to contribute:
                        </p>
                        <ul className="text-gray-600 dark:text-slate-300 space-y-2 list-disc list-inside ml-4">
                            <li><strong className="text-navy-950 dark:text-white">Use the tools:</strong> Build scenarios, share results, provide feedback</li>
                            <li><strong className="text-navy-950 dark:text-white">Improve the models:</strong> Contribute to our open-source methodology</li>
                            <li><strong className="text-navy-950 dark:text-white">Spread the word:</strong> Help educate others about hourly carbon accounting</li>
                            <li><strong className="text-navy-950 dark:text-white">Share data:</strong> Help us expand beyond ERCOT to other grid regions</li>
                        </ul>

                        <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-8 mt-12 text-center shadow-lg dark:shadow-none">
                            <h3 className="text-xl font-semibold text-navy-950 dark:text-white mb-4">Questions or want to collaborate?</h3>
                            <a
                                href="mailto:contact@eighty760.com"
                                className="inline-block px-8 py-3 bg-energy-green text-navy-950 font-bold rounded-lg hover:bg-energy-green/90 transition shadow-md"
                            >
                                Get in Touch
                            </a>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
