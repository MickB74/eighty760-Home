
import React, { useState } from 'react';
import { GenerationAsset } from '@/lib/aggregation/types';

interface AssetEditorProps {
    assets: GenerationAsset[];
    onUpdate: (assets: GenerationAsset[]) => void;
}

const LOCATIONS = ['North', 'South', 'West', 'Houston', 'Panhandle'] as const;
const TECH_TYPES = ['Solar', 'Wind', 'Geothermal', 'Nuclear', 'CCS Gas'] as const;

export default function AssetEditor({ assets, onUpdate }: AssetEditorProps) {
    const [isAdding, setIsAdding] = useState(false);

    // New Asset State
    const [newAsset, setNewAsset] = useState<Partial<GenerationAsset>>({
        name: 'New Project',
        type: 'Solar',
        location: 'North',
        capacity_mw: 100,
        capacity_factor: undefined
    });

    const handleAdd = () => {
        // Validate types before creating asset
        if (!newAsset.type || !TECH_TYPES.includes(newAsset.type as any)) {
            return;
        }
        if (!newAsset.location || !LOCATIONS.includes(newAsset.location as any)) {
            return;
        }

        const asset: GenerationAsset = {
            id: Date.now().toString(),
            name: newAsset.name || 'Untitled Project',
            type: newAsset.type as GenerationAsset['type'],
            location: newAsset.location as GenerationAsset['location'],
            capacity_mw: Number(newAsset.capacity_mw),
            capacity_factor: newAsset.capacity_factor ? Number(newAsset.capacity_factor) : undefined
        };
        onUpdate([...assets, asset]);
        setIsAdding(false);
        // Reset form
        setNewAsset({
            name: 'New Project',
            type: 'Solar',
            location: 'North',
            capacity_mw: 100
        });
    };

    const handleDelete = (id: string) => {
        onUpdate(assets.filter(a => a.id !== id));
    };

    const handleEdit = (id: string, field: keyof GenerationAsset, value: any) => {
        onUpdate(assets.map(a => {
            if (a.id === id) {
                return { ...a, [field]: value };
            }
            return a;
        }));
    };

    const totalMW = assets.reduce((sum, a) => sum + a.capacity_mw, 0);

    return (
        <div className="bg-white dark:bg-navy-950 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-navy-900">
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Generation Assets</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Manage individual projects and locations</p>
                </div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total: <span className="text-gray-900 dark:text-gray-100">{totalMW.toLocaleString()} MW</span>
                </div>
            </div>

            <div className="p-4">
                {assets.length === 0 && !isAdding && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-navy-900/50 rounded-lg border border-dashed border-gray-200 dark:border-white/10 mb-4">
                        <p>No assets defined.</p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="text-sm text-energy-green hover:underline mt-2"
                        >
                            + Add First Project
                        </button>
                    </div>
                )}

                <div className="space-y-3">
                    {assets.map(asset => (
                        <div key={asset.id} className="flex flex-col md:flex-row gap-4 items-start md:items-center p-3 bg-white dark:bg-navy-950/50 rounded-lg border border-gray-200 dark:border-white/10 hover:border-energy-green transition-colors group">

                            {/* Type Icon/Color */}
                            <div className={`w-2 h-12 rounded-full hidden md:block `} style={{
                                backgroundColor:
                                    asset.type === 'Solar' ? '#FDB813' :
                                        asset.type === 'Wind' ? '#A2D9CE' :
                                            asset.type === 'Nuclear' ? '#E74C3C' :
                                                asset.type === 'Geothermal' ? '#AF7AC5' : '#808B96'
                            }}></div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                                <div>
                                    <label className="text-[10px] uppercase text-gray-400 dark:text-gray-500 font-bold">Project Name</label>
                                    <input
                                        type="text"
                                        value={asset.name}
                                        onChange={(e) => handleEdit(asset.id, 'name', e.target.value)}
                                        className="w-full bg-transparent border-none p-0 text-sm font-medium focus:ring-0 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-gray-400 dark:text-gray-500 font-bold">Type & Location</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={asset.type}
                                            onChange={(e) => handleEdit(asset.id, 'type', e.target.value)}
                                            className="bg-transparent text-xs p-0 border-none focus:ring-0 text-gray-500 dark:text-gray-400"
                                        >
                                            {TECH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <select
                                            value={asset.location}
                                            onChange={(e) => handleEdit(asset.id, 'location', e.target.value)}
                                            className="bg-transparent text-xs p-0 border-none focus:ring-0 text-gray-500 dark:text-gray-400"
                                        >
                                            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-gray-400 dark:text-gray-500 font-bold">Capacity (MW)</label>
                                    <input
                                        type="number"
                                        value={asset.capacity_mw}
                                        onChange={(e) => handleEdit(asset.id, 'capacity_mw', Number(e.target.value))}
                                        className="w-full bg-transparent border-none p-0 text-sm font-mono focus:ring-0 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                                <div className="flex items-center justify-end">
                                    <button
                                        onClick={() => handleDelete(asset.id)}
                                        className="text-xs text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {isAdding ? (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-navy-900/30 rounded-lg border border-energy-green animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Name</label>
                                <input
                                    className="w-full p-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-950 text-sm text-gray-900 dark:text-gray-100"
                                    value={newAsset.name}
                                    onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                                    placeholder="Project name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Type</label>
                                <select
                                    className="w-full p-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-950 text-sm text-gray-900 dark:text-gray-100"
                                    value={newAsset.type}
                                    onChange={e => setNewAsset({ ...newAsset, type: e.target.value as GenerationAsset['type'] })}
                                >
                                    {TECH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Location</label>
                                <select
                                    className="w-full p-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-950 text-sm text-gray-900 dark:text-gray-100"
                                    value={newAsset.location}
                                    onChange={e => setNewAsset({ ...newAsset, location: e.target.value as GenerationAsset['location'] })}
                                >
                                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Capacity (MW)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    className="w-full p-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-950 text-sm text-gray-900 dark:text-gray-100"
                                    value={newAsset.capacity_mw}
                                    onChange={e => {
                                        const val = Number(e.target.value);
                                        if (val >= 0) setNewAsset({ ...newAsset, capacity_mw: val });
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsAdding(false)}
                                className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                className="px-3 py-1 text-xs bg-energy-green text-navy-950 rounded hover:opacity-90 font-medium"
                            >
                                Add Project
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="mt-4 w-full py-2 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-energy-green hover:text-energy-green transition-all"
                    >
                        + Add Project
                    </button>
                )}
            </div>
        </div>
    );
}
