
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dbConnect from '@/lib/db';
import Insight from '@/lib/models/Insight';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const { url, category, manualContent } = await req.json();

        if (!url && !manualContent) {
            return NextResponse.json({ error: 'URL or manual content required' }, { status: 400 });
        }

        await dbConnect();

        let title = '';
        let content = manualContent || '';
        let scrapedSource = '';

        // 1. Scrape Content if URL provided
        if (url && !manualContent) {
            try {
                const res = await fetch(url);
                const html = await res.text();
                const $ = cheerio.load(html);

                // Simple heuristic scraping (can be improved for specific sites)
                title = $('title').text().trim() || $('h1').first().text().trim();

                // Remove scripts, styles, navs
                $('script, style, nav, footer, header').remove();

                // Get main content paragraphs
                content = $('p').map((i, el) => $(el).text()).get().join('\n').substring(0, 5000); // Limit context
                scrapedSource = new URL(url).hostname;
            } catch (scrapeErr) {
                console.error('Scraping failed:', scrapeErr);
                return NextResponse.json({ error: 'Failed to scrape URL' }, { status: 500 });
            }
        }

        if (!content) {
            return NextResponse.json({ error: 'No content found to analyze' }, { status: 400 });
        }

        // 2. Run LLM Relevance Check with Gemini
        // Using gemini-2.0-flash-lite-preview-02-05 as requested by user
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });

        const prompt = `
You are an expert energy market analyst for "Eighty760", a 24/7 Carbon-Free Energy (CFE) platform.
Your job is to act as a noise filter. Analyze the provided text and determine if it is HIGHLY RELEVANT to:
1. Hourly 24/7 Carbon-Free Energy (CFE) matching
2. Scope 2 GHG accounting credibility
3. Grid-time alignment (time-based attributes)
4. ERCOT market dynamics affecting renewables

If it is generic "sustainability" or "ESG" fluff, reject it.
If it is about simple annual offsets without time-based granularity, reject it.

Title: ${title}
Content:
${content}

Respond STRICTLY with valid JSON (no markdown banking) in the following format:
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

        // Clean up markdown if Gemini wraps it in ```json ... ```
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const analysis = JSON.parse(text);

        if (!analysis.isRelevant) {
            return NextResponse.json({
                message: 'Content analyzed but discarded as irrelevant',
                reasoning: analysis.relevanceReasoning
            });
        }

        // 3. Store in MongoDB
        const insight = await Insight.create({
            source: scrapedSource || 'Manual Entry',
            url: url || 'manual',
            title: title || 'Untitled Insight',
            content: analysis.summary,
            isRelevant: true,
            relevanceReasoning: analysis.relevanceReasoning,
            tags: analysis.tags,
            category: category || 'General',
            ingestedDate: new Date()
        });

        return NextResponse.json({
            success: true,
            insightId: insight._id,
            analysis
        });

    } catch (error: any) {
        console.error('Ingest error:', error);
        console.error('Error details:', error.message, error.response?.data);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
