import { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import MarketDataTab from '@/components/aggregation/MarketDataTab';

export const metadata: Metadata = {
    title: 'Live Market Intelligence | Eighty760',
    description: 'Real-time ERCOT grid conditions, load vs forecast, and Henry Hub gas prices.',
};

export default function LiveMarketPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-navy-950 transition-colors duration-300">
            <Navigation />
            <div className="max-w-[1800px] mx-auto p-4 lg:p-6 pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold brand-text">Live Market</h1>
                        <p className="text-gray-700 dark:text-gray-300">Real-Time Grid Intelligence</p>
                    </div>
                </div>

                <MarketDataTab />
            </div>
        </main>
    );
}
