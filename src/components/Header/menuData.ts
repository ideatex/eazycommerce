import type { MenuItem } from "./types";

/** Header navigation. Category links come from the catalogue (Admin → Categories). */
export function buildMenuData(categories: Array<{ name: string; slug: string }>): MenuItem[] {
  const menu: MenuItem[] = [
    { title: "Popular Deals", path: "/popular" },
    { title: "Shop All", path: "/shop-with-sidebar" },
  ];

  if (categories.length > 0) {
    menu.push({
      title: "Categories",
      submenu: categories.map((c) => ({ title: c.name, path: `/categories/${c.slug}` })),
    });
  }

  menu.push(
    {
      title: "Help & Support",
      submenu: [
        { title: "Track Orders", path: "/orders" },
        { title: "Frequently Asked Questions", path: "/faq" },
        { title: "Contact Support", path: "/contact" },
        { title: "Privacy Policy", path: "/privacy-policy" },
        { title: "Terms of Service", path: "/terms-conditions" },
      ],
    }
  );
  return menu;
}
