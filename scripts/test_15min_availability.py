"""
Test GridStatus API availability for 15-minute ERCOT hub prices
spanning 2010-2025.
"""
import gridstatus
import pandas as pd

def test_data_availability():
    """Test if GridStatus has 15-min RTM data for various years."""
    iso = gridstatus.Ercot()
    test_years = [2010, 2012, 2015, 2018, 2020, 2024]
    
    print("Testing GridStatus API for 15-minute RTM data availability...\n")
    
    for year in test_years:
        try:
            print(f"Testing {year}...")
            df = iso.get_rtm_spp(year=year)
            
            # Calculate time intervals
            time_diff = df['Time'].diff()
            mode_interval = time_diff.mode()[0]
            
            # Check for hub prices
            locations = df['Location'].unique()
            hubs = [loc for loc in locations if loc.startswith('HB_')]
            
            print(f"  ✓ {len(df):,} rows")
            print(f"  ✓ Interval: {mode_interval}")
            print(f"  ✓ Hubs found: {len(hubs)} ({', '.join(hubs[:3])}...)")
            print()
            
        except Exception as e:
            print(f"  ✗ ERROR: {e}\n")

if __name__ == "__main__":
    test_data_availability()
