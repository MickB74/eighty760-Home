import { LOAD_PROFILES, REGIONAL_PARAMS, EGRID_FACTORS } from './constants';
import { SimulationResult, SimulationInputs, SimulationDataFrame } from './types';

// Helper for seeded random (approximating Python's seeding for consistency if needed, 
// but Math.random is sufficient for new simulations)
// Simple LCG if we needed deterministic behavior, but standard is fine for now.
const random = () => Math.random();

// Helper for normal distribution (Box-Muller transform)
function randomNormal(mean: number, stdDev: number): number {
    const u1 = 1 - Math.random();
    const u2 = 1 - Math.random();
    const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
    return mean + stdDev * randStdNormal;
}

function randomBeta(alpha: number, beta: number): number {
    // Approximate Beta using Gamma requires more complex math.
    // Using a simpler approximation for cloud cover since we don't have numpy
    // Cloud cover is 0-1.
    const u = Math.random();
    return Math.pow(u, 1 / alpha); // Very rough approx, sufficient for visual noise
}

function randomWeibull(k: number): number {
    // x = lambda * (-ln(U))^(1/k)
    // Assuming lambda = 1 for standard
    return Math.pow(-Math.log(1 - Math.random()), 1 / k);
}

function generateLoadProfileShape(dayOfYear: number[], hourOfDay: number[], buildingType: string): number[] {
    const baseProfile24h = LOAD_PROFILES[buildingType] || LOAD_PROFILES['Office'];
    const profile = new Float32Array(dayOfYear.length);

    for (let i = 0; i < dayOfYear.length; i++) {
        const h = hourOfDay[i];
        const d = dayOfYear[i];

        // Seasonality
        let seasonality = 1.0;
        if (buildingType === 'Data Center') {
            seasonality = 1.0 + 0.05 * Math.cos((d - 200) * 2 * Math.PI / 365);
        } else if (buildingType === 'Residential') {
            seasonality = 1.0 + 0.4 * Math.cos((d - 200) * 2 * Math.PI / 365);
        } else {
            seasonality = 1.0 + 0.2 * Math.cos((d - 200) * 2 * Math.PI / 365);
        }

        let val = baseProfile24h[h] * seasonality;

        // Random noise (+/- 2%)
        const noise = randomNormal(0, 2);
        val = val + noise;

        profile[i] = Math.max(0, val);
    }

    return Array.from(profile);
}

export function runSimulation(inputs: SimulationInputs): SimulationResult {
    const {
        year, region, building_portfolio,
        solar_capacity, wind_capacity, nuclear_capacity, geothermal_capacity, hydro_capacity,
        battery_capacity_mwh, battery_efficiency = 0.85,
        base_rec_price, use_rec_scaling, scarcity_intensity,
        hourly_emissions_lb_mwh
    } = inputs;

    const params = REGIONAL_PARAMS[region] || REGIONAL_PARAMS["National Average"];
    const egridFactor = EGRID_FACTORS[region] || EGRID_FACTORS["National Average"];

    // Date Generation (8760 hours)
    // 2023 is non-leap year (8760 hours)
    const hours = 8760;
    const startDate = new Date(`${year}-01-01T00:00:00`);

    const timestamps: Date[] = [];
    const dayOfYear: number[] = [];
    const hourOfDay: number[] = [];
    const month: number[] = [];

    for (let i = 0; i < hours; i++) {
        const d = new Date(startDate.getTime() + i * 60 * 60 * 1000);
        timestamps.push(d);

        const start = new Date(d.getFullYear(), 0, 0);
        const diff = d.getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        const day = Math.floor(diff / oneDay);

        dayOfYear.push(day);
        hourOfDay.push(d.getHours());
        month.push(d.getMonth() + 1); // 1-12
    }

    // --- Generation ---

    // Vectors
    const solarGen = new Float32Array(hours);
    const windGen = new Float32Array(hours);
    const nuclearGen = new Float32Array(hours);
    const hydroGen = new Float32Array(hours);
    const geoGen = new Float32Array(hours);
    const load = new Float32Array(hours);

    // Solar
    for (let i = 0; i < hours; i++) {
        const h = hourOfDay[i];
        const d = dayOfYear[i];

        // Seasonality
        const seasonality = 1 + params.solar_seasonality * Math.cos((d - 172) * 2 * Math.PI / 365);

        // Daily Pattern
        let daily = (h < 6 || h > 18) ? 0 : Math.max(0, Math.sin((h - 6) * Math.PI / 12));

        let profile = seasonality * daily * 100;

        // Cloud
        // Approximate Beta(2,5) mean 0.28
        const cloud = Math.pow(Math.random(), 0.5);
        profile = profile * (1 - cloud * params.solar_cloud);

        solarGen[i] = (profile / 100) * solar_capacity; // Normalized 0-100 to capacity
        // Wait, python logic was: profile is roughly 0-100+, max around 140? 
        // "solar_profile = seasonality * daily_pattern * 100"
        // "df['Solar_Gen'] = (df['Solar'] / df['Solar'].max()) * solar_capacity"
        // We can simplify: normalized profile * capacity.
        // Let's just assume profile is roughly 0-1 factor.
        // Python code normalizes by max(). We can approximate.
        // Ideally we run the physics then normalize.

        // Let's replicate python exactly: Store raw profile first 
        solarGen[i] = profile;
    }

    // Normalize Solar
    let maxSolar = 0;
    for (let i = 0; i < hours; i++) if (solarGen[i] > maxSolar) maxSolar = solarGen[i];
    if (maxSolar > 0) {
        for (let i = 0; i < hours; i++) solarGen[i] = (solarGen[i] / maxSolar) * solar_capacity;
    }

    // Wind
    const rawWind = new Float32Array(hours);
    for (let i = 0; i < hours; i++) {
        const h = hourOfDay[i];
        const d = dayOfYear[i];

        const seasonality = 1 + params.wind_seasonality * Math.cos((d - 15) * 2 * Math.PI / 365);
        const daily = 1 + params.wind_daily_amp * Math.cos((h - params.wind_peak_hour) * 2 * Math.PI / 24);
        const noise = randomWeibull(2);

        let profile = seasonality * daily * noise * params.wind_base;
        profile = Math.min(profile, 100);
        rawWind[i] = profile;
    }
    let maxWind = 0;
    for (let i = 0; i < hours; i++) if (rawWind[i] > maxWind) maxWind = rawWind[i];
    if (maxWind > 0) {
        for (let i = 0; i < hours; i++) windGen[i] = (rawWind[i] / maxWind) * wind_capacity;
    }

    // Nuclear (Baseload)
    for (let i = 0; i < hours; i++) {
        nuclearGen[i] = nuclear_capacity > 0 ? nuclear_capacity * 0.92 : 0;
    }

    // Geothermal
    for (let i = 0; i < hours; i++) {
        geoGen[i] = geothermal_capacity * 0.85; // simplified
    }

    // Hydro
    for (let i = 0; i < hours; i++) {
        hydroGen[i] = hydro_capacity * 0.45; // simplified
    }

    // --- Load ---
    for (const building of building_portfolio) {
        const shape = generateLoadProfileShape(dayOfYear, hourOfDay, building.type);
        const shapeSum = shape.reduce((a, b) => a + b, 0);
        if (shapeSum > 0) {
            const scale = building.annual_mwh / shapeSum;
            for (let i = 0; i < hours; i++) {
                load[i] += shape[i] * scale;
            }
        }
    }

    // --- Battery Optimization ---
    const batteryLogic = {
        charge: new Float32Array(hours),
        discharge: new Float32Array(hours),
        soc: new Float32Array(hours),
        adjustedGen: new Float32Array(hours)
    };

    if (battery_capacity_mwh > 0) {
        let currentSOC = 0;
        for (let i = 0; i < hours; i++) {
            const totalGen = solarGen[i] + windGen[i] + nuclearGen[i] + geoGen[i] + hydroGen[i];
            const currentLoad = load[i];
            const surplus = totalGen - currentLoad;

            let charge = 0;
            let discharge = 0;

            if (surplus > 0) {
                // Charge
                const space = battery_capacity_mwh - currentSOC;
                charge = Math.min(surplus, space);
                currentSOC += charge * battery_efficiency;
            } else {
                // Discharge
                const deficit = Math.abs(surplus);
                discharge = Math.min(deficit, currentSOC / battery_efficiency); // Assume discharge loss too? python code: min(deficit, soc/eff) -> soc -= discharge*eff. 
                // Wait, Python code: 
                // discharge_amount = min(deficit, soc / battery_efficiency) 
                // soc -= discharge_amount * battery_efficiency 
                // This means we lose energy on pulling out too? Or is it interpreting efficiency purely on stored energy?
                // Let's stick to Python logic exactly.

                currentSOC -= discharge * battery_efficiency;
            }

            batteryLogic.charge[i] = charge;
            batteryLogic.discharge[i] = discharge;
            batteryLogic.soc[i] = currentSOC;
            batteryLogic.adjustedGen[i] = totalGen + discharge - charge;
        }
    } else {
        // No battery
        for (let i = 0; i < hours; i++) {
            const totalGen = solarGen[i] + windGen[i] + nuclearGen[i] + geoGen[i] + hydroGen[i];
            batteryLogic.adjustedGen[i] = totalGen;
        }
    }

    // --- Financials & Metrics ---
    const results: SimulationDataFrame[] = [];

    let totalLoad = 0;
    let totalEffectiveGen = 0;
    let totalGridEmissions = 0;
    let totalAvoidedEmissions = 0;
    let matchedEnergy = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalGridConsumption = 0; // Restored
    let totalRawGen = 0;
    let totalBatteryDischarge = 0;
    let totalOverGen = 0;
    let countGridHours = 0;

    const lbToMt = 0.000453592;

    for (let i = 0; i < hours; i++) {
        const l = load[i];
        const gen = batteryLogic.adjustedGen[i];
        const totalRenewable = solarGen[i] + windGen[i] + nuclearGen[i] + geoGen[i] + hydroGen[i];

        const effectiveGen = gen; // Battery adjusted

        // Net Load
        const netLoad = l - effectiveGen;
        const gridNeeded = Math.max(0, netLoad);
        const overGen = Math.max(0, effectiveGen - l);
        const cfeMwh = Math.min(effectiveGen, l);

        totalLoad += l;
        totalEffectiveGen += effectiveGen;
        totalGridConsumption += gridNeeded;
        matchedEnergy += cfeMwh;

        // New Metrics Accumulation
        totalRawGen += totalRenewable;
        totalBatteryDischarge += batteryLogic.discharge[i];
        totalOverGen += overGen;
        if (gridNeeded > 0) countGridHours++;

        // Emissions
        let emissionsFactor = egridFactor;
        if (hourly_emissions_lb_mwh && hourly_emissions_lb_mwh[i] !== undefined) {
            emissionsFactor = hourly_emissions_lb_mwh[i];
        }

        const gridEmill = gridNeeded * emissionsFactor;
        const avoidedEmill = effectiveGen * emissionsFactor;
        const locationEmill = l * emissionsFactor;

        totalGridEmissions += gridEmill;
        totalAvoidedEmissions += avoidedEmill;

        // Pricing
        let recPrice = base_rec_price;
        if (use_rec_scaling) {
            // Scarcity Logic
            const m = month[i];
            const h = hourOfDay[i];

            let mult = 1.0;

            if ([12, 1, 2].includes(m)) {
                if ([18, 19, 20].includes(h)) mult = 2.0; // Cat 6
                else if ([6, 7, 8].includes(h)) mult = 1.4; // Cat 5
            }

            // If not set yet...
            if (mult === 1.0) {
                if ([17, 18, 19, 20, 21].includes(h)) mult = 1.2; // Cat 4
                else if ([7, 8, 9, 15, 16].includes(h)) mult = 1.0; // Cat 3
                else if (m >= 3 && m <= 10 && h >= 10 && h <= 14) mult = 0.45; // Cat 1
                else if ([1, 2, 11, 12].includes(m) && h >= 10 && h <= 14) mult = 0.75; // Cat 2
            }

            // Apply intensity
            const finalMult = Math.max(0, 1.0 + (mult - 1.0) * scarcity_intensity);
            recPrice = base_rec_price * finalMult;
        }

        let cost = 0;
        let revenue = 0;

        if (netLoad > 0) {
            cost = -netLoad * recPrice;
        } else {
            revenue = -netLoad * recPrice; // -netLoad is positive surplus
        }

        totalCost += cost;
        totalRevenue += revenue;

        results.push({
            timestamp: timestamps[i].toISOString(),
            hour: hourOfDay[i],
            month: month[i],
            day_of_year: dayOfYear[i],
            Solar: solarGen[i] / (solar_capacity || 1) * 100, // Raw profile relative
            Wind: windGen[i] / (wind_capacity || 1) * 100,
            Nuclear: nuclearGen[i],
            Geothermal: geoGen[i],
            Hydro: hydroGen[i],
            Solar_Gen: solarGen[i],
            Wind_Gen: windGen[i],
            Nuclear_Gen: nuclearGen[i],
            Geothermal_Gen: geoGen[i],
            Hydro_Gen: hydroGen[i],
            Total_Renewable_Gen: totalRenewable,
            Total_Renewable_Gen_With_Battery: gen,
            Effective_Gen: effectiveGen,
            Load: l,
            Load_Actual: l,
            Battery_SOC: batteryLogic.soc[i],
            Battery_Charge: batteryLogic.charge[i],
            Battery_Discharge: batteryLogic.discharge[i],
            Net_Load_MWh: netLoad,
            Grid_Consumption: gridNeeded,
            Overgeneration: overGen,
            Hourly_CFE_MWh: cfeMwh,
            Hourly_CFE_Ratio: l > 0 ? cfeMwh / l : 1,
            REC_Price_USD: recPrice,
            REC_Cost: cost,
            REC_Revenue: revenue,
            Emissions_Factor_lb_MWh: emissionsFactor,
            Hourly_Grid_Emissions_lb: gridEmill,
            Hourly_Avoided_Emissions_lb: avoidedEmill,
            Hourly_Location_Emissions_lb: locationEmill
        });
    }

    // Aggregate Metrics
    const cfeScore = totalLoad > 0 ? (matchedEnergy / totalLoad) * 100 : 0;
    const gridEmissionsMt = totalGridEmissions * lbToMt;
    const avoidedEmissionsMt = totalAvoidedEmissions * lbToMt;
    const netRecCost = totalCost + totalRevenue;

    return {
        results: {
            total_annual_load: totalLoad,
            total_renewable_gen: totalEffectiveGen,
            cfe_percent: cfeScore,
            grid_emissions_mt: gridEmissionsMt,
            avoided_emissions_mt: avoidedEmissionsMt,
            net_rec_cost: netRecCost,
            grid_consumption: totalGridConsumption, // Now this variable exists

            // New Operational Metrics
            total_clean_generation: totalRawGen,
            clean_load_ratio: totalLoad > 0 ? (totalRawGen / totalLoad) * 100 : 0,
            battery_discharge: totalBatteryDischarge,
            mw_match_productivity: (solar_capacity + wind_capacity + nuclear_capacity + geothermal_capacity + hydro_capacity) > 0
                ? totalRawGen / (solar_capacity + wind_capacity + nuclear_capacity + geothermal_capacity + hydro_capacity)
                : 0,
            loss_of_green_hours: (countGridHours / hours) * 100,
            excess_generation: totalOverGen
        },
        df: results
    };
}
