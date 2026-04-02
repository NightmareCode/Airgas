import urllib.request
import os
import argparse
import requests
from io import BytesIO
from PIL import Image
from rembg import remove

def download_and_process_image(url, output_path, remove_bg=True):
    """
    Downloads an image from a URL, optionally removes its background, and saves it.
    """
    print(f"Downloading from: {url}")
    try:
        # Add a user-agent to avoid 403 Forbidden errors
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        # Open image with PIL
        img = Image.open(BytesIO(response.content))
        
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
            
        print("Image downloaded successfully.")

        if remove_bg:
            print("Removing background...")
            output_img = remove(img)
            
            # Additional cleanup: crop to content
            print("Cropping to content...")
            bbox = output_img.getbbox()
            if bbox:
                 output_img = output_img.crop(bbox)
        else:
            output_img = img
            
        print(f"Saving to {output_path}...")
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        
        output_img.save(output_path, "PNG")
        print(f"Successfully saved to {output_path}\n")
        return True
            
    except Exception as e:
        print(f"Error processing {url}: {e}\n")
        return False

def main():
    parser = argparse.ArgumentParser(description="Image Downloader and Background Remover")
    parser.add_argument("--url", help="URL of the image to download")
    parser.add_argument("--output", help="Output file path (must end in .png)")
    parser.add_argument("--no-bg-removal", action="store_true", help="Skip background removal")
    
    args = parser.parse_args()
    
    if args.url and args.output:
        download_and_process_image(args.url, args.output, not args.no_bg_removal)
    elif args.url or args.output:
         print("Error: Both --url and --output must be provided.")
    else:
        # Interactive mode or list mode could go here
        print("Required arguments missing. Use --help for usage information.")

if __name__ == "__main__":
    main()
