import json
import os
import glob
import shutil
import re
from icrawler.builtin import BingImageCrawler
from PIL import Image, ImageEnhance
from io import BytesIO
from rembg import remove

def sanitize_filename(name):
    return re.sub(r'[^a-zA-Z0-9\s]', '', name).strip() + '.png'

def get_folder_name(industry):
    return industry.replace(' ', '').replace('&', 'and')

def process_image(img_path):
    with open(img_path, 'rb') as f:
        img_content = f.read()
    no_bg_bytes = remove(img_content)
    img = Image.open(BytesIO(no_bg_bytes))
    
    # Enhancement
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    enhancer = ImageEnhance.Color(img)
    img = enhancer.enhance(1.2)
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.15)
    enhancer = ImageEnhance.Sharpness(img)
    img = enhancer.enhance(1.5)
    
    # Trim
    alpha = img.split()[-1]
    bbox = alpha.getbbox()
    if bbox:
        img = img.crop(bbox)
    return img

FIXES = {
    'Drger Saver CF Compressed Air Escape Device': 'Draeger Saver CF Compressed Air Escape Device industrial breathing apparatus orange bag isolated white background',
    'AlphaTec Light Type TR': 'AlphaTec Light Type TR Chemical green Suit hazmat isolated white background',
    'Pyrovatek Coverall': 'Pyrovatek Coverall flame resistant fire protective orange clothing isolated white background',
    'Medical Breathing Air': 'Medical Breathing Air gas cylinder green tank isolated white background',
    'Compressed Oxygen O2': 'Compressed Oxygen O2 black gas cylinder isolated white background',
    'Aluminum 10L Medical Oxygen Cylinder with Trolley Set': 'Aluminum 10L Medical Oxygen Cylinder with Trolley Set tank isolated white background',
    'Full synthetic for HP breathing air Compressor, 4509001, Oil L&W , 1L / unit, #3443': 'Lenhardt & Wagner Full Synthetic compressor Oil bottle isolated white background',
    'SCBA set China RHZKF': 'SCBA breathing apparatus set china isolated white background',
    'Fireman suit frypro X series': 'fireman suit frypro X series heat resistant isolated white background',
    'motionSCOUT MSA 1': 'MSA motionSCOUT personal distress signal unit isolated white background',
    'MSA 10038560 MiniScape Escape Respirator,': 'MSA MiniScape Escape Respirator mouth piece isolated white background'
}

def main():
    with open('assets/products.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    temp_dir = 'assets/temp_img'
    os.makedirs(temp_dir, exist_ok=True)

    for item_to_fix, custom_query in FIXES.items():
        # Match case-insensitively just in case
        product = next((p for p in data['products'] if p['name'].lower() == item_to_fix.lower()), None)
        if not product:
            print(f"NOT FOUND IN JSON: {item_to_fix}")
            continue

        folder_name = get_folder_name(product['industry'])
        output_dir = os.path.join('assets', folder_name)
        os.makedirs(output_dir, exist_ok=True)
        
        filename = sanitize_filename(product['name'])
        filepath = os.path.join(output_dir, filename)

        print(f"FIXING: {product['name']}")
        print(f"SEARCHING: {custom_query}")

        try:
            for f in glob.glob(os.path.join(temp_dir, "*")):
                os.remove(f)
                
            crawler = BingImageCrawler(storage={'root_dir': temp_dir}, log_level=40)
            crawler.crawl(keyword=custom_query, max_num=1)
            
            temp_images = glob.glob(os.path.join(temp_dir, "*"))
            if not temp_images:
                print(f"  -> No results for {custom_query}")
                continue
                
            print(f"  -> Downloaded. Processing background removal...")
            img = process_image(temp_images[0])
            img.save(filepath, format="PNG")
            print(f"  -> Saved successfully to {filepath}!\n")
                
        except Exception as e:
            print(f"  -> Error: {e}\n")

    try:
        shutil.rmtree(temp_dir)
    except:
        pass

if __name__ == '__main__':
    main()
