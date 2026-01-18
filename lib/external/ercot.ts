
/**
 * Shared utilities for fetching data from ERCOT public dashboards.
 */

export interface ErcotFuelMix {
    lastUpdated: string;
    data: {
        [fuelType: string]: {
            gen: number; // MW
            mix?: number; // Percentage
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

        // The API returns structure like: { lastUpdated: "...", data: { "2023-01-01": { "2023-01-01 12:00": { Solar: ... } } } }
        // We need to find the latest day, then the latest timestamp within that day
        if (json && json.data) {
            const days = Object.keys(json.data).sort();
            const latestDay = days[days.length - 1];

            if (latestDay && json.data[latestDay]) {
                const dayData = json.data[latestDay];
                const timestamps = Object.keys(dayData).sort();
                const latestTimestamp = timestamps[timestamps.length - 1];

                if (latestTimestamp && dayData[latestTimestamp]) {
                    return {
                        lastUpdated: latestTimestamp,
                        data: dayData[latestTimestamp]
                    };
                }
            }
        }

        return null;

    } catch (e) {
        console.error('Failed to fetch ERCOT Fuel Mix:', e);
        return null;
    }
}

export async function fetchLiveErcotPrices(): Promise<Record<string, string> | null> {
    try {
        const url = 'https://www.ercot.com/content/cdr/html/real_time_spp.html';
        const res = await fetch(url, {
            next: { revalidate: 60 },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        }); // Cache for 1 min
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

export interface ErcotGridConditions {
    load: number | null;
    wind: number | null;
    solar: number | null;
}

export async function fetchLiveErcotLoad(): Promise<ErcotGridConditions> {
    const result: ErcotGridConditions = { load: null, wind: null, solar: null };

    try {
        const url = 'https://www.ercot.com/content/cdr/html/real_time_system_conditions.html';
        const res = await fetch(url, {
            next: { revalidate: 60 },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        }); // Cache for 1 min
        if (!res.ok) return result;

        const html = await res.text();

        // Helper extraction
        const extractVal = (label: string): number | null => {
            // Pattern: <td class="tdLeft">LABEL</td>...<td class="labelClassCenter">VALUE</td>
            // Use specific regex to find the value after the label cell
            // We use [\s\S]*? to lazily match any characters (newlines) until the next td tag
            const regex = new RegExp(`${label}<\\/td>[\\s\\S]*?<td[^>]*>([\\d,\\.]+)`, 'i');
            const match = regex.exec(html);
            if (match && match[1]) {
                const val = parseFloat(match[1].replace(/,/g, ''));
                return isNaN(val) ? null : val;
            }
            return null;
        };

        result.load = extractVal('Actual System Demand');
        result.wind = extractVal('Total Wind Output');
        result.solar = extractVal('Total PVGR Output');

        return result;
    } catch (e) {
        console.error('Failed to scrape ERCOT Grid Conditions:', e);
        return result;
    }
}
