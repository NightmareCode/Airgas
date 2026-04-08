import json
import re

def get_brand(name):
    name_upper = name.upper()
    # Ordered by specificity/importance
    brands = [
        ("ALPHATEC", "AlphaTec"),
        ("ANSELL", "Ansell"),
        ("MSA", "MSA Safety"),
        ("DPI SEKUR", "DPI Sekur"),
        ("HONEYWELL", "Honeywell"),
        ("PORTWEST", "Portwest"),
        ("DUPONT", "DuPont"),
        ("TYVEK", "Tyvek"),
        ("GLOBESTOCK", "Globestock"),
        ("GVS", "GVS"),
        ("AUSTCORP", "AustCorp"),
        ("INDUSTRIAL SCIENTIFIC", "Industrial Scientific"),
        ("L&W", "L&W Compressor"),
        ("KARAM", "Karam"),
        ("DELTA PLUS", "Delta Plus"),
        ("KERMEL", "Kermel"),
        ("TOP GLOVE", "Top Glove"),
        ("SEITRON", "Seitron"),
        ("DRÄGER", "Dräger"),
        ("DRAGER", "Dräger"),
        ("HARVIK", "Harvik"),
        ("ELVEX", "Elvex"),
        ("TRELLEBORG", "Trelleborg"),
        ("SHELL", "Shell"),
        ("CHIYODA", "Chiyoda"),
        ("JASIC", "JASIC"),
        ("KEMPPI", "Kemppi"),
        ("PAB", "PAB"),
        ("AVEC", "AVEC"),
        ("BW", "BW Technologies"),
        ("RAE", "RAE Systems"),
        ("HORNUNG", "Hornung"),
        ("NJSTAR", "NJSTAR"),
        ("CAVAGNA", "Cavagna"),
        ("SANOSUB", "Sanosub"),
        ("VTI", "VTI"),
        ("LICOTA", "Licota"),
        ("YMH", "YMH"),
        ("WELICHI", "Welichi")
    ]
    
    for key, display in brands:
        if key in name_upper:
            return display
            
    return "Airgas Technology"

def main():
    with open('assets/products.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for p in data['products']:
        # Fix Brand
        if p.get('industry') == 'Services & Maintenance' or ('industries' in p and 'Services & Maintenance' in p['industries']):
            p['brand'] = "Airgas Technology"
        else:
            p['brand'] = get_brand(p['name'])
            
    # Compact Industry Descriptions
    data['industryDescriptions'] = {
        'Confined Space': 'Safety gear for restricted entry: SCBA, detectors, and rescue systems.',
        'Oil & Gas': 'Heavy-duty protection: chemical suits, FR gear, and energy-sector gas tools.',
        'Welding': 'Professional welding: machines, electrodes, and high-precision accessories.',
        'Gases & Equipment': 'Gas solutions: industrial/medical gases, cylinders, and high-pressure regulators.',
        'Gas Calibration': 'Measurement precision: calibration gases and specialized detection sensors.',
        'PPE': 'Workplace protection: safety helmets, gloves, eyewear, and high-vis apparel.',
        'Services & Maintenance': 'Technical support: hydro testing, certification, and equipment calibration.',
        'Maritime & Offshore': 'Marine safety: shipboard survival gear and offshore breathing apparatus.'
    }

    # Compact Sub-Category Knowledge
    data['subCategoryKnowledge'] = {
        "Gas Detection": {
            "title": "Gas Detection Essentials",
            "points": [
                "Identifies toxic, flammable, or oxygen-deficient hazards in real-time.",
                "Early warning system prevents poisoning and combustible accidents.",
                "Critical for confined spaces, pipelines, and industrial area monitoring."
            ]
        },
        "Respiratory Protection": {
            "title": "Respiratory Safety",
            "points": [
                "The 'last line of defense' against airborne dust, mists, and toxic gases.",
                "Prevents chronic lung diseases and immediate oxygen-deficiency risks.",
                "Includes SCBA, EEBD, and filtered respirators for IDLH environments."
            ]
        },
        "Technical Services": {
            "title": "Expert Maintenance",
            "points": [
                "Hydro testing verifies cylinder strength; calibration ensures sensor accuracy.",
                "Complies with DOT, NFPA, and OSHA standards for safety certification.",
                "Reduces operational risk by identifying equipment failure before it happens."
            ]
        },
        "Welding Equipment": {
            "title": "Industrial Welding",
            "points": [
                "Premium ARC/MIG/TIG systems for high-precision structural joining.",
                "Shielding gases protect welds from atmospheric contamination.",
                "Pairs with FR gear and ventilation to manage UV and toxic fume hazards."
            ]
        },
        "Gas Storage": {
            "title": "Safe Gas Handling",
            "points": [
                "Heavy-duty cylinders and valves designed for pressures up to 300 bar.",
                "Requires strict segregation of oxidizers and flammable gases for safety.",
                "Racks and manifolds provide stability to prevent tipping and valve damage."
            ]
        },
        "Body Protection": {
            "title": "Full Body Shielding",
            "points": [
                "Chemical and flame-resistant suits prevent skin absorption and burns.",
                "Protects against abrasions, impacts, and environmental thermal stress.",
                "Essential for worker confidence and productivity in high-risk zones."
            ]
        },
        "General Equipment": {
            "title": "Site Safety Basics",
            "points": [
                "Foundational tools: high-vis vests, safety cones, and specialized kits.",
                "Broad utility across construction, shipping, and manufacturing sectors.",
                "Ergonomic designs reduce physical strain and workplace injuries."
            ]
        }
    }
    
    with open('assets/products.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    print("Updated brands and compacted all descriptions.")

if __name__ == '__main__':
    main()
