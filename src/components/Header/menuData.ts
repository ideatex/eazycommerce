import type { MenuItem } from "./types";

export const menuData: MenuItem[] = [
  {
    title: "Popular Deals",
    path: "/popular?sort=popular",
  },
  {
    title: "Shop All",
    path: "/shop-with-sidebar",
  },
  {
    title: "Categories",
    submenu: [
      {
        title: "Electronics & Gaming",
        path: "/categories/electronics",
      },
      {
        title: "Computer & Office",
        path: "/categories/computer",
      },
      {
        title: "Wearables & Smartwatches",
        path: "/categories/watch",
      },
      {
        title: "Mobile & Accessories",
        path: "/categories/mobile",
      },
      {
        title: "Home Appliances",
        path: "/categories/appliances",
      },
    ],
  },
  {
    title: "Verified Stores",
    path: "/stores",
  },
  {
    title: "Help & Support",
    submenu: [
      {
        title: "Track Orders",
        path: "/account?tab=orders",
      },
      {
        title: "Returns & Refunds",
        path: "/account?tab=returns",
      },
      {
        title: "Frequently Asked Questions",
        path: "/faq",
      },
      {
        title: "Contact Support",
        path: "/contact",
      },
      {
        title: "Privacy Policy",
        path: "/privacy-policy",
      },
      {
        title: "Terms of Service",
        path: "/terms-conditions",
      },
    ],
  },
];
