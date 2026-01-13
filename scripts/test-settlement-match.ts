#!/usr/bin/env tsx
/**
 * Diagnostic script to check if settlement_value matches sum of asset settlements
 */

import { runAggregationSimulation } from '../lib/aggregation/engine';
import type { Participant, GenerationAsset, FinancialParams } from '../lib/aggregation/types';

const participants: Participant[] = [
    { id: '1', name: 'Test Load', load_mwh: 274000, type: 'Data Center' }
];

const assets: GenerationAsset[] = [
    { id: 'solar-1', name: 'Solar Gen', type: 'Solar', capacity_mw: 85, location: 'West' },
    { id: 'wind-1', name: 'Wind Gen', type: 'Wind', capacity_mw: 60, location: 'Panhandle' },
    { id: 'ccs-1', name: 'CCS Gas Gen', type: 'CCS Gas', capacity_mw: 15, location: 'Houston' },
];

const financials: FinancialParams = {
    solar_price: 30,
    wind_price: 30,
    geo_price: 40,
    nuc_price: 40,
    ccs_price: 35,
    rec_price: 5,
    market_price_avg: 25,
    market_year: 2024,
    use_actual_prices: false,
};

console.log('🔬 Settlement Value Diagnostic Test\n');
console.log('='.repeat(60));

const result = runAggregationSimulation(
    participants,
    assets,
    financials,
    null,
    { mw: 0, hours: 0 },
    {},
    {}
);

console.log('\n📊 Aggregate Result:');
console.log('─'.repeat(60));
console.log(`Total Market Revenue:    $${result.total_gen_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`Total PPA Cost:          $${result.total_ppa_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`Settlement Value:        $${result.settlement_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`  Formula: total_gen_revenue - total_ppa_cost`);

console.log('\n📋 Individual Asset Details:');
console.log('─'.repeat(60));

let sumRevenue = 0;
let sumCost = 0;
let sumSettlement = 0;

if (result.asset_details) {
    result.asset_details.forEach(asset => {
        console.log(`\n${asset.name} (${asset.type}):`);
        console.log(`  Revenue:     $${asset.total_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
        console.log(`  PPA Cost:    $${asset.total_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
        console.log(`  Settlement:  $${asset.settlement_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

        sumRevenue += asset.total_revenue;
        sumCost += asset.total_cost;
        sumSettlement += asset.settlement_value;
    });
}

console.log('\n🧮 Verification:');
console.log('─'.repeat(60));
console.log(`Sum of Asset Revenues:    $${sumRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`Sum of Asset PPA Costs:   $${sumCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`Sum of Asset Settlements: $${sumSettlement.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

console.log('\n✅ Comparison:');
console.log('─'.repeat(60));

const revenueMatch = Math.abs(sumRevenue - result.total_gen_revenue) < 0.01;
const costMatch = Math.abs(sumCost - result.total_ppa_cost) < 0.01;
const settlementMatch = Math.abs(sumSettlement - result.settlement_value) < 0.01;

console.log(`${revenueMatch ? '✅' : '❌'} Total Revenue Match`);
if (!revenueMatch) {
    console.log(`   Aggregate:  $${result.total_gen_revenue.toFixed(2)}`);
    console.log(`   Sum:        $${sumRevenue.toFixed(2)}`);
    console.log(`   Difference: $${Math.abs(sumRevenue - result.total_gen_revenue).toFixed(2)}`);
}

console.log(`${costMatch ? '✅' : '❌'} Total PPA Cost Match`);
if (!costMatch) {
    console.log(`   Aggregate:  $${result.total_ppa_cost.toFixed(2)}`);
    console.log(`   Sum:        $${sumCost.toFixed(2)}`);
    console.log(`   Difference: $${Math.abs(sumCost - result.total_ppa_cost).toFixed(2)}`);
}

console.log(`${settlementMatch ? '✅' : '❌'} Settlement Value Match`);
if (!settlementMatch) {
    console.log(`   Aggregate:  $${result.settlement_value.toFixed(2)}`);
    console.log(`   Sum:        $${sumSettlement.toFixed(2)}`);
    console.log(`   Difference: $${Math.abs(sumSettlement - result.settlement_value).toFixed(2)}`);
}

console.log('\n' + '='.repeat(60));
if (revenueMatch && costMatch && settlementMatch) {
    console.log('✅ All values match! No discrepancy found.');
    process.exit(0);
} else {
    console.log('❌ Discrepancy detected! Debug required.');
    process.exit(1);
}
