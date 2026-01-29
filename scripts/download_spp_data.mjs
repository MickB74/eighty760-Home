#!/usr/bin/env node
/**
 * Download ERCOT Settlement Point Price (SPP) Data
 * 
 * This script downloads historical RTM and DAM settlement point prices
 * including all Resource Nodes, Load Zones, and Trading Hubs.
 * 
 * Data Sources:
 * - RTM: NP6-788-CD (Real-Time Market SPPs by Electrical Bus and Resource Node)
 * - DAM: NP4-190-CD (Day-Ahead Market Settlement Point Prices)
 * 
 * Usage:
 *   node download_spp_data.mjs --year=2024 --market=RTM
 *   node download_spp_data.mjs --year=2024 --market=DAM
 *   node download_spp_data.mjs --all  # Downloads all years 2020-2025
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream, createReadStream } from 'fs';
import { createGunzip } from 'zlib';
import unzipper from 'unzipper';

const args = process.argv.slice(2);
const config = {
    year: args.find(a => a.startsWith('--year='))?.split('=')[1],
    market: args.find(a => a.startsWith('--market='))?.split('=')[1] || 'RTM',
    all: args.includes('--all'),
    outputDir: './ercot_spp_downloads'
};

// ERCOT report type IDs (these are public knowledge from ERCOT website)
const REPORT_IDS = {
    RTM_SPP: '13061',  // NP6-788-CD: RTM LMPs by Resource Nodes, Load Zones & Hubs
    DAM_SPP: '12331'   // NP4-190-CD: DAM Settlement Point Prices
};

// Create output directory
if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
}

/**
 * Download file with retry logic
 */
async function downloadFile(url, destPath, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Downloading: ${url} (attempt ${attempt}/${retries})`);

            const client = url.startsWith('https') ? https : http;

            return await new Promise((resolve, reject) => {
                const request = client.get(url, { timeout: 60000 }, (response) => {
                    // Handle redirects
                    if (response.statusCode === 302 || response.statusCode === 301) {
                        const redirectUrl = response.headers.location;
                        console.log(`  Redirected to: ${redirectUrl}`);
                        return downloadFile(redirectUrl, destPath, retries).then(resolve).catch(reject);
                    }

                    if (response.statusCode !== 200) {
                        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                        return;
                    }

                    const fileStream = createWriteStream(destPath);
                    let downloaded = 0;

                    response.on('data', (chunk) => {
                        downloaded += chunk.length;
                        process.stdout.write(`\r  Downloaded: ${(downloaded / 1024 / 1024).toFixed(2)} MB`);
                    });

                    response.pipe(fileStream);

                    fileStream.on('finish', () => {
                        fileStream.close();
                        console.log(`\n  ✓ Completed: ${destPath}`);
                        resolve(destPath);
                    });

                    fileStream.on('error', (err) => {
                        fs.unlinkSync(destPath);
                        reject(err);
                    });
                });

                request.on('error', reject);
                request.on('timeout', () => {
                    request.destroy();
                    reject(new Error('Request timeout'));
                });
            });

        } catch (error) {
            console.error(`  ✗ Attempt ${attempt} failed: ${error.message}`);
            if (attempt === retries) throw error;

            // Exponential backoff
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`  Retrying in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Extract ZIP file
 */
async function extractZip(zipPath, extractDir) {
    console.log(`Extracting: ${zipPath}`);

    if (!fs.existsSync(extractDir)) {
        fs.mkdirSync(extractDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        createReadStream(zipPath)
            .pipe(unzipper.Extract({ path: extractDir }))
            .on('close', () => {
                console.log(`  ✓ Extracted to: ${extractDir}`);
                resolve(extractDir);
            })
            .on('error', reject);
    });
}

/**
 * Build ERCOT download URL
 * ERCOT uses a pattern like:
 * http://mis.ercot.com/misapp/GetReports.do?reportTypeId=XXXXX&reportDate=YYYYMMDD
 */
function buildDownloadUrl(reportId, year) {
    // For annual historical data, ERCOT often provides consolidated yearly files
    // The actual URL pattern may vary - this is a starting template
    const baseUrl = 'http://mis.ercot.com/misdownload/servlets/mirDownload';

    // Historical SPP data is typically available as annual archives
    // Example pattern (may need adjustment based on actual ERCOT structure):
    return `${baseUrl}?dDocName=ERCOT_${reportId}_${year}`;
}

/**
 * Download SPP data for a specific year and market
 */
async function downloadYear(year, market) {
    const reportId = market === 'RTM' ? REPORT_IDS.RTM_SPP : REPORT_IDS.DAM_SPP;
    const filename = `${market}_SPP_${year}.zip`;
    const destPath = path.join(config.outputDir, filename);

    console.log(`\n=== Downloading ${market} Settlement Point Prices for ${year} ===`);

    // Check if already downloaded
    if (fs.existsSync(destPath)) {
        console.log(`  ⚠ File already exists: ${destPath}`);
        console.log(`  Delete it to re-download`);
        return destPath;
    }

    const url = buildDownloadUrl(reportId, year);

    try {
        await downloadFile(url, destPath);

        // Extract the ZIP file
        const extractDir = path.join(config.outputDir, `${market}_${year}`);
        await extractZip(destPath, extractDir);

        return destPath;
    } catch (error) {
        console.error(`  ✗ Failed to download ${year}: ${error.message}`);
        throw error;
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('ERCOT Settlement Point Price Downloader');
    console.log('========================================\n');

    console.log('⚠️  IMPORTANT NOTE:');
    console.log('This script contains template URLs that may need adjustment.');
    console.log('ERCOT\'s actual download URLs are discovered interactively on their website.');
    console.log('You may need to:');
    console.log('  1. Visit http://www.ercot.com/mp/data-products/data-product-details?id=NP6-788-CD');
    console.log('  2. Manually download the data files');
    console.log('  3. Place them in ./ercot_spp_downloads/');
    console.log('  4. Run the conversion script');
    console.log('');

    const years = config.all ? [2020, 2021, 2022, 2023, 2024, 2025] : [parseInt(config.year)];
    const markets = ['RTM', 'DAM'];

    for (const year of years) {
        if (isNaN(year)) continue;

        for (const market of markets) {
            try {
                await downloadYear(year, market);
            } catch (error) {
                console.error(`Failed to process ${market} ${year}:`, error.message);
            }
        }
    }

    console.log('\n=== Download Complete ===');
    console.log(`Files saved to: ${config.outputDir}`);
    console.log('\nNext steps:');
    console.log('  1. Verify downloaded files');
    console.log('  2. Run: node scripts/convert_spp_to_parquet.mjs');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { downloadYear, extractZip };
