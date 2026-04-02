import os
import glob
from PIL import Image

def trim_transparent_borders(image_path):
    try:
        img = Image.open(image_path)
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
            
        print(f"Trimming {os.path.basename(image_path)}...")
        
        # getbbox() finds the bounding box of non-zero regions.
        # But for an RGBA image, a pixel is transparent if the alpha channel is 0.
        # Let's extract the alpha channel to find the true bounding box.
        alpha = img.split()[-1]
        bbox = alpha.getbbox()
        
        if bbox:
            cropped_img = img.crop(bbox)
            cropped_img.save(image_path, "PNG")
            print(f"  Cropped to '{bbox}'.")
            return True
        else:
            print("  Image is entirely empty or zero.")
            return False
            
    except Exception as e:
        print(f"Failed to trim {image_path}: {e}")
        return False

def main():
    input_dir = "assets/BrandLogo"
    images = glob.glob(os.path.join(input_dir, "*.png"))
    
    if not images:
        print("No images found.")
        return
        
    print(f"Found {len(images)} images to process.")
    for img_path in images:
        trim_transparent_borders(img_path)
        
    print("Trimming complete!")

if __name__ == "__main__":
    main()
