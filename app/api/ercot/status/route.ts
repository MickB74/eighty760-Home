import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const response = await fetch('https://www.ercot.com/api/1/services/read/dashboards/daily-prc.json', {
            next: { revalidate: 60 }, // Cache for 60 seconds
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.ercot.com/gridmktinfo/dashboards/gridconditions'
            }
        });

        if (!response.ok) {
            throw new Error(`ERCOT API responded with ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching ERCOT status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch grid status' },
            { status: 500 }
        );
    }
}
