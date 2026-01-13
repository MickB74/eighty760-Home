export interface EIADataPoint {
    period: string;
    value: number;
    'type-name'?: string;
    respondent?: string;
    'respondent-name'?: string;
    type?: string;
}

export interface EIAResponse {
    response: {
        data: EIADataPoint[];
        total: number;
        dateFormat?: string;
        frequency?: string;
        description?: string;
    }
}

const BASE_URL = 'https://api.eia.gov/v2';

export interface DemandsData {
    period: string;
    demand: number | null;
    forecast: number | null;
}

/**
 * Fetches the last 24-48 hours of Demand (D) and Forecast (DF) data for ERCOT.
 */
export async function fetchErcotDemandAndForecast(apiKey: string): Promise<DemandsData[]> {
    try {
        // We want both Demand (type=D) and Day-ahead Forecast (type=DF)
        // Note: EIA API allows filtering multiple types.
        // We'll fetch the last 48 hours to ensure we get a good overlap and handle any lag.
        // facets[respondent][]=ERCO
        // facets[type][]=D&facets[type][]=DF
        const length = 48;
        const url = `${BASE_URL}/electricity/rto/region-data/data/?api_key=${apiKey}&frequency=hourly&data[0]=value&facets[respondent][]=ERCO&facets[type][]=D&facets[type][]=DF&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=${length * 2}`;
        // * 2 because we are fetching 2 series (D and DF)

        const res = await fetch(url);
        if (!res.ok) return [];

        const json: EIAResponse = await res.json();
        const data = json.response.data;

        if (!data || data.length === 0) return [];

        // Group by period
        const grouped = new Map<string, { demand: number | null, forecast: number | null }>();

        data.forEach(d => {
            if (!grouped.has(d.period)) {
                grouped.set(d.period, { demand: null, forecast: null });
            }
            const entry = grouped.get(d.period)!;

            // EIA 'type' field maps to 'D' or 'DF'
            if (d.type === 'D') {
                entry.demand = d.value;
            } else if (d.type === 'DF') {
                entry.forecast = d.value;
            }
        });

        // Convert to array and sort ascending (oldest to newest) for charting
        const result: DemandsData[] = Array.from(grouped.entries())
            .map(([period, val]) => ({
                period,
                demand: val.demand,
                forecast: val.forecast
            }))
            .sort((a, b) => a.period.localeCompare(b.period));

        return result;
    } catch (e) {
        console.error('Failed to fetch ERCOT Demand/Forecast:', e);
        return [];
    }
}

// Kept for backward compatibility if needed, but wrapper ensures we use the new one primarily
export async function fetchErcotRealtimeDemand(apiKey: string): Promise<number | null> {
    const data = await fetchErcotDemandAndForecast(apiKey);
    // Return the latest demand value found
    const latestWithDemand = [...data].reverse().find(d => d.demand !== null);
    return latestWithDemand ? latestWithDemand.demand : null;
}

export type HenryHubHistory = { period: string; value: number };

/**
 * Fetches the last 30 days of Henry Hub Spot Prices.
 */
export async function fetchHenryHubPriceHistory(apiKey: string): Promise<HenryHubHistory[]> {
    try {
        // frequency=daily, length=30
        const url = `${BASE_URL}/natural-gas/pri/sum/data/?api_key=${apiKey}&frequency=daily&data[0]=value&facets[process][]=PIN&facets[duoarea][]=RNGWHHD&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=30`;

        const res = await fetch(url);
        if (!res.ok) return [];

        const json: EIAResponse = await res.json();
        if (json.response.data) {
            return json.response.data
                .map(d => ({ period: d.period, value: d.value }))
                .sort((a, b) => a.period.localeCompare(b.period)); // Ascending
        }
        return [];
    } catch (e) {
        console.error('Failed to fetch Henry Hub Price History:', e);
        return [];
    }
}

export async function fetchHenryHubPrice(apiKey: string): Promise<number | null> {
    const history = await fetchHenryHubPriceHistory(apiKey);
    // Return latest
    return history.length > 0 ? history[history.length - 1].value : null;
}

export type FuelMixHistory = { period: string;[fuelType: string]: number | string };

/**
 * Fetches last 24 hours of Grid Fuel Mix
 */
export async function fetchErcotGridMixHistory(apiKey: string): Promise<FuelMixHistory[]> {
    try {
        // Fetch last 24 hours * ~10 fuel types = 240 records
        const length = 300;
        const url = `${BASE_URL}/electricity/rto/fuel-type-data/data/?api_key=${apiKey}&frequency=hourly&data[0]=value&facets[respondent][]=ERCO&sort[0][column]=period&sort[0][direction]=desc&length=${length}`;

        const res = await fetch(url);
        if (!res.ok) return [];

        const json: EIAResponse = await res.json();
        const data = json.response.data;

        if (!data || data.length === 0) return [];

        // Group by period
        const grouped = new Map<string, any>();

        data.forEach(d => {
            const period = d.period;
            if (!grouped.has(period)) {
                grouped.set(period, { period });
            }
            const entry = grouped.get(period);
            if (d['type-name']) {
                entry[d['type-name']] = d.value;
            }
        });

        const result = Array.from(grouped.values())
            .sort((a, b) => a.period.localeCompare(b.period));

        return result;
    } catch (e) {
        console.error('Failed to fetch Grid Mix History:', e);
        return [];
    }
}

export async function fetchErcotGridMix(apiKey: string): Promise<Record<string, number> | null> {
    const history = await fetchErcotGridMixHistory(apiKey);
    const latest = history[history.length - 1];
    if (!latest) return null;

    // Remove 'period' from the object to return just values
    const { period, ...rest } = latest;
    return rest as Record<string, number>;
}
