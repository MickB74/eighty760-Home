import React, { useState, useEffect } from 'react';
import { Scenario } from '@/lib/shared/portfolioStore';
import { SimulationResult, AggregationState } from '@/lib/aggregation/types';
import { runAggregationSimulation } from '@/lib/aggregation/engine';
import { loadHubPrices, loadAveragePriceProfile } from '@/lib/aggregation/price-loader';
import { generateHourlyCSV, downloadCSV, generateCSVFilename } from '@/lib/utils/csv-export';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface ScenarioComparisonTabProps {
    scenarios: Scenario[];
    onLoadScenario: (scenario: Scenario) => void;
}

export default function ScenarioComparisonTab({ scenarios, onLoadScenario }: ScenarioComparisonTabProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [results, setResults] = useState<Record<string, SimulationResult>>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');

    // Limit selection to 5
    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                if (next.size >= 5) return prev; // Max 5
                next.add(id);
            }
            return next;
        });
    };

    const selectedScenarios = scenarios.filter(s => selectedIds.has(s.id));

    // Run simulations for selected scenarios
    useEffect(() => {
        const runSimulations = async () => {
            if (selectedScenarios.length === 0) {
                setResults({});
                return;
            }

            // identify new scenarios to run (cache check could be done via results key)
            // For now, simpler to just re-run all selected to ensure consistency or filtered list
            // Optimization: Only run for IDs not already in `results` OR if we want to support dynamic updates (scenarios are static usually)

            const missingIds = selectedScenarios.filter(s => !results[s.id]).map(s => s.id);
            if (missingIds.length === 0) return; // All loaded

            setLoading(true);
            setLoadingMessage('Preparing simulations...');

            const newResults = { ...results };

            for (const scenario of selectedScenarios) {
                if (newResults[scenario.id]) continue; // Skip if already calculated

                setLoadingMessage(`Simulating: ${scenario.name}...`);

                // 1. Load Prices
                let historicalPrices: number[] | null = null;
                if (scenario.year === 'Average') {
                    // Approximate average if that's what was saved (logic mirrored from Client)
                    const allYears = Array.from({ length: 16 }, (_, i) => 2010 + i);
                    historicalPrices = await loadAveragePriceProfile(allYears);
                } else {
                    historicalPrices = await loadHubPrices(scenario.year, scenario.loadHub);
                }

                if (!historicalPrices) {
                    console.error(`Failed to load prices for scenario ${scenario.name}`);
                    continue;
                }


                // 2. Load Profiles for Assets
                const genProfiles: Record<string, number[]> = {};
                // optimization: fetch in parallel
                const profilePromises = scenario.assets.map(async (asset) => {
                    if (asset.type === 'Solar' || asset.type === 'Wind') {

                        // Determine URL (assuming TMY logic stored in future, current scenarios might not have TMY flag, defaulting to Year)
                        // If we wanted TMY support here we'd need it in Scenario object. 
                        // Fallback: If year is number, use year.

                        let url = '';
                        if (typeof scenario.year === 'number') {
                            url = `/data/profiles/${asset.type}_${asset.location}_${scenario.year}.json`;
                        } else {
                            // Fallback for Average/TMY cases if not explicit
                            url = `/data/profiles/${asset.type}_${asset.location}_TMY.json`;
                        }

                        try {
                            const res = await fetch(url);
                            if (res.ok) {
                                const data = await res.json();
                                genProfiles[asset.id] = data;
                            }
                        } catch (e) {
                            console.error(`Failed to load profile for ${asset.name}`, e);
                        }
                    }
                });

                await Promise.all(profilePromises);

                // 3. Run Simulation
                const res = runAggregationSimulation(
                    scenario.participants,
                    scenario.assets,
                    scenario.financials,
                    historicalPrices,
                    { mw: scenario.battery.mw, hours: scenario.battery.hours },
                    {}, // allHubPrices - strictly needed for precise multi-hub revenue, but might be overkill to fetch ALL hubs for comparison. 
                    // If we pass empty, engine might fallback or use LoadHub price. 
                    // To be accurate, we should load asset hub prices if they differ from load hub.
                    genProfiles
                );

                if (res) {
                    newResults[scenario.id] = res;
                }
            }

            setResults(newResults);
            setLoading(false);
            setLoadingMessage('');
        };

        runSimulations();
    }, [selectedIds, scenarios]); // Re-run if selection changes

    // Colors for the charts
    const getScenarioColor = (index: number) => {
        const colors = ['#00ff88', '#3b82f6', '#facc15', '#f97316', '#ec4899'];
        return colors[index % colors.length];
    };

    // Prepare Chart Data
    const cfeChartData = {
        labels: selectedScenarios.map(s => s.name),
        datasets: [{
            label: '24/7 CFE Score (%)',
            data: selectedScenarios.map(s => (results[s.id]?.cfe_score || 0) * 100),
            backgroundColor: selectedScenarios.map((_, i) => getScenarioColor(i)),
            borderRadius: 8
        }]
    };

    const costChartData = {
        labels: selectedScenarios.map(s => s.name),
        datasets: [{
            label: 'Net Portfolio Cost (k$)', // Using Total Net Cost
            data: selectedScenarios.map(s => (results[s.id]?.total_cost_net || 0) / 1000),
            backgroundColor: selectedScenarios.map((_, i) => getScenarioColor(i)),
            borderRadius: 8
        }]
    };

    const exportScenariosToCSV = () => {
        const selectedResults = selectedScenarios.filter(s => results[s.id]);

        if (selectedResults.length === 0) {
            alert('No scenarios with results to export. Please wait for simulations to complete.');
            return;
        }

        // Export each scenario's 8760 hourly data
        selectedResults.forEach(scenario => {
            const csvContent = generateHourlyCSV(results[scenario.id], scenario.year, scenario.name);
            const filename = generateCSVFilename('scenario_comparison', scenario.year, scenario.name);
            downloadCSV(csvContent, filename);
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            {/* 1. Selection Area */}
            <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-navy-950 dark:text-white">Select Scenarios (Max 5)</h3>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{selectedIds.size} selected</span>
                        <button
                            onClick={exportScenariosToCSV}
                            disabled={selectedIds.size === 0 || loading}
                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20 text-sm"
                        >
                            Download CSV
                        </button>
                    </div>
                </div>

                {scenarios.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No saved scenarios yet. Create some in the Dashboard tab!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {scenarios.map((s, i) => (
                            <div
                                key={s.id}
                                onClick={() => handleToggleSelect(s.id)}
                                className={`cursor-pointer p-4 rounded-xl border transition-all ${selectedIds.has(s.id)
                                    ? 'border-energy-green bg-energy-green/10 dark:bg-energy-green/5'
                                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold text-navy-950 dark:text-white truncate pr-2">{s.name}</div>
                                    <div className={`w-5 h-5 flex-shrink-0 rounded-full border flex items-center justify-center ${selectedIds.has(s.id) ? 'bg-energy-green border-energy-green' : 'border-gray-400'
                                        }`}>
                                        {selectedIds.has(s.id) && <div className="w-2 h-2 bg-navy-950 rounded-full" />}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 line-clamp-2 min-h-[2.5em]">{s.description || 'No description'}</div>
                                <div className="mt-3 flex justify-between items-center text-xs">
                                    <span className="bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-gray-600 dark:text-gray-300">{s.year} • {s.loadHub}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onLoadScenario(s); }}
                                        className="text-energy-green-dark dark:text-energy-green hover:underline font-medium"
                                    >
                                        Load
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 2. Loading State */}
            {loading && (
                <div className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-gray-200 dark:border-white/10 text-center animate-pulse">
                    <div className="text-xl font-bold mb-2 text-energy-green">Running Simulations...</div>
                    <div className="text-sm text-gray-500">{loadingMessage}</div>
                </div>
            )}

            {/* 3. Comparison Metrics & Charts */}
            {!loading && selectedIds.size > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Metrics Table */}
                    <div className="col-span-1 lg:col-span-2 bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10 overflow-x-auto">
                        <h3 className="text-lg font-bold mb-4 text-navy-950 dark:text-white">Metrics Comparison</h3>
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-white/10 text-gray-500">
                                    <th className="py-2 pr-4">Metric</th>
                                    {selectedScenarios.map(s => (
                                        <th key={s.id} className="py-2 px-4 font-bold text-navy-950 dark:text-white whitespace-nowrap">
                                            {s.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                <tr>
                                    <td className="py-3 font-medium text-gray-700 dark:text-gray-300">24/7 CFE Score</td>
                                    {selectedScenarios.map(s => (
                                        <td key={s.id} className="py-3 px-4 font-bold text-energy-green-dark dark:text-energy-green">
                                            {results[s.id] ? (results[s.id].cfe_score * 100).toFixed(1) + '%' : '-'}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="py-3 font-medium text-gray-700 dark:text-gray-300">Total Net Cost</td>
                                    {selectedScenarios.map(s => (
                                        <td key={s.id} className="py-3 px-4">
                                            {results[s.id] ? '$' + results[s.id].total_cost_net.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="py-3 font-medium text-gray-700 dark:text-gray-300">Avg Cost / MWh</td>
                                    {selectedScenarios.map(s => (
                                        <td key={s.id} className="py-3 px-4">
                                            {results[s.id] ? '$' + results[s.id].avg_cost_per_mwh.toFixed(2) : '-'}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="py-3 font-medium text-gray-700 dark:text-gray-300">Grid Deficit (MWh)</td>
                                    {selectedScenarios.map(s => (
                                        <td key={s.id} className="py-3 px-4">
                                            {results[s.id] ? (results[s.id].total_load_mwh - results[s.id].total_matched_mwh).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="py-3 font-medium text-gray-700 dark:text-gray-300">Clean Gen (MWh)</td>
                                    {selectedScenarios.map(s => (
                                        <td key={s.id} className="py-3 px-4">
                                            {results[s.id] ? results[s.id].total_gen_mwh.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Charts */}
                    <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10 h-[300px]">
                        <Bar
                            data={cfeChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false }, title: { display: true, text: '24/7 CFE Score' } },
                                scales: { y: { min: 0, max: 100 } }
                            }}
                        />
                    </div>
                    <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10 h-[300px]">
                        <Bar
                            data={costChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false }, title: { display: true, text: 'Net Portfolio Cost ($k)' } }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
