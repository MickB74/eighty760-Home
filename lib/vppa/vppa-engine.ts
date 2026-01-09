// VPPA Settlement Calculation Engine

export interface VPPAScenario {
    name: string;
    tech: 'Solar' | 'Wind' | 'Nuclear' | 'Geothermal' | 'CCS Gas';
    year: number;
    hub: string;
    capacity_mw: number;
    strike_price: number;
    allow_curtailment?: boolean;
}

export interface MonthlyData {
    month: string;
    month_num: number;
    settlement: number;
    generation_mwh: number;
}

export interface VPPAResult {
    scenario: string;
    year: number;
    hub: string;
    tech: string;
    capacity_mw: number;
    strike_price: number;

    // Financial Metrics
    total_settlement: number;
    total_generation_mwh: number;
    total_curtailed_mwh: number;
    capture_price: number;
    avg_hub_price: number;

    // Time Series Data
    hourly_settlements: number[];
    hourly_generation: number[];
    cumulative_settlements: number[];
    monthly_aggregates: MonthlyData[];
}

/**
 * Calculate VPPA settlement for a single scenario
 * Settlement = (Generation × Market Price) - (Generation × Strike Price)
 */
export function calculateVPPASettlement(
    scenario: VPPAScenario,
    generation_profile: number[],
    market_prices: number[]
): VPPAResult {
    const HOURS = 8760;

    // Validate inputs
    if (generation_profile.length !== HOURS || market_prices.length !== HOURS) {
        throw new Error('Generation profile and market prices must have 8760 hourly values');
    }

    // Initialize arrays
    const hourly_settlements: number[] = [];
    const hourly_generation: number[] = [];
    const cumulative: number[] = [];

    let total_settlement = 0;
    let total_generation = 0;
    let total_curtailed = 0;
    let weighted_price_sum = 0; // For capture price calculation

    // Calculate hourly settlements
    for (let h = 0; h < HOURS; h++) {
        let gen = generation_profile[h];
        const market_price = market_prices[h];
        let curtailed = 0;

        // Optional curtailment at negative prices
        if (scenario.allow_curtailment && market_price < 0) {
            curtailed = gen;
            gen = 0;
        }

        // Settlement = Gen × (Market Price - Strike Price)
        const hourly_revenue = gen * market_price;
        const hourly_cost = gen * scenario.strike_price;
        const settlement = hourly_revenue - hourly_cost;

        hourly_settlements.push(settlement);
        hourly_generation.push(gen);
        cumulative.push(total_settlement + settlement);

        total_settlement += settlement;
        total_generation += gen;
        total_curtailed += curtailed;
        weighted_price_sum += gen * market_price;
    }

    // Calculate metrics
    const capture_price = total_generation > 0 ? weighted_price_sum / total_generation : 0;
    const avg_hub_price = market_prices.reduce((a, b) => a + b, 0) / HOURS;

    // Calculate monthly aggregates
    const monthly_aggregates = calculateMonthlyAggregates(
        hourly_settlements,
        hourly_generation,
        scenario.year
    );

    return {
        scenario: scenario.name,
        year: scenario.year,
        hub: scenario.hub,
        tech: scenario.tech,
        capacity_mw: scenario.capacity_mw,
        strike_price: scenario.strike_price,
        total_settlement,
        total_generation_mwh: total_generation,
        total_curtailed_mwh: total_curtailed,
        capture_price,
        avg_hub_price,
        hourly_settlements,
        hourly_generation,
        cumulative_settlements: cumulative,
        monthly_aggregates
    };
}

/**
 * Calculate monthly aggregates from hourly data
 */
function calculateMonthlyAggregates(
    hourly_settlements: number[],
    hourly_generation: number[],
    year: number
): MonthlyData[] {
    const HOURS_PER_MONTH = [744, 672, 744, 720, 744, 720, 744, 744, 720, 744, 720, 744]; // Approximate
    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Adjust for leap year
    if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
        HOURS_PER_MONTH[1] = 696; // February in leap year
    }

    const monthly: MonthlyData[] = [];
    let hour_offset = 0;

    for (let m = 0; m < 12; m++) {
        const hours_in_month = HOURS_PER_MONTH[m];
        const month_settlements = hourly_settlements.slice(hour_offset, hour_offset + hours_in_month);
        const month_generation = hourly_generation.slice(hour_offset, hour_offset + hours_in_month);

        monthly.push({
            month: MONTH_NAMES[m],
            month_num: m + 1,
            settlement: month_settlements.reduce((a, b) => a + b, 0),
            generation_mwh: month_generation.reduce((a, b) => a + b, 0)
        });

        hour_offset += hours_in_month;
    }

    return monthly;
}

/**
 * Compare multiple VPPA scenarios
 */
export function compareVPPAScenarios(results: VPPAResult[]): {
    best_scenario: string;
    worst_scenario: string;
    spread: number;
} {
    if (results.length === 0) {
        return { best_scenario: '', worst_scenario: '', spread: 0 };
    }

    const settlements = results.map(r => ({ name: r.scenario, value: r.total_settlement }));
    settlements.sort((a, b) => b.value - a.value);

    return {
        best_scenario: settlements[0].name,
        worst_scenario: settlements[settlements.length - 1].name,
        spread: settlements[0].value - settlements[settlements.length - 1].value
    };
}
