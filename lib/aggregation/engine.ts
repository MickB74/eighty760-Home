import { Participant, TechCapacity, SimulationResult, FinancialParams } from './types';

// Constants
const HOURS = 8760;

/**
 * Generates an array of 8760 zeros
 */
function zeros(len: number = HOURS): number[] {
    return new Array(len).fill(0);
}

/**
 * Deterministic Random Number Generator (simple LCG)
 * We need this to ensure the same seed produces the same "random" profile every time
 */
class SeededRNG {
    private seed: number;
    constructor(seed: number) {
        this.seed = seed;
    }

    // Returns float between 0 and 1
    random(): number {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    // Returns normal distribution (approx)
    normal(mean: number, std: number): number {
        const u = 1 - this.random();
        const v = 1 - this.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return mean + z * std;
    }
}

/**
 * Generate Dummy Load Profile
 * Ported from utils.py: generate_dummy_load_profile
 */
export function generateLoadProfile(annual_mwh: number, type: string): number[] {
    const profile = zeros();
    const seedMap: Record<string, number> = { 'Flat': 42, 'Data Center': 101, 'Office': 202, 'Manufacturing': 303 };
    const rng = new SeededRNG(seedMap[type] || 999);

    const avg_load = annual_mwh / HOURS;

    if (type === 'Flat') {
        return new Array(HOURS).fill(avg_load);
    }

    if (type === 'Data Center' || type === 'Manufacturing') {
        // Flat with minor noise
        const noiseLevel = type === 'Data Center' ? 0.05 : 0.10;
        for (let i = 0; i < HOURS; i++) {
            const noise = rng.normal(0, noiseLevel * avg_load);
            profile[i] = Math.max(0, avg_load + noise);
        }
        return profile;
    }

    if (type === 'Office') {
        // Day (8am-6pm) high, Night low
        let total_unscaled = 0;
        for (let i = 0; i < HOURS; i++) {
            const hour = i % 24;
            const isDay = hour >= 8 && hour <= 18;
            profile[i] = isDay ? 1.5 : 0.5;
            total_unscaled += profile[i];
        }
        const scaler = annual_mwh / total_unscaled;
        return profile.map(v => v * scaler);
    }

    // Default to flat
    return new Array(HOURS).fill(avg_load);
}

/**
 * Generate Dummy Generation Profile
 * Ported from utils.py: generate_dummy_generation_profile for Solar/Wind/etc
 */
export function generateGenProfile(capacity_mw: number, type: string): number[] {
    if (capacity_mw <= 0) return zeros();

    const profile = zeros();
    const seedMap: Record<string, number> = { 'Solar': 500, 'Wind': 600, 'Geothermal': 700, 'Nuclear': 800, 'CCS Gas': 900 };
    const rng = new SeededRNG(seedMap[type] || 999);

    for (let h = 0; h < HOURS; h++) {
        const hour = h % 24;
        const day = Math.floor(h / 24); // 0-364

        if (type === 'Solar') {
            const isDay = hour >= 6 && hour <= 19;
            if (isDay) {
                let dayShape = Math.sin(Math.PI * (hour - 6) / 13);
                if (dayShape < 0) dayShape = 0;

                // Seasonal: Peak Summer (Day 172)
                const seasonal = 0.7 + 0.3 * Math.cos(2 * Math.PI * (day - 172) / 365);
                const noise = 0.7 + (rng.random() * 0.3); // 0.7 to 1.0

                profile[h] = dayShape * seasonal * noise * capacity_mw;
            } else {
                profile[h] = 0;
            }

        } else if (type === 'Wind') {
            // Diurnal: Peak Night/Early Morning
            const hourArg = 2 * Math.PI * ((hour - 2) / 24);
            const diurnal = 0.6 + 0.25 * Math.cos(hourArg);

            // Seasonal: Peak Spring/Fall
            const seasonal = 0.7 + 0.3 * Math.sin(2 * Math.PI * (day - 50) / 365 * 2);

            const noise = rng.normal(0, 0.15);
            let raw = diurnal * seasonal + noise;
            raw = Math.max(0, Math.min(1, raw)); // Clip 0-1

            profile[h] = raw * capacity_mw;

        } else if (type === 'Geothermal' || type === 'CCS Gas' || type === 'Nuclear') {
            // Baseload
            const noiseMag = type === 'Geothermal' ? 0.01 : 0.005;
            const noise = rng.normal(0, noiseMag * capacity_mw);
            profile[h] = Math.max(0, Math.min(capacity_mw, capacity_mw + noise));
            if (type === 'Nuclear') profile[h] = capacity_mw; // Nuclear is strictly flat here
        }
    }
    return profile;
}

/**
 * Generate Synthetic Market Prices (Duck Curve)
 * Ported from utils.py: get_market_price_profile_v2 (synthetic path)
 */
export function generatePriceProfile(avg_price: number): number[] {
    const profile = zeros();
    const rng = new SeededRNG(123); // Fixed seed for prices

    for (let h = 0; h < HOURS; h++) {
        const hour = h % 24;
        const day = Math.floor(h / 24);

        // Base Diurnal: Peak Evening, Low Midday
        let diurnal = 1.0 + 0.4 * Math.sin(2 * Math.PI * (hour - 14) / 24);

        if (hour >= 16 && hour <= 21) diurnal += 0.5; // Evening peak adder
        if (hour >= 10 && hour <= 15) diurnal -= 0.3; // Solar cannibalization

        // Seasonal: Summer high
        const seasonal = 1.0 + 0.2 * Math.cos(2 * Math.PI * (day - 172) / 365);

        const noise = rng.normal(0, 0.1);

        profile[h] = diurnal * seasonal + noise;
        if (profile[h] < 0) profile[h] = 0;
    }

    // Normalize to target average
    const currentSum = profile.reduce((a, b) => a + b, 0);
    const currentAvg = currentSum / HOURS;
    const scaler = avg_price / currentAvg;

    return profile.map(p => p * scaler);
}

/**
 * Simulate Battery Storage
 * Ported from utils.py: simulate_battery_storage
 */
export function simulateBattery(
    surplus: number[],
    deficit: number[],
    capacity_mw: number,
    duration_hours: number
) {
    const discharge = zeros();
    const charge = zeros();
    const soc = zeros();

    const max_energy = capacity_mw * duration_hours;
    let current_energy = max_energy * 0.5; // Start 50%

    const rte = 0.85;
    const charge_eff = Math.sqrt(rte);
    const discharge_eff = Math.sqrt(rte);

    for (let h = 0; h < HOURS; h++) {
        const s = surplus[h];
        const d = deficit[h];

        if (s > 0 && current_energy < max_energy) {
            // Charge
            const max_charge_power = capacity_mw;
            const power_in = Math.min(s, max_charge_power);

            const energy_added = power_in * charge_eff;
            const space = max_energy - current_energy;

            const real_energy_added = Math.min(energy_added, space);
            const real_power_in = real_energy_added / charge_eff;

            charge[h] = real_power_in;
            current_energy += real_energy_added;

        } else if (d > 0 && current_energy > 0) {
            // Discharge
            const needed = d;
            const max_out_power = Math.min(capacity_mw, current_energy / discharge_eff);

            const real_out = Math.min(needed, max_out_power);
            discharge[h] = real_out;

            const energy_removed = real_out / discharge_eff;
            current_energy -= energy_removed;
        }

        soc[h] = current_energy;
    }

    return { discharge, charge, soc };
}

/**
 * Main Simulation Runner
 */
export function runAggregationSimulation(
    participants: Participant[],
    capacities: TechCapacity,
    financials: FinancialParams
): SimulationResult {

    // 1. Build Aggregate Load
    const total_load_profile = zeros();
    for (const p of participants) {
        const p_profile = generateLoadProfile(p.load_mwh, p.type);
        for (let i = 0; i < HOURS; i++) total_load_profile[i] += p_profile[i];
    }

    const total_load_mwh = total_load_profile.reduce((a, b) => a + b, 0);

    // 2. Build Gen Profiles
    const solar = generateGenProfile(capacities.Solar, 'Solar');
    const wind = generateGenProfile(capacities.Wind, 'Wind');
    const geo = generateGenProfile(capacities.Geothermal, 'Geothermal');
    const nuc = generateGenProfile(capacities.Nuclear, 'Nuclear');
    const ccs = generateGenProfile(capacities['CCS Gas'], 'CCS Gas');

    const total_gen_profile = zeros();
    for (let i = 0; i < HOURS; i++) {
        total_gen_profile[i] = solar[i] + wind[i] + geo[i] + nuc[i] + ccs[i];
    }

    // 3. Battery Dispatch
    const surplus_profile = zeros();
    const deficit_profile_initial = zeros();

    for (let i = 0; i < HOURS; i++) {
        if (total_gen_profile[i] > total_load_profile[i]) {
            surplus_profile[i] = total_gen_profile[i] - total_load_profile[i];
        } else {
            deficit_profile_initial[i] = total_load_profile[i] - total_gen_profile[i];
        }
    }

    const batt = simulateBattery(surplus_profile, deficit_profile_initial, capacities.Battery_MW, capacities.Battery_Hours);

    // 4. Final Matching and Metrics
    const matched_profile = zeros();
    const final_deficit = zeros();
    const final_surplus = zeros(); // Post-battery surplus

    let total_matched = 0;
    let green_hours_lost = 0;

    for (let i = 0; i < HOURS; i++) {
        const available_clean = total_gen_profile[i] + batt.discharge[i] - batt.charge[i]; // Net Generation

        // Matched is min(Load, Available)
        // But strictly: Matched = min(Load, Clean_Gen_Used_Directly + Battery_Discharge)
        // Note: Battery Charge comes from Surplus, so it subtracts from Grid Export, fits within Total Gen.

        const used_clean = Math.min(total_load_profile[i], Math.max(0, available_clean));

        matched_profile[i] = used_clean;
        total_matched += used_clean;

        if (total_load_profile[i] > used_clean + 0.001) {
            final_deficit[i] = total_load_profile[i] - used_clean;
            green_hours_lost++;
        }

        if (available_clean > total_load_profile[i]) {
            final_surplus[i] = available_clean - total_load_profile[i];
        }
    }

    const cfe_score = total_load_mwh > 0 ? total_matched / total_load_mwh : 0;
    const total_cap = Object.values(capacities).reduce((a, b) => a + b, 0) - capacities.Battery_Hours; // Dont add hours
    const productivity = total_cap > 0 ? total_matched / total_cap : 0;

    // 5. Financials
    const prices = generatePriceProfile(financials.market_price_avg);

    // PPA Costs
    // Cost = Gen * Price
    const solar_cost = solar.reduce((sum, mw) => sum + mw, 0) * financials.solar_price;
    const wind_cost = wind.reduce((sum, mw) => sum + mw, 0) * financials.wind_price;
    const geo_cost = geo.reduce((sum, mw) => sum + mw, 0) * financials.geo_price;
    const nuc_cost = nuc.reduce((sum, mw) => sum + mw, 0) * financials.nuc_price;
    const ccs_cost = ccs.reduce((sum, mw) => sum + mw, 0) * financials.ccs_price;

    const total_ppa_cost = solar_cost + wind_cost + geo_cost + nuc_cost + ccs_cost;

    // Market Revenue (Capture) from ALL Gen (calculated hourly)
    let total_market_revenue = 0;
    for (let i = 0; i < HOURS; i++) {
        // Sum of all gen * price[i]
        const gen = solar[i] + wind[i] + geo[i] + nuc[i] + ccs[i];
        total_market_revenue += gen * prices[i];
    }

    const settlement_value = total_market_revenue - total_ppa_cost;
    const rec_cost = total_matched * financials.rec_price;

    // Net Cost to Load = (Deficit * Price) + PPA_Cost + REC - Market_Rev_Surplus
    // Simplified: Net Cost = (Load * Price) - Settlement + REC
    // Why? If perfectly matched: Load*Price (avoided) - PPA Cost.
    // Wait, simpler: Net Cost = (Market Purchases for Deficit) + (PPA Contracts) - (Revenue from Surplus Sales)
    // Market Purchases = Deficit * Price
    // Revenue Surplus = Surplus * Price
    // PPA Contracts = Fixed PPA payments

    let market_purchase_cost = 0;
    let market_surplus_revenue = 0;

    for (let i = 0; i < HOURS; i++) {
        market_purchase_cost += final_deficit[i] * prices[i];
        market_surplus_revenue += final_surplus[i] * prices[i];
    }

    const total_cost_net = market_purchase_cost + total_ppa_cost - market_surplus_revenue + rec_cost;

    return {
        load_profile: total_load_profile,
        net_load_profile: final_deficit,
        matched_profile,
        deficit_profile: final_deficit,
        surplus_profile: final_surplus,
        battery_discharge: batt.discharge,
        battery_charge: batt.charge,
        battery_soc: batt.soc,
        market_price_profile: prices,

        total_load_mwh,
        total_gen_mwh: total_gen_profile.reduce((a, b) => a + b, 0),
        total_matched_mwh: total_matched,
        cfe_score,
        productivity,
        logh: green_hours_lost / HOURS,

        settlement_value,
        rec_cost,
        total_cost_net,
        avg_cost_per_mwh: total_load_mwh > 0 ? total_cost_net / total_load_mwh : 0,
        weighted_ppa_price: total_matched > 0 ? total_ppa_cost / total_matched : 0,

        tech_details: {
            'Solar': { matched_mwh: 0, total_mwh: 0, total_cost: solar_cost, market_value: 0, settlement: 0 }, // Simplified for now
            // ... populate others if needed for charts
        }
    };
}
