import os
from fetch_product_images import sanitize_filename, process_image
from icrawler.builtin import BingImageCrawler
import glob
import shutil

def fix_image():
    temp_dir = 'assets/temp_img'
    os.makedirs(temp_dir, exist_ok=True)
    
    # Specific search to avoid kitchen hoods
    search_query = "industrial safety smoke escape hood mask breathing apparatus isolated white background"
    filepath = "assets/PPEForERT/AVECEscapeHood.png"
    
    print(f"SEARCHING: {search_query}")
    
    try:
        # Clear temp directory
        for f in glob.glob(os.path.join(temp_dir, "*")):
            os.remove(f)
            
        crawler = BingImageCrawler(storage={'root_dir': temp_dir}, log_level=40)
        crawler.crawl(keyword=search_query, max_num=1)
        
        temp_images = glob.glob(os.path.join(temp_dir, "*"))
        if not temp_images:
            print(f"  -> No results for {search_query}")
            return
            
        temp_img_path = temp_images[0]
        print(f"  -> Downloaded. Processing background removal & enhancement...")
        
        processed_img = process_image(temp_img_path)
        processed_img.save(filepath, format="PNG")
        print(f"  -> Saved successfully to {filepath}!")
            
    except Exception as e:
        print(f"  -> Error: {e}")
        
    try:
        shutil.rmtree(temp_dir)
    except:
        pass

if __name__ == '__main__':
    fix_image()
