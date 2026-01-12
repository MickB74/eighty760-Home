import { SimulationResult } from '../aggregation/types';

/**
 * Converts simulation result to CSV format with 8760 hourly data
 */
export function generateHourlyCSV(result: SimulationResult, year?: number | string, scenarioName?: string): string {
    const rows: string[] = [];

    // Header row
    const headers = [
        'Hour',
        ...(year ? ['Year'] : []),
        ...(scenarioName ? ['Scenario'] : []),
        'Load (MW)',
        'Solar (MW)',
        'Wind (MW)',
        'Geothermal (MW)',
        'Nuclear (MW)',
        'CCS Gas (MW)',
        'Total Generation (MW)',
        'Battery Charge (MW)',
        'Battery Discharge (MW)',
        'Battery SOC (MWh)',
        'Matched Load (MW)',
        'Deficit (MW)',
        'Surplus (MW)',
        'Market Price ($/MWh)',
        'REC Price ($/MWh)',
        'CFE Status'
    ];
    rows.push(headers.join(','));

    // Data rows (8760 hours)
    const HOURS = 8760;
    for (let i = 0; i < HOURS; i++) {
        const row = [
            i.toString(),
            ...(year ? [year.toString()] : []),
            ...(scenarioName ? [`"${scenarioName}"`] : []),
            result.load_profile[i]?.toFixed(2) || '0',
            result.solar_profile[i]?.toFixed(2) || '0',
            result.wind_profile[i]?.toFixed(2) || '0',
            result.geo_profile[i]?.toFixed(2) || '0',
            result.nuc_profile[i]?.toFixed(2) || '0',
            result.ccs_profile[i]?.toFixed(2) || '0',
            (
                (result.solar_profile[i] || 0) +
                (result.wind_profile[i] || 0) +
                (result.geo_profile[i] || 0) +
                (result.nuc_profile[i] || 0) +
                (result.ccs_profile[i] || 0)
            ).toFixed(2),
            result.battery_charge[i]?.toFixed(2) || '0',
            result.battery_discharge[i]?.toFixed(2) || '0',
            result.battery_soc[i]?.toFixed(2) || '0',
            result.matched_profile[i]?.toFixed(2) || '0',
            result.deficit_profile[i]?.toFixed(2) || '0',
            result.surplus_profile[i]?.toFixed(2) || '0',
            result.market_price_profile[i]?.toFixed(2) || '0',
            result.rec_price_profile[i]?.toFixed(2) || '0',
            result.matched_profile[i] >= (result.load_profile[i] - 0.001) ? 'Matched' : 'Unmatched'
        ];
        rows.push(row.join(','));
    }

    return rows.join('\n');
}

/**
 * Triggers browser download of CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate CSV filename with timestamp
 */
export function generateCSVFilename(prefix: string, year?: number | string, scenarioName?: string): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let name = `${prefix}_${timestamp}`;

    if (year) {
        name += `_${year}`;
    }
    if (scenarioName) {
        const safeName = scenarioName.replace(/[^a-z0-9]/gi, '_');
        name += `_${safeName}`;
    }

    return `${name}.csv`;
}
