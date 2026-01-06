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
import Navigation from '@/components/Navigation';
import InfoTooltip from '@/components/shared/InfoTooltip';

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
    // activeTab removed (layout change)
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
        rec_price: 5, market_price_avg: 35, market_year: 2024,
        use_scarcity: false, scarcity_intensity: 1.0
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
        // Clear and load demo scenario with 3 random participants
        const locations = ['North Zone', 'South Zone', 'West Zone', 'Houston', 'Coastal', 'Panhandle'];
        const types: Array<Participant['type']> = ['Data Center', 'Manufacturing', 'Office'];

        // Shuffle locations to get 3 unique ones
        const shuffledLocs = [...locations].sort(() => 0.5 - Math.random()).slice(0, 3);

        const newParticipants: Participant[] = shuffledLocs.map((loc, i) => {
            const type = types[Math.floor(Math.random() * types.length)];
            let baseLoad = 50000;
            if (type === 'Data Center') baseLoad = 150000 + Math.random() * 100000;
            if (type === 'Manufacturing') baseLoad = 80000 + Math.random() * 50000;
            if (type === 'Office') baseLoad = 20000 + Math.random() * 20000;

            return {
                id: Date.now().toString() + i,
                name: `${loc} ${type}`,
                type: type,
                load_mwh: Math.round(baseLoad)
            };
        });

        setParticipants(newParticipants);

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
        <main className="min-h-screen bg-[var(--bg-primary)]">
            <Navigation />

            <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
                {/* Sidebar - Configuration */}
                <div className="w-full lg:w-96 p-6 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-y-auto h-auto lg:h-[calc(100vh-80px)]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold brand-text">Configuration</h2>
                        <button
                            onClick={handleSmartFill}
                            disabled={loading}
                            className="text-xs bg-[var(--bg-tertiary)] text-[var(--brand-color)] px-2 py-1 rounded border border-[var(--border-color)] hover:bg-[var(--row-hover)] disabled:opacity-50"
                        >
                            ✨ Smart Fill
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* 1. Market & Financials */}
                        <section>
                            <h3 className="font-semibold mb-3 border-b border-[var(--border-color)] pb-1">1. Market Settings</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-[var(--text-secondary)] block mb-1">Price Year</label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value === 'Synthetic' ? 'Synthetic' : parseInt(e.target.value))}
                                        className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm"
                                    >
                                        <option value="Synthetic">{getYearLabel('Synthetic')}</option>
                                        {getAvailableYears().map(year => (
                                            <option key={year} value={year}>{getYearLabel(year)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <label className="text-xs text-[var(--text-secondary)]">REC Price ($)</label>
                                            <InfoTooltip text="Cost to purchase Renewable Energy Certificates for unmatched load." />
                                        </div>
                                        <input
                                            type="number"
                                            className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm"
                                            value={financials.rec_price}
                                            onChange={(e) => setFinancials({ ...financials, rec_price: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <label className="text-xs text-[var(--text-secondary)]">Avg Market ($)</label>
                                            <InfoTooltip text="Average wholesale electricity price used for settlement calculations (approximate)." />
                                        </div>
                                        <input
                                            type="number"
                                            className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm"
                                            value={financials.market_price_avg}
                                            onChange={(e) => setFinancials({ ...financials, market_price_avg: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-medium">Scarcity REC Pricing</label>
                                            <InfoTooltip text="If enabled, REC prices will surge up to 500% during critical winter and summer grid stress hours, simulating scarcity pricing mechanisms." />
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={!!financials.use_scarcity}
                                            onChange={(e) => setFinancials({ ...financials, use_scarcity: e.target.checked })}
                                            className="accent-[#285477]"
                                        />
                                    </div>
                                    {financials.use_scarcity && (
                                        <div>
                                            <div className="flex justify-between items-center text-xs mb-1 text-[var(--text-secondary)]">
                                                <div className="flex items-center gap-1">
                                                    <span>Intensity</span>
                                                    <InfoTooltip text="Multiplier scalar. 1.0x = Standard Scarcity Logic. Higher values increase the price multiplier during stress events." />
                                                </div>
                                                <span>{financials.scarcity_intensity?.toFixed(1)}x</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="5"
                                                step="0.1"
                                                value={financials.scarcity_intensity}
                                                onChange={(e) => setFinancials({ ...financials, scarcity_intensity: parseFloat(e.target.value) })}
                                                className="w-full accent-[#285477]"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* 2. Portfolio Mix */}
                        <section>
                            <h3 className="font-semibold mb-3 border-b border-[var(--border-color)] pb-1">2. Portfolio Mix (MW)</h3>
                            <div className="space-y-4">
                                {(['Solar', 'Wind', 'CCS Gas', 'Geothermal', 'Nuclear'] as const).map(tech => (
                                    <div key={tech}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>{tech}</span>
                                            <span className="font-medium text-[var(--text-primary)]">{capacities[tech].toLocaleString(undefined, { maximumFractionDigits: 0 })} MW</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="500"
                                            step="1"
                                            value={capacities[tech]}
                                            onChange={(e) => setCapacities({ ...capacities, [tech]: parseFloat(e.target.value) })}
                                            className="w-full accent-[#285477]"
                                        />
                                    </div>
                                ))}

                                <div className="pt-2 border-t border-[var(--border-color)]">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>Battery Power</span>
                                        <span className="font-medium text-[var(--text-primary)]">{capacities.Battery_MW.toLocaleString(undefined, { maximumFractionDigits: 0 })} MW</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="500" step="1"
                                        value={capacities.Battery_MW}
                                        onChange={(e) => setCapacities({ ...capacities, Battery_MW: parseFloat(e.target.value) })}
                                        className="w-full accent-emerald-600"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>Duration</span>
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
                        </section>

                        {/* 3. Tech Colors / PPA Prices (Collapsible or just list) */}
                        <section>
                            <details className="text-sm">
                                <summary className="font-semibold cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Advanced PPA Pricing</summary>
                                <div className="mt-3 space-y-2 pl-2">
                                    {(['solar', 'wind', 'ccs', 'geo', 'nuc'] as const).map(tech => (
                                        <div key={tech} className="flex items-center justify-between text-xs">
                                            <label className="capitalize">{tech} PPA</label>
                                            <input
                                                type="number"
                                                className="w-16 px-1 py-0.5 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] text-right"
                                                value={(financials as any)[`${tech}_price`]}
                                                onChange={(e) => setFinancials({ ...financials, [`${tech}_price`]: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </details>
                        </section>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 lg:p-10 overflow-y-auto">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold brand-text">ERCOT North Aggregation</h1>
                            <p className="text-[var(--text-secondary)]">24/7 CFE Portfolio Optimization</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleInstantDemo}
                                className="px-4 py-2 bg-[var(--brand-color)] text-white rounded-md hover:opacity-90 transition font-medium shadow-sm text-sm"
                            >
                                ⚡ Load Demo
                            </button>
                        </div>
                    </div>

                    {/* Participant Editor (Collapsible or Card) */}
                    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Load Aggregation</h3>
                            <span className="text-sm text-[var(--text-secondary)]">
                                Total Load: <span className="font-bold text-[var(--text-primary)]">{(participants.reduce((a, b) => a + b.load_mwh, 0)).toLocaleString()} MWh</span>
                            </span>
                        </div>
                        <ParticipantEditor
                            participants={participants}
                            onChange={setParticipants}
                        />
                    </div>

                    {/* Results Section */}
                    {result ? (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* KPI Grid */}
                            {/* KPI Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                                <KPICard label="24/7 Score" value={(result.cfe_score * 100).toFixed(1) + '%'} sub="Hourly Match" />
                                <KPICard label="Annual Match" value={(result.total_load_mwh > 0 ? (result.total_gen_mwh / result.total_load_mwh * 100).toFixed(0) : '0') + '%'} sub="Gen / Load" />
                                <KPICard label="Grid Deficit" value={(result.total_load_mwh - result.total_matched_mwh).toLocaleString(undefined, { maximumFractionDigits: 0 })} sub="MWh Unmatched" />
                                <KPICard label="Overgeneration" value={result.surplus_profile.reduce((a, b) => a + b, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} sub="MWh Excess" />
                                <KPICard label="Clean Gen" value={result.total_gen_mwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub="MWh Annual" />
                                <KPICard label="Net Cost" value={'$' + (result.avg_cost_per_mwh).toFixed(2)} sub="per MWh Load" />
                            </div>

                            {/* Chart */}
                            <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm h-[500px]">
                                <h3 className="text-sm font-medium mb-4">Generation vs Load (Full Year)</h3>
                                <GenChart result={result} capacities={capacities} />
                            </div>

                            {/* Financial Summary Table */}
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
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-tertiary)] border-2 border-dashed border-[var(--border-color)] rounded-xl">
                            <div className="text-5xl mb-4">📊</div>
                            <p className="text-lg font-medium">Add Participants to Begin Simulation</p>
                            <p className="text-sm">Configure load participants above or click &quot;Load Demo&quot; to start.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
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


