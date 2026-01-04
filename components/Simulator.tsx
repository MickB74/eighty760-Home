'use client';

import { useState, useEffect, useCallback } from 'react';
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

// Simulation data
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const BASE_LOAD_PROFILE = [
    10, 10, 10, 10, 15, 25, 45, 65, 80, 85, 85, 80,
    80, 85, 85, 80, 65, 45, 25, 20, 15, 10, 10, 10
];
const SOLAR_PROFILE = HOURS.map(h => {
    if (h < 6 || h > 18) return 0;
    return Math.sin(((h - 6) * Math.PI) / 12);
});
const WIND_PROFILE = HOURS.map(h => 0.5 + 0.3 * Math.cos(((h - 4) * Math.PI) / 12));

export default function Simulator() {
    const [solarCap, setSolarCap] = useState(50);
    const [windCap, setWindCap] = useState(30);
    const [batteryCap, setBatteryCap] = useState(0);
    const [metrics, setMetrics] = useState({
        cfeScore: 0,
        gridNeeded: 0,
        overGen: 0,
    });

    useEffect(() => {
        runSimulation();
    }, [solarCap, windCap, batteryCap]);

    const runSimulation = () => {
        // Calculate generation
        const solarGen = SOLAR_PROFILE.map(v => v * solarCap);
        const windGen = WIND_PROFILE.map(v => v * windCap);

        // Battery simulation
        let currentCharge = batteryCap * 0.5;
        const BATTERY_EFFICIENCY = 0.85;
        const batteryDischarge = [];

        for (let i = 0; i < 24; i++) {
            const totalRenewable = solarGen[i] + windGen[i];
            const load = BASE_LOAD_PROFILE[i];
            const net = totalRenewable - load;

            let discharged = 0;

            if (net > 0) {
                const space = batteryCap - currentCharge;
                const charged = Math.min(net, space);
                currentCharge += charged * BATTERY_EFFICIENCY;
            } else if (net < 0) {
                const deficit = Math.abs(net);
                const maxOutput = currentCharge;
                discharged = Math.min(deficit, maxOutput);
                currentCharge -= discharged;
            }

            batteryDischarge.push(discharged);
        }

        // Calculate KPIs
        let totalLoad = 0;
        let totalMatched = 0;
        let totalOver = 0;
        let totalGrid = 0;

        for (let i = 0; i < 24; i++) {
            const load = BASE_LOAD_PROFILE[i];
            const gen = solarGen[i] + windGen[i] + batteryDischarge[i];

            totalLoad += load;
            const match = Math.min(gen, load);
            totalMatched += match;

            if (gen > load) totalOver += (gen - load);
            if (gen < load) totalGrid += (load - gen);
        }

        const cfeScore = totalLoad > 0 ? (totalMatched / totalLoad) * 100 : 0;

        setMetrics({
            cfeScore: Math.round(cfeScore * 10) / 10,
            gridNeeded: Math.round(totalGrid),
            overGen: Math.round(totalOver),
        });
    };

    const chartData = {
        labels: HOURS.map(h => `${h}:00`),
        datasets: [
            {
                label: 'Load (MW)',
                data: BASE_LOAD_PROFILE,
                borderColor: '#333333',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                tension: 0.4,
            },
            {
                label: 'Solar Gen',
                data: SOLAR_PROFILE.map(v => v * solarCap),
                backgroundColor: 'rgba(245, 158, 11, 0.85)',
                borderColor: '#F59E0B',
                borderWidth: 0,
                fill: true,
                pointRadius: 0,
                tension: 0.4,
            },
            {
                label: 'Wind Gen',
                data: WIND_PROFILE.map(v => v * windCap),
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
            },
            x: { grid: { display: false } },
        },
    };

    return (
        <section id="simulator" className="py-16" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-10 text-center">
                    <h2 className="text-3xl font-bold brand-text">Interactive Portfolio Simulator</h2>
                    <p className="mt-2 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        Experience the <strong>Methodology</strong> described in the whitepaper. Adjust the generation
                        capacities below to see how they stack up against a typical Office building load profile.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Controls */}
                    <div className="p-6 rounded-lg lg:col-span-1" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <h3 className="text-lg font-bold brand-text mb-6 flex items-center gap-2">
                            <span>🎛️</span> Portfolio Inputs
                        </h3>

                        <div className="space-y-8">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        Solar Capacity
                                    </label>
                                    <span
                                        className="text-sm font-mono px-2 py-1 rounded"
                                        style={{ color: 'var(--brand-color)', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
                                    >
                                        {solarCap} MW
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="200"
                                    value={solarCap}
                                    onChange={(e) => setSolarCap(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        Wind Capacity
                                    </label>
                                    <span
                                        className="text-sm font-mono px-2 py-1 rounded"
                                        style={{ color: 'var(--brand-color)', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
                                    >
                                        {windCap} MW
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="200"
                                    value={windCap}
                                    onChange={(e) => setWindCap(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        Battery Storage
                                    </label>
                                    <span
                                        className="text-sm font-mono px-2 py-1 rounded"
                                        style={{ color: 'var(--brand-color)', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
                                    >
                                        {batteryCap} MWh
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="500"
                                    step="10"
                                    value={batteryCap}
                                    onChange={(e) => setBatteryCap(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Visualization */}
                    <div
                        className="p-6 rounded-lg lg:col-span-2 flex flex-col shadow-sm"
                        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                24-Hour Generation Profile
                            </h3>
                            <div className="flex gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-gray-800 rounded-full"></div> Load
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B' }}></div> Solar
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#6699CC' }}></div> Wind
                                </div>
                            </div>
                        </div>

                        <div className="flex-grow flex items-center justify-center rounded-lg p-2" style={{ backgroundColor: 'var(--card-bg)' }}>
                            <div className="chart-container">
                                <Line data={chartData} options={chartOptions} />
                            </div>
                        </div>

                        {/* KPIs */}
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <div className="stMetric text-center">
                                <div className="stMetricLabel mb-1">CFE Score</div>
                                <div className="stMetricValue">{metrics.cfeScore}%</div>
                                <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                    Hourly Match
                                </div>
                            </div>
                            <div className="stMetric text-center">
                                <div className="stMetricLabel mb-1">Grid Needed</div>
                                <div className="stMetricValue">{metrics.gridNeeded.toLocaleString()}</div>
                                <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                    MWh Deficit
                                </div>
                            </div>
                            <div className="stMetric text-center">
                                <div className="stMetricLabel mb-1">Overgeneration</div>
                                <div className="stMetricValue">{metrics.overGen.toLocaleString()}</div>
                                <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                    MWh Surplus
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
