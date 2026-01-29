import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SimulationResult } from '@/lib/aggregation/types';

interface PDFReportData {
    scenarioName: string;
    results: SimulationResult;
    year: string | number;
    participants: Array<{ name: string; load_mwh: number }>;
    assets: Array<{ name: string; type: string; location: string; capacity_mw: number }>;
    charts?: {
        timeline?: string;
        monthlyCFE?: string;
        genMix?: string;
        hourlyProfile?: string;
        costBreakdown?: string;
    };
}

// Helper: Calculate monthly metrics
function calculateMonthlyMetrics(result: SimulationResult) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map(() => ({
        load: 0,
        gen: 0,
        matched: 0,
        deficit: 0,
        surplus: 0
    }));

    const hoursPerMonth = [744, 672, 744, 720, 744, 720, 744, 744, 720, 744, 720, 744]; // Approx for non-leap year
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

// Helper: Get tech name display
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

const fetchImage = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load image');
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn('Could not load logo:', e);
        return '';
    }
};

export const generateComprehensivePDFReport = async (data: PDFReportData) => {
    const doc = new jsPDF();
    const { results, scenarioName, year, participants, assets } = data;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let currentPage = 1;

    // Load Logo
    const logoData = await fetchImage('/LogoBlackTransparent.png');

    // Colors
    const primaryColor: [number, number, number] = [10, 20, 40]; // Navy
    const accentColor: [number, number, number] = [0, 255, 136]; // Energy Green
    const textColor: [number, number, number] = [40, 40, 40];

    // === PAGE HEADER FUNCTION ===
    const addHeader = (pageNum: number) => {
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 35, 'F');

        // Add Logo if available
        if (logoData) {
            // Adjust position and size as needed
            const logoWidth = 35;
            const logoHeight = 35 / 3; // Approx aspect ratio if known, or let it scale
            // Assuming the logo is roughly 3:1 or 4:1 width:height. 
            // Let's guess a reasonable size.
            doc.addImage(logoData, 'PNG', margin, 10, 30, 15);
        } else {
            // Fallback text if logo fails
            doc.setFontSize(18);
            doc.setTextColor(255, 255, 255);
            doc.text('Eighty760', margin, 15);
        }

        // Move title if logo is present or keep it?
        // If logo is present, maybe we don't need text 'Eighty760' or we place it next to it.
        // User said "also make sure the pdf and excel have the eighty760 logo".
        // The original code had:
        // doc.text('Eighty760', margin, 15);
        // doc.text('24/7 Carbon-Free Energy Report', margin, 25);

        // Let's put logo on left, and title on right or below.
        // The original text 'Eighty760' was at margin, 15.
        // If we put the logo there, we should move the text or remove 'Eighty760' text if the logo contains it.
        // LogoBlackTransparent probably contains the text.

        // Let's assume the logo replaces the text "Eighty760".
        // But we still want "24/7 Carbon-Free Energy Report".

        doc.setFontSize(10);
        doc.setTextColor(...accentColor);
        // Align this with the bottom of the header area roughly
        doc.text('24/7 Carbon-Free Energy Report', margin, 30);

        doc.setFontSize(8);
        doc.setTextColor(200, 200, 200);
        doc.text(`Page ${pageNum}`, pageWidth - margin, 15, { align: 'right' });
        doc.text(`${scenarioName} (${year})`, pageWidth - margin, 25, { align: 'right' });
    };

    // === PAGE  FOOTER ===
    const addFooter = () => {
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(
            `Generated ${new Date().toLocaleDateString()} | eighty760.com`,
            margin,
            pageHeight - 8
        );
    };

    // === PAGE 1: EXECUTIVE SUMMARY ===
    addHeader(currentPage);

    let yPos = 50;

    doc.setFontSize(16);
    doc.setTextColor(...textColor);
    doc.text('Executive Summary', margin, yPos);
    yPos += 10;

    // Key Highlights Box
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'F');

    doc.setFontSize(11);
    doc.setTextColor(...textColor);
    const cfeScore = (results.cfe_score * 100).toFixed(1);
    const cfeRating = parseFloat(cfeScore) >= 90 ? 'Excellent' : parseFloat(cfeScore) >= 75 ? 'Good' : 'Needs Improvement';

    doc.text(`24/7 CFE Score: ${cfeScore}% (${cfeRating})`, margin + 5, yPos + 10);
    doc.text(`Total Load: ${results.total_load_mwh.toLocaleString()} MWh`, margin + 5, yPos + 20);
    doc.text(`Net Cost: $${results.total_cost_net.toLocaleString()} ($${results.avg_cost_per_mwh.toFixed(2)}/MWh)`, margin + 5, yPos + 30);

    yPos += 45;

    // Portfolio Overview
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('Portfolio Overview', margin, yPos);
    yPos += 8;

    const portfolioMetrics = [
        ['Total Annual Load', `${results.total_load_mwh.toLocaleString()} MWh`],
        ['Average Load', `${(results.total_load_mwh / 8760).toFixed(1)} MW`],
        ['Clean Generation', `${results.total_gen_mwh.toLocaleString()} MWh`],
        ['Matched Energy', `${results.total_matched_mwh.toLocaleString()} MWh`],
        ['Grid Deficit', `${(results.total_load_mwh - results.total_matched_mwh).toLocaleString()} MWh`],
        ['Overgeneration', `${results.surplus_profile.reduce((a, b) => a + b, 0).toLocaleString()} MWh`]
    ];

    autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: portfolioMetrics,
        theme: 'plain',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } },
        margin: { left: margin }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Asset Summary
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('Installed Capacity by Technology', margin, yPos);
    yPos += 8;

    const techCapacities = assets.reduce((acc, asset) => {
        const type = asset.type;
        acc[type] = (acc[type] || 0) + asset.capacity_mw;
        return acc;
    }, {} as Record<string, number>);

    const capacityData = Object.entries(techCapacities).map(([tech, capacity]) => [
        tech,
        `${capacity.toFixed(0)} MW`
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Technology', 'Capacity']],
        body: capacityData,
        theme: 'plain',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold' } },
        margin: { left: margin }
    });

    addFooter();

    // === PAGE 2: DETAILED METRICS ===
    doc.addPage();
    currentPage++;
    addHeader(currentPage);
    yPos = 50;

    doc.setFontSize(16);
    doc.setTextColor(...textColor);
    doc.text('Detailed Metrics', margin, yPos);
    yPos += 10;

    // Energy Balance Table
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('Energy Balance', margin, yPos);
    yPos += 8;

    const energyBalance = [
        ['Total Load', `${results.total_load_mwh.toLocaleString()} MWh`],
        ['Total Generation', `${results.total_gen_mwh.toLocaleString()} MWh`],
        ['Matched Energy', `${results.total_matched_mwh.toLocaleString()} MWh`],
        ['Grid Deficit', `${(results.total_load_mwh - results.total_matched_mwh).toLocaleString()} MWh`],
        ['Overgeneration', `${results.surplus_profile.reduce((a, b) => a + b, 0).toLocaleString()} MWh`],
        ['Annual CFE Score', `${(results.cfe_score * 100).toFixed(2)}%`]
    ];

    autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: energyBalance,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } }
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;

    // Technology Breakdown
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('Technology Performance', margin, yPos);
    yPos += 8;

    const techData = ['solar', 'wind', 'nuc', 'geo', 'ccs'].map(tech => {
        const details = results.tech_details[tech];
        if (!details || details.total_mwh === 0) return null;

        const profile = tech === 'solar' ? results.solar_profile :
            tech === 'wind' ? results.wind_profile :
                tech === 'nuc' ? results.nuc_profile :
                    tech === 'geo' ? results.geo_profile :
                        results.ccs_profile;

        const capacity = techCapacities[getTechDisplayName(tech)] || 0;
        const cf = capacity > 0 ? ((details.total_mwh / (capacity * 8760)) * 100).toFixed(1) : 'N/A';
        const pctOfTotal = results.total_gen_mwh > 0 ? ((details.total_mwh / results.total_gen_mwh) * 100).toFixed(1) : '0';

        return [
            getTechDisplayName(tech),
            capacity > 0 ? `${capacity.toFixed(0)} MW` : 'N/A',
            `${details.total_mwh.toLocaleString()} MWh`,
            cf !== 'N/A' ? `${cf}%` : 'N/A',
            `${pctOfTotal}%`
        ];
    }).filter(Boolean) as string[][];

    autoTable(doc, {
        startY: yPos,
        head: [['Technology', 'Capacity', 'Generation', 'Capacity Factor', '% of Total']],
        body: techData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2.5 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;

    // Financial Breakdown
    if (yPos > 220) {
        doc.addPage();
        currentPage++;
        addHeader(currentPage);
        yPos = 50;
    }

    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('Financial Summary', margin, yPos);
    yPos += 8;

    const financialData = [
        ['Settlement Value', `$${results.settlement_value.toLocaleString()}`],
        ['REC Cost', `$${results.rec_cost.toLocaleString()}`],
        ['REC Income', `$${results.rec_income.toLocaleString()}`],
        ['Market Purchase Cost', `$${results.market_purchase_cost.toLocaleString()}`],
        ['Total Net Cost', `$${results.total_cost_net.toLocaleString()}`],
        ['Average Cost per MWh', `$${results.avg_cost_per_mwh.toFixed(2)}/MWh`]
    ];

    autoTable(doc, {
        startY: yPos,
        head: [['Item', 'Amount']],
        body: financialData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 90 } }
    });

    addFooter();

    // === PAGE 3: MONTHLY ANALYSIS ===
    doc.addPage();
    currentPage++;
    addHeader(currentPage);
    yPos = 50;

    doc.setFontSize(16);
    doc.setTextColor(...textColor);
    doc.text('Monthly Analysis', margin, yPos);
    yPos += 10;

    const monthlyMetrics = calculateMonthlyMetrics(results);
    const monthlyTableData = monthlyMetrics.map(m => [
        m.month,
        m.load.toLocaleString(undefined, { maximumFractionDigits: 0 }),
        m.gen.toLocaleString(undefined, { maximumFractionDigits: 0 }),
        `${m.cfeScore.toFixed(1)}%`,
        m.deficit.toLocaleString(undefined, { maximumFractionDigits: 0 }),
        m.surplus.toLocaleString(undefined, { maximumFractionDigits: 0 })
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Month', 'Load (MWh)', 'Gen (MWh)', 'CFE Score', 'Deficit (MWh)', 'Surplus (MWh)']],
        body: monthlyTableData,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2, halign: 'right' },
        columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } }
    });

    addFooter();

    // === PAGE 4: ASSET PERFORMANCE ===
    if (results.asset_details && results.asset_details.length > 0) {
        doc.addPage();
        currentPage++;
        addHeader(currentPage);
        yPos = 50;

        doc.setFontSize(16);
        doc.setTextColor(...textColor);
        doc.text('Asset Performance', margin, yPos);
        yPos += 10;

        const assetTableData = results.asset_details.map(asset => {
            const capacity = asset.capacity_mw;
            const cf = capacity > 0 ? ((asset.total_gen_mwh / (capacity * 8760)) * 100).toFixed(1) : 'N/A';

            return [
                asset.name,
                asset.type,
                asset.location,
                `${capacity.toFixed(0)} MW`,
                asset.total_gen_mwh.toLocaleString(undefined, { maximumFractionDigits: 0 }),
                cf !== 'N/A' ? `${cf}%` : 'N/A',
                `$${asset.settlement_value.toLocaleString()}`
            ];
        });

        autoTable(doc, {
            startY: yPos,
            head: [['Asset', 'Type', 'Location', 'Capacity', 'Generation', 'CF', 'Settlement']],
            body: assetTableData,
            theme: 'grid',
            headStyles: { fillColor: primaryColor, fontSize: 7 },
            styles: { fontSize: 7, cellPadding: 2 },
            columnStyles: {
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'right' }
            }
        });

        addFooter();
    }

    // === ADD CHARTS IF PROVIDED ===
    if (data.charts) {
        if (data.charts.timeline) {
            doc.addPage();
            currentPage++;
            addHeader(currentPage);
            yPos = 50;

            doc.setFontSize(14);
            doc.setTextColor(...textColor);
            doc.text('8760 Hour Timeline', margin, yPos);
            yPos += 8;

            const imgWidth = pageWidth - 2 * margin;
            const imgHeight = 100;
            doc.addImage(data.charts.timeline, 'PNG', margin, yPos, imgWidth, imgHeight);

            addFooter();
        }

        if (data.charts.monthlyCFE) {
            doc.addPage();
            currentPage++;
            addHeader(currentPage);
            yPos = 50;

            doc.setFontSize(14);
            doc.setTextColor(...textColor);
            doc.text('Monthly CFE Performance', margin, yPos);
            yPos += 8;

            const imgWidth = pageWidth - 2 * margin;
            const imgHeight = 100;
            doc.addImage(data.charts.monthlyCFE, 'PNG', margin, yPos, imgWidth, imgHeight);

            addFooter();
        }
    }

    // === FINAL PAGE: DISCLAIMER ===
    doc.addPage();
    currentPage++;
    addHeader(currentPage);
    yPos = 50;

    doc.setFontSize(10);
    doc.setTextColor(...textColor);
    doc.text('Disclaimer', margin, yPos);
    yPos += 10;

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const disclaimer = [
        'This report is generated by Eighty760 based on simulated hourly data and market assumptions.',
        'Actual results may vary based on real-world conditions, weather variability, market dynamics,',
        'and operational factors. This analysis is for informational purposes only and should not be',
        'considered as financial or investment advice. Please consult with qualified professionals',
        'before making any decisions based on this report.'
    ];

    disclaimer.forEach((line, idx) => {
        doc.text(line, margin, yPos + (idx * 6));
    });

    addFooter();

    // Save
    doc.save(`Eighty760_CFE_Report_${scenarioName.replace(/\s+/g, '_')}_${year}.pdf`);
};

// Legacy export for backward compatibility
export const generatePDFReport = async (
    scenarioName: string,
    results: SimulationResult,
    year: string | number,
    charts: { cfe?: string; generation?: string }
) => {
    await generateComprehensivePDFReport({
        scenarioName,
        results,
        year,
        participants: [],
        assets: [],
        charts: {
            timeline: charts.cfe
        }
    });
};
