
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function GET() {
    try {
        const headlines = await fetchGoogleNewsRSS();
        return NextResponse.json({ headlines });
    } catch (error) {
        console.error('News API error:', error);
        // Fallback headlines
        return NextResponse.json({
            headlines: [
                "EIA: Solar to drive US electricity generation growth through 2027.",
                "GAS: Henry Hub prices expected to average $3.52/MMBtu in 2025.",
                "OIL: US crude production forecast to dip slightly in 2026.",
                "GRID: Renewables share to reach 21% of US generation by 2027.",
                "MARKET: Global oil supply expected to exceed demand.",
            ]
        });
    }
}

async function fetchGoogleNewsRSS(): Promise<string[]> {
    // Queries for EIA and Energy Information Administration specific news
    const url = 'https://news.google.com/rss/search?q=EIA+Energy+Information+Administration+report&hl=en-US&gl=US&ceid=US:en';
    const res = await fetch(url, { next: { revalidate: 300 } }); // Cache for 5 mins

    if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);

    const xml = await res.text();

    // Simple Regex Parsing for <item><title>...</title></item>
    // We avoid full XML parser libraries to keep dependencies light for this simple use case
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const items: string[] = [];
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const itemContent = match[1];
        const titleMatch = itemContent.match(/<title>(.*?)<\/title>/);

        if (titleMatch) {
            let title = titleMatch[1];

            // Basic cleanup
            if (title.startsWith('<![CDATA[')) {
                title = title.substring(9, title.length - 3);
            }

            // HTML Entity Decoding (Basic)
            title = title
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'")
                .replace(/&amp;/g, '&')
                .replace(/&#39;/g, "'");

            // Remove Source Name Suffix (e.g. " - Houston Chronicle")
            const dashIndex = title.lastIndexOf(' - ');
            if (dashIndex > 10) { // arbitrary length to avoid cutting short titles
                title = title.substring(0, dashIndex);
            }

            items.push(title);
        }

        if (items.length >= 8) break; // Limit to 8 headlines
    }

    return items.length > 0 ? items : [
        "EIA: Market data and analysis updates available."
    ];
}
