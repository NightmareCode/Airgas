import json
import re

def get_new_category(name, old_cat):
    name_lower = name.lower()
    
    if any(k in name_lower for k in ['scba', 'eebd', 'detector', 'tripod', 'winch', 'escape', 'lifeline', 'confined']):
        if 'calibration' in name_lower or 'sensor' in name_lower:
            return 'Gas Calibration'
        return 'Confined Space'
        
    if any(k in name_lower for k in ['weld', 'electrode', 'kemppi']):
        return 'Welding'
        
    if any(k in name_lower for k in ['gas cylinder', 'argon', 'nitrogen', 'oxygen', 'helium', 'helox', 'ammonia', 'compressed air', 'co2']):
        return 'Gases'
        
    if any(k in name_lower for k in ['suit', 'fireman', 'nomex', 'kermel', 'chemical']):
        return 'Oil and Gas'
        
    if any(k in name_lower for k in ['glove', 'helmet', 'glasses', 'goggle', 'ear plug', 'earmuff', 'mask', 'coverall', 'vest', 'cone']):
        return 'PPE'
        
    # Default to generic category mapping if none of the above matches
    if 'Oil and gas' in old_cat or 'Oilandgas' in old_cat: return 'Oil and Gas'
    if 'Maritime' in old_cat: return 'Maritime'
    if 'Confined' in old_cat: return 'Confined Space'
    if 'PPE' in old_cat: return 'PPE'
    if 'GasEquipment' in old_cat or 'Gas' in old_cat: return 'Gases'
    if 'Welding' in old_cat: return 'Welding'
    
    return 'PPE' # Fallback

def main():
    with open('assets/products.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for p in data.get('products', []):
        old_cat = p.get('industry', 'Other industries')
        p['original_industry'] = old_cat
        p['industry'] = get_new_category(p['name'], old_cat)
        
    with open('assets/products.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

if __name__ == '__main__':
    main()
