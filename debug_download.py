
import requests
import os
import sys

def download(url, filename):
    log_file = "download_log.txt"
    with open(log_file, "a") as log:
        log.write(f"Attempting to download {url} to {filename}\n")
        try:
            r = requests.get(url, stream=True, timeout=30)
            log.write(f"Status code: {r.status_code}\n")
            r.raise_for_status()
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(filename), exist_ok=True)
            
            with open(filename, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            if os.path.exists(filename):
                size = os.path.getsize(filename)
                log.write(f"Success! File exists. Size: {size} bytes\n")
                log.write(f"Absolute path: {os.path.abspath(filename)}\n")
            else:
                log.write("Error: File does not exist after write operation.\n")
                
        except Exception as e:
            log.write(f"Exception: {str(e)}\n")
        log.write("-" * 20 + "\n")

if __name__ == "__main__":
    assets_dir = r"c:\Intern\Kerja\Website\assets"
    
    images = [
        ("https://s7d9.scene7.com/is/image/minesafetyappliances/ALTAIR4XRMultigasDetector_000080001600001026?wid=1000&hei=1000&fmt=jpg", "msa-altair-4xr.jpg"),
        ("https://www.draeger.com/Products/Image/pss-7000-pi-9105437-141124-en-master.jpg", "draeger-pss-7000.jpg"),
        ("https://www.esab.co.uk/gb/en/products/index.cfm?fuseaction=home.product&productCode=431186", "esab-rogue-es-200i.jpg") # This might be a page, not an image
    ]
    
    # Correcting ESAB image URL - let's find a direct one or use a placeholder if needed
    # For now let's try these two first.
    
    for url, name in images[:2]:
        download(url, os.path.join(assets_dir, name))
