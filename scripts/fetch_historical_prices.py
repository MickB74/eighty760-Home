import gridstatus
import pandas as pd
import os
import time

OUTPUT_DIR = "public/data/prices"
# Fetch 2015-2019 (final batch)
years = list(range(2015, 2020))

def fetch_year(year):
    print(f"Fetching 15-min data for {year}...")
    iso = gridstatus.Ercot()
    try:
        # Fetch RTM Settlement Point Prices (15-min intervals)
        df = iso.get_rtm_spp(year=year)
        
        # Verify data
        print(f"  Got {len(df):,} rows")
        
        # Check time intervals
        time_diff = df['Time'].diff()
        intervals = time_diff.value_counts().head(3)
        print(f"  Top intervals:\n{intervals}")
        
        # Standardize Time
        if not pd.api.types.is_datetime64_any_dtype(df['Time']):
            df['Time'] = pd.to_datetime(df['Time'], utc=True)
        
        # Save to parquet
        output_file = os.path.join(OUTPUT_DIR, f"ercot_rtm_{year}.parquet")
        df.to_parquet(output_file)
        print(f"  ✓ Saved {output_file}\n")
        
    except Exception as e:
        print(f"  ✗ Error fetching {year}: {e}\n")

if __name__ == "__main__":
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    
    for year in years:
        fetch_year(year)
        time.sleep(2)  # Rate limiting
