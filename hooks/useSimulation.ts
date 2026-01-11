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
    const [batteryCap, setBatteryCap] = useState(0);

    // Memoize the calculation to run when inputs change
    const { metrics, batteryDischarge, solarGen, windGen } = useMemo(() => {
        // Calculate generation
        const sGen = SOLAR_PROFILE.map(v => v * solarCap);
        const wGen = WIND_PROFILE.map(v => v * windCap);

        // Battery simulation
        let currentCharge = batteryCap * 0.5;
        const BATTERY_EFFICIENCY = 0.85;
        const bDischarge = [];

        for (let i = 0; i < 24; i++) {
            const totalRenewable = sGen[i] + wGen[i];
            const load = BASE_LOAD_PROFILE[i];
            const net = totalRenewable - load;

            let discharged = 0;

            if (net > 0) {
                const space = batteryCap - currentCharge;
                const charged = Math.min(net, space);
                currentCharge += charged * BATTERY_EFFICIENCY;
            } else if (net < 0) {
                const deficit = Math.abs(net);
                const maxOutput = currentCharge;
                discharged = Math.min(deficit, maxOutput);
                currentCharge -= discharged;
            }

            bDischarge.push(discharged);
        }

        // Calculate KPIs
        let totalLoad = 0;
        let totalOver = 0;
        let totalGrid = 0;
        let hoursMatched = 0; // Count hours where gen >= load

        for (let i = 0; i < 24; i++) {
            const load = BASE_LOAD_PROFILE[i];
            const gen = sGen[i] + wGen[i] + bDischarge[i];

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
            batteryDischarge: bDischarge,
            solarGen: sGen,
            windGen: wGen,
        };
    }, [solarCap, windCap, batteryCap]);

    return {
        solarCap,
        setSolarCap,
        windCap,
        setWindCap,
        batteryCap,
        setBatteryCap,
        metrics,
        solarGen,
        windGen,
        batteryDischarge, // Exported in case we want to visualize it
        baseLoad: BASE_LOAD_PROFILE
    };
}
