import { NextResponse } from 'next/server';
import { fetchErcotRealtimeDemand, fetchHenryHubPrice } from '@/lib/external/eia';
import { fetchLiveErcotPrices, fetchErcotFuelMix } from '@/lib/external/ercot';

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function GET() {
    try {
        const apiKey = process.env.EIA_API_KEY || '';
        if (!apiKey) console.warn('Ticker API: No EIA_API_KEY found.');

        // Fetch concurrently data from EIA and ERCOT
        const [load, gasPrice, ercotPrices, fuelMix] = await Promise.all([
            fetchErcotRealtimeDemand(apiKey),
            fetchHenryHubPrice(apiKey),
            fetchLiveErcotPrices(),
            fetchErcotFuelMix()
        ]);

        console.log('Ticker Fetch Debug:', {
            hasKey: !!apiKey,
            keyLen: apiKey.length,
            load: load,
            gas: gasPrice,
            prices: ercotPrices ? 'OK' : 'NULL',
            fuelMix: fuelMix ? 'OK' : 'NULL'
        });

        // Parse Fuel Mix
        let solarOutput = 0;
        let windOutput = 0;

        if (fuelMix && fuelMix.data) {
            solarOutput = fuelMix.data['Solar']?.gen || 0;
            windOutput = fuelMix.data['Wind']?.gen || 0;
        } else {
            // Fallback Estimates
            solarOutput = Math.floor(5000 + Math.random() * 8000);
            windOutput = Math.floor(8000 + Math.random() * 10000);
        }

        // Mock Carbon (Complex to calc from mix accurately without emissions factors)
        const carbonIntensity = Math.floor(350 + Math.random() * 50);

        return NextResponse.json({
            load: load || 54000,
            gasPrice: gasPrice || 3.15,
            carbonIntensity,
            solarOutput,
            windOutput,
            prices: ercotPrices || generateSimulatedPrices(),
            timestamp: new Date().toISOString(),
            isRealData: !!(load && ercotPrices),
            isRealPrices: !!ercotPrices,
            isRealLoad: !!load
        });
    } catch (error) {
        console.error('Ticker API error:', error);
        // Fallback data
        return NextResponse.json({
            load: 54120,
            gasPrice: 3.12,
            carbonIntensity: 385,
            solarOutput: 8400,
            windOutput: 12500,
            prices: generateSimulatedPrices(),
            timestamp: new Date().toISOString(),
            isRealData: false,
            isRealPrices: false,
            isRealLoad: false
        });
    }
}

// Helper to generate fallback simulated prices
function generateSimulatedPrices() {
    const basePrice = 28.50;
    return {
        HB_NORTH: (basePrice + Math.random() * 5).toFixed(2),
        HB_SOUTH: (basePrice + Math.random() * 4).toFixed(2),
        HB_WEST: (basePrice - 5 + Math.random() * 10).toFixed(2),
        HB_HOUSTON: (basePrice + 2 + Math.random() * 6).toFixed(2),
        LZ_NORTH: (basePrice + 0.5 + Math.random() * 2).toFixed(2),
        LZ_SOUTH: (basePrice + 0.2 + Math.random() * 2).toFixed(2),
        LZ_WEST: (basePrice - 4 + Math.random() * 8).toFixed(2),
        LZ_HOUSTON: (basePrice + 3 + Math.random() * 5).toFixed(2),
    };
}
