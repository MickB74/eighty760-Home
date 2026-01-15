'use client';

import EnergyTicker from './home/EnergyTicker';
import NewsTicker from './home/NewsTicker';
import PriceTicker from './home/PriceTicker';
import { usePathname } from 'next/navigation';

export default function GlobalTickerWrapper() {
    // Optional: Hide on specific pages if needed later
    const pathname = usePathname();

    // Example: Only hide on login page if it existed
    // if (pathname === '/login') return null;

    return (
        <div className="fixed top-[64px] left-0 w-full z-[45] pointer-events-none">
            {/* Pointer events none ensures clicks pass through the container, 
                but we need to re-enable them on the tickers themselves */}

            <div className="pointer-events-auto relative">
                <EnergyTicker />
            </div>

            <div className="pointer-events-auto relative">
                <NewsTicker />
            </div>

            <div className="pointer-events-auto relative">
                <PriceTicker />
            </div>
        </div>
    );
}
