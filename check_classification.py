import json

def check_cylinders():
    with open('assets/products.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    cylinders = [p for p in data['products'] if 'cylinder' in p['name'].lower()]
    for p in cylinders[:30]:
        print(f"{p['name']} -> {p.get('industry')}")

if __name__ == '__main__':
    check_cylinders()
