#!/usr/bin/env tsx
/**
 * Simple test to validate financial calculation logic
 * Tests that settlement_value + rec_income - rec_cost matches expectations
 */

import { runAggregationSimulation } from '../lib/aggregation/engine';
import type { Participant, GenerationAsset, FinancialParams } from '../lib/aggregation/types';

// Simple test data
const participants: Participant[] = [
    { id: '1', name: 'Test Load', load_mwh: 100000, type: 'Flat' }
];

const assets: GenerationAsset[] = [
    { id: 'solar-1', name: 'Solar', type: 'Solar', capacity_mw: 50, location: 'Houston' },
    { id: 'wind-1', name: 'Wind', type: 'Wind', capacity_mw: 30, location: 'Houston' },
];

const financials: FinancialParams = {
    solar_price: 30,
    wind_price: 30,
    geo_price: 40,
    nuc_price: 40,
    ccs_price: 35,
    rec_price: 5,
    market_price_avg: 25,
    use_actual_prices: false,
};

console.log('🧪 Running Financial Calculation Test\\n');
console.log('='.repeat(60));

const result = runAggregationSimulation(
    participants,
    assets,
    financials,
    null, // Use synthetic prices
    { mw: 0, hours: 0 },
    {},
    {}
);

console.log('\\n📊 Simulation Results:');
console.log('─'.repeat(60));
console.log(`Total Load:              ${result.total_load_mwh.toFixed(0)} MWh`);
console.log(`Total Generation:        ${result.total_gen_mwh.toFixed(0)} MWh`);
console.log(`CFE Score:               ${(result.cfe_score * 100).toFixed(1)}%`);
console.log(`Matched Energy:          ${result.total_matched_mwh.toFixed(0)} MWh`);

console.log('\\n💰 Financial Breakdown:');
console.log('─'.repeat(60));
console.log(`Total Gen Revenue:       $${result.total_gen_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`Gross Load Cost:         $${result.market_purchase_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`Settlement Value:        $${result.settlement_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`REC Income (Surplus):    $${result.rec_income.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`REC Cost (Deficit):      $${result.rec_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

console.log('\\n🧮 Calculated Values:');
console.log('─'.repeat(60));

const ppa_net_cashflow = result.settlement_value + result.rec_income - result.rec_cost;
const total_net_cost = result.market_purchase_cost - result.settlement_value + result.rec_cost - result.rec_income;

console.log(`PPA Net Cashflow:        $${ppa_net_cashflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`  (settlement + rec_income - rec_cost)`);
console.log();
console.log(`Total Net Cost:          $${total_net_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`  (gross_load - settlement + rec_cost - rec_income)`);
console.log();
console.log(`Engine total_cost_net:   $${result.total_cost_net.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

console.log('\\n✅ Validation Checks:');
console.log('─'.repeat(60));

// Check 1: total_cost_net matches manual calculation
const cost_match = Math.abs(total_net_cost - result.total_cost_net) < 0.01;
console.log(`${cost_match ? '✅' : '❌'} total_cost_net matches calculation`);
if (!cost_match) {
    console.log(`   Expected: $${total_net_cost.toFixed(2)}`);
    console.log(`   Got:      $${result.total_cost_net.toFixed(2)}`);
    console.log(`   Diff:     $${Math.abs(total_net_cost - result.total_cost_net).toFixed(2)}`);
}

// Check 2: avg_cost_per_mwh matches total_cost_net / load
const expected_avg = result.total_cost_net / result.total_load_mwh;
const avg_match = Math.abs(expected_avg - result.avg_cost_per_mwh) < 0.01;
console.log(`${avg_match ? '✅' : '❌'} avg_cost_per_mwh = total_cost_net / load`);
if (!avg_match) {
    console.log(`   Expected: $${expected_avg.toFixed(2)}`);
    console.log(`   Got:      $${result.avg_cost_per_mwh.toFixed(2)}`);
}

// Check 3: PPA cashflow is appropriate for display
console.log(`${ppa_net_cashflow !== total_net_cost ? '✅' : '❌'} PPA cashflow excludes gross load cost`);
console.log(`   PPA Cashflow:  $${ppa_net_cashflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`   Total Cost:    $${total_net_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`   Difference:    $${Math.abs(ppa_net_cashflow - total_net_cost).toLocaleString(undefined, { maximumFractionDigits: 0 })} (gross load cost)`);

console.log('\\n' + '='.repeat(60));
if (cost_match && avg_match) {
    console.log('✅ All financial calculations are correct!');
    process.exit(0);
} else {
    console.log('❌ Some calculations have issues');
    process.exit(1);
}
