import { useState, useEffect, useMemo } from 'react';
import { BASE_LOAD_PROFILE, SOLAR_PROFILE, WIND_PROFILE } from '@/lib/data/simulation-profiles';

export interface SimulationMetrics {
    cfeScore: number;
    gridNeeded: number;
    overGen: number;
}

export function useSimulation() {
    const [solarCap, setSolarCap] = useState(50);
    const [windCap, setWindCap] = useState(30);
    const [nuclearCap, setNuclearCap] = useState(0);
    const [geothermalCap, setGeothermalCap] = useState(0);

    // Memoize the calculation to run when inputs change
    const { metrics, solarGen, windGen, nuclearGen, geothermalGen } = useMemo(() => {
        // Calculate generation
        const sGen = SOLAR_PROFILE.map(v => v * solarCap);
        const wGen = WIND_PROFILE.map(v => v * windCap);

        // Baseload generation (flat profile)
        const nGen = Array(24).fill(nuclearCap);
        const gGen = Array(24).fill(geothermalCap);

        // Calculate KPIs
        let totalLoad = 0;
        let totalOver = 0;
        let totalGrid = 0;
        let hoursMatched = 0; // Count hours where gen >= load

        for (let i = 0; i < 24; i++) {
            const load = BASE_LOAD_PROFILE[i];
            const gen = sGen[i] + wGen[i] + nGen[i] + gGen[i];

            totalLoad += load;

            // Check if this hour is fully matched
            if (gen >= load) {
                hoursMatched++;
            }

            if (gen > load) totalOver += (gen - load);
            if (gen < load) totalGrid += (load - gen);
        }

        // CFE Score = percentage of hours where generation met or exceeded load
        const cfeScore = (hoursMatched / 24) * 100;

        return {
            metrics: {
                cfeScore: Math.round(cfeScore * 10) / 10,
                gridNeeded: Math.round(totalGrid),
                overGen: Math.round(totalOver),
            },
            solarGen: sGen,
            windGen: wGen,
            nuclearGen: nGen,
            geothermalGen: gGen,
        };
    }, [solarCap, windCap, nuclearCap, geothermalCap]);

    return {
        solarCap,
        setSolarCap,
        windCap,
        setWindCap,
        nuclearCap,
        setNuclearCap,
        geothermalCap,
        setGeothermalCap,
        metrics,
        solarGen,
        windGen,
        nuclearGen,
        geothermalGen,
        baseLoad: BASE_LOAD_PROFILE
    };
}
