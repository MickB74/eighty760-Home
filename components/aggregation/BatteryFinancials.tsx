'use client';

import React from 'react';
import { BatteryCVTAResult } from '@/lib/aggregation/battery-cvta';

interface BatteryFinancialsProps {
    cvtaResult: BatteryCVTAResult | null;
}

export default function BatteryFinancials({ cvtaResult }: BatteryFinancialsProps) {
    if (!cvtaResult) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Run simulation to see battery financials
            </div>
        );
    }

    const formatCurrency = (val: number) => {
        const abs = Math.abs(val);
        if (abs >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
        if (abs >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
        return `$${val.toFixed(0)}`;
    };

    const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;

    return (
        <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                <h4 className="font-medium mb-3">Battery Performance</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <div className="text-gray-500 dark:text-gray-400 mb-1">Actual RTE</div>
                        <div className="font-semibold">{formatPercent(cvtaResult.performance.actual_rte)}</div>
                    </div>
                    <div>
                        <div className="text-gray-500 dark:text-gray-400 mb-1">Throughput</div>
                        <div className="font-semibold">{cvtaResult.performance.total_throughput_mwh.toLocaleString()} MWh</div>
                    </div>
                    <div>
                        <div className="text-gray-500 dark:text-gray-400 mb-1">Utilization</div>
                        <div className="font-semibold">{formatPercent(cvtaResult.performance.utilization_rate)}</div>
                    </div>
                    <div>
                        <div className="text-gray-500 dark:text-gray-400 mb-1">Cycles / Year</div>
                        <div className="font-semibold">{Math.round(cvtaResult.performance.total_throughput_mwh / 2 / (cvtaResult.performance.capacity_mwh || 1)).toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Buyer's P&L (Trading House) */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                <h4 className="font-medium mb-3 text-energy-green">🏢 Buyer&apos;s P&L (Trading House)</h4>
                <div className="space-y-2 text-sm">
                    {/* Revenue */}
                    <div className="flex justify-between py-1">
                        <span className="text-green-600 dark:text-green-400">Arbitrage Revenue</span>
                        <span className="font-mono text-green-600 dark:text-green-400">{formatCurrency(cvtaResult.buyer.arbitrage_revenue)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span className="text-green-600 dark:text-green-400">Ancillary Revenue</span>
                        <span className="font-mono text-green-600 dark:text-green-400">{formatCurrency(cvtaResult.buyer.ancillary_revenue)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-t border-gray-200 dark:border-slate-700 font-semibold">
                        <span>Total Revenue</span>
                        <span className="font-mono">{formatCurrency(cvtaResult.buyer.total_revenue)}</span>
                    </div>

                    {/* Costs */}
                    <div className="flex justify-between py-1 mt-2">
                        <span className="text-red-600 dark:text-red-400">Fixed Toll (to Owner)</span>
                        <span className="font-mono text-red-600 dark:text-red-400">-{formatCurrency(cvtaResult.buyer.fixed_toll_cost)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span className="text-red-600 dark:text-red-400">Charging Cost</span>
                        <span className="font-mono text-red-600 dark:text-red-400">-{formatCurrency(cvtaResult.buyer.charging_cost)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-t border-gray-200 dark:border-slate-700 font-semibold">
                        <span>Total Cost</span>
                        <span className="font-mono">-{formatCurrency(cvtaResult.buyer.total_cost)}</span>
                    </div>

                    {/* Net */}
                    <div className={`flex justify-between p-3 rounded-md font-bold text-base mt-2 ${cvtaResult.buyer.net_pnl >= 0
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        }`}>
                        <span>Net P&L (Buyer)</span>
                        <span className="font-mono">{formatCurrency(cvtaResult.buyer.net_pnl)}</span>
                    </div>
                </div>
            </div>

            {/* Owner's View */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                <h4 className="font-medium mb-3 text-purple-600 dark:text-purple-400">🏭 Owner&apos;s View (Asset Owner)</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1">
                        <span className="text-green-600 dark:text-green-400">Capacity Payment (Toll)</span>
                        <span className="font-mono text-green-600 dark:text-green-400">{formatCurrency(cvtaResult.owner.capacity_payment)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span className="text-green-600 dark:text-green-400">VOM Revenue</span>
                        <span className="font-mono text-green-600 dark:text-green-400">{formatCurrency(cvtaResult.owner.vom_revenue)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-t border-gray-200 dark:border-slate-700 font-semibold">
                        <span>Total Revenue</span>
                        <span className="font-mono">{formatCurrency(cvtaResult.owner.total_revenue)}</span>
                    </div>

                    <div className="flex justify-between py-1 mt-2">
                        <span className="text-red-600 dark:text-red-400">RTE Penalty</span>
                        <span className="font-mono text-red-600 dark:text-red-400">-{formatCurrency(cvtaResult.owner.rte_penalty)}</span>
                    </div>

                    <div className={`flex justify-between p-3 rounded-md font-bold text-base mt-2 ${cvtaResult.owner.net_pnl >= 0
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        }`}>
                        <span>Net P&L (Owner)</span>
                        <span className="font-mono">{formatCurrency(cvtaResult.owner.net_pnl)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
