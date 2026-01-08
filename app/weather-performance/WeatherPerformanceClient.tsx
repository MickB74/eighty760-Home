'use client';

import { useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import {
    compareYearlyPerformance,
    getAvailableYears,
    getWeatherStatistics,
    aggregateToDaily,
    YearlyPerformance,
    PerformanceStats
} from '@/lib/data/weather-loader';
import { BuildingPortfolioItem } from '@/lib/simulation/types';
import InfoTooltip from '@/components/shared/InfoTooltip';
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

const LOCATIONS = ["North", "South", "West", "Houston", "Panhandle"];
const BUILDING_TYPES = ["Office", "Data Center", "Retail", "Residential", "Hospital", "Warehouse"];

export default function WeatherPerformanceClient() {
    // Configuration
    const [location, setLocation] = useState("North");
    const [buildingType, setBuildingType] = useState("Data Center");
    const [annualLoad, setAnnualLoad] = useState(50000);
    const [solarCapacity, setSolarCapacity] = useState(50);
    const [windCapacity, setWindCapacity] = useState(50);
    const [batteryCapacity, setBatteryCapacity] = useState(50);
    const [baseRecPrice, setBaseRecPrice] = useState(8.0);

    // Results
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [yearlyResults, setYearlyResults] = useState<YearlyPerformance[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleCompareYears = async () => {
        setLoading(true);
        setProgress(0);
        setYearlyResults([]);

        const years = getAvailableYears();
        const config = {
            year: 2023, // Will be overridden per year
            region: "ERCOT",
            building_portfolio: [{ type: buildingType, annual_mwh: annualLoad }] as BuildingPortfolioItem[],
            solar_capacity: solarCapacity,
            wind_capacity: windCapacity,
            nuclear_capacity: 0,
            geothermal_capacity: 0,
            hydro_capacity: 0,
            battery_capacity_mwh: batteryCapacity,
            base_rec_price: baseRecPrice,
            use_rec_scaling: true,
            scarcity_intensity: 1.0,
        };

        try {
            const results = await compareYearlyPerformance(config, location, years);
            setYearlyResults(results);
        } catch (error) {
            console.error('Error comparing years:', error);
        } finally {
            setLoading(false);
            setProgress(100);
        }
    };

    // Calculate statistics
    const stats = useMemo(() => {
        if (yearlyResults.length === 0) return [];
        return getWeatherStatistics(yearlyResults);
    }, [yearlyResults]);

    // Performance comparison chart data
    const comparisonChartData = useMemo(() => {
        if (yearlyResults.length === 0) return null;

        return {
            labels: yearlyResults.map(r => r.year.toString()),
            datasets: [
                {
                    label: 'CFE Score (%)',
                    data: yearlyResults.map(r => r.result.results.cfe_percent),
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 2,
                },
            ],
        };
    }, [yearlyResults]);

    // Generation profile comparison (daily averages)
    const generationProfileData = useMemo(() => {
        if (yearlyResults.length === 0) return null;

        const days = Array.from({ length: 365 }, (_, i) => i + 1);
        const colors = [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(236, 72, 153, 0.8)',
        ];

        const datasets = yearlyResults.map((result, idx) => {
            // Aggregate solar generation to daily
            const solarDaily = aggregateToDaily(
                result.result.df.map(d => d.Solar_Gen)
            );

            return {
                label: `Solar ${result.year}`,
                data: solarDaily,
                borderColor: colors[idx],
                borderWidth: 1.5,
                pointRadius: 0,
                fill: false,
            };
        });

        return {
            labels: days,
            datasets,
        };
    }, [yearlyResults]);

    // Cost comparison chart
    const costChartData = useMemo(() => {
        if (yearlyResults.length === 0) return null;

        return {
            labels: yearlyResults.map(r => r.year.toString()),
            datasets: [
                {
                    label: 'Net REC Cost ($)',
                    data: yearlyResults.map(r => r.result.results.net_rec_cost),
                    backgroundColor: yearlyResults.map(r =>
                        r.result.results.net_rec_cost < 0 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(16, 185, 129, 0.7)'
                    ),
                    borderColor: yearlyResults.map(r =>
                        r.result.results.net_rec_cost < 0 ? 'rgb(239, 68, 68)' : 'rgb(16, 185, 129)'
                    ),
                    borderWidth: 2,
                },
            ],
        };
    }, [yearlyResults]);

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-navy-950 transition-colors duration-300">
            <Navigation />

            <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
                {/* Mobile Sidebar Toggle */}
                <div className="lg:hidden p-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-navy-950 flex justify-between items-center">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Configuration</span>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-md border border-gray-200 dark:border-slate-600 transition-colors"
                    >
                        {isSidebarOpen ? 'Hide Controls' : 'Show Controls'}
                    </button>
                </div>

                {/* Sidebar */}
                <div className={`w-full lg:w-80 p-6 border-r border-gray-200 dark:border-white/10 bg-white dark:bg-navy-950/50 backdrop-blur-sm overflow-y-auto h-auto lg:h-[calc(100vh-80px)] ${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>
                    <h2 className="text-xl font-bold brand-text mb-6">Project Configuration</h2>

                    <div className="space-y-6">
                        {/* Location */}
                        <section>
                            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
                                Texas Hub Location
                            </label>
                            <select
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full p-2 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-gray-100"
                            >
                                {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                        </section>

                        {/* Building Profile */}
                        <section>
                            <h3 className="font-semibold mb-3 border-b border-gray-200 dark:border-white/10 pb-1 text-gray-700 dark:text-gray-200">
                                Load Profile
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-700 dark:text-gray-300">Building Type</label>
                                    <select
                                        value={buildingType}
                                        onChange={(e) => setBuildingType(e.target.value)}
                                        className="w-full p-2 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-gray-100"
                                    >
                                        {BUILDING_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-700 dark:text-gray-300">Annual Load (MWh)</label>
                                    <input
                                        type="number"
                                        value={annualLoad}
                                        onChange={(e) => setAnnualLoad(parseFloat(e.target.value) || 0)}
                                        className="w-full p-2 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Renewables */}
                        <section>
                            <h3 className="font-semibold mb-3 border-b border-gray-200 dark:border-white/10 pb-1 text-gray-700 dark:text-gray-200">
                                Renewable Capacity
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-700 dark:text-gray-300">Solar (MW)</label>
                                    <input
                                        type="number"
                                        value={solarCapacity}
                                        onChange={(e) => setSolarCapacity(parseFloat(e.target.value) || 0)}
                                        className="w-full p-2 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-700 dark:text-gray-300">Wind (MW)</label>
                                    <input
                                        type="number"
                                        value={windCapacity}
                                        onChange={(e) => setWindCapacity(parseFloat(e.target.value) || 0)}
                                        className="w-full p-2 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-700 dark:text-gray-300">Battery (MWh)</label>
                                    <input
                                        type="number"
                                        value={batteryCapacity}
                                        onChange={(e) => setBatteryCapacity(parseFloat(e.target.value) || 0)}
                                        className="w-full p-2 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Pricing */}
                        <section>
                            <h3 className="font-semibold mb-3 border-b border-gray-200 dark:border-white/10 pb-1 text-gray-700 dark:text-gray-200">
                                REC Pricing
                            </h3>
                            <div>
                                <label className="text-xs text-gray-700 dark:text-gray-300">Base Price ($/MWh)</label>
                                <input
                                    type="number"
                                    value={baseRecPrice}
                                    onChange={(e) => setBaseRecPrice(parseFloat(e.target.value) || 0)}
                                    className="w-full p-2 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-gray-100"
                                />
                            </div>
                        </section>

                        {/* Compare Button */}
                        <button
                            onClick={handleCompareYears}
                            disabled={loading}
                            className="w-full py-3 bg-energy-green text-navy-950 rounded font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                        >
                            {loading ? `Comparing... ${progress}%` : 'Compare All Years (2020-2025)'}
                        </button>

                        {loading && (
                            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                <div
                                    className="bg-energy-green h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
                    {yearlyResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            <div className="text-6xl mb-4">🌤️</div>
                            <h2 className="text-2xl font-bold mb-2">Weather Performance Analysis</h2>
                            <p className="text-center max-w-md">
                                Configure your project on the left and click "Compare All Years" to see how different
                                weather conditions (2020-2025) affect your renewable energy performance.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* Header */}
                            <div>
                                <h1 className="text-3xl font-bold brand-text">Weather Performance Comparison</h1>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Location: {location} | Load: {annualLoad.toLocaleString()} MWh |
                                    Solar: {solarCapacity} MW | Wind: {windCapacity} MW
                                </p>
                            </div>

                            {/* Performance Metrics Table */}
                            <div>
                                <h3 className="text-xl font-bold mb-4 text-navy-950 dark:text-white">
                                    Year-by-Year Performance
                                </h3>
                                <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-white/10">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Year</th>
                                                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">CFE Score</th>
                                                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">Grid (MWh)</th>
                                                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">Clean Gen (MWh)</th>
                                                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">Avoided (MT CO₂)</th>
                                                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">Net Cost ($)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                                                {yearlyResults.map((result) => (
                                                    <tr key={result.year} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{result.year}</td>
                                                        <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-gray-100">
                                                            {result.result.results.cfe_percent.toFixed(1)}%
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-gray-100">
                                                            {result.result.results.grid_consumption.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-gray-100">
                                                            {result.result.results.total_clean_generation.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-gray-100">
                                                            {result.result.results.avoided_emissions_mt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                        </td>
                                                        <td className={`px-4 py-3 text-right font-mono ${result.result.results.net_rec_cost < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                            {result.result.results.net_rec_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Statistics Summary */}
                            <div>
                                <h3 className="text-xl font-bold mb-4 text-navy-950 dark:text-white">
                                    Multi-Year Statistics
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {stats.map((stat) => (
                                        <div key={stat.metric} className="bg-white dark:bg-white/5 backdrop-blur-md p-4 rounded border border-gray-200 dark:border-white/10">
                                            <div className="text-xs uppercase text-gray-700 dark:text-gray-300 font-semibold mb-2">
                                                {stat.metric}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <span className="text-gray-500 dark:text-gray-400">Min: </span>
                                                    <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                                                        {stat.min.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                                    </span>
                                                    <span className="text-gray-400 dark:text-gray-500 ml-1">({stat.worstYear})</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500 dark:text-gray-400">Max: </span>
                                                    <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                                                        {stat.max.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                                    </span>
                                                    <span className="text-gray-400 dark:text-gray-500 ml-1">({stat.bestYear})</span>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-gray-500 dark:text-gray-400">Avg: </span>
                                                    <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                                                        {stat.avg.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* CFE Comparison Chart */}
                                <div className="bg-white dark:bg-white/5 backdrop-blur-md p-4 rounded-lg border border-gray-200 dark:border-white/10">
                                    <h3 className="text-lg font-bold mb-4 text-navy-950 dark:text-white">CFE Score by Year</h3>
                                    <div className="h-64">
                                        {comparisonChartData && (
                                            <Bar
                                                data={comparisonChartData}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            max: 100,
                                                            title: { display: true, text: 'CFE Score (%)' },
                                                        },
                                                    },
                                                    plugins: {
                                                        legend: { display: false },
                                                    },
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Cost Comparison Chart */}
                                <div className="bg-white dark:bg-white/5 backdrop-blur-md p-4 rounded-lg border border-gray-200 dark:border-white/10">
                                    <h3 className="text-lg font-bold mb-4 text-navy-950 dark:text-white">Net REC Cost by Year</h3>
                                    <div className="h-64">
                                        {costChartData && (
                                            <Bar
                                                data={costChartData}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    scales: {
                                                        y: {
                                                            title: { display: true, text: 'Cost ($)' },
                                                        },
                                                    },
                                                    plugins: {
                                                        legend: { display: false },
                                                    },
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Generation Profile Comparison */}
                            <div className="bg-white dark:bg-white/5 backdrop-blur-md p-4 rounded-lg border border-gray-200 dark:border-white/10">
                                <h3 className="text-lg font-bold mb-4 text-navy-950 dark:text-white">
                                    Daily Solar Generation Profile (All Years)
                                </h3>
                                <div className="h-80">
                                    {generationProfileData && (
                                        <Line
                                            data={generationProfileData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                scales: {
                                                    x: {
                                                        title: { display: true, text: 'Day of Year' },
                                                        ticks: { maxTicksLimit: 12 },
                                                    },
                                                    y: {
                                                        title: { display: true, text: 'Daily Avg MW' },
                                                    },
                                                },
                                                plugins: {
                                                    legend: {
                                                        display: true,
                                                        position: 'top',
                                                    },
                                                },
                                            }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Key Insights */}
                            <div className="bg-gradient-to-r from-energy-green/10 to-blue-500/10 dark:from-energy-green/5 dark:to-blue-500/5 p-6 rounded-lg border border-gray-200 dark:border-white/10">
                                <h3 className="font-bold mb-3 text-navy-950 dark:text-white text-lg">📊 Key Insights</h3>
                                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                    {stats.length > 0 && (
                                        <>
                                            <p>
                                                <strong>Best CFE Performance:</strong> Year {stats[0].bestYear} achieved {stats[0].max.toFixed(1)}% CFE score.
                                            </p>
                                            <p>
                                                <strong>Weather Variability:</strong> CFE scores ranged from {stats[0].min.toFixed(1)}% to {stats[0].max.toFixed(1)}%,
                                                showing a {((stats[0].max - stats[0].min) / stats[0].avg * 100).toFixed(1)}% variance.
                                            </p>
                                            <p>
                                                <strong>Planning Recommendation:</strong> Design your portfolio for the worst-case weather scenario
                                                (Year {stats[0].worstYear}) to ensure consistent performance across all conditions.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
