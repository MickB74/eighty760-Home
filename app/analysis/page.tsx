import React from 'react';
import { Metadata } from 'next';
import AnalysisClient from './AnalysisClient';

export const metadata: Metadata = {
    title: "Analysis & Simulation | Eighty760",
    description: "Run detailed 24/7 Carbon-Free Energy simulations. Configure load profiles, renewable capacities, and analyze hourly matching performance.",
    openGraph: {
        title: "Analysis & Simulation | Eighty760",
        description: "Run detailed 24/7 Carbon-Free Energy simulations. Configure load profiles, renewable capacities, and analyze hourly matching performance.",
    }
};

export default function AnalysisPage() {
    return <AnalysisClient />;
}
