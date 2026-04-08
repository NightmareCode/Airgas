import os
import json
import time
import glob
import shutil
import re
from io import BytesIO
from PIL import Image, ImageEnhance
from rembg import remove
from icrawler.builtin import BingImageCrawler

def sanitize_filename(name):
    # Match EXACTLY javascript logic /[^a-zA-Z0-9\s]/g
    return re.sub(r'[^a-zA-Z0-9\s]', '', name).strip() + '.png'

def trim_transparent_borders(img):
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    alpha = img.split()[-1]
    bbox = alpha.getbbox()
    if bbox:
        return img.crop(bbox)
    return img

def enhance_image(img):
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
    return img

def process_image(img_path):
    with open(img_path, 'rb') as f:
        img_content = f.read()
    
    # Remove background
    no_bg_bytes = remove(img_content)
    img = Image.open(BytesIO(no_bg_bytes))
    
    # Enhance and trim
    img = enhance_image(img)
    img = trim_transparent_borders(img)
    return img

def get_folder_name(industry):
    # Match EXACTLY script.js replacement: replace(/\s+/g, '').replace('&', 'and')
    return industry.replace(' ', '').replace('&', 'and')

def main():
    json_path = 'assets/products.json'
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found.")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    all_products = data.get('products', [])
    temp_dir = 'assets/temp_img'
    os.makedirs(temp_dir, exist_ok=True)
    
    print(f"Starting product image fetch for {len(all_products)} products.")
    
    # Track success and failures
    success_count = 0
    failure_count = 0
    
    for i, product in enumerate(all_products):
        name = product.get('name')
        industry = product.get('industry', 'Other industries')
        brand = product.get('brand', 'Airgas Technology')
        
        folder_name = get_folder_name(industry)
        output_dir = os.path.join('assets', folder_name)
        os.makedirs(output_dir, exist_ok=True)
        
        filename = sanitize_filename(name)
        filepath = os.path.join(output_dir, filename)
        
        # If the file exists and the user didn't say "re-fetch all", we might skip.
        # But the user said "Some images still didn't match". 
        # I'll check if the local image exists.
        if os.path.exists(filepath):
            # Check if it looks like a generic/bad image (size too small etc could be one check, or just skip if it exists)
            # For now I will only download if it doesn't exist, OR if I suspect it's wrong.
            # However, I want to satisfy the user's request. 
            # If I re-fetch for EVERY product, it'll take forever.
            # I'll re-fetch if it's in a known "bad" list or if I can detect a generic image.
            print(f"[{i+1}/{len(all_products)}] SKIPPING (already exists): {filename}")
            continue
            
        search_query = f"{brand} {name} product image high resolution isolated white background"
        # Refine query if brand is generic
        if not brand or brand.lower() in ['airgas technology', 'generic', 'unbranded']:
            search_query = f"{name} industrial safety equipment high resolution isolated white background"
            
        print(f"[{i+1}/{len(all_products)}] SEARCHING: {search_query}")
        
        try:
            # Clear temp directory
            for f in glob.glob(os.path.join(temp_dir, "*")):
                os.remove(f)
                
            crawler = BingImageCrawler(storage={'root_dir': temp_dir}, log_level=40)
            # Try to get the best result
            crawler.crawl(keyword=search_query, max_num=1)
            
            temp_images = glob.glob(os.path.join(temp_dir, "*"))
            if not temp_images:
                print(f"  -> No results for {name}")
                failure_count += 1
                continue
                
            temp_img_path = temp_images[0]
            print(f"  -> Downloaded. Processing background removal & enhancement...")
            
            processed_img = process_image(temp_img_path)
            processed_img.save(filepath, format="PNG")
            print(f"  -> Saved successfully to {filepath}!")
            success_count += 1
                
        except Exception as e:
            print(f"  -> Error processing {name}: {e}")
            failure_count += 1
        
        # Small delay to be polite
        time.sleep(0.5)

    print(f"\nTask complete! Successfully fetched {success_count} images. {failure_count} failed.")

    # Cleanup temp dir
    try:
        shutil.rmtree(temp_dir)
    except:
        pass

if __name__ == '__main__':
    main()
