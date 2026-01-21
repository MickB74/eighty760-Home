import { NextResponse } from 'next/server';
import { fetchErcotRealtimeDemand, fetchHenryHubPrice, fetchRealTimeGasPrice } from '@/lib/external/eia';
import { fetchLiveErcotPrices, fetchErcotFuelMix, fetchLiveErcotLoad } from '@/lib/external/ercot';

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function GET() {
    try {
        const apiKey = process.env.EIA_API_KEY || '';
        if (!apiKey) console.warn('Ticker API: No EIA_API_KEY found.');

        // Fetch concurrently data from EIA and ERCOT
        // Fetch concurrently data from EIA and ERCOT
        // Note: We now scrape Load, Wind, and Solar from ERCOT directly to avoid EIA dependency and ensure reliability.
        // Gas price now uses Yahoo Finance for real-time NYMEX futures (NG=F) with fallback to EIA spot price.
        const [gridConditions, realTimeGas, eiaGasPrice, ercotPrices, fuelMix] = await Promise.all([
            fetchLiveErcotLoad(),
            fetchRealTimeGasPrice(),
            fetchHenryHubPrice(apiKey),
            fetchLiveErcotPrices(),
            fetchErcotFuelMix()
        ]);

        // Use real-time gas price if available, fallback to EIA
        const gasPrice = realTimeGas.price ?? eiaGasPrice;
        const isGasDelayed = realTimeGas.price !== null;

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
            // Find latest timestamp in nested structure
            const days = Object.keys(fuelMix.data).sort();
            const latestDay = days[days.length - 1];
            if (latestDay && fuelMix.data[latestDay]) {
                const timestamps = Object.keys(fuelMix.data[latestDay]).sort();
                const latestTs = timestamps[timestamps.length - 1];
                if (latestTs) {
                    const data = fuelMix.data[latestDay][latestTs];
                    solarOutput = data['Solar']?.gen || 0;
                }
            }
        }
        if (gridConditions.wind === null && fuelMix && fuelMix.data) {
            // Find latest timestamp in nested structure
            const days = Object.keys(fuelMix.data).sort();
            const latestDay = days[days.length - 1];
            if (latestDay && fuelMix.data[latestDay]) {
                const timestamps = Object.keys(fuelMix.data[latestDay]).sort();
                const latestTs = timestamps[timestamps.length - 1];
                if (latestTs) {
                    const data = fuelMix.data[latestDay][latestTs];
                    windOutput = data['Wind']?.gen || 0;
                }
            }
        }

        let gasOutput = 0;
        let coalOutput = 0;
        let nuclearOutput = 0;

        if (fuelMix && fuelMix.data) {
            const days = Object.keys(fuelMix.data).sort();
            const latestDay = days[days.length - 1];
            if (latestDay && fuelMix.data[latestDay]) {
                const timestamps = Object.keys(fuelMix.data[latestDay]).sort();
                const latestTs = timestamps[timestamps.length - 1];
                if (latestTs) {
                    const data = fuelMix.data[latestDay][latestTs];
                    gasOutput = data['Natural Gas']?.gen || 0;
                    coalOutput = (data['Coal and Lignite']?.gen || data['Coal']?.gen) || 0;
                    nuclearOutput = data['Nuclear']?.gen || 0;
                }
            }
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
            isRealGas: !!gasPrice,
            isGasDelayed: isGasDelayed, // True = real-time NYMEX futures (~15 min delay)
            gasSource: isGasDelayed ? 'NYMEX NG Futures' : 'EIA Spot',
            // Gas % change metrics
            gasDayChange: realTimeGas.dayChange,
            gasYtdChange: realTimeGas.ytdChange,
            gasYearChange: realTimeGas.yearChange
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
