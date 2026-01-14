'use client';

import React, { useState, useEffect } from 'react';

interface Scenario {
    id: string;
    name: string;
    timestamp: number;
    data: any;
}

interface ScenarioManagerProps {
    currentData: any;
    onLoad: (data: any) => void;
    storageKey: string;
    appName: string;
}

export default function ScenarioManager({
    currentData,
    onLoad,
    storageKey,
    appName
}: ScenarioManagerProps) {
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [showDialog, setShowDialog] = useState(false);
    const [scenarioName, setScenarioName] = useState('');
    const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

    // Load scenarios from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                setScenarios(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to load scenarios', e);
            }
        }
    }, [storageKey]);

    // Save scenarios to localStorage
    const saveToStorage = (newScenarios: Scenario[]) => {
        localStorage.setItem(storageKey, JSON.stringify(newScenarios));
        setScenarios(newScenarios);
    };

    const handleSave = () => {
        if (!scenarioName.trim()) {
            alert('Please enter a scenario name');
            return;
        }

        const newScenario: Scenario = {
            id: Date.now().toString(),
            name: scenarioName,
            timestamp: Date.now(),
            data: currentData
        };

        const updated = [...scenarios, newScenario];
        saveToStorage(updated);
        setScenarioName('');
        setShowDialog(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this scenario?')) {
            const updated = scenarios.filter(s => s.id !== id);
            saveToStorage(updated);
            setSelectedForCompare(selectedForCompare.filter(sid => sid !== id));
        }
    };

    const handleLoad = (scenario: Scenario) => {
        onLoad(scenario.data);
    };

    const toggleCompare = (id: string) => {
        if (selectedForCompare.includes(id)) {
            setSelectedForCompare(selectedForCompare.filter(sid => sid !== id));
        } else {
            setSelectedForCompare([...selectedForCompare, id]);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Scenarios</h3>
                <button
                    onClick={() => setShowDialog(true)}
                    className="px-3 py-1.5 bg-[#285477] text-white text-sm rounded-md hover:bg-[#1d3f5a] transition"
                >
                    💾 Save Current
                </button>
            </div>

            {/* Save Dialog */}
            {showDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-slate-700">
                        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Save Scenario</h4>
                        <input
                            type="text"
                            placeholder="Scenario name..."
                            value={scenarioName}
                            onChange={(e) => setScenarioName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                            className="w-full px-3 py-2 rounded border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowDialog(false)}
                                className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-[#285477] text-white text-sm rounded-md hover:bg-[#1d3f5a] transition"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Scenario List */}
            {scenarios.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg">
                    No saved scenarios yet.
                </div>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {scenarios.map((scenario) => (
                        <div
                            key={scenario.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                        >
                            <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-gray-100">{scenario.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(scenario.timestamp)}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleCompare(scenario.id)}
                                    className={`px-2 py-1 text-xs rounded transition ${selectedForCompare.includes(scenario.id)
                                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                        }`}
                                    title="Select for comparison"
                                >
                                    {selectedForCompare.includes(scenario.id) ? '✓' : '○'}
                                </button>

                                <button
                                    onClick={() => handleLoad(scenario)}
                                    className="px-3 py-1 text-xs bg-energy-green/10 text-energy-green rounded hover:bg-energy-green/100 dark:bg-energy-green/100 dark:text-energy-green transition"
                                >
                                    Load
                                </button>

                                <button
                                    onClick={() => handleDelete(scenario.id)}
                                    className="px-3 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100 dark:bg-red-900 dark:text-red-300 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Compare View */}
            {selectedForCompare.length >= 2 && (
                <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900 dark:bg-opacity-20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <div className="text-sm font-medium mb-2">
                        {selectedForCompare.length} scenarios selected for comparison
                    </div>
                    <button
                        onClick={() => {
                            // Emit comparison event to parent
                            const compareData = scenarios.filter(s =>
                                selectedForCompare.includes(s.id)
                            );
                            console.log('Compare scenarios:', compareData);
                            alert(`Comparison feature: ${compareData.map(s => s.name).join(' vs ')}`);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition"
                    >
                        📊 Compare Selected
                    </button>
                </div>
            )}
        </div>
    );
}
