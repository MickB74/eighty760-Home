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
 * Converts simulation result to CSV format with DETAILED financial breakdown
 * Matches the granularity of the Financial Analysis download
 */
export function generateDetailedHourlyCSV(result: SimulationResult, financials: import('../aggregation/types').FinancialParams, year?: number | string): string {
    const rows: string[] = [];

    // Header row
    const headers = [
        'Hour',
        ...(year ? ['Year'] : []),
        'Load (MW)',
        'Matched Gen (MW)',
        'Grid Deficit (MW)',
        'Overgeneration (MW)',
        // Technology Generation
        'Solar Gen (MW)',
        'Wind Gen (MW)',
        'Nuclear Gen (MW)',
        'Geothermal Gen (MW)',
        'CCS Gen (MW)',
        'Battery Discharge (MW)',
        'Battery Charge (MW)',
        // Financial Details
        'Market Price ($/MWh)',
        'REC Price ($/MWh)',
        // PPA Prices
        'Solar PPA Price ($/MWh)',
        'Wind PPA Price ($/MWh)',
        'Nuclear PPA Price ($/MWh)',
        'Geothermal PPA Price ($/MWh)',
        'CCS PPA Price ($/MWh)',
        // Costs & Revenues
        'Solar PPA Cost ($)',
        'Wind PPA Cost ($)',
        'Nuclear PPA Cost ($)',
        'Geothermal PPA Cost ($)',
        'CCS PPA Cost ($)',
        'Solar Market Revenue ($)',
        'Wind Market Revenue ($)',
        'Nuclear Market Revenue ($)',
        'Geothermal Market Revenue ($)',
        'CCS Market Revenue ($)',
        'REC Cost ($)',
        'Hourly Net Cost ($)'
    ];
    rows.push(headers.join(','));

    // Data rows (8760 hours)
    const HOURS = 8760;
    for (let i = 0; i < HOURS; i++) {
        const load = result.load_profile[i] || 0;
        const solarGen = result.solar_profile[i] || 0;
        const windGen = result.wind_profile[i] || 0;
        const nucGen = result.nuc_profile[i] || 0;
        const geoGen = result.geo_profile[i] || 0;
        const ccsGen = result.ccs_profile[i] || 0;
        const batteryDischarge = result.battery_discharge[i] || 0;
        const price = result.market_price_profile[i] || 0;
        const recPrice = result.rec_price_profile[i] || 0;
        const match = result.matched_profile[i] || 0;

        // Calculations
        const solarPPACost = solarGen * financials.solar_price;
        const windPPACost = windGen * financials.wind_price;
        const nucPPACost = nucGen * financials.nuc_price;
        const geoPPACost = geoGen * financials.geo_price;
        const ccsPPACost = ccsGen * financials.ccs_price;

        const solarRev = solarGen * price;
        const windRev = windGen * price;
        const nucRev = nucGen * price;
        const geoRev = geoGen * price;
        const ccsRev = ccsGen * price;

        const recCost = (load - match) * recPrice;

        const netCost = (solarPPACost - solarRev) +
            (windPPACost - windRev) +
            (nucPPACost - nucRev) +
            (geoPPACost - geoRev) +
            (ccsPPACost - ccsRev) +
            recCost;

        const row = [
            i.toString(),
            ...(year ? [year.toString()] : []),
            load.toFixed(2),
            match.toFixed(2),
            Math.max(0, load - match).toFixed(2), // Deficit
            result.surplus_profile[i]?.toFixed(2) || '0', // Overgen
            solarGen.toFixed(2),
            windGen.toFixed(2),
            nucGen.toFixed(2),
            geoGen.toFixed(2),
            ccsGen.toFixed(2),
            batteryDischarge.toFixed(2),
            result.battery_charge[i]?.toFixed(2) || '0',
            price.toFixed(2),
            recPrice.toFixed(2),
            financials.solar_price.toFixed(2),
            financials.wind_price.toFixed(2),
            financials.nuc_price.toFixed(2),
            financials.geo_price.toFixed(2),
            financials.ccs_price.toFixed(2),
            solarPPACost.toFixed(2),
            windPPACost.toFixed(2),
            nucPPACost.toFixed(2),
            geoPPACost.toFixed(2),
            ccsPPACost.toFixed(2),
            solarRev.toFixed(2),
            windRev.toFixed(2),
            nucRev.toFixed(2),
            geoRev.toFixed(2),
            ccsRev.toFixed(2),
            recCost.toFixed(2),
            netCost.toFixed(2)
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
