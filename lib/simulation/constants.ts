// Typical Hourly Load Profiles (% of Peak Load)
// Ported from utils.py
export const LOAD_PROFILES: Record<string, number[]> = {
    'Office': [10, 8, 7, 6, 7, 10, 25, 45, 70, 85, 95, 100, 100, 95, 90, 90, 85, 80, 65, 45, 30, 20, 15, 12],
    'Data Center': [95, 95, 95, 95, 96, 96, 97, 97, 98, 98, 99, 99, 99, 99, 99, 98, 98, 98, 98, 97, 97, 96, 96, 95],
    'Retail': [5, 4, 3, 3, 4, 6, 10, 25, 50, 75, 85, 95, 100, 100, 95, 90, 85, 80, 75, 60, 40, 25, 15, 8],
    'Residential': [35, 30, 25, 25, 30, 45, 70, 85, 80, 75, 70, 65, 65, 70, 75, 80, 85, 90, 100, 95, 80, 60, 50, 40],
    'Hospital': [85, 85, 85, 85, 86, 87, 88, 90, 92, 95, 95, 96, 96, 97, 97, 97, 96, 95, 95, 94, 93, 90, 88, 86],
    'Warehouse': [15, 12, 10, 10, 12, 20, 35, 50, 65, 75, 85, 90, 90, 85, 80, 80, 70, 60, 50, 40, 30, 25, 20, 18]
};

// eGRID 2023 Output Emission Rates (lb CO2e/MWh)
export const EGRID_FACTORS: Record<string, number> = {
    "National Average": 820.0,
    "ERCOT": 733.9,
    "CAISO": 428.5,
    "ISO-NE": 633.0,
    "SPP": 867.0,
    "MISO": 747.4,
    "NYISO": 230.0,
    "PJM": 800.0
};

export interface RegionalParam {
    solar_seasonality: number;
    solar_cloud: number;
    wind_seasonality: number;
    wind_daily_amp: number;
    wind_peak_hour: number;
    wind_base: number;
}

export const REGIONAL_PARAMS: Record<string, RegionalParam> = {
    "National Average": {
        "solar_seasonality": 0.4, "solar_cloud": 0.5,
        "wind_seasonality": 0.2, "wind_daily_amp": 0.3, "wind_peak_hour": 4, "wind_base": 30
    },
    "ERCOT": {
        "solar_seasonality": 0.5, "solar_cloud": 0.3,
        "wind_seasonality": 0.3, "wind_daily_amp": 0.5, "wind_peak_hour": 2, "wind_base": 35
    },
    "CAISO": {
        "solar_seasonality": 0.6, "solar_cloud": 0.2,
        "wind_seasonality": 0.2, "wind_daily_amp": 0.4, "wind_peak_hour": 18, "wind_base": 25
    },
    "PJM": {
        "solar_seasonality": 0.5, "solar_cloud": 0.6,
        "wind_seasonality": 0.4, "wind_daily_amp": 0.2, "wind_peak_hour": 14, "wind_base": 28
    },
    "NYISO": {
        "solar_seasonality": 0.5, "solar_cloud": 0.6,
        "wind_seasonality": 0.4, "wind_daily_amp": 0.2, "wind_peak_hour": 14, "wind_base": 28
    },
    "ISO-NE": {
        "solar_seasonality": 0.5, "solar_cloud": 0.6,
        "wind_seasonality": 0.4, "wind_daily_amp": 0.2, "wind_peak_hour": 14, "wind_base": 28
    },
    "MISO": {
        "solar_seasonality": 0.45, "solar_cloud": 0.5,
        "wind_seasonality": 0.3, "wind_daily_amp": 0.4, "wind_peak_hour": 3, "wind_base": 38
    },
    "SPP": {
        "solar_seasonality": 0.45, "solar_cloud": 0.4,
        "wind_seasonality": 0.3, "wind_daily_amp": 0.4, "wind_peak_hour": 3, "wind_base": 40
    }
};
