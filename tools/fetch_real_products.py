import urllib.request
import urllib.parse
import json
import html
import re

def decode_html(text):
    return html.unescape(text)

def clean_description(content):
    if not content: return ""
    # Remove HTML tags
    clean = re.sub(r'<[^>]+>', '', content)
    # Remove extra whitespace
    clean = ' '.join(clean.split())
    # Limit length
    if len(clean) > 120:
        clean = clean[:117].strip() + "..."
    return clean

def get_brand(name):
    name_upper = name.upper()
    brands = [
        "MSA", "DPI SEKUR", "HONEYWELL", "ANSELL", "PORTWEST", "DUPONT", 
        "GLOBESTOCK", "GVS", "AUSTCORP", "INDUSTRIAL SCIENTIFIC", "L&W", 
        "KARAM", "DELTA PLUS", "KERMEL", "TOP GLOVE", "SEITRON", "DRÄGER", 
        "DRAGER", "HARVIK", "ELVEX", "TRELLEBORG", "SHELL", "CHIYODA", 
        "JASIC", "KEMPPI", "PAB", "AVEC", "BW", "RAE", "HORNUNG", "NJSTAR",
        "CAVAGNA", "SANOSUB", "VTI", "CHIYODA", "LICOTA", "YMH", "WELICHI"
    ]
    for b in brands:
        if b in name_upper:
            # Return proper case
            return b.title() if b != "MSA" and b != "SCBA" and b != "DPI SEKUR" else b
    return "Airgas Technology"

all_products = []
page = 1

print("Starting deep fetch from WordPress API...")

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
                content = item.get("content", {}).get("rendered", "")
                excerpt = item.get("excerpt", {}).get("rendered", "")
                
                description = clean_description(excerpt if excerpt.strip() else content)
                
                # Fetch featured media
                img_url = ""
                yoast = item.get("yoast_head_json", {})
                og_image = yoast.get("og_image", [])
                if og_image and len(og_image) > 0:
                    img_url = og_image[0].get("url", "")
                
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

                # Mapping Logic
                lname = name.lower()
                brand = get_brand(name)
                
                all_products.append({
                    "id": item.get("id"),
                    "name": name,
                    "description": description,
                    "url": link,
                    "imgUrl": img_url,
                    "brand": brand
                })
            page += 1
    except urllib.error.HTTPError as e:
        if e.code == 400: break
        print("Error:", e); break
    except Exception as e:
        print("Error:", e); break

print(f"Total fetched: {len(all_products)}")

# Categorization Helper
def get_industry(name):
    name_lower = name.lower()
    if any(k in name_lower for k in ['service', 'inspection', 'hydro test', 'testing', 'refill', 'calibration', 'maintenance', 'repair']):
        return 'Services & Maintenance'
    if any(k in name_lower for k in ['calibration gas', 'gas mixture', 'isobutylene', 'multi gas', 'single gas', 'h2s', 'co2', 'o2', 'lel', 'span gas']):
        if 'detector' not in name_lower: return 'Gas Calibration'
    if any(k in name_lower for k in ['scba', 'eebd', 'detector', 'tripod', 'winch', 'escape', 'lifeline', 'confined', 'distress', 'cairns', 'altair', 'max xt', 'gasalert', 'mask fit test']):
        return 'Confined Space'
    if any(k in name_lower for k in ['weld', 'electrode', 'kemppi', 'arc 150', 'arc 250', 'mig', 'tig', 'flux-cored', 'gouging', 'cutting torch']):
        return 'Welding'
    if any(k in name_lower for k in ['cylinder', 'gas', 'argon', 'nitrogen', 'oxygen', 'helium', 'helox', 'ammonia', 'compressed air', 'co2', 'acetylene', 'regulator', 'valve', 'bullnose', 'trolley', 'rack', 'manifold', 'filling system', 'pump']):
        return 'Gases & Equipment'
    if any(k in name_lower for k in ['maritime', 'marine', 'lifeboat', 'ship', 'offshore']):
        return 'Maritime & Offshore'
    if any(k in name_lower for k in ['suit', 'fireman', 'nomex', 'kermel', 'chemical', 'hazmat', 'fire fighting', 'frypro', 'heat resistant']):
        return 'Oil & Gas'
    return 'PPE'

def get_subcategory(name):
    lname = name.lower()
    if "boot" in lname or "shoe" in lname: return "Footwear"
    if "mask" in lname or "respirator" in lname: return "Respiratory Protection"
    if "suit" in lname or "coverall" in lname: return "Body Protection"
    if "detector" in lname or "sensor" in lname: return "Gas Detection"
    if "cylinder" in lname: return "Gas Storage"
    if "weld" in lname: return "Welding Equipment"
    if "service" in lname or "test" in lname or "calibration" in lname: return "Technical Services"
    return "General Equipment"

# Re-categorize and save
for p in all_products:
    p['industry'] = get_industry(p['name'])
    p['subCategory'] = get_subcategory(p['name'])

with open("assets/products.json", "w", encoding='utf-8') as f:
    json.dump({
        "industryDescriptions": {
            'Confined Space': 'Essential safety solutions for confined space entry: SCBA, EEBD, multi-gas detectors, tripods, and winches.',
            'Oil & Gas': 'High-performance protection for hazardous environments: chemical suits, fireman PPE, and flame-resistant gear.',
            'Welding': 'Professional welding systems: MIG/TIG/ARC machines, premium electrodes, and specialized cutting accessories.',
            'Gases & Equipment': 'Comprehensive gas solutions: industrial and medical gases, high-pressure regulators, cylinders, and storage systems.',
            'Gas Calibration': 'Precision measurement tools: calibration gases, specialized sensors, and testing mixtures for gas detection accuracy.',
            'PPE': 'Head-to-toe protection: high-visibility vests, safety helmets, specialized gloves, and protective eyewear.',
            'Services & Maintenance': 'Expert technical services: SCBA/EEBD hydro testing, certification, gas detector calibration, and equipment maintenance.',
            'Maritime & Offshore': 'Certified marine safety: offshore life-saving equipment, specialized breathing apparatus, and corrosion-resistant gear.'
        },
        "products": all_products
    }, f, indent=2)

print("Updated assets/products.json with real brands and descriptions.")
