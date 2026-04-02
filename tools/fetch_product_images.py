import os
import json
import time
import glob
import shutil
from io import BytesIO
from PIL import Image, ImageEnhance
from rembg import remove
from icrawler.builtin import BingImageCrawler

def sanitize_filename(name):
    return "".join([c for c in name if c.isalnum() or c == ' ']).strip() + '.png'

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
    
    enhancer = ImageEnhance.Color(img)
    img = enhancer.enhance(1.2)
    
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.15)
    
    enhancer = ImageEnhance.Sharpness(img)
    img = enhancer.enhance(1.5)
    return img

def process_image(img_path):
    with open(img_path, 'rb') as f:
        img_content = f.read()
    
    no_bg_bytes = remove(img_content)
    img = Image.open(BytesIO(no_bg_bytes))
    img = enhance_image(img)
    img = trim_transparent_borders(img)
    return img

def main():
    with open('assets/products.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    CATEGORY_FOLDERS = {
        'PPE for ERT': 'PPEForERT',
        'PPE at Works': 'PPEAtWorks',
        'Gases': 'Gases',
        'Gas Equipment': 'GasEquipment',
        'Personal Care': 'PersonalCare',
        'Service & Maintenance': 'ServiceAndMaintenance',
        'Welding Products': 'WeldingProducts'
    }
    
    all_products = data['products']
    temp_dir = 'assets/temp_img'
    os.makedirs(temp_dir, exist_ok=True)
    
    print(f"Starting auto-fetch for all {len(all_products)} products across {len(CATEGORY_FOLDERS)} categories via Bing.")
    
    for i, product in enumerate(all_products):
        category = product['category']
        folder_name = CATEGORY_FOLDERS.get(category)
        if not folder_name:
            continue
            
        output_dir = os.path.join('assets', folder_name)
        os.makedirs(output_dir, exist_ok=True)
        
        filename = sanitize_filename(product['name'])
        filepath = os.path.join(output_dir, filename)
        
        if os.path.exists(filepath):
            print(f"[{i+1}/{len(all_products)}] SKIPPING (already exists): {filename}")
            continue
            
        search_query = f"{product['brand']} {product['name']} product image isolated white background"
        if not product['brand'] or product['brand'].lower() == 'generic' or product['brand'].lower() == 'unbranded':
            search_query = f"{product['name']} industrial safety product isolated white background"
            
        print(f"[{i+1}/{len(all_products)}] SEARCHING: {search_query}")
        
        try:
            # Clear temp directory
            for f in glob.glob(os.path.join(temp_dir, "*")):
                os.remove(f)
                
            crawler = BingImageCrawler(storage={'root_dir': temp_dir}, log_level=40)
            crawler.crawl(keyword=search_query, max_num=1)
            
            temp_images = glob.glob(os.path.join(temp_dir, "*"))
            if not temp_images:
                print(f"  -> No results for {product['name']}")
                continue
                
            temp_img_path = temp_images[0]
            print(f"  -> Downloaded. Processing background removal & enhancement...")
            
            processed_img = process_image(temp_img_path)
            processed_img.save(filepath, format="PNG")
            print(f"  -> Saved successfully to {filepath}!")
                
        except Exception as e:
            print(f"  -> Error processing {product['name']}: {e}")
        
        time.sleep(1)

    # Cleanup temp dir
    try:
        shutil.rmtree(temp_dir)
    except:
        pass

if __name__ == '__main__':
    main()
