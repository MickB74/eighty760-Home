import React, { useState, useEffect } from 'react';
import { Participant, GenerationAsset, FinancialParams, SimulationResult } from '@/lib/aggregation/types';
import { runAggregationSimulation } from '@/lib/aggregation/engine';
import { loadHubPrices, loadAveragePriceProfile, getAvailableYears } from '@/lib/aggregation/price-loader';
import { Bar, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

interface MultiYearAnalysisProps {
    participants: Participant[];
    assets: GenerationAsset[];
    financials: FinancialParams;
    battery: { mw: number; hours: number };
    loadHub: string;
    solarHub: string;
    windHub: string;
    nuclearHub: string;
    geothermalHub: string;
    ccsHub: string;
}

interface YearResult {
    year: number;
    result: SimulationResult;
    hasError: boolean;
}

export default function MultiYearAnalysisTab({
    participants,
    assets,
    financials,
    battery,
    loadHub,
    solarHub,
    windHub,
    nuclearHub,
    geothermalHub,
    ccsHub
}: MultiYearAnalysisProps) {
    const [results, setResults] = useState<YearResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const runAnalysis = async () => {
        setLoading(true);
        setResults([]);
        setProgress(0);

        // Define years to run. Adjust based on available data in price-loader/profiles.
        // Assuming 2020-2025 are available or mapped.
        // Important: check avail years. If 2025 data is missing, it might fail.
        const years = [2020, 2021, 2022, 2023, 2024, 2025];
        const newResults: YearResult[] = [];

        for (let i = 0; i < years.length; i++) {
            const year = years[i];
            setProgress(Math.round(((i) / years.length) * 100));

            try {
                // 1. Load Prices
                // Note: loadHubPrices might need specific handling for years if files are missing.
                const prices = await loadHubPrices(year, loadHub);

                if (!prices || prices.length === 0) {
                    console.warn(`No price data for ${year}`);
                    newResults.push({ year, result: null as any, hasError: true });
                    continue;
                }

                // 2. Load Profiles
                const genProfiles: Record<string, number[]> = {};
                for (const asset of assets) {
                    if (asset.type === 'Solar' || asset.type === 'Wind') {
                        // Use TMY if specific year not found? ideally use specific year
                        // Try specific year first
                        let url = `/data/profiles/${asset.type}_${asset.location}_${year}.json`;
                        try {
                            let res = await fetch(url);
                            if (!res.ok) {
                                // Fallback to TMY if year missing
                                url = `/data/profiles/${asset.type}_${asset.location}_TMY.json`;
                                res = await fetch(url);
                            }
                            if (res.ok) {
                                const data = await res.json();
                                genProfiles[asset.id] = data;
                            }
                        } catch (e) {
                            console.error(`Failed profile load ${asset.name} ${year}`);
                        }
                    }
                }

                // 3. Run Sim
                const simRes = runAggregationSimulation(
                    participants,
                    assets,
                    { ...financials, market_year: year, use_actual_prices: true }, // update financial year context and use actual prices
                    prices,
                    battery,
                    {},
                    genProfiles
                );

                if (simRes) {
                    newResults.push({ year, result: simRes, hasError: false });
                } else {
                    newResults.push({ year, result: null as any, hasError: true });
                }

            } catch (error) {
                console.error(`Error running ${year}:`, error);
                newResults.push({ year, result: null as any, hasError: true });
            }
        }

        setResults(newResults);
        setProgress(100);
        setLoading(false);
    };

    // Prepare Charts
    const validResults = results.filter(r => !r.hasError);
    const labels = validResults.map(r => r.year);

    const costData = {
        labels,
        datasets: [
            {
                label: 'Net Portfolio Cashflow (k$)',
                data: validResults.map(r => (-r.result.total_cost_net / 1000)),
                backgroundColor: validResults.map(r => -r.result.total_cost_net > 0 ? '#10b981' : '#ef4444'),
                borderRadius: 4
            }
        ]
    };

    const avgCostData = {
        labels,
        datasets: [
            {
                label: 'Net Cashflow ($/MWh)',
                data: validResults.map(r => -r.result.avg_cost_per_mwh),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.3
            }
        ]
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10">
                <div>
                    <h2 className="text-xl font-bold text-navy-950 dark:text-white">Multi-Year Financial Analysis</h2>
                    <p className="text-gray-500 text-sm">Run your portfolio against historical market conditions (2020-2025).</p>
                </div>
                <button
                    onClick={runAnalysis}
                    disabled={loading}
                    className="px-6 py-3 bg-energy-green text-navy-950 font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-energy-green/20"
                >
                    {loading ? `Analyzing... ${progress}%` : 'Run Analysis'}
                </button>
            </div>

            {loading && (
                <div className="w-full bg-gray-200 dark:bg-white/5 rounded-full h-2 overflow-hidden">
                    <div className="bg-energy-green h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
            )}

            {results.length > 0 && !loading && (
                <>
                    {/* Key Metrics Table */}
                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-white/10">
                                <tr>
                                    <th className="p-4">Year</th>
                                    <th className="p-4">Net Cashflow ($)</th>
                                    <th className="p-4">Net Cashflow ($/MWh)</th>
                                    <th className="p-4">Gen Capture Price ($/MWh)</th>
                                    <th className="p-4">CFE %</th>
                                    <th className="p-4">Unmatched (MWh)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {results.map((item) => (
                                    <tr key={item.year} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-bold text-navy-950 dark:text-white">{item.year} {item.hasError && '⚠️'}</td>
                                        {item.hasError ? (
                                            <td colSpan={5} className="p-4 text-gray-500">Error loading data</td>
                                        ) : (
                                            <>
                                                <td className={`p-4 font-mono font-bold ${-item.result.total_cost_net < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                    ${(-item.result.total_cost_net).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </td>
                                                <td className={`p-4 font-mono ${-item.result.avg_cost_per_mwh < 0 ? 'text-red-600/70 dark:text-red-400/70' : 'text-green-600/70 dark:text-green-400/70'}`}>
                                                    ${(-item.result.avg_cost_per_mwh).toFixed(2)}
                                                </td>
                                                <td className="p-4 font-mono text-gray-500 dark:text-gray-400">
                                                    ${(item.result.total_gen_revenue / (item.result.total_gen_mwh || 1)).toFixed(2)}
                                                </td>
                                                <td className="p-4 font-bold text-energy-green-dark dark:text-energy-green">
                                                    {(item.result.cfe_score * 100).toFixed(1)}%
                                                </td>
                                                <td className="p-4 text-gray-700 dark:text-gray-300">
                                                    {(item.result.total_load_mwh - item.result.total_matched_mwh).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10 h-[350px]">
                            <h3 className="text-lg font-bold mb-4 text-navy-950 dark:text-white">Net Portfolio Cashflow</h3>
                            <Bar
                                data={costData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: { y: { beginAtZero: true } }
                                }}
                            />
                        </div>
                        <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10 h-[350px]">
                            <h3 className="text-lg font-bold mb-4 text-navy-950 dark:text-white">Net Cashflow ($/MWh)</h3>
                            <Line
                                data={avgCostData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: { y: { beginAtZero: true } }
                                }}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
