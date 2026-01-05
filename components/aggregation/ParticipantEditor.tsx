'use client';

import React, { useState } from 'react';
import { Participant } from '@/lib/aggregation/types';

interface ParticipantEditorProps {
    participants: Participant[];
    onChange: (participants: Participant[]) => void;
}

const PARTICIPANT_TYPES = [
    { value: 'Data Center', label: 'Data Center (Flat, ~95% LF)' },
    { value: 'Manufacturing', label: 'Manufacturing (~90% LF)' },
    { value: 'Office', label: 'Office (Day Peak, ~45% LF)' },
    { value: 'Flat', label: 'Flat (100% LF)' },
];

export default function ParticipantEditor({ participants, onChange }: ParticipantEditorProps) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Data Center' as Participant['type'],
        load_mwh: 100000
    });

    const handleAdd = () => {
        setShowForm(true);
        setEditingId(null);
        setFormData({ name: '', type: 'Data Center', load_mwh: 100000 });
    };

    const handleEdit = (participant: Participant) => {
        setShowForm(true);
        setEditingId(participant.id);
        setFormData({
            name: participant.name,
            type: participant.type,
            load_mwh: participant.load_mwh
        });
    };

    const handleSave = () => {
        if (!formData.name.trim()) {
            alert('Please enter a participant name');
            return;
        }

        if (formData.load_mwh <= 0) {
            alert('Load must be greater than 0');
            return;
        }

        if (editingId) {
            // Edit existing
            const updated = participants.map(p =>
                p.id === editingId ? { ...p, ...formData } : p
            );
            onChange(updated);
        } else {
            // Add new
            const newParticipant: Participant = {
                id: Date.now().toString(),
                ...formData
            };
            onChange([...participants, newParticipant]);
        }

        setShowForm(false);
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this participant?')) {
            onChange(participants.filter(p => p.id !== id));
        }
    };

    const totalLoad = participants.reduce((sum, p) => sum + p.load_mwh, 0);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold">Participant Portfolio</h3>
                    <p className="text-xs text-[var(--text-secondary)]">Build your aggregation manually</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="px-3 py-1.5 bg-[#285477] text-white text-sm rounded-md hover:bg-[#1d3f5a] transition"
                >
                    + Add Participant
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] space-y-3">
                    <h4 className="font-medium">{editingId ? 'Edit' : 'Add'} Participant</h4>

                    <div>
                        <label className="block text-sm mb-1">Participant Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Hyperscale DC North"
                            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--card-bg)]"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as Participant['type'] })}
                            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--card-bg)]"
                        >
                            {PARTICIPANT_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Annual Load (MWh)</label>
                        <input
                            type="number"
                            value={formData.load_mwh}
                            onChange={(e) => setFormData({ ...formData, load_mwh: parseFloat(e.target.value) || 0 })}
                            min="1000"
                            step="10000"
                            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--card-bg)]"
                        />
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {(formData.load_mwh / 8760).toFixed(1)} MW average
                        </p>
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
                            {editingId ? 'Save Changes' : 'Add Participant'}
                        </button>
                    </div>
                </div>
            )}

            {/* Participant List */}
            {participants.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-lg">
                    No participants added yet. Click &quot;+ Add Participant&quot; to begin.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] text-left">
                                <th className="py-2 px-2">Name</th>
                                <th className="py-2 px-2">Type</th>
                                <th className="py-2 px-2 text-right">Annual Load (MWh)</th>
                                <th className="py-2 px-2 text-right">Avg MW</th>
                                <th className="py-2 px-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {participants.map((participant) => (
                                <tr key={participant.id} className="border-b border-[var(--border-color)] hover:bg-[var(--row-hover)]">
                                    <td className="py-3 px-2 font-medium">{participant.name}</td>
                                    <td className="py-3 px-2 text-[var(--text-secondary)]">{participant.type}</td>
                                    <td className="py-3 px-2 text-right">{participant.load_mwh.toLocaleString()}</td>
                                    <td className="py-3 px-2 text-right text-[var(--text-secondary)]">
                                        {(participant.load_mwh / 8760).toFixed(1)}
                                    </td>
                                    <td className="py-3 px-2 text-right space-x-2">
                                        <button
                                            onClick={() => handleEdit(participant)}
                                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(participant.id)}
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
                                <td className="py-3 px-2 text-right">{(totalLoad / 8760).toFixed(1)} MW</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
