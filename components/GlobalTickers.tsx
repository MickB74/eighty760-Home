
'use client';

import { usePathname } from 'next/navigation';
import EnergyTicker from './home/EnergyTicker';
import NewsTicker from './home/NewsTicker';
import PriceTicker from './home/PriceTicker';

export default function GlobalTickers() {
    const pathname = usePathname();
    const isHome = pathname === '/';

    // Desktop Nav Height: ~132px (100px logo + 32px padding)
    // Mobile Nav Height: ~112px (80px logo + 32px padding)
    // We position the stack starting here for Home page.

    return (
        <div className={`flex flex-col w-full left-0 transition-all duration-300 ${isHome
            ? 'fixed top-[112px] md:top-[132px] z-50' // Fixed to stay visible on scroll
            : 'fixed bottom-0 z-[100]'
            }`}>
            {/* 1. Energy Ticker (Top) */}
            <EnergyTicker
                className={`transform transition-all duration-300 relative ${isHome
                    ? 'shadow-sm'
                    : 'shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-slate-200 dark:border-white/10'
                    }`}
            />

            {/* 2. News Ticker (Middle) */}
            <NewsTicker
                className="transform transition-all duration-300 relative"
            />

            {/* 3. Price Ticker (Bottom) */}
            <PriceTicker
                className={`transform transition-all duration-300 relative ${isHome
                    ? ''
                    : 'border-t border-slate-200 dark:border-white/10'
                    }`}
            />
        </div>
    );
}
