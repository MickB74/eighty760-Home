// Price data loader for ERCOT historical prices

interface PriceData {
    year: number;
    location: string;
    prices: number[];
    avg_price: number;
}

export async function loadERCOTPrices(year: number): Promise<number[] | null> {
    try {
        const response = await fetch(`/data/prices/ercot_${year}.json`);

        if (!response.ok) {
            console.warn(`No price data for ${year}, falling back to synthetic`);
            return null;
        }

        const data: PriceData = await response.json();
        return data.prices;

    } catch (error) {
        console.error(`Error loading ${year} prices:`, error);
        return null;
    }
}


export async function loadHubPrices(year: number, location: string): Promise<number[] | null> {
    try {
        // 1. Try Hub-specific file (2023-2025)
        const response = await fetch(`/data/prices/ercot_${year}_hubs.json`);
        if (response.ok) {
            const data = await response.json();
            // Map generic location names to Hub names if needed
            let hubKey = location;
            if (location === 'North') hubKey = 'HB_NORTH';
            if (location === 'South') hubKey = 'HB_SOUTH';
            if (location === 'West') hubKey = 'HB_WEST';
            if (location === 'Houston') hubKey = 'HB_HOUSTON';
            if (location === 'Panhandle') hubKey = 'HB_PAN';

            if (data[hubKey]) return data[hubKey];
        } else {
            // If file not found (e.g. 2020-2022), fallback to default loader if North
            if (location === 'North' || location === 'HB_NORTH') {
                return loadERCOTPrices(year);
            }
        }
        return null;
    } catch (error) {
        console.warn(`Error loading hub prices for ${year} ${location}:`, error);
        return null;
    }
}

export function getAvailableYears(): number[] {
    return [2020, 2021, 2022, 2023, 2024, 2025];
}

export function getYearLabel(year: number | 'Synthetic' | 'Average'): string {
    if (year === 'Synthetic') return 'Synthetic (Duck Curve)';
    if (year === 'Average') return 'Average (2020-2025)';
    return `${year} (HB_NORTH)`;
}

export async function loadAveragePriceProfile(years: number[]): Promise<number[] | null> {
    try {
        const allProfiles: number[][] = [];

        // Load all requested years
        for (const year of years) {
            const prices = await loadERCOTPrices(year);
            if (prices) {
                // Ensure we only take the first 8760 hours to match standard profile length
                // Some leap years might have more, handling strictly 8760 simplifies things
                allProfiles.push(prices.slice(0, 8760));
            }
        }

        if (allProfiles.length === 0) return null;

        // Calculate hourly average
        const avgProfile = new Array(8760).fill(0);
        for (let i = 0; i < 8760; i++) {
            let sum = 0;
            let count = 0;
            for (const profile of allProfiles) {
                if (profile[i] !== undefined) {
                    sum += profile[i];
                    count++;
                }
            }
            avgProfile[i] = count > 0 ? sum / count : 0;
        }

        return avgProfile;

    } catch (error) {
        console.error("Error calculating average price profile:", error);
        return null;
    }
}
