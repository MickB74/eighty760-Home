import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { SimulationResult, Participant, GenerationAsset } from '@/lib/aggregation/types';
import Chart from 'chart.js/auto';

interface ExcelReportData {
    scenarioName: string;
    results: SimulationResult;
    year: string | number;
    participants: Participant[];
    assets: GenerationAsset[];
}

const fetchImageBuffer = async (url: string): Promise<ArrayBuffer | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load image');
        return await response.arrayBuffer();
    } catch (e) {
        console.warn('Could not load logo for Excel:', e);
        return null;
    }
};

export const generateExcelReport = async (data: ExcelReportData) => {
    const { results, scenarioName, year, participants, assets } = data;
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'Eighty760';
    workbook.lastModifiedBy = 'Eighty760';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Load Logo
    const logoBuffer = await fetchImageBuffer('/LogoBlackTransparent.png');


    // ==========================================
    // SHEET 1: EXECUTIVE SUMMARY
    // ==========================================
    const summarySheet = workbook.addWorksheet('Executive Summary', {
        views: [{ showGridLines: false }]
    });

    if (logoBuffer) {
        const logoId = workbook.addImage({
            buffer: logoBuffer,
            extension: 'png',
        });
        summarySheet.addImage(logoId, {
            tl: { col: 1, row: 0 }, // B1
            ext: { width: 120, height: 40 }
        });
    }

    // Styles
    const titleFont = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF0A1428' } }; // Navy
    const headerFont = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } }; // White
    const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A1428' } }; // Navy
    const subHeaderFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00FF88' } }; // Energy Green

    // Title
    summarySheet.mergeCells('B2:E2');
    const titleCell = summarySheet.getCell('B2');
    titleCell.value = '24/7 Carbon-Free Energy Portfolio Report';
    titleCell.font = titleFont;

    summarySheet.getCell('B3').value = `Scenario: ${scenarioName}`;
    summarySheet.getCell('B4').value = `Year: ${year}`;
    summarySheet.getCell('B5').value = `Generated: ${new Date().toLocaleDateString()}`;

    // KPI Section
    summarySheet.getCell('B7').value = 'Key Performance Indicators';
    summarySheet.getCell('B7').font = { size: 14, bold: true };

    const kpiData = [
        ['Metric', 'Value'],
        ['CFE Score (Annual)', `${(results.cfe_score * 100).toFixed(2)}%`],
        ['Total Load', `${results.total_load_mwh.toLocaleString()} MWh`],
        ['Total Generation', `${results.total_gen_mwh.toLocaleString()} MWh`],
        ['Matched Energy', `${results.total_matched_mwh.toLocaleString()} MWh`],
        ['Grid Deficit', `${(results.total_load_mwh - results.total_matched_mwh).toLocaleString()} MWh`],
        ['Surplus (Overgen)', `${results.surplus_profile.reduce((a, b) => a + b, 0).toLocaleString()} MWh`]
    ];

    addTable(summarySheet, 'B9', kpiData, headerFill, headerFont);

    // Financial Section
    summarySheet.getCell('E7').value = 'Financial Overview';
    summarySheet.getCell('E7').font = { size: 14, bold: true };

    const finData = [
        ['Item', 'Amount'],
        ['Total Net Cost', `$${results.total_cost_net.toLocaleString()}`],
        ['Avg Cost / MWh', `$${results.avg_cost_per_mwh.toFixed(2)}`],
        ['Settlement Value', `$${results.settlement_value.toLocaleString()}`],
        ['Market Purchase Cost', `$${results.market_purchase_cost.toLocaleString()}`]
    ];

    addTable(summarySheet, 'E9', finData, headerFill, headerFont);

    // Capacity Section
    summarySheet.getCell('B18').value = 'Portfolio Assets';
    summarySheet.getCell('B18').font = { size: 14, bold: true };

    const assetData = [['Technology', 'Location', 'Capacity (MW)', 'Generation (MWh)', 'Capacity Factor']];
    assets.forEach(a => {
        // Find gen for this asset if possible, otherwise rely on type aggregation or just list capacity
        // For simple summary, we list what we know
        assetData.push([a.type, a.location, a.capacity_mw.toString(), '-', '-']);
    });

    // Tech aggregation for better stats
    const techMap = new Map<string, number>();
    assets.forEach(a => techMap.set(a.type, (techMap.get(a.type) || 0) + a.capacity_mw));

    const techSummaryData = [['Technology', 'Total Capacity (MW)', 'Total Generation (MWh)', '% of Gen']];
    ['solar', 'wind', 'nuc', 'geo', 'ccs'].forEach(key => {
        const details = results.tech_details[key];
        const cap = getCapacityForTech(assets, key);
        if (cap > 0 || (details && details.total_mwh > 0)) {
            techSummaryData.push([
                getTechDisplayName(key),
                cap.toLocaleString(),
                details?.total_mwh.toLocaleString() || '0',
                results.total_gen_mwh > 0 ? `${((details?.total_mwh || 0) / results.total_gen_mwh * 100).toFixed(1)}%` : '0%'
            ]);
        }
    });

    addTable(summarySheet, 'B20', techSummaryData, headerFill, headerFont);

    // Column Widths
    summarySheet.columns.forEach((col: Partial<ExcelJS.Column>, i: number) => {
        if (i === 0) col.width = 5; // Spacer
        else col.width = 25;
    });


    // ==========================================
    // SHEET 2: MONTHLY ANALYSIS
    // ==========================================
    const monthlySheet = workbook.addWorksheet('Monthly Analysis');

    // Calculate Monthly Metrics
    const monthlyMetrics = calculateMonthlyMetrics(results);
    const monthlyHeaders = ['Month', 'Load (MWh)', 'Generation (MWh)', 'Matched (MWh)', 'Deficit (MWh)', 'Surplus (MWh)', 'CFE Score (%)'];
    const monthlyRows = monthlyMetrics.map(m => [
        m.month,
        m.load,
        m.gen,
        m.matched,
        m.deficit,
        m.surplus,
        m.cfeScore / 100 // Excel stores % as fraction
    ]);

    addTable(monthlySheet, 'A1', [monthlyHeaders, ...monthlyRows], headerFill, headerFont);

    // Formatting
    monthlySheet.getColumn(7).numFmt = '0.00%';
    monthlySheet.columns.forEach((col: Partial<ExcelJS.Column>) => { col.width = 15; });

    // Generate Chart
    try {
        const chartBuffer = await generateMonthlyChartImage(monthlyMetrics);
        if (chartBuffer) {
            const imageId = workbook.addImage({
                base64: chartBuffer,
                extension: 'png',
            });
            monthlySheet.addImage(imageId, {
                tl: { col: 8, row: 1 }, // Start at Column I
                ext: { width: 600, height: 350 }
            });
        }
    } catch (e) {
        console.warn('Failed to generate Excel chart', e);
    }


    // ==========================================
    // SHEET 3: HOURLY DATA (8760)
    // ==========================================
    const hourlySheet = workbook.addWorksheet('Hourly Data - Raw');

    // Efficiently build large data set
    const hourlyHeaders = [
        'Hour', 'Timestamp', 'Load (MW)', 'Net Load (MW)',
        'Total Gen (MW)', 'Solar (MW)', 'Wind (MW)', 'Nuclear (MW)', 'Geothermal (MW)', 'CCS (MW)',
        'Battery Discharge (MW)', 'Battery Charge (MW)', 'Battery SoC (MWh)',
        'Matched (MW)', 'Deficit (MW)', 'Surplus (MW)', 'CFE Score (%)',
        'Market Price ($/MWh)'
    ];

    // Stream rows? Or just add array. 8760 is small enough for modern JS memory.
    const hourlyRows = [];

    // Helper to generate timestamps
    const startDate = new Date(`${year}-01-01T00:00:00`);

    for (let i = 0; i < 8760; i++) {
        // Create timestamp
        const time = new Date(startDate.getTime() + i * 3600000);
        const iso = time.toISOString().replace('T', ' ').substring(0, 16);

        const load = results.load_profile[i];
        const matched = results.matched_profile[i];

        hourlyRows.push([
            i + 1,
            iso,
            load,
            load - (results.solar_profile[i] + results.wind_profile[i]), // Net Load

            // Gen
            (results.solar_profile[i] + results.wind_profile[i] + results.nuc_profile[i] + results.geo_profile[i] + results.ccs_profile[i]),
            results.solar_profile[i],
            results.wind_profile[i],
            results.nuc_profile[i],
            results.geo_profile[i],
            results.ccs_profile[i],

            // Battery
            results.battery_discharge[i],
            results.battery_charge[i],
            results.battery_soc[i],

            // Matches
            matched,
            results.deficit_profile[i],
            results.surplus_profile[i],
            load > 0 ? matched / load : 1.0, // CFE

            // Price
            results.market_price_profile[i]
        ]);
    }

    // Add Main Table
    const tableRef = `A1:R${hourlyRows.length + 1}`;
    hourlySheet.addTable({
        name: 'HourlyData',
        ref: 'A1',
        headerRow: true,
        totalsRow: false,
        style: {
            theme: 'TableStyleLight9',
            showRowStripes: true,
        },
        columns: hourlyHeaders.map(h => ({ name: h, filterButton: true })),
        rows: hourlyRows
    });

    // Formatting
    hourlySheet.getColumn(2).width = 18;
    hourlySheet.getColumn(17).numFmt = '0.0%';
    hourlySheet.getColumn(18).numFmt = '$0.00';

    // Freeze top row
    hourlySheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

    // Save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `CFE_Analysis_${scenarioName.replace(/\s+/g, '_')}_${year}.xlsx`);
};


// HELPERS

function addTable(sheet: ExcelJS.Worksheet, startCell: string, data: any[][], headerFillVal: any, headerFontVal: any) {
    const startRow = sheet.getCell(startCell).row;
    const startCol = sheet.getCell(startCell).col;

    data.forEach((row, rIdx) => {
        row.forEach((val, cIdx) => {
            const cell = sheet.getCell(startRow + rIdx, startCol + cIdx);
            cell.value = val;
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            if (rIdx === 0) {
                cell.fill = headerFillVal;
                cell.font = headerFontVal;
                cell.alignment = { horizontal: 'center' };
            }
        });
    });
}

function calculateMonthlyMetrics(result: SimulationResult) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map(() => ({
        load: 0,
        gen: 0,
        matched: 0,
        deficit: 0,
        surplus: 0
    }));

    const hoursPerMonth = [744, 672, 744, 720, 744, 720, 744, 744, 720, 744, 720, 744];
    let hourIndex = 0;

    hoursPerMonth.forEach((hours, monthIdx) => {
        for (let h = 0; h < hours; h++) {
            if (hourIndex < 8760) {
                monthlyData[monthIdx].load += result.load_profile[hourIndex];
                monthlyData[monthIdx].gen +=
                    result.solar_profile[hourIndex] +
                    result.wind_profile[hourIndex] +
                    result.nuc_profile[hourIndex] +
                    result.geo_profile[hourIndex] +
                    result.ccs_profile[hourIndex];
                monthlyData[monthIdx].matched += result.matched_profile[hourIndex];
                monthlyData[monthIdx].deficit += result.deficit_profile[hourIndex];
                monthlyData[monthIdx].surplus += result.surplus_profile[hourIndex];
                hourIndex++;
            }
        }
    });

    return monthlyData.map((data, idx) => ({
        month: months[idx],
        ...data,
        cfeScore: data.load > 0 ? (data.matched / data.load) * 100 : 0
    }));
}

function getTechDisplayName(tech: string): string {
    const names: Record<string, string> = {
        'solar': 'Solar',
        'wind': 'Wind',
        'nuc': 'Nuclear',
        'geo': 'Geothermal',
        'ccs': 'CCS Gas'
    };
    return names[tech] || tech;
}

function getCapacityForTech(assets: GenerationAsset[], techKey: string): number {
    // Map techKey (solar, wind...) to Asset.type (Solar, Wind...)
    const typeMap: Record<string, string> = {
        'solar': 'Solar',
        'wind': 'Wind',
        'nuc': 'Nuclear',
        'geo': 'Geothermal',
        'ccs': 'CCS Gas'
    };
    const targetType = typeMap[techKey];
    return assets
        .filter(a => a.type === targetType)
        .reduce((sum, a) => sum + a.capacity_mw, 0);
}

async function generateMonthlyChartImage(metrics: any[]): Promise<string | null> {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 450;

    // Chart.js requires specific context scaling for quality, but distinct element works fine
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    return new Promise((resolve) => {
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: metrics.map(m => m.month),
                datasets: [
                    {
                        label: 'Matched Generation (MWh)',
                        data: metrics.map(m => m.matched),
                        backgroundColor: '#10b981', // green-500
                        order: 1
                    },
                    {
                        label: 'Grid Deficit (MWh)',
                        data: metrics.map(m => m.deficit),
                        backgroundColor: '#ef4444', // red-500
                        order: 2
                    },
                    {
                        type: 'line',
                        label: 'Total Load (MWh)',
                        data: metrics.map(m => m.load),
                        borderColor: '#1e293b', // slate-800
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 0,
                        order: 0
                    }
                ]
            },
            options: {
                responsive: false,
                animation: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Monthly Portfolio Performance',
                        font: { size: 18 }
                    },
                    legend: { position: 'bottom' },
                    tooltip: { enabled: false } // No tooltips for static image
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Energy (MWh)' }
                    }
                }
            }
        });

        // Small delay to ensure render (though animation: false should be instant)
        setTimeout(() => {
            const base64 = chart.toBase64Image();
            chart.destroy();
            resolve(base64);
        }, 50);
    });
}
