import json
import re

def get_industries(name, brand, current_industry):
    name_lower = name.lower()
    brand_lower = brand.lower()
    
    industries = set()
    
    # 1. Confined Space
    if any(k in name_lower for k in ['scba', 'eebd', 'detector', 'tripod', 'winch', 'escape', 'lifeline', 'confined', 'distress', 'blower', 'ventilator', 'harness', 'lanyard', 'rescue', 'altair', 'gasalert', 'rattler', 'toxirae', 'multigas', 'single gas']):
        industries.add('Confined Space')
        
    # 2. Oil & Gas
    if any(k in name_lower for k in ['chemical', 'hazmat', 'flame', 'fire', 'nomex', 'kermel', 'frypro', 'suit', 'coverall', 'hood', 'boot', 'glove', 'helmet', 'gas', 'cylinder', 'regulator', 'valve', 'oil', 'synthetic', 'hp compressor', 'explosion proof', 'light']):
        if 'welding' not in name_lower: # filter out generic welding
            industries.add('Oil & Gas')
            
    # 3. Welding
    if any(k in name_lower for k in ['weld', 'electrode', 'arc ', 'arc 150', 'arc 250', 'mig', 'tig', 'gouging', 'cutting torch', 'chiyoda', 'jasic', 'kemppi', 'welding machine', 'welding gauge', 'welding helmet', 'welding shield']):
        industries.add('Welding')
        
    # 4. Gases & Equipment
    if any(k in name_lower for k in ['cylinder', 'gas', 'argon', 'nitrogen', 'oxygen', 'helium', 'helox', 'ammonia', 'compressed air', 'co2', 'acetylene', 'regulator', 'valve', 'bullnose', 'trolley', 'rack', 'manifold', 'filling system', 'pump', 'compressor', 'hose', 'washer']):
        industries.add('Gases & Equipment')
        
    # 5. Gas Calibration
    if any(k in name_lower for k in ['calibration', 'span gas', 'mixture', 'zero gas', 'isobutylene', 'h2s', 'co2', 'o2', 'lel', 'sensor', 'pid', 'bump test', 'docking', 'galaxy gx2', 'intellidox', 'tdock']):
        industries.add('Gas Calibration')
        
    # 6. PPE
    if any(k in name_lower for k in ['glove', 'helmet', 'glasses', 'goggle', 'ear plug', 'earmuff', 'mask', 'coverall', 'vest', 'cone', 'lanyard', 'safety glass', 'boot', 'shoes', 'lifting belt', 'elbow', 'knee', 'protection', 'face shield', 'jacket', 'trouser', 'combat', 'drawstring', 'cotton', 'examination', 'nitrile', 'hyflex', 'esd', 'antistatic', 'biztex', 'bizweld', 'vgard', 'voyager', 'verishield', 'vform', 'trauma strap']):
        industries.add('PPE')
        
    # 7. Services & Maintenance
    if any(k in name_lower for k in ['service', 'inspection', 'hydro test', 'testing', 'refill', 'calibration', 'maintenance', 'repair', 'kit', 'spare', 'replacement', 'cert', 'as11', 'as22', 'as23', 'posicheck', 'test equipment', 'instrument']):
        industries.add('Services & Maintenance')
        
    # 8. Maritime & Offshore
    # Most of Airgas products are suitable for marine/offshore if they are safety related
    # Specifically: breathing apparatus, gas detection, fire protection, marine gases
    if any(k in name_lower for k in ['marine', 'maritime', 'ship', 'vessel', 'lifeboat', 'offshore', 'rig', 'deck', 'bunker', 'solas', 'med', 'navy', 'dnv', 'abs', 'lloyds', 'galvanized cable', 'srh-30']):
        industries.add('Maritime & Offshore')
    
    # Breathing and detection are ALWAYS marine/offshore relevant
    if 'Confined Space' in industries:
        industries.add('Maritime & Offshore')
    if 'Oil & Gas' in industries:
        industries.add('Maritime & Offshore')
    if 'Gases & Equipment' in industries and any(k in name_lower for k in ['oxygen', 'acetylene', 'nitrogen', 'argon', 'cylinder', 'regulator']):
        industries.add('Maritime & Offshore')

    # Fallback to current if empty
    if not industries:
        industries.add('PPE')
        
    return sorted(list(industries))

def main():
    with open('assets/products.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for p in data['products']:
        p['industries'] = get_industries(p['name'], p.get('brand', ''), p.get('industry', 'PPE'))
        # We can remove the old 'industry' field or keep it for now
        # I'll keep it as the "primary" one for backwards compat or logic
        if p['industries']:
            p['industry'] = p['industries'][0]
            
    # Add Sub-Category Knowledge
    data['subCategoryKnowledge'] = {
        "Gas Detection": {
            "title": "What is Gas Detection?",
            "points": [
                "Definition: Systems used to identify and measure concentrations of hazardous gases (toxic, flammable, or oxygen-depleting) in real-time.",
                "Purpose: Protects workers from acute poisoning (e.g., CO, H2S) and prevents explosions by detecting gases before they reach combustible limits.",
                "Importance: Acts as an 'early warning system' in environments where hazards are invisible, odorless, and potentially fatal.",
                "Key Uses: Essential for confined space entry, leak detection in pipelines, and continuous area monitoring in chemical plants."
            ]
        },
        "Respiratory Protection": {
            "title": "Why is Respiratory Protection Critical?",
            "points": [
                "Last Line of Defense: Used when airborne hazards (dust, mists, toxic gases) cannot be fully removed through ventilation or engineering.",
                "Prevention of Chronic Illness: Protects against long-term diseases like silicosis, asbestosis, and occupational asthma.",
                "Immediate Survival: SCBA and EEBD systems provide clean air in oxygen-deficient or IDLH (Immediately Dangerous to Life or Health) atmospheres.",
                "Compliance: Strict adherence to international standards ensures equipment reliability during critical emergencies."
            ]
        },
        "Technical Services": {
            "title": "The Role of Specialized Maintenance",
            "points": [
                "Equipment Reliability: Services like SCBA hydrostatic testing ensure that high-pressure cylinders can safely hold breathable air without risk of rupture.",
                "Accuracy: Regular gas detector calibration resets sensors to ensure they correctly report dangerous gas levels despite environmental 'drift'.",
                "Compliance & Certification: Mandatory testing (DOT, NFPA, OSHA) provides the documentation required for legal and safety audits.",
                "Risk Mitigation: Proactive maintenance identifies aging equipment before it fails, preventing catastrophic workplace accidents."
            ]
        },
        "Welding Equipment": {
            "title": "Precision and Safety in Welding",
            "points": [
                "Advanced Technology: Modern MIG/TIG/ARC systems allow for high-precision joining of thin materials and heavy structural steel.",
                "Environmental Control: Includes specialized shielding gases (Argon, CO2) to protect welds from atmospheric contamination.",
                "Fume Management: Proper equipment must be paired with ventilation to protect operators from toxic metal particulates.",
                "Thermal Protection: Essential for managing extreme UV radiation and molten metal splashes common in heavy fabrication."
            ]
        },
        "Gas Storage": {
            "title": "Safe Handling of Compressed Gases",
            "points": [
                "Structural Integrity: Cylinders are designed to safely contain gases at pressures up to 300 bar (4500 psi).",
                "Segregation: Proper storage involves separating oxidizers (Oxygen) from flammable gases (Acetylene) by at least 20 feet.",
                "Stability: Racks and manifolds prevent cylinders from tipping, which can turn a damaged valve into a high-velocity projectile.",
                "Environmental Safety: Well-ventilated storage prevents the accumulation of heavy gases that could displace oxygen in low-lying areas."
            ]
        },
        "Body Protection": {
            "title": "Shielding the Workforce",
            "points": [
                "Chemical Barriers: Hazmat suits and resistant coveralls prevent skin absorption of corrosive toxins and systemic poisoning.",
                "Thermal Shields: Flame-resistant (FR) gear protects against flash fires and electric arcs in extreme energy environments.",
                "Physical Protection: Heavy-duty fabrics mitigate risks of abrasions, lacerations, and physical trauma from falling objects.",
                "Productivity: High-quality PPE reduces 'safety-related anxiety', allowing workers to focus on high-precision tasks with confidence."
            ]
        },
        "General Equipment": {
            "title": "Supporting Industrial Workflows",
            "points": [
                "Essential Tools: High-visibility vests, safety cones, and specialized kits that form the foundation of a safe work site.",
                "Versatility: Products designed to meet the broad safety needs of construction, manufacturing, and general maintenance.",
                "Ergonomics: Lifting belts and supports reduce physical strain and long-term musculoskeletal injuries.",
                "Site Management: Traffic and zone control equipment ensures safe movement of personnel and vehicles."
            ]
        }
    }
    
    with open('assets/products.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

if __name__ == '__main__':
    main()
