import { NextResponse } from 'next/server';
import { fetchErcotRealtimeDemand, fetchHenryHubPrice } from '@/lib/external/eia';

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function GET() {
    try {
        const apiKey = process.env.EIA_API_KEY || '';

        // Fetch concurrently
        const [load, gasPrice] = await Promise.all([
            fetchErcotRealtimeDemand(apiKey),
            fetchHenryHubPrice(apiKey)
        ]);

        // Mock/Estimate others if real-time not available easily
        const carbonIntensity = Math.floor(350 + Math.random() * 50); // 350-400 g/kWh typical
        const solarOutput = Math.floor(5000 + Math.random() * 8000); // 5-13 GW typical day
        const windOutput = Math.floor(8000 + Math.random() * 10000);

        // Simulate Price Data (Hubs & Load Zones)
        const basePrice = 28.50;
        const prices = {
            HB_NORTH: (basePrice + Math.random() * 5).toFixed(2),
            HB_SOUTH: (basePrice + Math.random() * 4).toFixed(2),
            HB_WEST: (basePrice - 5 + Math.random() * 10).toFixed(2), // Cheaper (wind) or Volatile
            HB_HOUSTON: (basePrice + 2 + Math.random() * 6).toFixed(2), // Higher demand
            // Load Zones (Nodes)
            LZ_NORTH: (basePrice + 0.5 + Math.random() * 2).toFixed(2),
            LZ_SOUTH: (basePrice + 0.2 + Math.random() * 2).toFixed(2),
            LZ_WEST: (basePrice - 4 + Math.random() * 8).toFixed(2),
            LZ_HOUSTON: (basePrice + 3 + Math.random() * 5).toFixed(2),
        };

        return NextResponse.json({
            load: load || 54000, // Fallback if API fails
            gasPrice: gasPrice || 3.15,
            carbonIntensity,
            solarOutput,
            windOutput,
            prices,
            timestamp: new Date().toISOString()
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
            prices: {
                HB_NORTH: "29.40", HB_SOUTH: "28.10", HB_WEST: "24.50", HB_HOUSTON: "32.10",
                LZ_NORTH: "29.80", LZ_SOUTH: "28.40", LZ_WEST: "25.20", LZ_HOUSTON: "33.50"
            },
            timestamp: new Date().toISOString()
        });
    }
}
