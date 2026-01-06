import gridstatus
import pandas as pd
import os

OUTPUT_DIR = "public/data/prices"
years = [2020, 2021, 2022]

def fetch_year(year):
    print(f"Fetching {year}...")
    iso = gridstatus.Ercot()
    try:
        # Fetch RTM Settlement Point Prices
        df = iso.get_rtm_spp(year=year)
        
        # Standardize Time
        if not pd.api.types.is_datetime64_any_dtype(df['Time']):
            df['Time'] = pd.to_datetime(df['Time'], utc=True)
            
        # Ensure central time column exists for process_hubs.py efficiency (though process_hubs handles it)
        # But let's just save the raw data compatible with what process_hubs expects
        
        # Save to parquet
        output_file = os.path.join(OUTPUT_DIR, f"ercot_rtm_{year}.parquet")
        df.to_parquet(output_file)
        print(f"Saved {output_file}")
        
    except Exception as e:
        print(f"Error fetching {year}: {e}")

if __name__ == "__main__":
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    for year in years:
        fetch_year(year)
