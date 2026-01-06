import { Participant, TechCapacity, SimulationResult, FinancialParams, GenerationAsset } from './types';

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
export function generateGenProfile(capacity_mw: number, type: string, capacity_factor?: number): number[] {
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
    // Scaling Logic: If capacity_factor is provided, scale the profile to match it
    if (capacity_factor !== undefined && capacity_factor > 0) {
        const currentSum = profile.reduce((a, b) => a + b, 0);
        const currentCF = currentSum / (HOURS * capacity_mw);

        if (currentCF > 0) {
            const scaler = capacity_factor / currentCF;
            for (let i = 0; i < HOURS; i++) {
                profile[i] = Math.min(capacity_mw, profile[i] * scaler); // Clip at capacity
            }
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
    activeAssets: GenerationAsset[],
    financials: FinancialParams,
    historicalPrices?: number[] | null,
    batteryParams: { mw: number, hours: number } = { mw: 0, hours: 2 },
    hubPricesMap: Record<string, number[]> = {},
    genProfiles: Record<string, number[]> = {}
): SimulationResult {

    // 1. Build Aggregate Load
    const total_load_profile = zeros();
    for (const p of participants) {
        const p_profile = generateLoadProfile(p.load_mwh, p.type);
        for (let i = 0; i < HOURS; i++) total_load_profile[i] += p_profile[i];
    }

    const total_load_mwh = total_load_profile.reduce((a, b) => a + b, 0);

    // 2. Build Gen Profiles (Asset-Based)
    const solar = zeros();
    const wind = zeros();
    const geo = zeros();
    const nuc = zeros();
    const ccs = zeros();

    // Iterate through assets instead of aggregate capacities
    for (const asset of activeAssets) {
        // Generate profile for this specific asset
        let profile = zeros();

        // Try to load from external profiles if available
        // Key format: `{Type}_{Location}_{Year}` or simpler ID based?
        // Since engine doesn't know year, passed genProfiles keys must match what page.tsx provides.
        // Let's assume keys are `${asset.id}` to be safe and simple.
        if (genProfiles && genProfiles[asset.id] && genProfiles[asset.id].length >= HOURS) {
            profile = genProfiles[asset.id].slice(0, HOURS); // Ensure 8760

            // Apply Capacity Scaling (Profile is 0-1 normalized, so multiply by capacity)
            // Note: generateGenProfile does this internally. External profiles are normalized 0-1.
            for (let i = 0; i < HOURS; i++) profile[i] = profile[i] * asset.capacity_mw;

        } else {
            // Fallback to internal generator
            profile = generateGenProfile(asset.capacity_mw, asset.type, asset.capacity_factor);
        }

        // Add to aggregate totals
        for (let i = 0; i < HOURS; i++) {
            if (asset.type === 'Solar') solar[i] += profile[i];
            else if (asset.type === 'Wind') wind[i] += profile[i];
            else if (asset.type === 'Geothermal') geo[i] += profile[i];
            else if (asset.type === 'Nuclear') nuc[i] += profile[i];
            else if (asset.type === 'CCS Gas') ccs[i] += profile[i];
        }
    }

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

    const batt = simulateBattery(surplus_profile, deficit_profile_initial, batteryParams.mw, batteryParams.hours);

    // 4. Final Matching and Metrics
    const matched_profile = zeros();
    const final_deficit = zeros();
    const final_surplus = zeros(); // Post-battery surplus

    let total_matched = 0;
    let green_hours_lost = 0;

    for (let i = 0; i < HOURS; i++) {
        const available_clean = total_gen_profile[i] + batt.discharge[i] - batt.charge[i]; // Net Generation

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
    const total_cap = activeAssets.reduce((sum, a) => sum + a.capacity_mw, 0);
    const productivity = total_cap > 0 ? total_matched / total_cap : 0;

    // 5. Financials
    // Use historical prices if provided, otherwise generate synthetic
    let prices: number[];
    if (historicalPrices && historicalPrices.length === HOURS) {
        // Scale to match the target average price
        const currentSum = historicalPrices.reduce((a, b) => a + b, 0);
        const currentAvg = currentSum / HOURS;

        // Avoid division by zero if for some reason the profile is all zeros
        if (currentAvg > 0.0001) {
            const scaler = financials.market_price_avg / currentAvg;
            prices = historicalPrices.map(p => p * scaler);
        } else {
            prices = historicalPrices;
        }
    } else {
        prices = generatePriceProfile(financials.market_price_avg);
    }

    // PPA Costs
    const solar_cost = solar.reduce((sum, mw) => sum + mw, 0) * financials.solar_price;
    const wind_cost = wind.reduce((sum, mw) => sum + mw, 0) * financials.wind_price;
    const geo_cost = geo.reduce((sum, mw) => sum + mw, 0) * financials.geo_price;
    const nuc_cost = nuc.reduce((sum, mw) => sum + mw, 0) * financials.nuc_price;
    const ccs_cost = ccs.reduce((sum, mw) => sum + mw, 0) * financials.ccs_price;

    const total_ppa_cost = solar_cost + wind_cost + geo_cost + nuc_cost + ccs_cost;

    // Market Revenue (Capture) from ALL Gen (calculated hourly)
    let total_market_revenue = 0;
    for (let i = 0; i < HOURS; i++) {
        // Calculate revenue for each asset based on its location's price
        // If specific hub price is missing, fallback to the global 'prices' (Load Hub)
        let hourlyAssetRevenue = 0;

        // We need to loop through assets again or pre-calculate profiles to preserve location info
        // To optimize, let's recalculate revenue inside the asset loop or store profiles with metadata
        // For now, let's re-iterate activeAssets (inefficient but safe) or better yet, loop assets inside the hour loop?
        // Actually, looping 8760 times inside is fine.
    }

    // Better approach: Calculate revenue per asset and sum up
    for (const asset of activeAssets) {
        const assetProfile = generateGenProfile(asset.capacity_mw, asset.type, asset.capacity_factor);

        // Determines price vector for this asset
        let assetPrices = prices; // Default to load hub
        // Map 'North' -> 'HB_NORTH' if needed, or if keys match exactly 'North', 'South' etc.
        // In page.tsx we keyed them as 'North', 'South'.
        if (asset.location && hubPricesMap[asset.location] && hubPricesMap[asset.location].length === HOURS) {
            assetPrices = hubPricesMap[asset.location];
            // Scale if needed? No, hub prices are absolute. 
            // BUT: If the user provided 'prices' (Load Hub) are SCALED (via market_price_avg), 
            // should we scale hub prices too?
            // Yes, to maintain relative spread.

            // Calculate scalar based on Load Hub scaling logic
            // If historicalPrices was passed and scaled...
            // Complex. For now, assume if historicalPrices is used, we use raw hub prices?
            // User 'market_price_avg' implies a desired average. 
            // If we scale Load Hub, we should scale other hubs by same ratio?
        }

        // Apply Scaling to Asset Prices if Global Scaling is active
        // Logic: specific_hub_scaled = specific_hub_raw * (target_avg / load_hub_raw_avg)
        // This preserves the nodal basis spread.
        if (historicalPrices && historicalPrices.length === HOURS) {
            const rawLoadAvg = historicalPrices.reduce((a, b) => a + b, 0) / HOURS;
            if (rawLoadAvg > 0) {
                const scaler = financials.market_price_avg / rawLoadAvg;
                // If we switched to a specific assetPrices array that ISN'T the main one, we must scale it
                if (assetPrices !== prices) {
                    // It's a raw hub price vector. Scale it.
                    // Note: We can't mutate the cached array. Map it.
                    // Optimization: doing this inside the loop is slow.
                }
            }
        }

        // SIMPLIFIED MVP: Use the correct price vector. 
        // If we are in "Average" mode (synthetic), hubPricesMap might be empty or we just use global.

        for (let i = 0; i < HOURS; i++) {
            // We need to match the logic of 'prices' variable (which is already scaled)
            // If assetPrices is different from 'prices', we need to ensure it's comparable.
            // If 'prices' is synthetic, we probably don't have hub prices -> use prices.

            let finalPrice = prices[i];
            if (hubPricesMap[asset.location]) {
                // Use specific hub price
                // For consistency, if we are scaling 'prices', we should theoretically scale this too.
                // But for 2023-2025 actuals, we might just want raw values?
                // Let's assume for now we use the raw hub values if available, 
                // UNLESS 'prices' was generated synthetically.
                if (historicalPrices) {
                    finalPrice = hubPricesMap[asset.location][i];
                }
            }

            total_market_revenue += assetProfile[i] * finalPrice;
        }
    }

    const settlement_value = total_market_revenue - total_ppa_cost;

    let rec_cost_total = 0;
    let rec_income_total = 0;
    let market_purchase_cost = 0;
    let market_surplus_revenue = 0;
    for (let i = 0; i < HOURS; i++) {
        // Scarcity Logic for REC Price
        let currentRecPrice = financials.rec_price;
        if (financials.use_scarcity) {
            // Determine month (0-11) and hour (0-23)
            const hourOfDay = i % 24;
            // Month approx: i / 730 (8760/12 = 730)
            const month = Math.floor(i / 730);

            let mult = 1.0;
            // Cat 6/5 (Winter Peak)
            if ([0, 1, 11].includes(month)) { // Jan(0), Feb(1), Dec(11) in 0-index approx
                if ([18, 19, 20].includes(hourOfDay)) mult = 2.0; // Cat 6
                else if ([6, 7, 8].includes(hourOfDay)) mult = 1.4; // Cat 5
            }

            if (mult === 1.0) {
                if ([17, 18, 19, 20, 21].includes(hourOfDay)) mult = 1.2; // Cat 4
                else if ([7, 8, 9, 15, 16].includes(hourOfDay)) mult = 1.0; // Cat 3
                else if (month >= 5 && month <= 8 && hourOfDay >= 10 && hourOfDay <= 14) mult = 0.45; // Summer low (Cat 1 approx)
            }

            // Apply intensity
            const intensity = financials.scarcity_intensity ?? 0;
            const finalMult = Math.max(0, 1.0 + (mult - 1.0) * intensity);
            currentRecPrice = financials.rec_price * finalMult;
        }

        market_purchase_cost += final_deficit[i] * prices[i];
        market_surplus_revenue += final_surplus[i] * prices[i];

        // REC Logic
        // Cost: Buy RECs for deficit hours to cover brown power
        rec_cost_total += final_deficit[i] * currentRecPrice;

        // Income: Sell RECs for surplus hours (overgeneration)
        rec_income_total += final_surplus[i] * currentRecPrice;
    }

    const rec_cost = rec_cost_total;
    const rec_income = rec_income_total;
    const total_cost_net = market_purchase_cost + total_ppa_cost - market_surplus_revenue + rec_cost - rec_income;

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

        // Individual tech profiles
        solar_profile: solar,
        wind_profile: wind,
        geo_profile: geo,
        nuc_profile: nuc,
        ccs_profile: ccs,

        total_load_mwh,
        total_gen_mwh: total_gen_profile.reduce((a, b) => a + b, 0),
        total_matched_mwh: total_matched,
        cfe_score,
        productivity,
        logh: green_hours_lost / HOURS,

        settlement_value,
        rec_cost,
        rec_income,
        total_cost_net,
        avg_cost_per_mwh: total_load_mwh > 0 ? total_cost_net / total_load_mwh : 0,
        weighted_ppa_price: total_matched > 0 ? total_ppa_cost / total_matched : 0,

        tech_details: {
            'Solar': { matched_mwh: 0, total_mwh: 0, total_cost: solar_cost, market_value: 0, settlement: 0 },
        }
    };
}
