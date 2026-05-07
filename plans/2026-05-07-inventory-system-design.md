# Inventory System - Design Specification

## 1. Project Overview

**Project Name:** InventoriSystem  
**Type:** Inventory Management Web Application (Frontend-only, vanilla JS/HTML/CSS)  
**Core Functionality:** A 5-page inventory management system with login, dashboard, products, reports, and settings pages. Mobile-responsive with light/dark theme support.  
**Target Users:** Company staff managing inventory

---

## 2. Technology Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Single CSS File:** `style.css` (shared across all pages)
- **Single JS File:** `script.js` (shared across all pages)
- **No frameworks or build tools**
- **Assets:** Stored in `/assets/` folder

---

## 3. File Structure

```
InventoriSystem/
├── assets/
│   ├── images/
│   │   ├── LogoCompany.jpg
│   │   └── Contoh.jpeg (reference only)
│   ├── css/
│   │   └── style.css (single shared stylesheet)
│   ├── js/
│   │   └── script.js (single shared script)
│   └── icons/
├── login.html
├── dashboard.html
├── products.html
├── reports.html
├── settings.html
└── index.html (redirects to login.html)
```

---

## 4. Page Specifications

### 4.1 Login Page (`login.html`)

**Purpose:** Authentication gateway (non-functional login - bypasses with any credentials)

**Layout:**
- Centered card design on a clean background
- Company logo centered at top of card
- Username input field
- Password input field
- "Log In" button (non-functional - logs in with any input)
- Error message display area

**Design Elements:**
- Card with subtle shadow and rounded corners
- Orange accent on focus states and button
- Company logo at top
- Placeholder text guidance
- Smooth transitions on input focus

---

### 4.2 Dashboard Page (`dashboard.html`)

**Purpose:** Main overview page displaying key inventory metrics and recent products

**Layout:**
- Sidebar navigation (left side)
- Top stats cards section:
  - Total Products count
  - Low Stock count
  - Out of Stock count
  - Total Inventory Value
- Recent Products table below stats
- Mobile: Collapsible sidebar with hamburger menu

**Sidebar Navigation:**
- Logo at top
- Nav items: Dashboard, Products, Reports, Settings
- Active state indicator (orange highlight)
- Logout button at bottom

**Stats Cards:**
- 4 cards in a row (2x2 on tablet, 1 column on mobile)
- Each card shows: icon, label, count/value
- Orange accent colors for visual interest
- Hover effect with slight elevation

**Recent Products Table:**
- Columns: Product Name, Category, Stock, Status, Action
- Status badges: In Stock (green), Low Stock (orange), Out of Stock (red)
- 5-10 sample rows for demonstration
- Responsive: horizontal scroll on mobile

---

### 4.3 Products Page (`products.html`)

**Purpose:** Full product management interface

**Layout:**
- Same sidebar navigation as dashboard
- Search bar at top
- Add Product button
- Products table with full functionality
- Mobile: responsive table with horizontal scroll

**Features:**
- Search by product name
- Add new product (opens modal form)
- Edit existing product (opens modal form)
- Delete product (with confirmation)
- Category filter dropdown
- Stock status filter
- Pagination or "Load More" button

**Product Modal Form:**
- Product Name input
- Category dropdown/select
- Stock quantity input
- Price input
- Description textarea
- Save/Cancel buttons

**Status Indicators:**
- In Stock (green) - quantity > 10
- Low Stock (orange) - quantity 1-10
- Out of Stock (red) - quantity 0

---

### 4.4 Reports Page (`reports.html`)

**Purpose:** Display inventory reports and analytics

**Layout:**
- Same sidebar navigation as dashboard
- Report type selector tabs/buttons
- Mock charts/tables placeholder area
- Export options (buttons for PDF, Excel - UI only)

**Report Types:**
- Inventory Summary
- Low Stock Alerts
- Stock Movement
- Category Breakdown

**Mock Data Areas:**
- Bar chart placeholder (for stock levels)
- Line chart placeholder (for trends)
- Table placeholder (for detailed reports)
- Ready for backend integration later

---

### 4.5 Settings Page (`settings.html`)

**Purpose:** User and application settings

**Layout:**
- Same sidebar navigation as dashboard
- Settings sections in card format
- Mobile: stacked cards

**Settings Sections:**

1. **User Profile Settings:**
   - Profile picture upload
   - Name, email, phone fields
   - Save button

2. **Company Info:**
   - Company name
   - Address
   - Contact info
   - Logo upload

3. **Theme Toggle:**
   - Light/Dark mode switch
   - Toggle switch with instant preview

4. **Notifications Settings:**
   - Email notifications toggle
   - Low stock alerts toggle
   - SMS notifications toggle (UI only)

---

## 5. Theme Specifications

### 5.1 Light Theme (Default)

| Element | Color |
|---------|-------|
| Primary Orange | `#FF6600` |
| Background | `#FFFFFF` |
| Sidebar Background | `#FF6600` |
| Sidebar Text | `#FFFFFF` |
| Card Background | `#FFFFFF` |
| Text Primary | `#333333` |
| Text Secondary | `#666666` |
| Border | `#E0E0E0` |
| Success | `#28A745` |
| Warning | `#FFC107` |
| Danger | `#DC3545` |

### 5.2 Dark Theme

| Element | Color |
|---------|-------|
| Primary Orange | `#FF6600` |
| Background | `#1A1A2E` |
| Sidebar Background | `#0F0F1A` |
| Sidebar Text | `#FFFFFF` |
| Card Background | `#16213E` |
| Text Primary | `#FFFFFF` |
| Text Secondary | `#B0B0B0` |
| Border | `#2D2D44` |
| Success | `#28A745` |
| Warning | `#FFC107` |
| Danger | `#DC3545` |

---

## 6. Navigation & Layout

### 6.1 Desktop Layout (>1024px)
- Sidebar: 250px fixed width
- Main content: fluid width
- Full sidebar visible

### 6.2 Tablet Layout (768px - 1024px)
- Sidebar: collapsible, 200px when open
- Stats cards: 2 columns

### 6.3 Mobile Layout (<768px)
- Sidebar: hidden by default, slides in when hamburger clicked
- Overlay background when sidebar open
- Stats cards: stacked (1 column)
- Tables: horizontal scroll
- Hamburger menu icon top-left

---

## 7. Component States

### Buttons
- Default: orange background
- Hover: darker orange with slight scale
- Active: pressed effect
- Disabled: gray with reduced opacity

### Input Fields
- Default: white with border
- Focus: orange border with glow
- Error: red border with error message

### Navigation Items
- Default: white text
- Hover: slight background highlight
- Active: orange left border + background tint

### Cards
- Default: white/dark card background
- Hover: slight elevation increase

---

## 8. JavaScript Functionality (Frontend-only)

### 8.1 Login Logic
- Accept any username/password combination
- Store "logged in" state in sessionStorage
- Redirect to dashboard on login

### 8.2 Theme Toggle
- Toggle between light/dark themes
- Persist preference in localStorage
- Apply theme class to body element

### 8.3 Sidebar Toggle (Mobile)
- Toggle sidebar visibility with hamburger
- Close on overlay click
- Close on navigation item click

### 8.4 Products CRUD (UI-only)
- Add product: modal form opens, adds to local table
- Edit product: modal pre-filled, updates local table
- Delete product: confirmation, removes from table
- Search: filter table rows
- Category filter: filter by category

### 8.5 Navigation Guard
- Check sessionStorage for login state
- Redirect to login if not logged in

---

## 9. Sample Data

### Dashboard Stats
- Total Products: 1,234
- Low Stock: 15
- Out of Stock: 3
- Total Value: $45,678

### Sample Products
| Name | Category | Stock | Price | Status |
|------|----------|-------|-------|--------|
| Item A | Electronics | 50 | $299 | In Stock |
| Item B | Office Supplies | 5 | $15 | Low Stock |
| Item C | Furniture | 0 | $599 | Out of Stock |
| Item D | Electronics | 25 | $149 | In Stock |
| Item E | Clothing | 100 | $49 | In Stock |

### Categories
- Electronics
- Office Supplies
- Furniture
- Clothing
- Food & Beverage
- Tools & Hardware

---

## 10. Implementation Order

1. Create folder structure
2. Create shared `style.css` with all themes and components
3. Create `login.html` with centered card layout
4. Create `script.js` with shared functionality
5. Create `dashboard.html` with stats cards and table
6. Create `products.html` with CRUD interface
7. Create `reports.html` with placeholder charts
8. Create `settings.html` with all settings sections
9. Add mobile responsiveness
10. Test all pages and interactions

---

## 11. Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 12. Notes

- Login is intentionally non-functional - bypass with any credentials
- All data stored in localStorage/JavaScript arrays (no backend)
- Charts/graphs are placeholders - ready for backend integration
- Settings expandable for future features
- Company logo from `LogoCompany.jpg` in assets folder
