import urllib.request
import re
import json

req = urllib.request.Request("https://airgas.my/product-sitemap.xml", headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        content = response.read().decode('utf-8')
        urls = re.findall(r'<loc>(.*?)</loc>', content)
        print(f"Found {len(urls)} product urls in sitemap")
        
        products = []
        for u in urls:
            slug = u.rstrip('/').split('/')[-1]
            name = slug.replace('-', ' ').title()
            products.append({"name": name, "url": u})
        
        with open("actual_products.json", "w") as f:
            json.dump(products, f, indent=2)
except Exception as e:
    print("Error with product-sitemap:", e)

    # Let's try WordPress API
    print("Trying WP-JSON...")
    req = urllib.request.Request("https://airgas.my/wp-json/wp/v2/product?per_page=100", headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            print(f"Found {len(data)} products via API")
            products = []
            for item in data:
                products.append({
                    "name": item.get("title", {}).get("rendered", ""),
                    "url": item.get("link", "")
                })
            with open("actual_products.json", "w") as f:
                json.dump(products, f, indent=2)
    except Exception as e2:
        print("Error with WP API:", e2)

