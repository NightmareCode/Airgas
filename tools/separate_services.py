import json
import re

def separate_services():
    with open('assets/products.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Strictly define what constitutes a service in this catalog
    # Most services start with '** Service'
    
    service_count = 0
    product_count = 0
    
    for p in data['products']:
        name_lower = p['name'].lower()
        
        # High confidence services
        is_service = name_lower.startswith('** service')
        
        # Additional services that might not start with **
        if any(k in name_lower for k in ['hydro testing', 'refilling service', 'calibration service', 'maintenance service']):
            if not any(k in name_lower for k in ['machine', 'unit', 'pump', 'kit', 'equipment']):
                is_service = True
        
        # Manual check for specific items based on previous outputs
        if "helium balloon gas with refilled cylinder" in name_lower:
            is_service = True

        if is_service:
            p['industries'] = ['Services & Maintenance']
            p['industry'] = 'Services & Maintenance'
            p['subCategory'] = 'Technical Services'
            service_count += 1
        else:
            # Ensure Services & Maintenance is NOT in the industries list for products
            if 'industries' in p:
                if 'Services & Maintenance' in p['industries']:
                    p['industries'].remove('Services & Maintenance')
                
                # If industries list became empty, default to PPE or something
                if not p['industries']:
                    # Re-map if it lost its only industry
                    # (Though it should have others if it was a product)
                    # For safety, let's just make sure it has something
                    p['industries'] = ['PPE']
                
                p['industry'] = p['industries'][0]
            product_count += 1

    print(f"Processed {len(data['products'])} items.")
    print(f"Services identified: {service_count}")
    print(f"Products identified: {product_count}")

    with open('assets/products.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

if __name__ == '__main__':
    separate_services()
