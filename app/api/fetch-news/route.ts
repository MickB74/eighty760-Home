
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dbConnect from '@/lib/db';
import Insight from '@/lib/models/Insight';

// Initialize
const parser = new Parser();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// RSS Feed Sources
const RSS_FEEDS = [
    { name: 'EIA Today in Energy', url: 'https://www.eia.gov/rss/todayinenergy.xml', category: 'Government' },
    { name: 'CleanTechnica', url: 'https://cleantechnica.com/feed/', category: 'News' },
    { name: 'Utility Dive', url: 'https://www.utilitydive.com/feeds/news/', category: 'Industry' },
    { name: 'Canary Media', url: 'https://www.canarymedia.com/feed', category: 'News' },
    { name: 'Google Sustainability', url: 'https://blog.google/outreach-initiatives/sustainability/rss/', category: 'Corporate' },
    { name: 'Microsoft On The Issues', url: 'https://blogs.microsoft.com/on-the-issues/feed/', category: 'Corporate' },
    { name: 'ERCOT News', url: 'https://www.ercot.com/rss/news', category: 'ISO Update' },
];

// Check if article is from last 24 hours
function isRecent(pubDate: string | undefined): boolean {
    if (!pubDate) return false;
    const articleDate = new Date(pubDate);
    const now = new Date();
    const hoursDiff = (now.getTime() - articleDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
}

// Analyze article relevance with Gemini
async function analyzeRelevance(title: string, content: string): Promise<{
    isRelevant: boolean;
    relevanceReasoning: string;
    summary: string;
    tags: string[];
} | null> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });

        const prompt = `
You are an expert energy market analyst for "Eighty760", a 24/7 Carbon-Free Energy (CFE) platform.
Your job is to act as a noise filter. Analyze the provided text and determine if it is HIGHLY RELEVANT to:
1. Hourly 24/7 Carbon-Free Energy (CFE) matching
2. Scope 2 GHG accounting credibility
3. Grid-time alignment (time-based attributes)
4. ERCOT market dynamics affecting renewables
5. Battery storage and grid services
6. Corporate renewable energy procurement (Google, Microsoft, Amazon, etc.)
7. Renewable energy records, capacity additions, or market trends

If it is generic "sustainability" or "ESG" fluff, reject it.
If it is about simple annual offsets without time-based granularity, reject it.
If it is unrelated to energy/power markets, reject it.

Title: ${title}
Content:
${content.substring(0, 3000)}

Respond STRICTLY with valid JSON (no markdown) in the following format:
{
    "isRelevant": boolean,
    "relevanceReasoning": "1-sentence explanation",
    "summary": "2-sentence summary of the key insight",
    "tags": ["tag1", "tag2"]
}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(text);
    } catch (error) {
        console.error('Gemini analysis error:', error);
        return null;
    }
}

// Fetch and parse a single RSS feed
async function processFeed(feed: { name: string; url: string; category: string }): Promise<number> {
    let addedCount = 0;

    try {
        console.log(`Fetching: ${feed.name}`);
        const rss = await parser.parseURL(feed.url);

        for (const item of rss.items || []) {
            // Skip if not recent
            if (!isRecent(item.pubDate)) {
                continue;
            }

            // Check if already exists in DB
            const existing = await Insight.findOne({ url: item.link });
            if (existing) {
                console.log(`  Skipping (exists): ${item.title?.substring(0, 50)}...`);
                continue;
            }

            // Get content (prefer content:encoded, fallback to contentSnippet)
            const content = item['content:encoded'] || item.contentSnippet || item.content || '';

            // Analyze relevance
            const analysis = await analyzeRelevance(item.title || '', content);

            if (!analysis || !analysis.isRelevant) {
                console.log(`  Irrelevant: ${item.title?.substring(0, 50)}...`);
                continue;
            }

            // Store in MongoDB
            await Insight.create({
                source: feed.name,
                url: item.link || '',
                title: item.title || 'Untitled',
                content: analysis.summary,
                isRelevant: true,
                relevanceReasoning: analysis.relevanceReasoning,
                tags: analysis.tags,
                category: feed.category,
                ingestedDate: new Date(item.pubDate || new Date())
            });

            console.log(`  ✅ Added: ${item.title?.substring(0, 50)}...`);
            addedCount++;

            // Rate limit - small delay between Gemini calls
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    } catch (error) {
        console.error(`Error processing ${feed.name}:`, error);
    }

    return addedCount;
}

// Main handler
export async function POST(req: Request) {
    try {
        await dbConnect();

        let totalAdded = 0;
        const results: { source: string; added: number }[] = [];

        for (const feed of RSS_FEEDS) {
            const added = await processFeed(feed);
            totalAdded += added;
            results.push({ source: feed.name, added });
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${RSS_FEEDS.length} feeds, added ${totalAdded} new insights`,
            results
        });

    } catch (error: any) {
        console.error('Fetch news error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

// Also allow GET for cron jobs (Vercel crons use GET by default)
export async function GET(req: Request) {
    return POST(req);
}
