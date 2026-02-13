from PIL import Image, ImageDraw, ImageFont
import os

def create_placeholder(filename, text, bg_color=(30, 41, 59), icon_text=""):
    assets_dir = os.path.join(os.getcwd(), 'assets')
    if not os.path.exists(assets_dir):
        os.makedirs(assets_dir)
    
    filepath = os.path.join(assets_dir, filename)
    
    # Create a base image with a gradient-like feel (solid for now)
    img = Image.new('RGBA', (800, 800), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a rounded rectangle for the "product"
    shape_color = bg_color
    draw.rounded_rectangle([100, 100, 700, 700], radius=50, fill=shape_color)
    
    # Try to add text/icon
    try:
        # Use a default font
        font = ImageFont.load_default()
    except:
        font = None
        
    # Draw icon/text in the middle
    if icon_text:
        draw.text((400, 400), icon_text, fill=(255, 255, 255, 100), anchor="mm")
    
    img.save(filepath, "PNG")
    print(f"Created {filepath}")

if __name__ == "__main__":
    placeholders = [
        ("savage_a40_nobg.png", "Welding Helmet", (50, 50, 50), "🛡️"),
        ("industrial_cylinder_nobg.png", "Gas Cylinder", (70, 70, 70), "🔋"),
        ("fireman_suit_nobg.png", "Fireman Suit", (150, 50, 50), "👨‍🚒"),
        ("extinguisher_refill_nobg.png", "Refill Parts", (180, 50, 50), "🧯"),
        ("medical_setup_nobg.png", "Medical Equipment", (50, 100, 150), "🏥"),
        ("testing_equip_nobg.png", "Testing Lab", (100, 100, 100), "🔬"),
        ("rental_gear_nobg.png", "Rental Services", (50, 80, 120), "🏗️"),
        ("height_safety_nobg.png", "Height Gear", (120, 80, 40), "🧗"),
        ("training_gas_nobg.png", "Gas Detection Training", (40, 120, 120), "⚠️"),
        ("training_scba_nobg.png", "SCBA Training", (50, 100, 200), "👨‍🚒"),
        ("training_fit_test_nobg.png", "Fit Test Training", (100, 50, 150), "🎭"),
        ("training_confined_nobg.png", "Confined Space Training", (80, 80, 80), "🕳️")
    ]
    
    for filename, name, color, icon in placeholders:
        create_placeholder(filename, name, color, icon)
