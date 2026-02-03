const { jsPDF } = require('jspdf');

const doc = new jsPDF({ unit: 'pt', format: 'letter' });
const pageWidth = 612;
const pageHeight = 792;
const margin = 36;
const maxWidth = pageWidth - margin * 2;
let y = margin;

function addTitle(text) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(text, margin, y);
  y += 24;
}

function addHeading(text) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(text, margin, y);
  y += 16;
}

function addParagraph(text) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, margin, y);
  y += lines.length * 12 + 6;
}

function addBullets(items) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const bulletIndent = 12;
  const wrapWidth = maxWidth - bulletIndent;
  items.forEach((item) => {
    const lines = doc.splitTextToSize(item, wrapWidth);
    if (lines.length === 0) return;
    doc.text(`- ${lines[0]}`, margin, y);
    y += 12;
    for (let i = 1; i < lines.length; i += 1) {
      doc.text(lines[i], margin + bulletIndent, y);
      y += 12;
    }
    y += 2;
  });
  y += 4;
}

addTitle('Eighty760 App Summary');

addHeading('What It Is');
addParagraph('Eighty760 is a web-based simulation framework for modeling 24/7 carbon-free energy portfolios and hourly matching across a full year (8,760 hours). It acts as a digital twin for renewable portfolios to compare generation against real-world load profiles.');

addHeading("Who It's For");
addParagraph('Primary users are energy portfolio planners, sustainability teams, and analysts evaluating 24/7 CFE performance.');

addHeading('What It Does');
addBullets([
  'Interactive portfolio simulator to adjust solar, wind, and battery capacity in real time.',
  'Aggregation tool with live market data, detailed analysis, financials, and scenario comparison.',
  'Scenario comparison to save and evaluate multiple portfolio configurations side by side.',
  'Financial modeling for PPA settlement costs, basis risk, battery arbitrage revenue, and REC costs.',
  'Weather performance backcasting using historical data (2020-2026).',
  'Global real-time tickers and hourly generation profiles (duck curve, net load).'
]);

addHeading('How It Works (Repo Evidence)');
addBullets([
  'Next.js 14 App Router UI in app/ with page routes for home, aggregation, weather performance, and whitepaper.',
  'React components in components/ and core simulation UI in components/Simulator.tsx with supporting logic in lib/aggregation/.',
  'API routes under app/api/ for market data, news, prices, and tickers; external API clients in lib/external/.',
  'Python utilities in scripts/ for historical price and weather data processing.',
  'Persistent database or backend service beyond Next.js API routes: Not found in repo.'
]);

addHeading('How To Run (Minimal)');
addBullets([
  'Prerequisite: Node.js v18 or higher.',
  'Install dependencies: npm install',
  'Start dev server: npm run dev',
  'Open: http://localhost:3000'
]);

// Final layout guard (basic)
if (y > pageHeight - margin) {
  console.warn('Warning: Content overflowed the page.');
}

doc.save('output/pdf/eighty760-summary.pdf');
