# Redesign Plan: Airgas Technology Landing Page

This plan outlines the steps to redesign the existing landing page to match the visual layout in `@Web design.jpg` and integrate the products and services from `https://airgas.my/`.

## 1. Objective
Redesign the current landing page into a professional, industry-focused product catalog with:
- Centered header and company introduction.
- Industry-based filter tabs (Confined Space, Oil and Gas, Welding, etc.).
- Categorized product sections (e.g., "EEBD", "SCBA").
- Direct "View More" links to the official `https://airgas.my/` product pages.

## 2. Key Files & Context
- **`index.html`**: Update structure forcentered headers and new tab layout.
- **`style.css`**: Update theme (orange/gray/white) and card layout to match the image.
- **`script.js`**: Update rendering logic to group products by sub-category and include the "View more" button with external links.
- **`assets/products.json`**: Update with real product data and industry-based categorization.

## 3. Implementation Steps

### Phase 1: Data Preparation [Make them industries based. For exampla: confined space, maritime, oil and gas]
- [x] **Categorization**: Map products into new industry-based types:
    - **Confined Space**: (SCBA, EEBD, Gas Detectors, Life-line).
    - **Oil and Gas**: (Industrial Gases, Chemical Suits, Specialized PPE).
    - **Welding**: (Welding Machines, Electrodes, Accessories).
    - **Gases**: (Industrial and Medical Gases).
    - **Gas Calibration**: (Gas Detectors, Calibration Gases, Sensors).
    - **PPE**: (General works PPE, Helmets, Gloves, etc.).
- [x] **URL Mapping**: Ensure every product in `products.json` has a direct `url` field pointing to its page on `https://airgas.my/`. For example for the product name "ANTI IMPACT CUT RESISTANT GLOVE", the button will redirect to "https://airgas.my/product/anti-impact-cut-resistant-glove/" url

### Phase 2: Structural & Visual Redesign (`index.html` & `style.css`) [I want the theme to be orrange and white, suitable and relate with the company logo's color. Make it look modern and clean. Also make it still look beautiful on mobile view screen, I dont want the contents colliding with each other on mobile size]
- [x] **Header**:
    - Center the main "Company Introduction" title and description.
    - Use "Airgas" (orange) logo as shown in the image.
- [x] **Filter Tabs**:
    - Change tabs to centered, rounded "pills".
    - Update categories: `Confined Space`, `Oil and gas`, `Welding`, `Gases`, `Gas Calibration`, `PPE`.
- [x] **Section Information**:
    - Add a dynamic text area for "Some information about the type's topic".
- [x] **Product Cards**:
    - Vertical layout: Image (top), Brand (middle), Product Info (middle), "View more" button (bottom).
    - Color theme: Light gray backgrounds for cards, orange for buttons/accents.

### Phase 3: Logic Update (`script.js`) [Still keep the JSON file architecture, store all the products and services in that JSON file so I can add more products easily in the future and I don't have to change lot of code]
- [x] **Grouping Logic**: Modify `renderProducts()` to group products by a `subCategory` field (e.g., grouping all EEBDs under an "EEBD" header).
- [x] **Dynamic Links**: Ensure the "View more" button correctly uses the `url` from the JSON data.
- [x] **Animation**: Keep the staggered reveal but adjust for the new grid layout.

## 4. Verification & Testing
- [x] Verify all "View more" buttons redirect to the correct page on `https://airgas.my/`.
- [x] Test filtering responsiveness across desktop, tablet, and mobile.
- [x] Visual check: Compare the final result with `@Web design.jpg` for layout, spacing, and color accuracy.
