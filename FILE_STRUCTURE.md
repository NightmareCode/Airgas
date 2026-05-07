# Folder Structure for InventoriSystem

```
InventoriSystem/
├── assets/
│   ├── images/
│   │   ├── LogoCompany.jpg
│   │   └── Contoh.jpeg (reference only, can be removed)
│   ├── css/
│   │   └── style.css          # Single shared stylesheet
│   └── js/
│       └── script.js           # Single shared script
├── pages/                      # All HTML pages
│   ├── login.html
│   ├── dashboard.html
│   ├── products.html
│   ├── reports.html
│   └── settings.html
├── plans/
│   └── 2026-05-07-inventory-system-design.md
└── README.md
```

## Key Files

| File | Purpose |
|------|---------|
| `assets/css/style.css` | All styles (light/dark themes, components, responsive) |
| `assets/js/script.js` | All JavaScript (login, navigation, CRUD, theme toggle) |
| `pages/login.html` | Login page with centered card design |
| `pages/dashboard.html` | Dashboard with stats cards and recent products table |
| `pages/products.html` | Products management with search, add/edit/delete |
| `pages/reports.html` | Reports with placeholder charts/tables |
| `pages/settings.html` | Settings with profile, company info, theme, notifications |
