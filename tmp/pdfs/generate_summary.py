import os

PAGE_WIDTH = 612
PAGE_HEIGHT = 792
MARGIN = 36

lines = []

def add_line(text, size=10, bold=False):
    lines.append({
        'text': text,
        'size': size,
        'bold': bold,
    })

# Content
add_line('Eighty760 App Summary', size=18, bold=True)
add_line('', size=8)

add_line('What It Is', size=12, bold=True)
add_line('Eighty760 is a web-based simulation framework for modeling 24/7 carbon-free energy portfolios and', size=10)
add_line('hourly matching across a full year (8,760 hours). It acts as a digital twin for renewable portfolios', size=10)
add_line('to compare generation against real-world load profiles.', size=10)
add_line('', size=8)

add_line("Who It's For", size=12, bold=True)
add_line('Primary users are energy portfolio planners, sustainability teams, and analysts evaluating 24/7 CFE', size=10)
add_line('performance.', size=10)
add_line('', size=8)

add_line('What It Does', size=12, bold=True)
add_line('- Interactive portfolio simulator to adjust solar, wind, and battery capacity in real time.', size=10)
add_line('- Aggregation tool with live market data, detailed analysis, financials, and scenario comparison.', size=10)
add_line('- Scenario comparison to save and evaluate multiple portfolio configurations side by side.', size=10)
add_line('- Financial modeling for PPA settlement costs, basis risk, battery arbitrage revenue, and REC costs.', size=10)
add_line('- Weather performance backcasting using historical data (2020-2026).', size=10)
add_line('- Global real-time tickers and hourly generation profiles (duck curve, net load).', size=10)
add_line('', size=8)

add_line('How It Works (Repo Evidence)', size=12, bold=True)
add_line('- Next.js 14 App Router UI in app/ with page routes for home, aggregation, weather performance, and', size=10)
add_line('  whitepaper.', size=10)
add_line('- React components in components/ and core simulation UI in components/Simulator.tsx with supporting', size=10)
add_line('  logic in lib/aggregation/.', size=10)
add_line('- API routes under app/api/ for market data, news, prices, and tickers; external API clients in', size=10)
add_line('  lib/external/.', size=10)
add_line('- Python utilities in scripts/ for historical price and weather data processing.', size=10)
add_line('- Persistent database or backend service beyond Next.js API routes: Not found in repo.', size=10)
add_line('', size=8)

add_line('How To Run (Minimal)', size=12, bold=True)
add_line('- Prerequisite: Node.js v18 or higher.', size=10)
add_line('- Install dependencies: npm install', size=10)
add_line('- Start dev server: npm run dev', size=10)
add_line('- Open: http://localhost:3000', size=10)

# Build content stream
content = []
current_y = PAGE_HEIGHT - MARGIN

for item in lines:
    text = item['text']
    size = item['size']
    bold = item['bold']

    # spacing
    if text == '':
        current_y -= 10
        continue

    font = 'F2' if bold else 'F1'

    # Escape PDF text
    safe_text = text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

    # leading
    current_y -= size + 4
    content.append(f"BT /{font} {size} Tf 1 0 0 1 {MARGIN} {current_y} Tm ({safe_text}) Tj ET")

# Compose PDF objects
content_stream = '\n'.join(content).encode('utf-8')

objects = []

def add_object(obj_bytes):
    objects.append(obj_bytes)

add_object(b"<< /Type /Catalog /Pages 2 0 R >>")
add_object(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
add_object(f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>".encode('utf-8'))
add_object(f"<< /Length {len(content_stream)} >>\nstream\n".encode('utf-8') + content_stream + b"\nendstream")
add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

# Write PDF
pdf_path = 'output/pdf/eighty760-summary.pdf'
with open(pdf_path, 'wb') as f:
    f.write(b"%PDF-1.4\n")
    xref_positions = []
    offset = len(b"%PDF-1.4\n")

    for i, obj in enumerate(objects, start=1):
        xref_positions.append(offset)
        obj_header = f"{i} 0 obj\n".encode('utf-8')
        obj_footer = b"\nendobj\n"
        f.write(obj_header)
        f.write(obj)
        f.write(obj_footer)
        offset += len(obj_header) + len(obj) + len(obj_footer)

    xref_start = offset
    f.write(f"xref\n0 {len(objects)+1}\n".encode('utf-8'))
    f.write(b"0000000000 65535 f \n")
    for pos in xref_positions:
        f.write(f"{pos:010d} 00000 n \n".encode('utf-8'))

    f.write(b"trailer\n")
    f.write(f"<< /Size {len(objects)+1} /Root 1 0 R >>\n".encode('utf-8'))
    f.write(b"startxref\n")
    f.write(f"{xref_start}\n".encode('utf-8'))
    f.write(b"%%EOF\n")

print(pdf_path)
