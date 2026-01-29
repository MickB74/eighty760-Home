
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import { readParquet } from 'parquet-wasm/node';

// Force dynamic to allow reading files at runtime
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const year = searchParams.get('year');
        const location = searchParams.get('location'); // e.g. "HB_HOUSTON"
        const market = searchParams.get('market'); // "RTM" or "DA"

        if (!year) {
            return NextResponse.json({ error: 'Year is required' }, { status: 400 });
        }

        // Determine file path
        // Real-Time (15-min) -> Parquet
        // Day-Ahead (Hourly) -> JSON (assuming existing JSONs are DA/Hourly)

        let data: any[] = [];

        if (market === 'RTM') {
            // Use Python script to read Parquet
            // This requires 'python3' and 'pandas'/'pyarrow' in the environment
            const util = require('util');
            const exec = util.promisify(require('child_process').exec);
            const scriptPath = path.join(process.cwd(), 'scripts', 'query_parquet.py');

            const cmd = `python3 "${scriptPath}" ${year} ${location ? `"${location}"` : ''}`;

            try {
                const { stdout, stderr } = await exec(cmd, { maxBuffer: 1024 * 1024 * 50 });
                if (stderr && stderr.trim().length > 0) {
                    // console.warn('Python Stderr:', stderr);
                }

                try {
                    const result = JSON.parse(stdout);
                    if (result.error) {
                        return NextResponse.json({ error: result.error }, { status: 404 });
                    }
                    return NextResponse.json(result);
                } catch (parseError) {
                    console.error('JSON Parse Error:', parseError);
                    return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
                }
            } catch (execError: any) {
                console.error('Python Exec Error:', execError);
                return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
            }
        } else {
            // Day Ahead (Hourly) - Read JSON
            const fileName = `ercot_${year}_hubs.json`;
            const filePath = path.join(process.cwd(), 'public', 'data', 'prices', fileName);
            if (!fs.existsSync(filePath)) {
                return NextResponse.json({ error: `Data not found for year ${year}` }, { status: 404 });
            }
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const jsonData = JSON.parse(fileContent);

            // Handle filtering if 'location' is provided
            // JSON structure: { "HB_NORTH": [p1, p2...], ... }
            if (location && jsonData[location]) {
                return NextResponse.json({
                    marketing: 'Day-Ahead',
                    interval: 'Hourly',
                    location,
                    prices: jsonData[location]
                });
            }
            return NextResponse.json(jsonData);
        }

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
