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
/**
 * Gas price data with % change metrics
 */
export interface GasPriceData {
    price: number | null;
    isDelayed: boolean;
    previousClose: number | null;
    dayChange: number | null;      // % change from previous close
    ytdChange: number | null;      // % change from start of year
    yearChange: number | null;     // % change from 1 year ago
}

/**
 * NYMEX Natural Gas Futures month codes
 * F=Jan, G=Feb, H=Mar, J=Apr, K=May, M=Jun, N=Jul, Q=Aug, U=Sep, V=Oct, X=Nov, Z=Dec
 */
const FUTURES_MONTH_CODES: Record<number, string> = {
    0: 'F', 1: 'G', 2: 'H', 3: 'J', 4: 'K', 5: 'M',
    6: 'N', 7: 'Q', 8: 'U', 9: 'V', 10: 'X', 11: 'Z'
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Fetches real-time Natural Gas Futures price from Yahoo Finance (NG=F).
/**
 * Helper to get the previous business day for a given date.
 */
function getPreviousBusinessDay(date: Date): Date {
    const d = new Date(date);
    do {
        d.setDate(d.getDate() - 1);
    } while (d.getDay() === 0 || d.getDay() === 6); // 0=Sun, 6=Sat
    return d;
}

/**
 * Calculates the NYMEX Natural Gas Futures prompt month symbol.
 * Rule: Trading ceases 3 business days prior to the first day of the delivery month.
 */
function getPromptMonthSymbol(): string {
    const now = new Date();
    // Default to next month as the delivery month (e.g. in Jan, deliver Feb)
    let deliveryMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Find expiration date: 3 business days prior to the 1st of delivery month
    let expirationDate = new Date(deliveryMonth);
    for (let i = 0; i < 3; i++) {
        expirationDate = getPreviousBusinessDay(expirationDate);
    }

    // Set expiration to end of day logic (just strictly compare dates)
    // If today is AFTER expiration, roll to next month
    if (now > expirationDate) {
        // Roll to next month
        deliveryMonth = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    }

    const monthCode = FUTURES_MONTH_CODES[deliveryMonth.getMonth()];
    const yearShort = deliveryMonth.getFullYear().toString().slice(2);

    return `NG${monthCode}${yearShort}.NYM`;
}

/**
 * Fetches real-time Natural Gas Futures price from Yahoo Finance.
 * Now calculates the specific prompt month contract (e.g. NGG26.NYM) to avoid early rollover by NG=F.
 */
export async function fetchRealTimeGasPrice(): Promise<GasPriceData> {
    const defaultResult: GasPriceData = {
        price: null,
        isDelayed: true,
        previousClose: null,
        dayChange: null,
        ytdChange: null,
        yearChange: null
    };

    try {
        // Calculate the specific prompt month symbol (e.g., NGG26.NYM)
        const symbol = getPromptMonthSymbol();
        console.log(`Fetching Gas Price for Prompt Month: ${symbol}`);

        // Yahoo Finance API
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`;

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            next: { revalidate: 300 } // Cache for 5 min
        });

        if (!res.ok) {
            console.warn(`Yahoo Finance API returned ${res.status} for ${symbol}, falling back to NG=F`);
            // Fallback to generic NG=F if specific symbol fails
            return fetchGenericGasPrice();
        }

        const json = await res.json();
        const result = json?.chart?.result?.[0];

        // If no result, try fallback
        if (!result) return fetchGenericGasPrice();

        const meta = result.meta;
        const timestamps = result.timestamp || [];
        const closes = result.indicators?.quote?.[0]?.close || [];

        // Current price
        const currentPrice = meta?.regularMarketPrice;
        const previousClose = meta?.previousClose || meta?.chartPreviousClose;

        if (typeof currentPrice !== 'number' || isNaN(currentPrice)) {
            return fetchGenericGasPrice();
        }

        // Calculate day change
        let dayChange: number | null = null;
        if (typeof previousClose === 'number' && previousClose > 0) {
            dayChange = ((currentPrice - previousClose) / previousClose) * 100;
        }

        // Find YTD change (first trading day of current year)
        let ytdChange: number | null = null;
        const currentYear = new Date().getFullYear();
        const startOfYearTimestamp = new Date(currentYear, 0, 1).getTime() / 1000;

        for (let i = 0; i < timestamps.length; i++) {
            if (timestamps[i] >= startOfYearTimestamp && typeof closes[i] === 'number') {
                ytdChange = ((currentPrice - closes[i]) / closes[i]) * 100;
                break;
            }
        }

        // Find 1-year change (approximately 252 trading days ago, or first available)
        let yearChange: number | null = null;
        if (closes.length > 0 && typeof closes[0] === 'number') {
            yearChange = ((currentPrice - closes[0]) / closes[0]) * 100;
        }

        return {
            price: currentPrice,
            isDelayed: true,
            previousClose: previousClose || null,
            dayChange,
            ytdChange,
            yearChange
        };
    } catch (e) {
        console.error('Failed to fetch real-time gas price from Yahoo Finance:', e);
        return defaultResult;
    }
}

/**
 * Fallback to generic NG=F if specific contract fails
 */
async function fetchGenericGasPrice(): Promise<GasPriceData> {
    const defaultResult: GasPriceData = {
        price: null,
        isDelayed: true,
        previousClose: null,
        dayChange: null,
        ytdChange: null,
        yearChange: null
    };

    try {
        const url = 'https://query1.finance.yahoo.com/v8/finance/chart/NG=F?interval=1d&range=1y';
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            next: { revalidate: 300 }
        });

        if (!res.ok) return defaultResult;
        const json = await res.json();
        const result = json?.chart?.result?.[0];
        if (!result) return defaultResult;

        // ... (Extraction logic identical to above, simplified just to functionality)
        const meta = result.meta;
        const currentPrice = meta?.regularMarketPrice;
        const previousClose = meta?.previousClose || meta?.chartPreviousClose;

        if (typeof currentPrice !== 'number' || isNaN(currentPrice)) return defaultResult;

        let dayChange: number | null = null;
        if (typeof previousClose === 'number' && previousClose > 0) {
            dayChange = ((currentPrice - previousClose) / previousClose) * 100;
        }

        return {
            price: currentPrice,
            isDelayed: true,
            previousClose: previousClose || null,
            dayChange,
            // Skip YTD/Year calc for fallback to keep simple, or implement if critical. 
            // For fallback, basic price is key.
            ytdChange: null,
            yearChange: null
        };
    } catch (e) {
        return defaultResult;
    }
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

/**
 * Natural Gas Futures Data
 */
export interface FuturesDataPoint {
    month: string;      // e.g., "Feb '26"
    price: number;      // $/MMBtu
    symbol: string;     // e.g., "NGG26.NYM"
    change?: number;    // % change from previous close
}

export interface FuturesResponse {
    futures: FuturesDataPoint[];
    isRealData: boolean;
    timestamp: string;
}

/**
 * Fetches real-time Natural Gas Futures prices for the next 3 months from Yahoo Finance.
 * Uses NYMEX contract symbols like NGG26.NYM (Feb 2026), NGH26.NYM (Mar 2026), etc.
 */
export async function fetchNaturalGasFutures(): Promise<FuturesResponse> {
    const now = new Date();
    const futures: FuturesDataPoint[] = [];

    try {
        // Build symbols for next 3 months
        const symbols: { symbol: string; month: string }[] = [];

        for (let i = 1; i <= 3; i++) {
            const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const monthCode = FUTURES_MONTH_CODES[futureDate.getMonth()];
            const yearShort = futureDate.getFullYear().toString().slice(2);
            const symbol = `NG${monthCode}${yearShort}.NYM`;
            const monthLabel = `${MONTH_NAMES[futureDate.getMonth()]} '${yearShort}`;
            symbols.push({ symbol, month: monthLabel });
        }

        // Fetch all contracts in parallel
        const fetchPromises = symbols.map(async ({ symbol, month }) => {
            try {
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;

                const res = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                    },
                    next: { revalidate: 900 } // Cache for 15 min
                });

                if (!res.ok) {
                    console.warn(`Yahoo Finance returned ${res.status} for ${symbol}`);
                    return null;
                }

                const json = await res.json();
                const result = json?.chart?.result?.[0];

                if (!result) return null;

                const price = result.meta?.regularMarketPrice;
                const previousClose = result.meta?.previousClose || result.meta?.chartPreviousClose;

                if (typeof price !== 'number' || isNaN(price)) return null;

                let change: number | undefined;
                if (typeof previousClose === 'number' && previousClose > 0) {
                    change = ((price - previousClose) / previousClose) * 100;
                }

                return {
                    month,
                    price: parseFloat(price.toFixed(3)),
                    symbol,
                    change
                };
            } catch (e) {
                console.warn(`Failed to fetch ${symbol}:`, e);
                return null;
            }
        });

        const results = await Promise.all(fetchPromises);

        // Filter out nulls
        const validResults = results.filter(r => r !== null) as FuturesDataPoint[];

        if (validResults.length > 0) {
            return {
                futures: validResults,
                isRealData: true,
                timestamp: new Date().toISOString()
            };
        }

        // Fallback to simulated if all requests failed
        return generateSimulatedFutures();

    } catch (e) {
        console.error('Failed to fetch Natural Gas Futures:', e);
        return generateSimulatedFutures();
    }
}

/**
 * Generate simulated futures data as fallback
 */
function generateSimulatedFutures(): FuturesResponse {
    const now = new Date();
    const basePrice = 2.84; // Baseline price
    const futures: FuturesDataPoint[] = [];

    for (let i = 1; i <= 3; i++) {
        const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const monthCode = FUTURES_MONTH_CODES[futureDate.getMonth()];
        const yearShort = futureDate.getFullYear().toString().slice(2);
        const symbol = `NG${monthCode}${yearShort}.NYM`;
        const monthLabel = `${MONTH_NAMES[futureDate.getMonth()]} '${yearShort}`;

        // Simple contango curve: ~3% increase per month
        const price = basePrice * (1 + (i * 0.03) + (Math.random() * 0.02));

        futures.push({
            month: monthLabel,
            price: parseFloat(price.toFixed(2)),
            symbol
        });
    }

    return {
        futures,
        isRealData: false,
        timestamp: new Date().toISOString()
    };
}
