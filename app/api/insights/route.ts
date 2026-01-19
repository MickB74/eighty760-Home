
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Insight from '@/lib/models/Insight';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();
        const insights = await Insight.find({ isRelevant: true }).sort({ ingestedDate: -1 }).limit(50);
        return NextResponse.json({ success: true, insights });
    } catch (error) {
        console.error('Fetch insights error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
