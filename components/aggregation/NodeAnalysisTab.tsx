
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
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

const LOCATIONS = [
    'HB_NORTH', 'HB_SOUTH', 'HB_WEST', 'HB_HOUSTON', 'HB_PAN',
    'LZ_AEN', 'LZ_CPS', 'LZ_HOUSTON', 'LZ_LCRA', 'LZ_NORTH', 'LZ_RAYBN', 'LZ_SOUTH', 'LZ_WEST'
];

export default function NodeAnalysisTab() {
    const [year, setYear] = useState(2024);
    const [market, setMarket] = useState<'RTM' | 'DA'>('RTM');
    const [referenceLocation, setReferenceLocation] = useState('HB_HOUSTON');
    const [compareLocation, setCompareLocation] = useState('HB_NORTH');

    // Data State
    const [refData, setRefData] = useState<any[]>([]);
    const [compareData, setCompareData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year, market, referenceLocation, compareLocation]);

    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        setRefData([]);
        setCompareData([]);

        try {
            // 1. Fetch Reference Data
            const refRes = await fetch(`/api/prices/history?year=${year}&market=${market}&location=${referenceLocation}`);
            const refJson = await refRes.json();

            if (refRes.ok) {
                // If DA, data is number[], if RTM data is { Time: string, SPP: number }[]
                let parsedRef = [];
                if (market === 'DA') {
                    // Assuming JSON returns { prices: [...] } or array directly depending on my API implementation
                    // My API returns { prices: [...] } OR raw array if not filtered? 
                    // Let's check API: returns { ..., prices: [...] } if location filtered.
                    parsedRef = refJson.prices.map((p: number, i: number) => ({
                        time: i, // Index as hour
                        price: p
                    }));
                } else {
                    // RTM
                    parsedRef = (refJson.data || []).map((r: any) => ({
                        time: r.Time_Central || r.Time,
                        price: r.SPP
                    }));
                }
                setRefData(parsedRef);
            } else {
                console.warn("Ref fetch failed", refJson);
            }

            // 2. Fetch Compare Data
            if (compareLocation) {
                const compRes = await fetch(`/api/prices/history?year=${year}&market=${market}&location=${compareLocation}`);
                const compJson = await compRes.json();
                if (compRes.ok) {
                    let parsedComp = [];
                    if (market === 'DA') {
                        parsedComp = compJson.prices.map((p: number, i: number) => ({
                            time: i,
                            price: p
                        }));
                    } else {
                        parsedComp = (compJson.data || []).map((r: any) => ({
                            time: r.Time_Central || r.Time,
                            price: r.SPP
                        }));
                    }
                    setCompareData(parsedComp);
                }
            }

        } catch (err) {
            console.error(err);
            setError('Failed to load data. Ensure Python environment is set up for Parquet reading.');
        } finally {
            setIsLoading(false);
        }
    };

    // Prepare Chart Data
    const chartData = useMemo(() => {
        if (refData.length === 0) return null;

        // Downsample for rendering if too large (RTM is 35k points)
        // Chart.js chokes on 35k points. We need to aggregate visually or zoom.
        // For "15 min basis" request, user likely wants detail, but we can't render 35k labels.
        // We'll show a subset or aggregated view if full year selected.

        // Actually, rendering 35k points is slow. Let's slice to last 1000 or aggregate?
        // Or perhaps changing year view to "Month" selector is better?
        // For now, let's take a slice (first 1000 points) or simplistic stride.

        // BETTER: Use a stride to show trend, allow drilldown later?
        // Let's stride by 20 for full year RTM.
        const stride = market === 'RTM' ? 24 : 1; // Show daily avg ish? No 24*4=96 indices is 1 day. 
        // We have 35000 points. Stride 100 = 350 points.

        const displayDataRef = refData.filter((_, i) => i % stride === 0);
        const displayDataComp = compareData.filter((_, i) => i % stride === 0);

        return {
            labels: displayDataRef.map(d => {
                if (market === 'DA') return `Hour ${d.time}`;
                return d.time.substring(0, 16); // Date string
            }),
            datasets: [
                {
                    label: `${referenceLocation} (${market})`,
                    data: displayDataRef.map(d => d.price),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.1
                },
                {
                    label: `${compareLocation} (${market})`,
                    data: displayDataComp.map(d => d.price),
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.1
                }
            ]
        };
    }, [refData, compareData, referenceLocation, compareLocation, market]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-navy-800 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                <div className="flex gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Year</label>
                        <select
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                            className="bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-white/10 rounded px-3 py-1.5 text-sm"
                        >
                            {[2020, 2021, 2022, 2023, 2024, 2025].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Market</label>
                        <select
                            value={market}
                            onChange={e => setMarket(e.target.value as any)}
                            className="bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-white/10 rounded px-3 py-1.5 text-sm"
                        >
                            <option value="RTM">Real-Time (15m)</option>
                            <option value="DA">Day-Ahead (1h)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Reference Hub</label>
                        <select
                            value={referenceLocation}
                            onChange={e => setReferenceLocation(e.target.value)}
                            className="bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-white/10 rounded px-3 py-1.5 text-sm"
                        >
                            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Comparison Node</label>
                        <select
                            value={compareLocation}
                            onChange={e => setCompareLocation(e.target.value)}
                            className="bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-white/10 rounded px-3 py-1.5 text-sm"
                        >
                            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                        Add Node...
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Chart */}
            <div className="bg-white dark:bg-navy-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm h-[500px]">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center text-gray-400">Loading Data...</div>
                ) : chartData ? (
                    <Line data={chartData} options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: `${market} Price Comparison: ${referenceLocation} vs ${compareLocation} (${year})`
                            }
                        },
                        scales: {
                            y: {
                                title: { display: true, text: 'Price ($/MWh)' }
                            }
                        }
                    }} />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">No Data Available</div>
                )}
            </div>

            <div className="text-xs text-gray-400 text-center">
                * Note: Real-Time data shown is downsampled for performance. Download full report for 15-min granularity.
                Data source: ERCOT.
            </div>
        </div>
    );
}
