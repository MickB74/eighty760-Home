import fs from 'fs';
import init, { readParquet } from 'parquet-wasm/esm/parquet_wasm.js';
import { tableFromIPC } from 'apache-arrow';
import path from 'path';

async function checkLocations() {
    // Initialize WASM
    const wasmPath = path.join(process.cwd(), 'public', 'wasm', 'parquet_wasm_bg.wasm');
    const wasmBuffer = fs.readFileSync(wasmPath);
    await init(wasmBuffer);

    // Read one parquet file to check what locations exist
    const parquetPath = path.join(process.cwd(), 'public', 'data', 'prices', 'ercot_rtm_2024.parquet');
    const parquetBuffer = fs.readFileSync(parquetPath);

    const wasmTable = readParquet(new Uint8Array(parquetBuffer));
    const ipcBytes = wasmTable.intoIPCStream();
    const arrowTable = tableFromIPC(ipcBytes);

    // Get Location column
    const locationCol = arrowTable.getChild('Location');
    if (!locationCol) {
        console.log('No Location column found!');
        const schema = arrowTable.schema;
        console.log('Available columns:', schema.fields.map(f => f.name).join(', '));
        return;
    }

    // Collect unique locations
    const locations = new Set();
    for (let i = 0; i < locationCol.length; i++) {
        const loc = locationCol.get(i);
        if (loc) locations.add(String(loc));
        if (i > 100000) break; // Sample first 100k rows
    }

    const locationArray = Array.from(locations).sort();

    console.log(`\nFound ${locationArray.length} unique locations in RTM data:`);
    console.log('\nSample locations:');
    console.log(locationArray.slice(0, 20).join('\n'));

    // Check if we have resource nodes
    const hasHubs = locationArray.some(l => l.startsWith('HB_'));
    const hasZones = locationArray.some(l => l.startsWith('LZ_'));
    const hasResources = locationArray.some(l => !l.startsWith('HB_') && !l.startsWith('LZ_'));

    console.log(`\nHas Hubs: ${hasHubs}`);
    console.log(`Has Load Zones: ${hasZones}`);
    console.log(`Has Resource Nodes: ${hasResources}`);

    // Write to file for reference
    fs.writeFileSync('available_locations.txt', locationArray.join('\n'));
    console.log('\nWrote full list to available_locations.txt');
}

checkLocations().catch(console.error);
