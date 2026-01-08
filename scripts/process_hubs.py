import pandas as pd
import json
import os

# Configuration
YEARS = list(range(2010, 2026))  # 2010-2025 (16 years)
HUBS = ['HB_NORTH', 'HB_SOUTH', 'HB_WEST', 'HB_HOUSTON', 'HB_PAN']
INPUT_DIR = 'public/data/prices'
OUTPUT_DIR = 'public/data/prices'

def process_year(year):
    parquet_path = os.path.join(INPUT_DIR, f'ercot_rtm_{year}.parquet')
    if not os.path.exists(parquet_path):
        print(f"Skipping {year}: {parquet_path} not found")
        return

    print(f"Processing {year}...")
    try:
        df = pd.read_parquet(parquet_path)
        
        # Ensure SPP is numeric
        df['SPP'] = pd.to_numeric(df['SPP'], errors='coerce')
        
        # Filter for Hubs
        hub_data = {}
        for hub in HUBS:
            # Filter rows for this hub
            hub_df = df[df['Location'] == hub].copy()
            
            # Sort by time just in case
            # Ensure Time column exists and is sortable
            if 'Time' in hub_df.columns:
                hub_df.sort_values('Time', inplace=True)
            elif 'Interval Start' in hub_df.columns:
                hub_df.sort_values('Interval Start', inplace=True)
            
            # Extract prices
            # We want exact 8760 (or 8784 for leap)
            prices = hub_df['SPP'].tolist()
            
            # Simple validation
            if len(prices) < 8760:
                print(f"Warning: {hub} in {year} has only {len(prices)} hours")
            
            hub_data[hub] = prices
            
        # Calculate Average Hub
        # Avg of the 4 main ones? Or just rely on HB_HUBAVG if it exists?
        # Let's see if HB_HUBAVG exists in the DF
        if 'HB_HUBAVG' in df['Location'].values:
             avg_df = df[df['Location'] == 'HB_HUBAVG'].sort_values('Time' if 'Time' in df.columns else 'Interval Start')
             hub_data['HB_HUBAVG'] = avg_df['SPP'].tolist()

        # Save to JSON
        output_path = os.path.join(OUTPUT_DIR, f'ercot_{year}_hubs.json')
        with open(output_path, 'w') as f:
            json.dump(hub_data, f)
            
        print(f"Saved {output_path}")

    except Exception as e:
        print(f"Error processing {year}: {e}")

if __name__ == "__main__":
    for year in YEARS:
        process_year(year)
