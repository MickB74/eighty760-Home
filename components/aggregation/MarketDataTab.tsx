'use client';

import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import InfoTooltip from '@/components/shared/InfoTooltip';
import {
    type DemandsData,
    type HenryHubHistory,
    type FuelMixHistory
} from '@/lib/external/eia';
import { loadHubPrices } from '@/lib/aggregation/price-loader';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// Loading skeleton component for fast perceived load
const LoadingSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
            <div>
                <div className="h-7 w-64 bg-gray-200 dark:bg-navy-700 rounded mb-2"></div>
                <div className="h-4 w-48 bg-gray-100 dark:bg-navy-800 rounded"></div>
            </div>
            <div className="text-right">
                <div className="h-8 w-24 bg-gray-200 dark:bg-navy-700 rounded mb-1"></div>
                <div className="h-3 w-20 bg-gray-100 dark:bg-navy-800 rounded"></div>
            </div>
        </div>
        {/* KPI Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white dark:bg-navy-900 p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-navy-700 rounded mb-3"></div>
                    <div className="h-9 w-32 bg-gray-300 dark:bg-navy-600 rounded mb-2"></div>
                    <div className="h-3 w-20 bg-gray-100 dark:bg-navy-800 rounded"></div>
                </div>
            ))}
        </div>
        {/* Hub Prices skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="h-3 w-16 bg-gray-200 dark:bg-navy-700 rounded mb-2"></div>
                    <div className="h-7 w-20 bg-gray-300 dark:bg-navy-600 rounded"></div>
                </div>
            ))}
        </div>
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-navy-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm lg:col-span-1">
                <div className="h-5 w-32 bg-gray-200 dark:bg-navy-700 rounded mb-4"></div>
                <div className="h-[300px] bg-gray-100 dark:bg-navy-800 rounded"></div>
            </div>
            <div className="bg-white dark:bg-navy-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm lg:col-span-2">
                <div className="h-5 w-48 bg-gray-200 dark:bg-navy-700 rounded mb-4"></div>
                <div className="h-[300px] bg-gray-100 dark:bg-navy-800 rounded"></div>
            </div>
        </div>
    </div>
);

export default function MarketDataTab() {
    // Loading states for perceived performance
    const [isLoading, setIsLoading] = useState(true);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [load, setLoad] = useState(0);
    const [capacity, setCapacity] = useState(0);
    const [gasPrice, setGasPrice] = useState(2.84);

    // API State
    const [usingRealData, setUsingRealData] = useState(false);
    const [gasSource, setGasSource] = useState<string>('EIA Spot');
    const [gasDayChange, setGasDayChange] = useState<number | null>(null);
    const [gasYtdChange, setGasYtdChange] = useState<number | null>(null);
    const [gasYearChange, setGasYearChange] = useState<number | null>(null);

    // Data State
    const [fuelMix, setFuelMix] = useState<number[]>([42, 25, 18, 8, 5, 2]); // Default simulated
    const [demandData, setDemandData] = useState<DemandsData[]>([]);
    const [gasHistory, setGasHistory] = useState<HenryHubHistory[]>([]);
    const [mixHistory, setMixHistory] = useState<FuelMixHistory[]>([]);

    // New State for enhancements
    const [futuresData, setFuturesData] = useState<{ month: string, price: number, isHistory?: boolean }[]>([]);
    const [isRealFutures, setIsRealFutures] = useState(false);
    const [carbonHistory, setCarbonHistory] = useState<{ time: string, intensity: number }[]>([]); // gCO2/kWh
    const [renewablesProfile, setRenewablesProfile] = useState<{ time: string, wind: number, solar: number }[]>([]);
    const [hubPrices, setHubPrices] = useState<{ name: string, price: number, trend: 'up' | 'down' | 'flat' }[]>([]);

    // Historical Hub Prices (Monthly Averages)
    const [hubHistoryData, setHubHistoryData] = useState<Record<string, number[]>>({}); // { 'North': [jan, feb...], ... }

    // Manual Ingestion State
    const [ingestUrl, setIngestUrl] = useState('');
    const [isIngesting, setIsIngesting] = useState(false);
    const [ingestResult, setIngestResult] = useState<any>(null);
    const [ingestError, setIngestError] = useState('');

    const handleIngest = async () => {
        console.log('Manually ingesting:', ingestUrl);
        if (!ingestUrl) {
            console.log('No URL provided');
            return;
        }
        setIsIngesting(true);
        setIngestResult(null);
        setIngestError('');

        try {
            console.log('Fetching /api/ingest...');
            const res = await fetch('/api/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: ingestUrl })
            });
            console.log('Response status:', res.status);
            const data = await res.json();
            console.log('Response data:', data);

            if (res.ok) {
                setIngestResult(data.analysis);
                setIngestUrl(''); // Clear input on success
            } else {
                setIngestError(data.error || 'Failed to ingest');
            }
        } catch (err) {
            console.error('Ingest error:', err);
            setIngestError('Network error occurred');
        } finally {
            setIsIngesting(false);
        }
    };

    // Deferred hub history loading - loads AFTER main content for faster perceived load
    const loadHubHistory = async () => {
        if (Object.keys(hubHistoryData).length > 0) return; // Already loaded
        setIsHistoryLoading(true);
        try {
            const hubs = ['North', 'South', 'West', 'Houston'];
            const historyMap: Record<string, number[]> = {};

            await Promise.all(hubs.map(async (hub) => {
                const hourly = await loadHubPrices(2025, hub);
                if (hourly && hourly.length > 0) {
                    // Aggregate to Monthly Averages
                    const monthlySums = new Array(12).fill(0);
                    const monthlyCounts = new Array(12).fill(0);
                    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

                    hourly.forEach((price, hourIdx) => {
                        if (hourIdx >= 8760) return;
                        const dayOfYear = Math.floor(hourIdx / 24);
                        let month = 0;
                        let d = dayOfYear;
                        for (let m = 0; m < 12; m++) {
                            if (d < daysInMonth[m]) {
                                month = m;
                                break;
                            }
                            d -= daysInMonth[m];
                        }
                        monthlySums[month] += price;
                        monthlyCounts[month]++;
                    });

                    historyMap[hub] = monthlySums.map((sum, i) => monthlyCounts[i] > 0 ? sum / monthlyCounts[i] : 0);
                }
            }));
            setHubHistoryData(historyMap);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    useEffect(() => {
        // Initial Fetch - track loading state for skeleton
        const initLoad = async () => {
            setIsLoading(true);
            await updateData();
            setIsLoading(false);
            // Defer heavy hub history load until AFTER main content displays
            loadHubHistory();
        };
        initLoad();

        const interval = setInterval(() => {
            updateData();
        }, 60000);

        return () => {
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateData = async () => {
        try {
            const [statusRes, mixRes, tickerRes] = await Promise.all([
                fetch('/api/ercot/status'),
                fetch('/api/ercot/fuel-mix'),
                fetch('/api/ticker')
            ]);

            if (statusRes.ok && mixRes.ok) {
                const statusData = await statusRes.json();
                const mixData = await mixRes.json();
                setUsingRealData(true);

                // 0. Update Timestamp
                // Format: 2026-01-15 11:01:33-0600 -> Local Time
                if (statusData.lastUpdated) {
                    const date = new Date(statusData.lastUpdated);
                    if (!isNaN(date.getTime())) {
                        setLastUpdated(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                    } else {
                        // Fallback parse if Date string format is non-standard or needs tweaks
                        setLastUpdated(statusData.lastUpdated.split(' ')[1].slice(0, 5));
                    }
                }

                // 1. Reserves from Status
                const reservesVal = parseFloat(statusData.current_condition.prc_value.replace(/,/g, ''));

                // 2. Fuel Mix Parsing
                const history: FuelMixHistory[] = [];
                const dates = Object.keys(mixData.data).sort();
                let latestTotalGen = 0;

                dates.forEach(date => {
                    const times = mixData.data[date];
                    Object.entries(times).forEach(([ts, val]: [string, any]) => {
                        let periodGen = 0;
                        const entry: any = { period: ts };
                        // API Keys: "Solar", "Wind", "Natural Gas", "Coal and Lignite", "Nuclear", "Hydro", "Power Storage", "Other"
                        Object.entries(val).forEach(([fuel, data]: [string, any]) => {
                            const mw = Math.max(0, data.gen || 0);
                            const key = fuel === 'Coal and Lignite' ? 'Coal' : fuel;
                            entry[key] = mw;
                            periodGen += mw;
                        });
                        history.push(entry);
                        latestTotalGen = periodGen;
                    });
                });

                // Sort and keep recent
                history.sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());
                const recentHistory = history.slice(-288); // Last 24h
                setMixHistory(recentHistory);

                // Populate derived Demand Data (so charts work)
                // Since we can't get official Load/Forecast, we usage Total Gen as Proxy for Load
                const derivedDemand: DemandsData[] = recentHistory.map(h => {
                    let total = 0;
                    Object.entries(h).forEach(([k, v]) => {
                        if (k !== 'period') total += (v as number);
                    });
                    return {
                        period: h.period,
                        demand: Math.round(total),
                        forecast: null // We don't have forecast from fuel-mix
                    };
                });
                setDemandData(derivedDemand);

                // Populate Renewables Profile for Net Load
                const derivedRenewables = recentHistory.map(h => ({
                    time: h.period,
                    wind: (h['Wind'] as number) || 0,
                    solar: (h['Solar'] as number) || 0
                }));
                setRenewablesProfile(derivedRenewables);

                // Update Load & Capacity
                setLoad(Math.round(latestTotalGen));
                setCapacity(Math.round(latestTotalGen + reservesVal));

                // Update mix chart
                if (recentHistory.length > 0) {
                    const latest = recentHistory[recentHistory.length - 1];
                    const mixValues = [
                        (latest['Natural Gas'] as number) || 0,
                        (latest['Wind'] as number) || 0,
                        (latest['Solar'] as number) || 0,
                        (latest['Nuclear'] as number) || 0,
                        (latest['Coal'] as number) || 0,
                        ((latest['Hydro'] as number) || 0) + ((latest['Other'] as number) || 0) + ((latest['Power Storage'] as number) || 0)
                    ];
                    setFuelMix(mixValues);
                }

                // 3. Derived Carbon & Renewables
                const factors: Record<string, number> = {
                    'Natural Gas': 490,
                    'Coal': 820,
                    'Nuclear': 12,
                    'Wind': 11,
                    'Solar': 41,
                    'Other': 200,
                    'Hydro': 0,
                    'Power Storage': 100
                };

                const derivedCarbon = recentHistory.map(h => {
                    let emissions = 0;
                    let gen = 0;
                    Object.entries(h).forEach(([k, v]) => {
                        if (k === 'period') return;
                        const val = v as number;
                        gen += val;
                        emissions += val * (factors[k] || 200);
                    });
                    return {
                        time: h.period,
                        intensity: gen > 0 ? Math.round(emissions / gen) : 0
                    };
                });
                setCarbonHistory(derivedCarbon);

                // Fetch real futures data from API
                try {
                    const futuresRes = await fetch('/api/futures');
                    if (futuresRes.ok) {
                        const futuresJson = await futuresRes.json();
                        if (futuresJson.futures && futuresJson.futures.length > 0) {
                            setFuturesData(futuresJson.futures.map((f: any) => ({ month: f.month, price: f.price })));
                            setIsRealFutures(futuresJson.isRealData === true);
                        } else {
                            generateFutures(2.84);
                            setIsRealFutures(false);
                        }
                    } else {
                        generateFutures(2.84);
                        setIsRealFutures(false);
                    }
                } catch {
                    generateFutures(2.84);
                    setIsRealFutures(false);
                }

                // Use real ERCOT RTM prices from ticker endpoint
                if (tickerRes.ok) {
                    const tickerData = await tickerRes.json();

                    // Update gas price and source from ticker
                    if (tickerData.gasPrice && tickerData.isRealGas) {
                        setGasPrice(tickerData.gasPrice);
                        setGasSource(tickerData.gasSource || 'EIA Spot');
                        // Set % change metrics
                        setGasDayChange(tickerData.gasDayChange ?? null);
                        setGasYtdChange(tickerData.gasYtdChange ?? null);
                        setGasYearChange(tickerData.gasYearChange ?? null);
                    }

                    if (tickerData.prices && tickerData.isRealPrices) {
                        // Real prices from ERCOT
                        const hubNames = ['HB_NORTH', 'HB_SOUTH', 'HB_WEST', 'HB_HOUSTON'];
                        setHubPrices(hubNames.map(name => ({
                            name,
                            price: parseFloat(tickerData.prices[name] || '0'),
                            trend: 'flat' as 'up' | 'down' | 'flat' // Could track trend by comparing to previous value
                        })));
                    } else {
                        // Fallback to estimated prices if ticker failed
                        const estimatedPrice = (2.5 * 8) + Math.max(0, (latestTotalGen - 50000) * 0.005);
                        const hubs = [
                            { name: 'HB_NORTH', factor: 1.0 },
                            { name: 'HB_SOUTH', factor: 1.05 },
                            { name: 'HB_WEST', factor: 0.85 },
                            { name: 'HB_HOUSTON', factor: 1.02 }
                        ];
                        setHubPrices(hubs.map(h => ({
                            name: h.name,
                            price: Math.max(10, estimatedPrice * h.factor + (Math.random() - 0.5) * 5),
                            trend: 'flat' as 'up' | 'down' | 'flat'
                        })));
                    }
                }


            } else {
                throw new Error("API Error");
            }
        } catch (e) {
            console.warn("Falling back to simulation", e);
            runSimulation();
        }
    };

    const generateFutures = (currentPrice: number) => {
        const now = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const curve = [];

        // History: Last 3 Months
        for (let i = -3; i < 0; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            // Simulate random variation for history
            const price = currentPrice * (1 + (i * 0.02) + (Math.random() - 0.5) * 0.1);
            curve.push({
                month: `${months[d.getMonth()]} '${d.getFullYear().toString().slice(2)}`,
                price: parseFloat(price.toFixed(2)),
                isHistory: true
            });
        }

        // Futures: Next 6 Months (to include May-July)
        for (let i = 1; i <= 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            // Price increase by ~3% per month (Contango)
            const price = currentPrice * (1 + (i * 0.03) + (Math.random() * 0.02));
            curve.push({
                month: `${months[d.getMonth()]} '${d.getFullYear().toString().slice(2)}`,
                price: parseFloat(price.toFixed(2)),
                isHistory: false
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
        setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

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
                label: 'Price ($/MMBtu)',
                data: futuresData.map(f => f.price),
                backgroundColor: futuresData.map(f => f.isHistory ? '#64748b' : '#f97316'), // Slate-500 for history, Orange-500 for futures
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

    // Chart Data - Hub Price History (12 Months)
    const hubHistoryChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'North Hub',
                data: hubHistoryData['North'] || [],
                borderColor: '#3b82f6', // Blue
                backgroundColor: 'transparent',
                tension: 0.4
            },
            {
                label: 'South Hub',
                data: hubHistoryData['South'] || [],
                borderColor: '#10b981', // Green
                backgroundColor: 'transparent',
                tension: 0.4
            },
            {
                label: 'West Hub',
                data: hubHistoryData['West'] || [],
                borderColor: '#f59e0b', // Amber
                backgroundColor: 'transparent',
                tension: 0.4
            },
            {
                label: 'Houston Hub',
                data: hubHistoryData['Houston'] || [],
                borderColor: '#6366f1', // Indigo
                backgroundColor: 'transparent',
                tension: 0.4
            }
        ]
    };

    // Show loading skeleton for instant perceived performance
    if (isLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header / Timestamp */}
            <div className="flex justify-between items-center">

                <div>
                    <h2 className="text-xl font-bold text-navy-950 dark:text-white flex items-center gap-2">
                        Current Grid Conditions
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${usingRealData ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                            {usingRealData ? 'ERCOT Real-Time' : 'Simulating'}
                        </span>
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <p>{usingRealData ? 'Source: ERCOT.com Public Dashboards' : 'Connection failed, using simulation.'}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-2xl font-mono font-bold ${usingRealData ? 'text-navy-950 dark:text-white' : 'text-amber-500'}`}>
                        {usingRealData ? (lastUpdated || '--:--') : 'SIMULATED'}
                    </p>
                    <p className="text-xs text-gray-500">
                        {usingRealData ? 'Last Data Update' : 'Data Mode'}
                    </p>
                </div>
            </div>

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
                        <InfoTooltip text="NYMEX Natural Gas Futures (NG), a key driver of ERCOT marginal prices." />
                    </div>
                    <h3 className="text-3xl font-bold text-navy-950 dark:text-white">${gasPrice.toFixed(2)} <span className="text-lg text-gray-400 font-normal">/MMBtu</span></h3>
                    <div className="mt-2 text-xs text-orange-500 font-medium flex items-center gap-1">
                        <span>●</span> {gasSource}{gasSource.includes('NYMEX') ? ' (15 min delay)' : ''}
                    </div>
                    {/* % Change Metrics */}
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 grid grid-cols-3 gap-2 text-xs">
                        <div>
                            <p className="text-gray-400 mb-0.5">Day</p>
                            <p className={`font-semibold ${gasDayChange !== null ? (gasDayChange >= 0 ? 'text-green-500' : 'text-red-500') : 'text-gray-400'}`}>
                                {gasDayChange !== null ? `${gasDayChange >= 0 ? '+' : ''}${gasDayChange.toFixed(2)}%` : '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400 mb-0.5">YTD</p>
                            <p className={`font-semibold ${gasYtdChange !== null ? (gasYtdChange >= 0 ? 'text-green-500' : 'text-red-500') : 'text-gray-400'}`}>
                                {gasYtdChange !== null ? `${gasYtdChange >= 0 ? '+' : ''}${gasYtdChange.toFixed(1)}%` : '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400 mb-0.5">1Y</p>
                            <p className={`font-semibold ${gasYearChange !== null ? (gasYearChange >= 0 ? 'text-green-500' : 'text-red-500') : 'text-gray-400'}`}>
                                {gasYearChange !== null ? `${gasYearChange >= 0 ? '+' : ''}${gasYearChange.toFixed(1)}%` : '—'}
                            </p>
                        </div>
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
                        <h3 className="text-lg font-bold text-navy-950 dark:text-white mb-4 flex items-center gap-2">
                            Henry Hub Futures (Next 3 Months)
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${isRealFutures ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                {isRealFutures ? 'NYMEX' : 'Simulated'}
                            </span>
                        </h3>
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

            {/* Charts Row: Hub Price Trends (12 Months) - Loaded after main content */}
            <div className="bg-white dark:bg-navy-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                <h3 className="text-lg font-bold text-navy-950 dark:text-white mb-4 flex items-center gap-2">
                    Regional Price Trends (Last 12 Months)
                    <InfoTooltip text="Monthly average Real-Time Market (RTM) Settlement Point Prices for major ERCOT hubs." />
                    {isHistoryLoading && (
                        <span className="text-xs text-gray-400 font-normal animate-pulse">Loading...</span>
                    )}
                </h3>
                <div className="h-[300px]">
                    {Object.keys(hubHistoryData).length > 0 ? (
                        <Line data={hubHistoryChartData} options={lineOptions} />
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                <p className="text-sm text-gray-400">Loading historical data...</p>
                            </div>
                        </div>
                    )}
                </div>
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
                <strong>Note:</strong> {usingRealData ? 'Real-time data provided by ERCOT Public Dashboards.' : 'Simulated data is being used for demonstration.'}
            </div>

            {/* Manual Ingestion Section - Hidden for now */}
            {/* <div className="mt-8 bg-white dark:bg-navy-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                <h3 className="text-lg font-bold text-navy-950 dark:text-white mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Market Intelligence Ingest
                </h3>
                ...
            </div> */}
        </div>

    );
}
