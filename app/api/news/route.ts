
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
    // User provided Google Alerts RSS (Atom) feed
    const url = 'https://www.google.com/alerts/feeds/05477018627257484545/2588084030416567261';
    const res = await fetch(url, { next: { revalidate: 300 } }); // Cache for 5 mins

    if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);

    const xml = await res.text();

    // Regex Parsing for Atom Feed (<entry><title>...</title></entry>)
    const itemRegex = /<entry>([\s\S]*?)<\/entry>/g;
    const items: string[] = [];
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const itemContent = match[1];
        // Match <title> with optional attributes like type="html"
        const titleMatch = itemContent.match(/<title[^>]*>([\s\S]*?)<\/title>/);

        if (titleMatch) {
            let title = titleMatch[1];

            // Basic cleanup
            if (title.startsWith('<![CDATA[')) {
                title = title.substring(9, title.length - 3);
            }

            // HTML Entity Decoding (Basic) - Decode FIRST so encoded tags like &lt;b&gt; become <b>
            title = title
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'")
                .replace(/&amp;/g, '&')
                .replace(/&#39;/g, "'")
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');

            // Remove HTML tags (now that they are decoded)
            title = title.replace(/<[^>]*>/g, '');

            // Remove Source Name Suffix (e.g. " - Houston Chronicle")
            const dashIndex = title.lastIndexOf(' - ');
            if (dashIndex > 15) { // arbitrary length to avoid cutting short titles
                title = title.substring(0, dashIndex);
            }

            items.push(title.trim());
        }

        if (items.length >= 10) break; // Limit to 10 headlines
    }

    return items.length > 0 ? items : [
        "Status: Waiting for new alert updates..." // Fallback if valid XML but no entries
    ];
}
