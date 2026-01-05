// Battery CVTA (Capacity, Variable, Tolling Agreement) Financial Calculations

export interface CVTAParams {
    fixed_toll_mw_month: number;      // $/MW-month capacity payment
    guaranteed_rte: number;            // Guaranteed Round-Trip Efficiency (e.g., 0.85)
    vom_charge_mwh: number;            // Variable O&M charge ($/MWh)
    availability_factor: number;       // Availability % (e.g., 0.95)
    ancillary_revenue_monthly?: number; // Fixed monthly ancillary revenue ($)
    ancillary_revenue_pct?: number;    // OR % of energy price as ancillary
}

export interface BatteryCVTAResult {
    // Buyer's P&L (Trading House View)
    buyer: {
        arbitrage_revenue: number;       // Revenue from price arbitrage
        ancillary_revenue: number;       // Revenue from ancillary services
        total_revenue: number;
        fixed_toll_cost: number;         // Fixed toll payment to owner
        charging_cost: number;           // Cost of electricity to charge
        total_cost: number;
        net_pnl: number;                 // Buyer's net P&L
    };

    // Owner's View (Battery Asset Owner)
    owner: {
        capacity_payment: number;        // Fixed capacity payment received
        vom_revenue: number;             // Variable O&M fees
        rte_penalty: number;             // Penalty for performance below guaranteed RTE
        total_revenue: number;
        net_pnl: number;
    };

    // Performance Metrics
    performance: {
        actual_rte: number;              // Actual round-trip efficiency achieved
        total_throughput_mwh: number;    // Total energy cycled through battery
        utilization_rate: number;        // Utilization as % of capacity
    };
}

/**
 * Calculate detailed battery CVTA financials
 */
export function calculateBatteryCVTA(
    battery_mw: number,
    battery_hours: number,
    discharge_profile: number[],
    charge_profile: number[],
    market_prices: number[],
    cvta_params: CVTAParams
): BatteryCVTAResult {

    const HOURS = 8760;

    // Calculate actual energy flows
    let total_discharge = 0;
    let total_charge = 0;
    let arbitrage_revenue = 0;
    let charging_cost = 0;

    for (let i = 0; i < HOURS; i++) {
        total_discharge += discharge_profile[i];
        total_charge += charge_profile[i];

        // Revenue from discharging at market price
        arbitrage_revenue += discharge_profile[i] * market_prices[i];

        // Cost of charging at market price
        charging_cost += charge_profile[i] * market_prices[i];
    }

    // Performance metrics
    const actual_rte = total_charge > 0 ? total_discharge / total_charge : 0;
    const total_throughput = total_discharge + total_charge;
    const capacity_mwh = battery_mw * battery_hours;
    const utilization_rate = capacity_mwh > 0 ? total_discharge / (capacity_mwh * 365) : 0;

    // Ancillary revenue calculation
    let ancillary_revenue = 0;
    if (cvta_params.ancillary_revenue_monthly !== undefined) {
        // Fixed monthly model
        ancillary_revenue = cvta_params.ancillary_revenue_monthly * 12;
    } else if (cvta_params.ancillary_revenue_pct !== undefined) {
        // Dynamic % of energy price model
        const avg_price = market_prices.reduce((a, b) => a + b, 0) / market_prices.length;
        ancillary_revenue = total_discharge * avg_price * cvta_params.ancillary_revenue_pct;
    }

    // Fixed toll cost (annual)
    const fixed_toll_cost = battery_mw * cvta_params.fixed_toll_mw_month * 12 * cvta_params.availability_factor;

    // VOM charges
    const vom_revenue = total_discharge * cvta_params.vom_charge_mwh;

    // RTE penalty
    let rte_penalty = 0;
    if (actual_rte < cvta_params.guaranteed_rte && total_discharge > 0) {
        // Penalty proportional to underperformance
        const shortfall = cvta_params.guaranteed_rte - actual_rte;
        rte_penalty = shortfall * total_discharge * 10; // $10/MWh penalty per % shortfall (simplified)
    }

    // Buyer's P&L
    const buyer_total_revenue = arbitrage_revenue + ancillary_revenue;
    const buyer_total_cost = fixed_toll_cost + charging_cost;
    const buyer_net_pnl = buyer_total_revenue - buyer_total_cost;

    // Owner's P&L
    const capacity_payment = fixed_toll_cost; // What buyer pays = what owner receives
    const owner_total_revenue = capacity_payment + vom_revenue;
    const owner_net_pnl = owner_total_revenue - rte_penalty;

    return {
        buyer: {
            arbitrage_revenue,
            ancillary_revenue,
            total_revenue: buyer_total_revenue,
            fixed_toll_cost,
            charging_cost,
            total_cost: buyer_total_cost,
            net_pnl: buyer_net_pnl
        },
        owner: {
            capacity_payment,
            vom_revenue,
            rte_penalty,
            total_revenue: owner_total_revenue,
            net_pnl: owner_net_pnl
        },
        performance: {
            actual_rte,
            total_throughput_mwh: total_throughput,
            utilization_rate
        }
    };
}
