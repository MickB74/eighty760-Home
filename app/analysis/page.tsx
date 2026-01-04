'use client';

import { useState, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import { runSimulation } from '@/lib/simulation/engine';
import { SimulationResult, BuildingPortfolioItem } from '@/lib/simulation/types';
import Papa from 'papaparse';
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

    return (
        <main className="min-h-screen bg-[var(--bg-primary)]">
            <Navigation />

            <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
                {/* Sidebar */}
                <div className="w-full lg:w-80 p-6 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-y-auto h-auto lg:h-[calc(100vh-80px)]">
                    <h2 className="text-xl font-bold brand-text mb-6">Configuration</h2>

                    <div className="space-y-8">
                        {/* Region */}
                        <section>
                            <label className="block text-sm font-semibold mb-2">Region</label>
                            <select
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--bg-primary)]"
                            >
                                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </section>

                        {/* Load */}
                        <section>
                            <h3 className="font-semibold mb-3 border-b border-[var(--border-color)] pb-1">1. Load Profile</h3>
                            <div className="space-y-3">
                                {BUILDING_TYPES.map(type => (
                                    <div key={type}>
                                        <label className="text-xs text-[var(--text-secondary)]">{type} (MWh)</label>
                                        <input
                                            type="number"
                                            value={loadInputs[type]}
                                            onChange={(e) => setLoadInputs({ ...loadInputs, [type]: parseFloat(e.target.value) || 0 })}
                                            className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--bg-primary)]"
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Renewables */}
                        <section>
                            <h3 className="font-semibold mb-3 border-b border-[var(--border-color)] pb-1">2. Renewables (MW)</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-[var(--text-secondary)]">Solar Capacity</label>
                                    <input type="number" value={caps.solar} onChange={e => setCaps({ ...caps, solar: parseFloat(e.target.value) || 0 })} className="w-full p-2 rounded border bg-[var(--bg-primary)]" />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--text-secondary)]">Wind Capacity</label>
                                    <input type="number" value={caps.wind} onChange={e => setCaps({ ...caps, wind: parseFloat(e.target.value) || 0 })} className="w-full p-2 rounded border bg-[var(--bg-primary)]" />
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--text-secondary)]">Battery (MWh)</label>
                                    <input type="number" value={caps.battery} onChange={e => setCaps({ ...caps, battery: parseFloat(e.target.value) || 0 })} className="w-full p-2 rounded border bg-[var(--bg-primary)]" />
                                </div>
                            </div>
                        </section>

                        {/* Button */}
                        <button
                            onClick={handleRun}
                            disabled={loading || csvLoading}
                            className="w-full py-3 bg-[var(--brand-color)] text-white rounded font-bold hover:opacity-90 disabled:opacity-50"
                        >
                            {loading ? "Calculating..." : "Generate Analysis"}
                        </button>
                        {csvLoading && <p className="text-xs text-center text-amber-500">Loading data...</p>}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
                    {!simResult ? (
                        <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)]">
                            <div className="text-6xl mb-4">⚡</div>
                            <h2 className="text-2xl font-bold mb-2">Ready to Simulate</h2>
                            <p>Configure your portfolio on the left and click Generate.</p>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* Header */}
                            <div>
                                <h1 className="text-3xl font-bold brand-text">Simulation Results</h1>
                                <p className="text-[var(--text-secondary)]">Region: {region} | Total Load: {simResult.results.total_annual_load.toLocaleString(undefined, { maximumFractionDigits: 0 })} MWh</p>
                            </div>

                            {/* KPI Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <MetricCard
                                    label="CFE Score"
                                    value={`${simResult?.results.cfe_percent.toFixed(1)}%`}
                                    sub="Hourly Match"
                                />
                                <MetricCard
                                    label="Grid Emissions"
                                    value={simResult?.results.grid_emissions_mt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    sub="Metric Tons CO2e"
                                />
                                <MetricCard
                                    label="Avoided Emissions"
                                    value={simResult?.results.avoided_emissions_mt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    sub="Metric Tons CO2e"
                                />
                                <MetricCard
                                    label="Net REC Cost"
                                    value={`$${simResult?.results.net_rec_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                                    sub="Revenue - Cost"
                                    color={simResult.results.net_rec_cost > 0 ? "text-green-500" : "text-red-500"}
                                />
                            </div>

                            {/* Chart */}
                            <div className="bg-[var(--card-bg)] p-4 rounded-lg border border-[var(--border-color)] h-[400px]">
                                <h3 className="text-lg font-bold mb-4">Summer Week Profile (Sample)</h3>
                                <div className="relative h-[320px] w-full">
                                    {chartData && <Line data={chartData} options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            x: { display: false },
                                            y: { stacked: true, title: { display: true, text: 'MW' } }
                                        },
                                        interaction: {
                                            mode: 'nearest',
                                            axis: 'x',
                                            intersect: false
                                        },
                                        plugins: {
                                            tooltip: {
                                                mode: 'index',
                                                intersect: false,
                                            }
                                        }
                                    }} />}
                                </div>
                            </div>

                            <div className="bg-[var(--bg-tertiary)] p-6 rounded-lg">
                                <h3 className="font-bold mb-2">About this Simulation</h3>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    This analysis uses NREL-based synthetic generation profiles and 2024 ISO-specific carbon intensity data.
                                    Battery optimization uses a greedy algorithm (charge on surplus, discharge on deficit).
                                </p>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

function MetricCard({ label, value, sub, color }: { label: string, value: string, sub: string, color?: string }) {
    return (
        <div className="bg-[var(--card-bg)] p-4 rounded border border-[var(--border-color)]">
            <div className="text-xs uppercase text-[var(--text-secondary)] font-semibold">{label}</div>
            <div className={`text-2xl font-mono font-bold my-1 ${color || 'brand-text'}`}>{value}</div>
            <div className="text-xs text-[var(--text-tertiary)]">{sub}</div>
        </div>
    );
}
