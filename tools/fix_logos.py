import os
import glob
import shutil
import re
from icrawler.builtin import BingImageCrawler
from PIL import Image, ImageEnhance
from io import BytesIO
from rembg import remove

def sanitize_filename(name):
    return name.lower().replace(" ", "_").replace("&", "and").replace("ä", "a") + ".png"

def process_image(img_path):
    with open(img_path, 'rb') as f:
        img_content = f.read()
    
    # Remove background
    try:
        no_bg_bytes = remove(img_content)
        img = Image.open(BytesIO(no_bg_bytes))
    except Exception as e:
        print(f"  -> Background removal failed: {e}. Using original.")
        img = Image.open(img_path)
    
    # Enhancement
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Increase saturation
    enhancer = ImageEnhance.Color(img)
    img = enhancer.enhance(1.2)
    
    # Increase contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.15)
    
    # Increase sharpness
    enhancer = ImageEnhance.Sharpness(img)
    img = enhancer.enhance(1.5)
    
    # Trim transparent borders
    alpha = img.split()[-1]
    bbox = alpha.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    return img

BRANDS_TO_FIX = {
    "MSA Safety": "MSA Safety The Safety Company wordmark logo transparent png",
    "Honeywell": "Honeywell red wordmark logo transparent png",
    "DuPont": "DuPont oval wordmark logo 2018 transparent png",
    "GVS": "GVS filter technology wordmark logo transparent png",
    "Delta Plus": "Delta Plus safety wordmark logo transparent png",
    "Portwest": "Portwest wordmark logo transparent png",
    "Ansell": "Ansell wordmark logo transparent png",
    "L&W Compressor": "Lenhardt & Wagner LW Compressor logo transparent png",
    "DPI Sekur": "DPI Sekur logo transparent png",
    "Industrial Scientific": "Industrial Scientific wordmark logo transparent png",
    "Seitron": "Seitron wordmark logo transparent png",
    "Top Glove": "Top Glove wordmark logo transparent png",
    "Dräger": "Draeger wordmark logo transparent png",
    "Shell": "Shell pecten wordmark logo transparent png",
    "Elvex": "Elvex logo transparent png",
    "Globestock": "Globestock logo transparent png",
    "Seitron": "Seitron logo transparent png",
    "Karam": "Karam safety logo transparent png"
}

def main():
    output_dir = "assets/BrandLogo"
    temp_dir = "assets/temp_logos"
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(temp_dir, exist_ok=True)
    
    for brand_name, query in BRANDS_TO_FIX.items():
        filename = sanitize_filename(brand_name)
        if brand_name == "L&W Compressor":
            filename = "landw_compressor.png"
            
        output_path = os.path.join(output_dir, filename)
        
        print(f"FIXING LOGO: {brand_name}")
        print(f"SEARCHING: {query}")
        
        try:
            # Clear temp directory
            for f in glob.glob(os.path.join(temp_dir, "*")):
                if os.path.isfile(f):
                    os.remove(f)
                
            crawler = BingImageCrawler(storage={'root_dir': temp_dir}, log_level=40)
            crawler.crawl(keyword=query, max_num=3) # Get top 3 to pick the largest
            
            temp_images = glob.glob(os.path.join(temp_dir, "*"))
            if not temp_images:
                print(f"  -> No results for {brand_name}")
                continue
            
            # Sort by file size to get the highest resolution (heuristic)
            temp_images.sort(key=lambda x: os.path.getsize(x), reverse=True)
            
            for temp_img_path in temp_images:
                try:
                    print(f"  -> Processing {temp_img_path}...")
                    processed_img = process_image(temp_img_path)
                    processed_img.save(output_path, format="PNG")
                    print(f"  -> Saved successfully to {output_path}!")
                    break # Success, move to next brand
                except Exception as e:
                    print(f"  -> Failed to process this image: {e}. Trying next result...")
                    continue
                    
        except Exception as e:
            print(f"  -> Error crawling {brand_name}: {e}")

    # Cleanup
    try:
        shutil.rmtree(temp_dir)
    except:
        pass

if __name__ == "__main__":
    main()
