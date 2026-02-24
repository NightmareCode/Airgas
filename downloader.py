import urllib.request
import os
import sys

def download(url, filename):
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        print(f"Downloading {url} to {filename}...")
        urllib.request.urlretrieve(url, filename)
        
        if os.path.exists(filename):
            size = os.path.getsize(filename)
            msg = f"SUCCESS: {url} -> {filename} ({size} bytes)\n"
        else:
            msg = f"FAILURE: {url} -> {filename} (File not created)\n"
            
        with open('download_log.txt', 'a') as f:
            f.write(msg)
    except Exception as e:
        msg = f"FAILURE: {url} -> {filename} ({str(e)})\n"
        with open('download_log.txt', 'a') as f:
            f.write(msg)

if __name__ == "__main__":
    if len(sys.argv) == 3:
        download(sys.argv[1], sys.argv[2])
    else:
        # Default for testing
        download('https://s7d9.scene7.com/is/image/minesafetyappliances/ALTAIR4XRMultigasDetector_000080001600001026?wid=1000&hei=1000&fmt=jpg', 'assets/msa_altair_4xr.jpg')
