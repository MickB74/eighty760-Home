export const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const BASE_LOAD_PROFILE = [
    10, 10, 10, 10, 15, 25, 45, 65, 80, 85, 85, 80,
    80, 85, 85, 80, 65, 45, 25, 20, 15, 10, 10, 10
];

export const SOLAR_PROFILE = HOURS.map(h => {
    if (h < 6 || h > 18) return 0;
    return Math.sin(((h - 6) * Math.PI) / 12);
});

export const WIND_PROFILE = HOURS.map(h => 0.5 + 0.3 * Math.cos(((h - 4) * Math.PI) / 12));
