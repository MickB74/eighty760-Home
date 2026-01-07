'use client';

import React, { useState } from 'react';

export interface Building {
    id: string;
    name: string;
    type: string;
    annual_mwh: number;
}

interface BuildingPortfolioEditorProps {
    buildings: Building[];
    onChange: (buildings: Building[]) => void;
}

const BUILDING_TYPES = [
    { value: 'Data Center', label: 'Data Center (LF: ~95%)' },
    { value: 'Manufacturing', label: 'Manufacturing (LF: ~90%)' },
    { value: 'Office', label: 'Office (LF: ~45%)' },
    { value: 'Retail', label: 'Retail (LF: ~50%)' },
    { value: 'Hospital', label: 'Hospital (LF: ~85%)' },
    { value: 'School', label: 'School (LF: ~35%)' },
];

export default function BuildingPortfolioEditor({ buildings, onChange }: BuildingPortfolioEditorProps) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Data Center',
        annual_mwh: 100000
    });

    const handleAdd = () => {
        setShowForm(true);
        setEditingId(null);
        setFormData({ name: '', type: 'Data Center', annual_mwh: 100000 });
    };

    const handleEdit = (building: Building) => {
        setShowForm(true);
        setEditingId(building.id);
        setFormData({
            name: building.name,
            type: building.type,
            annual_mwh: building.annual_mwh
        });
    };

    const handleSave = () => {
        if (!formData.name.trim()) {
            alert('Please enter a building name');
            return;
        }

        if (editingId) {
            // Edit existing
            const updated = buildings.map(b =>
                b.id === editingId ? { ...b, ...formData } : b
            );
            onChange(updated);
        } else {
            // Add new
            const newBuilding: Building = {
                id: Date.now().toString(),
                ...formData
            };
            onChange([...buildings, newBuilding]);
        }

        setShowForm(false);
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this building?')) {
            onChange(buildings.filter(b => b.id !== id));
        }
    };

    const totalLoad = buildings.reduce((sum, b) => sum + b.annual_mwh, 0);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Building Portfolio</h3>
                <button
                    onClick={handleAdd}
                    className="px-3 py-1.5 bg-[#285477] text-white text-sm rounded-md hover:bg-[#1d3f5a] transition"
                >
                    + Add Building
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] space-y-3">
                    <h4 className="font-medium">{editingId ? 'Edit' : 'Add'} Building</h4>

                    <div>
                        <label className="block text-sm mb-1">Building Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Data Center 1"
                            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--card-bg)]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Building Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--card-bg)]"
                        >
                            {BUILDING_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Annual Consumption (MWh)</label>
                        <input
                            type="number"
                            value={formData.annual_mwh}
                            onChange={(e) => setFormData({ ...formData, annual_mwh: parseFloat(e.target.value) || 0 })}
                            min="1000"
                            step="10000"
                            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--card-bg)]"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-[#285477] text-white text-sm rounded-md hover:bg-[#1d3f5a]"
                        >
                            {editingId ? 'Save Changes' : 'Add Building'}
                        </button>
                    </div>
                </div>
            )}

            {/* Building List */}
            {buildings.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-lg">
                    No buildings added yet.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] text-left">
                                <th className="py-2 px-2">Name</th>
                                <th className="py-2 px-2">Type</th>
                                <th className="py-2 px-2 text-right">Annual Load (MWh)</th>
                                <th className="py-2 px-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {buildings.map((building) => (
                                <tr key={building.id} className="border-b border-[var(--border-color)] hover:bg-[var(--row-hover)]">
                                    <td className="py-3 px-2 font-medium">{building.name}</td>
                                    <td className="py-3 px-2 text-[var(--text-secondary)]">{building.type}</td>
                                    <td className="py-3 px-2 text-right">{building.annual_mwh.toLocaleString()}</td>
                                    <td className="py-3 px-2 text-right space-x-2">
                                        <button
                                            onClick={() => handleEdit(building)}
                                            className="text-energy-green hover:text-energy-green/80"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(building.id)}
                                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-[var(--bg-secondary)] font-bold">
                                <td className="py-3 px-2" colSpan={2}>Total Portfolio</td>
                                <td className="py-3 px-2 text-right">{totalLoad.toLocaleString()} MWh</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
