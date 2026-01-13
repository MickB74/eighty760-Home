'use client';

import React, { useMemo } from 'react';
import { SimulationResult as AggResult } from '@/lib/aggregation/types';
import ResultsHeatmap from './ResultsHeatmap'; // Assuming it's in the same folder or adjusted path
import { Bar, Line } from 'react-chartjs-2';
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
import InfoTooltip from '@/components/shared/InfoTooltip';

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

interface AnalysisTabProps {
    result: AggResult | null;
}

export default function AnalysisTab({ result }: AnalysisTabProps) {

    // --- Data Processing (Memoized) ---
    const analysisData = useMemo(() => {
        if (!result) return null;

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyStats: any[] = [];

        // 1. Monthly Aggregation
        // We assume 8760 hours starting Jan 1st 00:00 non-leap year for simplicity
        // or we iterate through hours and map to months.

        // Simple day-of-year mapping
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let currentHour = 0;

        for (let m = 0; m < 12; m++) {
            const hoursInThisMonth = daysInMonth[m] * 24;
            // Slice the arrays for this month
            // Be careful if result arrays are shorter or longer
            const monthEnd = Math.min(currentHour + hoursInThisMonth, result.load_profile.length);

            // Extract slices
            // Note: aggregation profile arrays are simple number[]

            let loadSum = 0;
            let solarSum = 0;
            let windSum = 0;
            let batterySum = 0;
            let matchedSum = 0;

            // For Grid/Excess, we calculate derived values per hour
            // Grid Import = Max(0, Load - (Solar+Wind+Battery+Nuclear+Geo+CCS))
            // But AggResult likely has `matched_profile` which is CFE matched.
            // Let's rely on matched_profile for CFE.

            // We need individual tech sums for stack chart
            // AggResult has `solar_profile`, `wind_profile`, `battery_discharge`

            for (let i = currentHour; i < monthEnd; i++) {
                loadSum += result.load_profile[i] || 0;
                solarSum += result.solar_profile[i] || 0;
                windSum += result.wind_profile[i] || 0;
                batterySum += result.battery_discharge[i] || 0;
                matchedSum += result.matched_profile[i] || 0;
            }

            // Tech sums for this month
            // We might want Nuclear/Geo/CCS too? AnalysisClient only showed Solar/Wind/Battery/Grid.
            // AggregationClient shows all. Let's stick to what AnalysisClient showed for now: Solar, Wind, Battery, Grid.
            // But wait, if there is Nuclear, it should be in the stack or else "Grid" (Load - clean) will be wrong.
            // Clean Generation in AnalysisClient was Solar+Wind+Battery.
            // In Aggregation, Clean Gen includes Nuclear/Geo/CCS.
            // Let's count all clean gen for validity.

            let nuclearSum = 0;
            let geoSum = 0;
            let ccsSum = 0;

            for (let i = currentHour; i < monthEnd; i++) {
                if (result.nuc_profile) nuclearSum += result.nuc_profile[i] || 0;
                if (result.geo_profile) geoSum += result.geo_profile[i] || 0;
                if (result.ccs_profile) ccsSum += result.ccs_profile[i] || 0;
            }

            const totalClean = solarSum + windSum + batterySum + nuclearSum + geoSum + ccsSum;

            // Grid Import from profile? Or (Load - Clean)?
            // AggResult does not explicitly have grid_import_profile usually.
            // But it has `total_matched_mwh`.
            // Let's assume Grid = Load - Matched (roughly).
            // Or better: Grid = Load - (Consumed Clean).
            // Matched Profile is exactly "Consumed Clean Energy".

            const gridImport = Math.max(0, loadSum - matchedSum);
            const excessGen = Math.max(0, totalClean - loadSum); // Rough approximation of monthly excess
            // Accurate excess is sum(Max(0, Gen_h - Load_h)).
            // AggResult has `surplus_profile`.

            let trueExcess = 0;
            if (result.surplus_profile) {
                for (let i = currentHour; i < monthEnd; i++) {
                    trueExcess += result.surplus_profile[i] || 0;
                }
            } else {
                trueExcess = excessGen;
            }

            // CFE Calculation
            const cfeAvg = loadSum > 0 ? (matchedSum / loadSum) * 100 : 0;

            monthlyStats.push({
                name: months[m],
                load: loadSum,
                solar: solarSum,
                wind: windSum,
                battery: batterySum,
                nuclear: nuclearSum, // Added for completeness
                geo: geoSum,
                ccs: ccsSum,
                grid: gridImport,
                excess: trueExcess,
                cfe: cfeAvg
            });

            currentHour += hoursInThisMonth;
        }

        // 2. Load Duration Curve (Net Load = Load - VRE)
        // VRE = Solar + Wind
        const netLoadPoints = result.load_profile.map((load, i) => {
            const solar = result.solar_profile[i] || 0;
            const wind = result.wind_profile[i] || 0;
            return load - (solar + wind);
        }).sort((a, b) => b - a);

        // Downsample
        const durationCurvePoints = netLoadPoints.filter((_, i) => i % 10 === 0);

        // 3. Hourly CFE Data for Heatmap
        // Ratio = matched[i] / load[i]
        const cfeHourly = result.load_profile.map((load, i) => {
            if (load === 0) return 1.0; // No load = perfect match?
            const matched = result.matched_profile[i] || 0;
            return Math.min(1.0, matched / load);
        });

        return { monthlyStats, durationCurvePoints, cfeHourly };
    }, [result]);

    const monthlyChartData = useMemo(() => {
        if (!analysisData) return null;
        return {
            labels: analysisData.monthlyStats.map(m => m.name),
            datasets: [
                { label: 'Solar', data: analysisData.monthlyStats.map(m => m.solar), backgroundColor: '#F59E0B', stack: 'stack1' },
                { label: 'Wind', data: analysisData.monthlyStats.map(m => m.wind), backgroundColor: '#3B82F6', stack: 'stack1' },
                { label: 'Battery', data: analysisData.monthlyStats.map(m => m.battery), backgroundColor: '#10B981', stack: 'stack1' },
                // Add baseloads if present and significant
                { label: 'Nuclear', data: analysisData.monthlyStats.map(m => m.nuclear), backgroundColor: '#EF4444', stack: 'stack1' },
                { label: 'Geothermal', data: analysisData.monthlyStats.map(m => m.geo), backgroundColor: '#F97316', stack: 'stack1' },
                { label: 'CCS Gas', data: analysisData.monthlyStats.map(m => m.ccs), backgroundColor: '#8B5CF6', stack: 'stack1' },
                // Grid
                { label: 'Grid', data: analysisData.monthlyStats.map(m => m.grid), backgroundColor: '#64748B', stack: 'stack1' },
                {
                    label: 'Load',
                    data: analysisData.monthlyStats.map(m => m.load),
                    type: 'line' as const,
                    borderColor: '#ffffff', // White line for contrast in dark mode
                    borderWidth: 2,
                    pointRadius: 3,
                    fill: false
                }
            ].filter(ds => ds.data.some((v: number) => v > 1)) // Filter out empty tech
        };
    }, [analysisData]);

    const durationChartData = useMemo(() => {
        if (!analysisData) return null;
        return {
            labels: analysisData.durationCurvePoints.map((_, i) => i * 10), // Hours approx
            datasets: [{
                label: 'Net Load (MW)',
                data: analysisData.durationCurvePoints,
                borderColor: '#DC2626',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                fill: true,
                pointRadius: 0,
                borderWidth: 2
            }]
        };
    }, [analysisData]);


    if (!result || !analysisData) {
        return <div className="p-8 text-center text-gray-500">Run a simulation to view analysis.</div>;
    }

    // Determine Grade
    const cfe = result.cfe_score * 100;
    let gradeIcon = '🟡';
    let gradeText = 'Good';
    let gradientClass = 'from-yellow-500/20 to-orange-500/20';
    if (cfe >= 90) { gradeIcon = '🟢'; gradeText = 'Excellent'; gradientClass = 'from-green-500/20 to-emerald-500/20'; }
    else if (cfe < 70) { gradeIcon = '🔴'; gradeText = 'Needs Improvement'; gradientClass = 'from-red-500/20 to-orange-500/20'; }


    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* 1. Grade Card & High Level Metrics (Matches AnalysisClient style) */}
            <div className={`bg-gradient-to-br ${gradientClass} rounded-2xl border border-gray-200 dark:border-white/10 relative overflow-hidden shadow-lg`}>
                <div className="absolute inset-0 bg-white/40 dark:bg-black/5 backdrop-blur-sm" />
                <div className="relative z-10 p-8 flex flex-col lg:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <span className="text-6xl filter drop-shadow-md">{gradeIcon}</span>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-7xl font-extrabold text-navy-950 dark:text-white tracking-tight">{cfe.toFixed(1)}</span>
                                <span className="text-3xl font-bold text-navy-950 dark:text-white">%</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-lg font-medium text-navy-900/70 dark:text-white/70 uppercase tracking-wide">24/7 Match Score</div>
                                <span className="px-3 py-1 rounded-full bg-white/50 dark:bg-black/20 text-xs font-bold text-navy-950 dark:text-white backdrop-blur-md border border-white/20">{gradeText}</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-right flex-1 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-navy-900/10 dark:border-white/10 pt-6 lg:pt-0 lg:pl-8">
                        {[
                            { l: "Annual Load", v: (result.total_load_mwh || 0).toLocaleString(), u: "MWh" },
                            { l: "Clean Gen", v: (result.total_gen_mwh || 0).toLocaleString(), u: "MWh" },
                            { l: "Match Gen", v: (result.total_matched_mwh || 0).toLocaleString(), u: "MWh" }, // handle type mismatch if any
                            { l: "Net Cost", v: `$${Math.abs(result.total_cost_net || 0).toLocaleString()}`, u: (result.total_cost_net || 0) < 0 ? "(Profit)" : "(Cost)" },
                        ].map((s, i) => (
                            <div key={i}>
                                <div className="text-xs uppercase tracking-wider text-navy-900/60 dark:text-white/60 font-semibold">{s.l}</div>
                                <div className="text-2xl font-bold text-navy-950 dark:text-white">{s.v} <span className="text-sm font-normal opacity-70">{s.u}</span></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. Monthly Visualization Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
                {/* Monthly Stack Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-gray-200 dark:border-white/10 flex flex-col">
                    <h3 className="text-lg font-bold text-navy-950 dark:text-white mb-4">Monthly Energy Balance</h3>
                    <div className="flex-1 min-h-0 relative">
                        {monthlyChartData && <Bar data={monthlyChartData as any} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                x: { grid: { display: false }, ticks: { color: '#9CA3AF' } },
                                y: { stacked: false, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#9CA3AF' } }
                            },
                            plugins: { legend: { position: 'bottom', labels: { color: '#9CA3AF' } } }
                        }} />}
                    </div>
                </div>

                {/* Load Duration Curve */}
                <div className="bg-white dark:bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-gray-200 dark:border-white/10 flex flex-col">
                    <h3 className="text-lg font-bold text-navy-950 dark:text-white mb-4">Net Load Duration Curve</h3>
                    <div className="flex-1 min-h-0 relative">
                        {durationChartData && <Line data={durationChartData} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            elements: { point: { radius: 0 } },
                            scales: {
                                x: { display: false },
                                y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#9CA3AF' }, title: { display: true, text: 'Net Load (MW)', color: '#6B7280' } }
                            },
                            plugins: { legend: { display: false } }
                        }} />}
                    </div>
                    <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                        Represents hourly net load sorted from highest to lowest. Steep curves indicate high volatility and reliability risk.
                    </div>
                </div>
            </div>

            {/* 3. Heatmap */}
            <div className="mt-8">
                <ResultsHeatmap
                    data={analysisData.cfeHourly}
                    title="Hourly CFE Performance (Low = Poor Match, High = Exact Match)"
                    min={0}
                    max={1.0}
                    unit="Score"
                />
            </div>

            {/* 4. Detailed Monthly Table */}
            <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                    <h3 className="text-lg font-bold text-navy-950 dark:text-white">Monthly Operations Digest</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-gray-100 dark:bg-black/20 text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3 font-bold">Month</th>
                                <th className="px-6 py-3 text-right">Load (MWh)</th>
                                <th className="px-6 py-3 text-right">Solar (MWh)</th>
                                <th className="px-6 py-3 text-right">Wind (MWh)</th>
                                <th className="px-6 py-3 text-right">Battery (MWh)</th>
                                <th className="px-6 py-3 text-right text-red-400">Grid Import</th>
                                <th className="px-6 py-3 text-right text-amber-400">Excess Gen</th>
                                <th className="px-6 py-3 text-right font-bold text-white bg-white/5">CFE Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                            {analysisData.monthlyStats.map((m: any, i: number) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-bold text-navy-950 dark:text-white">{m.name}</td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-gray-300">{m.load.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-gray-300 opacity-80">{m.solar.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-gray-300 opacity-80">{m.wind.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-gray-300 opacity-80">{m.battery.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="px-6 py-4 text-right font-mono text-red-600 dark:text-red-400 font-medium">{m.grid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="px-6 py-4 text-right font-mono text-amber-600 dark:text-amber-400">{m.excess.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-navy-950 dark:text-white bg-white/5">
                                        <span className={m.cfe >= 90 ? 'text-green-400' : m.cfe >= 70 ? 'text-yellow-400' : 'text-red-400'}>
                                            {m.cfe.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>



        </div>
    );
}
