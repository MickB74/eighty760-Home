'use client';

import { useState, useMemo, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { loadPortfolio } from '@/lib/shared/portfolioStore';
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
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
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
    const [yearlyResults, setYearlyResults] = useState<Array<YearlyPerformance>>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [expandedYear, setExpandedYear] = useState<number | null>(null);

    const handleCompareYears = async () => {
        setLoading(true);
        setProgress(0);
        setYearlyResults([]);

        const years = getAvailableYears();
        const config = {
            year: 2023, // Will be overridden per year
            region: "ERCOT",
            building_portfolio: [{ type: buildingType, annual_mwh: annualLoad }],
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

    // Auto-load portfolio from Aggregation on mount
    useEffect(() => {
        const saved = loadPortfolio();
        if (saved) {
            // Map participants to total load
            const totalLoad = saved.participants.reduce((sum, p) => sum + p.load_mwh, 0);
            if (totalLoad > 0) {
                setAnnualLoad(totalLoad);
                if (saved.participants[0]) {
                    setBuildingType(saved.participants[0].type);
                }
            }

            // Map assets to capacities
            const totalSolar = saved.assets.filter(a => a.type === 'Solar').reduce((sum, a) => sum + a.capacity_mw, 0);
            const totalWind = saved.assets.filter(a => a.type === 'Wind').reduce((sum, a) => sum + a.capacity_mw, 0);

            if (totalSolar > 0) setSolarCapacity(totalSolar);
            if (totalWind > 0) setWindCapacity(totalWind);

            // Map battery
            if (saved.battery.mw > 0) {
                setBatteryCapacity(saved.battery.mw * saved.battery.hours);
            }

            // Map financials
            setBaseRecPrice(saved.financials.rec_price);

            // Map location (use solar hub as primary location)
            if (saved.solarHub) {
                setLocation(saved.solarHub);
            }
        }
    }, []);

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
                            onClick={() => { handleCompareYears(); setIsSidebarOpen(false); }}
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

                {/* Main Content - Full Width */}
                <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
                    {/* Header with Configure Button */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-4xl font-bold brand-text">Weather Performance</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">Compare project performance across historical weather years</p>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="px-4 py-2 bg-white dark:bg-navy-900 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-800 transition-colors font-medium text-gray-700 dark:text-gray-200"
                        >
                            ⚙️ Configure
                        </button>
                    </div>

                    {/* Main Content */}
                    <div>
                        {yearlyResults.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-gray-500 dark:text-gray-400">
                                <div className="text-6xl mb-4">🌤️</div>
                                <h2 className="text-2xl font-bold mb-2">Weather Performance Analysis</h2>
                                <p className="text-center max-w-md">
                                    Click "Configure" to set up your project, then compare how different weather conditions (2020-2025) affect performance.
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

                                {/* Year Cards Gallery */}
                                <div>
                                    <h3 className="text-xl font-bold mb-4 text-navy-950 dark:text-white">
                                        Performance by Year
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {yearlyResults.map((result) => {
                                            const isExpanded = expandedYear === result.year;
                                            const cfeScore = result.result.results.cfe_percent;
                                            const gridConsumption = result.result.results.grid_consumption;
                                            const cleanGen = result.result.results.total_clean_generation;
                                            const emissions = result.result.results.avoided_emissions_mt;
                                            const netCost = result.result.results.net_rec_cost;

                                            // Determine performance grade
                                            let performanceGrade = '🟡';
                                            let gradeText = 'Good';
                                            let gradientClass = 'from-yellow-500/20 to-orange-500/20';

                                            if (cfeScore >= 80) {
                                                performanceGrade = '🟢';
                                                gradeText = 'Excellent';
                                                gradientClass = 'from-green-500/20 to-emerald-500/20';
                                            } else if (cfeScore >= 60) {
                                                performanceGrade = '🟢';
                                                gradeText = 'Very Good';
                                                gradientClass = 'from-lime-500/20 to-green-500/20';
                                            } else if (cfeScore < 40) {
                                                performanceGrade = '🔴';
                                                gradeText = 'Needs Improvement';
                                                gradientClass = 'from-red-500/20 to-orange-500/20';
                                            }

                                            return (
                                                <div
                                                    key={result.year}
                                                    className={`bg-gradient-to-br ${gradientClass} backdrop-blur-md rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer ${isExpanded ? 'md:col-span-2 lg:col-span-3' : ''
                                                        }`}
                                                    onClick={() => setExpandedYear(isExpanded ? null : result.year)}
                                                >
                                                    <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm p-6">
                                                        {/* Card Header */}
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-3xl">{performanceGrade}</span>
                                                                <div>
                                                                    <h4 className="text-2xl font-bold text-navy-950 dark:text-white">
                                                                        {result.year}
                                                                    </h4>
                                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{gradeText} Performance</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-3xl font-bold brand-text">
                                                                    {cfeScore.toFixed(1)}%
                                                                </div>
                                                                <p className="text-xs text-gray-600 dark:text-gray-400">CFE Score</p>
                                                            </div>
                                                        </div>

                                                        {/* Quick Metrics */}
                                                        {!isExpanded && (
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="bg-white/70 dark:bg-navy-950/30 p-3 rounded-lg">
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Clean Energy</p>
                                                                    <p className="font-bold text-navy-950 dark:text-white">
                                                                        {cleanGen.toLocaleString(undefined, { maximumFractionDigits: 0 })} MWh
                                                                    </p>
                                                                </div>
                                                                <div className="bg-white/70 dark:bg-navy-950/30 p-3 rounded-lg">
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Grid Usage</p>
                                                                    <p className="font-bold text-navy-950 dark:text-white">
                                                                        {gridConsumption.toLocaleString(undefined, { maximumFractionDigits: 0 })} MWh
                                                                    </p>
                                                                </div>
                                                                <div className="bg-white/70 dark:bg-navy-950/30 p-3 rounded-lg">
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Emissions Avoided</p>
                                                                    <p className="font-bold text-navy-950 dark:text-white">
                                                                        {emissions.toLocaleString(undefined, { maximumFractionDigits: 0 })} MT
                                                                    </p>
                                                                </div>
                                                                <div className="bg-white/70 dark:bg-navy-950/30 p-3 rounded-lg">
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Net Cost</p>
                                                                    <p className={`font-bold ${netCost < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                                        ${Math.abs(netCost).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                                        {netCost < 0 ? ' ⚠️' : ' ✓'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Expanded Details */}
                                                        {isExpanded && (
                                                            <div className="mt-4 space-y-4 animate-in fade-in duration-300">
                                                                {/* Detailed Metrics Grid */}
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                    <div className="bg-white/70 dark:bg-navy-950/30 p-4 rounded-lg">
                                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">CFE Score</p>
                                                                        <p className="text-2xl font-bold brand-text">{cfeScore.toFixed(1)}%</p>
                                                                    </div>
                                                                    <div className="bg-white/70 dark:bg-navy-950/30 p-4 rounded-lg">
                                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Clean Generation</p>
                                                                        <p className="text-2xl font-bold text-navy-950 dark:text-white">
                                                                            {cleanGen.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">MWh</p>
                                                                    </div>
                                                                    <div className="bg-white/70 dark:bg-navy-950/30 p-4 rounded-lg">
                                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Grid Consumption</p>
                                                                        <p className="text-2xl font-bold text-navy-950 dark:text-white">
                                                                            {gridConsumption.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">MWh</p>
                                                                    </div>
                                                                    <div className="bg-white/70 dark:bg-navy-950/30 p-4 rounded-lg">
                                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Emissions Avoided</p>
                                                                        <p className="text-2xl font-bold text-navy-950 dark:text-white">
                                                                            {emissions.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">MT CO₂</p>
                                                                    </div>
                                                                </div>

                                                                {/* Cost Breakdown */}
                                                                <div className="bg-white/70 dark:bg-navy-950/30 p-4 rounded-lg">
                                                                    <h5 className="font-semibold mb-2 text-navy-950 dark:text-white">Financial Impact</h5>
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-gray-700 dark:text-gray-300">Net REC Cost</span>
                                                                        <span className={`text-xl font-bold ${netCost < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                                            ${netCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Daily Solar Profile Chart */}
                                                                <div className="bg-white/70 dark:bg-navy-950/30 p-4 rounded-lg">
                                                                    <h5 className="font-semibold mb-3 text-navy-950 dark:text-white">Daily Solar Generation Profile</h5>
                                                                    <div className="h-48">
                                                                        {(() => {
                                                                            const solarDaily = aggregateToDaily(
                                                                                result.result.df.map(d => d.Solar_Gen)
                                                                            );
                                                                            const days = Array.from({ length: 365 }, (_, i) => i + 1);

                                                                            return (
                                                                                <Line
                                                                                    data={{
                                                                                        labels: days,
                                                                                        datasets: [{
                                                                                            label: 'Solar Generation (MW)',
                                                                                            data: solarDaily,
                                                                                            borderColor: 'rgb(16, 185, 129)',
                                                                                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                                                            borderWidth: 2,
                                                                                            pointRadius: 0,
                                                                                            fill: true,
                                                                                        }]
                                                                                    }}
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
                                                                                            legend: { display: false },
                                                                                        },
                                                                                    }}
                                                                                />
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </div>

                                                                <p className="text-xs text-center text-gray-500 dark:text-gray-400 italic">
                                                                    Click card to collapse
                                                                </p>
                                                            </div>
                                                        )}

                                                        {!isExpanded && (
                                                            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3 italic">
                                                                Click to expand details
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Statistics Summary */}
                                <div>
                                    <h3 className="text-xl font-bold mb-4 text-navy-950 dark:text-white">
                                        Multi-Year Statistics
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {stats.map((stat) => (
                                            <div key={stat.metric} className="bg-white dark:bg-white/5 backdrop-blur-md p-4 rounded-lg border border-gray-200 dark:border-white/10">
                                                <div className="text-xs uppercase text-gray-700 dark:text-gray-300 font-semibold mb-3">
                                                    {stat.metric}
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">Best</span>
                                                        <div className="text-right">
                                                            <span className="font-mono font-bold text-green-600 dark:text-green-400">
                                                                {stat.max.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                                            </span>
                                                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">({stat.bestYear})</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">Average</span>
                                                        <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                                                            {stat.avg.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">Worst</span>
                                                        <div className="text-right">
                                                            <span className="font-mono font-bold text-red-600 dark:text-red-400">
                                                                {stat.min.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                                            </span>
                                                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">({stat.worstYear})</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
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
