'use client';

import { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { calculateVPPASettlement, compareVPPAScenarios, VPPAScenario, VPPAResult } from '@/lib/vppa/vppa-engine';

Chart.register(...registerables);

export default function VPPAClient() {
    // Scenario builder state
    const [scenarioName, setScenarioName] = useState('Scenario 1');
    const [tech, setTech] = useState<'Solar' | 'Wind' | 'Nuclear' | 'Geothermal' | 'CCS Gas'>('Solar');
    const [year, setYear] = useState(2025);
    const [hub, setHub] = useState('North');
    const [capacityMW, setCapacityMW] = useState(100);
    const [strikePrice, setStrikePrice] = useState(50);
    const [allowCurtailment, setAllowCurtailment] = useState(false);

    // Scenarios and results
    const [scenarios, setScenarios] = useState<VPPAScenario[]>([]);
    const [results, setResults] = useState<VPPAResult[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);

    const handleAddScenario = () => {
        const newScenario: VPPAScenario = {
            name: scenarioName,
            tech,
            year,
            hub,
            capacity_mw: capacityMW,
            strike_price: strikePrice,
            allow_curtailment: allowCurtailment
        };

        setScenarios([...scenarios, newScenario]);
        setScenarioName(`Scenario ${scenarios.length + 2}`);
    };

    const handleRemoveScenario = (index: number) => {
        setScenarios(scenarios.filter((_, i) => i !== index));
    };

    const handleCalculate = async () => {
        setIsCalculating(true);

        try {
            // Import price and generation data
            const calculatedResults: VPPAResult[] = [];

            for (const scenario of scenarios) {
                // Load price data
                const priceResponse = await fetch(`/data/prices/ercot_rtm_${scenario.year}.json`);
                const priceData = await priceResponse.json();

                // Get prices for the specified hub
                const marketPrices = priceData[scenario.hub] || priceData['North'];

                // Load generation profile
                const genResponse = await fetch(`/data/generation/${scenario.tech.toLowerCase()}_${scenario.year}_${scenario.hub.toLowerCase()}.json`);
                let generationProfile: number[];

                if (genResponse.ok) {
                    const genData = await genResponse.json();
                    generationProfile = genData.map((v: number) => v * scenario.capacity_mw);
                } else {
                    // Fallback: use simple profile
                    generationProfile = generateFallbackProfile(scenario.tech, scenario.capacity_mw);
                }

                // Calculate settlement
                const result = calculateVPPASettlement(scenario, generationProfile, marketPrices);
                calculatedResults.push(result);
            }

            setResults(calculatedResults);
        } catch (error) {
            console.error('Error calculating settlements:', error);
            alert('Error calculating settlements. Please check console.');
        } finally {
            setIsCalculating(false);
        }
    };

    const handleExportCSV = () => {
        if (results.length === 0) return;

        const csvRows: string[] = [];
        csvRows.push('Scenario,Year,Hub,Tech,Capacity (MW),Strike Price ($/MWh),Total Settlement ($),Total Gen (MWh),Curtailed (MWh),Capture Price ($/MWh),Avg Hub Price ($/MWh)');

        results.forEach(r => {
            csvRows.push([
                r.scenario,
                r.year,
                r.hub,
                r.tech,
                r.capacity_mw.toFixed(2),
                r.strike_price.toFixed(2),
                r.total_settlement.toFixed(2),
                r.total_generation_mwh.toFixed(2),
                r.total_curtailed_mwh.toFixed(2),
                r.capture_price.toFixed(2),
                r.avg_hub_price.toFixed(2)
            ].join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vppa_settlements_${Date.now()}.csv`;
        link.click();
    };

    const comparison = compareVPPAScenarios(results);

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            <div className="flex h-screen">
                {/* Sidebar */}
                <div className="w-80 bg-navy-950 border-r border-white/10 overflow-y-auto p-6">
                    <h2 className="text-xl font-bold mb-4 brand-text">Scenario Builder</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-300 block mb-1">Scenario Name</label>
                            <input
                                type="text"
                                value={scenarioName}
                                onChange={(e) => setScenarioName(e.target.value)}
                                className="w-full p-2 rounded border border-white/10 bg-slate-800 text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-300 block mb-1">Technology</label>
                            <select
                                value={tech}
                                onChange={(e) => setTech(e.target.value as any)}
                                className="w-full p-2 rounded border border-white/10 bg-slate-800 text-sm"
                            >
                                <option value="Solar">Solar</option>
                                <option value="Wind">Wind</option>
                                <option value="Nuclear">Nuclear</option>
                                <option value="Geothermal">Geothermal</option>
                                <option value="CCS Gas">CCS Gas</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-gray-300 block mb-1">Year</label>
                            <select
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                className="w-full p-2 rounded border border-white/10 bg-slate-800 text-sm"
                            >
                                {[2020, 2021, 2022, 2023, 2024, 2025].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-gray-300 block mb-1">Hub</label>
                            <select
                                value={hub}
                                onChange={(e) => setHub(e.target.value)}
                                className="w-full p-2 rounded border border-white/10 bg-slate-800 text-sm"
                            >
                                {['North', 'South', 'West', 'Houston', 'Panhandle'].map(h => (
                                    <option key={h} value={h}>{h}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-gray-300 block mb-1">Capacity (MW)</label>
                            <input
                                type="number"
                                value={capacityMW}
                                onChange={(e) => setCapacityMW(parseFloat(e.target.value))}
                                className="w-full p-2 rounded border border-white/10 bg-slate-800 text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-300 block mb-1">VPPA Strike Price ($/MWh)</label>
                            <input
                                type="number"
                                value={strikePrice}
                                onChange={(e) => setStrikePrice(parseFloat(e.target.value))}
                                className="w-full p-2 rounded border border-white/10 bg-slate-800 text-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={allowCurtailment}
                                onChange={(e) => setAllowCurtailment(e.target.checked)}
                                className="accent-[#285477]"
                            />
                            <label className="text-xs text-gray-300">Allow Curtailment (@ $0/MWh)</label>
                        </div>

                        <button
                            onClick={handleAddScenario}
                            disabled={scenarios.length >= 10}
                            className="w-full px-4 py-2 bg-energy-green text-navy-950 rounded-md hover:opacity-90 transition font-medium disabled:opacity-50"
                        >
                            {scenarios.length >= 10 ? 'Max Scenarios (10)' : '+ Add Scenario'}
                        </button>
                    </div>

                    {/* Current Scenarios */}
                    {scenarios.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-semibold mb-2">Current Scenarios ({scenarios.length})</h3>
                            <div className="space-y-2">
                                {scenarios.map((sc, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                                        <span className="text-xs">{sc.name}</span>
                                        <button
                                            onClick={() => handleRemoveScenario(idx)}
                                            className="text-red-500 hover:text-red-400 text-sm"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleCalculate}
                                disabled={isCalculating}
                                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:opacity-90 transition font-medium disabled:opacity-50"
                            >
                                {isCalculating ? 'Calculating...' : '⚡ Calculate Settlements'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold brand-text mb-2">VPPA Settlement Calculator</h1>
                        <p className="text-gray-400">Compare Virtual Power Purchase Agreement scenarios across ERCOT markets</p>
                    </div>

                    {results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-white/10 rounded-xl">
                            <div className="text-5xl mb-4">⚡</div>
                            <p className="text-lg font-medium">Add Scenarios to Begin Analysis</p>
                            <p className="text-sm">Use the sidebar to create and compare VPPA scenarios</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Summary Table */}
                            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">Settlement Summary</h2>
                                    <button
                                        onClick={handleExportCSV}
                                        className="px-4 py-2 bg-energy-green text-navy-950 text-sm rounded-md hover:opacity-90"
                                    >
                                        📥 Export CSV
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10 text-left text-gray-400">
                                                <th className="pb-2">Scenario</th>
                                                <th className="pb-2 text-right">Net Settlement</th>
                                                <th className="pb-2 text-right">Total Gen (MWh)</th>
                                                <th className="pb-2 text-right">Capture Price</th>
                                                <th className="pb-2 text-right">Avg Hub Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.map((r, idx) => (
                                                <tr key={idx} className="border-b border-white/10 hover:bg-white/5">
                                                    <td className="py-3">{r.scenario}</td>
                                                    <td className={`py-3 text-right font-medium ${r.total_settlement >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                        ${r.total_settlement.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </td>
                                                    <td className="py-3 text-right">{r.total_generation_mwh.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                    <td className="py-3 text-right">${r.capture_price.toFixed(2)}/MWh</td>
                                                    <td className="py-3 text-right">${r.avg_hub_price.toFixed(2)}/MWh</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {results.length > 1 && (
                                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <h3 className="text-sm font-semibold mb-2">Key Insights</h3>
                                        <ul className="text-sm space-y-1">
                                            <li>• <strong>Best Performing:</strong> {comparison.best_scenario}</li>
                                            <li>• <strong>Lowest Performing:</strong> {comparison.worst_scenario}</li>
                                            <li>• <strong>Performance Spread:</strong> ${comparison.spread.toLocaleString(undefined, { maximumFractionDigits: 0 })}</li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Charts */}
                            <div className="grid lg:grid-cols-2 gap-6">
                                {/* Cumulative P&L */}
                                <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                                    <h3 className="text-lg font-semibold mb-4">Cumulative Settlement ($)</h3>
                                    <div className="h-80">
                                        <CumulativeChart results={results} />
                                    </div>
                                </div>

                                {/* Monthly Breakdown */}
                                <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                                    <h3 className="text-lg font-semibold mb-4">Monthly Settlement ($)</h3>
                                    <div className="h-80">
                                        <MonthlyChart results={results} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

// Helper: Generate fallback profile if data not available
function generateFallbackProfile(tech: string, capacity: number): number[] {
    const profile: number[] = [];
    for (let h = 0; h < 8760; h++) {
        const hourOfDay = h % 24;

        if (tech === 'Solar') {
            if (hourOfDay >= 6 && hourOfDay <= 18) {
                const solarFactor = Math.sin(((hourOfDay - 6) * Math.PI) / 12);
                profile.push(solarFactor * capacity);
            } else {
                profile.push(0);
            }
        } else if (tech === 'Wind') {
            const windFactor = 0.3 + 0.2 * Math.random();
            profile.push(windFactor * capacity);
        } else {
            // Baseload
            profile.push(capacity * 0.9);
        }
    }
    return profile;
}

// Chart Components
function CumulativeChart({ results }: { results: VPPAResult[] }) {
    const colors = ['#0171BB', '#FFC107', '#4CAF50', '#9C27B0', '#FF5722', '#607D8B'];

    const data = {
        labels: Array.from({ length: 365 }, (_, i) => i + 1),
        datasets: results.map((r, idx) => ({
            label: r.scenario,
            data: r.cumulative_settlements.filter((_, i) => i % 24 === 0), // Daily samples
            borderColor: colors[idx % colors.length],
            backgroundColor: colors[idx % colors.length] + '20',
            tension: 0.4,
            pointRadius: 0
        }))
    };

    return (
        <Line
            data={data}
            options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'top' } },
                scales: {
                    x: { title: { display: true, text: 'Day of Year' } },
                    y: { title: { display: true, text: 'Cumulative Settlement ($)' } }
                }
            }}
        />
    );
}

function MonthlyChart({ results }: { results: VPPAResult[] }) {
    const colors = ['#0171BB', '#FFC107', '#4CAF50', '#9C27B0', '#FF5722', '#607D8B'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const data = {
        labels: months,
        datasets: results.map((r, idx) => ({
            label: r.scenario,
            data: r.monthly_aggregates.map(m => m.settlement),
            backgroundColor: colors[idx % colors.length],
        }))
    };

    return (
        <Bar
            data={data}
            options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'top' } },
                scales: {
                    x: { title: { display: true, text: 'Month' } },
                    y: { title: { display: true, text: 'Settlement ($)' } }
                }
            }}
        />
    );
}
