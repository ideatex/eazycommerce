# LEGAL ATTRIBUTION & SOFTWARE COMPLIANCE NOTICE

## 1. Primary Platform Attribution

This application, **VANIGAM B2B2C eCommerce Platform**, is an enterprise multi-tenant commerce operating system featuring multi-tier business onboarding (Manufacturers, Suppliers, Distributors, Retailers, Sellers), split orders fulfillment, item-level returns and escrow reconciliation, multi-seller catalog management, and responsive customer storefronts.

### Origin Scaffolding
- The early baseline storefront layout scaffolding was derived from the open starter template **CozyCommerce Lite** ([CozyCommerce/cozycommerce-lite](https://github.com/CozyCommerce/cozycommerce-lite)).
- All subsequent enterprise B2B2C business domain services, database architecture, multi-tenant RBAC engine, split-fulfillment pipelines, escrow finance ledgers, administrative governance panels, dynamic workspace isolation, and custom image upload infrastructure were independently authored for VANIGAM.

---

## 2. Third-Party Open Source Software Notice

This software incorporates and builds upon components licensed under permissive open-source licenses. Below is the inventory of direct dependencies and their respective licenses:

| Package | Version | License | Usage / Purpose |
| :--- | :--- | :--- | :--- |
| `next` | ^16.1.6 | MIT | Core Full-Stack React Framework |
| `react`, `react-dom` | ^19.2.0 | MIT | UI Rendering Engine |
| `@prisma/client`, `prisma` | ^6.5.0 | Apache-2.0 | Next-generation ORM and Database Client |
| `@prisma/adapter-pg` | ^7.5.0 | Apache-2.0 | PostgreSQL Driver Adapter for Prisma |
| `next-auth` | ^4.24.13 | ISC | Authentication & Session Management |
| `@auth/prisma-adapter` | ^2.11.1 | ISC | NextAuth Adapter for Prisma |
| `tailwindcss`, `@tailwindcss/*` | ^4.0.0 | MIT | Utility-First CSS Styling Framework |
| `@reduxjs/toolkit`, `react-redux` | ^2.2.2 / ^9.1.0 | MIT | Client-Side State Management |
| `@stripe/stripe-js`, `@stripe/react-stripe-js`, `stripe` | ^3.x / ^14.x | MIT / Apache-2.0 | Payment Gateway Integration |
| `chart.js`, `react-chartjs-2` | ^4.4.8 / ^5.3.0 | MIT | Analytics & Dashboard Data Visualization |
| `swiper` | ^12.1.2 | MIT | Touch Carousel & Slider Components |
| `algoliasearch`, `react-instantsearch` | ^4.x / ^7.x | MIT | Search Index Integration |
| `cloudinary` | ^2.7.0 | MIT | Media Management Client |
| `nodemailer` | ^7.0.13 | MIT-0 | Transactional Email Dispatcher |
| `quill`, `react-quilljs` | ^2.x | BSD-3-Clause / MIT | Rich Text Editorial CMS Editor |
| `rate-limiter-flexible` | ^7.0.0 | ISC | Edge & API Rate Limiting Utility |
| `bcrypt` | ^6.0.0 | MIT | Password Hashing Primitives |
| `dayjs` | ^1.11.13 | MIT | Lightweight Date/Time Formatting |
| `sweetalert2` | ^11.26.22 | MIT | Notification Modals |
| `react-hot-toast` | ^2.4.1 | MIT | Toast Notification Dispatcher |
| `react-hook-form` | ^7.54.2 | MIT | Form Validation & State |
| `styled-components` | ^6.1.15 | MIT | CSS-in-JS Utility |
| `next-share` | ^0.27.0 | MIT | Social Sharing Modals |
| `nextjs-toploader` | ^1.6.12 | MIT | Page Navigation Loading Bar |
| `typescript`, `ts-node` | ^5.4.3 / ^10.9.2 | Apache-2.0 / MIT | Static Typing Language & Runtime |

---

## 3. Compliance Summary

- **Copyleft / Viral License Status:** None. There are zero GPL, AGPL, SSPL, or EUPL dependencies in the platform.
- **Runtime Licensing / Activation Code:** None. The platform contains zero phone-home mechanisms, hardware locks, subscription verification hooks, or DRM.
- **Commercial Usage:** Permitted under all listed permissive open-source licenses (MIT, Apache-2.0, ISC, BSD-3-Clause, MIT-0) provided standard copyright notices are preserved in distributed bundles.
