// Weather data loader for comparing performance across different years

import { runSimulation } from '@/lib/simulation/engine';
import { SimulationInputs, SimulationResult } from '@/lib/simulation/types';

interface WeatherProfile {
    solar: number[];
    wind: number[];
}

export interface YearlyPerformance {
    year: number;
    result: SimulationResult;
    solarProfile: number[];
    windProfile: number[];
}

export interface PerformanceStats {
    metric: string;
    min: number;
    max: number;
    avg: number;
    variance: number;
    bestYear: number;
    worstYear: number;
}

// Load solar generation profile for a specific location and year
export async function loadSolarProfile(location: string, year: number): Promise<number[] | null> {
    try {
        const response = await fetch(`/data/profiles/Solar_${location}_${year}.json`);
        if (!response.ok) {
            console.warn(`No solar data for ${location} ${year}`);
            return null;
        }
        const data = await response.json();
        return data.generation || data.profile || data;
    } catch (error) {
        console.error(`Error loading solar profile for ${location} ${year}:`, error);
        return null;
    }
}

// Load wind generation profile for a specific location and year
export async function loadWindProfile(location: string, year: number): Promise<number[] | null> {
    try {
        // Handle "South (Coastal)" - Load "South" and scale
        let targetLocation = location;
        let scaleFactor = 1.0;

        if (location === 'South (Coastal)') {
            targetLocation = 'South';
            scaleFactor = 1.65; // Boost from ~16% to ~27%
        }

        const response = await fetch(`/data/profiles/Wind_${targetLocation}_${year}.json`);
        if (!response.ok) {
            console.warn(`No wind data for ${location} ${year}`);
            return null;
        }
        const data = await response.json();
        const rawProfile = data.generation || data.profile || data;

        if (scaleFactor !== 1.0 && Array.isArray(rawProfile)) {
            // Apply scaling and clip at 1.0 (assuming normalized profile)
            return rawProfile.map((val: number) => Math.min(1.0, val * scaleFactor));
        }

        return rawProfile;
    } catch (error) {
        console.error(`Error loading wind profile for ${location} ${year}:`, error);
        return null;
    }
}

// Available years for comparison
export function getAvailableYears(): number[] {
    // Historical weather data available 2000-2025
    return Array.from({ length: 26 }, (_, i) => 2000 + i);
}

// Run simulation for a specific year using actual weather data
async function runYearSimulation(
    config: SimulationInputs,
    year: number,
    location: string
): Promise<YearlyPerformance | null> {
    try {
        // Load weather profiles for this year
        const solarProfile = await loadSolarProfile(location, year);
        const windProfile = await loadWindProfile(location, year);

        if (!solarProfile || !windProfile) {
            console.warn(`Missing profiles for ${location} ${year}`);
            return null;
        }

        // Run simulation with the year-specific config
        const yearConfig = {
            ...config,
            year: year,
        };

        const result = runSimulation(yearConfig);

        return {
            year,
            result,
            solarProfile: solarProfile.slice(0, 8760),
            windProfile: windProfile.slice(0, 8760),
        };
    } catch (error) {
        console.error(`Error simulating year ${year}:`, error);
        return null;
    }
}

// Compare performance across all available years
export async function compareYearlyPerformance(
    config: SimulationInputs,
    location: string,
    years?: number[]
): Promise<YearlyPerformance[]> {
    const yearsToCompare = years || getAvailableYears();
    const results: YearlyPerformance[] = [];

    for (const year of yearsToCompare) {
        const performance = await runYearSimulation(config, year, location);
        if (performance) {
            results.push(performance);
        }
    }

    return results;
}

// Calculate statistics across multiple years
export function getWeatherStatistics(performances: YearlyPerformance[]): PerformanceStats[] {
    if (performances.length === 0) return [];

    const metrics = [
        {
            key: 'cfe_percent',
            label: 'CFE Score (%)',
            accessor: (p: YearlyPerformance) => p.result.results.cfe_percent,
            higherIsBetter: true,
        },
        {
            key: 'grid_consumption',
            label: 'Grid Consumption (MWh)',
            accessor: (p: YearlyPerformance) => p.result.results.grid_consumption,
            higherIsBetter: false,
        },
        {
            key: 'avoided_emissions',
            label: 'Avoided Emissions (MT CO₂)',
            accessor: (p: YearlyPerformance) => p.result.results.avoided_emissions_mt,
            higherIsBetter: true,
        },
        {
            key: 'net_cost',
            label: 'Net REC Cost ($)',
            accessor: (p: YearlyPerformance) => p.result.results.net_rec_cost,
            higherIsBetter: false,
        },
        {
            key: 'clean_generation',
            label: 'Clean Generation (MWh)',
            accessor: (p: YearlyPerformance) => p.result.results.total_clean_generation,
            higherIsBetter: true,
        },
    ];

    return metrics.map(({ key, label, accessor, higherIsBetter }) => {
        const values = performances.map((p) => ({
            year: p.year,
            value: accessor(p),
        }));

        const nums = values.map((v) => v.value);
        const min = Math.min(...nums);
        const max = Math.max(...nums);
        const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
        const variance = nums.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / nums.length;

        const bestYear = higherIsBetter
            ? values.find((v) => v.value === max)!.year
            : values.find((v) => v.value === min)!.year;

        const worstYear = higherIsBetter
            ? values.find((v) => v.value === min)!.year
            : values.find((v) => v.value === max)!.year;

        return {
            metric: label,
            min,
            max,
            avg,
            variance,
            bestYear,
            worstYear,
        };
    });
}

// Aggregate hourly data to daily averages for visualization
export function aggregateToDaily(hourlyData: number[]): number[] {
    const daily: number[] = [];
    for (let day = 0; day < 365; day++) {
        const startHour = day * 24;
        const endHour = Math.min(startHour + 24, hourlyData.length);
        const dayData = hourlyData.slice(startHour, endHour);
        const avg = dayData.reduce((a, b) => a + b, 0) / dayData.length;
        daily.push(avg);
    }
    return daily;
}
