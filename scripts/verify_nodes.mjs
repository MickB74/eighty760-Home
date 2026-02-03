
import fs from 'fs';
import path from 'path';
import init, { readParquet } from 'parquet-wasm';
import { tableFromIPC } from 'apache-arrow';

async function verifyNodes() {
    // initialize wasm
    const wasmPath = path.join(process.cwd(), 'node_modules/parquet-wasm/esm/parquet_wasm_bg.wasm');
    // If running in node, likely need to point to the right wasm file or just hope default init works if allowed
    // Actually in node ENVIRONMENT it might differ. Let's try basic init.
    // For this script running via `node`, we might need a different approach or rely on `apache-arrow` if it could read parquet directly (it can't, it reads arrow).
    // Let's try to just use valid node-compatible loading.

    // Simplification: checking ercot_locations.json first as it's the metadata source
    console.log("Checking ercot_locations.json...");
    try {
        const locationsPath = path.join(process.cwd(), 'public/data/ercot_locations.json');
        const locData = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));
        console.log(`Metadata contains: ${locData.hubs.length} Hubs, ${locData.zones.length} Zones, ${locData.resources.length} Resources.`);
    } catch (e) {
        console.error("Could not read locations json", e.message);
    }

    // Now checking Parquet
    console.log("\nChecking Parquet content...");
    const filePath = path.join(process.cwd(), 'public/data/prices/ercot_rtm_2024.parquet');

    if (!fs.existsSync(filePath)) {
        console.error("Parquet file not found");
        return;
    }

    const fileSize = fs.statSync(filePath).size;
    console.log(`File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    try {
        await init();
        const buffer = fs.readFileSync(filePath);
        // readParquet returns a WasmTable
        const wasmTable = readParquet(new Uint8Array(buffer));
        const table = tableFromIPC(wasmTable.intoIPCStream());

        const locationCol = table.getChild('Location');
        if (!locationCol) {
            console.log("No Location column found");
            return;
        }

        const uniqueLocs = new Set();
        for (let i = 0; i < locationCol.length; i++) {
            uniqueLocs.add(locationCol.get(i));
        }

        console.log(`Unique Locations found in Parquet: ${uniqueLocs.size}`);
        console.log("Sample Locations:", Array.from(uniqueLocs).slice(0, 10));

    } catch (e) {
        console.error("Error reading parquet:", e);
    }
}

verifyNodes();
