
/**
 * Script to seed the Market Intelligence Dashboard with initial data.
 * Usage: npx ts-node scripts/seed-intelligence.ts
 * 
 * Note: Requires the Next.js dev server to be running at http://localhost:3000
 */

const BASE_URL = 'http://localhost:3000/api/ingest';

const SEED_URLS = [
    // === UTILITY DIVE - Reliable scraping ===
    "https://www.utilitydive.com/news/ercot-contingency-reserve-service-market-monitor-battery-storage/705432/",
    "https://www.utilitydive.com/news/ferc-interconnection-rules-order-2023-2023a-renewable-energy/700812/",
    "https://www.utilitydive.com/news/ercot-battery-storage-record-texas-grid/738621/",
    "https://www.utilitydive.com/news/texas-puc-ercot-market-design-changes-reliability/740593/",
    "https://www.utilitydive.com/news/battery-storage-capacity-doubles-us-grid-eia/712837/",

    // === INSIDE CLIMATE NEWS ===
    "https://insideclimatenews.org/news/09012025/texas-battery-storage-growth-2025/",
    "https://insideclimatenews.org/news/17012026/renewable-energy-investment-2025-record/",

    // === GRID STATUS BLOG ===
    "https://blog.gridstatus.io/ercot-2023-review/",
    "https://blog.gridstatus.io/ercot-solar-curtailment-analysis/",

    // === CLEANTECHNICA ===
    "https://cleantechnica.com/2025/12/15/texas-breaks-solar-generation-record/",
    "https://cleantechnica.com/2026/01/05/battery-storage-revolution-texas/",
    "https://cleantechnica.com/2025/11/20/corporate-24-7-cfe-procurement-trends/",

    // === RENEWABLE ENERGY WORLD ===
    "https://www.renewableenergyworld.com/solar/ercot-solar-capacity-additions-2025/",
    "https://www.renewableenergyworld.com/storage/battery-storage-revenue-streams-ercot/",

    // === PV MAGAZINE ===
    "https://pv-magazine-usa.com/2025/12/01/texas-solar-installations-exceed-projections/",
    "https://pv-magazine-usa.com/2026/01/10/ercot-interconnection-queue-analysis/",

    // === ENERGY STORAGE NEWS ===
    "https://www.energy-storage.news/texas-battery-storage-market-outlook-2026/",
    "https://www.energy-storage.news/ercot-ancillary-services-battery-participation/",

    // === S&P GLOBAL (Market Intelligence) ===
    "https://www.spglobal.com/commodityinsights/en/market-insights/latest-news/electric-power/ercot-power-prices",

    // === REUTERS ===
    "https://www.reuters.com/business/energy/texas-power-grid-renewable-growth-2025/",
];

async function seed() {
    console.log(`🌱 Seeding Market Intelligence... targeting ${BASE_URL}`);

    for (const url of SEED_URLS) {
        console.log(`\nProcessing: ${url}`);
        try {
            const res = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, category: 'Seed-Script' })
            });

            const data = await res.json();

            if (res.ok) {
                console.log(`✅ Success!`);
                console.log(`   Title: ${data.analysis?.summary?.substring(0, 50) || 'No summary available'}...`);
                console.log(`   Relevant: ${data.analysis?.isRelevant}`);
            } else {
                console.log(`❌ Failed: ${data.error || data.message}`);
                console.log(`   Reason: ${data.reasoning}`);
            }

        } catch (err) {
            console.error(`❌ Connection Error: Is the server running?`, err);
        }
    }

    console.log('\n✨ Seeding Complete. Refresh the dashboard at /intelligence');
}

seed();
