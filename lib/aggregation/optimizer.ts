import { generateGenProfile, generateLoadProfile, simulateBattery } from './engine';
import { TechCapacity } from './types';

// Constants
const HOURS = 8760;

/**
 * Recommend Portfolio
 * Ported from utils.py: recommend_portfolio
 * Heuristic loop to size generation to meet Target CFE
 */
export function recommendPortfolio(
    annual_load_mwh: number,
    load_profile_type: string,
    target_cfe: number = 0.95,
    existing_capacities: Partial<TechCapacity> = {}
): TechCapacity {

    // 1. Generate Load Profile (Temporary for optimization)
    const load_profile = generateLoadProfile(annual_load_mwh, load_profile_type);
    const avg_load = annual_load_mwh / HOURS;
    const peak_load = Math.max(...load_profile);

    // Initial Recommendation
    const rec: TechCapacity = {
        Solar: existing_capacities.Solar || 0,
        Wind: existing_capacities.Wind || 0,
        Geothermal: 0, // Exclude Geothermal from Smart Fill as per request
        Nuclear: existing_capacities.Nuclear || 0,
        'CCS Gas': existing_capacities['CCS Gas'] || 0,
        Battery_MW: existing_capacities.Battery_MW || 0,
        Battery_Hours: existing_capacities.Battery_Hours || 2
    };

    // Heuristic: If empty, start with some defaults
    const total_existing_mw = rec.Solar + rec.Wind + rec.Geothermal + rec.Nuclear + rec['CCS Gas'];

    // 1. Baseload Coverage (80% of Avg Load)
    if (total_existing_mw === 0) {
        rec['CCS Gas'] = avg_load * 0.8;
    }

    // 2. VRE Coverage (Remaining Load * 2.0 Oversizing)
    const firm_gen_annual = (rec.Geothermal + rec.Nuclear + rec['CCS Gas']) * HOURS;
    const remaining_load = Math.max(0, annual_load_mwh - firm_gen_annual);

    if (remaining_load > 0 && rec.Solar === 0 && rec.Wind === 0) {
        // Split Solar/Wind
        const target_vre_gen = remaining_load * 2.0;
        // Capacity = Gen / (8760 * CF)
        // Solar CF ~0.25, Wind CF ~0.40
        rec.Solar = (target_vre_gen / 2) / (HOURS * 0.25);
        rec.Wind = (target_vre_gen / 2) / (HOURS * 0.40);
    }

    // 3. Battery
    if (rec.Battery_MW === 0) {
        rec.Battery_MW = peak_load * 0.4;
    }

    // Optimization Loop
    // To keep it fast in JS, we run fewer iterations than Python or simplify
    for (let i = 0; i < 20; i++) {
        // Generate profiles
        // We really should cache unit profiles for speed, but JS is fast
        const solar = generateGenProfile(rec.Solar, 'Solar');
        const wind = generateGenProfile(rec.Wind, 'Wind');
        const geo = generateGenProfile(rec.Geothermal, 'Geothermal');
        const nuc = generateGenProfile(rec.Nuclear, 'Nuclear');
        const ccs = generateGenProfile(rec['CCS Gas'], 'CCS Gas');

        const total_gen = new Array(HOURS);
        const surplus = new Array(HOURS);
        const deficit = new Array(HOURS);

        for (let h = 0; h < HOURS; h++) {
            total_gen[h] = solar[h] + wind[h] + geo[h] + nuc[h] + ccs[h];
            if (total_gen[h] > load_profile[h]) {
                surplus[h] = total_gen[h] - load_profile[h];
                deficit[h] = 0;
            } else {
                deficit[h] = load_profile[h] - total_gen[h];
                surplus[h] = 0;
            }
        }

        // Sim Battery
        const batt = simulateBattery(surplus, deficit, rec.Battery_MW, rec.Battery_Hours);

        // Calc CFE
        let matched = 0;
        for (let h = 0; h < HOURS; h++) {
            const available = total_gen[h] + batt.discharge[h] - batt.charge[h];
            matched += Math.min(load_profile[h], Math.max(0, available));
        }

        const current_cfe = matched / annual_load_mwh;

        if (current_cfe >= target_cfe - 0.001) break;

        // Scale Up
        const gap = target_cfe - current_cfe;
        let scaler = 1.05;
        if (gap > 0.10) scaler = 1.20;
        else if (gap > 0.05) scaler = 1.10;

        rec.Solar *= scaler;
        rec.Wind *= scaler;
        rec['CCS Gas'] *= scaler;
        rec.Battery_MW *= scaler;

        // Cap Battery at 1.1x Peak
        if (rec.Battery_MW > peak_load * 1.1) rec.Battery_MW = peak_load * 1.1;
    }

    // Round results to 2 decimals
    rec.Solar = Math.round(rec.Solar * 100) / 100;
    rec.Wind = Math.round(rec.Wind * 100) / 100;
    rec.Geothermal = Math.round(rec.Geothermal * 100) / 100;
    rec.Nuclear = Math.round(rec.Nuclear * 100) / 100;
    rec['CCS Gas'] = Math.round(rec['CCS Gas'] * 100) / 100;
    rec.Battery_MW = Math.round(rec.Battery_MW * 100) / 100;

    return rec;
}
