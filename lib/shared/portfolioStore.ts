// Portfolio configuration sharing between Aggregation and Analysis pages

import { GenerationAsset, Participant, FinancialParams } from '@/lib/aggregation/types';

export interface SharedPortfolio {
    participants: Participant[];
    assets: GenerationAsset[];
    battery: { mw: number; hours: number };
    financials: FinancialParams;
    year: number | 'Average';
    loadHub: string;
    solarHub: string;
    windHub: string;
    nuclearHub: string;
    geothermalHub: string;
    ccsHub: string;
    timestamp: number;
}

export interface Scenario extends SharedPortfolio {
    id: string;
    name: string;
    description?: string;
}

const STORAGE_KEY = 'eighty760_portfolio';
const SCENARIOS_KEY = 'eighty760_scenarios';

/**
 * Save portfolio configuration to localStorage (Quick Save)
 */
export function savePortfolio(portfolio: SharedPortfolio): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
    } catch (error) {
        console.error('Failed to save portfolio to localStorage:', error);
    }
}

/**
 * Load portfolio configuration from localStorage
 */
export function loadPortfolio(): SharedPortfolio | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error('Failed to load portfolio from localStorage:', error);
        return null;
    }
}

/**
 * Clear portfolio from localStorage
 */
export function clearPortfolio(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear portfolio from localStorage:', error);
    }
}

/**
 * Check if a portfolio exists in localStorage
 */
export function hasPortfolio(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
        return false;
    }
}

// --- Scenario Management ---

export function saveScenario(portfolio: SharedPortfolio, name: string, description?: string): Scenario {
    const scenarios = getScenarios();
    const newScenario: Scenario = {
        ...portfolio,
        id: crypto.randomUUID(),
        name,
        description,
        timestamp: Date.now()
    };

    scenarios.push(newScenario);
    localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
    return newScenario;
}

export function getScenarios(): Scenario[] {
    try {
        const stored = localStorage.getItem(SCENARIOS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Failed to load scenarios:', error);
        return [];
    }
}

export function deleteScenario(id: string): void {
    const scenarios = getScenarios().filter(s => s.id !== id);
    localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
}

export function clearScenarios(): void {
    localStorage.removeItem(SCENARIOS_KEY);
}
