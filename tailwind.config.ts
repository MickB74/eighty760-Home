import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    light: '#60A5FA', // Blue-400
                    DEFAULT: '#285477', // Custom Deep Blue
                    dark: '#1E3A8A', // Blue-900 (Optional, for darker needed)
                },
                navy: {
                    900: '#1a1d2e', // Slightly lighter than 950 for layered dark UI
                    950: '#0a0a0b', // Deep dark for command center aesthetic
                },
                'energy-green': '#00ff88', // Bright green for dark mode / highlights
                'energy-green-dark': '#059669', // Emerald 600 for light mode text/readability
            },
            fontFamily: {
                sans: ['Inter', 'var(--font-inter)', 'sans-serif'],
                // Use Inter for everything - differentiate with font weights
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
};
export default config;
