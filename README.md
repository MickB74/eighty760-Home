# Eighty760 - 24/7 CFE Simulation Framework

A web-based simulation framework for understanding how 24/7 Carbon-Free Energy affects your portfolio.

## Project Overview

Eighty760 models, analyzes, and optimizes clean energy portfolios against the rigorous standard of meeting demand with carbon-free energy every hour of the day.

## Features

- **Interactive Portfolio Simulator**: Adjust solar, wind, and battery storage capacities to see real-time impacts
- **24-Hour Generation Profiles**: Visualize how different renewable resources stack up against load profiles
- **CFE Score Calculation**: Understand hourly matching efficiency
- **Dark Mode Support**: Toggle between light and dark themes
- **Methodology Documentation**: Learn about generation modeling, emissions analysis, and scarcity pricing

## Deployment

### Deploy to Vercel

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy from the project directory**:
   ```bash
   vercel
   ```

3. **For production deployment**:
   ```bash
   vercel --prod
   ```

### Manual Deployment via Vercel Dashboard

1. Visit [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "Add New Project"
4. Import this repository
5. Vercel will automatically detect it as a static site
6. Click "Deploy"

## Local Development

Simply open `Whitepaper.html` or `simulator.html` in your browser. No build process required.

## Project Structure

```
eighty760-Home/
├── Whitepaper.html    # Main landing page with methodology
├── simulator.html     # Interactive simulator page
├── style.css          # Shared styles with light/dark mode
├── image.png          # Eighty760 logo
├── index.html         # Entry point (redirects to Whitepaper.html)
├── vercel.json        # Vercel configuration
└── README.md          # This file
```

## Technologies Used

- **HTML5**: Structure
- **TailwindCSS**: Utility-first CSS framework (via CDN)
- **Vanilla CSS**: Custom theming and components
- **Chart.js**: Interactive visualizations
- **JavaScript**: Simulation logic and interactivity

## License

© 2025 Eighty760 Simulation Framework
