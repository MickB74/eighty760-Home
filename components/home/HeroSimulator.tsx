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

export default function HeroSimulator() {
    const {
        solarCap, setSolarCap,
        windCap, setWindCap,
        nuclearCap, setNuclearCap,
        geothermalCap, setGeothermalCap,
        loadLevel, setLoadLevel,
        buildingType, setBuildingType,
        metrics,
        solarGen,
        windGen,
        nuclearGen,
        geothermalGen,
        baseLoad
    } = useSimulation();

    const chartData = {
        labels: HOURS.map(h => `${h}:00`),
        datasets: [
            {
                label: 'Geothermal',
                data: geothermalGen,
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderColor: '#EF4444',
                borderWidth: 0,
                fill: true,
                pointRadius: 0,
                tension: 0, // Baseload - strictly flat
                stack: 'generation'
            },
            {
                label: 'Nuclear',
                data: nuclearGen,
                backgroundColor: 'rgba(168, 85, 247, 0.8)',
                borderColor: '#A855F7',
                borderWidth: 0,
                fill: true,
                pointRadius: 0,
                tension: 0, // Baseload - strictly flat
                stack: 'generation'
            },
            {
                label: 'Wind',
                data: windGen,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: '#3B82F6',
                borderWidth: 0,
                fill: true,
                pointRadius: 0,
                tension: 0.4,
                stack: 'generation'
            },
            {
                label: 'Solar',
                data: solarGen,
                backgroundColor: 'rgba(245, 158, 11, 0.8)',
                borderColor: '#F59E0B',
                borderWidth: 0,
                fill: true,
                pointRadius: 0,
                tension: 0.4,
                stack: 'generation'
            },
            {
                label: 'Load',
                data: baseLoad,
                borderColor: '#ffffff',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                tension: 0.4,
                stack: 'load'
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
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                callbacks: {
                    label: function (context: any) {
                        return context.dataset.label + ': ' + Math.round(context.raw) + ' MW';
                    },
                },
            },
        },
        scales: {
            y: {
                display: false, // Hide Y axis for cleaner look
                beginAtZero: true,
                stacked: true,
            },
            x: { display: false }, // Hide X axis
        },
    };

    return (
        <div className="bg-[#0f1218] border border-white/5 rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-700">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white">Live Simulator</h3>
                    <p className="text-xs text-gray-400">Adjust capacity to match 24h load</p>
                </div>
                <div className="flex gap-2 text-[10px] font-mono uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>Load</div>
                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>Sun</div>
                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>Wind</div>
                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>Nuc</div>
                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>Geo</div>
                </div>
            </div>

            {/* Inputs & Chart Container */}
            <div className="flex flex-col gap-6">

                {/* Scenario Settings */}
                <div className="flex items-center justify-between gap-4 bg-white/5 p-3 rounded-lg border border-white/5">
                    <div className="flex flex-col gap-1 w-1/2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Building Type</label>
                        <select
                            value={buildingType}
                            onChange={(e) => setBuildingType(e.target.value)}
                            className="bg-[#0f1218] text-white text-xs border border-white/20 rounded px-2 py-1 outline-none focus:border-energy-green"
                        >
                            <option value="Office">Office Building</option>
                            <option value="Data Center">Data Center</option>
                            <option value="EV Fleet">EV Fleet Depot</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1 w-1/2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Load</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range" min="10" max="200" value={loadLevel}
                                onChange={(e) => setLoadLevel(parseInt(e.target.value))}
                                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                            <span className="text-xs font-mono text-white">{loadLevel}MW</span>
                        </div>
                    </div>
                </div>

                {/* Generation Inputs Row */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                    <CompactInput label="Solar" value={solarCap} setValue={setSolarCap} max={150} unit="MW" color="accent-amber-500" />
                    <CompactInput label="Wind" value={windCap} setValue={setWindCap} max={150} unit="MW" color="accent-blue-500" />
                    <CompactInput label="Nuclear" value={nuclearCap} setValue={setNuclearCap} max={50} unit="MW" color="accent-purple-500" />
                    <CompactInput label="Geothermal" value={geothermalCap} setValue={setGeothermalCap} max={50} unit="MW" color="accent-red-500" />
                </div>

                {/* Chart */}
                <div className="h-[180px] w-full bg-white/5 rounded-lg border border-white/5 relative">
                    <div className="absolute inset-0 p-2">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-3 gap-2">
                    <KPICard label="CFE Score" value={metrics.cfeScore} unit="%" good={metrics.cfeScore > 80} />
                    <KPICard label="Grid Deficit" value={metrics.gridNeeded} unit="MWh" good={metrics.gridNeeded === 0} inverse />
                    <KPICard label="Surplus" value={metrics.overGen} unit="MWh" good={false} neutral />
                </div>
            </div>
        </div>
    );
}

function CompactInput({ label, value, setValue, max, unit, color }: any) {
    return (
        <div>
            <div className="flex justify-between text-xs mb-2">
                <span className="font-semibold text-gray-300">{label}</span>
                <span className="font-mono text-white opacity-80">{value} <span className="text-[10px] text-gray-500">{unit}</span></span>
            </div>
            <input
                type="range"
                min="0"
                max={max}
                value={value}
                onChange={(e) => setValue(parseInt(e.target.value))}
                className={`w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer ${color}`}
            />
        </div>
    );
}

function KPICard({ label, value, unit, good, inverse, neutral }: any) {
    let colorClass = "text-white";
    if (!neutral) {
        if (inverse) {
            // Lower is better (Deficit)
            colorClass = value === 0 ? "text-emerald-400" : "text-amber-400";
            if (value > 100) colorClass = "text-red-400";
        } else {
            // Higher is better (Score)
            colorClass = good ? "text-emerald-400" : "text-amber-400";
            if (value < 50) colorClass = "text-red-400";
        }
    }

    return (
        <div className="bg-white/5 rounded p-3 text-center border border-white/5">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">{label}</div>
            <div className={`text-xl font-bold font-mono ${colorClass}`}>
                {Math.round(value).toLocaleString()} <span className="text-xs opacity-60 font-sans text-gray-400">{unit}</span>
            </div>
        </div>
    )
}
