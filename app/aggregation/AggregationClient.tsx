'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
    // activeTab removed (layout change)
    const [loading, setLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // 1. Load State
    const [participants, setParticipants] = useState<Participant[]>([]);

    // 2. Gen State
    const [capacities, setCapacities] = useState<TechCapacity>({
        Solar: 0, Wind: 0, Geothermal: 0, Nuclear: 0, 'CCS Gas': 0, Battery_MW: 0, Battery_Hours: 2
    });
    const [assets, setAssets] = useState<GenerationAsset[]>([]);
    const [useAdvancedAssets, setUseAdvancedAssets] = useState(false);

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
    const [solarHub, setSolarHub] = useState<string>('West');
    const [windHub, setWindHub] = useState<string>('Panhandle');
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
        ancillary_input: 50000          // $50k/month default
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

    // 7. UI State
    const [isLoadCollapsed, setIsLoadCollapsed] = useState(false);

    const [cvtaResult, setCvtaResult] = useState<BatteryCVTAResult | null>(null);

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
        // Clear and load demo scenario with 3 random participants
        const locations = ['North Zone', 'South Zone', 'West Zone', 'Houston', 'Coastal', 'Panhandle'];
        const types: Array<Participant['type']> = ['Data Center', 'Manufacturing', 'Office'];

        // Shuffle locations to get 3 unique ones
        const shuffledLocs = [...locations].sort(() => 0.5 - Math.random()).slice(0, 3);

        const newParticipants: Participant[] = shuffledLocs.map((loc, i) => {
            const type = types[Math.floor(Math.random() * types.length)];
            let baseLoad = 50000;
            if (type === 'Data Center') baseLoad = 150000 + Math.random() * 100000;
            if (type === 'Manufacturing') baseLoad = 80000 + Math.random() * 50000;
            if (type === 'Office') baseLoad = 20000 + Math.random() * 20000;

            return {
                id: Date.now().toString() + i,
                name: `${loc} ${type}`,
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
                setCapacities(rec);
            }
            setLoading(false);
        }, 100);
    };

    // Derived state for active assets, considering both simple sliders and advanced editor
    const activeAssets = useMemo(() => {
        if (useAdvancedAssets) {
            return assets;
        } else {
            const tempAssets: GenerationAsset[] = [];
            const techs = ['Solar', 'Wind', 'Geothermal', 'Nuclear', 'CCS Gas'];
            techs.forEach(type => {
                const mw = (capacities as any)[type];
                if (mw > 0) {
                    let loc: any = loadHub === 'HB_NORTH' ? 'North' : loadHub; // Default for others
                    if (type === 'Solar') loc = solarHub === 'HB_NORTH' ? 'North' : solarHub;
                    if (type === 'Wind') loc = windHub === 'HB_NORTH' ? 'North' : windHub;
                    if (type === 'Nuclear') loc = nuclearHub === 'HB_NORTH' ? 'North' : nuclearHub;
                    if (type === 'Geothermal') loc = geothermalHub === 'HB_NORTH' ? 'North' : geothermalHub;
                    if (type === 'CCS Gas') loc = ccsHub === 'HB_NORTH' ? 'North' : ccsHub;

                    tempAssets.push({
                        id: `temp-${type}`,
                        name: `${type} Gen`,
                        type: type as GenerationAsset['type'],
                        location: loc, // Use specific hub
                        capacity_mw: mw,
                        capacity_factor: undefined // Use default profile logic
                    });
                }
            });
            return tempAssets;
        }
    }, [useAdvancedAssets, assets, capacities, loadHub, solarHub, windHub, nuclearHub, geothermalHub, ccsHub]);


    // UseEffect to load generation profiles (Solar/Wind) based on location and year
    const [genProfiles, setGenProfiles] = useState<Record<string, number[]>>({});

    useEffect(() => {
        const loadProfiles = async () => {
            // Only proceed if we have a valid numeric year (2020-2025)
            // If Synthetic or Average, we skip loading specific profiles (engine falls back to synthetic)
            if (typeof selectedYear !== 'number') return;

            const newProfiles: Record<string, number[]> = {};
            const promises: Promise<void>[] = [];

            // Identify unique profiles needed
            // Key format in file: `{Tech}_{Location}_{Year}.json` e.g. Solar_North_2023.json
            // We map this to asset.id in the state so engine can look it up easily.

            activeAssets.forEach(asset => {
                if (asset.type === 'Solar' || asset.type === 'Wind') {
                    // normalize location
                    let loc = asset.location;
                    // ensure simple name "North", "South" etc. (AssetEditor uses these)

                    const tech = asset.type;

                    // Determine URL based on TMY toggle
                    let url = `/data/profiles/${tech}_${loc}_${selectedYear}.json`;
                    if (useTMY) {
                        url = `/data/profiles/${tech}_${loc}_TMY.json`;
                    }

                    // Check if already loaded in current state (optimization)
                    // But we are rebuilding 'newProfiles' to be clean.
                    // Actually, let's just fetch everything needed for current state.

                    const p = fetch(url).then(async (res) => {
                        if (res.ok) {
                            const data = await res.json();
                            newProfiles[asset.id] = data;
                        } else {
                            // console.warn(`Profile not found: ${url}`);
                        }
                    }).catch(e => console.error(e));
                    promises.push(p);
                }
            });

            if (promises.length > 0) {
                await Promise.all(promises);
                setGenProfiles(newProfiles);
            }
        };

        loadProfiles();
    }, [selectedYear, activeAssets, useTMY]);

    const runSimulation = () => {
        setLoading(true);
        setTimeout(() => {
            // Filter excluded techs (zero out capacity) - DISABLED temporarily as we move to AssetEditor
            // With AssetEditor, we just don't pass the asset if it's inactive/deleted.
            // But for legacy compatibility with the 'Active' toggles if we add them back:
            // For now, we assume activeAssets contains what we want to run.

            const res = runAggregationSimulation(
                participants,
                activeAssets,
                financials,
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
    };

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

            // Calculate and update average price
            if (prices && prices.length > 0) {
                const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
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

    // Run sim when key inputs change (debounced to avoid excessive re-renders)
    useEffect(() => {
        if (participants.length === 0) {
            setResult(null);
            return;
        }

        const timeoutId = setTimeout(() => {
            runSimulation();
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [
        participants.length,
        JSON.stringify(activeAssets.map(a => ({ id: a.id, capacity_mw: a.capacity_mw, location: a.location }))),
        capacities.Battery_MW,
        capacities.Battery_Hours,
        financials.solar_price,
        financials.wind_price,
        financials.geo_price,
        financials.nuc_price,
        financials.ccs_price,
        financials.rec_price,
        financials.market_price_avg,
        historicalPrices,
        JSON.stringify(Object.keys(allHubPrices)),
        JSON.stringify(Object.keys(genProfiles))
    ]);

    // --- Render ---

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-navy-950 transition-colors duration-300">
            <Navigation />

            <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden">
                {/* Mobile Sidebar Toggle */}
                <div className="lg:hidden p-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-navy-950 flex justify-between items-center shrink-0">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Configuration</span>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-md border border-gray-200 dark:border-slate-600 transition-colors"
                    >
                        {isSidebarOpen ? 'Hide Controls' : 'Show Controls'}
                    </button>
                </div>

                {/* Sidebar - Configuration */}
                <div className={`w-full lg:w-96 p-6 border-r border-gray-200 dark:border-white/10 bg-white dark:bg-navy-950/50 backdrop-blur-sm overflow-y-auto h-full ${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold brand-text">Configuration</h2>
                        <button
                            onClick={handleSmartFill}
                            className="text-xs bg-energy-green text-navy-950 px-2 py-1 rounded border border-energy-green/20 hover:bg-energy-green/90 transition-colors font-medium"
                        >
                            ✨ Smart Fill
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* 1. Market & Financials */}
                        <section>
                            <h3 className="font-semibold mb-3 border-b border-white/10 pb-1">1. Market Settings</h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-700 dark:text-gray-300 block mb-1">Price Year</label>
                                            <select
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(e.target.value === 'Average' ? 'Average' : parseInt(e.target.value))}
                                                className="w-full p-2 rounded border border-white/10 bg-navy-950 text-sm"
                                            >
                                                <option value="Average">{getYearLabel('Average')}</option>
                                                {getAvailableYears().map(year => (
                                                    <option key={year} value={year}>{getYearLabel(year)}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* TMY Toggle */}
                                    <div className="mt-2 flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="useTMY"
                                            checked={useTMY}
                                            onChange={(e) => setUseTMY(e.target.checked)}
                                            className="rounded border-gray-300 text-brand shadow-sm focus:border-brand focus:ring focus:ring-brand focus:ring-opacity-50"
                                        />
                                        <div className="flex items-center gap-1">
                                            <label htmlFor="useTMY" className="text-xs text-gray-700 dark:text-gray-300 font-medium cursor-pointer select-none">
                                                Use TMY Generation
                                            </label>
                                            <InfoTooltip text="Typical Meteorological Year. Uses averaged generation profiles (2020-2025) instead of the specific weather for the selected year." />
                                        </div>
                                    </div>

                                    {/* Map Visualization */}
                                    <div className="my-4 flex justify-center">
                                        <TexasHubMap
                                            className="w-full max-w-[200px]"
                                            selectedHub={loadHub === 'HB_NORTH' ? 'North' : (loadHub === 'HB_SOUTH' ? 'South' : (loadHub === 'HB_WEST' ? 'West' : (loadHub === 'HB_HOUSTON' ? 'Houston' : (loadHub === 'HB_PAN' ? 'Panhandle' : loadHub))))} // Map Load Hub selection to map ID
                                            onHubSelect={(hub) => {
                                                // Map hub ID back to selection value
                                                // This is a bit tricky since the select values are "North", "South" etc but internal IDs might be different in future.
                                                // Assuming simple mapping for now.
                                                // Actually select options are: 'North', 'South', 'West', 'Houston', 'Panhandle'
                                                setLoadHub(hub);
                                            }}
                                        />
                                    </div>

                                    {/* Tech Specific Hubs - Row 1 */}
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        <div>
                                            <label className="text-xs text-gray-700 dark:text-gray-300 block mb-1">Load Hub</label>
                                            <select
                                                value={loadHub}
                                                onChange={(e) => setLoadHub(e.target.value)}
                                                className="w-full p-2 rounded border border-white/10 bg-navy-950 text-xs"
                                                disabled={typeof selectedYear !== 'number'}
                                            >
                                                {['North', 'South', 'West', 'Houston', 'Panhandle'].map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-700 dark:text-gray-300 block mb-1">Solar Hub</label>
                                            <select
                                                value={solarHub}
                                                onChange={(e) => setSolarHub(e.target.value)}
                                                className="w-full p-2 rounded border border-white/10 bg-navy-950 text-xs"
                                                disabled={typeof selectedYear !== 'number'}
                                            >
                                                {['North', 'South', 'West', 'Houston', 'Panhandle'].map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-700 dark:text-gray-300 block mb-1">Wind Hub</label>
                                            <select
                                                value={windHub}
                                                onChange={(e) => setWindHub(e.target.value)}
                                                className="w-full p-2 rounded border border-white/10 bg-navy-950 text-xs"
                                                disabled={typeof selectedYear !== 'number'}
                                            >
                                                {['North', 'South', 'West', 'Houston', 'Panhandle'].map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Tech Specific Hubs - Row 2 */}
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        <div>
                                            <label className="text-xs text-gray-700 dark:text-gray-300 block mb-1">Nuclear Hub</label>
                                            <select
                                                value={nuclearHub}
                                                onChange={(e) => setNuclearHub(e.target.value)}
                                                className="w-full p-2 rounded border border-white/10 bg-navy-950 text-xs"
                                                disabled={typeof selectedYear !== 'number'}
                                            >
                                                {['North', 'South', 'West', 'Houston', 'Panhandle'].map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-700 dark:text-gray-300 block mb-1">Geothermal Hub</label>
                                            <select
                                                value={geothermalHub}
                                                onChange={(e) => setGeothermalHub(e.target.value)}
                                                className="w-full p-2 rounded border border-white/10 bg-navy-950 text-xs"
                                                disabled={typeof selectedYear !== 'number'}
                                            >
                                                {['North', 'South', 'West', 'Houston', 'Panhandle'].map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-700 dark:text-gray-300 block mb-1">CCS Gas Hub</label>
                                            <select
                                                value={ccsHub}
                                                onChange={(e) => setCcsHub(e.target.value)}
                                                className="w-full p-2 rounded border border-white/10 bg-navy-950 text-xs"
                                                disabled={typeof selectedYear !== 'number'}
                                            >
                                                {['North', 'South', 'West', 'Houston', 'Panhandle'].map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <label className="text-xs text-gray-700 dark:text-gray-300">REC Price ($)</label>
                                            <InfoTooltip text="Cost to purchase Renewable Energy Certificates for unmatched load." />
                                        </div>
                                        <input
                                            type="number"
                                            className="w-full p-2 rounded border border-white/10 bg-navy-950 text-sm"
                                            value={financials.rec_price}
                                            onChange={(e) => setFinancials({ ...financials, rec_price: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <label className="text-xs text-gray-700 dark:text-gray-300">Avg Market ($)</label>
                                            <InfoTooltip text="Average wholesale electricity price used for settlement calculations (approximate)." />
                                        </div>
                                        <input
                                            type="number"
                                            className="w-full p-2 rounded border border-white/10 bg-navy-950 text-sm"
                                            value={financials.market_price_avg}
                                            onChange={(e) => setFinancials({ ...financials, market_price_avg: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-medium">Scarcity REC Pricing</label>
                                            <InfoTooltip text="If enabled, REC prices will surge up to 500% during critical winter and summer grid stress hours, simulating scarcity pricing mechanisms." />
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={!!financials.use_scarcity}
                                            onChange={(e) => setFinancials({ ...financials, use_scarcity: e.target.checked })}
                                            className="accent-[#285477]"
                                        />
                                    </div>
                                    {financials.use_scarcity && (
                                        <div>
                                            <div className="flex justify-between items-center text-xs mb-1 text-gray-700 dark:text-gray-300">
                                                <div className="flex items-center gap-1">
                                                    <span>Intensity</span>
                                                    <InfoTooltip text="Multiplier scalar. 1.0x = Standard Scarcity Logic. Higher values increase the price multiplier during stress events." />
                                                </div>
                                                <span>{financials.scarcity_intensity?.toFixed(1)}x</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="5"
                                                step="0.1"
                                                value={financials.scarcity_intensity}
                                                onChange={(e) => setFinancials({ ...financials, scarcity_intensity: parseFloat(e.target.value) })}
                                                className="w-full accent-[#285477]"
                                            />

                                            {/* Effective Price Breakdown */}
                                            <details className="mt-2 text-xs text-gray-500">
                                                <summary className="cursor-pointer hover:text-brand dark:hover:text-brand-light transition-colors list-item">
                                                    Effective Prices (at {financials.scarcity_intensity?.toFixed(1)}x)
                                                </summary>
                                                <div className="mt-2 pl-2 space-y-1 bg-gray-100 dark:bg-slate-700/50 p-2 rounded">
                                                    <div className="flex justify-between">
                                                        <span>Critical (2.0x base)</span>
                                                        <span className="font-mono font-medium text-red-500">
                                                            ${(financials.rec_price * (1 + (2.0 - 1) * financials.scarcity_intensity!)).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Winter Shoulder (1.4x base)</span>
                                                        <span className="font-mono font-medium text-orange-500">
                                                            ${(financials.rec_price * (1 + (1.4 - 1) * financials.scarcity_intensity!)).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Regular (1.0x base)</span>
                                                        <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
                                                            ${financials.rec_price.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </details>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* 2. Portfolio Mix */}
                        <section>
                            <h3 className="font-semibold mb-3 border-b border-white/10 pb-1">2. Portfolio Mix (MW)</h3>
                            <div className="space-y-4">
                                {(['Solar', 'Wind', 'CCS Gas', 'Geothermal', 'Nuclear'] as const).map(tech => (
                                    <div key={tech} className={excludedTechs.has(tech) ? 'opacity-50' : ''}>
                                        <div className="flex justify-between items-center text-xs mb-1">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={!excludedTechs.has(tech)}
                                                    onChange={() => toggleTechExclusion(tech)}
                                                    className="accent-[#285477] w-3 h-3"
                                                />
                                                <span>{tech}</span>
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {excludedTechs.has(tech) ? 'Excluded' : `${capacities[tech].toLocaleString(undefined, { maximumFractionDigits: 0 })} MW`}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="500"
                                            step="1"
                                            value={capacities[tech]}
                                            onChange={(e) => setCapacities({ ...capacities, [tech]: parseFloat(e.target.value) })}
                                            className="w-full accent-[#285477]"
                                            disabled={excludedTechs.has(tech)}
                                        />
                                    </div>
                                ))}

                                <div className="pt-2 border-t border-white/10">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>Battery Power</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{capacities.Battery_MW.toLocaleString(undefined, { maximumFractionDigits: 0 })} MW</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="500" step="1"
                                        value={capacities.Battery_MW}
                                        onChange={(e) => setCapacities({ ...capacities, Battery_MW: parseFloat(e.target.value) })}
                                        className="w-full accent-emerald-600"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>Duration</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{capacities.Battery_Hours}h</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="8" step="0.5"
                                        value={capacities.Battery_Hours}
                                        onChange={(e) => setCapacities({ ...capacities, Battery_Hours: parseFloat(e.target.value) })}
                                        className="w-full accent-emerald-600"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 3. Tech Colors / PPA Prices (Collapsible or just list) */}
                        <section>
                            <details className="text-sm">
                                <summary className="font-semibold cursor-pointer text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-gray-100">Advanced PPA Pricing</summary>
                                <div className="mt-3 space-y-2 pl-2">
                                    {(['solar', 'wind', 'ccs', 'geo', 'nuc'] as const).map(tech => (
                                        <div key={tech} className="flex items-center justify-between text-xs">
                                            <label className="capitalize">{tech} PPA</label>
                                            <input
                                                type="number"
                                                className="w-16 px-1 py-0.5 rounded border border-white/10 bg-navy-950 text-right"
                                                value={(financials as any)[`${tech}_price`]}
                                                onChange={(e) => setFinancials({ ...financials, [`${tech}_price`]: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </details>
                        </section>

                        <section className="mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Generation Portfolio</h3>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-700 dark:text-gray-300">Advanced Mode</label>
                                    <input
                                        type="checkbox"
                                        checked={useAdvancedAssets}
                                        onChange={e => setUseAdvancedAssets(e.target.checked)}
                                        className="toggle"
                                    />
                                </div>
                            </div>

                            {useAdvancedAssets ? (
                                <div className="mb-4">
                                    <AssetEditor assets={assets} onUpdate={setAssets} />
                                    {/* Keep Battery controls visible separately or integrate them? For now keep separate below */}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {['Solar', 'Wind', 'Geothermal', 'Nuclear', 'CCS Gas'].map(tech => (
                                        <div key={tech} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-700 dark:text-gray-300">{tech}</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{(capacities as any)[tech]} MW</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="5000"
                                                step="10"
                                                value={(capacities as any)[tech]}
                                                onChange={(e) => setCapacities(prev => ({ ...prev, [tech]: Number(e.target.value) }))}
                                                className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-energy-green"
                                            />
                                        </div>
                                    ))}
                                    <div className="bg-energy-green/10 p-3 rounded text-xs text-energy-green mt-2">
                                        ℹ️ Switch to &quot;Advanced Mode&quot; to specify project locations (North/South/West) and multiple assets per technology.
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 lg:p-10 overflow-y-auto h-full">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold brand-text">ERCOT North Aggregation</h1>
                            <p className="text-gray-700 dark:text-gray-300">24/7 CFE Portfolio Optimization</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleInstantDemo}
                                className="px-4 py-2 bg-energy-green text-navy-950 rounded-md hover:opacity-90 transition font-medium shadow-sm text-sm"
                            >
                                ⚡ Load Demo
                            </button>
                        </div>
                    </div>

                    {/* Participant Editor (Collapsible or Card) */}
                    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 shadow-sm mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsLoadCollapsed(!isLoadCollapsed)}
                                    className="p-1 hover:bg-gray-50 dark:hover:bg-slate-700 rounded transition-colors text-gray-700 dark:text-gray-300"
                                >
                                    <span className={`transform transition-transform inline-block ${isLoadCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                                        ▼
                                    </span>
                                </button>
                                <h3 className="text-lg font-semibold cursor-pointer" onClick={() => setIsLoadCollapsed(!isLoadCollapsed)}>Load Aggregation</h3>
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Total Load: <span className="font-bold text-gray-900 dark:text-gray-100">{(participants.reduce((a, b) => a + b.load_mwh, 0)).toLocaleString()} MWh</span>
                            </span>
                        </div>

                        {!isLoadCollapsed && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <ParticipantEditor
                                    participants={participants}
                                    onChange={setParticipants}
                                />
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    {result ? (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* KPI Grid */}
                            {/* KPI Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                                <KPICard label="24/7 Score" value={(result.cfe_score * 100).toFixed(1) + '%'} sub="Hourly Match" />
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
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <tbody>
                                            <tr className="border-b border-white/10">
                                                <td className="py-3 font-medium flex items-center gap-2">
                                                    Market Purchases (Load Bill)
                                                    <InfoTooltip text="Total Load × Hourly Load Hub Price" />
                                                </td>
                                                <td className="py-3 text-right font-medium text-red-500">
                                                    -${result.market_purchase_cost ? result.market_purchase_cost.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
                                                </td>
                                            </tr>
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
                                                    Total Net Portfolio Cost
                                                    <InfoTooltip text="(Total Load × Load Hub Price) - Net Settlement Value + Net REC Costs" />
                                                </td>
                                                <td className={`py-3 text-right font-bold text-lg ${result.total_cost_net > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                    {result.total_cost_net > 0 ? '-' : '+'}${Math.abs(result.total_cost_net).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="py-3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                    Levelized Cost to Load ($/MWh)
                                                    <InfoTooltip text="Total Net Portfolio Cost / Total Annual Load" />
                                                </td>
                                                <td className="py-3 text-right text-gray-700 dark:text-gray-300">
                                                    ${result.avg_cost_per_mwh.toFixed(2)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>

                                </div>
                            </div>

                            {/* Detailed Asset Breakdown Table */}
                            {result.asset_details && result.asset_details.length > 0 && (
                                <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 shadow-sm overflow-x-auto mt-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold">Asset Financial Breakdown</h3>
                                        <button
                                            onClick={() => {
                                                // Generate CSV with hourly interval data
                                                const csvRows: string[] = [];

                                                // Header with REC and Load columns
                                                csvRows.push('Timestamp,Hour,Asset Name,Type,Hub,Capacity (MW),Generation (MWh),Hourly Load (MWh),Matched Gen (MWh),Grid Deficit (MWh),Market Price ($/MWh),Revenue ($),PPA Strike ($/MWh),PPA Cost ($),Settlement ($),REC Price ($/MWh),REC Revenue ($)');

                                                // For each hour
                                                for (let h = 0; h < 8760; h++) {
                                                    const timestamp = `Hour ${h + 1}`;
                                                    const hourlyLoad = result.load_profile[h] || 0;
                                                    const hourlyMatched = result.matched_profile[h] || 0;
                                                    const hourlyDeficit = hourlyLoad - hourlyMatched;

                                                    // For each asset
                                                    result.asset_details.forEach(asset => {
                                                        // Get the hourly generation based on asset type
                                                        let hourlyGen = 0;
                                                        const techMap: Record<string, number[]> = {
                                                            'Solar': result.solar_profile,
                                                            'Wind': result.wind_profile,
                                                            'Geothermal': result.geo_profile,
                                                            'Nuclear': result.nuc_profile,
                                                            'CCS Gas': result.ccs_profile
                                                        };

                                                        const profile = techMap[asset.type];
                                                        if (profile && profile[h] !== undefined) {
                                                            // Calculate this asset's share of the total tech generation
                                                            const totalTechGen = profile[h];
                                                            const assetShare = asset.capacity_mw / result.asset_details
                                                                .filter(a => a.type === asset.type)
                                                                .reduce((sum, a) => sum + a.capacity_mw, 0);
                                                            hourlyGen = totalTechGen * assetShare;
                                                        }

                                                        const marketPrice = result.market_price_profile[h] || 0;
                                                        const hourlyRevenue = hourlyGen * marketPrice;

                                                        // Get PPA strike price
                                                        const ppaPriceMap: Record<string, number> = {
                                                            'Solar': financials.solar_price,
                                                            'Wind': financials.wind_price,
                                                            'Geothermal': financials.geo_price,
                                                            'Nuclear': financials.nuc_price,
                                                            'CCS Gas': financials.ccs_price
                                                        };
                                                        const ppaStrike = ppaPriceMap[asset.type] || 0;
                                                        const hourlyCost = hourlyGen * ppaStrike;
                                                        const hourlySettlement = hourlyRevenue - hourlyCost;

                                                        // Calculate REC price and revenue
                                                        const recPrice = result.rec_price_profile ? result.rec_price_profile[h] || 0 : 0;
                                                        const recRevenue = hourlyGen * recPrice;

                                                        csvRows.push([
                                                            timestamp,
                                                            h.toString(),
                                                            asset.name,
                                                            asset.type,
                                                            asset.location,
                                                            asset.capacity_mw.toFixed(2),
                                                            hourlyGen.toFixed(4),
                                                            hourlyLoad.toFixed(4),
                                                            hourlyMatched.toFixed(4),
                                                            hourlyDeficit.toFixed(4),
                                                            marketPrice.toFixed(2),
                                                            hourlyRevenue.toFixed(2),
                                                            ppaStrike.toFixed(2),
                                                            hourlyCost.toFixed(2),
                                                            hourlySettlement.toFixed(2),
                                                            recPrice.toFixed(2),
                                                            recRevenue.toFixed(2)
                                                        ].join(','));
                                                    });
                                                }

                                                // Download CSV
                                                const csvContent = csvRows.join('\n');
                                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                                const link = document.createElement('a');
                                                const url = URL.createObjectURL(blob);
                                                link.setAttribute('href', url);
                                                link.setAttribute('download', `asset_financial_breakdown_${selectedYear}_hourly.csv`);
                                                link.style.visibility = 'hidden';
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }}
                                            className="px-4 py-2 bg-energy-green text-navy-950 text-sm rounded-md hover:opacity-90 transition-opacity"
                                        >
                                            📥 Download CSV (Hourly Data)
                                        </button>
                                    </div>
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300">
                                                <th className="py-2 pr-4">Asset Name</th>
                                                <th className="py-2 pr-4">Type</th>
                                                <th className="py-2 pr-4">Hub</th>
                                                <th className="py-2 pr-4 text-right">Capacity</th>
                                                <th className="py-2 pr-4 text-right">Generation</th>
                                                <th className="py-2 pr-4 text-right">Revenue (Basis)</th>
                                                <th className="py-2 pr-4 text-right">PPA Cost</th>
                                                <th className="py-2 text-right">Settlement</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.asset_details.map((asset, idx) => (
                                                <tr key={idx} className="border-b border-gray-200 dark:border-white/10 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700">
                                                    <td className="py-3 pr-4 font-medium text-navy-950 dark:text-white">{asset.name}</td>
                                                    <td className="py-3 pr-4 text-navy-950 dark:text-white">{asset.type}</td>
                                                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{asset.location}</td>
                                                    <td className="py-3 pr-4 text-right text-navy-950 dark:text-white">{asset.capacity_mw} MW</td>
                                                    <td className="py-3 pr-4 text-right text-navy-950 dark:text-white">{asset.total_gen_mwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} MWh</td>
                                                    <td className="py-3 pr-4 text-right text-gray-900 dark:text-gray-100">
                                                        ${asset.total_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </td>
                                                    <td className="py-3 pr-4 text-right text-red-500">
                                                        -${asset.total_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </td>
                                                    <td className={`py-3 text-right font-medium ${asset.settlement_value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                        {asset.settlement_value >= 0 ? '+' : ''}${asset.settlement_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-gray-200 dark:border-slate-600 font-bold bg-gray-50 dark:bg-slate-700/50 text-navy-950 dark:text-white">
                                                <td className="py-3 pr-4" colSpan={3}>Total</td>
                                                <td className="py-3 pr-4 text-right">
                                                    {result.asset_details.reduce((sum, a) => sum + a.capacity_mw, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} MW
                                                </td>
                                                <td className="py-3 pr-4 text-right">
                                                    {result.asset_details.reduce((sum, a) => sum + a.total_gen_mwh, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} MWh
                                                </td>
                                                <td className="py-3 pr-4 text-right text-gray-900 dark:text-gray-100">
                                                    ${result.asset_details.reduce((sum, a) => sum + a.total_revenue, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </td>
                                                <td className="py-3 pr-4 text-right text-red-500">
                                                    -${result.asset_details.reduce((sum, a) => sum + a.total_cost, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </td>
                                                <td className={`py-3 text-right ${result.settlement_value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {result.settlement_value >= 0 ? '+' : '-'}${Math.abs(result.settlement_value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}

                            {/* Hourly Data Heatmaps */}
                            <div className="space-y-6 mt-8">
                                <ResultsHeatmap
                                    data={result.load_profile.map((load, i) => {
                                        const gen = result.matched_profile[i] || 0;
                                        return load > 0 ? (gen / load) * 100 : 0;
                                    })}
                                    title="Hourly Matching Rate"
                                    min={0}
                                    max={100}
                                    unit="%"
                                />

                                <ResultsHeatmap
                                    data={result.load_profile.map((load, i) => {
                                        const matched = result.matched_profile[i] || 0;
                                        return load - matched;
                                    })}
                                    title="Grid Deficit (Hourly)"
                                    min={0}
                                    unit="MWh"
                                />

                                {result.rec_price_profile && (
                                    <ResultsHeatmap
                                        data={result.rec_price_profile}
                                        title="REC Price (Hourly)"
                                        min={0}
                                        unit="$/MWh"
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400 border-2 border-dashed border-white/10 rounded-xl">
                            <div className="text-5xl mb-4">📊</div>
                            <p className="text-lg font-medium">Add Participants to Begin Simulation</p>
                            <p className="text-sm">Configure load participants above or click &quot;Load Demo&quot; to start.</p>
                        </div>
                    )}
                </div>
            </div>
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
        plugins: {
            tooltip: { mode: 'index', intersect: false },
            legend: { display: true, position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
        }
    }} />;
}


