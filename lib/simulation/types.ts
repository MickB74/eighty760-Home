export interface BuildingPortfolioItem {
    type: string;
    annual_mwh: number;
}

export interface SimulationResult {
    results: Record<string, number>;
    df: SimulationDataFrame[];
}

export interface SimulationDataFrame {
    timestamp: string; // Date object serialized
    hour: number;
    month: number;
    day_of_year: number;

    // Generation (MW)
    Solar: number;
    Wind: number;
    Nuclear: number;
    Geothermal: number;
    Hydro: number;

    // Generation Scaled (MWh - assuming 1hr intervals)
    Solar_Gen: number;
    Wind_Gen: number;
    Nuclear_Gen: number;
    Geothermal_Gen: number;
    Hydro_Gen: number;

    Total_Renewable_Gen: number;
    Total_Renewable_Gen_With_Battery?: number;
    Effective_Gen: number;

    // Load
    Load: number;
    Load_Actual: number;

    // Battery
    Battery_SOC: number;
    Battery_Charge: number;
    Battery_Discharge: number;

    // Grid
    Net_Load_MWh: number;
    Grid_Consumption: number;
    Overgeneration: number;

    // Metrics
    Hourly_CFE_MWh: number;
    Hourly_CFE_Ratio: number;

    // Economics
    REC_Price_USD: number;
    REC_Cost: number;
    REC_Revenue: number;

    // Emissions
    Emissions_Factor_lb_MWh: number;
    Hourly_Grid_Emissions_lb: number;
    Hourly_Avoided_Emissions_lb: number;
    Hourly_Location_Emissions_lb: number;
}

export interface SimulationInputs {
    year: number;
    building_portfolio: BuildingPortfolioItem[];
    region: string;

    // Capacities (MW)
    solar_capacity: number;
    wind_capacity: number;
    nuclear_capacity: number;
    geothermal_capacity: number;
    hydro_capacity: number;

    // Battery
    battery_capacity_mwh: number;
    battery_efficiency?: number;

    // Economics
    base_rec_price: number;
    use_rec_scaling: boolean;
    scarcity_intensity: number;

    // Emissions Data (optional array of 8760 values)
    hourly_emissions_lb_mwh?: number[];
    emissions_logic?: "hourly" | "egrid";
}
