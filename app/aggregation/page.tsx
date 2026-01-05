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

import { Participant, TechCapacity, FinancialParams, SimulationResult, BatteryFinancialParams } from '@/lib/aggregation/types';
import { runAggregationSimulation } from '@/lib/aggregation/engine';
import { recommendPortfolio } from '@/lib/aggregation/optimizer';
import { loadERCOTPrices, getAvailableYears, getYearLabel } from '@/lib/aggregation/price-loader';
import ParticipantEditor from '@/components/aggregation/ParticipantEditor';
import BatteryFinancials from '@/components/aggregation/BatteryFinancials';
import { calculateBatteryCVTA, BatteryCVTAResult } from '@/lib/aggregation/battery-cvta';

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

    // 4. Price Data State
    const [selectedYear, setSelectedYear] = useState<number | 'Synthetic'>(2024);
    const [historicalPrices, setHistoricalPrices] = useState<number[] | null>(null);

    // 5. Battery Financial Params (CVTA)
    const [batteryParams, setBatteryParams] = useState<BatteryFinancialParams>({
        capacity_mw: 0,
        base_rate_monthly: 15000,      // $15k/MW-month default
        guaranteed_availability: 0.95,  // 95%
        guaranteed_rte: 0.85,           // 85%
        vom_rate: 2.5,                  // $2.5/MWh
        ancillary_type: 'Fixed',
        ancillary_input: 50000          // $50k/month default
    });

    const [cvtaResult, setCvtaResult] = useState<BatteryCVTAResult | null>(null);

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

    const handleInstantDemo = () => {
        // Clear and load demo scenario
        const demoParticipant: Participant = {
            id: Date.now().toString(),
            name: 'Hyperscale Graph DC',
            type: 'Data Center',
            load_mwh: 250000 // 250 GWh/yr ~ 28.5 MW avg
        };

        setParticipants([demoParticipant]);

        // Set portfolio for ~95% CFE
        setCapacities({
            Solar: 85,
            Wind: 60,
            'CCS Gas': 15,
            Geothermal: 0,
            Nuclear: 0,
            Battery_MW: 30,
            Battery_Hours: 4
        });

        // Set year to 2024
        setSelectedYear(2024);
    };

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
            const res = runAggregationSimulation(participants, capacities, financials, historicalPrices);
            setResult(res);

            // Calculate Battery CVTA if battery exists
            if (capacities.Battery_MW > 0 && res) {
                const cvta = calculateBatteryCVTA(
                    capacities.Battery_MW,
                    capacities.Battery_Hours,
                    res.battery_discharge,
                    res.battery_charge,
                    res.market_price_profile,
                    {
                        fixed_toll_mw_month: batteryParams.base_rate_monthly,
                        guaranteed_rte: batteryParams.guaranteed_rte,
                        vom_charge_mwh: batteryParams.vom_rate,
                        availability_factor: batteryParams.guaranteed_availability,
                        ancillary_revenue_monthly: batteryParams.ancillary_type === 'Fixed' ? batteryParams.ancillary_input : undefined,
                        ancillary_revenue_pct: batteryParams.ancillary_type === 'Dynamic' ? batteryParams.ancillary_input / 100 : undefined
                    }
                );
                setCvtaResult(cvta);

                // Update battery capacity in params for UI sync
                setBatteryParams(prev => ({ ...prev, capacity_mw: capacities.Battery_MW }));
            } else {
                setCvtaResult(null);
            }

            setLoading(false);
        }, 50);
    };

    // Load historical price data when year changes
    useEffect(() => {
        const loadPrices = async () => {
            if (selectedYear === 'Synthetic') {
                setHistoricalPrices(null);
                return;
            }

            const prices = await loadERCOTPrices(selectedYear);
            setHistoricalPrices(prices);
        };
        loadPrices();
    }, [selectedYear]);

    // Run sim whenever inputs change (debounced slightly?)
    useEffect(() => {
        if (participants.length > 0) {
            runSimulation();
        } else {
            setResult(null);
        }
    }, [participants, capacities, financials, historicalPrices]);

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
                    <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-6">
                            {/* Quick Actions */}
                            <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h2 className="text-lg font-semibold">Quick Actions</h2>
                                        <p className="text-sm text-[var(--text-secondary)]">Test scenarios instantly</p>
                                    </div>
                                    <button
                                        onClick={handleInstantDemo}
                                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md hover:from-indigo-600 hover:to-purple-700 transition font-medium shadow-md"
                                    >
                                        ⚡ Instant Demo (95% CFE)
                                    </button>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    Loads: 250 GWh Data Center • Portfolio: 85 MW Solar, 60 MW Wind, 15 MW CCS, 30 MW/4h Battery
                                </p>
                            </div>

                            {/* Participant Editor */}
                            <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm">
                                <ParticipantEditor
                                    participants={participants}
                                    onChange={setParticipants}
                                />
                            </div>
                        </div>

                        {/* Load Chart Preview */}
                        {result && (
                            <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm h-80">
                                <h3 className="text-sm font-medium mb-4">Aggregated Hourly Load (Sample Week)</h3>
                                <LoadChart result={result} />
                            </div>
                        )}
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
                            <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm" style={{ height: '500px' }}>
                                <h3 className="text-sm font-medium mb-4">Generation vs Load (Full Year - Daily Averages)</h3>
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
                                    <hr className="border-[var(--border-color)]" />
                                    <div>
                                        <label className="block text-sm mb-2 font-medium">Market Price Year</label>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value === 'Synthetic' ? 'Synthetic' : parseInt(e.target.value))}
                                            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--card-bg)]"
                                        >
                                            <option value="Synthetic">{getYearLabel('Synthetic')}</option>
                                            {getAvailableYears().map(year => (
                                                <option key={year} value={year}>{getYearLabel(year)}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                                            {selectedYear !== 'Synthetic' && historicalPrices
                                                ? `Using real ${selectedYear} HB_NORTH prices`
                                                : 'Using synthetic duck curve model'}
                                        </p>
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

                            {/* Battery Details (CVTA) */}
                            {capacities.Battery_MW > 0 && (
                                <details className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] shadow-sm">
                                    <summary className="px-6 py-4 cursor-pointer hover:bg-[var(--row-hover)] font-medium text-lg">
                                        🔋 Battery Details (CVTA Model)
                                    </summary>
                                    <div className="px-6 pb-6 pt-2 space-y-4">
                                        {/* CVTA Parameters */}
                                        <div className="grid grid-cols-2 gap-4 text-sm bg-[var(--bg-secondary)] rounded-lg p-4">
                                            <div>
                                                <label className="block text-[var(--text-secondary)] mb-1">Fixed Toll ($/MW-month)</label>
                                                <input
                                                    type="number"
                                                    value={batteryParams.base_rate_monthly}
                                                    onChange={(e) => setBatteryParams({ ...batteryParams, base_rate_monthly: parseFloat(e.target.value) || 0 })}
                                                    className="w-full px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--card-bg)]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[var(--text-secondary)] mb-1">Guaranteed RTE (%)</label>
                                                <input
                                                    type="number"
                                                    value={(batteryParams.guaranteed_rte * 100).toFixed(0)}
                                                    onChange={(e) => setBatteryParams({ ...batteryParams, guaranteed_rte: (parseFloat(e.target.value) || 0) / 100 })}
                                                    className="w-full px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--card-bg)]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[var(--text-secondary)] mb-1">VOM Rate ($/MWh)</label>
                                                <input
                                                    type="number"
                                                    value={batteryParams.vom_rate}
                                                    onChange={(e) => setBatteryParams({ ...batteryParams, vom_rate: parseFloat(e.target.value) || 0 })}
                                                    className="w-full px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--card-bg)]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[var(--text-secondary)] mb-1">Availability (%)</label>
                                                <input
                                                    type="number"
                                                    value={(batteryParams.guaranteed_availability * 100).toFixed(0)}
                                                    onChange={(e) => setBatteryParams({ ...batteryParams, guaranteed_availability: (parseFloat(e.target.value) || 0) / 100 })}
                                                    className="w-full px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--card-bg)]"
                                                />
                                            </div>
                                        </div>

                                        {/* CVTA Results Display */}
                                        <BatteryFinancials cvtaResult={cvtaResult} />
                                    </div>
                                </details>
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
    // Aggregate hourly data to daily averages for full year visualization
    const aggregateToDaily = (hourlyData: number[]) => {
        const daily: number[] = [];
        for (let day = 0; day < 365; day++) {
            const startHour = day * 24;
            const endHour = Math.min(startHour + 24, hourlyData.length);
            const dayTotal = hourlyData.slice(startHour, endHour).reduce((a, b) => a + b, 0);
            daily.push(dayTotal / (endHour - startHour)); // Average MW for the day
        }
        return daily;
    };

    const days = Array.from({ length: 365 }, (_, i) => i + 1);

    // Aggregate each technology to daily averages
    const solar = aggregateToDaily(result.solar_profile);
    const wind = aggregateToDaily(result.wind_profile);
    const geo = aggregateToDaily(result.geo_profile);
    const nuc = aggregateToDaily(result.nuc_profile);
    const ccs = aggregateToDaily(result.ccs_profile);
    const battery = aggregateToDaily(result.battery_discharge);
    const deficit = aggregateToDaily(result.deficit_profile);

    const data = {
        labels: days,
        datasets: [
            {
                label: 'Solar',
                data: solar,
                backgroundColor: '#fbbf24', // Amber/Gold
                fill: true,
                pointRadius: 0
            },
            {
                label: 'Wind',
                data: wind,
                backgroundColor: '#60a5fa', // Sky Blue
                fill: true,
                pointRadius: 0
            },
            {
                label: 'CCS Gas',
                data: ccs,
                backgroundColor: '#a78bfa', // Purple
                fill: true,
                pointRadius: 0
            },
            {
                label: 'Geothermal',
                data: geo,
                backgroundColor: '#f97316', // Orange
                fill: true,
                pointRadius: 0
            },
            {
                label: 'Nuclear',
                data: nuc,
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
        scales: {
            y: {
                stacked: true,
                title: { display: true, text: 'Average MW' }
            },
            x: {
                title: { display: true, text: 'Day of Year' },
                ticks: { maxTicksLimit: 12 }
            }
        },
        elements: { line: { borderWidth: 0 } },
        plugins: {
            tooltip: { mode: 'index', intersect: false },
            legend: { display: true, position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
        }
    }} />;
}


