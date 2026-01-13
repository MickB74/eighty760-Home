
export interface EIADataPoint {
    period: string;
    value: number;
    'type-name'?: string;
    respondent?: string;
}

export interface EIAResponse {
    response: {
        data: EIADataPoint[];
        total: number;
    }
}

const BASE_URL = 'https://api.eia.gov/v2';

export async function fetchErcotRealtimeDemand(apiKey: string): Promise<number | null> {
    try {
        // electricity/rto/region-data
        // Facets: respondent=ERCO, type=D (Demand) - Note: Type might need to be verified, usually 'D' or 'DF' (Demand Forecast)
        // Actually, for "Hourly Demand", it is often type='D' in 'electricity/rto/region-data'
        const url = `${BASE_URL}/electricity/rto/region-data/data/?api_key=${apiKey}&frequency=hourly&data[0]=value&facets[respondent][]=ERCO&facets[type][]=D&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=1`;

        const res = await fetch(url);
        if (!res.ok) return null;

        const json: EIAResponse = await res.json();
        if (json.response.data && json.response.data.length > 0) {
            return json.response.data[0].value;
        }
        return null;
    } catch (e) {
        console.error('Failed to fetch ERCOT Demand from EIA:', e);
        return null;
    }
}

export async function fetchHenryHubPrice(apiKey: string): Promise<number | null> {
    try {
        // natural-gas/pri/sum
        // Series: NG.RNGWHHD.D
        // Actually, the new V2 API uses facets. 
        // Facets: process=PIN, duoarea=RNGWHHD (Area: Henry Hub)
        // Let's rely on the series ID mapping if possible, but V2 requires constructed queries.
        // A common query for HH Spot:
        // natural-gas/pri/fut/data ... no, that's futures.
        // Let's try: natural-gas/pri/sum/data
        const url = `${BASE_URL}/natural-gas/pri/sum/data/?api_key=${apiKey}&frequency=daily&data[0]=value&facets[process][]=PIN&facets[duoarea][]=RNGWHHD&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=1`;

        const res = await fetch(url);
        if (!res.ok) {
            // Fallback to weekly if daily fails (sometimes daily is delayed)
            // Or just return null
            return null;
        }

        const json: EIAResponse = await res.json();
        if (json.response.data && json.response.data.length > 0) {
            return json.response.data[0].value;
        }
        return null;
    } catch (e) {
        console.error('Failed to fetch Henry Hub Price from EIA:', e);
        return null; // Fallback
    }
}

// Fetch Grid Mix (Fuel Type)
export async function fetchErcotGridMix(apiKey: string): Promise<Record<string, number> | null> {
    try {
        // electricity/rto/fuel-type-data
        // facets[respondent][]=ERCO
        const url = `${BASE_URL}/electricity/rto/fuel-type-data/data/?api_key=${apiKey}&frequency=hourly&data[0]=value&facets[respondent][]=ERCO&sort[0][column]=period&sort[0][direction]=desc&length=12`;
        // We get the last hour's data for all fuel types. There shouldn't be more than ~10 types.

        const res = await fetch(url);
        if (!res.ok) return null;

        const json: EIAResponse = await res.json();
        const data = json.response.data;

        if (!data || data.length === 0) return null;

        // Group by period to ensure we get the latest single hour
        const latestPeriod = data[0].period;
        const latestData = data.filter(d => d.period === latestPeriod);

        const mix: Record<string, number> = {};
        latestData.forEach(d => {
            if (d['type-name']) {
                mix[d['type-name']] = d.value;
            }
        });

        return mix;
    } catch (e) {
        console.error('Failed to fetch Grid Mix:', e);
        return null;
    }
}
