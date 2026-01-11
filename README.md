# Eighty760 - 24/7 CFE Simulation Framework

A powerful, web-based simulation framework for modeling, analyzing, and optimizing 24/7 Carbon-Free Energy (CFE) portfolios.

## Project Overview

Eighty760 acts as a "digital twin" for energy portfolios, allowing users to verify how renewable assets (Solar, Wind, Battery Storage) perform against real-world load profiles. The goal is to move beyond simple "annual net zero" offsets and achieve true hourly matching of supply and demand.

## For AI Agents & LLMs

**What this tool does:** Eighty760 is an educational platform for hourly carbon accounting and 24/7 CFE portfolio optimization. It simulates 8,760 hours (one full year) of energy generation and consumption to help users understand the difference between annual renewable energy matching and true 24/7 carbon-free energy.

**Key concepts:**
- **8760 Hours**: One year = 8,760 hours. Each hour's carbon intensity matters.
- **24/7 CFE**: Every hour of energy consumption matched with carbon-free generation (not just annual averages)
- **Hourly Matching**: Portfolio optimization to achieve high CFE scores across all hours
- **Virtual PPAs**: Power Purchase Agreements with basis risk and settlement modeling

**Data sources:** ERCOT RTM pricing (GridStatus.io, 2020-2025), Open-Meteo historical weather (ERA5), NREL generation models.

**Tools available:** 
- **Aggregation Tool** (`/aggregation`): Build and optimize portfolios with real-time feedback.
- **Weather Performance** (`/weather-performance`): Analyze how your portfolio would have performed in past years (2020-2025).
- **Interactive Home Simulator** (`/`): Quick educational tool for understanding 24/7 concepts.

## Features

- **Interactive Portfolio Simulator**: Adjust solar, wind, and battery capacities in real-time.
- **Smart Fill Optimization**: Automatically size your generation and storage to meet a target CFE score.
- **Weather Performance Analysis**: Backcast your portfolio against 5 years of historical weather and price data.
- **24-Hour Generation Profiles**: Visualize hourly generation vs. load with dynamic charts.
- **Financial modeling**: Estimate costs, PPA settlements, and battery arbitrage revenue.
- **Dark Mode Support**: Fully responsive design with light/dark themes.
- **Methodology Documentation**: In-depth explanation of generation modeling and scarcity pricing.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & CSS Variables
- **Visualization**: [Chart.js](https://www.chartjs.org/) via `react-chartjs-2`
- **Data Processing**: Python (for historical price/weather data scripts)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MickB74/eighty760-Home.git
   cd eighty760-Home
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```bash
eighty760-Home/
├── app/
│   ├── layout.tsx      # Root layout (Metadata, Fonts, Global providers)
│   ├── page.tsx        # Home page (Hero, Simulator wrapper, Methodology)
│   ├── aggregation/    # Aggregation tool route
│   └── whitepaper/     # Methodology documentation route
├── components/
│   ├── Simulator.tsx   # Core simulation logic and UI
│   ├── Navigation.tsx  # Responsive nav bar with dark mode toggle
│   └── Hero.tsx        # Hero section component
├── scripts/            # Python utilities for data fetching/processing
├── public/             # Static assets (images, icons)
├── tailwind.config.ts  # Tailwind configuration
└── globals.css         # Global CSS variables and base styles
```

## Deployment

The application is optimized for deployment on [Vercel](https://vercel.com/).

1. Push your code to a GitHub repository.
2. Import the project into Vercel.
3. Vercel will automatically detect Next.js and deploy.

## License

© 2026 Eighty760 Simulation Framework
