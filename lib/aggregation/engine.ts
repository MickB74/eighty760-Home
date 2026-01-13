import { Participant, TechCapacity, SimulationResult, FinancialParams, GenerationAsset } from './types';

// Constants
const HOURS = 8760;

// Scarcity Pricing Constants
const WINTER_MONTHS = [0, 1, 11]; // January, February, December
const WINTER_PEAK_HOURS = [18, 19, 20]; // Evening peak
const WINTER_SHOULDER_HOURS = [6, 7, 8]; // Morning hours
const EVENING_PEAK_HOURS = [17, 18, 19, 20, 21];
const SHOULDER_HOURS = [7, 8, 9, 15, 16];
const SUMMER_LOW_MONTHS_START = 5; // June
const SUMMER_LOW_MONTHS_END = 8; // September
const SUMMER_LOW_HOURS_START = 10;
const SUMMER_LOW_HOURS_END = 14;

// Scarcity multipliers
const SCARCITY_MULT_CRITICAL = 2.0; // Winter peak (Cat 6)
const SCARCITY_MULT_HIGH = 1.4; // Winter shoulder (Cat 5)
const SCARCITY_MULT_ELEVATED = 1.2; // Evening peak (Cat 4)
const SCARCITY_MULT_NORMAL = 1.0; // Standard (Cat 3)
const SCARCITY_MULT_LOW = 0.45; // Summer solar surplus (Cat 1)

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

    if (type === 'Data Center') {
        // High Load Factor (~95%), slight diurnal thermal load (cooling)
        let total_unscaled = 0;
        for (let h = 0; h < HOURS; h++) {
            const hour = h % 24;
            // Cooling load peaks in afternoon (14-17)
            const cooling = 0.05 * Math.sin(Math.PI * (hour - 10) / 12);
            // Base noise
            const noise = rng.normal(0, 0.01);

            // Base IT load (constant) + Variability
            profile[h] = Math.max(0.1, 1.0 + (cooling > 0 ? cooling : 0) + noise);
            total_unscaled += profile[h];
        }
        const scaler = annual_mwh / total_unscaled;
        return profile.map(v => v * scaler);
    }

    if (type === 'Manufacturing') {
        // 24/7 Operation but with weekend dips ( ~90% LF)
        let total_unscaled = 0;
        for (let h = 0; h < HOURS; h++) {
            const day = Math.floor(h / 24) % 7; // 0=Sun, 1=Mon, ..., 6=Sat
            const isWeekend = (day === 0 || day === 6);

            // Weekdays: 1.0, Weekends: 0.8
            const dayFactor = isWeekend ? 0.85 : 1.0;

            // Minor shift changes / noise
            const noise = rng.normal(0, 0.05);

            profile[h] = Math.max(0, dayFactor + noise);
            total_unscaled += profile[h];
        }
        const scaler = annual_mwh / total_unscaled;
        return profile.map(v => v * scaler);
    }

    if (type === 'Office') {
        // Typical Commercial (Weekdays 8-6 high, Night low, Weekends low)
        let total_unscaled = 0;
        for (let h = 0; h < HOURS; h++) {
            const hour = h % 24;
            const day = Math.floor(h / 24) % 7; // 0=Sun ... 6=Sat
            const isWeekend = (day === 0 || day === 6);

            let shape = 0.2; // Base plug load / security / emergency lighting

            if (!isWeekend) {
                // Workday Ramp Up/Down
                if (hour >= 6 && hour < 8) shape = 0.4 + (hour - 6) * 0.2; // Ramp up
                else if (hour >= 8 && hour < 18) shape = 0.9 + rng.normal(0, 0.05); // Work hours high
                else if (hour >= 18 && hour < 20) shape = 0.9 - (hour - 18) * 0.3; // Ramp down
                else shape = 0.2; // Night
            } else {
                // Weekend (Low activity)
                if (hour >= 9 && hour < 17) shape = 0.3 + rng.normal(0, 0.02); // Minimal usage
                else shape = 0.2;
            }

            profile[h] = Math.max(0.1, shape);
            total_unscaled += profile[h];
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
    if (historicalPrices && historicalPrices.length >= HOURS) {
        const rawPrices = historicalPrices.slice(0, HOURS);
        // Scale to match the target average price
        const currentSum = rawPrices.reduce((a, b) => a + b, 0);
        const currentAvg = currentSum / HOURS;

        // Avoid division by zero if for some reason the profile is all zeros
        if (currentAvg > 0.0001 && !financials.use_actual_prices) {
            const scaler = financials.market_price_avg / currentAvg;
            prices = rawPrices.map(p => p * scaler);
        } else {
            prices = rawPrices;
        }
    } else {
        prices = generatePriceProfile(financials.market_price_avg);
    }

    // PPA Prices Map
    const ppaPrices: Record<string, number> = {
        'Solar': financials.solar_price,
        'Wind': financials.wind_price,
        'Geothermal': financials.geo_price,
        'Nuclear': financials.nuc_price,
        'CCS Gas': financials.ccs_price
    };

    // Calculate Asset Metrics (Revenue, Cost, Settlement)
    const asset_details = [];
    let total_market_revenue = 0;
    let total_ppa_cost = 0;

    for (const asset of activeAssets) {
        // Reconstruct profile (must match the one used for gen totals)
        // Optimization: Could store these during the first loop, but re-generating is cleaner for now.
        let profile = zeros();
        if (genProfiles && genProfiles[asset.id] && genProfiles[asset.id].length >= HOURS) {
            profile = genProfiles[asset.id].slice(0, HOURS).map(v => v * asset.capacity_mw);
        } else {
            profile = generateGenProfile(asset.capacity_mw, asset.type, asset.capacity_factor);
        }

        const total_gen_mwh = profile.reduce((a, b) => a + b, 0);
        const ppa_price = ppaPrices[asset.type] || 0;
        const total_cost = total_gen_mwh * ppa_price;

        // Calculate Revenue using specific hub prices
        let asset_revenue = 0;
        // Determine price vector
        let assetPrices = prices; // Default to Load Hub (already scaled if needed)

        // Use specific Hub Prices if available
        // Relax check to >= HOURS to support Leap Years (8784)
        if (asset.location && hubPricesMap[asset.location] && hubPricesMap[asset.location].length >= HOURS) {
            // Check if we need to scale these raw hub prices
            // Logic: If 'prices' is scaled from historicalPrices, we should scale hub prices similarly
            // to preserve the basis spread relative to the 'target_avg'.
            // However, simply using the raw hub prices assumes they are consistent with the "Market Year".

            // If historicalPrices is present, 'prices' is (historicalPrices * scaler).
            // We should apply the same scaler to the hub prices.
            if (historicalPrices && historicalPrices.length >= HOURS && !financials.use_actual_prices) {
                const currentSum = historicalPrices.slice(0, HOURS).reduce((a, b) => a + b, 0);
                const currentAvg = currentSum / HOURS;
                // Avoid div by zero
                if (currentAvg > 0.0001) {
                    const scaler = financials.market_price_avg / currentAvg;
                    // Use the RAW hub prices multiplied by scaler
                    // We can't mutate the array, so we access index * scaler
                    assetPrices = hubPricesMap[asset.location];
                    // Note: We'll apply the scaler inside the loop below
                    for (let i = 0; i < HOURS; i++) {
                        asset_revenue += profile[i] * (assetPrices[i] * scaler);
                    }
                } else {
                    // Fallback to unscaled
                    assetPrices = hubPricesMap[asset.location];
                    for (let i = 0; i < HOURS; i++) {
                        asset_revenue += profile[i] * assetPrices[i];
                    }
                }
            } else {
                // use_actual_prices is true OR synthetic mode: use raw hub prices without scaling
                // Or if we do have hub prices (loaded for 'Average'?), use them directly.
                // For now, if we have them, use them.
                assetPrices = hubPricesMap[asset.location];
                for (let i = 0; i < HOURS; i++) {
                    asset_revenue += profile[i] * assetPrices[i];
                }
            }
        } else {
            // No specific hub prices, use global 'prices' vector
            for (let i = 0; i < HOURS; i++) {
                asset_revenue += profile[i] * assetPrices[i];
            }
        }

        const settlement_value = asset_revenue - total_cost;

        asset_details.push({
            id: asset.id,
            name: asset.name,
            type: asset.type,
            location: asset.location || 'N/A',
            capacity_mw: asset.capacity_mw,
            total_gen_mwh,
            total_revenue: asset_revenue,
            total_cost,
            settlement_value
        });

        total_market_revenue += asset_revenue;
        total_ppa_cost += total_cost;
    }

    let rec_cost_total = 0;
    let rec_income_total = 0;
    let market_purchase_cost = 0;
    let market_surplus_revenue = 0;
    const rec_price_profile = zeros();
    for (let i = 0; i < HOURS; i++) {
        // Scarcity Logic for REC Price
        let currentRecPrice = financials.rec_price;
        if (financials.use_scarcity) {
            const hourOfDay = i % 24;
            const month = Math.floor(i / 730); // Approx month (8760/12 = 730)

            let mult = SCARCITY_MULT_NORMAL;

            // Winter Critical Hours
            if (WINTER_MONTHS.includes(month)) {
                if (WINTER_PEAK_HOURS.includes(hourOfDay)) {
                    mult = SCARCITY_MULT_CRITICAL;
                } else if (WINTER_SHOULDER_HOURS.includes(hourOfDay)) {
                    mult = SCARCITY_MULT_HIGH;
                }
            }

            // Default categorization if not already set by winter logic
            if (mult === SCARCITY_MULT_NORMAL) {
                if (EVENING_PEAK_HOURS.includes(hourOfDay)) {
                    mult = SCARCITY_MULT_ELEVATED;
                } else if (SHOULDER_HOURS.includes(hourOfDay)) {
                    mult = SCARCITY_MULT_NORMAL;
                } else if (month >= SUMMER_LOW_MONTHS_START &&
                    month <= SUMMER_LOW_MONTHS_END &&
                    hourOfDay >= SUMMER_LOW_HOURS_START &&
                    hourOfDay <= SUMMER_LOW_HOURS_END) {
                    mult = SCARCITY_MULT_LOW;
                }
            }

            // Apply intensity scaler
            const intensity = financials.scarcity_intensity ?? 0;
            const finalMult = Math.max(0, 1.0 + (mult - 1.0) * intensity);
            currentRecPrice = financials.rec_price * finalMult;
        }

        market_purchase_cost += final_deficit[i] * prices[i];
        market_surplus_revenue += final_surplus[i] * prices[i];

        // REC Logic
        rec_cost_total += final_deficit[i] * currentRecPrice;
        rec_income_total += final_surplus[i] * currentRecPrice;

        rec_price_profile[i] = currentRecPrice;
    }

    // New: Calculate Gross Load Bill (Physical Load * Load Price)
    // This is the baseline cost before any PPA hedging.
    let gross_load_cost = 0;
    for (let i = 0; i < HOURS; i++) {
        gross_load_cost += total_load_profile[i] * prices[i];
    }

    const rec_cost = rec_cost_total;
    const rec_income = rec_income_total;

    // Net Cost Calculation for Virtual PPA:
    // Net Cost = Gross Load Bill - PPA Settlement + REC Net Cost
    const settlement_value = total_market_revenue - total_ppa_cost;
    const total_cost_net = gross_load_cost - settlement_value + rec_cost - rec_income;

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
        rec_price_profile,

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
        market_purchase_cost: gross_load_cost, // Return Gross Load Cost for display
        total_gen_revenue: total_market_revenue,

        tech_details: {
            'Solar': { matched_mwh: 0, total_mwh: 0, total_cost: 0, market_value: 0, settlement: 0 },
        },
        asset_details: asset_details
    };
}
