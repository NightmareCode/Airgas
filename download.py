import requests
import sys
import os

def download_file(url, local_filename):
    try:
        print(f"Starting download: {url}")
        with requests.get(url, stream=True, timeout=15) as r:
            r.raise_for_status()
            # Ensure the directory exists
            os.makedirs(os.path.dirname(local_filename), exist_ok=True)
            
            with open(local_filename, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
        
        if os.path.exists(local_filename):
            size = os.path.getsize(local_filename)
            print(f"Successfully downloaded to {local_filename} ({size} bytes)")
        else:
            print(f"Error: File {local_filename} was not created.")
    except Exception as e:
        print(f"Error downloading {url}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python download.py <url> <local_filename>")
    else:
        download_file(sys.argv[1], sys.argv[2])
