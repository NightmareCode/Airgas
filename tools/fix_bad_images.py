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

FIXES = {
    'Dräger Saver CF Compressed Air Escape Device': 'Draeger Saver CF Compressed Air Escape Device industrial breathing apparatus orange bag isolated white background',
    'AlphaTec Light Type TR Chemical Suit': 'AlphaTec Light Type TR Chemical green Suit hazmat isolated white background',
    'Pyrovatek Coverall': 'Pyrovatek Coverall flame resistant fire protective orange clothing isolated white background',
    'Medical Breathing Air': 'Medical Breathing Air gas cylinder green tank isolated white background',
    'Compressed Oxygen O2': 'Compressed Oxygen O2 black gas cylinder isolated white background',
    'Aluminum 10L Medical Oxygen Cylinder with Trolley Set': 'Aluminum 10L Medical Oxygen Cylinder with Trolley Set tank isolated white background',
    'L&W Full Synthetic Oil for HP Breathing Air Compressor': 'Lenhardt & Wagner Full Synthetic compressor Oil bottle isolated white background',
    'Cutting Disk': 'Metal Grinding Cutting Disk abrasive wheel generic isolated white background',
    'L&W Compressor 100E': 'Lenhardt & Wagner Compressor 100E breathing air compressor machine isolated white background',
    'L&W Compressor Safety Valve 330bar': 'Compressor Safety Valve 330 bar brass fitting isolated white background',
    'L&W Cylinder for BA Storage': 'high pressure cylinder cascade system breathing air storage Lenhardt & Wagner isolated white background',
    'L&W Service Kit for LW 230/280/320': 'compressor service kit filter spare parts lenhardt & wagner isolated white background'
}

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

    temp_dir = 'assets/temp_img'
    os.makedirs(temp_dir, exist_ok=True)

    for item_to_fix, custom_query in FIXES.items():
        # find in products.json
        product = next((p for p in data['products'] if p['name'] == item_to_fix), None)
        if not product:
            print(f"NOT FOUND IN JSON: {item_to_fix}")
            continue

        folder_name = CATEGORY_FOLDERS.get(product['category'])
        output_dir = os.path.join('assets', folder_name)
        
        # JS Regex Sanitization
        filename = sanitize_filename(product['name'])
        filepath = os.path.join(output_dir, filename)

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
