import React from 'react';
import { SimulationResult } from '@/lib/aggregation/types';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import InfoTooltip from '@/components/shared/InfoTooltip';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

interface FinancialAnalysisTabProps {
    result: SimulationResult;
}

export default function FinancialAnalysisTab({ result }: FinancialAnalysisTabProps) {
    if (!result) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white dark:bg-white/5 rounded-2xl border border-dashed border-gray-300 dark:border-white/20 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-navy-950 dark:text-white mb-2">No Financial Analysis Available</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    To see financial breakdown and cashflow analysis, please configure your portfolio and run a simulation in the <strong>Dashboard</strong> tab.
                </p>
            </div>
        );
    }

    // Calculate monthly financials
    const monthlyData = {
        settlement: [] as number[],
        recIncome: [] as number[],
        recCost: [] as number[],
        netCashflow: [] as number[]
    };

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    for (let month = 0; month < 12; month++) {
        let startHour = 0;
        for (let m = 0; m < month; m++) {
            startHour += daysInMonth[m] * 24;
        }
        const endHour = startHour + daysInMonth[month] * 24;

        let monthSettlement = 0;
        let monthRecIncome = 0;
        let monthRecCost = 0;

        for (let h = startHour; h < endHour && h < 8760; h++) {
            const deficit = result.deficit_profile[h] || 0;
            const surplus = result.surplus_profile[h] || 0;
            const marketPrice = result.market_price_profile[h] || 0;
            const recPrice = result.rec_price_profile[h] || 0;

            // Settlement contribution
            const load = result.load_profile[h] || 0;
            const gen = (result.solar_profile[h] || 0) + (result.wind_profile[h] || 0) +
                (result.nuc_profile[h] || 0) + (result.geo_profile[h] || 0) +
                (result.ccs_profile[h] || 0);

            monthRecIncome += surplus * recPrice;
            monthRecCost += deficit * recPrice;
        }

        // Use proportional settlement
        monthSettlement = result.settlement_value * (daysInMonth[month] / 365);

        monthlyData.settlement.push(monthSettlement);
        monthlyData.recIncome.push(monthRecIncome);
        monthlyData.recCost.push(monthRecCost);
        monthlyData.netCashflow.push(monthSettlement + monthRecIncome - monthRecCost);
    }

    // Chart 1: Revenue vs Cost Breakdown
    const revenueVsCostData = {
        labels: ['Market Revenue', 'PPA Cost', 'REC Income', 'REC Cost'],
        datasets: [{
            data: [
                result.total_gen_revenue,
                result.total_ppa_cost,
                result.rec_income,
                result.rec_cost
            ],
            backgroundColor: ['#10b981', '#ef4444', '#22c55e', '#f97316'],
            borderWidth: 0
        }]
    };

    // Chart 2: Cashflow Waterfall Components
    const cashflowComponentsData = {
        labels: ['Settlement Value', 'REC Income', 'REC Cost', 'Net Portfolio Cashflow'],
        datasets: [{
            label: 'Amount ($)',
            data: [
                result.settlement_value,
                result.rec_income,
                -result.rec_cost,
                result.settlement_value + result.rec_income - result.rec_cost
            ],
            backgroundColor: [
                result.settlement_value >= 0 ? '#10b981' : '#ef4444',
                '#22c55e',
                '#f97316',
                (result.settlement_value + result.rec_income - result.rec_cost) >= 0 ? '#10b981' : '#ef4444'
            ],
            borderWidth: 0
        }]
    };

    // Chart 3: Monthly Cashflow Trend
    const monthlyCashflowData = {
        labels: monthLabels,
        datasets: [
            {
                label: 'Settlement',
                data: monthlyData.settlement,
                backgroundColor: 'rgba(239, 68, 68, 0.7)',
                borderColor: '#ef4444',
                borderWidth: 1
            },
            {
                label: 'REC Income',
                data: monthlyData.recIncome,
                backgroundColor: 'rgba(34, 197, 94, 0.7)',
                borderColor: '#22c55e',
                borderWidth: 1
            },
            {
                label: 'REC Cost',
                data: monthlyData.recCost.map(v => -v),
                backgroundColor: 'rgba(249, 115, 22, 0.7)',
                borderColor: '#f97316',
                borderWidth: 1
            }
        ]
    };

    // Chart 4: Net Monthly Cashflow Line
    const netMonthlyCashflowData = {
        labels: monthLabels,
        datasets: [{
            label: 'Net Cashflow',
            data: monthlyData.netCashflow,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#8b5cf6'
        }]
    };

    // Chart 5: Cost Breakdown Pie
    const costBreakdownData = {
        labels: ['PPA Cost', 'REC Cost', 'Market Purchase'],
        datasets: [{
            data: [
                result.total_ppa_cost,
                result.rec_cost,
                result.market_purchase_cost
            ],
            backgroundColor: ['#ef4444', '#f97316', '#eab308'],
            borderWidth: 2,
            borderColor: '#1e293b'
        }]
    };

    // Chart 6: Revenue Breakdown Pie
    const revenueBreakdownData = {
        labels: ['Market Revenue', 'REC Income'],
        datasets: [{
            data: [
                result.total_gen_revenue,
                result.rec_income
            ],
            backgroundColor: ['#10b981', '#22c55e'],
            borderWidth: 2,
            borderColor: '#1e293b'
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#9ca3af'
                }
            }
        },
        scales: {
            x: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            y: {
                ticks: {
                    color: '#9ca3af',
                    callback: (value: any) => '$' + (value / 1000).toFixed(0) + 'k'
                },
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
            }
        }
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    color: '#9ca3af',
                    padding: 15
                }
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        return `${label}: $${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                    }
                }
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Financial Summary Table */}
            <div className="bg-white dark:bg-navy-950/50 rounded-xl p-6 border border-gray-200 dark:border-white/10">
                <h2 className="text-xl font-bold mb-4 text-navy-950 dark:text-white">Financial Summary</h2>
                <table className="w-full">
                    <tbody>
                        <tr className="border-b border-gray-200 dark:border-white/10">
                            <td className="py-3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                Net Settlement Value (PPA vs Market)
                                <InfoTooltip text="Total Market Revenue from generation minus Total PPA Costs" />
                            </td>
                            <td className={`py-3 text-right font-mono font-bold ${result.settlement_value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {result.settlement_value >= 0 ? '+' : '-'}${Math.abs(result.settlement_value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </td>
                        </tr>
                        <tr className="border-b border-gray-200 dark:border-white/10">
                            <td className="py-3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                REC Income (Surplus)
                                <InfoTooltip text="Revenue from selling excess renewable generation as RECs (Surplus × REC Price)" />
                            </td>
                            <td className="py-3 text-right text-green-600 font-mono font-bold">+${result.rec_income.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        </tr>
                        <tr className="border-b border-gray-200 dark:border-white/10">
                            <td className="py-3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                REC Cost (Deficit)
                                <InfoTooltip text="Cost to purchase RECs for Unmatched Load (Deficit × REC/Scarcity Price)" />
                            </td>
                            <td className="py-3 text-right text-red-500 font-mono font-bold">-${result.rec_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        </tr>
                        <tr className="border-b-2 border-gray-300 dark:border-white/20">
                            <td className="py-3 font-medium text-lg flex items-center gap-2">
                                Net Portfolio Cashflow
                                <InfoTooltip text="Total net cashflow from PPA settlement and REC transactions" />
                            </td>
                            <td className={`py-3 text-right text-lg font-mono font-bold ${(result.settlement_value + result.rec_income - result.rec_cost) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {(result.settlement_value + result.rec_income - result.rec_cost) >= 0 ? '+' : '-'}${Math.abs(result.settlement_value + result.rec_income - result.rec_cost).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </td>
                        </tr>
                        <tr>
                            <td className="py-3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                Net Cashflow ($/MWh)
                                <InfoTooltip text="Net Portfolio Cashflow divided by Total Load" />
                            </td>
                            <td className={`py-3 text-right font-mono ${((result.settlement_value + result.rec_income - result.rec_cost) / result.total_load_mwh) >= 0 ? 'text-green-600/70' : 'text-red-500/70'}`}>
                                ${((result.settlement_value + result.rec_income - result.rec_cost) / result.total_load_mwh).toFixed(2)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Charts Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Chart 1: Cashflow Components */}
                <div className="bg-white dark:bg-navy-950/50 rounded-xl p-6 border border-gray-200 dark:border-white/10">
                    <h3 className="text-lg font-semibold mb-4 text-navy-950 dark:text-white">Cashflow Components</h3>
                    <div className="h-64">
                        <Bar data={cashflowComponentsData} options={chartOptions} />
                    </div>
                </div>

                {/* Chart 2: Revenue vs Cost */}
                <div className="bg-white dark:bg-navy-950/50 rounded-xl p-6 border border-gray-200 dark:border-white/10">
                    <h3 className="text-lg font-semibold mb-4 text-navy-950 dark:text-white">Revenue vs Cost Breakdown</h3>
                    <div className="h-64">
                        <Doughnut data={revenueVsCostData} options={pieOptions} />
                    </div>
                </div>

                {/* Chart 3: Monthly Cashflow Trend */}
                <div className="bg-white dark:bg-navy-950/50 rounded-xl p-6 border border-gray-200 dark:border-white/10">
                    <h3 className="text-lg font-semibold mb-4 text-navy-950 dark:text-white">Monthly Cashflow Breakdown</h3>
                    <div className="h-64">
                        <Bar data={monthlyCashflowData} options={{
                            ...chartOptions,
                            scales: {
                                ...chartOptions.scales,
                                x: chartOptions.scales.x,
                                y: {
                                    ...chartOptions.scales.y,
                                    stacked: true
                                }
                            }
                        }} />
                    </div>
                </div>

                {/* Chart 4: Net Monthly Cashflow */}
                <div className="bg-white dark:bg-navy-950/50 rounded-xl p-6 border border-gray-200 dark:border-white/10">
                    <h3 className="text-lg font-semibold mb-4 text-navy-950 dark:text-white">Net Monthly Cashflow Trend</h3>
                    <div className="h-64">
                        <Line data={netMonthlyCashflowData} options={{
                            ...chartOptions,
                            scales: {
                                ...chartOptions.scales,
                                x: chartOptions.scales.x,
                                y: {
                                    ...chartOptions.scales.y,
                                    suggestedMax: 0,
                                    suggestedMin: 0,
                                    grid: {
                                        color: (context) => context.tick.value === 0 ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.05)',
                                        lineWidth: (context) => context.tick.value === 0 ? 2 : 1,
                                    }
                                }
                            }
                        }} />
                    </div>
                </div>

                {/* Chart 5: Cost Breakdown */}
                <div className="bg-white dark:bg-navy-950/50 rounded-xl p-6 border border-gray-200 dark:border-white/10">
                    <h3 className="text-lg font-semibold mb-4 text-navy-950 dark:text-white">Total Cost Breakdown</h3>
                    <div className="h-64">
                        <Doughnut data={costBreakdownData} options={pieOptions} />
                    </div>
                </div>

                {/* Chart 6: Revenue Breakdown */}
                <div className="bg-white dark:bg-navy-950/50 rounded-xl p-6 border border-gray-200 dark:border-white/10">
                    <h3 className="text-lg font-semibold mb-4 text-navy-950 dark:text-white">Revenue Sources</h3>
                    <div className="h-64">
                        <Doughnut data={revenueBreakdownData} options={pieOptions} />
                    </div>
                </div>
            </div>

            {/* Asset Financial Breakdown */}
            {result.asset_details && result.asset_details.length > 0 && (
                <div className="bg-white dark:bg-navy-950/50 rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm overflow-x-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-navy-950 dark:text-white">Asset Financial Breakdown</h3>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300">
                                <th className="py-2 pr-4">Asset Name</th>
                                <th className="py-2 pr-4">Type</th>
                                <th className="py-2 pr-4">Hub</th>
                                <th className="py-2 pr-4 text-right">Capacity</th>
                                <th className="py-2 pr-4 text-right">Generation</th>
                                <th className="py-2 pr-4 text-right">Revenue (Basis)</th>
                                <th className="py-2 pr-4 text-right">PPA Cost</th>
                                <th className="py-2 text-right">Settlement</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.asset_details.map((asset, idx) => (
                                <tr key={idx} className="border-b border-gray-200 dark:border-white/10 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5">
                                    <td className="py-3 pr-4 font-medium text-navy-950 dark:text-white">{asset.name}</td>
                                    <td className="py-3 pr-4 text-navy-950 dark:text-white">{asset.type}</td>
                                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{asset.location}</td>
                                    <td className="py-3 pr-4 text-right text-navy-950 dark:text-white">{asset.capacity_mw} MW</td>
                                    <td className="py-3 pr-4 text-right text-navy-950 dark:text-white">{asset.total_gen_mwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} MWh</td>
                                    <td className="py-3 pr-4 text-right text-gray-900 dark:text-gray-100">
                                        ${asset.total_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="py-3 pr-4 text-right text-red-500">
                                        -${asset.total_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className={`py-3 text-right font-medium ${asset.settlement_value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {asset.settlement_value >= 0 ? '+' : ''}${asset.settlement_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-gray-200 dark:border-white/20 font-bold bg-gray-50 dark:bg-white/5 text-navy-950 dark:text-white">
                                <td className="py-3 pr-4" colSpan={3}>Total</td>
                                <td className="py-3 pr-4 text-right">
                                    {result.asset_details.reduce((sum, a) => sum + a.capacity_mw, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} MW
                                </td>
                                <td className="py-3 pr-4 text-right">
                                    {result.asset_details.reduce((sum, a) => sum + a.total_gen_mwh, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} MWh
                                </td>
                                <td className="py-3 pr-4 text-right text-gray-900 dark:text-gray-100">
                                    ${result.asset_details.reduce((sum, a) => sum + a.total_revenue, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </td>
                                <td className="py-3 pr-4 text-right text-red-500">
                                    -${result.asset_details.reduce((sum, a) => sum + a.total_cost, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </td>
                                <td className={`py-3 text-right ${result.settlement_value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {result.settlement_value >= 0 ? '+' : '-'}${Math.abs(result.settlement_value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}
