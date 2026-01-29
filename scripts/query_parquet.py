
import pandas as pd
import sys
import json
import os

def query_parquet(year, location=None):
    try:
        # Construct path relative to repo root (assuming script run from root or we find it)
        # We'll try a few common paths
        base_paths = [
            'public/data/prices',
            '../public/data/prices',
            '/Users/michaelbarry/Documents/GitHub/eighty760-Home/public/data/prices'
        ]
        
        file_path = None
        for base in base_paths:
            p = os.path.join(base, f'ercot_rtm_{year}.parquet')
            if os.path.exists(p):
                file_path = p
                break
        
        if not file_path:
            return {"error": f"File not found for year {year}"}

        df = pd.read_parquet(file_path)
        
        # Filter by Location if provided
        if location:
            # Check column name usually 'Location' or 'Settlement Point'
            if 'Location' in df.columns:
                df = df[df['Location'] == location]
            else:
                return {"error": "Location column not found"}

        # Convert all datetime columns to string (or just all object/datetime columns)
        # Optimization: Only select relevant columns to reduce payload
        cols_to_keep = []
        time_col = 'Time'
        if 'Time_Central' in df.columns:
            time_col = 'Time_Central'
            cols_to_keep.append(time_col)
        elif 'Time' in df.columns:
            cols_to_keep.append('Time')
            
        if 'SPP' in df.columns:
            cols_to_keep.append('SPP')
            
        if cols_to_keep:
            df = df[cols_to_keep]
            
        # Convert Time to string
        df[time_col] = df[time_col].astype(str)
        
        # Convert to list of lists (compact)
        # Format: [[Time, SPP], [Time, SPP], ...]
        data = df.values.tolist()
        return {"data": data, "format": "compact", "columns": cols_to_keep}

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Year required"}))
        sys.exit(1)
        
    year = sys.argv[1]
    location = sys.argv[2] if len(sys.argv) > 2 else None
    
    result = query_parquet(year, location)
    print(json.dumps(result))
