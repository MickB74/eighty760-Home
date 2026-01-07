
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
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] overflow-hidden">
            <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]">
                <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">Generation Assets</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Manage individual projects and locations</p>
                </div>
                <div className="text-sm font-medium text-[var(--text-secondary)]">
                    Total: <span className="text-[var(--text-primary)]">{totalMW.toLocaleString()} MW</span>
                </div>
            </div>

            <div className="p-4">
                {assets.length === 0 && !isAdding && (
                    <div className="text-center py-8 text-[var(--text-tertiary)] bg-[var(--bg-primary)] rounded-lg border border-dashed border-[var(--border-color)] mb-4">
                        <p>No assets defined.</p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="text-sm text-[var(--brand-color)] hover:underline mt-2"
                        >
                            + Add First Project
                        </button>
                    </div>
                )}

                <div className="space-y-3">
                    {assets.map(asset => (
                        <div key={asset.id} className="flex flex-col md:flex-row gap-4 items-start md:items-center p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)] hover:border-[var(--brand-color)] transition-colors group">

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
                                    <label className="text-[10px] uppercase text-[var(--text-tertiary)] font-bold">Project Name</label>
                                    <input
                                        type="text"
                                        value={asset.name}
                                        onChange={(e) => handleEdit(asset.id, 'name', e.target.value)}
                                        className="w-full bg-transparent border-none p-0 text-sm font-medium focus:ring-0 text-[var(--text-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-[var(--text-tertiary)] font-bold">Type & Location</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={asset.type}
                                            onChange={(e) => handleEdit(asset.id, 'type', e.target.value)}
                                            className="bg-transparent text-xs p-0 border-none focus:ring-0 text-[var(--text-secondary)]"
                                        >
                                            {TECH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <span className="text-[var(--border-color)]">|</span>
                                        <select
                                            value={asset.location}
                                            onChange={(e) => handleEdit(asset.id, 'location', e.target.value)}
                                            className="bg-transparent text-xs p-0 border-none focus:ring-0 text-[var(--text-secondary)]"
                                        >
                                            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-[var(--text-tertiary)] font-bold">Capacity (MW)</label>
                                    <input
                                        type="number"
                                        value={asset.capacity_mw}
                                        onChange={(e) => handleEdit(asset.id, 'capacity_mw', Number(e.target.value))}
                                        className="w-full bg-transparent border-none p-0 text-sm font-mono focus:ring-0 text-[var(--text-primary)]"
                                    />
                                </div>
                                <div className="flex items-center justify-end">
                                    <button
                                        onClick={() => handleDelete(asset.id)}
                                        className="text-xs text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 p-1 rounded"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {isAdding ? (
                    <div className="mt-4 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--brand-color)] animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block text-xs text-[var(--text-secondary)] mb-1">Name</label>
                                <input
                                    className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm"
                                    value={newAsset.name}
                                    onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                                    placeholder="Project name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[var(--text-secondary)] mb-1">Type</label>
                                <select
                                    className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm"
                                    value={newAsset.type}
                                    onChange={e => setNewAsset({ ...newAsset, type: e.target.value as GenerationAsset['type'] })}
                                >
                                    {TECH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-[var(--text-secondary)] mb-1">Location</label>
                                <select
                                    className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm"
                                    value={newAsset.location}
                                    onChange={e => setNewAsset({ ...newAsset, location: e.target.value as GenerationAsset['location'] })}
                                >
                                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-[var(--text-secondary)] mb-1">Capacity (MW)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm"
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
                                className="px-3 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                className="px-3 py-1 text-xs bg-[var(--brand-color)] text-navy-950 rounded hover:opacity-90"
                            >
                                Add Project
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="mt-4 w-full py-2 border-2 border-dashed border-[var(--border-color)] rounded-lg text-sm text-[var(--text-secondary)] hover:border-[var(--brand-color)] hover:text-[var(--brand-color)] transition-all"
                    >
                        + Add Project
                    </button>
                )}
            </div>
        </div>
    );
}
