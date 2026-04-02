import os
import glob
from PIL import Image, ImageEnhance

def enhance_image(image_path, output_path):
    try:
        img = Image.open(image_path)
        
        # Determine if image is RGBA (has transparency) to preserve it
        has_alpha = img.mode == 'RGBA'
        if not has_alpha and img.mode != 'RGB':
            img = img.convert('RGBA')
            has_alpha = True
            
        print(f"Enhancing {os.path.basename(image_path)}...")
        
        # 1. Enhance Color (Saturation)
        color_enhancer = ImageEnhance.Color(img)
        img = color_enhancer.enhance(1.2) # 20% more vibrant
        
        # 2. Enhance Contrast
        contrast_enhancer = ImageEnhance.Contrast(img)
        img = contrast_enhancer.enhance(1.15) # 15% more contrast
        
        # 3. Enhance Sharpness
        sharpness_enhancer = ImageEnhance.Sharpness(img)
        img = sharpness_enhancer.enhance(1.5) # 50% sharper
        
        img.save(output_path, "PNG")
        print(f"Successfully saved enhanced image: {output_path}")
        return True
    except Exception as e:
        print(f"Failed to enhance {image_path}: {e}")
        return False

def main():
    input_dir = "assets/BrandLogo"
    
    # We will overwrite the images with enhanced versions
    search_pattern = os.path.join(input_dir, "*.png")
    images = glob.glob(search_pattern)
    
    if not images:
        print("No images found to enhance.")
        return
        
    print(f"Found {len(images)} images to enhance.")
    
    success_count = 0
    for img_path in images:
        if enhance_image(img_path, img_path):
            success_count += 1
            
    print(f"Done! Enhanced {success_count} out of {len(images)} images.")

if __name__ == "__main__":
    main()
