import requests
import pandas as pd
import numpy as np
import os
import json
import time

# Configuration
YEARS = [2020, 2021, 2022, 2023, 2024, 2025]
OUTPUT_DIR = "public/data/profiles"

# Hub Locations (Lat, Lon)
# Based on Price Settlements repo Analysis
HUB_LOCATIONS = {
    "North": (32.3865, -96.8475),   # Waxahachie
    "South": (26.9070, -99.2715),   # Zapata
    "West": (32.4518, -100.5371),   # Roscoe
    "Houston": (29.3013, -94.7977), # Galveston
    "Panhandle": (35.2220, -101.8313), # Amarillo
}

def fetch_openmeteo_data(lat, lon, year):
    """
    Fetch hourly solar and wind data for a specific year.
    """
    url = "https://archive-api.open-meteo.com/v1/archive"
    
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": f"{year}-01-01",
        "end_date": f"{year}-12-31",
        "hourly": "shortwave_radiation,wind_speed_100m",
        "timezone": "UTC"
    }
    
    print(f"  Fetching Open-Meteo data for {lat}, {lon} ({year})...")
    
    try:
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            print(f"  ❌ Error: {response.status_code} {response.text}")
            return None
            
        data = response.json()
        
        # Parse hourly data
        hourly = data['hourly']
        df = pd.DataFrame(hourly)
        
        # Convert time
        df['datetime'] = pd.to_datetime(df['time'])
        
        # Rename columns for clarity
        # shortwave_radiation = GHI (Global Horizontal Irradiance) in W/m2
        # wind_speed_100m is in km/h -> Convert to m/s
        df['GHI_Wm2'] = df['shortwave_radiation']
        df['Wind_Speed_100m_mps'] = df['wind_speed_100m'] / 3.6
        
        return df[['datetime', 'GHI_Wm2', 'Wind_Speed_100m_mps']]

    except Exception as e:
        print(f"  ❌ Exception: {e}")
        return None

def normalize_solar(ghi_series):
    """
    Convert GHI (W/m2) to normalized output (0-1).
    Assumes standard test conditions (1000 W/m2) and 0.85 system efficiency.
    """
    # Formula: (GHI / 1000) * Efficiency
    # Clip at 1.0 (inverter clipping relative to AC capacity)
    # Actually, if capacity is AC, then input is DC. 
    # Let's say DC:AC ratio is 1.2. 
    # Simple model: Output = GHI/1000 * 0.85 (losses). 
    # If GHI is 1000, Output is 0.85. 
    # But usually 'Capacity' is AC Capacity.
    # So we want Output/Capacity.
    # Let's align with the app's previous simple logic:
    # previous: dayShape * seasonal * noise. Peak was ~1.0.
    # Real world: GHI can hit 1100-1200. 1200/1000 * 0.85 = 1.02.
    # Let's clip at 1.0.
    
    normalized = (ghi_series / 1000.0) * 0.85
    return normalized.clip(lower=0.0, upper=1.0)

def normalize_wind(speed_series):
    """
    Convert Wind Speed (m/s) to normalized output (0-1) using IEC Class 2 Power Curve.
    Using 100m wind speed as proxy for 80-100m hub height.
    """
    def power_curve(v):
        # Cut-in: 3 m/s
        # Rated: 12 m/s
        # Cut-out: 25 m/s
        if v < 3.0: return 0.0
        elif v < 12.0: return ((v - 3.0) / 9.0) ** 3
        elif v < 25.0: return 1.0
        else: return 0.0
    
    return speed_series.apply(power_curve)

def process_all():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    for year in YEARS:
        print(f"\nProcessing {year}...")
        for hub, (lat, lon) in HUB_LOCATIONS.items():
            print(f" Processing {hub} Hub...")
            
            df = fetch_openmeteo_data(lat, lon, year)
            
            if df is not None:
                # 1. Solar Profile
                solar_profile = normalize_solar(df['GHI_Wm2'])
                solar_path = os.path.join(OUTPUT_DIR, f"Solar_{hub}_{year}.json")
                
                # Check length - standard (8760) or leap (8784)
                # We save the raw array. Frontend handles slicing/mapping if needed.
                with open(solar_path, 'w') as f:
                    json.dump(solar_profile.tolist(), f)
                print(f"  Saved Solar: {solar_path} ({len(solar_profile)} pts)")
                
                # 2. Wind Profile
                wind_profile = normalize_wind(df['Wind_Speed_100m_mps'])
                wind_path = os.path.join(OUTPUT_DIR, f"Wind_{hub}_{year}.json")
                
                with open(wind_path, 'w') as f:
                    json.dump(wind_profile.tolist(), f)
                print(f"  Saved Wind:  {wind_path} ({len(wind_profile)} pts)")
            
            # Rate limit
            time.sleep(1)

if __name__ == "__main__":
    process_all()
