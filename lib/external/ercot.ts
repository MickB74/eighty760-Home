
/**
 * Shared utilities for fetching data from ERCOT public dashboards.
 */

export interface ErcotFuelMix {
    lastUpdated: string;
    data: {
        [fuelType: string]: {
            gen: number; // MW
            mix: number; // Percentage
        }
    }
}

export async function fetchErcotFuelMix(): Promise<ErcotFuelMix | null> {
    try {
        const url = 'https://www.ercot.com/api/1/services/read/dashboards/fuel-mix.json';
        const res = await fetch(url, {
            next: { revalidate: 300 }, // 5 min cache
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.ercot.com/gridmktinfo/dashboards/fuelmix'
            }
        });

        if (!res.ok) return null;

        const json = await res.json();
        // The API returns structure like: { lastUpdated: "...", data: { Solar: { gen: 123, mix: 1.2 }, ... } }
        return json as ErcotFuelMix;

    } catch (e) {
        console.error('Failed to fetch ERCOT Fuel Mix:', e);
        return null;
    }
}

export async function fetchLiveErcotPrices(): Promise<Record<string, string> | null> {
    try {
        const url = 'https://www.ercot.com/content/cdr/html/real_time_spp.html';
        const res = await fetch(url, { next: { revalidate: 60 } }); // Cache for 1 min
        if (!res.ok) return null;

        const html = await res.text();

        // 1. Extract Headers to find indices
        const headerRegex = /<th[^>]*>(.*?)<\/th>/g;
        const headers: string[] = [];
        let match;
        // Limit search to first 5000 chars to find headers quickly
        const headerSection = html.substring(0, 5000);
        while ((match = headerRegex.exec(headerSection)) !== null) {
            headers.push(match[1].trim());
        }

        const requiredCols = [
            'HB_NORTH', 'HB_SOUTH', 'HB_WEST', 'HB_HOUSTON',
            'LZ_NORTH', 'LZ_SOUTH', 'LZ_WEST', 'LZ_HOUSTON'
        ];

        const colIndices: Record<string, number> = {};
        requiredCols.forEach(col => {
            const idx = headers.indexOf(col);
            if (idx !== -1) colIndices[col] = idx;
        });

        if (Object.keys(colIndices).length === 0) return null;

        // 2. Extract Last Data Row
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
        const rows: string[] = [];
        let rowMatch;
        while ((rowMatch = rowRegex.exec(html)) !== null) {
            rows.push(rowMatch[1]);
        }

        const dataRows = rows.filter(r => r.includes('<td'));
        if (dataRows.length === 0) return null;

        const lastRow = dataRows[dataRows.length - 1];

        // 3. Extract Cells from Last Row
        const cellRegex = /<td[^>]*>(.*?)<\/td>/g;
        const cells: string[] = [];
        let cellMatch;
        while ((cellMatch = cellRegex.exec(lastRow)) !== null) {
            cells.push(cellMatch[1].trim());
        }

        // Map values
        const result: Record<string, string> = {};
        requiredCols.forEach(col => {
            const idx = colIndices[col];
            if (idx !== undefined && idx < cells.length) {
                result[col] = parseFloat(cells[idx]).toFixed(2);
            } else {
                result[col] = "N/A";
            }
        });

        return result;

    } catch (e) {
        console.error('Failed to scrape ERCOT prices:', e);
        return null;
    }
}
