
'use client';
import TexasNodeMap from './TexasNodeMap';

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

interface LocationData {
    hubs: string[];
    zones: string[];
    resources: string[];
}

export default function NodeAnalysisTab() {
    const [year, setYear] = useState(2024);
    const [refMarket, setRefMarket] = useState<'RTM' | 'DA'>('RTM');
    const [compMarket, setCompMarket] = useState<'RTM' | 'DA'>('RTM');
    const [referenceLocation, setReferenceLocation] = useState('HB_HOUSTON');
    const [compareLocation, setCompareLocation] = useState('HB_NORTH');
    const [mapTarget, setMapTarget] = useState<'reference' | 'compare'>('compare');

    // Data State
    const [refData, setRefData] = useState<any[]>([]);
    const [compareData, setCompareData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Locations State
    const [locations, setLocations] = useState<LocationData | null>(null);

    // Load locations on mount
    useEffect(() => {
        fetch('/data/ercot_locations.json')
            .then(res => res.json())
            .then(data => setLocations(data))
            .catch(err => console.error('Failed to load locations:', err));
    }, []);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year, refMarket, compMarket, referenceLocation, compareLocation]);

    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        setRefData([]);
        setCompareData([]);

        try {
            // 1. Fetch Reference Data
            const refRes = await fetch(`/api/prices/history?year=${year}&market=${refMarket}&location=${referenceLocation}`);
            const refJson = await refRes.json();

            if (refRes.ok) {
                let parsedRef = [];
                if (refMarket === 'DA') {
                    parsedRef = refJson.prices.map((p: number, i: number) => ({
                        time: i,
                        price: p
                    }));
                } else {
                    if (refJson.format === 'compact') {
                        parsedRef = (refJson.data || []).map((r: any[]) => ({
                            time: r[0],
                            price: r[1]
                        }));
                    } else {
                        parsedRef = (refJson.data || []).map((r: any) => ({
                            time: r.Time_Central || r.Time,
                            price: r.SPP
                        }));
                    }
                }
                setRefData(parsedRef);
            } else {
                console.warn("Ref fetch failed", refJson);
                setError(`Failed to load reference data: ${refJson.error || 'Unknown Error'}`);
            }

            // 2. Fetch Compare Data
            if (compareLocation) {
                const compRes = await fetch(`/api/prices/history?year=${year}&market=${compMarket}&location=${compareLocation}`);
                const compJson = await compRes.json();
                if (compRes.ok) {
                    let parsedComp = [];
                    if (compMarket === 'DA') {
                        parsedComp = compJson.prices.map((p: number, i: number) => ({
                            time: i,
                            price: p
                        }));
                    } else {
                        if (compJson.format === 'compact') {
                            parsedComp = (compJson.data || []).map((r: any[]) => ({
                                time: r[0],
                                price: r[1]
                            }));
                        } else {
                            parsedComp = (compJson.data || []).map((r: any) => ({
                                time: r.Time_Central || r.Time,
                                price: r.SPP
                            }));
                        }
                    }
                    setCompareData(parsedComp);
                } else {
                    console.warn("Compare fetch failed", compJson);
                }
            }

        } catch (err) {
            console.error(err);
            setError('Failed to load data.');
        } finally {
            setIsLoading(false);
        }
    };

    // Align Data for Chart & Metrics
    const alignedData = useMemo(() => {
        if (refData.length === 0) return null;

        const refStride = refMarket === 'RTM' ? 4 : 1;
        const compStride = compMarket === 'RTM' ? 4 : 1;

        const displayDataRef = refData.filter((_, i) => i % refStride === 0);
        const displayDataComp = compareData.filter((_, i) => i % compStride === 0);

        // Truncate to matching length to be safe
        const minLen = Math.min(displayDataRef.length, displayDataComp.length);

        return {
            ref: displayDataRef.slice(0, minLen),
            comp: displayDataComp.slice(0, minLen)
        };
    }, [refData, compareData, refMarket, compMarket]);

    // Calculate Metrics
    const metrics = useMemo(() => {
        if (!alignedData || alignedData.comp.length === 0) return null;

        const pricesRef = alignedData.ref.map(d => d.price);
        const pricesComp = alignedData.comp.map(d => d.price);
        const n = pricesRef.length;
        if (n === 0) return null;

        // Averages
        const avgRef = pricesRef.reduce((a, b) => a + b, 0) / n;
        const avgComp = pricesComp.reduce((a, b) => a + b, 0) / n;

        // Spread (Ref - Comp)
        const diffs = pricesRef.map((p, i) => p - pricesComp[i]);
        const avgSpread = diffs.reduce((a, b) => a + b, 0) / n;

        // Correlation (Pearson)
        const sumX = pricesRef.reduce((a, b) => a + b, 0);
        const sumY = pricesComp.reduce((a, b) => a + b, 0);
        const sumXY = pricesRef.reduce((a, b, i) => a + b * pricesComp[i], 0);
        const sumX2 = pricesRef.reduce((a, b) => a + b * b, 0);
        const sumY2 = pricesComp.reduce((a, b) => a + b * b, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        const correlation = denom === 0 ? 0 : numerator / denom;

        return {
            avgRef,
            avgComp,
            avgSpread,
            correlation,
            count: n
        };
    }, [alignedData]);

    // Prepare Chart Data
    const chartData = useMemo(() => {
        if (!alignedData) return null;
        const { ref, comp } = alignedData;

        return {
            labels: ref.map(d => {
                if (refMarket === 'DA' && compMarket === 'DA') return `Hour ${d.time}`;
                // RTM involved: Use timestamp formatting
                const num = Number(d.time);
                if (!isNaN(num) && num > 2000000000) {
                    return new Date(num).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric'
                    });
                }
                if (refMarket === 'DA') return `Hour ${d.time}`;
                return String(d.time).substring(0, 16);
            }),
            datasets: [
                {
                    label: `${referenceLocation} (${refMarket})`,
                    data: ref.map(d => d.price),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.1
                },
                {
                    label: `${compareLocation} (${compMarket})`,
                    data: comp.map(d => d.price),
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.1
                }
            ]
        };
    }, [alignedData, referenceLocation, compareLocation, refMarket, compMarket]);

    return (

        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column: Controls & Map */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Controls */}
                    <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-gray-200 dark:border-white/10 space-y-4">
                        <h3 className="font-bold text-navy-950 dark:text-white mb-2">Configuration</h3>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Simulated Year</label>
                                <select
                                    value={year}
                                    onChange={e => setYear(Number(e.target.value))}
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded px-3 py-1.5 text-sm"
                                >
                                    {[2020, 2021, 2022, 2023, 2024, 2025].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Reference Group */}
                            <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                                <label className="block text-xs font-bold text-blue-500 mb-2 flex justify-between items-center">
                                    REFERENCE
                                    <span onClick={() => setMapTarget('reference')} className={`cursor-pointer text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${mapTarget === 'reference' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>Set on Map</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-0.5">Location</label>
                                        <select
                                            value={referenceLocation}
                                            onChange={e => setReferenceLocation(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded px-2 py-1.5 text-xs"
                                        >
                                            {locations ? (
                                                <>
                                                    <optgroup label="Hubs">
                                                        {locations.hubs.map(l => <option key={l} value={l}>{l}</option>)}
                                                    </optgroup>
                                                    <optgroup label="Load Zones">
                                                        {locations.zones.map(l => <option key={l} value={l}>{l}</option>)}
                                                    </optgroup>
                                                    <optgroup label="Resource Nodes">
                                                        {locations.resources.map(l => <option key={l} value={l}>{l}</option>)}
                                                    </optgroup>
                                                </>
                                            ) : (
                                                LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-0.5">Market</label>
                                        <select
                                            value={refMarket}
                                            onChange={e => setRefMarket(e.target.value as any)}
                                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded px-2 py-1.5 text-xs"
                                        >
                                            <option value="RTM">Real-Time</option>
                                            <option value="DA">Day-Ahead</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Comparison Group */}
                            <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                                <label className="block text-xs font-bold text-orange-500 mb-2 flex justify-between items-center">
                                    COMPARISON
                                    <span onClick={() => setMapTarget('compare')} className={`cursor-pointer text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${mapTarget === 'compare' ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>Set on Map</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-0.5">Location</label>
                                        <select
                                            value={compareLocation}
                                            onChange={e => setCompareLocation(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded px-2 py-1.5 text-xs"
                                        >
                                            {locations ? (
                                                <>
                                                    <optgroup label="Hubs">
                                                        {locations.hubs.map(l => <option key={l} value={l}>{l}</option>)}
                                                    </optgroup>
                                                    <optgroup label="Load Zones">
                                                        {locations.zones.map(l => <option key={l} value={l}>{l}</option>)}
                                                    </optgroup>
                                                    <optgroup label="Resource Nodes">
                                                        {locations.resources.map(l => <option key={l} value={l}>{l}</option>)}
                                                    </optgroup>
                                                </>
                                            ) : (
                                                LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-0.5">Market</label>
                                        <select
                                            value={compMarket}
                                            onChange={e => setCompMarket(e.target.value as any)}
                                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded px-2 py-1.5 text-xs"
                                        >
                                            <option value="RTM">Real-Time</option>
                                            <option value="DA">Day-Ahead</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map */}
                    <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-gray-200 dark:border-white/10 flex flex-col items-center">
                        <div className="text-xs text-gray-500 mb-2 w-full text-center">
                            Click to set <span className={`font-bold ${mapTarget === 'reference' ? 'text-blue-500' : 'text-orange-500'}`}>{mapTarget === 'reference' ? 'Reference' : 'Comparison'}</span>
                        </div>
                        <TexasNodeMap
                            className="w-full max-w-[280px]"
                            selectedNode={mapTarget === 'reference' ? referenceLocation : compareLocation}
                            highlightedNode={mapTarget === 'reference' ? compareLocation : referenceLocation}
                            onNodeSelect={(node) => {
                                if (mapTarget === 'reference') setReferenceLocation(node);
                                else setCompareLocation(node);
                            }}
                        />
                    </div>
                </div>

                {/* Right Column: Chart (Cols 5-12) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Statistics Panel */}
                    {metrics && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                <div className="text-xs text-gray-400 mb-1">Correlation</div>
                                <div className={`text-xl font-bold ${metrics.correlation > 0.8 ? 'text-green-500' : metrics.correlation < 0.5 ? 'text-yellow-500' : 'text-gray-700 dark:text-gray-200'}`}>
                                    {metrics.correlation.toFixed(3)}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                <div className="text-xs text-gray-400 mb-1">Avg Spread ($)</div>
                                <div className={`text-xl font-bold ${Math.abs(metrics.avgSpread) > 10 ? 'text-orange-500' : 'text-gray-700 dark:text-gray-200'}`}>
                                    {metrics.avgSpread.toFixed(2)}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                <div className="text-xs text-gray-400 mb-1">Avg Ref Price</div>
                                <div className="text-xl font-bold text-blue-500">
                                    ${metrics.avgRef.toFixed(2)}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                <div className="text-xs text-gray-400 mb-1">Avg Comp Price</div>
                                <div className="text-xl font-bold text-orange-500">
                                    ${metrics.avgComp.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chart */}
                    <div className="bg-white dark:bg-navy-900 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex-1 min-h-[500px]">
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
                                        text: `Price Comparison: ${referenceLocation} (${refMarket}) vs ${compareLocation} (${compMarket}) (${year})`
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
            </div>
        </div>
    );
}
