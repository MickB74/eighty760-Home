import { NextResponse } from 'next/server';
import { fetchNaturalGasFutures } from '@/lib/external/eia';

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function GET() {
    try {
        const futuresData = await fetchNaturalGasFutures();

        return NextResponse.json(futuresData, {
            headers: {
                'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800'
            }
        });
    } catch (error) {
        console.error('Futures API error:', error);
        return NextResponse.json({
            futures: [],
            isRealData: false,
            timestamp: new Date().toISOString(),
            error: 'Failed to fetch futures data'
        }, { status: 500 });
    }
}
