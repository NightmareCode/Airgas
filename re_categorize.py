import json
import re

def get_new_category(name, old_cat):
    name_lower = name.lower()
    
    # Priority 1: Services & Maintenance (Technical services, tests, certification)
    if any(k in name_lower for k in ['service', 'inspection', 'hydro test', 'testing', 'refill', 'calibration', 'maintenance', 'repair']):
        return 'Services & Maintenance'
    
    # Priority 2: Gas Calibration (Specialized sensors/gases for calibration)
    if any(k in name_lower for k in ['calibration gas', 'gas mixture', 'isobutylene', 'multi gas', 'single gas', 'h2s', 'co2', 'o2', 'lel', 'span gas']):
        if 'detector' not in name_lower:
             return 'Gas Calibration'
    
    # Priority 3: Confined Space (SCBA, EEBD, Gas Detectors, Life-lines, Tripods)
    if any(k in name_lower for k in ['scba', 'eebd', 'detector', 'tripod', 'winch', 'escape', 'lifeline', 'confined', 'distress', 'cairns', 'altair', 'max xt', 'gasalert', 'mask fit test']):
        return 'Confined Space'
        
    # Priority 4: Welding (Machines, Electrodes, Gauges, Welding products)
    if any(k in name_lower for k in ['weld', 'electrode', 'kemppi', 'arc 150', 'arc 250', 'mig', 'tig', 'flux-cored', 'gouging', 'cutting torch']):
        return 'Welding'
        
    # Priority 5: Industrial & Medical Gases (The gases themselves, cylinders, regulators)
    if any(k in name_lower for k in ['cylinder', 'gas', 'argon', 'nitrogen', 'oxygen', 'helium', 'helox', 'ammonia', 'compressed air', 'co2', 'acetylene', 'regulator', 'valve', 'bullnose', 'trolley', 'rack', 'manifold', 'filling system', 'pump']):
        if any(k in name_lower for k in ['scba', 'eebd', 'escape']): # If it's for SCBA/EEBD, it might be Confined Space, but usually cylinders are equipment
            if 'service' not in name_lower:
                return 'Gases & Equipment'
        return 'Gases & Equipment'
        
    # Priority 6: Maritime & Offshore
    if any(k in name_lower for k in ['maritime', 'marine', 'lifeboat', 'ship', 'offshore', 'galvanized cable']):
        return 'Maritime & Offshore'

    # Priority 7: Oil & Gas / Chemical Protection (Chemical suits, Fireman PPE)
    if any(k in name_lower for k in ['suit', 'fireman', 'nomex', 'kermel', 'chemical', 'hazmat', 'fire fighting', 'frypro', 'heat resistant', 'frypro']):
        return 'Oil & Gas'
        
    # Priority 8: PPE (Personal Protective Equipment)
    if any(k in name_lower for k in ['glove', 'helmet', 'glasses', 'goggle', 'ear plug', 'earmuff', 'mask', 'coverall', 'vest', 'cone', 'lanyard', 'safety glass', 'boot', 'shoes', 'lifting belt', 'elbow']):
        return 'PPE'
        
    # Default to generic category mapping if none of the above matches
    if 'Oil and gas' in old_cat or 'Oilandgas' in old_cat: return 'Oil & Gas'
    if 'Maritime' in old_cat: return 'Maritime & Offshore'
    if 'Confined' in old_cat: return 'Confined Space'
    if 'PPE' in old_cat: return 'PPE'
    if 'Gas' in old_cat: return 'Gases & Equipment'
    if 'Welding' in old_cat: return 'Welding'
    
    return 'PPE' # Fallback

def main():
    with open('assets/products.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for p in data.get('products', []):
        old_cat = p.get('original_industry', p.get('industry', 'Other industries'))
        p['industry'] = get_new_category(p['name'], old_cat)
        
    # Update industry descriptions
    data['industryDescriptions'] = {
        'Confined Space': 'Essential safety solutions for confined space entry: SCBA, EEBD, multi-gas detectors, tripods, and winches.',
        'Oil & Gas': 'High-performance protection for hazardous environments: chemical suits, fireman PPE, and flame-resistant gear.',
        'Welding': 'Professional welding systems: MIG/TIG/ARC machines, premium electrodes, and specialized cutting accessories.',
        'Gases & Equipment': 'Comprehensive gas solutions: industrial and medical gases, high-pressure regulators, cylinders, and storage systems.',
        'Gas Calibration': 'Precision measurement tools: calibration gases, specialized sensors, and testing mixtures for gas detection accuracy.',
        'PPE': 'Head-to-toe protection: high-visibility vests, safety helmets, specialized gloves, and protective eyewear.',
        'Services & Maintenance': 'Expert technical services: SCBA/EEBD hydro testing, certification, gas detector calibration, and equipment maintenance.',
        'Maritime & Offshore': 'Certified marine safety: offshore life-saving equipment, specialized breathing apparatus, and corrosion-resistant gear.'
    }
        
    with open('assets/products.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

if __name__ == '__main__':
    main()
