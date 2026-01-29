# ERCOT Resource Node Price Data - Download Guide

## Overview
This guide helps you download historical Settlement Point Price (SPP) data for all 995 ERCOT resource nodes.

## Data Sources

### Real-Time Market (RTM) - 15-minute intervals
- **Report**: NP6-788-CD "RTM LMPs by Resource Nodes, Load Zones & Trading Hubs"
- **URL**: http://www.ercot.com/mp/data-products/data-product-details?id=NP6-788-CD
- **Format**: ZIP files containing CSV
- **Size**: ~50GB per year (uncompressed)

### Day-Ahead Market (DAM) - Hourly
- **Report**: NP4-190-CD "DAM Settlement Point Prices"  
- **URL**: http://www.ercot.com/mp/data-products/data-product-details?id=NP4-190-CD
- **Format**: ZIP files containing CSV
- **Size**: ~10GB per year (uncompressed)

## Manual Download Steps

### Step 1: Navigate to ERCOT Data Portal

For RTM data:
1. Go to: http://www.ercot.com/mp/data-products/data-product-details?id=NP6-788-CD
2. Scroll to "Historical Data Files" section
3. Look for annual archives (e.g., "2024_ERCOT_RTM_SPP.zip")

For DAM data:
1. Go to: http://www.ercot.com/mp/data-products/data-product-details?id=NP4-190-CD
2. Follow similar process

### Step 2: Download Data Files

Download files for each year you need (2020-2025):

```bash
# Create download directory
mkdir -p ercot_spp_downloads/RTM_2024
mkdir -p ercot_spp_downloads/DAM_2024
# ... repeat for each year
```

Place downloaded ZIP files in the appropriate directories:
- RTM files → `ercot_spp_downloads/RTM_YYYY/`
- DAM files → `ercot_spp_downloads/DAM_YYYY/`

### Step 3: Extract Files

If files are still zipped:

```bash
cd ercot_spp_downloads/RTM_2024
unzip "*.zip"
```

### Step 4: Convert to Parquet

Run the conversion script:

```bash
# Convert single year
node scripts/convert_spp_to_parquet.mjs --input=./ercot_spp_downloads/RTM_2024

# Or convert all at once
node scripts/convert_spp_to_parquet.mjs --all
```

This will create optimized parquet files in `public/data/prices/`:
- `ercot_rtm_2024_full.parquet`
- `ercot_dam_2024_full.parquet`

## Alternative: Scripted Download (if URLs are stable)

If you discover stable download URLs, you can use the script:

```bash
# Download specific year
node scripts/download_spp_data.mjs --year=2024 --market=RTM

# Download all years
node scripts/download_spp_data.mjs --all
```

## Expected File Sizes

| Year | RTM (uncompressed) | RTM (parquet) | DAM (uncompressed) | DAM (parquet) |
|------|-------------------|---------------|-------------------|---------------|
| 2020 | ~45 GB           | ~4-6 GB       | ~8 GB             | ~800 MB       |
| 2021 | ~47 GB           | ~4-6 GB       | ~8 GB             | ~800 MB       |
| 2022 | ~48 GB           | ~5-7 GB       | ~9 GB             | ~900 MB       |
| 2023 | ~50 GB           | ~5-7 GB       | ~9 GB             | ~900 MB       |
| 2024 | ~52 GB           | ~6-8 GB       | ~10 GB            | ~1 GB         |
| 2025 | ~20 GB (YTD)     | ~2-3 GB       | ~4 GB (YTD)       | ~400 MB       |

**Total**: ~300GB uncompressed → ~40-50GB parquet

## Verification

After conversion, verify the data:

```bash
# Check parquet files exist
ls -lh public/data/prices/

# Test with the check_locations script
node scripts/check_locations.mjs
```

Expected output: ~995 unique resource node locations

## Integration

Once parquet files are in place, the existing API (`/api/prices/history`) will automatically serve resource node data. No code changes needed!

Test in UI:
1. Go to Node Prices page
2. Select a resource node from dropdown (e.g., "AEEC_UNIT1")
3. Data should load and display

## Troubleshooting

### "No data available"
- Verify parquet file exists in `public/data/prices/`
- Check file naming: `ercot_rtm_YYYY_full.parquet`
- Run: `node scripts/check_locations.mjs` to verify locations

### "File too large" errors during conversion
- Process one year at a time
- Ensure you have enough RAM (16GB+ recommended)
- Use `--max-old-space-size=8192` flag: `node --max-old-space-size=8192 scripts/convert_spp_to_parquet.mjs`

### Download URLs not working
- ERCOT periodically changes their portal
- Fall back to manual browser download
- Check ERCOT announcements for new data access methods
