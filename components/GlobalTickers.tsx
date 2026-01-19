
'use client';

import { usePathname } from 'next/navigation';
import EnergyTicker from './home/EnergyTicker';
import NewsTicker from './home/NewsTicker';
import PriceTicker from './home/PriceTicker';

export default function GlobalTickers() {
    const pathname = usePathname();
    const isHome = pathname === '/';

    return (
        <>
            {/* Energy Status Ticker */}
            {/* Home: Top 0. Other: Bottom 72px (above Price and News) */}
            <EnergyTicker
                className={isHome
                    ? "absolute top-0 left-0 z-50"
                    : "fixed bottom-[72px] left-0 z-[100] border-t border-slate-200 dark:border-white/10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
                }
            />

            {/* News Ticker */}
            {/* Home: Top 10 (40px). Other: Bottom 0 */}
            <NewsTicker
                className={isHome
                    ? "absolute top-10 left-0 z-40"
                    : "fixed bottom-0 left-0 z-[100]"
                }
            />

            {/* Price Ticker */}
            {/* Home: Top 72px. Other: Bottom 8 (32px) (above News) */}
            <PriceTicker
                className={isHome
                    ? "absolute top-[72px] left-0 z-30"
                    : "fixed bottom-8 left-0 z-[100] border-t border-slate-200 dark:border-white/10"
                }
            />
        </>
    );
}
