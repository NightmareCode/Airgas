import re
import sys
import json
import os

def extract_from_file(filename):
    if not os.path.exists(filename):
        return None

    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Get category name from title tag or page title
    # Format: <title>Category Name &#8211; Airgas</title>
    title_match = re.search(r'<title>(.*?) &#8211; Airgas</title>', content)
    category = title_match.group(1).strip() if title_match else "Unknown Category"
    
    # Remove leading numbers if present (e.g. "1 PPE for ERT")
    category = re.sub(r'^\d+\s+', '', category)

    products = []
    
    # Regex to find product blocks. We'll split by <li ... product ...>
    # Note: re.split might consume the delimiter, so we'll just find all matches
    # A safer way is to find all li tags with class containing 'product' and then extract content inside
    
    # We can use finditer with DOTALL to match across lines
    # Pattern: <li [^>]*class="[^"]*product[^"]*"[^>]*>(.*?)</li>
    # But nested <li> might break this.
    # Fortunately, product list items usually don't contain nested <li> in this theme (Astra/WooCommerce).
    
    pattern = re.compile(r'<li [^>]*class="[^"]*product[^"]*"[^>]*>(.*?)</li>', re.DOTALL)
    
    matches = pattern.finditer(content)
    
    for match in matches:
        block = match.group(1)
        
        # Extract Title
        title_m = re.search(r'<h2 class="woocommerce-loop-product__title">([^<]+)</h2>', block)
        if not title_m:
            continue
        title = title_m.group(1).strip()
        
        # Extract Image URL
        # Look for img inside astra-shop-thumbnail-wrap
        img_m = re.search(r'<div class="astra-shop-thumbnail-wrap">.*?<img [^>]*src="([^"]+)"', block, re.DOTALL)
        if not img_m:
             # Fallback: just look for first img src in the block
             img_m = re.search(r'<img [^>]*src="([^"]+)"', block)
        
        img_url = img_m.group(1) if img_m else None
        
        # Extract Link
        link_m = re.search(r'<a href="([^"]+)"', block)
        link = link_m.group(1) if link_m else None

        products.append({
            "name": title,
            "description": title, # Using title as description for now as requested
            "image_url": img_url,
            "link": link
        })

    return {
        "category": category,
        "products": products
    }

if __name__ == "__main__":
    files = sys.argv[1:]
    all_data = []
    for f in files:
        data = extract_from_file(f)
        if data:
            all_data.append(data)
    
    print(json.dumps(all_data, indent=2))
