import json
import os
import sys
from PIL import Image, ImageEnhance
import requests
from io import BytesIO

# Import existing tools logic
sys.path.append(os.path.join(os.getcwd(), 'tools'))
from image_downloader import download_and_process_image

def enhance_image_logic(img):
    # Determine if image is RGBA (has transparency) to preserve it
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
        
    # 1. Enhance Color (Saturation)
    color_enhancer = ImageEnhance.Color(img)
    img = color_enhancer.enhance(1.2) # 20% more vibrant
    
    # 2. Enhance Contrast
    contrast_enhancer = ImageEnhance.Contrast(img)
    img = contrast_enhancer.enhance(1.15) # 15% more contrast
    
    # 3. Enhance Sharpness
    sharpness_enhancer = ImageEnhance.Sharpness(img)
    img = sharpness_enhancer.enhance(1.5) # 50% sharper
    
    return img

def main():
    json_path = 'assets/products.json'
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found.")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    products = data.get('products', [])
    print(f"Syncing up to 10 products per industry for {len(products)} total products...")

    industry_counts = {}
    limit = 10

    for i, product in enumerate(products):
        name = product.get('name')
        img_url = product.get('imgUrl')
        industry = product.get('industry', 'Other industries')
        
        industry_counts[industry] = industry_counts.get(industry, 0)
        if industry_counts[industry] >= limit:
            continue
        
        if not img_url:
            print(f"[{i+1}/{len(products)}] Skipping {name} - No image URL")
            continue

        # Create industry-based folder structure
        folder_name = industry.replace(" ", "")
        output_dir = os.path.join('assets', folder_name)
        os.makedirs(output_dir, exist_ok=True)

        # Sanitize filename (EXACTLY as script.js does)
        # sanitizedFilename = product.name.replace(/[^a-zA-Z0-9\s]/g, '').trim() + '.png';
        import re
        sanitized_name = re.sub(r'[^a-zA-Z0-9\s]', '', name).strip()
        filename = f"{sanitized_name}.png"
        output_path = os.path.join(output_dir, filename)

        if os.path.exists(output_path):
            print(f"[{i+1}/{len(products)}] Skipping {name} - Already exists")
            continue

        print(f"[{i+1}/{len(products)}] Processing: {name}")
        
        # 1. Download and remove background
        success = download_and_process_image(img_url, output_path, remove_bg=True)
        
        if success:
            industry_counts[industry] += 1
            # 2. Enhance quality
            try:
                img = Image.open(output_path)
                enhanced_img = enhance_image_logic(img)
                enhanced_img.save(output_path, "PNG")
                print(f"  -> Enhanced and saved to {output_path}")
            except Exception as e:
                print(f"  -> Error enhancing {name}: {e}")
        else:
            print(f"  -> Failed to download/process {name}")

    print("\nSync complete!")

if __name__ == "__main__":
    main()
