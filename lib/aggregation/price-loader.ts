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

export function getAvailableYears(): number[] {
    return [2020, 2021, 2022, 2023, 2024, 2025];
}

export function getYearLabel(year: number | 'Synthetic'): string {
    if (year === 'Synthetic') return 'Synthetic (Duck Curve)';
    return `${year} (HB_NORTH)`;
}
