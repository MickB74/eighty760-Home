'use client';

import React, { useState, useEffect } from 'react';
import { Chart } from 'react-chartjs-2';
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

import { Participant, TechCapacity, FinancialParams, SimulationResult } from '@/lib/aggregation/types';
import { runAggregationSimulation } from '@/lib/aggregation/engine';
import { recommendPortfolio } from '@/lib/aggregation/optimizer';

// Register ChartJS
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

// --- Component ---
export default function AggregationPage() {
    // --- State ---
    const [activeTab, setActiveTab] = useState<'load' | 'gen' | 'fin' | 'batt'>('load');
    const [loading, setLoading] = useState(false);

    // 1. Load State
    const [participants, setParticipants] = useState<Participant[]>([]);

    // 2. Gen State
    const [capacities, setCapacities] = useState<TechCapacity>({
        Solar: 0, Wind: 0, Geothermal: 0, Nuclear: 0, 'CCS Gas': 0, Battery_MW: 0, Battery_Hours: 2
    });

    // 3. Financial State
    const [financials, setFinancials] = useState<FinancialParams>({
        solar_price: 35, wind_price: 25, geo_price: 75, nuc_price: 90, ccs_price: 85,
        rec_price: 5, market_price_avg: 35, market_year: 2024
    });

    // Results
    const [result, setResult] = useState<SimulationResult | null>(null);

    // --- Handlers ---

    const handleAddParticipant = () => {
        // Demo Logic: Add a random participant
        const id = Math.random().toString(36).substr(2, 9);
        const types: any[] = ['Data Center', 'Manufacturing', 'Office'];
        const type = types[Math.floor(Math.random() * types.length)];
        const load = type === 'Data Center' ? 250000 : (type === 'Manufacturing' ? 100000 : 50000);

        setParticipants([...participants, {
            id,
            name: `${type} ${participants.length + 1}`,
            type,
            load_mwh: load
        }]);
    };

    const handleClearParticipants = () => setParticipants([]);

    const handleSmartFill = () => {
        setLoading(true);
        setTimeout(() => { // Yield to UI
            const totalLoad = participants.reduce((a, b) => a + b.load_mwh, 0);
            if (totalLoad > 0) {
                // Determine dominant type for optimization profile
                const rec = recommendPortfolio(totalLoad, 'Data Center', 0.95, capacities);
                setCapacities(rec);
            }
            setLoading(false);
        }, 100);
    };

    const runSimulation = () => {
        setLoading(true);
        setTimeout(() => {
            const res = runAggregationSimulation(participants, capacities, financials);
            setResult(res);
            setLoading(false);
        }, 50);
    };

    // Run sim whenever inputs change (debounced slightly?)
    useEffect(() => {
        if (participants.length > 0) {
            runSimulation();
        } else {
            setResult(null);
        }
    }, [participants, capacities, financials]);

    // --- Render ---

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-20">

            {/* Header */}
            <div className="bg-[var(--nav-bg)] border-b border-[var(--border-color)] sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold">ERCOT North Aggregation</h1>
                    <p className="text-[var(--text-secondary)] text-sm">Aggregate loads and optimize 24/7 matching portfolios.</p>
                </div>

                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-6 overflow-x-auto">
                    {['load', 'gen', 'fin'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t as any)}
                            className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === t
                                    ? 'border-[#285477] text-[#285477]'
                                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            {t === 'load' && '1. Load Setup'}
                            {t === 'gen' && '2. Generation Portfolio'}
                            {t === 'fin' && '3. Financial Analysis'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* TAB 1: LOAD */}
                {activeTab === 'load' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Inputs */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm">
                                <h2 className="text-lg font-semibold mb-4">Add Participant</h2>
                                <div className="space-y-4">
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Build your aggregation by adding simulated participants.
                                    </p>
                                    <button
                                        onClick={handleAddParticipant}
                                        className="w-full bg-[#285477] text-white py-2 rounded-md hover:bg-[#1d3f5a] transition"
                                    >
                                        + Add Random Participant
                                    </button>
                                    {participants.length > 0 && (
                                        <button
                                            onClick={handleClearParticipants}
                                            className="w-full bg-red-50 text-red-600 py-2 rounded-md hover:bg-red-100 transition border border-red-100"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* List & Chart */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm">
                                <h2 className="text-lg font-semibold mb-4">Current Aggregation</h2>
                                {participants.length === 0 ? (
                                    <div className="text-center py-12 text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-lg">
                                        No participants added.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-[var(--border-color)] text-left">
                                                    <th className="py-2">Name</th>
                                                    <th className="py-2">Type</th>
                                                    <th className="py-2 text-right">Annual Load (MWh)</th>
                                                    <th className="py-2"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {participants.map((p) => (
                                                    <tr key={p.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--row-hover)]">
                                                        <td className="py-3 font-medium">{p.name}</td>
                                                        <td className="py-3 text-[var(--text-secondary)]">{p.type}</td>
                                                        <td className="py-3 text-right">{p.load_mwh.toLocaleString()}</td>
                                                        <td className="py-3 text-right">
                                                            <button
                                                                onClick={() => setParticipants(participants.filter(x => x.id !== p.id))}
                                                                className="text-red-400 hover:text-red-600"
                                                            >
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-[var(--bg-secondary)] font-bold">
                                                    <td className="py-3 pl-2">Total</td>
                                                    <td></td>
                                                    <td className="py-3 text-right">{participants.reduce((a, b) => a + b.load_mwh, 0).toLocaleString()}</td>
                                                    <td></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Load Chart Preview */}
                            {result && (
                                <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm h-80">
                                    <h3 className="text-sm font-medium mb-4">Aggregated Hourly Load (Sample Week)</h3>
                                    <LoadChart result={result} />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 2: GEN */}
                {activeTab === 'gen' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold">Portfolio</h2>
                                    <button
                                        onClick={handleSmartFill}
                                        disabled={loading}
                                        className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 hover:bg-indigo-100"
                                    >
                                        ✨ Smart Fill
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    {(['Solar', 'Wind', 'CCS Gas', 'Geothermal', 'Nuclear'] as const).map(tech => (
                                        <div key={tech}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>{tech} (MW)</span>
                                                <span className="font-medium text-[var(--text-primary)]">{capacities[tech].toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="500" // Should operate on dynamic max based on load?
                                                step="1"
                                                value={capacities[tech]}
                                                onChange={(e) => setCapacities({ ...capacities, [tech]: parseFloat(e.target.value) })}
                                                className="w-full accent-[#285477]"
                                            />
                                        </div>
                                    ))}

                                    <hr className="border-[var(--border-color)]" />

                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>Battery Power (MW)</span>
                                            <span className="font-medium text-[var(--text-primary)]">{capacities.Battery_MW.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="500" step="1"
                                            value={capacities.Battery_MW}
                                            onChange={(e) => setCapacities({ ...capacities, Battery_MW: parseFloat(e.target.value) })}
                                            className="w-full accent-emerald-600"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>Duration (Hours)</span>
                                            <span className="font-medium text-[var(--text-primary)]">{capacities.Battery_Hours}h</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="8" step="0.5"
                                            value={capacities.Battery_Hours}
                                            onChange={(e) => setCapacities({ ...capacities, Battery_Hours: parseFloat(e.target.value) })}
                                            className="w-full accent-emerald-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            {/* KPI Display */}
                            {result && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <KPICard label="CFE Score" value={(result.cfe_score * 100).toFixed(1) + '%'} sub="24/7 Match" />
                                    <KPICard label="Grid Deficit" value={(result.total_load_mwh - result.total_matched_mwh).toLocaleString(undefined, { maximumFractionDigits: 0 })} sub="MWh Unmatched" />
                                    <KPICard label="Clean Gen" value={result.total_gen_mwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub="MWh Annual" />
                                    <KPICard label="Net Cost" value={'$' + (result.avg_cost_per_mwh).toFixed(2)} sub="per MWh Load" />
                                </div>
                            )}

                            {/* Hourly Stack Chart */}
                            <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm h-96">
                                <h3 className="text-sm font-medium mb-4">Generation vs Load (Sample Week)</h3>
                                {result && <GenChart result={result} capacities={capacities} />}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: FINANCIALS */}
                {activeTab === 'fin' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm">
                                <h2 className="text-lg font-semibold mb-4">Financial Assumptions</h2>
                                <div className="space-y-4">
                                    {(['solar', 'wind', 'ccs', 'geo', 'nuc'] as const).map(tech => (
                                        <div key={tech} className="flex items-center justify-between">
                                            <label className="text-sm capitalize">{tech} PPA ($/MWh)</label>
                                            <input
                                                type="number"
                                                className="w-20 px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] text-right"
                                                value={(financials as any)[`${tech}_price`]}
                                                onChange={(e) => setFinancials({ ...financials, [`${tech}_price`]: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    ))}
                                    <hr className="border-[var(--border-color)]" />
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm">REC Price ($)</label>
                                        <input
                                            type="number"
                                            className="w-20 px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] text-right"
                                            value={financials.rec_price}
                                            onChange={(e) => setFinancials({ ...financials, rec_price: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm">Avg Market Price ($)</label>
                                        <input
                                            type="number"
                                            className="w-20 px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] text-right"
                                            value={financials.market_price_avg}
                                            onChange={(e) => setFinancials({ ...financials, market_price_avg: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            {result && (
                                <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm">
                                    <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <tbody>
                                                <tr className="border-b border-[var(--border-color)]">
                                                    <td className="py-3 font-medium">Net Settlement Value (PPA vs Market)</td>
                                                    <td className={`py-3 text-right font-medium ${result.settlement_value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                        {result.settlement_value >= 0 ? '+' : ''}${result.settlement_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </td>
                                                </tr>
                                                <tr className="border-b border-[var(--border-color)]">
                                                    <td className="py-3">REC Cost (@ ${financials.rec_price})</td>
                                                    <td className="py-3 text-right text-red-500">-${result.rec_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                </tr>
                                                <tr className="border-b border-[var(--border-color)]">
                                                    <td className="py-3 font-medium text-lg">Total Net Portfolio Cost</td>
                                                    <td className="py-3 text-right font-bold text-lg text-[var(--text-primary)]">
                                                        ${result.total_cost_net.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="py-3 text-[var(--text-secondary)]">Levelized Cost to Load ($/MWh)</td>
                                                    <td className="py-3 text-right text-[var(--text-secondary)]">
                                                        ${result.avg_cost_per_mwh.toFixed(2)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Subcomponents ---

function KPICard({ label, value, sub }: { label: string, value: string, sub: string }) {
    return (
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm">
            <div className="text-[var(--text-secondary)] text-xs font-medium uppercase tracking-wider mb-1">{label}</div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">{value}</div>
            <div className="text-xs text-[var(--text-secondary)]">{sub}</div>
        </div>
    );
}

function LoadChart({ result }: { result: SimulationResult }) {
    // Sample first week (168 hours)
    const hours = Array.from({ length: 168 }, (_, i) => i);
    const data = {
        labels: hours,
        datasets: [{
            label: 'Total Load',
            data: result.load_profile.slice(0, 168),
            borderColor: '#285477',
            backgroundColor: 'rgba(40, 84, 119, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };
    return <Chart type='line' data={data} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, elements: { point: { radius: 0 } } }} />;
}

function GenChart({ result }: { result: SimulationResult, capacities: TechCapacity }) {
    // Sample week (e.g., Summer Peak: hours 4000-4168)
    const match = result.matched_profile.slice(4000, 4168);
    const deficit = result.deficit_profile.slice(4000, 4168);
    const battery = result.battery_discharge.slice(4000, 4168);
    const hours = Array.from({ length: 168 }, (_, i) => i);

    const data = {
        labels: hours,
        datasets: [
            {
                label: 'Matched Clean Energy',
                data: match,
                backgroundColor: '#22c55e', // Green
                fill: true,
                pointRadius: 0
            },
            {
                label: 'Battery Discharge',
                data: battery,
                backgroundColor: '#3b82f6', // Blue
                fill: true,
                pointRadius: 0
            },
            {
                label: 'Grid Deficit',
                data: deficit,
                backgroundColor: '#ef4444', // Red
                fill: true,
                pointRadius: 0
            }
        ]
    };

    return <Chart type='line' data={data} options={{
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { stacked: true }, x: { display: false } },
        elements: { line: { borderWidth: 0 } },
        plugins: { tooltip: { mode: 'index', intersect: false } }
    }} />;
}
