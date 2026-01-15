import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import GlobalTickerWrapper from "@/components/GlobalTickerWrapper";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const ibmPlexMono = IBM_Plex_Mono({
    weight: ['700'],
    subsets: ["latin"],
    variable: '--font-ibm-plex-mono'
});

export const metadata: Metadata = {
    title: "Eighty760 | 24/7 Carbon-Free Energy Simulation",
    description: "Model, analyze, and optimize clean energy portfolios with 24/7 Carbon-Free Energy matching. Interactive simulator for solar, wind, and battery storage.",
    keywords: ["carbon-free energy", "CFE", "renewable energy", "solar power", "wind power", "battery storage", "energy simulation", "clean energy portfolio", "hourly carbon accounting", "8760 simulation"],
    authors: [{ name: "Eighty760" }],
    openGraph: {
        type: "website",
        url: "https://www.eighty760.com/",
        title: "Eighty760 | 24/7 Carbon-Free Energy Simulation",
        description: "Interactive framework for modeling clean energy portfolios with hourly carbon-free energy matching",
        images: [{ url: "https://www.eighty760.com/logo.png" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Eighty760 | 24/7 Carbon-Free Energy Simulation",
        description: "Interactive framework for modeling clean energy portfolios with hourly carbon-free energy matching",
        images: ["https://www.eighty760.com/logo.png"],
    },
    icons: {
        icon: "/logo.png",
    },
    alternates: {
        canonical: "https://www.eighty760.com",
    },
    other: {
        'ai-content-declaration': 'human-created',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'WebSite',
                            name: 'Eighty760',
                            description: '24/7 Carbon-Free Energy Simulation Platform for hourly carbon accounting',
                            url: 'https://www.eighty760.com',
                            inLanguage: 'en-US',
                            publisher: {
                                '@type': 'Organization',
                                name: 'Eighty760',
                                url: 'https://www.eighty760.com',
                            },
                            potentialAction: {
                                '@type': 'SearchAction',
                                target: {
                                    '@type': 'EntryPoint',
                                    urlTemplate: 'https://www.eighty760.com/?q={search_term_string}',
                                },
                                'query-input': 'required name=search_term_string',
                            },
                        }),
                    }}
                />
            </head>
            <body className={`${inter.variable} ${ibmPlexMono.variable} font-sans antialiased`}>
                <GlobalTickerWrapper />
                {children}
                <Script defer src="https://cdn.vercel-insights.com/v1/script.js" />

                {/* Google Analytics */}
                <Script src="https://www.googletagmanager.com/gtag/js?id=G-HS1WYM4MCP" strategy="afterInteractive" />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'G-HS1WYM4MCP');
                    `}
                </Script>
            </body>
        </html>
    );
}
