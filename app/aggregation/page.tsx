import React from 'react';
import { Metadata } from 'next';
import AggregationClient from './AggregationClient';

export const metadata: Metadata = {
    title: "ERCOT Aggregation & Portfolio Management | Eighty760",
    description: "Multi-asset portfolio aggregation for Carbon-Free Energy. Optimize generation mix, manage participants, and visualize financial performance.",
    openGraph: {
        title: "Aggregation & Portfolio Management | Eighty760",
        description: "Multi-asset portfolio aggregation for Carbon-Free Energy. Optimize generation mix, manage participants, and visualize financial performance.",
    }
};

export default function AggregationPage() {
    return <AggregationClient />;
}
