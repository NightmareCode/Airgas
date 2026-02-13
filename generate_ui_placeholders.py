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
        # Industrial Gases
        ("industrial_oxygen_nobg.png", "Industrial Oxygen", (0, 100, 255), "O₂"),
        ("acetylene_nobg.png", "Acetylene Gas", (200, 50, 50), "�"),
        ("nitrogen_nobg.png", "Industrial Nitrogen", (100, 100, 100), "N₂"),
        ("argon_nobg.png", "Argon Gas", (0, 200, 0), "Ar"),
        ("co2_nobg.png", "Carbon Dioxide", (50, 50, 50), "CO₂"),
        
        # Medical Gases
        ("medical_oxygen_nobg.png", "Medical Oxygen", (255, 255, 255), "🏥"),
        ("nitrous_oxide_nobg.png", "Nitrous Oxide", (0, 0, 150), "N₂O"),

        # Firefighting
        ("fire_extinguisher_co2_nobg.png", "CO2 Extinguisher", (200, 0, 0), "�"),
        ("fire_extinguisher_powder_nobg.png", "Dry Powder Extinguisher", (200, 50, 0), "🧯"),

        # Safety PPE
        ("safety_helmet_nobg.png", "Safety Helmet", (255, 200, 0), "⛑️"),
        ("safety_gloves_nobg.png", "Industrial Gloves", (150, 150, 150), "🧤"),
        ("fireman_suit_nobg.png", "Fireman Suit", (255, 100, 0), "🧑‍�"),
    ]
    
    for filename, name, color, icon in placeholders:
        create_placeholder(filename, name, color, icon)
