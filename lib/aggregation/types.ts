export interface Participant {
    id: string;
    name: string;
    type: 'Data Center' | 'Manufacturing' | 'Office' | 'Flat';
    load_mwh: number;
}

export interface TechCapacity {
    Solar: number;
    Wind: number;
    Geothermal: number;
    Nuclear: number;
    'CCS Gas': number;
    Battery_MW: number;
    Battery_Hours: number;
}

export interface GenerationAsset {
    id: string;
    name: string;
    type: 'Solar' | 'Wind' | 'Geothermal' | 'Nuclear' | 'CCS Gas';
    location: 'North' | 'South' | 'West' | 'Houston' | 'Panhandle';
    capacity_mw: number;
    capacity_factor?: number; // Optional override to scale profile
}

export interface FinancialParams {
    solar_price: number;
    wind_price: number;
    geo_price: number;
    nuc_price: number;
    ccs_price: number;
    rec_price: number;
    market_price_avg: number;
    market_year: number | 'Average';
    use_scarcity?: boolean;
    scarcity_intensity?: number;
}

export interface BatteryFinancialParams {
    capacity_mw: number;
    base_rate_monthly: number; // $/MW-month
    guaranteed_availability: number; // %
    guaranteed_rte: number; // %
    vom_rate: number; // $/MWh
    ancillary_type: 'Fixed' | 'Dynamic';
    ancillary_input: number; // $ or %
}

export interface SimulationResult {
    // Profiles (8760)
    load_profile: number[];
    net_load_profile: number[];
    matched_profile: number[];
    deficit_profile: number[];
    surplus_profile: number[];
    battery_discharge: number[];
    battery_charge: number[];
    battery_soc: number[];
    market_price_profile: number[];
    rec_price_profile: number[];

    // Individual tech profiles
    solar_profile: number[];
    wind_profile: number[];
    geo_profile: number[];
    nuc_profile: number[];
    ccs_profile: number[];

    // Metrics
    total_load_mwh: number;
    total_gen_mwh: number;
    total_matched_mwh: number;
    cfe_score: number;
    productivity: number; // MWh/MW
    logh: number; // Loss of Green Hours

    // Financials
    settlement_value: number; // Net PPA Settlement
    rec_cost: number;
    rec_income: number;
    total_cost_net: number;
    avg_cost_per_mwh: number;
    weighted_ppa_price: number;
    market_purchase_cost: number;

    // Breakdown
    tech_details: Record<string, {
        matched_mwh: number;
        total_mwh: number;
        total_cost: number;
        market_value: number;
        settlement: number;
    }>;
    asset_details: {
        id: string;
        name: string;
        type: string;
        location: string;
        capacity_mw: number;
        total_gen_mwh: number;
        total_revenue: number; // Market Revenue
        total_cost: number;    // PPA Cost
        settlement_value: number; // Rev - Cost
    }[];
}

export interface AggregationState {
    participants: Participant[];
    assets: GenerationAsset[];
    capacities: TechCapacity; // Kept for backward compat or summary
    financials: FinancialParams;
    battery_financials: BatteryFinancialParams;
}
