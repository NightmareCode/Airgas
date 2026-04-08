import json
import re

def get_brand(name):
    name_upper = name.upper()
    
    brand_map = {
        "MSA Safety": ["MSA", "ALTAIR", "GALAXY GX2", "CAIRNS", "V-GARD", "VOYAGER", "V-FORM", "WORKMAN", "ULTRA ELITE", "PREMAIRE", "MINISCAPE", "S-CAP", "MOTIONSCOUT"],
        "DPI Sekur": ["SEKUR", "DIABLO", "SFERA", "C701", "C702", "M21", "IDEA CBRN", "DIRIN", "POLIBLITZ", "ESCAP E", "SNC", "SWOT"],
        "Honeywell": ["HONEYWELL", "FENZY", "BW", "MICROCLIP", "MAX XT", "INTELLIDOX", "VERISHIELD", "DURAFIT", "EASYFIT", "POSICHECK", "PANO CL3", "MB9000", "MB9007", "PA701HE", "PA7HE", "PA911"],
        "Ansell": ["ANSELL", "ALPHATEC", "HYFLEX", "CHEM PRO", "GAMMEX", "MICRO-TOUCH"],
        "Dräger": ["DRAGER", "DRÄGER", "PSS 3000", "FPS 7000", "SAVER CF", "SAVER PP"],
        "Portwest": ["PORTWEST", "BIZTEX", "BIZWELD", "KX3", "A197", "A198", "A721"],
        "DuPont": ["DUPONT", "NOMEX", "TYVEK", "TYCHEM", "KEVLAR"],
        "Globestock": ["GLOBESTOCK"],
        "GVS": ["GVS", "ELIPSE"],
        "Industrial Scientific": ["INDUSTRIAL SCIENTIFIC", "ISC", "T40 II", "MX4", "RATTLER"],
        "RAE Systems": ["RAE SYSTEMS", "TOXIRAE"],
        "Seitron": ["SEITRON"],
        "Shell": ["SHELL"],
        "Harvik": ["HARVIK"],
        "Elvex": ["ELVEX"],
        "Kemppi": ["KEMPPI"],
        "JASIC": ["JASIC"],
        "L&W Compressor": ["L&W", "LW", "LENHARDT"],
        "Chiyoda": ["CHIYODA"],
        "Karam": ["KARAM"],
        "Delta Plus": ["DELTA PLUS"],
        "Kermel": ["KERMEL"],
        "Top Glove": ["TOP GLOVE"],
        "Trelleborg": ["TRELLEBORG", "TRELLCOVER"],
        "Frypro": ["FRYPRO", "FRPRO"],
        "Proban": ["PROBAN"],
        "Red Wing": ["RED WING"],
        "PAB": ["PAB"],
        "AVEC": ["AVEC"],
        "AustCorp": ["AUSTCORP"],
        "Hornung": ["HORNUNG"],
        "NJSTAR": ["NJSTAR"],
        "Cavagna": ["CAVAGNA"],
        "Sanosub": ["SANOSUB"],
        "VTI": ["VTI"],
        "Licota": ["LICOTA"],
        "YMH": ["YMH"],
        "Welichi": ["WELICHI"]
    }

    # Brands that often don't have word boundaries (prefixes)
    NO_BOUNDARY = ["MSA", "BW", "LW", "PAB", "VTI"]

    ordered_brands = [
        "MSA Safety", "DPI Sekur", "Honeywell", "Ansell", "Dräger", "Portwest",
        "DuPont", "Globestock", "GVS", "Industrial Scientific", "RAE Systems",
        "Seitron", "Shell", "Harvik", "Elvex", "Kemppi", "JASIC", "L&W Compressor",
        "Chiyoda", "Karam", "Delta Plus", "Kermel", "Top Glove", "Trelleborg",
        "Frypro", "Proban", "Red Wing", "PAB", "AVEC", "AustCorp", "Hornung",
        "NJSTAR", "Cavagna", "Sanosub", "VTI", "Licota", "YMH", "Welichi"
    ]
    
    for bname in ordered_brands:
        keywords = brand_map[bname]
        for k in keywords:
            if k in NO_BOUNDARY:
                if k in name_upper: return bname
            else:
                pattern = rf"\b{re.escape(k)}\b" if len(k) < 4 else re.escape(k)
                if re.search(pattern, name_upper): return bname
                
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
