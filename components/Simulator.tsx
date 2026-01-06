'use client';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
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
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function Simulator() {
    const {
        solarCap, setSolarCap,
        windCap, setWindCap,
        batteryCap, setBatteryCap,
        metrics,
        solarGen,
        windGen,
        baseLoad
    } = useSimulation();

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
            },
            {
                label: 'Solar Gen',
                data: solarGen,
                backgroundColor: 'rgba(245, 158, 11, 0.85)',
                borderColor: '#F59E0B',
                borderWidth: 0,
                fill: true,
                pointRadius: 0,
                tension: 0.4,
            },
            {
                label: 'Wind Gen',
                data: windGen,
                backgroundColor: 'rgba(102, 153, 204, 0.85)',
                borderColor: '#6699CC',
                borderWidth: 0,
                fill: true,
                pointRadius: 0,
                tension: 0.4,
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
                stacked: true,
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
                                label="Battery Storage"
                                value={batteryCap}
                                setValue={setBatteryCap}
                                max={500}
                                step={10}
                                unit="MWh"
                            />
                        </div>
                    </div>

                    {/* Visualization */}
                    <div className="p-6 rounded-lg lg:col-span-2 flex flex-col shadow-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 transition-colors duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                24-Hour Generation Profile
                            </h3>
                            <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                                <LegendItem color="bg-gray-800" label="Load" />
                                <LegendItem color="bg-amber-500" label="Solar" />
                                <LegendItem color="bg-[#6699CC]" label="Wind" />
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

// Sub-components for cleaner code
function ControlInput({ label, value, setValue, max, step = 1, unit }: { label: string, value: number, setValue: (v: number) => void, max: number, step?: number, unit: string }) {
    return (
        <div>
            <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {label}
                </label>
                <span className="text-sm font-mono px-2 py-1 rounded text-brand dark:text-brand-light bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
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
                className="w-full"
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
        <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-slate-700 transition-colors duration-300">
            <div className="text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{label}</div>
            <div className="font-mono text-2xl font-bold text-brand dark:text-brand-light">{value}</div>
            <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                {sub}
            </div>
        </div>
    );
}
