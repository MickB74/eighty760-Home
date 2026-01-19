
/**
 * Script to seed the Market Intelligence Dashboard with initial data.
 * Usage: npx ts-node scripts/seed-intelligence.ts
 * 
 * Note: Requires the Next.js dev server to be running at http://localhost:3000
 */

const BASE_URL = 'http://localhost:3000/api/ingest';

const SEED_URLS = [
    // Canary Media - Clean high quality signals
    "https://www.canarymedia.com/articles/long-duration-energy-storage/funding-for-long-duration-energy-storage-projects",
    "https://www.canarymedia.com/articles/clean-energy/google-microsoft-nucor-clean-energy-procurement",

    // Utility Dive - Deep dive utility news
    "https://www.utilitydive.com/news/ercot-contingency-reserve-service-market-monitor-battery-storage/705432/",

    // Grid Status / ERCOT specific (Using a blog post or news release mock link if real ones are hard to scrape without JS)
    // We will use a known good article
    "https://blog.gridstatus.io/ercot-2023-review/",
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
                console.log(`   Title: ${data.analysis.summary.substring(0, 50)}...`);
                console.log(`   Relevant: ${data.analysis.isRelevant}`);
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
