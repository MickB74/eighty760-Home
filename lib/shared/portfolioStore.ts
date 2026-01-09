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

const STORAGE_KEY = 'eighty760_portfolio';

/**
 * Save portfolio configuration to localStorage
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
