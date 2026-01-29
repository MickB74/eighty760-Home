
import { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import NodeAnalysisTab from '@/components/aggregation/NodeAnalysisTab';

export const metadata: Metadata = {
    title: 'Node Price Analysis | Eighty760',
    description: 'Compare historical ERCOT node and hub prices with real-time granularity.',
};

export default function NodePricesPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-navy-950 transition-colors duration-300">
            <Navigation />
            <div className="max-w-[1800px] mx-auto p-4 lg:p-6 pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold brand-text">Node Prices</h1>
                        <p className="text-gray-700 dark:text-gray-300">Historical Price Comparison & Analysis</p>
                    </div>
                </div>

                <NodeAnalysisTab />
            </div>
        </main>
    );
}
