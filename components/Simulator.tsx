'use client';

import { useSimulation } from '@/hooks/useSimulation';
import ControlInput from './simulator/ControlInput';
import LegendItem from './simulator/LegendItem';
import KpiCard from './simulator/KpiCard';
import ResultsChart from './simulator/ResultsChart';

export default function Simulator() {
    const {
        solarCap, setSolarCap,
        windCap, setWindCap,
        nuclearCap, setNuclearCap,
        geothermalCap, setGeothermalCap,
        metrics,
        solarGen,
        windGen,
        nuclearGen,
        geothermalGen,
        baseLoad
    } = useSimulation();

    return (
        <section id="simulator" className="py-16 bg-white dark:bg-slate-900 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-10 text-center">
                    <h2 className="text-3xl font-bold brand-text">Interactive Portfolio Simulator</h2>
                    <p className="mt-2 max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
                        Experience the <strong>Methodology</strong> described in the whitepaper. Adjust the generation
                        capacities below to see how they stack up against a typical Office building load profile.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Controls */}
                    <div className="p-6 rounded-lg lg:col-span-1 bg-gray-100 dark:bg-slate-800 transition-colors duration-300">
                        <h3 className="text-lg font-bold brand-text mb-6 flex items-center gap-2">
                            <span>🎛️</span> Portfolio Inputs
                        </h3>

                        <div className="space-y-8">
                            <ControlInput
                                label="Solar Capacity"
                                value={solarCap}
                                setValue={setSolarCap}
                                max={200}
                                unit="MW"
                            />
                            <ControlInput
                                label="Wind Capacity"
                                value={windCap}
                                setValue={setWindCap}
                                max={200}
                                unit="MW"
                            />
                            <ControlInput
                                label="Nuclear Capacity"
                                value={nuclearCap}
                                setValue={setNuclearCap}
                                max={50}
                                unit="MW"
                            />
                            <ControlInput
                                label="Geothermal Capacity"
                                value={geothermalCap}
                                setValue={setGeothermalCap}
                                max={50}
                                unit="MW"
                            />
                        </div>
                    </div>

                    {/* Visualization */}
                    <div className="p-6 rounded-lg lg:col-span-2 flex flex-col shadow-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 transition-colors duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                24-Hour Generation Profile
                            </h3>
                            <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                                <LegendItem color="bg-gray-800" label="Load" />
                                <LegendItem color="bg-amber-500" label="Solar" />
                                <LegendItem color="bg-blue-500" label="Wind" />
                                <LegendItem color="bg-purple-500" label="Nuclear" />
                                <LegendItem color="bg-red-500" label="Geothermal" />
                            </div>
                        </div>

                        <div className="flex-grow flex items-center justify-center rounded-lg p-2 bg-white dark:bg-slate-800">
                            <ResultsChart
                                baseLoad={baseLoad}
                                solarGen={solarGen}
                                windGen={windGen}
                                nuclearGen={nuclearGen}
                                geothermalGen={geothermalGen}
                            />
                        </div>

                        {/* KPIs */}
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <KpiCard label="CFE Score" value={`${metrics.cfeScore}%`} sub="Hourly Match" />
                            <KpiCard label="Grid Needed" value={metrics.gridNeeded.toLocaleString()} sub="MWh Deficit" />
                            <KpiCard label="Overgeneration" value={metrics.overGen.toLocaleString()} sub="MWh Surplus" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
