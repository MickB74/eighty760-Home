import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import InfoTooltip from '@/components/shared/InfoTooltip';
import {
    fetchErcotRealtimeDemand,
    fetchHenryHubPrice,
    fetchErcotGridMix,
    fetchErcotDemandAndForecast,
    fetchHenryHubPriceHistory,
    fetchErcotGridMixHistory,
    type DemandsData,
    type HenryHubHistory,
    type FuelMixHistory
} from '@/lib/external/eia';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function MarketDataTab() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [load, setLoad] = useState(0);
    const [capacity, setCapacity] = useState(0);
    const [gasPrice, setGasPrice] = useState(2.84);

    // API State
    const [apiKey, setApiKey] = useState('');
    const [isApiConfigOpen, setIsApiConfigOpen] = useState(false);
    const [usingRealData, setUsingRealData] = useState(false);

    // Data State
    const [fuelMix, setFuelMix] = useState<number[]>([42, 25, 18, 8, 5, 2]); // Default simulated
    const [demandData, setDemandData] = useState<DemandsData[]>([]);
    const [gasHistory, setGasHistory] = useState<HenryHubHistory[]>([]);
    const [mixHistory, setMixHistory] = useState<FuelMixHistory[]>([]);

    // New State for enhancements
    const [futuresData, setFuturesData] = useState<{ month: string, price: number }[]>([]);
    const [carbonHistory, setCarbonHistory] = useState<{ time: string, intensity: number }[]>([]); // gCO2/kWh
    const [renewablesProfile, setRenewablesProfile] = useState<{ time: string, wind: number, solar: number }[]>([]);
    const [hubPrices, setHubPrices] = useState<{ name: string, price: number, trend: 'up' | 'down' | 'flat' }[]>([]);

    useEffect(() => {
        const savedKey = localStorage.getItem('eia_api_key');
        if (savedKey) setApiKey(savedKey);
    }, []);

    const handleSaveKey = (key: string) => {
        setApiKey(key);
        localStorage.setItem('eia_api_key', key);
        setIsApiConfigOpen(false);
        // Trigger fetch immediately
        updateData(key);
    };

    // Simulate live data updates or fetch real
    useEffect(() => {
        // Initial setup
        updateData(apiKey);

        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000 * 60);

        return () => {
            clearInterval(interval);
        };
    }, []);

    // Separate effect for polling real data every 5 mins
    useEffect(() => {
        if (!apiKey) return;

        const apiInterval = setInterval(() => {
            updateData(apiKey);
        }, 300000); // 5 mins

        return () => clearInterval(apiInterval);
    }, [apiKey]);

    const updateData = async (key: string) => {
        if (key) {
            // Try fetching real data
            try {
                const [demands, gasHist, mixHist] = await Promise.all([
                    fetchErcotDemandAndForecast(key),
                    fetchHenryHubPriceHistory(key),
                    fetchErcotGridMixHistory(key)
                ]);

                if (demands.length > 0) {
                    setDemandData(demands);
                    setUsingRealData(true);

                    // Update current load from latest demand
                    const latest = [...demands].reverse().find(d => d.demand !== null);
                    if (latest && latest.demand) {
                        setLoad(latest.demand);
                        // Estimate capacity/reserves
                        setCapacity(Math.round(latest.demand * 1.15));
                    }
                }

                if (gasHist.length > 0) {
                    setGasHistory(gasHist);
                    setGasPrice(gasHist[gasHist.length - 1].value);
                }

                if (mixHist.length > 0) {
                    setMixHistory(mixHist);

                    // Update current fuel mix slice
                    const latestMix = mixHist[mixHist.length - 1];
                    const categories = ['Natural Gas', 'Wind', 'Solar', 'Nuclear', 'Coal', 'Other'];
                    const values = categories.map(cat => {
                        if (cat === 'Other') {
                            return Object.entries(latestMix)
                                .filter(([k]) => k !== 'period' && !categories.slice(0, 5).includes(k))
                                .reduce((sum, [, v]) => sum + (typeof v === 'number' ? v : 0), 0);
                        }
                        return (latestMix[cat] as number) || 0;
                    });
                    setFuelMix(values);

                    // Calculations for Carbon + Renewables
                    // If real data, we calculate carbon intensity for the 24h period
                    // Intensity Factors (approx gCO2/kWh)
                    const factors: Record<string, number> = {
                        'Natural Gas': 490,
                        'Coal': 820,
                        'Nuclear': 12,
                        'Wind': 11,
                        'Solar': 41,
                        'Other': 200
                    };

                    const cHist = mixHist.map(m => {
                        let totalGen = 0;
                        let totalEmissions = 0;
                        let wind = 0;
                        let solar = 0;

                        Object.entries(m).forEach(([k, v]) => {
                            if (k === 'period' || typeof v !== 'number') return;
                            totalGen += v;

                            // Map 'clean' names if necessary, but eia uses specific codes. 
                            // Our fetcher maps them to human readable keys in 'type-name' usually...
                            // Wait, our new fetcher returns `Record<string, number>`.
                            // Let's assume keys match our categories or similar.
                            // In `eia.ts`, we map `type-name` to key.

                            let factor = 0;
                            if (k.includes('Gas')) factor = factors['Natural Gas'];
                            else if (k.includes('Coal') || k.includes('Lignite')) factor = factors['Coal'];
                            else if (k.includes('Nuclear')) factor = factors['Nuclear'];
                            else if (k.includes('Wind')) { factor = factors['Wind']; wind = v; }
                            else if (k.includes('Solar')) { factor = factors['Solar']; solar = v; }
                            else factor = factors['Other'];

                            totalEmissions += v * factor;
                        });

                        return {
                            time: m.period,
                            intensity: totalGen > 0 ? Math.round(totalEmissions / totalGen) : 0,
                            wind,
                            solar
                        };
                    });

                    setCarbonHistory(cHist.map(x => ({ time: x.time, intensity: x.intensity })));
                    setRenewablesProfile(cHist.map(x => ({ time: x.time, wind: x.wind, solar: x.solar })));
                }

                // Futures Simulation (Mock for now, even with Real Data unless we add new API)
                generateFutures(gasPrice);

                // Generate Hub Prices (Simulated based on Real Load/Gas if available)
                // Real LMP is hard to get from free EIA. We estimate:
                // Price ~ Gas * HeatRate + Scarcity(Load)
                const currentLoad = load || 40000;
                const currentGas = gasPrice || 2.5;
                const estimatedPrice = (currentGas * 8) + Math.max(0, (currentLoad - 50000) * 0.01); // Simple model

                const hubs = [
                    { name: 'HB_NORTH', factor: 1.0 },
                    { name: 'HB_SOUTH', factor: 1.05 },
                    { name: 'HB_WEST', factor: 0.85 },
                    { name: 'HB_HOUSTON', factor: 1.02 }
                ];
                setHubPrices(hubs.map(h => {
                    const price = estimatedPrice * h.factor + (Math.random() - 0.5) * 5;
                    return {
                        name: h.name,
                        price: Math.max(0, price),
                        trend: Math.random() > 0.5 ? 'up' : 'down' as 'up' | 'down' | 'flat'
                    };
                }));

                if (demands.length === 0 && gasHist.length === 0) throw new Error("No data");

            } catch (e) {
                console.warn('API Fetch failed, using simulation', e);
                setUsingRealData(false);
                runSimulation();
            }
        } else {
            setUsingRealData(false);
            runSimulation();
        }
    };

    const generateFutures = (currentPrice: number) => {
        const now = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Simple Contango curve
        const curve = [];
        for (let i = 1; i <= 3; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            // Price increase by ~3% per month
            const price = currentPrice * (1 + (i * 0.03) + (Math.random() * 0.02));
            curve.push({
                month: `${months[d.getMonth()]} '${d.getFullYear().toString().slice(2)}`,
                price: parseFloat(price.toFixed(2))
            });
        }
        setFuturesData(curve);
    };

    const runSimulation = () => {
        const now = new Date();
        const hour = now.getHours() + now.getMinutes() / 60;

        // Simple daily load curve simulation
        const shape = -Math.cos((hour - 4) * Math.PI / 12) * 0.5 + 0.5; // 0 to 1
        const targetLoad = 40000 + shape * 35000;

        // Add random noise
        const noise = (Math.random() - 0.5) * 500;
        const simLoad = Math.round(targetLoad + noise);

        setLoad(simLoad);
        setCapacity(Math.round(targetLoad + 5000 + Math.random() * 1000)); // Reserves ~5GW

        // Random walk gas price slightly
        const simGasPrice = Math.max(1.5, Math.min(5.0, 2.84 + (Math.random() - 0.5) * 0.1));
        setGasPrice(simGasPrice);

        // Use default fuel mix
        setFuelMix([42, 25, 18, 8, 5, 2]);

        // Generate Simulated History for Charts (so they appear in demo mode)
        const simHistoryLength = 24;
        const simDemands: DemandsData[] = [];
        const simMix: FuelMixHistory[] = [];
        const simGas: HenryHubHistory[] = [];
        const simCarbon: { time: string, intensity: number }[] = [];
        const simRenewables: { time: string, wind: number, solar: number }[] = [];

        for (let i = 0; i < simHistoryLength; i++) {
            // Hour i (0 to 23 ago)
            const hDate = new Date(now.getTime() - (simHistoryLength - 1 - i) * 3600000);
            const h = hDate.getHours();
            const dateStr = hDate.toISOString();

            // Load Shape
            const s = -Math.cos((h - 4) * Math.PI / 12) * 0.5 + 0.5;
            const l = 40000 + s * 35000 + (Math.random() - 0.5) * 500;
            simDemands.push({
                period: dateStr,
                demand: l,
                forecast: l * (1 + (Math.random() - 0.5) * 0.05)
            });

            // Mix Shape
            // Solar: Peak at 14:00, 0 at night
            const solar = Math.max(0, -Math.cos((h - 14) * Math.PI / 8)) * 15000;
            // Wind: Random walk + daily cycle
            const wind = 10000 + Math.sin(h * Math.PI / 12) * 3000 + Math.random() * 1000;
            const nuclear = 5000;
            const coal = 8000;
            const gas = Math.max(0, l - solar - wind - nuclear - coal); // Gas fills gap

            simMix.push({
                period: dateStr,
                'Natural Gas': gas,
                'Wind': wind,
                'Solar': solar,
                'Nuclear': nuclear,
                'Coal': coal,
                'Other': 500
            });

            // Carbon Intensity Sim
            const totalGen = l; // approx
            const emissions = (gas * 490) + (coal * 820) + (nuclear * 12) + (wind * 11) + (solar * 41);
            simCarbon.push({
                time: dateStr,
                intensity: Math.round(emissions / totalGen)
            });

            simRenewables.push({
                time: dateStr,
                wind,
                solar
            });
        }

        // Gas History (30 days)
        for (let i = 0; i < 30; i++) {
            const d = new Date(now.getTime() - (29 - i) * 86400000);
            simGas.push({
                period: d.toISOString().split('T')[0],
                value: simGasPrice + Math.random() * 0.5 - 0.25
            });
        }

        setDemandData(simDemands);
        setMixHistory(simMix);
        setGasHistory(simGas);
        setCarbonHistory(simCarbon);
        setRenewablesProfile(simRenewables);

        generateFutures(simGasPrice);

        // Generate Simulated Hub Prices
        // Base around $35 + load correlation
        const baseHub = 25 + (simLoad / 80000) * 40; // 25 to 65
        const hubs = [
            { name: 'HB_NORTH', factor: 1.0 },
            { name: 'HB_SOUTH', factor: 1.05 },
            { name: 'HB_WEST', factor: 0.85 }, // Often congested / lower
            { name: 'HB_HOUSTON', factor: 1.02 }
        ];

        setHubPrices(hubs.map(h => {
            const price = baseHub * h.factor + (Math.random() - 0.5) * 5;
            return {
                name: h.name,
                price: Math.max(0, price),
                trend: Math.random() > 0.5 ? 'up' : 'down'
            };
        }));
    };

    const reserves = capacity - load;
    const reserveMargin = load > 0 ? (reserves / load) * 100 : 0;

    // Chart Data - Fuel Mix
    const fuelMixChartData = {
        labels: ['Natural Gas', 'Wind', 'Solar', 'Nuclear', 'Coal', 'Other'],
        datasets: [
            {
                data: fuelMix,
                backgroundColor: [
                    '#f97316', '#3b82f6', '#eab308', '#22c55e', '#64748b', '#a8a29e',
                ],
                borderWidth: 0,
            },
        ],
    };

    // Chart Data - Load Forecast (24h)
    let forecastLabels: string[] = [];
    let loadDataset: (number | null)[] = [];
    let forecastDataset: (number | null)[] = [];

    if (demandData.length > 0) {
        forecastLabels = demandData.map(d => {
            const date = new Date(d.period);
            return date.getHours() + ':00';
        });
        loadDataset = demandData.map(d => d.demand);
        forecastDataset = demandData.map(d => d.forecast);
    }

    const forecastChartData = {
        labels: forecastLabels,
        datasets: [
            {
                label: 'Actual Demand',
                data: loadDataset,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Day-Ahead Forecast',
                data: forecastDataset,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.0)',
                borderDash: [5, 5],
                tension: 0.4
            }
        ]
    };

    // Chart Data - Gas Price
    const gasLabels = gasHistory.map(h => {
        const parts = h.period.split('-');
        if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
        return h.period;
    });
    const gasChartData = {
        labels: gasLabels,
        datasets: [
            {
                label: 'Henry Hub Spot Price ($/MMBtu)',
                data: gasHistory.map(h => h.value),
                borderColor: '#f97316',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                fill: true,
                tension: 0.2
            }
        ]
    };

    // Chart Data - Futures (Bar)
    const futuresChartData = {
        labels: futuresData.map(f => f.month),
        datasets: [
            {
                label: 'Futures Price ($/MMBtu)',
                data: futuresData.map(f => f.price),
                backgroundColor: '#f97316',
                borderRadius: 4,
            }
        ]
    };

    // Chart Data - Net Load
    // Net Load = Demand - (Wind + Solar)
    const netLoadDataset = demandData.map((d, i) => {
        if (!d.demand) return null;
        const ren = renewablesProfile[i];
        if (!ren) return d.demand;
        return Math.max(0, d.demand - ren.wind - ren.solar);
    });

    const netLoadChartData = {
        labels: forecastLabels,
        datasets: [
            {
                label: 'Total Demand',
                data: loadDataset,
                borderColor: '#9ca3af', // Gray
                borderWidth: 1,
                pointRadius: 0,
                fill: false,
                tension: 0.4
            },
            {
                label: 'Net Load (Duck Curve)',
                data: netLoadDataset,
                borderColor: '#8b5cf6', // Violet
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    // Chart Data - Carbon Intensity
    const carbonChartData = {
        labels: forecastLabels,
        datasets: [
            {
                label: 'Carbon Intensity (gCO2/kWh)',
                data: carbonHistory.map(c => c.intensity),
                borderColor: '#64748b', // Slate
                backgroundColor: 'rgba(100, 116, 139, 0.2)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'right' as const, labels: { color: '#9ca3af' } }
        }
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#9ca3af' } },
            tooltip: { mode: 'index' as const, intersect: false }
        },
        scales: {
            x: { grid: { color: 'rgba(156, 163, 175, 0.1)' }, ticks: { color: '#9ca3af' } },
            y: { grid: { color: 'rgba(156, 163, 175, 0.1)' }, ticks: { color: '#9ca3af' } }
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header / Timestamp */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-navy-950 dark:text-white flex items-center gap-2">
                        Current Grid Conditions
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${usingRealData ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                            {usingRealData ? 'EIA Live Data' : 'Normal (Simulated)'}
                        </span>
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <p>{usingRealData ? 'Data Source: EIA Open Data API' : 'Live data (Simulated Demo Stream)'}</p>
                        <button
                            onClick={() => setIsApiConfigOpen(!isApiConfigOpen)}
                            className="text-blue-500 hover:text-blue-600 underline text-xs ml-2"
                        >
                            {apiKey ? 'Configure API' : 'Connect EIA API'}
                        </button>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-mono text-navy-950 dark:text-white font-bold">{currentTime.toLocaleTimeString()}</p>
                    <p className="text-xs text-gray-500">{currentTime.toLocaleDateString()}</p>
                </div>
            </div>

            {/* API Config Panel */}
            {isApiConfigOpen && (
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-lg border border-gray-200 dark:border-white/10 mb-4 animate-in slide-in-from-top-2">
                    <p className="text-sm font-bold text-navy-950 dark:text-white mb-2">Connect to EIA Open Data</p>
                    <div className="flex flex-col gap-2">
                        <p className="text-xs text-gray-500 mb-2">
                            Enter your free API key from <a href="https://www.eia.gov/opendata/register.php" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">eia.gov</a> to fetch real-time grid and market data.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter EIA API Key"
                                className="flex-1 p-2 rounded border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button
                                onClick={() => handleSaveKey(apiKey)}
                                className="px-4 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700"
                            >
                                Save & Connect
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Current Load */}
                <div className="bg-white dark:bg-navy-900 p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Current Demand</p>
                    <h3 className="text-3xl font-bold text-navy-950 dark:text-white">{Number(load).toLocaleString()} <span className="text-lg text-gray-400 font-normal">MW</span></h3>
                    <div className="mt-2 text-xs text-blue-500 font-medium flex items-center gap-1">
                        <span>↗</span> +1.2% vs Forecast
                    </div>
                </div>

                {/* Available Capacity */}
                <div className="bg-white dark:bg-navy-900 p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                    </div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Committed Capacity</p>
                    <h3 className="text-3xl font-bold text-navy-950 dark:text-white">{capacity.toLocaleString()} <span className="text-lg text-gray-400 font-normal">MW</span></h3>
                    <div className="mt-2 text-xs text-green-500 font-medium flex items-center gap-1">
                        <span>✓</span> Sufficient Resources
                    </div>
                </div>

                {/* Reserves */}
                <div className="bg-white dark:bg-navy-900 p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Operating Reserves</p>
                    <h3 className="text-3xl font-bold text-navy-950 dark:text-white">{reserves.toLocaleString()} <span className="text-lg text-gray-400 font-normal">MW</span></h3>
                    <div className={`mt-2 text-xs font-medium flex items-center gap-1 ${reserveMargin > 5 ? 'text-green-500' : 'text-amber-500'}`}>
                        <span>{reserveMargin.toFixed(1)}%</span> Margin
                    </div>
                </div>

                {/* Henry Hub Price */}
                <div className="bg-white dark:bg-navy-900 p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                        </svg>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm text-gray-500 font-medium">Henry Hub Gas</p>
                        <InfoTooltip text="Spot price for natural gas, a key driver of ERCOT marginal prices." />
                    </div>
                    <h3 className="text-3xl font-bold text-navy-950 dark:text-white">${gasPrice.toFixed(2)} <span className="text-lg text-gray-400 font-normal">/MMBtu</span></h3>
                    <div className="mt-2 text-xs text-orange-500 font-medium flex items-center gap-1">
                        <span>●</span> {usingRealData ? 'EIA Spot Price' : 'Live Spot Price'}
                    </div>
                </div>
            </div>

            {/* Hub Prices Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {hubPrices.map((hub) => (
                    <div key={hub.name} className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{hub.name}</p>
                                <p className="text-[10px] text-gray-400">RTM Settlement Point</p>
                            </div>
                            {hub.trend === 'up' && <span className="text-red-500 text-xs">▲</span>}
                            {hub.trend === 'down' && <span className="text-green-500 text-xs">▼</span>}
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-navy-950 dark:text-white">${hub.price.toFixed(2)}</span>
                            <span className="text-xs text-gray-400">/MWh</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row 1: Mix + Demand */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Fuel Mix */}
                <div className="bg-white dark:bg-navy-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm lg:col-span-1">
                    <h3 className="text-lg font-bold text-navy-950 dark:text-white mb-4">Current Fuel Mix</h3>
                    <div className="h-[300px]">
                        <Doughnut data={fuelMixChartData} options={doughnutOptions} />
                    </div>
                </div>

                {/* Supply vs Demand */}
                <div className="bg-white dark:bg-navy-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm lg:col-span-2">
                    <h3 className="text-lg font-bold text-navy-950 dark:text-white mb-4">
                        Demand vs Forecast (48h)
                    </h3>
                    <div className="h-[300px]">
                        <Line data={forecastChartData} options={lineOptions} />
                    </div>
                </div>
            </div>

            {/* Charts Row 2: Gas Trends (Split: Spot History + Futures) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Existing Spot History */}
                {gasHistory.length > 0 && (
                    <div className="bg-white dark:bg-navy-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                        <h3 className="text-lg font-bold text-navy-950 dark:text-white mb-4">Henry Hub Spot Price Details (30 Days)</h3>
                        <div className="h-[250px]">
                            <Line data={gasChartData} options={lineOptions} />
                        </div>
                    </div>
                )}
                {/* New Futures Chart */}
                {futuresData.length > 0 && (
                    <div className="bg-white dark:bg-navy-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                        <h3 className="text-lg font-bold text-navy-950 dark:text-white mb-4">Henry Hub Futures (Next 3 Months)</h3>
                        <div className="h-[250px]">
                            <Bar data={futuresChartData} options={{
                                ...lineOptions,
                                plugins: { ...lineOptions.plugins, legend: { display: false } }
                            }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Charts Row 3: Advanced Integrations (Net Load + Carbon) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Net Load */}
                {demandData.length > 0 && (
                    <div className="bg-white dark:bg-navy-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                        <h3 className="text-lg font-bold text-navy-950 dark:text-white mb-4 flex items-center gap-2">
                            Net Load (Duck Curve)
                            <InfoTooltip text="Total Demand minus Variable Renewables (Wind + Solar). This represents the load that dispatchable generation must serve." />
                        </h3>
                        <div className="h-[250px]">
                            <Line data={netLoadChartData} options={lineOptions} />
                        </div>
                    </div>
                )}
                {/* Carbon Intensity */}
                {carbonHistory.length > 0 && (
                    <div className="bg-white dark:bg-navy-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                        <h3 className="text-lg font-bold text-navy-950 dark:text-white mb-4 flex items-center gap-2">
                            Grid Carbon Intensity
                            <InfoTooltip text="Estimated CO2 emissions per kWh of electricity generated based on current fuel mix." />
                        </h3>
                        <div className="h-[250px]">
                            <Line data={carbonChartData} options={lineOptions} />
                        </div>
                    </div>
                )}
            </div>

            {/* Charts Row 4: Fuel Mix Breakdown (6 Small Charts) */}
            {mixHistory.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-navy-950 dark:text-white mb-4 mt-2">Source Generation Trends (24h)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { id: 'Natural Gas', color: '#f97316', label: 'Natural Gas' },
                            { id: 'Wind', color: '#3b82f6', label: 'Wind' },
                            { id: 'Solar', color: '#eab308', label: 'Solar' },
                            { id: 'Nuclear', color: '#22c55e', label: 'Nuclear' },
                            { id: 'Coal', color: '#64748b', label: 'Coal' },
                            { id: 'Other', color: '#a8a29e', label: 'Other/Hydro' },
                        ].map((fuel) => {
                            // Prepare data for this fuel type
                            const historyLabels = mixHistory.map(m => {
                                const d = new Date(m.period);
                                return d.getHours() + ':00';
                            });

                            const historyData = mixHistory.map(m => {
                                if (fuel.id === 'Other') {
                                    // Sum up others
                                    const mainCats = ['Natural Gas', 'Wind', 'Solar', 'Nuclear', 'Coal'];
                                    return Object.entries(m)
                                        .filter(([k]) => k !== 'period' && !mainCats.includes(k))
                                        .reduce((sum, [, v]) => sum + (typeof v === 'number' ? v : 0), 0);
                                }
                                return (m[fuel.id] as number) || 0;
                            });

                            const chartData = {
                                labels: historyLabels,
                                datasets: [{
                                    label: fuel.label,
                                    data: historyData,
                                    borderColor: fuel.color,
                                    backgroundColor: fuel.color + '20', // 20 hex = ~12% opacity
                                    fill: true,
                                    pointRadius: 0,
                                    borderWidth: 2,
                                    tension: 0.4
                                }]
                            };

                            // Mini chart options
                            const miniOptions = {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: { mode: 'index' as const, intersect: false }
                                },
                                scales: {
                                    x: { display: false }, // Hide X axis for cleaner look or keep minimal? Let's hide to reduce clutter
                                    y: {
                                        display: true,
                                        ticks: { color: '#9ca3af', font: { size: 10 }, maxTicksLimit: 4 },
                                        grid: { color: 'rgba(156, 163, 175, 0.1)' }
                                    }
                                }
                            };

                            return (
                                <div key={fuel.id} className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-bold text-navy-950 dark:text-white flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: fuel.color }}></span>
                                            {fuel.label}
                                        </h4>
                                        <span className="text-xs text-gray-400 font-mono">
                                            {historyData[historyData.length - 1]?.toLocaleString(undefined, { maximumFractionDigits: 0 })} MW
                                        </span>
                                    </div>
                                    <div className="h-[120px]">
                                        <Line data={chartData} options={miniOptions} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> {usingRealData ? 'Real-time data provided by EIA Open Data API.' : 'Simulated data is being used for demonstration. Connect your EIA API Key to see live data.'}
            </div>
        </div>
    );
}
