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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Participant Portfolio</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Build your aggregation manually</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="px-6 py-2 bg-energy-green text-navy-950 rounded-lg hover:bg-energy-green/90 transition font-medium whitespace-nowrap"
                >
                    + Add Participant
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="p-4 bg-gray-50 dark:bg-black/20 rounded-lg border border-gray-200 dark:border-white/10 space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{editingId ? 'Edit' : 'Add'} Participant</h4>

                    <div>
                        <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Participant Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Hyperscale DC North"
                            className="w-full px-3 py-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-900 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as Participant['type'] })}
                            className="w-full px-3 py-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-900 text-gray-900 dark:text-gray-100"
                        >
                            {PARTICIPANT_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Annual Load (MWh)</label>
                        <input
                            type="number"
                            value={formData.load_mwh}
                            onChange={(e) => setFormData({ ...formData, load_mwh: parseFloat(e.target.value) || 0 })}
                            min="1000"
                            step="10000"
                            className="w-full px-3 py-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-900 text-gray-900 dark:text-gray-100"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {(formData.load_mwh / 8760).toFixed(1)} MW average
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-energy-green text-navy-950 text-sm rounded-md hover:bg-energy-green/90 font-medium"
                        >
                            {editingId ? 'Save Changes' : 'Add Participant'}
                        </button>
                    </div>
                </div>
            )}

            {/* Participant List */}
            {participants.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                    No participants added yet. Click &quot;+ Add Participant&quot; to begin.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-white/10">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-white/5">
                            <tr className="border-b border-gray-200 dark:border-white/10 text-left">
                                <th className="py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">Name</th>
                                <th className="py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">Type</th>
                                <th className="py-2 px-3 text-right text-gray-700 dark:text-gray-300 font-medium">Annual Load (MWh)</th>
                                <th className="py-2 px-3 text-right text-gray-700 dark:text-gray-300 font-medium">Avg MW</th>
                                <th className="py-2 px-3 text-right text-gray-700 dark:text-gray-300 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10 bg-white dark:bg-navy-950">
                            {participants.map((participant) => (
                                <tr key={participant.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="py-3 px-3 font-medium text-gray-900 dark:text-gray-100">{participant.name}</td>
                                    <td className="py-3 px-3 text-gray-500 dark:text-gray-400">{participant.type}</td>
                                    <td className="py-3 px-3 text-right text-gray-900 dark:text-gray-100 font-mono">{participant.load_mwh.toLocaleString()}</td>
                                    <td className="py-3 px-3 text-right text-gray-500 dark:text-gray-400 font-mono">
                                        {(participant.load_mwh / 8760).toFixed(1)}
                                    </td>
                                    <td className="py-3 px-3 text-right space-x-2">
                                        <button
                                            onClick={() => handleEdit(participant)}
                                            className="text-energy-green hover:text-energy-green/80 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(participant.id)}
                                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-gray-50 dark:bg-white/5 font-bold border-t-2 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                                <td className="py-3 px-3" colSpan={2}>Total Portfolio</td>
                                <td className="py-3 px-3 text-right font-mono">{totalLoad.toLocaleString()} MWh</td>
                                <td className="py-3 px-3 text-right font-mono">{(totalLoad / 8760).toFixed(1)} MW</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
