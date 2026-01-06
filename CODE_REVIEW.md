# Code Review: Eighty760 - Home

## Overview
This document summarizes the findings from a code review of the `eighty760-Home` repository. The project is a Next.js application designed to simulate 24/7 Carbon-Free Energy (CFE) portfolios.

## 1. Styling & CSS
### Findings
- **Mixed Styling Approaches**: The codebase currently uses a mix of Tailwind CSS and inline styles (e.g., `style={{ backgroundColor: 'var(--bg-primary)' }}`).
- **Theme Handling**: Dark mode is implemented manually via a `theme` local storage key and CSS variables, rather than leveraging Tailwind's native `darkMode: 'class'` fully.
- **Global CSS**: `globals.css` defines many custom CSS variables (`--bg-primary`, `--text-secondary`, etc.) which are then used in inline styles.

### Recommendations
- **Migrate to Tailwind Classes**: Replace inline styles with Tailwind utility classes. For example, instead of `style={{ backgroundColor: 'var(--bg-primary)' }}`, configure these colors in `tailwind.config.ts` and use `bg-primary`.
- **Standardize Dark Mode**: Utilize Tailwind's `dark:` prefix for dark mode styles (e.g., `dark:bg-slate-900`) to reduce the need for custom CSS variable swizzling and inline logic.

## 2. Architecture & Next.js
### Findings
- **App Router**: The project correctly uses the Next.js App Router structure (`app/layout.tsx`, `app/page.tsx`).
- **Client Components**: Components like `Simulator.tsx` and `Navigation.tsx` are marked with `'use client'`, which is appropriate for their interactive nature.
- **Font Optimization**: `next/font/google` is used for Inter and IBM Plex Mono, ensuring good performance.

### Recommendations
- **Component Decomposition**: `Simulator.tsx` is quite large (approx. 300 lines) and contains simulation logic, chart configuration, and UI markup. Consider separating:
    - **Logic**: Move the simulation calculation (`runSimulation`) to a custom hook (e.g., `useSimulation`).
    - **UI**: Extract smaller components like `Controls` and `ResultsChart`.
- **Metadata**: Metadata is correctly defined in `layout.tsx`, which improves SEO.

## 3. Data & State Management
### Findings
- **Hardcoded Data**: Load profiles and weather data (solar/wind profiles) are currently hardcoded arrays in `Simulator.tsx`.
- **Simulation Logic**: The simulation runs purely on the client side within a `useEffect` and `runSimulation` function.

### Recommendations
- **Data Externalization**: Move hardcoded profiles to JSON files or a constant file in `lib/` to make `Simulator.tsx` cleaner.
- **Type Safety**: `metrics` state in `Simulator.tsx` could be strictly typed with an interface.

## 4. Scripts & Utilities
### Findings
- **Python Scripts**: `scripts/` contains Python scripts (`fetch_historical_prices.py`, `generate_weather_profiles.py`) for data processing. This indicates a multi-language workflow.
- **Type Safety**: TypeScript is enabled and used, but there are opportunities for stricter types, especially in component props and event handlers.

## Summary
The project has a solid foundation using Next.js 14. The primary area for improvement is standardizing the styling approach to fully embrace Tailwind CSS, which would significantly clean up component code by removing verbose inline styles. Refactoring the `Simulator` component would also improve maintainability.
