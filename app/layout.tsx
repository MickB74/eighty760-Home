import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const ibmPlexMono = IBM_Plex_Mono({
    weight: ['700'],
    subsets: ["latin"],
    variable: '--font-ibm-plex-mono'
});

export const metadata: Metadata = {
    title: "Eighty760 | 24/7 Carbon-Free Energy Simulation",
    description: "Model, analyze, and optimize clean energy portfolios with 24/7 Carbon-Free Energy matching. Interactive simulator for solar, wind, and battery storage.",
    keywords: ["carbon-free energy", "CFE", "renewable energy", "solar power", "wind power", "battery storage", "energy simulation", "clean energy portfolio"],
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
            </head>
            <body className={`${inter.variable} ${ibmPlexMono.variable} font-sans antialiased`}>
                {children}
                <Script defer src="https://cdn.vercel-insights.com/v1/script.js" />
            </body>
        </html>
    );
}
