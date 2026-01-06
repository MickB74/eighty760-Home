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
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'sans-serif'],
                mono: ['var(--font-ibm-plex-mono)', 'monospace'],
            },
        },
    },
    plugins: [],
};
export default config;
