import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { HOURS } from '@/lib/data/simulation-profiles';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface ResultsChartProps {
    baseLoad: number[];
    solarGen: number[];
    windGen: number[];
    nuclearGen: number[];
    geothermalGen: number[];
}

export default function ResultsChart({
    baseLoad,
    solarGen,
    windGen,
    nuclearGen,
    geothermalGen
}: ResultsChartProps) {
    // Chart Configuration using "stacked: true" logic.
    const chartData = {
        labels: HOURS.map(h => `${h}:00`),
        datasets: [
            {
                label: 'Load (MW)',
                data: baseLoad,
                borderColor: '#333333',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                tension: 0.4,
                order: 0, // Draw on top
                stack: 'load' // Separate stack group so it doesn't pile on generation
            },
            // Generation Stack (Bottom to Top)
            // 1. Geothermal (Baseload)
            {
                label: 'Geothermal',
                data: geothermalGen,
                backgroundColor: 'rgba(239, 68, 68, 0.85)', // Red-500
                borderColor: '#EF4444',
                borderWidth: 0,
                fill: true,
                pointRadius: 0,
                tension: 0.2, // Flatter for baseload
                order: 4,
                stack: 'generation'
            },
            // 2. Nuclear (Baseload)
            {
                label: 'Nuclear',
                data: nuclearGen,
                backgroundColor: 'rgba(168, 85, 247, 0.85)', // Purple-500
                borderColor: '#A855F7',
                borderWidth: 0,
                fill: true,
                pointRadius: 0,
                tension: 0.2,
                order: 3,
                stack: 'generation'
            },
            // 3. Wind (Variable)
            {
                label: 'Wind Gen',
                data: windGen,
                backgroundColor: 'rgba(59, 130, 246, 0.85)', // Blue-500
                borderColor: '#3B82F6',
                borderWidth: 0,
                fill: true,
                pointRadius: 0,
                tension: 0.4,
                order: 2,
                stack: 'generation'
            },
            // 4. Solar (Peaking)
            {
                label: 'Solar Gen',
                data: solarGen,
                backgroundColor: 'rgba(245, 158, 11, 0.85)', // Amber-500
                borderColor: '#F59E0B',
                borderWidth: 0,
                fill: true,
                pointRadius: 0,
                tension: 0.4,
                order: 1,
                stack: 'generation'
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        return context.dataset.label + ': ' + Math.round(context.raw) + ' MW';
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                stacked: true, // Enable stacking
                title: { display: true, text: 'Megawatts (MW)' },
                grid: { color: 'rgba(0,0,0,0.05)' }
            },
            x: { grid: { display: false } },
        },
    };

    return (
        <div className="chart-container w-full h-[300px]">
            <Line data={chartData} options={chartOptions} />
        </div>
    );
}
