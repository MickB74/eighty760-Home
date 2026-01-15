
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
                "ERCOT: Grid operating normally, sufficient generation available.",
                "MARKET: Solar output hits new daily record.",
                "WEATHER: Seasonal temperatures expected across Texas.",
                "REGULATORY: PUC discusses new battery storage interconnection rules.",
                "INDUSTRY: Texas leads nation in new utility-scale wind capacity.",
            ]
        });
    }
}

async function fetchGoogleNewsRSS(): Promise<string[]> {
    const url = 'https://news.google.com/rss/search?q=ERCOT+Texas+Energy&hl=en-US&gl=US&ceid=US:en';
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
        "ERCOT: Grid operating normally (RSS Empty)"
    ];
}
