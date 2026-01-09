'use client';

import { useState, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { runSimulation } from '@/lib/simulation/engine';
import { SimulationResult, BuildingPortfolioItem } from '@/lib/simulation/types';
import InfoTooltip from '@/components/shared/InfoTooltip';
import Papa from 'papaparse';
import { loadPortfolio, SharedPortfolio } from '@/lib/shared/portfolioStore';
import { runAggregationSimulation } from '@/lib/aggregation/engine';
import { SimulationResult as AggResult } from '@/lib/aggregation/types';
import Link from 'next/link';
import ResultsHeatmap from '@/components/aggregation/ResultsHeatmap';
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
import { Line, Bar } from 'react-chartjs-2';

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

// Constants
const REGIONS = ["ERCOT", "PJM", "CAISO", "MISO", "SPP", "NYISO", "ISO-NE"];
const BUILDING_TYPES = ["Office", "Data Center", "Retail", "Residential", "Hospital", "Warehouse"];

export default function AnalysisPage() {
    // --- State ---
    const [loading, setLoading] = useState(false);
    const [emissionsData, setEmissionsData] = useState<any[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [csvLoading, setCsvLoading] = useState(true);

    // Inputs
    const [region, setRegion] = useState("ERCOT");
    const [emissionsSource, setEmissionsSource] = useState<"hourly" | "egrid">("hourly");

    // Annual Loads (MWh)
    const [loadInputs, setLoadInputs] = useState<Record<string, number>>({
        "Office": 0,
        "Data Center": 0,
        "Retail": 0,
        "Residential": 0,
        "Hospital": 0,
        "Warehouse": 0
    });

    // Capacities
    const [caps, setCaps] = useState({
        solar: 50,
        wind: 50,
        nuclear: 0,
        geo: 0,
        hydro: 0,
        battery: 0
    });

    // Financials
    const [financials, setFinancials] = useState({
        baseRecPrice: 8.0,
        useRecScaling: true,
        scarcityIntensity: 1.0
    });

    // Results
    const [simResult, setSimResult] = useState<SimulationResult | null>(null);
    const [aggregationResult, setAggregationResult] = useState<AggResult | null>(null);
    const [portfolio, setPortfolio] = useState<SharedPortfolio | null>(null);
    const [loadedFromAggregation, setLoadedFromAggregation] = useState(false);

    // --- Effects ---

    // Load CSV on mount
    useEffect(() => {
        Papa.parse('/data/combinedISOCarbon2024.csv', {
            download: true,
            header: true,
            dynamicTyping: true,
            complete: (results) => {
                setEmissionsData(results.data);
                setCsvLoading(false);
            },
            error: (err) => {
                console.error("CSV Load Error", err);
                setCsvLoading(false);
            }
        });
    }, []);

    // Load portfolio from Aggregation on mount and auto-run simulation
    useEffect(() => {
        const stored = loadPortfolio();
        if (stored) {
            setPortfolio(stored);
            setLoadedFromAggregation(true);

            // Map portfolio to Analysis inputs
            const mappedLoads: Record<string, number> = {
                "Office": 0,
                "Data Center": 0,
                "Retail": 0,
                "Residential": 0,
                "Hospital": 0,
                "Warehouse": 0
            };

            // Map participants to building loads
            stored.participants.forEach(p => {
                if (mappedLoads.hasOwnProperty(p.type)) {
                    mappedLoads[p.type] += p.load_mwh;
                }
            });

            // Calculate total capacities from assets
            const totalSolar = stored.assets.filter(a => a.type === 'Solar').reduce((sum, a) => sum + a.capacity_mw, 0);
            const totalWind = stored.assets.filter(a => a.type === 'Wind').reduce((sum, a) => sum + a.capacity_mw, 0);
            const totalNuclear = stored.assets.filter(a => a.type === 'Nuclear').reduce((sum, a) => sum + a.capacity_mw, 0);
            const totalGeo = stored.assets.filter(a => a.type === 'Geothermal').reduce((sum, a) => sum + a.capacity_mw, 0);
            const totalCCS = stored.assets.filter(a => a.type === 'CCS Gas').reduce((sum, a) => sum + a.capacity_mw, 0);

            // Update state with mapped parameters
            setLoadInputs(mappedLoads);
            setCaps({
                solar: totalSolar,
                wind: totalWind,
                nuclear: totalNuclear,
                geo: totalGeo,
                hydro: totalCCS,  // Analysis uses 'hydro' field for CCS Gas from Aggregation
                battery: stored.battery.mw * stored.battery.hours
            });
            setFinancials({
                baseRecPrice: stored.financials.rec_price,
                useRecScaling: stored.financials.use_scarcity || false,
                scarcityIntensity: stored.financials.scarcity_intensity || 1.0
            });

            // Auto-run simulation after parameters are set
            setTimeout(() => {
                if (emissionsData.length > 0) {
                    // Prepare portfolio
                    const portfolio: BuildingPortfolioItem[] = Object.entries(mappedLoads)
                        .filter(([_, val]) => val > 0)
                        .map(([type, val]) => ({ type, annual_mwh: val }));

                    // Run simulation with mapped parameters
                    const result = runSimulation({
                        year: 2023,
                        region,
                        building_portfolio: portfolio,
                        solar_capacity: totalSolar,
                        wind_capacity: totalWind,
                        nuclear_capacity: totalNuclear,
                        geothermal_capacity: totalGeo,
                        hydro_capacity: totalCCS,  // Passing CCS as hydro capacity for Analysis engine
                        battery_capacity_mwh: stored.battery.mw * stored.battery.hours,
                        base_rec_price: stored.financials.rec_price,
                        use_rec_scaling: stored.financials.use_scarcity || false,
                        scarcity_intensity: stored.financials.scarcity_intensity || 1.0,
                        hourly_emissions_lb_mwh: undefined // Could be extracted if needed
                    });
                    setSimResult(result);
                }
            }, 500); // Small delay to ensure emissions data is loaded
        }
    }, [emissionsData]);

    // Run Simulation
    const handleRun = () => {
        setLoading(true);

        // Prepare Inputs
        const portfolio: BuildingPortfolioItem[] = Object.entries(loadInputs)
            .filter(([_, val]) => val > 0)
            .map(([type, val]) => ({ type, annual_mwh: val }));

        // Filter Emissions Data
        let hourlyEmissions: number[] | undefined = undefined;
        if (emissionsSource === "hourly" && emissionsData.length > 0) {
            // Filter by region (ISO Code)
            // Note: Data file uses specific ISO codes. Map if needed.
            const isoCode = region;
            const regionRows = emissionsData.filter((r: any) => r.ISO_Code === isoCode);

            if (regionRows.length > 0) {
                // Sort by period just in case
                regionRows.sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());

                // Extract carbon intensity
                hourlyEmissions = regionRows.map((r: any) => r.carbon_intensity_g_kwh * 0.00220462); // g/kWh to lb/MWh? 
                // Wait, g/kWh * 1000 = g/MWh. g to lb = 0.00220462. 
                // So g/kWh * 1000 * 0.00220462 ~= 2.2 lb/MWh?
                // Let's check python unit. "carbon_intensity_g_kwh".
                // utils.py: "EMISSION RATES (lb CO2e/MWh)".
                // 1 g = 0.00220462 lb.
                // 1 kWh = 0.001 MWh.
                // So X g/kWh = X * 2.20462 lb/MWh.
                // Python code didn't show conversion explicitly in snippets I saw, but usually that's the math.

                hourlyEmissions = regionRows.map((r: any) =>
                    (r.carbon_intensity_g_kwh || 0) * 2.20462
                );

                // Ensure 8760 length (trim leap day if needed)
                // For now, simplify: take first 8760
                if (hourlyEmissions.length > 8760) hourlyEmissions = hourlyEmissions.slice(0, 8760);
                // Pad if short
                while (hourlyEmissions.length < 8760) hourlyEmissions.push(hourlyEmissions[hourlyEmissions.length - 1] || 0);
            }
        }

        setTimeout(() => { // unblock UI
            const result = runSimulation({
                year: 2023,
                region,
                building_portfolio: portfolio,
                solar_capacity: caps.solar,
                wind_capacity: caps.wind,
                nuclear_capacity: caps.nuclear,
                geothermal_capacity: caps.geo,
                hydro_capacity: caps.hydro,
                battery_capacity_mwh: caps.battery,
                base_rec_price: financials.baseRecPrice,
                use_rec_scaling: financials.useRecScaling,
                scarcity_intensity: financials.scarcityIntensity,
                hourly_emissions_lb_mwh: hourlyEmissions
            });
            setSimResult(result);
            setLoading(false);
        }, 100);
    };

    // --- Data Processing (Memoized) ---
    const analysisData = useMemo(() => {
        if (!simResult) return null;

        const df = simResult.df;
        const monthlyStats: any[] = [];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // 1. Monthly Aggregation
        for (let m = 0; m < 12; m++) {
            const monthRows = df.filter(row => new Date(row.timestamp).getMonth() === m);

            if (monthRows.length === 0) continue;

            const totalLoad = monthRows.reduce((a, b) => a + b.Load_Actual, 0);
            const totalSolar = monthRows.reduce((a, b) => a + b.Solar_Gen, 0);
            const totalWind = monthRows.reduce((a, b) => a + b.Wind_Gen, 0);
            const totalBattery = monthRows.reduce((a, b) => a + b.Battery_Discharge, 0);
            const totalClean = totalSolar + totalWind + totalBattery;
            const totalGrid = monthRows.reduce((a, b) => a + b.Grid_Consumption, 0);
            const totalExcess = monthRows.reduce((a, b) => a + b.Overgeneration, 0);

            // CFE Calculation: Energy Matched / Energy Load
            const matchedEnergy = totalClean - totalExcess;
            const cfeAvg = (matchedEnergy / totalLoad) * 100;

            monthlyStats.push({
                name: months[m],
                load: totalLoad,
                generation: totalClean,
                solar: totalSolar,
                wind: totalWind,
                battery: totalBattery,
                grid: totalGrid,
                excess: totalExcess,
                cfe: cfeAvg
            });
        }

        // 2. Load Duration Curve (Net Load = Load - VRE)
        const sortedNetLoad = [...df].map(row => row.Load_Actual - (row.Solar_Gen + row.Wind_Gen)).sort((a, b) => b - a);

        // Downsample for chart (every 10th point)
        const durationCurvePoints = sortedNetLoad.filter((_, i) => i % 10 === 0);

        return { monthlyStats, durationCurvePoints };
    }, [simResult]);

    // --- Charts ---
    const chartData = useMemo(() => {
        if (!simResult) return null;

        // Aggregate to Monthly for simpler chart, or display a sample week
        // Displaying 8760 points is too heavy. Let's do a sample week in Summer (July) or Monthly Avg.

        // Let's do a sample week: July 1st - July 7th.
        // Day 182 to 189 approx.
        const startIdx = 182 * 24;
        const endIdx = startIdx + (7 * 24);

        const slice = simResult.df.slice(startIdx, endIdx);

        return {
            labels: slice.map(d => {
                const date = new Date(d.timestamp);
                return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
            }),
            datasets: [
                {
                    label: 'Load',
                    data: slice.map(d => d.Load_Actual),
                    borderColor: '#333333',
                    borderWidth: 2,
                    pointRadius: 0,
                    type: 'line' as const,
                    order: 1
                },
                {
                    label: 'Solar',
                    data: slice.map(d => d.Solar_Gen),
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    fill: true,
                    pointRadius: 0,
                    stack: 'gen'
                },
                {
                    label: 'Wind',
                    data: slice.map(d => d.Wind_Gen),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    fill: true,
                    pointRadius: 0,
                    stack: 'gen'
                },
                {
                    label: 'Battery Discharge',
                    data: slice.map(d => d.Battery_Discharge),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    fill: true,
                    pointRadius: 0,
                    stack: 'gen'
                }
            ]
        };
    }, [simResult]);

    const monthlyChartData = useMemo(() => {
        if (!analysisData) return null;
        return {
            labels: analysisData.monthlyStats.map(m => m.name),
            datasets: [
                { label: 'Solar', data: analysisData.monthlyStats.map(m => m.solar), backgroundColor: '#F59E0B', stack: 'stack1' },
                { label: 'Wind', data: analysisData.monthlyStats.map(m => m.wind), backgroundColor: '#3B82F6', stack: 'stack1' },
                { label: 'Battery', data: analysisData.monthlyStats.map(m => m.battery), backgroundColor: '#10B981', stack: 'stack1' },
                { label: 'Grid', data: analysisData.monthlyStats.map(m => m.grid), backgroundColor: '#64748B', stack: 'stack1' },
                {
                    label: 'Load',
                    data: analysisData.monthlyStats.map(m => m.load),
                    type: 'line' as const,
                    borderColor: '#000',
                    borderWidth: 2,
                    pointRadius: 3,
                    fill: false
                }
            ]
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

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-navy-950 transition-colors duration-300 pb-20">
            <Navigation />

            {/* Config Modal */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-navy-950 h-full shadow-2xl overflow-y-auto p-6 border-l border-white/10 animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold brand-text">Configuration</h2>
                            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-red-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Region */}
                            <section>
                                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">Region</label>
                                <select
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)}
                                    className="w-full p-2 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-gray-100"
                                >
                                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </section>

                            {/* Load */}
                            <section>
                                <h3 className="font-semibold mb-3 border-b border-gray-200 dark:border-white/10 pb-1 text-gray-700 dark:text-gray-200">1. Load Profile</h3>
                                <div className="space-y-3">
                                    {BUILDING_TYPES.map(type => (
                                        <div key={type}>
                                            <label className="text-xs text-gray-700 dark:text-gray-300">{type} (MWh)</label>
                                            <input
                                                type="number"
                                                value={loadInputs[type]}
                                                onChange={(e) => setLoadInputs({ ...loadInputs, [type]: parseFloat(e.target.value) || 0 })}
                                                className="w-full p-2 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-gray-100"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Renewables */}
                            <section>
                                <h3 className="font-semibold mb-3 border-b border-gray-200 dark:border-white/10 pb-1 text-gray-700 dark:text-gray-200">2. Renewables (MW)</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-700 dark:text-gray-300">Solar Capacity</label>
                                        <input type="number" value={caps.solar} onChange={e => setCaps({ ...caps, solar: parseFloat(e.target.value) || 0 })} className="w-full p-2 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-gray-100" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-700 dark:text-gray-300">Wind Capacity</label>
                                        <input type="number" value={caps.wind} onChange={e => setCaps({ ...caps, wind: parseFloat(e.target.value) || 0 })} className="w-full p-2 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-gray-100" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-700 dark:text-gray-300">Battery (MWh)</label>
                                        <input type="number" value={caps.battery} onChange={e => setCaps({ ...caps, battery: parseFloat(e.target.value) || 0 })} className="w-full p-2 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-gray-100" />
                                    </div>
                                </div>
                            </section>

                            <button
                                onClick={() => { handleRun(); setIsSidebarOpen(false); }}
                                disabled={loading || csvLoading}
                                className="w-full py-3 bg-energy-green text-navy-950 rounded font-bold hover:opacity-90 disabled:opacity-50 shadow-lg"
                            >
                                {loading ? "Running..." : "Update Analysis"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">

                {/* Header Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold brand-text">Analyst Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400">Detailed portfolio simulation and hourly operational analysis</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-mono text-gray-900 dark:text-white">
                            Region: <span className="font-bold text-brand-light">{region}</span>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="px-4 py-2 bg-navy-950 dark:bg-white dark:text-navy-950 text-white rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                            Configure
                        </button>
                    </div>
                </div>

                {!simResult ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl bg-gray-100/50 dark:bg-white/5">
                        <div className="text-6xl mb-6 opacity-50">📊</div>
                        <h2 className="text-2xl font-bold mb-2">No Analysis Generated</h2>
                        <p className="max-w-md text-center mb-8">Configure your portfolio parameters to generate a detailed executive dashboard.</p>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="px-8 py-3 bg-energy-green text-navy-950 rounded-lg font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all"
                        >
                            Open Configuration
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in duration-500">

                        {/* 1. Hero Performance Card */}
                        {(() => {
                            const cfe = simResult.results.cfe_percent || 0;
                            let gradeIcon = '🟡';
                            let gradeText = 'Good';
                            let gradientClass = 'from-yellow-500/20 to-orange-500/20';
                            if (cfe >= 80) { gradeIcon = '🟢'; gradeText = 'Excellent'; gradientClass = 'from-green-500/20 to-emerald-500/20'; }
                            else if (cfe < 40) { gradeIcon = '🔴'; gradeText = 'Needs Improvement'; gradientClass = 'from-red-500/20 to-orange-500/20'; }

                            return (
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
                                                { l: "Annual Load", v: simResult.results.total_annual_load.toLocaleString(), u: "MWh" },
                                                { l: "Clean Gen", v: simResult.results.total_clean_generation.toLocaleString(), u: "MWh" },
                                                { l: "Grid Emissions", v: simResult.results.grid_emissions_mt.toLocaleString(), u: "MT" },
                                                { l: "Net Cost", v: `$${Math.abs(simResult.results.net_rec_cost).toLocaleString()}`, u: simResult.results.net_rec_cost < 0 ? "(Profit)" : "(Cost)" },
                                            ].map((s, i) => (
                                                <div key={i}>
                                                    <div className="text-xs uppercase tracking-wider text-navy-900/60 dark:text-white/60 font-semibold">{s.l}</div>
                                                    <div className="text-2xl font-bold text-navy-950 dark:text-white">{s.v} <span className="text-sm font-normal opacity-70">{s.u}</span></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

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
                            {simResult?.df && (
                                <ResultsHeatmap
                                    data={simResult.df.map(d => d.Hourly_CFE_Ratio || 0)}
                                    title="Hourly CFE Performance (Low = Poor Match, High = Exact Match)"
                                    min={0}
                                    max={1.0}
                                    unit="Score"
                                />
                            )}
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
                                        {analysisData?.monthlyStats.map((m, i) => (
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
                )}
            </div>
        </main>
    );
}

function MetricCard({ label, value, sub, color, tooltip }: { label: string, value: string, sub: string, color?: string, tooltip?: string }) {
    return (
        <div className="bg-white dark:bg-white/5 backdrop-blur-md p-4 rounded border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2 mb-1">
                <div className="text-xs uppercase text-gray-700 dark:text-gray-300 font-semibold">{label}</div>
                {tooltip && <InfoTooltip text={tooltip} size="sm" />}
            </div>
            <div className={`text-2xl font-mono font-bold my-1 ${color || 'brand-text'}`}>{value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{sub}</div>
        </div>
    );
}
