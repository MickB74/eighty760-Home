
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { tableFromIPC } from 'apache-arrow';
// @ts-ignore
import init, { readParquet } from 'parquet-wasm/esm/parquet_wasm.js';

export const runtime = 'nodejs';

// Helper to ensure WASM is initialized
async function initWasm() {
    const wasmPath = path.join(process.cwd(), 'node_modules', 'parquet-wasm', 'esm', 'parquet_wasm_bg.wasm');
    const wasmBuffer = fs.readFileSync(wasmPath);
    await init(wasmBuffer);
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const year = searchParams.get('year');
        const location = searchParams.get('location'); // e.g. "HB_HOUSTON"
        const market = searchParams.get('market'); // "RTM" or "DA"

        if (!year) {
            return NextResponse.json({ error: 'Year is required' }, { status: 400 });
        }

        if (market === 'RTM') {
            // RTM Data - Read Parquet via WASM
            try {
                await initWasm();

                const filePath = path.join(process.cwd(), 'public', 'data', 'prices', `ercot_rtm_${year}.parquet`);
                if (!fs.existsSync(filePath)) {
                    return NextResponse.json({ error: `File not found for year ${year}` }, { status: 404 });
                }

                const fileBuffer = fs.readFileSync(filePath);

                // Read Parquet -> Arrow IPC
                const wasmTable = readParquet(fileBuffer);
                const ipcBuffer = wasmTable.intoIPCStream();
                // wasmTable.free(); 

                const table = tableFromIPC(ipcBuffer);

                // Filter by Location
                const locCol = table.getChild('Location');
                const timeCol = table.getChild('Time_Central') || table.getChild('Time'); // Try both
                const sppCol = table.getChild('SPP');

                if (!locCol || !timeCol || !sppCol) {
                    return NextResponse.json({ error: 'Required columns not found in Parquet file' }, { status: 500 });
                }

                const data: any[] = [];
                // data format: [[time, price], ...]

                for (let i = 0; i < table.numRows; i++) {
                    if (!location || locCol.get(i) === location) {
                        data.push([
                            String(timeCol.get(i)), // Ensure string for JSON
                            Number(sppCol.get(i))
                        ]);
                    }
                }

                return NextResponse.json({
                    data: data,
                    format: 'compact',
                    columns: ['Time', 'SPP']
                });

            } catch (err: any) {
                console.error('WASM Parquet Error:', err);
                return NextResponse.json({ error: `Failed to process Parquet: ${err.message}` }, { status: 500 });
            }

        } else {
            // Day Ahead (Hourly) - Read JSON
            const fileName = `ercot_${year}_hubs.json`;
            const filePath = path.join(process.cwd(), 'public', 'data', 'prices', fileName);

            try {
                const fileContents = await fs.promises.readFile(filePath, 'utf8');
                const jsonData = JSON.parse(fileContents);

                if (location && jsonData[location]) {
                    return NextResponse.json({
                        location: location,
                        prices: jsonData[location]
                    });
                } else if (location) {
                    return NextResponse.json({ error: 'Location not found in DA data' }, { status: 404 });
                } else {
                    return NextResponse.json(jsonData);
                }
            } catch (err) {
                console.error('JSON Read Error:', err);
                return NextResponse.json({ error: 'Failed to read DA data' }, { status: 500 });
            }
        }

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
