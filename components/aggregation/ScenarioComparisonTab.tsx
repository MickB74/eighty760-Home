'use client';

import React, { useState, useEffect } from 'react';
import { Scenario } from '@/lib/shared/portfolioStore';
import { SimulationResult, AggregationState } from '@/lib/aggregation/types';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface ScenarioComparisonTabProps {
    scenarios: Scenario[];
    onLoadScenario: (scenario: Scenario) => void;
}

export default function ScenarioComparisonTab({ scenarios, onLoadScenario }: ScenarioComparisonTabProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Limit selection to 5
    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                if (next.size >= 5) return prev; // Max 5
                next.add(id);
            }
            return next;
        });
    };

    const selectedScenarios = scenarios.filter(s => selectedIds.has(s.id));

    // Colors for the charts
    const getScenarioColor = (index: number) => {
        const colors = ['#00ff88', '#3b82f6', '#facc15', '#f97316', '#ec4899'];
        return colors[index % colors.length];
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            {/* 1. Selection Area */}
            <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-gray-200 dark:border-white/10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-navy-950 dark:text-white">Select Scenarios (Max 5)</h3>
                    <span className="text-sm text-gray-500">{selectedIds.size} selected</span>
                </div>

                {scenarios.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No saved scenarios yet. Create some in the Dashboard tab!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {scenarios.map((s, i) => (
                            <div
                                key={s.id}
                                onClick={() => handleToggleSelect(s.id)}
                                className={`cursor-pointer p-4 rounded-xl border transition-all ${selectedIds.has(s.id)
                                        ? 'border-energy-green bg-energy-green/10 dark:bg-energy-green/5'
                                        : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold text-navy-950 dark:text-white truncate pr-2">{s.name}</div>
                                    <div className={`w-5 h-5 flex-shrink-0 rounded-full border flex items-center justify-center ${selectedIds.has(s.id) ? 'bg-energy-green border-energy-green' : 'border-gray-400'
                                        }`}>
                                        {selectedIds.has(s.id) && <div className="w-2 h-2 bg-navy-950 rounded-full" />}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 line-clamp-2 min-h-[2.5em]">{s.description || 'No description'}</div>
                                <div className="mt-3 flex justify-between items-center text-xs">
                                    <span className="bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-gray-600 dark:text-gray-300">{s.year} • {s.loadHub}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onLoadScenario(s); }}
                                        className="text-energy-green-dark dark:text-energy-green hover:underline font-medium"
                                    >
                                        Load
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 2. Comparison Metrics & Charts */}
            {selectedIds.size > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Placeholder for now - we need to decide how to run sims */}
                    <div className="col-span-1 lg:col-span-2 bg-white dark:bg-white/5 p-8 rounded-2xl border border-gray-200 dark:border-white/10 text-center">
                        <h3 className="text-xl font-bold text-navy-950 dark:text-white mb-2">Comparison View</h3>
                        <p className="text-gray-500">
                            To enable full comparison, we need to re-run simulations for these scenarios.
                            <br />
                            (Connecting simulation engine...)
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
