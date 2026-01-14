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

        return NextResponse.json({
            load: load || 54000, // Fallback if API fails
            gasPrice: gasPrice || 3.15,
            carbonIntensity,
            solarOutput,
            windOutput,
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
            timestamp: new Date().toISOString()
        });
    }
}
