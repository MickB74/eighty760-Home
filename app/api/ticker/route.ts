import { NextResponse } from 'next/server';
import { fetchErcotRealtimeDemand, fetchHenryHubPrice } from '@/lib/external/eia';
import { fetchLiveErcotPrices, fetchErcotFuelMix, fetchLiveErcotLoad } from '@/lib/external/ercot';

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function GET() {
    try {
        const apiKey = process.env.EIA_API_KEY || '';
        if (!apiKey) console.warn('Ticker API: No EIA_API_KEY found.');

        // Fetch concurrently data from EIA and ERCOT
        // Fetch concurrently data from EIA and ERCOT
        // Note: We now scrape Load, Wind, and Solar from ERCOT directly to avoid EIA dependency and ensure reliability.
        const [gridConditions, gasPrice, ercotPrices, fuelMix] = await Promise.all([
            fetchLiveErcotLoad(),
            fetchHenryHubPrice(apiKey),
            fetchLiveErcotPrices(),
            fetchErcotFuelMix()
        ]);

        console.log('Ticker Fetch Debug:', {
            hasKey: !!apiKey,
            keyLen: apiKey.length,
            conditions: gridConditions,
            gas: gasPrice,
            prices: ercotPrices ? 'OK' : 'NULL',
            fuelMix: fuelMix ? 'OK' : 'NULL'
        });

        // Parse Fuel Mix / Grid Conditions
        // Prefer scraped "Real Time System Conditions" which is updated more frequently and reliably than the JSON fuel mix
        let solarOutput = gridConditions.solar || 0;
        let windOutput = gridConditions.wind || 0;

        // If scraped values are missing (e.g. at night Solar might be 0 but scraped properly, but if null use fallback),
        // actually scraper returns null if not found. If 0 it returns 0.
        // If scraped is missing, try Fuel Mix API
        if (gridConditions.solar === null && fuelMix && fuelMix.data) {
            solarOutput = fuelMix.data['Solar']?.gen || 0;
        }
        if (gridConditions.wind === null && fuelMix && fuelMix.data) {
            windOutput = fuelMix.data['Wind']?.gen || 0;
        }

        let gasOutput = 0;
        let coalOutput = 0;
        let nuclearOutput = 0;

        if (fuelMix && fuelMix.data) {
            gasOutput = fuelMix.data['Natural Gas']?.gen || 0;
            // ERCOT sometimes labels it 'Coal and Lignite'
            coalOutput = (fuelMix.data['Coal and Lignite']?.gen || fuelMix.data['Coal']?.gen) || 0;
            nuclearOutput = fuelMix.data['Nuclear']?.gen || 0;
        }

        // Remove simulation fallback - if 0, it stays 0.

        // Mock Carbon -> Set to 0 if we can't calc it (or keep a static estimate if preferred, but user said no made up data)
        // Let's keep a reasonable static estimate as a placeholder or 0? 
        // User said "no made up data". So 0 or null is best. 
        // However, Carbon Intensity is often a calculated metric. 
        // Let's set it to 0 for now to be strict.
        const carbonIntensity = 0;

        return NextResponse.json({
            load: gridConditions.load || 0,
            gasPrice: gasPrice || 0,
            carbonIntensity,
            solarOutput,
            windOutput,
            gasOutput,
            coalOutput,
            nuclearOutput,
            prices: ercotPrices || {},
            timestamp: new Date().toISOString(),
            isRealData: !!(gridConditions.load && ercotPrices),
            isRealPrices: !!ercotPrices,
            isRealLoad: !!gridConditions.load,
            isRealGas: !!gasPrice
        });
    } catch (error) {
        console.error('Ticker API error:', error);
        // Fallback error data - no valid data
        return NextResponse.json({
            load: 0,
            gasPrice: 0,
            carbonIntensity: 0,
            solarOutput: 0,
            windOutput: 0,
            gasOutput: 0,
            coalOutput: 0,
            nuclearOutput: 0,
            prices: {},
            timestamp: new Date().toISOString(),
            isRealData: false,
            isRealPrices: false,
            isRealLoad: false,
            isRealGas: false
        }, { status: 500 });
    }
}
