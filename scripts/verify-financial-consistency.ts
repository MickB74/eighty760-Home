#!/usr/bin/env tsx
/**
 * Verification script to ensure financial calculations match between:
 * 1. Main Dashboard (with market_price_avg from loaded data)
 * 2. Multi-Year Analysis Tab (with use_actual_prices: true)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { runAggregationSimulation } from '../lib/aggregation/engine';
import type { FinancialParams, Participant, GenerationAsset } from '../lib/aggregation/types';

const YEARS_TO_TEST = [2020, 2021, 2022, 2023, 2024, 2025];
const TEST_HUB = 'HB_HOUSTON';
const PUBLIC_DIR = path.join(__dirname, '../public');

interface GenProfile {
    solar: number[];
    wind: number[];
    load: number[];
}

async function loadPricesFromFile(year: number, hub: string): Promise<number[] | null> {
    try {
        // Try hub-specific file first
        const hubFilePath = path.join(PUBLIC_DIR, `data/prices/ercot_${year}_hubs.json`);
        const content = await fs.readFile(hubFilePath, 'utf-8');
        const data = JSON.parse(content);
        if (data[hub]) {
            return data[hub];
        }
    } catch (error) {
        // File not found or hub not in file, try default
    }

    // Try default file
    try {
        const defaultPath = path.join(PUBLIC_DIR, `data/prices/ercot_${year}.json`);
        const content = await fs.readFile(defaultPath, 'utf-8');
        const data = JSON.parse(content);
        return data.prices || null;
    } catch (error) {
        console.warn(`No price data available for ${year}`);
        return null;
    }
}

async function loadGenerationProfile(year: number): Promise<GenProfile> {
    try {
        const profilePath = path.join(PUBLIC_DIR, `data/profiles/${year}/profile.json`);
        const content = await fs.readFile(profilePath, 'utf-8');
        return JSON.parse(content) as GenProfile;
    } catch (error) {
        console.log(`  ⚠️  Using TMY fallback for ${year}`);
        const tmyPath = path.join(PUBLIC_DIR, 'data/profiles/tmy/profile.json');
        const content = await fs.readFile(tmyPath, 'utf-8');
        return JSON.parse(content) as GenProfile;
    }
}

async function verifyYear(year: number) {
    console.log(`\n📊 Verifying Year: ${year}`);
    console.log('─'.repeat(60));

    // Load historical prices
    const historicalPrices = await loadPricesFromFile(year, TEST_HUB);
    if (!historicalPrices || historicalPrices.length === 0) {
        console.log('  ❌ No price data available');
        return false;
    }

    // Load generation profile
    const profile = await loadGenerationProfile(year);

    // Calculate average price from loaded data
    const avgPrice = historicalPrices.reduce((sum: number, p: number) => sum + p, 0) / historicalPrices.length;

    // Common test parameters
    const participants: Participant[] = [
        { id: '1', name: 'Test Load', load_mwh: 4380000, type: 'Data Center' }
    ];

    const activeAssets: GenerationAsset[] = [
        { id: 'solar-1', name: 'Solar Farm', type: 'Solar', capacity_mw: 300, capacity_factor: 0.25, location: 'Houston' },
        { id: 'wind-1', name: 'Wind Farm', type: 'Wind', capacity_mw: 200, capacity_factor: 0.35, location: 'Houston' },
        { id: 'nuclear-1', name: 'Nuclear', type: 'Nuclear', capacity_mw: 100, capacity_factor: 0.95, location: 'Houston' },
    ];

    // PATH 1: Main Dashboard approach (scaled prices with loaded average)
    console.log('\n  🔵 Path 1: Dashboard (scaled with loaded avg)');
    const dashboardFinancials: FinancialParams = {
        solar_price: 30,
        wind_price: 30,
        geo_price: 40,
        nuc_price: 40,
        ccs_price: 35,
        rec_price: 5,
        market_price_avg: avgPrice, // Full precision average
        market_year: year,
        use_actual_prices: false, // Uses scaling
    };

    const dashboardResult = runAggregationSimulation(
        participants,
        activeAssets,
        dashboardFinancials,
        historicalPrices,
        { mw: 100, hours: 4 },
        {},
        {}
    );

    // PATH 2: Multi-Year Analysis approach (actual prices, no scaling)
    console.log('  🟢 Path 2: Multi-Year (actual prices, no scaling)');
    const multiYearFinancials: FinancialParams = {
        solar_price: 30,
        wind_price: 30,
        geo_price: 40,
        nuc_price: 40,
        ccs_price: 35,
        rec_price: 5,
        market_price_avg: avgPrice, // Same average, but won't be used for scaling
        market_year: year,
        use_actual_prices: true, // Bypasses scaling
    };

    const multiYearResult = runAggregationSimulation(
        participants,
        activeAssets,
        multiYearFinancials,
        historicalPrices,
        { mw: 100, hours: 4 },
        {},
        {}
    );

    // Compare results
    console.log('\n  📈 Key Metrics Comparison:');
    console.log('  ' + '─'.repeat(58));

    const metrics = [
        { name: 'Total Gen Revenue', key: 'total_gen_revenue' as const },
        { name: 'Market Purchase Cost', key: 'market_purchase_cost' as const },
        { name: 'Net Cost', key: 'total_cost_net' as const },
        { name: 'Avg Cost ($/MWh)', key: 'avg_cost_per_mwh' as const },
        { name: 'CFE Score', key: 'cfe_score' as const },
    ];

    let allMatch = true;
    for (const metric of metrics) {
        const val1 = dashboardResult[metric.key];
        const val2 = multiYearResult[metric.key];
        const diff = Math.abs(val1 - val2);
        const match = diff < 0.01; // Tolerance of 1 cent

        if (!match) allMatch = false;

        const status = match ? '✅' : '❌';
        console.log(`  ${status} ${metric.name}:`);
        console.log(`      Dashboard:   ${val1.toFixed(2)}`);
        console.log(`      Multi-Year:  ${val2.toFixed(2)}`);
        if (!match) {
            console.log(`      Difference:  ${diff.toFixed(2)}`);
        }
    }

    console.log('\n  ' + '─'.repeat(58));
    if (allMatch) {
        console.log(`  ✅ All metrics match for ${year}!`);
    } else {
        console.log(`  ❌ Discrepancies found for ${year}`);
    }

    return allMatch;
}

async function main() {
    console.log('🔍 Financial Consistency Verification Script');
    console.log('='.repeat(60));
    console.log('This script verifies that calculations match between:');
    console.log('  • Main Dashboard (scaled prices with loaded average)');
    console.log('  • Multi-Year Analysis (actual historical prices)');
    console.log('='.repeat(60));

    const results: { year: number; passed: boolean }[] = [];

    for (const year of YEARS_TO_TEST) {
        try {
            const passed = await verifyYear(year);
            results.push({ year, passed: passed ?? false });
        } catch (error) {
            console.error(`\n  ❌ Error verifying ${year}:`, error);
            results.push({ year, passed: false });
        }
    }

    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));

    const passed = results.filter((r) => r.passed).length;
    const total = results.length;

    results.forEach((r) => {
        const status = r.passed ? '✅' : '❌';
        console.log(`  ${status} ${r.year}`);
    });

    console.log('\n' + '─'.repeat(60));
    console.log(`  Result: ${passed}/${total} years verified successfully`);
    console.log('='.repeat(60));

    if (passed === total) {
        console.log('\n✅ All calculations are consistent!');
        process.exit(0);
    } else {
        console.log('\n❌ Some calculations do not match. Review the differences above.');
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
