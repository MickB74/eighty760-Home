import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import init, { readParquet } from 'parquet-wasm/esm/parquet_wasm.js';
import { tableFromIPC } from 'apache-arrow';

let wasmInitialized = false;

async function initWasm() {
    if (wasmInitialized) return;
    const wasmPath = path.join(process.cwd(), 'public', 'wasm', 'parquet_wasm_bg.wasm');
    const wasmBuffer = fs.readFileSync(wasmPath);
    await init(wasmBuffer);
    wasmInitialized = true;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const market = searchParams.get('market') || 'RTM';

    if (!year) {
        return NextResponse.json({ error: 'Year parameter required' }, { status: 400 });
    }

    try {
        await initWasm();

        // Determine file path
        const fileName = `ercot_${market.toLowerCase()}_${year}.parquet`;
        const filePath = path.join(process.cwd(), 'public', 'data', 'prices', fileName);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            // File doesn't exist, return empty array
            return NextResponse.json({ locations: [], year, market });
        }

        // Read parquet file
        const parquetBuffer = fs.readFileSync(filePath);
        const wasmTable = readParquet(new Uint8Array(parquetBuffer));
        const ipcBytes = wasmTable.intoIPCStream();
        const table = tableFromIPC(ipcBytes);

        // Extract unique locations
        const locationCol = table.getChild('Location');
        if (!locationCol) {
            return NextResponse.json({ error: 'No Location column in data' }, { status: 500 });
        }

        const locationsSet = new Set<string>();
        const sampleSize = Math.min(100000, locationCol.length); // Sample for performance

        for (let i = 0; i < sampleSize; i++) {
            const loc = locationCol.get(i);
            if (loc) locationsSet.add(String(loc));
        }

        const locations = Array.from(locationsSet).sort();

        return NextResponse.json({
            locations,
            year: parseInt(year),
            market,
            count: locations.length
        });

    } catch (error: any) {
        console.error('Error getting available locations:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get locations' },
            { status: 500 }
        );
    }
}
