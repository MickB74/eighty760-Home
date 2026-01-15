import { NextResponse } from 'next/server';
import { fetchErcotFuelMix } from '@/lib/external/ercot';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const data = await fetchErcotFuelMix();
        if (!data) {
            return NextResponse.json(
                { error: 'Failed to fetch fuel mix' },
                { status: 500 }
            );
        }
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching ERCOT fuel mix:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
