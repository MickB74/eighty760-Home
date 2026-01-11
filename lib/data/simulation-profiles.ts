export const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Normalized profiles (mostly peaking around 1.0 or averaging near 1.0)
const OFFICE_SHAPE = [
    0.2, 0.2, 0.2, 0.2, 0.3, 0.5, 0.7, 0.9, 1.0, 1.0, 1.0, 0.9,
    0.9, 1.0, 1.0, 0.9, 0.7, 0.5, 0.3, 0.2, 0.2, 0.2, 0.2, 0.2
];

const DATA_CENTER_SHAPE = Array(24).fill(0.95); // Mostly flat

const EV_CHARGING_SHAPE = [
    0.8, 0.8, 0.6, 0.4, 0.3, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.2,
    0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0, 1.0, 0.9, 0.9, 0.9, 0.9
]; // Night charging + Evening peak

export const LOAD_PROFILES: Record<string, number[]> = {
    'Office': OFFICE_SHAPE,
    'Data Center': DATA_CENTER_SHAPE,
    'EV Fleet': EV_CHARGING_SHAPE
};

export const BASE_LOAD_PROFILE = OFFICE_SHAPE; // Default fallback

export const SOLAR_PROFILE = HOURS.map(h => {
    if (h < 6 || h > 18) return 0;
    return Math.sin(((h - 6) * Math.PI) / 12);
});

export const WIND_PROFILE = HOURS.map(h => 0.5 + 0.3 * Math.cos(((h - 4) * Math.PI) / 12));
