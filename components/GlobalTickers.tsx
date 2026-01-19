
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
            ? 'absolute top-[112px] md:top-[132px] z-50'
            : 'fixed bottom-0 z-[100]'
            }`}>
            {/* 1. Energy Ticker (Always Top of Stack) */}
            <EnergyTicker
                className={`transform transition-all duration-300 relative order-1 ${isHome
                    ? ''
                    : 'shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-slate-200 dark:border-white/10'
                    }`}
            />

            {/* 2. News Ticker (Middle on Home, Bottom on Others) */}
            <NewsTicker
                className={`transform transition-all duration-300 relative ${isHome
                    ? 'order-2'
                    : 'order-3'
                    }`}
            />

            {/* 3. Price Ticker (Bottom on Home, Middle on Others) */}
            <PriceTicker
                className={`transform transition-all duration-300 relative ${isHome
                    ? 'order-3'
                    : 'order-2 border-t border-slate-200 dark:border-white/10'
                    }`}
            />
        </div>
    );
}
