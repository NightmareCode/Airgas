import urllib.request
import urllib.parse
import json
import html

industries = ["Confined Space", "Maritime", "Oil and gas", "Other industries"]

def decode_html(text):
    return html.unescape(text)

all_products = []
page = 1

while True:
    print(f"Fetching page {page}...")
    url = f"https://airgas.my/wp-json/wp/v2/product?per_page=100&page={page}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            if not data:
                break
            
            for item in data:
                name = decode_html(item.get("title", {}).get("rendered", ""))
                link = item.get("link", "")
                
                # Fetch featured media if possible
                img_url = ""
                yoast = item.get("yoast_head_json", {})
                og_image = yoast.get("og_image", [])
                if og_image and len(og_image) > 0:
                    img_url = og_image[0].get("url", "")
                
                # If yoast fails, check featured media
                if not img_url:
                    wp_featuredmedia = item.get("_links", {}).get("wp:featuredmedia", [])
                    if wp_featuredmedia:
                        media_url = wp_featuredmedia[0].get("href", "")
                        if media_url:
                            try:
                                m_req = urllib.request.Request(media_url, headers={'User-Agent': 'Mozilla/5.0'})
                                with urllib.request.urlopen(m_req) as m_resp:
                                    m_data = json.loads(m_resp.read().decode('utf-8'))
                                    img_url = m_data.get("source_url", "")
                            except Exception:
                                pass

                # Assign industry based on simple keywords or cycle
                ind = "Other industries"
                lname = name.lower()
                if "scba" in lname or "eebd" in lname or "confined" in lname or "detector" in lname or "tripod" in lname or "winch" in lname:
                    ind = "Confined Space"
                elif "marine" in lname or "boat" in lname or "ship" in lname or "life" in lname:
                    ind = "Maritime"
                elif "gas" in lname or "oil" in lname or "chemical" in lname or "suit" in lname or "flame" in lname or "fire" in lname:
                    ind = "Oil and gas"
                
                # Default subCategory
                subCat = "Equipment"
                if "boot" in lname or "shoe" in lname: subCat = "Boots"
                elif "mask" in lname or "respirator" in lname: subCat = "Mask"
                elif "suit" in lname or "coverall" in lname: subCat = "Protective Suit"
                elif "detector" in lname or "sensor" in lname: subCat = "Detector"
                elif "cylinder" in lname: subCat = "Cylinder"
                elif "scba" in lname: subCat = "SCBA"
                
                all_products.append({
                    "id": item.get("id"),
                    "name": name,
                    "industry": ind,
                    "subCategory": subCat,
                    "url": link,
                    "imgUrl": img_url,
                    "brand": "Airgas Technology" # Default
                })
            page += 1
    except urllib.error.HTTPError as e:
        if e.code == 400: # past last page
            break
        print("Error:", e)
        break
    except Exception as e:
        print("Error:", e)
        break

print(f"Total fetched: {len(all_products)}")

# Update products.json
with open("assets/products.json", "r", encoding='utf-8') as f:
    base_data = json.load(f)

base_data["industries"] = industries
base_data["industryDescriptions"] = {
    "Confined Space": "Specialized equipment for safe confined space entry and rescue.",
    "Maritime": "Marine safety and life-saving appliances.",
    "Oil and gas": "Heavy-duty protection and gas equipment for the energy sector.",
    "Other industries": "General industrial safety, welding, and maintenance products."
}
base_data["products"] = all_products

with open("assets/products.json", "w", encoding='utf-8') as f:
    json.dump(base_data, f, indent=2)

print("Updated assets/products.json successfully.")
