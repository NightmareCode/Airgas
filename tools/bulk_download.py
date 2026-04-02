import os
import time
from image_downloader import download_and_process_image

BRANDS = {
    "MSA Safety": "msasafety.com",
    "DPI Sekur": "sekur.com",
    "Honeywell": "honeywell.com",
    "Ansell": "ansell.com",
    "Portwest": "portwest.com",
    "DuPont": "dupont.com",
    "Globestock": "globestock.co.uk",
    "GVS": "gvs.com",
    "AustCorp": "austcorpinternational.com",
    "Industrial Scientific": "indsci.com",
    "L&W Compressor": "lw-compressors.com",
    "Karam": "karam.in",
    "Delta Plus": "deltaplus.eu",
    "Kermel": "kermel.com",
    "Top Glove": "topglove.com",
    "Seitron": "seitron.com",
    "Dräger": "draeger.com",
    "Harvik": "harvikboots.com",
    "Elvex": "elvex.com",
    "Trelleborg": "trelleborg.com",
    "Shell": "shell.com",
    "Chiyoda": "chiyoda-seiki.co.jp",
    "JASIC": "jasictech.com",
    "Kemppi": "kemppi.com"
}

def main():
    output_dir = "assets/BrandLogo"
    os.makedirs(output_dir, exist_ok=True)
    
    for brand_name, domain in BRANDS.items():
        # Handle special characters in filenames
        safe_name = brand_name.lower().replace(" ", "_").replace("&", "and").replace("ä", "a")
        output_path = os.path.join(output_dir, f"{safe_name}.png")
        
        if os.path.exists(output_path):
            print(f"Skipping {brand_name}, file exists.")
            continue
            
        url = f"https://www.google.com/s2/favicons?domain={domain}&sz=256"
        
        print(f"Processing {brand_name}...")
        success = download_and_process_image(url, output_path, remove_bg=True)
        if not success:
             # Try unstyled logo API or skip background removal if downloading fails or error
             print(f"Failed to process {brand_name} with background removal")
        
        # Rate limit
        time.sleep(1)

if __name__ == "__main__":
    main()
