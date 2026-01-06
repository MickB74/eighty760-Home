import json
import os
import numpy as np

# Configuration
YEARS = [2020, 2021, 2022, 2023, 2024, 2025]
HUBS = ['North', 'South', 'West', 'Houston', 'Panhandle']
TECHS = ['Solar', 'Wind']
PROFILE_DIR = 'public/data/profiles'

def generate_tmy():
    print("Generating TMY Profiles...")
    
    for tech in TECHS:
        for hub in HUBS:
            print(f"  Processing {tech} {hub}...")
            
            # Store all profiles for this tech/hub combo
            all_profiles = []
            
            for year in YEARS:
                filename = f"{tech}_{hub}_{year}.json"
                filepath = os.path.join(PROFILE_DIR, filename)
                
                if os.path.exists(filepath):
                    try:
                        with open(filepath, 'r') as f:
                            data = json.load(f)
                            # Ensure we take exactly 8760 hours (truncate leap years)
                            if len(data) >= 8760:
                                all_profiles.append(data[:8760])
                            else:
                                print(f"    Warning: {filename} has {len(data)} hours (less than 8760), skipping.")
                    except Exception as e:
                        print(f"    Error reading {filename}: {e}")
                else:
                    # print(f"    Missing {filename}")
                    pass
            
            if not all_profiles:
                print(f"    No data found for {tech} {hub}, skipping TMY.")
                continue
                
            # Average the profiles
            # Stack into numpy array (N_years x 8760)
            try:
                arr = np.array(all_profiles)
                # Calculate mean across axis 0 (years)
                tmy_profile = np.mean(arr, axis=0).tolist()
                
                # Round to 4 decimal places to save space
                tmy_profile = [round(x, 4) for x in tmy_profile]
                
                # Save TMY file
                output_filename = f"{tech}_{hub}_TMY.json"
                output_path = os.path.join(PROFILE_DIR, output_filename)
                
                with open(output_path, 'w') as f:
                    json.dump(tmy_profile, f)
                    
                print(f"    Saved {output_filename} (Averaged {len(all_profiles)} years)")
                
            except Exception as e:
                print(f"    Error calculating mean for {tech} {hub}: {e}")

if __name__ == "__main__":
    generate_tmy()
