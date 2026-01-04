import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: ['class'],
    theme: {
        extend: {
            colors: {
                brand: {
                    light: '#60A5FA',
                    DEFAULT: '#285477',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['IBM Plex Mono', 'monospace'],
            },
        },
    },
    plugins: [],
};
export default config;
