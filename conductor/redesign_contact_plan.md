# Implementation Plan: Contact Section Redesign (Light & Orange Theme)

## Objective
Redesign the Contact section (`index.html` and `style.css`) to replace the current three-card grid with a professional "Split-Panel Contact Hub" layout. The design will use a light and brand-orange theme to create a premium, industrial-corporate aesthetic.

## Key Files & Context
- `index.html`: Contains the structural markup for the `#contact` section.
- `style.css`: Contains the styling rules for the `.contact-section` and its child elements.

## Proposed Solution: The Split-Panel Layout

The new design will feature a two-column layout on desktop (stacking on mobile):

1.  **Left Panel: The Contact "Command Center" (Orange Themed)**
    - A prominent, light-orange tinted panel (or white panel with strong orange accents/borders) dedicated to communication.
    - Will consolidate the Direct Line (WhatsApp), Office numbers, and Email addresses.
    - Links will be styled as prominent, interactive elements (e.g., buttons or bold links with hover effects) rather than simple text.
    - Use clean, modern SVG icons for Phone, WhatsApp, and Email.

2.  **Right Panel: Physical Locations (Light Theme)**
    - A clean, white panel stacking the two physical addresses: Show Room (Johor) and Workshop (Negeri Sembilan).
    - Each location will feature a clear "Location Pin" icon.
    - Minimalist typography to clearly separate physical destinations from direct contact methods.

## Implementation Steps
1.  **Modify `index.html`**:
    - Replace the `.contact-grid` with a new `.contact-split-container`.
    - Create a `.contact-info-panel` (Left) containing the consolidated contact methods.
    - Create a `.contact-locations-panel` (Right) containing the two branch addresses.
    - Update SVG icons to be more professional and consistent.

2.  **Modify `style.css`**:
    - Remove old `.contact-grid` and `.contact-card` styles.
    - Add styles for `.contact-split-container` (using CSS Grid or Flexbox for the split layout).
    - Add specific styles for `.contact-info-panel` emphasizing the orange theme (e.g., `background: rgba(248, 90, 43, 0.05); border: 1px solid var(--primary);`).
    - Add styles for the interactive contact links/buttons.
    - Add styles for the `.contact-locations-panel` and the individual location blocks.
    - Ensure full responsiveness (stacking the panels on screens `< 768px`).

## Verification & Testing
- Verify that the layout splits correctly on desktop and stacks neatly on mobile devices.
- Check that the light and orange theme is applied consistently and matches the rest of the landing page.
- Ensure all links (tel:, mailto:) are functional.
- Validate that the two addresses (Johor and Negeri Sembilan) are clearly separated from the contact numbers/emails.
