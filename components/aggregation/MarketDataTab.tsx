
import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import InfoTooltip from '@/components/shared/InfoTooltip';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function MarketDataTab() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [load, setLoad] = useState(0);
    const [capacity, setCapacity] = useState(0);
    const [gasPrice, setGasPrice] = useState(2.84);

    // Simulate live data updates
    useEffect(() => {
        // Initial setup
        updateData();

        const interval = setInterval(() => {
            setCurrentTime(new Date());
            updateData();
        }, 5000); // Update every 5s

        return () => clearInterval(interval);
    }, []);

    const updateData = () => {
        const now = new Date();
        const hour = now.getHours() + now.getMinutes() / 60;

        // Simple daily load curve simulation
        // Peak at 5 PM (17.0), Low at 4 AM (4.0)
        // Base load ~40GW, Peak ~75GW
        const shape = -Math.cos((hour - 4) * Math.PI / 12) * 0.5 + 0.5; // 0 to 1
        const targetLoad = 40000 + shape * 35000;

        // Add random noise
        const noise = (Math.random() - 0.5) * 500;

        setLoad(Math.round(targetLoad + noise));
        setCapacity(Math.round(targetLoad + 5000 + Math.random() * 1000)); // Reserves ~5GW

        // Random walk gas price slightly
        setGasPrice(prev => Math.max(1.5, Math.min(5.0, prev + (Math.random() - 0.5) * 0.01)));
    };

    const reserves = capacity - load;
    const reserveMargin = (reserves / load) * 100;

    // Chart Data - Fuel Mix (Simulated based on typical ERCOT day)
    const fuelMixData = {
        labels: ['Natural Gas', 'Wind', 'Solar', 'Nuclear', 'Coal', 'Other'],
        datasets: [
            {
                data: [42, 25, 18, 8, 5, 2], // Approx percentages
                backgroundColor: [
                    '#f97316', // Gas - Orange
                    '#3b82f6', // Wind - Blue
                    '#eab308', // Solar - Yellow
                    '#22c55e', // Nuclear - Green
                    '#64748b', // Coal - Slate
                    '#a8a29e', // Other - Gray
                ],
                borderWidth: 0,
            },
        ],
    };

    // Chart Data - Load Forecast (24h)
    const hours = Array.from({ length: 24 }, (_, i) => {
        const h = new Date().getHours() + i;
        return h >= 24 ? h - 24 : h;
    }).map(h => `${h}:00`);

    const forecastData = {
        labels: hours,
        datasets: [
            {
                label: 'Forecasted Load',
                data: hours.map((_, i) => {
                    const h = (new Date().getHours() + i) % 24;
                    const shape = -Math.cos((h - 4) * Math.PI / 12) * 0.5 + 0.5;
                    return 40000 + shape * 35000;
                }),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Available Capacity',
                data: hours.map((_, i) => {
                    const h = (new Date().getHours() + i) % 24;
                    // Capacity drops slightly at night (solar off)
                    const solarShape = Math.max(0, -Math.cos((h - 12) * Math.PI / 8)); // Solar peak at noon
                    return 55000 + solarShape * 15000;
                }),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.0)',
                borderDash: [5, 5],
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
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header / Timestamp */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-navy-950 dark:text-white flex items-center gap-2">
                        Current Grid Conditions
                        <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20 uppercase tracking-wider">Normal</span>
                    </h2>
                    <p className="text-sm text-gray-500">Live data (Simulated Demo Stream)</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-mono text-navy-950 dark:text-white font-bold">{currentTime.toLocaleTimeString()}</p>
                    <p className="text-xs text-gray-500">{currentTime.toLocaleDateString()}</p>
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
                    <h3 className="text-3xl font-bold text-navy-950 dark:text-white">{load.toLocaleString()} <span className="text-lg text-gray-400 font-normal">MW</span></h3>
                    <div className="mt-2 text-xs text-blue-500 font-medium flex items-center gap-1">
                        <span>↗</span> +1.2% vs Forecast
                    </div>
                </div>

                {/* Available Capacity */}
                <div className="bg-white dark:bg-navy-900 p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                        <span>●</span> Live Spot Price
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Fuel Mix */}
                <div className="bg-white dark:bg-navy-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm lg:col-span-1">
                    <h3 className="text-lg font-bold text-navy-950 dark:text-white mb-4">Current Fuel Mix</h3>
                    <div className="h-[300px]">
                        <Doughnut data={fuelMixData} options={doughnutOptions} />
                    </div>
                </div>

                {/* Supply vs Demand */}
                <div className="bg-white dark:bg-navy-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm lg:col-span-2">
                    <h3 className="text-lg font-bold text-navy-950 dark:text-white mb-4">Supply & Demand Forecast (24hr)</h3>
                    <div className="h-[300px]">
                        <Line data={forecastData} options={lineOptions} />
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> API connectivity to ERCOT grid streams is currently simulated for demonstration.
                Integrating real-time ISO data requires an enterprise data subscription or specific API credentials.
            </div>
        </div>
    );
}
