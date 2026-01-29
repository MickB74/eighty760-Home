#!/usr/bin/env node
/**
 * Convert ERCOT SPP CSV files to Parquet format
 * 
 * This script processes large CSV files from ERCOT and converts them
 * to optimized Parquet format for fast querying.
 * 
 * Usage:
 *   node convert_spp_to_parquet.mjs --input=./ercot_spp_downloads/RTM_2024
 *   node convert_spp_to_parquet.mjs --all  # Process all downloaded data
 */

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import init, { writeParquet } from 'parquet-wasm/esm/parquet_wasm.js';
import { tableFromArrays, Table } from 'apache-arrow';

const args = process.argv.slice(2);
const config = {
    input: args.find(a => a.startsWith('--input='))?.split('=')[1],
    all: args.includes('--all'),
    inputDir: './ercot_spp_downloads',
    outputDir: './public/data/prices'
};

// Initialize WASM
let wasmInitialized = false;
async function initWasm() {
    if (wasmInitialized) return;

    const wasmPath = path.join(process.cwd(), 'public', 'wasm', 'parquet_wasm_bg.wasm');
    const wasmBuffer = fs.readFileSync(wasmPath);
    await init(wasmBuffer);
    wasmInitialized = true;
}

/**
 * Process a single CSV file and convert to Parquet
 */
async function processCsvFile(csvPath, market, year) {
    console.log(`\nProcessing: ${csvPath}`);

    const csvContent = fs.readFileSync(csvPath, 'utf8');

    console.log('  Parsing CSV...');
    const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true
    });

    if (parsed.errors.length > 0) {
        console.warn('  ⚠ CSV parsing warnings:', parsed.errors.slice(0, 5));
    }

    console.log(`  Loaded ${parsed.data.length} rows`);

    // Expected columns (may vary by report):
    // RTM: DeliveryTime, DeliveryDate, DeliveryHour, DeliveryInterval, SettlementPoint, SettlementPointPrice
    // DAM: DeliveryDate, HourEnding, SettlementPoint, SettlementPointPrice

    // Normalize and prepare data
    const processedData = parsed.data.map(row => {
        // Determine timestamp
        let timestamp;
        if (row.DeliveryTime) {
            timestamp = new Date(row.DeliveryTime).getTime();
        } else if (row.DeliveryDate && row.HourEnding) {
            // DAM format: Date + Hour
            const dateStr = row.DeliveryDate;
            const hour = parseInt(row.HourEnding) - 1; // HourEnding is 1-24
            timestamp = new Date(`${dateStr}T${hour.toString().padStart(2, '0')}:00:00`).getTime();
        }

        return {
            Time_Central: timestamp,
            Location: row.SettlementPoint || row.SettlementPointName,
            SPP: parseFloat(row.SettlementPointPrice || row.Price)
        };
    }).filter(row => row.Time_Central && row.Location && !isNaN(row.SPP));

    console.log(`  Processed ${processedData.length} valid rows`);

    // Convert to Arrow Table
    const times = processedData.map(d => d.Time_Central);
    const locations = processedData.map(d => d.Location);
    const prices = processedData.map(d => d.SPP);

    const table = tableFromArrays({
        Time_Central: times,
        Location: locations,
        SPP: prices
    });

    // Write to Parquet
    const outputFilename = `ercot_${market.toLowerCase()}_${year}_full.parquet`;
    const outputPath = path.join(config.outputDir, outputFilename);

    console.log('  Converting to Parquet...');
    await initWasm();

    const writerProps = {
        compression: 'ZSTD',
        compressionLevel: 9
    };

    const parquetBuffer = writeParquet(table, writerProps);
    fs.writeFileSync(outputPath, parquetBuffer);

    const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
    console.log(`  ✓ Wrote: ${outputPath} (${sizeMB} MB)`);

    return outputPath;
}

/**
 * Find and process all CSV files in a directory
 */
async function processDirectory(dirPath, market, year) {
    console.log(`\n=== Processing ${market} ${year} ===`);

    if (!fs.existsSync(dirPath)) {
        console.error(`  ✗ Directory not found: ${dirPath}`);
        return;
    }

    const files = fs.readdirSync(dirPath);
    const csvFiles = files.filter(f => f.toLowerCase().endsWith('.csv'));

    if (csvFiles.length === 0) {
        console.warn(`  ⚠ No CSV files found in ${dirPath}`);
        return;
    }

    console.log(`  Found ${csvFiles.length} CSV file(s)`);

    for (const csvFile of csvFiles) {
        const csvPath = path.join(dirPath, csvFile);
        try {
            await processCsvFile(csvPath, market, year);
        } catch (error) {
            console.error(`  ✗ Failed to process ${csvFile}:`, error.message);
        }
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('ERCOT SPP to Parquet Converter');
    console.log('===============================\n');

    // Ensure output directory exists
    if (!fs.existsSync(config.outputDir)) {
        fs.mkdirSync(config.outputDir, { recursive: true });
    }

    if (config.all) {
        // Process all downloaded directories
        const dirs = fs.readdirSync(config.inputDir);

        for (const dir of dirs) {
            const dirPath = path.join(config.inputDir, dir);
            if (!fs.statSync(dirPath).isDirectory()) continue;

            // Parse directory name (e.g., "RTM_2024")
            const match = dir.match(/^(RTM|DAM)_(\d{4})$/);
            if (!match) continue;

            const [, market, year] = match;
            await processDirectory(dirPath, market, year);
        }
    } else if (config.input) {
        // Process specific directory
        const dirname = path.basename(config.input);
        const match = dirname.match(/^(RTM|DAM)_(\d{4})$/);

        if (!match) {
            console.error('Directory name must match pattern: RTM_YYYY or DAM_YYYY');
            process.exit(1);
        }

        const [, market, year] = match;
        await processDirectory(config.input, market, year);
    } else {
        console.error('Usage: node convert_spp_to_parquet.mjs --input=<dir> or --all');
        process.exit(1);
    }

    console.log('\n=== Conversion Complete ===');
    console.log(`Parquet files saved to: ${config.outputDir}`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { processCsvFile, processDirectory };
