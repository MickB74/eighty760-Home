'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Chart } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

import { Participant, TechCapacity, FinancialParams, SimulationResult, BatteryFinancialParams, GenerationAsset } from '@/lib/aggregation/types';
import { runAggregationSimulation } from '@/lib/aggregation/engine';
import { recommendPortfolio } from '@/lib/aggregation/optimizer';
import { generateDetailedHourlyCSV, downloadCSV, generateCSVFilename } from '@/lib/utils/csv-export';
import { loadERCOTPrices, getAvailableYears, getYearLabel, loadAveragePriceProfile, loadHubPrices } from '@/lib/aggregation/price-loader';
import ParticipantEditor from '@/components/aggregation/ParticipantEditor';
import BatteryFinancials from '@/components/aggregation/BatteryFinancials';
import ResultsHeatmap from '@/components/aggregation/ResultsHeatmap';
import Timeline8760 from '@/components/aggregation/Timeline8760';
import EnergyFlowDiagram from '@/components/aggregation/EnergyFlowDiagram';
import { calculateBatteryCVTA, BatteryCVTAResult } from '@/lib/aggregation/battery-cvta';
import AssetEditor from '@/components/aggregation/AssetEditor';
import Navigation from '@/components/Navigation';
import InfoTooltip from '@/components/shared/InfoTooltip';
import TexasHubMap from '@/components/aggregation/TexasHubMap';
import AnalysisTab from '@/components/aggregation/AnalysisTab';
import FinancialAnalysisTab from '@/components/aggregation/FinancialAnalysisTab';
import MarketDataTab from '@/components/aggregation/MarketDataTab';
import ScenarioComparisonTab from '@/components/aggregation/ScenarioComparisonTab';
import {
    loadPortfolio,
    savePortfolio,
    saveScenario,
    getScenarios,
    deleteScenario,
    clearScenarios,
    type Scenario
} from '@/lib/shared/portfolioStore';
import Link from 'next/link';

import { generatePDFReport } from '@/lib/reporting/pdf-generator';
import MultiYearAnalysisTab from '@/components/aggregation/MultiYearAnalysisTab';

// Helper: Aggregate 8760 to 12x24 (Month x Hour)
function aggregateTo12x24(data: number[]): number[][] {
    const grid = Array.from({ length: 12 }, () => Array(24).fill(0));
    const counts = Array.from({ length: 12 }, () => Array(24).fill(0));
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    data.forEach((val, i) => {
        if (i >= 8760) return;
        const hourOfDay = i % 24;
        const dayOfYear = Math.floor(i / 24);

        let month = 0;
        let d = dayOfYear;
        for (let m = 0; m < 12; m++) {
            if (d < daysInMonth[m]) {
                month = m;
                break;
            }
            d -= daysInMonth[m];
        }

        grid[month][hourOfDay] += val;
        counts[month][hourOfDay]++;
    });

    for (let m = 0; m < 12; m++) {
        for (let h = 0; h < 24; h++) {
            if (counts[m][h] > 0) grid[m][h] /= counts[m][h];
        }
    }
    return grid;
}

// Register ChartJS
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// --- Constants ---
const HISTORICAL_REC_PRICES: Record<number, number> = {
    2020: 0.78,
    2021: 1.71,
    2022: 4.88,
    2023: 3.69,
    2024: 2.77
};

// --- Component ---
export default function AggregationPage() {
    // --- State ---
    const [activeTab, setActiveTab] = useState<'dashboard' | 'scenarios' | 'analysis' | 'financials' | 'multi-year' | 'reports' | 'config' | 'market'>('config');
    const [loading, setLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // 1. Load State
    const [participants, setParticipants] = useState<Participant[]>([]);

    // 2. Gen State
    const [capacities, setCapacities] = useState<TechCapacity>({
        Solar: 0, Wind: 0, Geothermal: 0, Nuclear: 0, 'CCS Gas': 0, Battery_MW: 0, Battery_Hours: 2
    });
    const [assets, setAssets] = useState<GenerationAsset[]>([]);


    // 3. Financial State
    const [financials, setFinancials] = useState<FinancialParams>({
        solar_price: 35, wind_price: 25, geo_price: 75, nuc_price: 90, ccs_price: 85,
        rec_price: 5, market_price_avg: 35, market_year: 2024,
        use_scarcity: false, scarcity_intensity: 1.0
    });

    // 4. Price Data State
    const [selectedYear, setSelectedYear] = useState<number | 'Average'>(2024);
    const [useTMY, setUseTMY] = useState(false); // New TMY Toggle
    const [loadHub, setLoadHub] = useState<string>('North');
    // Track current hour for Energy Flow visualization (default to hour 0 = Jan 1, 1st hour)
    const [currentHour, setCurrentHour] = useState(0);
    const [solarHub, setSolarHub] = useState<string>('North');
    const [windHub, setWindHub] = useState<string>('West');
    const [nuclearHub, setNuclearHub] = useState<string>('North');
    const [geothermalHub, setGeothermalHub] = useState<string>('West');
    const [ccsHub, setCcsHub] = useState<string>('Houston');
    const [historicalPrices, setHistoricalPrices] = useState<number[] | null>(null);
    const [allHubPrices, setAllHubPrices] = useState<Record<string, number[]>>({}); // Cache for assets

    // 5. Battery Financial Params (CVTA)
    const [batteryParams, setBatteryParams] = useState<BatteryFinancialParams>({
        capacity_mw: 0,
        base_rate_monthly: 15000,      // $15k/MW-month default
        guaranteed_availability: 0.95,  // 95%
        guaranteed_rte: 0.85,           // 85%
        vom_rate: 2.5,                  // $2.5/MWh
        ancillary_type: 'Fixed',
        ancillary_input: 50000,          // $50k/month default
        cycles_per_year: 365            // Default 1 cycle per day
    });

    // 6. Technology Exclusion
    const [excludedTechs, setExcludedTechs] = useState<Set<string>>(new Set());

    const toggleTechExclusion = (tech: string) => {
        setExcludedTechs(prev => {
            const next = new Set(prev);
            if (next.has(tech)) next.delete(tech);
            else next.add(tech);
            return next;
        });
    };

    // --- Effects ---

    // Restore saved portfolio on mount
    useEffect(() => {
        const saved = loadPortfolio();
        if (saved) {
            // Restore participants
            setParticipants(saved.participants);

            // Restore assets
            setAssets(saved.assets);


            // Restore battery
            setCapacities(prev => ({
                ...prev,
                Battery_MW: saved.battery.mw,
                Battery_Hours: saved.battery.hours
            }));

            // Restore financials
            setFinancials(saved.financials);

            // Restore year and hub selections
            setSelectedYear(saved.year);
            setLoadHub(saved.loadHub);
            setSolarHub(saved.solarHub);
            setWindHub(saved.windHub);
            setNuclearHub(saved.nuclearHub);
            setGeothermalHub(saved.geothermalHub);
            setCcsHub(saved.ccsHub);
        }
    }, []); // Run once on mount


    // 7. UI State / Helpers
    const addAsset = () => {
        const newAsset: GenerationAsset = {
            id: crypto.randomUUID(),
            name: `New Asset ${assets.length + 1}`,
            type: 'Solar',
            capacity_mw: 100,
            location: 'West'
        };
        setAssets([...assets, newAsset]);
    };

    const removeAsset = (id: string) => {
        setAssets(assets.filter(a => a.id !== id));
    };

    const updateAsset = (id: string, updates: Partial<GenerationAsset>) => {
        setAssets(assets.map(a => (a.id === id ? { ...a, ...updates } : a)));
    };
    const [isLoadCollapsed, setIsLoadCollapsed] = useState(false);

    const [cvtaResult, setCvtaResult] = useState<BatteryCVTAResult | null>(null);


    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [scenarioName, setScenarioName] = useState('');
    const [scenarioDescription, setScenarioDescription] = useState('');

    // Load scenarios on mount
    useEffect(() => {
        setScenarios(getScenarios());
    }, []);

    // Results
    const [result, setResult] = useState<SimulationResult | null>(null);

    // --- Handlers ---

    const handleAddParticipant = () => {
        // Demo Logic: Add a random participant
        const id = Math.random().toString(36).substring(2, 11);
        const types: any[] = ['Data Center', 'Manufacturing', 'Office'];
        const type = types[Math.floor(Math.random() * types.length)];
        const load = type === 'Data Center' ? 250000 : (type === 'Manufacturing' ? 100000 : 50000);

        setParticipants([...participants, {
            id,
            name: `${type} ${participants.length + 1}`,
            type,
            load_mwh: load
        }]);
    };

    const handleClearParticipants = () => setParticipants([]);

    const handleInstantDemo = () => {
        // Clear and load demo scenario with random (3-6) participants
        const locations = ['North Zone', 'South Zone', 'West Zone', 'Houston', 'Coastal', 'Panhandle'];
        const types: Array<Participant['type']> = ['Data Center', 'Manufacturing', 'Office'];

        // Determine number of properties: Random int between 3 and 6
        const numProps = Math.floor(Math.random() * (6 - 3 + 1)) + 3;

        // Shuffle locations to get unique ones for the count
        const shuffledLocs = [...locations].sort(() => 0.5 - Math.random()).slice(0, numProps);

        const newParticipants: Participant[] = shuffledLocs.map((loc, i) => {
            const type = types[Math.floor(Math.random() * types.length)];
            let baseLoad = 50000;
            if (type === 'Data Center') baseLoad = 150000 + Math.random() * 100000;
            if (type === 'Manufacturing') baseLoad = 80000 + Math.random() * 50000;
            if (type === 'Office') baseLoad = 20000 + Math.random() * 20000;

            // Randomize name a bit more
            const suffixes = ['HQ', 'Facility', 'Plant', 'Campus', 'Branch', 'Hub'];
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

            return {
                id: Date.now().toString() + i,
                name: `${loc} ${type} ${suffix}`,
                type: type,
                load_mwh: Math.round(baseLoad)
            };
        });

        setParticipants(newParticipants);

        // Set portfolio for ~95% CFE
        setCapacities({
            Solar: 85,
            Wind: 60,
            'CCS Gas': 15,
            Geothermal: 0,
            Nuclear: 0,
            Battery_MW: 30,
            Battery_Hours: 4
        });

        // Set year to 2024
        setSelectedYear(2024);
    };

    const handleSmartFill = () => {
        setLoading(true);
        setTimeout(() => { // Yield to UI
            const totalLoad = participants.reduce((a, b) => a + b.load_mwh, 0);
            if (totalLoad > 0) {
                // Determine dominant type for optimization profile
                // Pass empty object for existing_capacities to force a fresh recommendation
                // matching the load, rather than getting stuck in local minima from current slider values.
                const rec = recommendPortfolio(totalLoad, 'Data Center', 0.95, {});

                // 1. Update Battery
                setCapacities(prev => ({
                    ...prev,
                    Battery_MW: rec.Battery_MW,
                    Battery_Hours: rec.Battery_Hours
                }));

                // 2. Convert Generation Caps to Assets
                const newAssets: GenerationAsset[] = [];
                const techs = ['Solar', 'Wind', 'Geothermal', 'Nuclear', 'CCS Gas'];

                techs.forEach(type => {
                    const mw = (rec as any)[type] || 0;
                    if (mw > 0) {
                        let loc: any = loadHub === 'HB_NORTH' ? 'North' : loadHub; // Default for others
                        if (type === 'Solar') loc = solarHub === 'HB_NORTH' ? 'North' : solarHub;
                        if (type === 'Wind') loc = windHub === 'HB_NORTH' ? 'North' : windHub;
                        if (type === 'Nuclear') loc = nuclearHub === 'HB_NORTH' ? 'North' : nuclearHub;
                        if (type === 'Geothermal') loc = geothermalHub === 'HB_NORTH' ? 'North' : geothermalHub;
                        if (type === 'CCS Gas') loc = ccsHub === 'HB_NORTH' ? 'North' : ccsHub;

                        newAssets.push({
                            id: crypto.randomUUID(),
                            name: `Smart Fill ${type}`,
                            type: type as GenerationAsset['type'],
                            location: loc, // Use specific hub
                            capacity_mw: mw
                        });
                    }
                });
                setAssets(newAssets);
            }
            setLoading(false);
        }, 100);
    };

    const handleLoadScenario = (scen: Scenario) => {
        setParticipants(scen.participants);
        setSelectedYear(scen.year);
        setFinancials(scen.financials);
        setLoadHub(scen.loadHub);
        setSolarHub(scen.solarHub || 'West'); // Fallback if missing in old saves
        setWindHub(scen.windHub || 'Panhandle');
        setNuclearHub(scen.nuclearHub || 'North');
        setGeothermalHub(scen.geothermalHub || 'West');
        setCcsHub(scen.ccsHub || 'Houston');

        setAssets(scen.assets);
        setAssets(scen.assets);

        // Restore battery capacities
        if (scen.battery) {
            setCapacities(prev => ({
                ...prev,
                Battery_MW: scen.battery.mw,
                Battery_Hours: scen.battery.hours
            }));
        }
    };

    // Derived state for active assets
    const activeAssets = assets;


    // UseEffect to load generation profiles (Solar/Wind) based on location and year
    const [genProfiles, setGenProfiles] = useState<Record<string, number[]>>({});

    useEffect(() => {
        const loadProfiles = async () => {
            if (typeof selectedYear !== 'number') return;

            const missingAssets = activeAssets.filter(a =>
                (a.type === 'Solar' || a.type === 'Wind') && !genProfiles[a.id]
            );

            if (missingAssets.length === 0) return;

            // Fetch missing profiles
            const newProfiles: Record<string, number[]> = {};
            const promises = missingAssets.map(async (asset) => {
                const tech = asset.type;
                let loc = asset.location;
                // Determine URL based on TMY toggle
                let url = `/data/profiles/${tech}_${loc}_${selectedYear}.json`;
                if (useTMY) {
                    url = `/data/profiles/${tech}_${loc}_TMY.json`;
                }

                try {
                    const res = await fetch(url);
                    if (res.ok) {
                        const data = await res.json();
                        newProfiles[asset.id] = data;
                    }
                } catch (e) {
                    console.error(`Failed to load profile for ${asset.name}`, e);
                }
            });

            if (promises.length > 0) {
                await Promise.all(promises);
                if (Object.keys(newProfiles).length > 0) {
                    setGenProfiles(prev => ({
                        ...prev,
                        ...newProfiles
                    }));
                }
            }
        };

        loadProfiles();
    }, [selectedYear, activeAssets, useTMY, genProfiles]);

    const runSimulation = useCallback(() => {
        setLoading(true);
        setTimeout(() => {
            // Filter excluded techs (zero out capacity) - DISABLED temporarily as we move to AssetEditor
            // With AssetEditor, we just don't pass the asset if it's inactive/deleted.
            // But for legacy compatibility with the 'Active' toggles if we add them back:
            // For now, we assume activeAssets contains what we want to run.

            const res = runAggregationSimulation(
                participants,
                activeAssets,
                {
                    ...financials,
                    // Use actual historical prices without scaling when we have historical data
                    use_actual_prices: historicalPrices !== null
                },
                historicalPrices,
                { mw: capacities.Battery_MW, hours: capacities.Battery_Hours }, // Use base capacities for battery
                allHubPrices,
                genProfiles // Pass the loaded profiles
            );
            setResult(res);

            // Calculate Battery CVTA if battery exists
            if (capacities.Battery_MW > 0 && res) {
                const cvta = calculateBatteryCVTA(
                    capacities.Battery_MW,
                    capacities.Battery_Hours,
                    res.battery_discharge,
                    res.battery_charge,
                    res.market_price_profile,
                    {
                        fixed_toll_mw_month: batteryParams.base_rate_monthly,
                        guaranteed_rte: batteryParams.guaranteed_rte,
                        vom_charge_mwh: batteryParams.vom_rate,
                        availability_factor: batteryParams.guaranteed_availability,
                        ancillary_revenue_monthly: batteryParams.ancillary_type === 'Fixed' ? batteryParams.ancillary_input : undefined,
                        ancillary_revenue_pct: batteryParams.ancillary_type === 'Dynamic' ? batteryParams.ancillary_input / 100 : undefined
                    }
                );
                setCvtaResult(cvta);

                // Update battery capacity in params for UI sync
                setBatteryParams(prev => ({ ...prev, capacity_mw: capacities.Battery_MW }));
            } else {
                setCvtaResult(null);
            }

            setLoading(false);
        }, 50);
    }, [participants, activeAssets, financials, historicalPrices, capacities.Battery_MW, capacities.Battery_Hours, allHubPrices, genProfiles, batteryParams]);

    // Load historical price data when year changes
    useEffect(() => {
        const loadPrices = async () => {
            if (selectedYear === 'Average') {
                // Use all available years for average: 2010-2025
                const allYears = Array.from({ length: 16 }, (_, i) => 2010 + i);
                const prices = await loadAveragePriceProfile(allYears);
                setHistoricalPrices(prices);

                // Calculate and update average price
                if (prices && prices.length > 0) {
                    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

                    // Logic for Average REC Price
                    const sumRec = Object.values(HISTORICAL_REC_PRICES).reduce((a, b) => a + b, 0);
                    const avgRec = sumRec / Object.values(HISTORICAL_REC_PRICES).length;

                    setFinancials(prev => ({
                        ...prev,
                        market_price_avg: parseFloat(avg.toFixed(2)),
                        rec_price: parseFloat(avgRec.toFixed(2))
                    }));
                }
                return;
            }

            let prices: number[] | null = null;
            // Load specific year and hub
            // 1. Load Global/Load Hub Price
            prices = await loadHubPrices(selectedYear, loadHub);

            // 2. Load ALL Hubs for Assets (for 2023-2025)
            // We load all hubs so that if user switches Asset Hubs, data is ready in `allHubPrices`
            const hubs = ['North', 'South', 'West', 'Houston', 'Panhandle'];
            const hubMap: Record<string, number[]> = {};
            for (const h of hubs) {
                const hubP = await loadHubPrices(selectedYear, h);
                if (hubP) hubMap[h] = hubP;
            }
            setAllHubPrices(hubMap);

            setHistoricalPrices(prices);

            // Determine REC price
            let recPrice = 2.77;
            if (typeof selectedYear === 'number' && selectedYear in HISTORICAL_REC_PRICES) {
                recPrice = HISTORICAL_REC_PRICES[selectedYear];
            }

            // Calculate and update average price across ALL hubs (User Request - Restored)
            const allHubsPrices = Object.values(hubMap);
            if (allHubsPrices.length > 0) {
                let totalSum = 0;
                let totalCount = 0;

                allHubsPrices.forEach(hPrices => {
                    if (hPrices && hPrices.length > 0) {
                        totalSum += hPrices.reduce((a, b) => a + b, 0);
                        totalCount += hPrices.length;
                    }
                });

                const avg = totalCount > 0 ? totalSum / totalCount : 0;

                setFinancials(prev => ({
                    ...prev,
                    market_price_avg: parseFloat(avg.toFixed(2)),
                    rec_price: recPrice
                }));
            } else {
                setFinancials(prev => ({ ...prev, rec_price: recPrice }));
            }
        };
        loadPrices();
    }, [selectedYear, loadHub]);

    // Memoize active assets key to avoid complex dependency warning
    const activeAssetsKey = useMemo(() => {
        return JSON.stringify(activeAssets.map(a => ({
            id: a.id,
            capacity_mw: a.capacity_mw,
            location: a.location,
            type: a.type,
            capacity_factor: a.capacity_factor
        })));
    }, [activeAssets]);

    // Run sim when key inputs change (debounced to avoid excessive re-renders)
    useEffect(() => {
        if (participants.length === 0) {
            setResult(null);
            return;
        }

        const timeoutId = setTimeout(() => {
            runSimulation();
        }, 150); // 150ms debounce

        return () => clearTimeout(timeoutId);
    }, [
        // Participants (watch the array itself for load changes)
        JSON.stringify(participants),
        // Assets (watch activeAssetsKey which changes when assets change)
        activeAssetsKey,
        // Battery
        capacities.Battery_MW,
        capacities.Battery_Hours,
        // Financials - all properties that affect calculation
        financials.solar_price,
        financials.wind_price,
        financials.geo_price,
        financials.nuc_price,
        financials.ccs_price,
        financials.rec_price,
        financials.market_price_avg,
        financials.market_year, // Added - was missing!
        financials.use_scarcity,
        financials.scarcity_intensity,
        // Price data
        selectedYear,  // Trigger re-sim when year changes
        historicalPrices,
        allHubPrices,
        genProfiles,
        // Function
        runSimulation
    ]);

    // Save portfolio to localStorage when simulation completes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            savePortfolio({
                participants,
                assets: activeAssets,
                battery: { mw: capacities.Battery_MW, hours: capacities.Battery_Hours },
                financials,
                year: selectedYear,
                loadHub,
                solarHub,
                windHub,
                nuclearHub,
                geothermalHub,
                ccsHub,
                timestamp: Date.now()
            });
        }, 500); // Debounce save

        return () => clearTimeout(timeoutId);
    }, [result, participants, activeAssets, capacities, financials, selectedYear, loadHub, solarHub, windHub, nuclearHub, geothermalHub, ccsHub]);

    // --- Export Handlers ---

    const handleDownloadCSV = () => {
        if (!result) return;

        // Use the shared helper which now includes Date/Time and Portfolio Summary
        const csvContent = generateDetailedHourlyCSV(result, financials, selectedYear, activeAssets, allHubPrices);
        const filename = generateCSVFilename('detailed_results', selectedYear);
        downloadCSV(csvContent, filename);
    };

    const handleDownloadPDF = async () => {
        if (!result) return;

        const { generateComprehensivePDFReport } = await import('@/lib/reporting/pdf-generator');

        generateComprehensivePDFReport({
            scenarioName: 'Portfolio Analysis',
            results: result,
            year: selectedYear,
            participants: participants,
            assets: activeAssets,
            charts: {} // TODO: Capture charts in future enhancement
        });
    };


    // --- Render ---

    return (
        <main className="min-h-screen bg-white dark:bg-navy-950 transition-colors duration-300">
            <Navigation />

            {/* Main Content Container - Flattened */}
            <div className="w-full max-w-[1800px] mx-auto p-4 lg:p-6 pb-24">





                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold brand-text">ERCOT Aggregation</h1>
                        <p className="text-gray-700 dark:text-gray-300">24/7 CFE Portfolio Optimization</p>
                    </div>
                    <div className="flex gap-2">
                        {scenarios.length > 0 && (
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to clear all scenarios?')) {
                                        clearScenarios();
                                        setScenarios([]);
                                    }
                                }}
                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-md transition font-medium text-sm"
                            >
                                Clear Scenarios
                            </button>
                        )}
                        <button
                            onClick={() => {
                                const date = new Date();
                                setScenarioName(`Scenario - ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
                                setShowSaveModal(true);
                            }}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-navy-950 dark:text-white rounded-md transition font-medium text-sm flex items-center gap-2"
                        >
                            💾 Save Scenario
                        </button>
                        <button
                            onClick={handleInstantDemo}
                            className="px-4 py-2 bg-energy-green dark:bg-energy-green text-navy-950 rounded-md hover:opacity-90 transition font-medium shadow-sm text-sm"
                        >
                            ⚡ Load Demo
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="sticky top-[112px] md:top-[132px] z-40 bg-gray-50 dark:bg-navy-950 flex border-b border-gray-200 dark:border-white/10 mb-8 overflow-x-auto pt-2">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'config' ? 'border-energy-green-dark dark:border-energy-green text-energy-green-dark dark:text-energy-green' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Configuration
                    </button>
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'border-energy-green-dark dark:border-energy-green text-energy-green-dark dark:text-energy-green' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Dashboard
                    </button>

                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'analysis' ? 'border-energy-green-dark dark:border-energy-green text-energy-green-dark dark:text-energy-green' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <span className="mr-2">📈</span>Detailed Analysis
                    </button>
                    <button
                        onClick={() => setActiveTab('financials')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'financials' ? 'border-energy-green-dark dark:border-energy-green text-energy-green-dark dark:text-energy-green' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <span className="mr-2">💰</span>Financial Analysis
                    </button>
                    <button
                        onClick={() => setActiveTab('multi-year')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'multi-year' ? 'border-energy-green-dark dark:border-energy-green text-energy-green-dark dark:text-energy-green' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <span className="mr-2">📊</span>Multi-Year
                    </button>
                    <button
                        onClick={() => setActiveTab('scenarios')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'scenarios' ? 'border-energy-green-dark dark:border-energy-green text-energy-green-dark dark:text-energy-green' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Scenario Comparison
                    </button>
                    <button
                        onClick={() => setActiveTab('market')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'market' ? 'border-energy-green-dark dark:border-energy-green text-energy-green-dark dark:text-energy-green' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <span className="mr-2">⚡</span>Live Market
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'reports' ? 'border-energy-green-dark dark:border-energy-green text-energy-green-dark dark:text-energy-green' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Reports & export
                    </button>
                </div>

                {/* Save Scenario Modal (Preserved) */}
                {showSaveModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-navy-950 p-6 rounded-xl border border-white/10 shadow-2xl w-full max-w-md">
                            <h3 className="text-xl font-bold mb-4 text-navy-950 dark:text-white">Save Scenario</h3>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                    <input
                                        type="text"
                                        placeholder="Scenario Name (e.g. High Solar Case)"
                                        value={scenarioName}
                                        onChange={(e) => setScenarioName(e.target.value)}
                                        className="w-full p-2 rounded border border-gray-300 dark:border-white/20 bg-transparent text-navy-950 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <textarea
                                        placeholder="Add a brief description..."
                                        value={scenarioDescription}
                                        onChange={(e) => setScenarioDescription(e.target.value)}
                                        rows={3}
                                        className="w-full p-2 rounded border border-gray-300 dark:border-white/20 bg-transparent text-navy-950 dark:text-white resize-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setShowSaveModal(false);
                                        setScenarioDescription('');
                                    }}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (scenarioName) {
                                            saveScenario({
                                                participants,
                                                assets: activeAssets,
                                                battery: { mw: capacities.Battery_MW, hours: capacities.Battery_Hours },
                                                financials,
                                                year: selectedYear,
                                                loadHub,
                                                solarHub,
                                                windHub,
                                                nuclearHub,
                                                geothermalHub,
                                                ccsHub,
                                                timestamp: Date.now()
                                            }, scenarioName, scenarioDescription);
                                            setScenarios(getScenarios());
                                            setShowSaveModal(false);
                                            setScenarioName('');
                                            setScenarioDescription('');
                                        }
                                    }}
                                    className="px-4 py-2 bg-energy-green text-navy-950 rounded font-medium"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* CONFIGURATION TAB CONTENT */}
                {activeTab === 'config' && (
                    <div className="animate-in fade-in duration-300 space-y-8">

                        {/* 1. LOAD CONFIGURATION */}
                        <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-navy-950 dark:text-white flex items-center gap-2">
                                    <span className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">1</span>
                                    Load Configuration
                                </h3>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Total Load: <span className="text-navy-950 dark:text-white font-bold ml-1">{(participants.reduce((a, b) => a + b.load_mwh, 0)).toLocaleString()} MWh</span>
                                </span>
                            </div>

                            <ParticipantEditor
                                participants={participants}
                                onChange={setParticipants}
                            />
                        </div>

                        {/* 2. REGION & MARKET SETTINGS */}
                        <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-navy-950 dark:text-white flex items-center gap-2">
                                    <span className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">2</span>
                                    Region & Pricing
                                </h3>
                                <button
                                    onClick={handleSmartFill}
                                    className="text-xs bg-energy-green text-navy-950 px-3 py-1.5 rounded-lg border border-energy-green/20 hover:bg-energy-green/90 transition-colors font-bold shadow-sm flex items-center gap-2"
                                >
                                    ✨ Smart Fill
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Left Col: Year, Hub, Map (Cols 1-5) */}
                                <div className="lg:col-span-5 space-y-6">
                                    <div className="mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Simulated Year</label>
                                            <select
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(e.target.value === 'Average' ? 'Average' : parseInt(e.target.value))}
                                                className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-navy-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-energy-green text-sm"
                                            >
                                                <option value="Average" className="bg-white dark:bg-navy-950">{getYearLabel('Average')}</option>
                                                {getAvailableYears().map(year => (
                                                    <option key={year} value={year} className="bg-white dark:bg-navy-950">{getYearLabel(year)}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/5">
                                        <input
                                            type="checkbox"
                                            id="useTMY"
                                            checked={useTMY}
                                            onChange={(e) => setUseTMY(e.target.checked)}
                                            className="rounded border-gray-300 text-energy-green focus:ring-energy-green"
                                        />
                                        <div className="flex-1">
                                            <label htmlFor="useTMY" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer select-none block">
                                                Use TMY Generation
                                            </label>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Uses averaged 2020-2025 weather profiles.</p>
                                        </div>
                                    </div>

                                    {/* Map Visualization */}
                                    <div className="flex justify-center p-4 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/5">
                                        <TexasHubMap
                                            className="w-full max-w-[220px]"
                                            selectedHub={loadHub === 'HB_NORTH' ? 'North' : (loadHub === 'HB_SOUTH' ? 'South' : (loadHub === 'HB_WEST' ? 'West' : (loadHub === 'HB_HOUSTON' ? 'Houston' : (loadHub === 'HB_PAN' ? 'Panhandle' : loadHub))))}
                                            onHubSelect={(hub) => setLoadHub(hub)}
                                        />
                                    </div>
                                </div>

                                {/* Right Col: Default Locations & Financials (Cols 6-12) */}
                                <div className="lg:col-span-7 space-y-6">


                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Financial Assumptions</h4>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="text-xs text-gray-700 dark:text-gray-300 block mb-1">REC Price ($)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                    <input
                                                        type="number"
                                                        className="w-full pl-6 p-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-950 text-sm"
                                                        value={financials.rec_price}
                                                        onChange={(e) => setFinancials({ ...financials, rec_price: parseFloat(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-700 dark:text-gray-300 block mb-1">Avg Market Price ($)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                    <input
                                                        type="number"
                                                        className="w-full pl-6 p-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-950 text-sm"
                                                        value={Number(financials.market_price_avg).toFixed(2)}
                                                        onChange={(e) => setFinancials({ ...financials, market_price_avg: parseFloat(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* SCARCITY SIMULATOR */}
                                        <div className="mb-4 p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                    <span className="text-red-500">⚡</span>
                                                    Scarcity Pricing
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">{financials.use_scarcity ? 'Active' : 'Disabled'}</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={financials.use_scarcity || false}
                                                        onChange={(e) => setFinancials(prev => ({ ...prev, use_scarcity: e.target.checked }))}
                                                        className="toggle-checkbox rounded border-gray-300 text-energy-green focus:ring-energy-green"
                                                    />
                                                </div>
                                            </div>

                                            {financials.use_scarcity && (
                                                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-gray-500">REC Cost Adjuster</span>
                                                        <span className="font-bold text-red-500">{financials.scarcity_intensity?.toFixed(1) || '1.0'}x</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="10"
                                                        step="0.1"
                                                        value={financials.scarcity_intensity || 1.0}
                                                        onChange={(e) => setFinancials(prev => ({ ...prev, scarcity_intensity: parseFloat(e.target.value) }))}
                                                        className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                                                    />
                                                    <p className="text-[10px] text-gray-400 mt-1 mb-3">
                                                        Simulates price spikes during grid stress events (Winter, Summer peaks).
                                                    </p>

                                                    {/* Scarcity Timing Metrics */}
                                                    <div className="grid grid-cols-2 gap-2 mt-2 border-t border-white/5 pt-2">
                                                        {[
                                                            { label: 'Winter Super Peak', color: 'red', hrs: 270, mult: 2.0, time: 'Jan/Feb/Dec (6-9 PM)' },
                                                            { label: 'Winter Morning', color: 'orange', hrs: 270, mult: 1.4, time: 'Jan/Feb/Dec (6-9 AM)' },
                                                            { label: 'Evening Peak', color: 'yellow', hrs: 1555, mult: 1.2, time: 'All Year (5-10 PM)' },
                                                            { label: 'Solar Oversupply', color: 'blue', hrs: 610, mult: 0.45, time: 'Jun-Sep (10 AM-3 PM)' },
                                                        ].map((item, idx) => {
                                                            const intensity = financials.scarcity_intensity || 1.0;
                                                            const finalMult = Math.max(0, 1.0 + (item.mult - 1.0) * intensity);
                                                            const effectivePrice = financials.rec_price * finalMult;
                                                            return (
                                                                <div key={idx} className={`bg-${item.color}-500/10 p-2 rounded border border-${item.color}-500/20`}>
                                                                    <div className={`text-[10px] text-${item.color === 'blue' ? 'blue-400' : `${item.color}-500`} font-bold uppercase`}>{item.label}</div>
                                                                    <div className="flex justify-between items-baseline mb-0.5">
                                                                        <div className="text-sm font-mono text-gray-200">{item.hrs} hrs</div>
                                                                        <div className="text-xs font-bold text-white">${effectivePrice.toFixed(2)}</div>
                                                                    </div>
                                                                    <div className="text-[9px] text-gray-400">{item.time}</div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <details className="text-sm group">
                                            <summary className="font-medium cursor-pointer text-energy-green hover:text-energy-green-dark transition-colors flex items-center gap-2 select-none">
                                                <span>Advanced PPA Pricing</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </summary>
                                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-black/20 rounded-lg border border-gray-200 dark:border-white/5">
                                                {(['solar', 'wind', 'ccs', 'geo', 'nuc'] as const).map(tech => (
                                                    <div key={tech} className="flex flex-col">
                                                        <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{tech}</label>
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">$</span>
                                                            <input
                                                                type="number"
                                                                className="w-full pl-4 p-1 rounded border border-white/10 bg-white dark:bg-navy-950 text-xs"
                                                                value={(financials as any)[`${tech}_price`]}
                                                                onChange={(e) => setFinancials({ ...financials, [`${tech}_price`]: parseFloat(e.target.value) })}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>

                                        <details className="text-sm group mt-4">
                                            <summary className="font-medium cursor-pointer text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-2 select-none">
                                                <span>Battery CVTA Assumptions</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </summary>
                                            <div className="mt-3 grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-black/20 rounded-lg border border-gray-200 dark:border-white/5">
                                                <div>
                                                    <label className="text-[10px] uppercase text-gray-500 mb-1">Base Rate ($/MW-mo)</label>
                                                    <input
                                                        type="number"
                                                        className="w-full p-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-950 text-xs"
                                                        value={batteryParams.base_rate_monthly}
                                                        onChange={(e) => setBatteryParams({ ...batteryParams, base_rate_monthly: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase text-gray-500 mb-1">Variable O&M ($/MWh)</label>
                                                    <input
                                                        type="number"
                                                        className="w-full p-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-950 text-xs"
                                                        value={batteryParams.vom_rate}
                                                        onChange={(e) => setBatteryParams({ ...batteryParams, vom_rate: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase text-gray-500 mb-1">Guaranteed RTE (%)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="w-full p-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-950 text-xs"
                                                        value={batteryParams.guaranteed_rte}
                                                        onChange={(e) => setBatteryParams({ ...batteryParams, guaranteed_rte: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase text-gray-500 mb-1">Availability (%)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="w-full p-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-950 text-xs"
                                                        value={batteryParams.guaranteed_availability}
                                                        onChange={(e) => setBatteryParams({ ...batteryParams, guaranteed_availability: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase text-gray-500 mb-1">Ancillary Rev ($/mo)</label>
                                                    <input
                                                        type="number"
                                                        className="w-full p-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-950 text-xs"
                                                        value={batteryParams.ancillary_input}
                                                        onChange={(e) => setBatteryParams({ ...batteryParams, ancillary_input: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase text-gray-500 mb-1">Max Cycles / Year</label>
                                                    <input
                                                        type="number"
                                                        className="w-full p-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-950 text-xs"
                                                        value={batteryParams.cycles_per_year || 365}
                                                        onChange={(e) => setBatteryParams({ ...batteryParams, cycles_per_year: Number(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                        </details>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. ASSET CONFIGURATION */}
                        <div className="bg-white dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-navy-950 dark:text-white flex items-center gap-2">
                                    <span className="p-2 bg-energy-green/10 text-energy-green-dark dark:text-energy-green rounded-lg">3</span>
                                    Asset Portfolio
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {/* Advanced Asset List */}
                                <div className="space-y-3">
                                    {assets.length === 0 && (
                                        <div className="text-center p-8 bg-gray-50 dark:bg-black/20 rounded-lg border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-500">
                                            <p className="mb-2">No assets added yet.</p>
                                            <p className="text-sm">Add generation assets to build your portfolio.</p>
                                        </div>
                                    )}

                                    {assets.map(asset => (
                                        <div key={asset.id} className="bg-gray-50 dark:bg-black/20 rounded-lg border border-gray-200 dark:border-white/5 overflow-hidden">
                                            <div className="flex flex-wrap items-center gap-3 p-3">
                                                <div className="flex-1 min-w-[150px]">
                                                    <input
                                                        type="text"
                                                        value={asset.name}
                                                        onChange={(e) => updateAsset(asset.id, { name: e.target.value })}
                                                        className="w-full bg-transparent border-none focus:ring-0 font-medium text-navy-950 dark:text-white placeholder-gray-400"
                                                        placeholder="Asset Name"
                                                    />
                                                </div>
                                                <select
                                                    value={asset.type}
                                                    onChange={(e) => updateAsset(asset.id, { type: e.target.value as any })}
                                                    className="bg-white dark:bg-navy-900 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-sm"
                                                >
                                                    <option value="Solar">Solar</option>
                                                    <option value="Wind">Wind</option>
                                                    <option value="Nuclear">Nuclear</option>
                                                    <option value="Geothermal">Geothermal</option>
                                                    <option value="CCS Gas">Gas + CCS</option>
                                                </select>
                                                <select
                                                    value={asset.location}
                                                    onChange={(e) => updateAsset(asset.id, { location: e.target.value as any })}
                                                    className="bg-white dark:bg-navy-900 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-sm w-32"
                                                >
                                                    {['North', 'South', 'West', 'Houston', 'Panhandle'].map(h => (
                                                        <option key={h} value={h}>{h}</option>
                                                    ))}
                                                </select>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={asset.capacity_mw}
                                                        onChange={(e) => updateAsset(asset.id, { capacity_mw: Number(e.target.value) })}
                                                        className="w-20 bg-white dark:bg-navy-900 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-sm text-right"
                                                    />
                                                    <span className="text-xs text-gray-500">MW</span>
                                                </div>
                                                <button
                                                    onClick={() => removeAsset(asset.id)}
                                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                    title="Remove Asset"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <div className="px-3 pb-2 -mt-1">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="2000"
                                                    step="10"
                                                    value={asset.capacity_mw}
                                                    onChange={(e) => updateAsset(asset.id, { capacity_mw: Number(e.target.value) })}
                                                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700
                                                            ${asset.type === 'Solar' ? 'accent-energy-green' :
                                                            asset.type === 'Wind' ? 'accent-blue-500' :
                                                                asset.type === 'Nuclear' ? 'accent-emerald-500' :
                                                                    asset.type === 'Geothermal' ? 'accent-orange-500' : 'accent-indigo-500'}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={addAsset}
                                        className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-lg text-gray-500 hover:border-energy-green hover:text-energy-green transition-colors text-sm font-medium"
                                    >
                                        + Add Asset
                                    </button>
                                </div>

                                {/* Advanced Battery Separate */}
                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
                                    <h4 className="font-semibold text-navy-950 dark:text-white mb-4">Battery Storage</h4>
                                    <div className="flex gap-4 items-center">
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Capacity</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={capacities.Battery_MW}
                                                    onChange={(e) => setCapacities(p => ({ ...p, Battery_MW: parseFloat(e.target.value) }))}
                                                    step="0.01"
                                                    className="w-full bg-white dark:bg-navy-900 border border-gray-200 dark:border-white/10 rounded px-3 py-2"
                                                />
                                                <span className="text-sm font-medium">MW</span>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Duration</label>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={capacities.Battery_Hours}
                                                    onChange={(e) => setCapacities(p => ({ ...p, Battery_Hours: parseInt(e.target.value) }))}
                                                    className="w-full bg-white dark:bg-navy-900 border border-gray-200 dark:border-white/10 rounded px-3 py-2"
                                                >
                                                    <option value={1}>1 Hour</option>
                                                    <option value={2}>2 Hours</option>
                                                    <option value={4}>4 Hours</option>
                                                    <option value={8}>8 Hours</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )
                }


                {/* DASHBOARD CONTENT */}
                {
                    activeTab === 'dashboard' && (
                        <>
                            {result ? (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    {/* KPI Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-4">
                                        <KPICard label="24/7 Score" value={(result.cfe_score * 100).toFixed(1) + '%'} sub="Hourly Match" />
                                        <KPICard label="Total Load" value={result.total_load_mwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub="MWh Annual" />
                                        <KPICard label="Annual Match" value={(result.total_load_mwh > 0 ? (result.total_gen_mwh / result.total_load_mwh * 100).toFixed(0) : '0') + '%'} sub="Gen / Load" />
                                        <KPICard label="Grid Deficit" value={(result.total_load_mwh - result.total_matched_mwh).toLocaleString(undefined, { maximumFractionDigits: 0 })} sub="MWh Unmatched" />
                                        <KPICard label="Overgeneration" value={result.surplus_profile.reduce((a, b) => a + b, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} sub="MWh Excess" />
                                        <KPICard label="Clean Gen" value={result.total_gen_mwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} sub="MWh Annual" />
                                        <KPICard label="Net Cost" value={'$' + (result.avg_cost_per_mwh).toFixed(2)} sub="per MWh Load" />
                                    </div>

                                    {/* Interactive Visualizations */}
                                    <div className="grid lg:grid-cols-2 gap-6 mb-8">
                                        <Timeline8760
                                            loadProfile={result.load_profile}
                                            matchedProfile={result.matched_profile}
                                            solarGen={result.solar_profile}
                                            windGen={result.wind_profile}
                                            nuclearGen={result.nuc_profile}
                                            batteryDischarge={result.battery_discharge}
                                            onHourChange={(hour) => setCurrentHour(hour)}
                                        />
                                        <EnergyFlowDiagram
                                            hour={currentHour}
                                            solar={result.solar_profile[currentHour] || 0}
                                            wind={result.wind_profile[currentHour] || 0}
                                            nuclear={result.nuc_profile[currentHour] || 0}
                                            geothermal={result.geo_profile[currentHour] || 0}
                                            ccs={result.ccs_profile[currentHour] || 0}
                                            battery={result.battery_discharge[currentHour] || 0}
                                            load={result.load_profile[currentHour] || 0}
                                            gridDeficit={Math.max(0, (result.load_profile[currentHour] || 0) - (result.matched_profile[currentHour] || 0))}
                                            surplus={result.surplus_profile[currentHour] || 0}
                                        />
                                    </div>

                                    {/* Chart */}
                                    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 shadow-sm h-[500px]">
                                        <h3 className="text-sm font-medium mb-4">Generation vs Load (Full Year)</h3>
                                        <GenChart result={result} capacities={capacities} />
                                    </div>

                                    {/* Financial Summary Table */}
                                    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 shadow-sm">
                                        <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
                                        {/* Table Content */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <tbody>

                                                    <tr className="border-b border-white/10">
                                                        <td className="py-3 font-medium flex items-center gap-2">
                                                            Net Settlement Value (PPA vs Market)
                                                            <InfoTooltip text="(Generation × Asset Hub Price) - (Generation × Strike Price)" />
                                                        </td>
                                                        <td className={`py-3 text-right font-medium ${result.settlement_value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                            {result.settlement_value >= 0 ? '+' : '-'}${Math.abs(result.settlement_value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b border-white/10">
                                                        <td className="py-3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                            REC Income (Surplus)
                                                            <InfoTooltip text="Revenue from selling RECs for Surplus Generation (Surplus × REC Price)" />
                                                        </td>
                                                        <td className="py-3 text-right text-green-600">+${result.rec_income.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                    </tr>
                                                    <tr className="border-b border-white/10">
                                                        <td className="py-3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                            REC Cost (Deficit)
                                                            <InfoTooltip text="Cost to purchase RECs for Unmatched Load (Deficit × REC/Scarcity Price)" />
                                                        </td>
                                                        <td className="py-3 text-right text-red-500">-${result.rec_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                    </tr>
                                                    <tr className="border-b border-white/10">
                                                        <td className="py-3 font-medium text-lg flex items-center gap-2">
                                                            Net Portfolio Cashflow
                                                            <InfoTooltip text="Net Value of PPA Settlement + Net REC Value" />
                                                        </td>
                                                        <td className={`py-3 text-right font-bold text-lg ${(result.settlement_value + result.rec_income - result.rec_cost) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                            {(result.settlement_value + result.rec_income - result.rec_cost) >= 0 ? '+' : '-'}${Math.abs(result.settlement_value + result.rec_income - result.rec_cost).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                            Net Cashflow ($/MWh)
                                                            <InfoTooltip text="Net Portfolio Cashflow / Total Annual Load" />
                                                        </td>
                                                        <td className={`py-3 text-right ${(result.settlement_value + result.rec_income - result.rec_cost) / (result.total_load_mwh || 1) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                            {((result.settlement_value + result.rec_income - result.rec_cost) / (result.total_load_mwh || 1)).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>

                                        </div>
                                    </div>
                                </div>

                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400 border-2 border-dashed border-white/10 rounded-xl">
                                    <div className="text-5xl mb-4">📊</div>
                                    <p className="text-lg font-medium">Add Participants to Begin Simulation</p>
                                    <p className="text-sm">Configure load participants above or click &quot;Load Demo&quot; to start.</p>
                                </div>
                            )}
                        </>
                    )
                }



                {
                    activeTab === 'analysis' && (
                        <AnalysisTab result={result} />
                    )
                }

                {
                    activeTab === 'financials' && result && (
                        <FinancialAnalysisTab result={result} cvtaResult={cvtaResult} />
                    )
                }

                {
                    activeTab === 'multi-year' && (
                        <MultiYearAnalysisTab
                            participants={participants}
                            assets={activeAssets}
                            financials={financials}
                            battery={{ mw: capacities.Battery_MW, hours: capacities.Battery_Hours }}
                            loadHub={loadHub}
                            solarHub={solarHub}
                            windHub={windHub}
                            nuclearHub={nuclearHub}
                            geothermalHub={geothermalHub}
                            ccsHub={ccsHub}
                        />
                    )
                }

                {
                    activeTab === 'scenarios' && (
                        <div className="animate-in fade-in duration-300">
                            <ScenarioComparisonTab
                                scenarios={scenarios}
                                onLoadScenario={(s) => {
                                    handleLoadScenario(s);
                                    setActiveTab('dashboard');
                                }}
                            />
                        </div>
                    )
                }

                {
                    activeTab === 'market' && (
                        <div className="animate-in fade-in duration-300">
                            <MarketDataTab />
                        </div>
                    )
                }

                {
                    activeTab === 'reports' && (
                        <div className="animate-in fade-in duration-300">
                            <div className="max-w-4xl mx-auto space-y-8">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold text-navy-950 dark:text-white mb-2">Reports & Exports</h2>
                                    <p className="text-gray-600 dark:text-gray-400">Download simulation data and generate professional PDF reports.</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* PDF Report Card */}
                                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors group">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 bg-red-500/10 rounded-lg text-red-500 text-2xl group-hover:scale-110 transition-transform">
                                                📄
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">Simulation Report (PDF)</h3>
                                        <p className="text-gray-400 text-sm mb-6">
                                            Generate a professional PDF report containing scenario metrics, charts, and financial analysis. Ideal for stakeholder presentations.
                                        </p>
                                        <button
                                            onClick={handleDownloadPDF}
                                            disabled={!result}
                                            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                        >
                                            {!result ? 'Run Simulation First' : 'Generate PDF Report'}
                                        </button>
                                    </div>

                                    {/* CSV Data Card */}
                                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors group">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 bg-green-500/10 rounded-lg text-green-500 text-2xl group-hover:scale-110 transition-transform">
                                                📊
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">Raw Data Export (CSV)</h3>
                                        <p className="text-gray-400 text-sm mb-6">
                                            Download the full 8760-hourly dataset including load, generation profiles, and financial settlements for custom analysis.
                                        </p>
                                        <button
                                            onClick={handleDownloadCSV}
                                            disabled={!result}
                                            className="w-full py-3 bg-energy-green text-navy-950 font-bold rounded-lg hover:bg-energy-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {!result ? 'Run Simulation First' : 'Download CSV Data'}
                                        </button>
                                    </div>

                                    {!result && (
                                        <div className="md:col-span-2 text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500 text-sm">
                                            ⚠️ Please run a simulation on the Dashboard to generate data for reports.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

            </div >
        </main >
    );
}

// --- Subcomponents ---

function KPICard({ label, value, sub }: { label: string, value: string, sub: string }) {
    return (
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 shadow-sm">
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</div>
            <div className="text-2xl font-bold text-energy-green mb-1">{value}</div>
            <div className="text-xs text-slate-400">{sub}</div>
        </div>
    );
}

function LoadChart({ result }: { result: SimulationResult }) {
    // Sample first week (168 hours)
    const hours = Array.from({ length: 168 }, (_, i) => i);
    const data = {
        labels: hours,
        datasets: [{
            label: 'Total Load',
            data: result.load_profile.slice(0, 168),
            borderColor: '#285477',
            backgroundColor: 'rgba(40, 84, 119, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };
    return <Chart type='line' data={data} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, elements: { point: { radius: 0 } } }} />;
}

function GenChart({ result }: { result: SimulationResult, capacities: TechCapacity }) {
    // Aggregate hourly data to daily averages for full year visualization
    const aggregateToDaily = (hourlyData: number[]) => {
        const daily: number[] = [];
        for (let day = 0; day < 365; day++) {
            const startHour = day * 24;
            const endHour = Math.min(startHour + 24, hourlyData.length);
            const dayTotal = hourlyData.slice(startHour, endHour).reduce((a, b) => a + b, 0);
            daily.push(dayTotal / (endHour - startHour)); // Average MW for the day
        }
        return daily;
    };

    const days = Array.from({ length: 365 }, (_, i) => i + 1);

    // Aggregate each technology to daily averages
    const solar = aggregateToDaily(result.solar_profile);
    const wind = aggregateToDaily(result.wind_profile);
    const geo = aggregateToDaily(result.geo_profile);
    const nuc = aggregateToDaily(result.nuc_profile);
    const ccs = aggregateToDaily(result.ccs_profile);
    const battery = aggregateToDaily(result.battery_discharge);
    const deficit = aggregateToDaily(result.deficit_profile);

    const data = {
        labels: days,
        datasets: [
            {
                label: 'Solar',
                data: solar,
                backgroundColor: '#fbbf24', // Amber/Gold
                fill: true,
                pointRadius: 0
            },
            {
                label: 'Wind',
                data: wind,
                backgroundColor: '#60a5fa', // Sky Blue
                fill: true,
                pointRadius: 0
            },
            {
                label: 'CCS Gas',
                data: ccs,
                backgroundColor: '#a78bfa', // Purple
                fill: true,
                pointRadius: 0
            },
            {
                label: 'Geothermal',
                data: geo,
                backgroundColor: '#f97316', // Orange
                fill: true,
                pointRadius: 0
            },
            {
                label: 'Nuclear',
                data: nuc,
                backgroundColor: '#22c55e', // Green
                fill: true,
                pointRadius: 0
            },
            {
                label: 'Battery Discharge',
                data: battery,
                backgroundColor: '#3b82f6', // Blue
                fill: true,
                pointRadius: 0
            },
            {
                label: 'Grid Deficit',
                data: deficit,
                backgroundColor: '#ef4444', // Red
                fill: true,
                pointRadius: 0
            }
        ]
    };

    return <Chart type='line' data={data} options={{
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                stacked: true,
                title: { display: true, text: 'Average MW' }
            },
            x: {
                title: { display: true, text: 'Day of Year' },
                ticks: { maxTicksLimit: 12 }
            }
        },
        elements: { line: { borderWidth: 0 } },
        layout: {
            padding: {
                top: 0,
                bottom: 20,
                left: 0,
                right: 0
            }
        },
        plugins: {
            tooltip: { mode: 'index', intersect: false },
            legend: {
                display: true,
                position: 'top',
                align: 'end',
                labels: {
                    boxWidth: 12,
                    font: { size: 11 },
                    padding: 15,
                    color: '#9ca3af' // gray-400
                }
            }
        }
    }} />;
}



function MonthlyProductionChart({ result }: { result: SimulationResult }) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Aggregation Logic
    const monthlyLoad = new Array(12).fill(0);
    const monthlySolar = new Array(12).fill(0);
    const monthlyWind = new Array(12).fill(0);
    const monthlyNuc = new Array(12).fill(0);
    const monthlyGeo = new Array(12).fill(0);
    const monthlyCcs = new Array(12).fill(0);
    const monthlyBattery = new Array(12).fill(0);

    // Map each hour to its correct calendar month
    // Days in each month for non-leap year (standard 8760 hours)
    const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const hoursPerMonth = daysPerMonth.map(d => d * 24);
    const monthBoundaries = [0];
    for (let m = 0; m < 12; m++) {
        monthBoundaries.push(monthBoundaries[m] + hoursPerMonth[m]);
    }

    for (let i = 0; i < 8760; i++) {
        // Find which month this hour belongs to
        let month = 0;
        for (let m = 0; m < 12; m++) {
            if (i >= monthBoundaries[m] && i < monthBoundaries[m + 1]) {
                month = m;
                break;
            }
        }

        monthlyLoad[month] += result.load_profile[i] || 0;
        monthlySolar[month] += result.solar_profile[i] || 0;
        monthlyWind[month] += result.wind_profile[i] || 0;
        monthlyNuc[month] += result.nuc_profile[i] || 0;
        monthlyGeo[month] += result.geo_profile[i] || 0;
        monthlyCcs[month] += result.ccs_profile[i] || 0;
        monthlyBattery[month] += result.battery_discharge[i] || 0;
    }

    const data = {
        labels: months,
        datasets: [
            {
                type: 'line' as const,
                label: 'Load',
                data: monthlyLoad,
                borderColor: '#ffffff',
                borderWidth: 2,
                pointRadius: 2,
                tension: 0.1,
                order: 0
            },
            { label: 'Solar', data: monthlySolar, backgroundColor: '#facc15', stack: 'gen' },
            { label: 'Wind', data: monthlyWind, backgroundColor: '#3b82f6', stack: 'gen' },
            { label: 'Nuclear', data: monthlyNuc, backgroundColor: '#ec4899', stack: 'gen' },
            { label: 'Geothermal', data: monthlyGeo, backgroundColor: '#f97316', stack: 'gen' },
            { label: 'CCS Gas', data: monthlyCcs, backgroundColor: '#a8a29e', stack: 'gen' },
            { label: 'Battery', data: monthlyBattery, backgroundColor: '#818cf8', stack: 'gen' },
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { stacked: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#9ca3af' } },
            y: { stacked: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#9ca3af' }, title: { display: true, text: 'Energy (MWh)', color: '#9ca3af' } }
        },
        plugins: {
            legend: { labels: { color: '#e5e7eb' }, position: 'top' as const, align: 'end' as const },
            tooltip: { mode: 'index' as const, intersect: false }
        },
        interaction: { mode: 'nearest' as const, axis: 'x' as const, intersect: false }
    };

    return <Chart type="bar" data={data} options={{ responsive: true, maintainAspectRatio: false }} />;
}

function MonthlyFinancialChart({ result }: { result: SimulationResult }) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Aggregation Logic
    const monthlyCost = new Array(12).fill(0);
    const monthlySettlement = new Array(12).fill(0);

    // This requires calculating costs hourly again if valid profiles aren't available in result for monthly.
    // Result object usually aggregates totals. The asset_details has some breakdown but not monthly.
    // Ideally we'd do this in the engine, but we can approximate here by re-running the row-math if needed, 
    // or just assume uniform distribution if we are lazy (bad).
    // Let's use the provided profiles in result.

    for (let i = 0; i < 8760; i++) {
        const month = Math.min(11, Math.floor(i / 730));

        // Market Purchase Cost
        const load = result.load_profile[i] || 0;
        const price = result.market_price_profile[i] || 0; // Load Hub Price
        monthlyCost[month] += load * price;

        // Settlement Value (Gen * (Hub - Strike))
        // We need asset level details to be accurate, but simple approx:
        // Let's approximate using total Gen * (Market Average - Strike Average) -- too inaccurate.
        // We'll skip complex settlement aggregation here for now and just show Load Cost vs Market Value of Generation.

        // Actually, we can sum up the asset settlement if we had hourly profiles for all assets.
        // But we DO have result.asset_details which has total stats.
        // We can't restart the loop easily.

        // Let's just visualize Load Cost vs REC Cost for now as a placeholder.
        const deficit = result.deficit_profile[i] || 0;
        const recPrice = result.rec_price_profile ? result.rec_price_profile[i] || 0 : 0;
        monthlySettlement[month] += deficit * recPrice; // Using this as REC Cost
    }

    const data = {
        labels: months,
        datasets: [
            { label: 'Load Cost (Market)', data: monthlyCost, backgroundColor: '#ef4444' },
            { label: 'REC Cost (Deficit)', data: monthlySettlement, backgroundColor: '#f97316' },
        ]
    };

    return <Chart type="bar" data={data} options={{ responsive: true, maintainAspectRatio: false }} />;
}
