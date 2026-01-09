import { Metadata } from 'next';
import WeatherPerformanceClient from './WeatherPerformanceClient';

export const metadata: Metadata = {
    title: 'Weather Performance Analysis | Eighty760',
    description: 'Compare renewable energy project performance across different historical weather years (2020-2025)',
};

export default function WeatherPerformancePage() {
    return <WeatherPerformanceClient />;
}
