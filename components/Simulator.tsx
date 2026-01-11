'use client';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { HOURS } from '@/lib/data/simulation-profiles';
import { useSimulation } from '@/hooks/useSimulation';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

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

    // Chart Configuration using "stacked: true" logic.
    // Order matters: 
    // - To stack properly from bottom up, datasets should be ordered or use "order" prop?
    // - Actually, for 'fill: true', the order in the array usually determines z-index.
    // - Load should NOT be stacked.
    const chartData = {
        labels: HOURS.map(h => `${h}:00`),
        datasets: [
            {
                label: 'Load (MW)',
                data: baseLoad,
                borderColor: '#333333',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                tension: 0.4,
                order: 0, // Draw on top
                stack: 'load' // Separate stack group so it doesn't pile on generation
            },
            // Generation Stack (Bottom to Top)
            // 1. Geothermal (Baseload)
            {
                label: 'Geothermal',
                data: geothermalGen,
                backgroundColor: 'rgba(239, 68, 68, 0.85)', // Red-500
                borderColor: '#EF4444',
                borderWidth: 0,
                fill: true,
                pointRadius: 0,
                tension: 0.2, // Flatter for baseload
                order: 4,
                stack: 'generation'
            },
            // 2. Nuclear (Baseload)
            {
                label: 'Nuclear',
                data: nuclearGen,
                backgroundColor: 'rgba(168, 85, 247, 0.85)', // Purple-500
                borderColor: '#A855F7',
                borderWidth: 0,
                fill: true,
                pointRadius: 0,
                tension: 0.2,
                order: 3,
                stack: 'generation'
            },
            // 3. Wind (Variable)
            {
                label: 'Wind Gen',
                data: windGen,
                backgroundColor: 'rgba(59, 130, 246, 0.85)', // Blue-500
                borderColor: '#3B82F6',
                borderWidth: 0,
                fill: true,
                pointRadius: 0,
                tension: 0.4,
                order: 2,
                stack: 'generation'
            },
            // 4. Solar (Peaking)
            {
                label: 'Solar Gen',
                data: solarGen,
                backgroundColor: 'rgba(245, 158, 11, 0.85)', // Amber-500
                borderColor: '#F59E0B',
                borderWidth: 0,
                fill: true,
                pointRadius: 0,
                tension: 0.4,
                order: 1,
                stack: 'generation'
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        return context.dataset.label + ': ' + Math.round(context.raw) + ' MW';
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                stacked: true, // Enable stacking
                title: { display: true, text: 'Megawatts (MW)' },
                grid: { color: 'rgba(0,0,0,0.05)' }
            },
            x: { grid: { display: false } },
        },
    };

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
                            <div className="chart-container w-full h-[300px]">
                                <Line data={chartData} options={chartOptions} />
                            </div>
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

// Sub-components
function ControlInput({ label, value, setValue, max, step = 1, unit }: { label: string, value: number, setValue: (v: number) => void, max: number, step?: number, unit: string }) {
    return (
        <div>
            <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {label}
                </label>
                <span className="text-sm font-mono px-2 py-1 rounded text-energy-green bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
                    {value} {unit}
                </span>
            </div>
            <input
                type="range"
                min="0"
                max={max}
                step={step}
                value={value}
                onChange={(e) => setValue(parseInt(e.target.value))}
                className="w-full accent-energy-green"
            />
        </div>
    );
}

function LegendItem({ color, label }: { color: string, label: string }) {
    return (
        <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${color}`}></div> {label}
        </div>
    );
}

function KpiCard({ label, value, sub }: { label: string, value: string, sub: string }) {
    return (
        <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-slate-700 transition-colors duration-300 border border-gray-100 dark:border-slate-600">
            <div className="text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{label}</div>
            <div className="font-mono text-2xl font-bold text-energy-green">{value}</div>
            <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                {sub}
            </div>
        </div>
    );
}
