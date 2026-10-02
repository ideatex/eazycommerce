/** Section types the storefront knows how to render (also the whitelist for Admin → Content). */
export const SECTION_TYPES = [
  "HERO",
  "FEATURED_CATEGORIES",
  "FEATURED_PRODUCTS",
  "PROMO_TILES",
  "DEAL_BANNER",
  "PROMO_BANNER",
  "VALUE_PROPOSITIONS",
  "CUSTOMER_REVIEWS",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

interface DefaultSection {
  sectionType: SectionType;
  title: string;
  subtitle: string;
  config: Record<string, unknown>;
}

const dealEnd = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

/**
 * Default homepage layout. Used to seed a new store's sections in the admin panel
 * and as the storefront's render list until an admin saves their own.
 */
export function buildDefaultSections(): Array<{
  sectionType: string;
  title: string;
  subtitle: string;
  configJson: string;
  sortOrder: number;
  isActive: boolean;
}> {
  const defs: DefaultSection[] = [
    {
      sectionType: "HERO",
      title: "Everyday technology, delivered to your door.",
      subtitle:
        "Phones, laptops, TVs, wearables and home appliances from trusted brands, with GST invoices and free delivery on orders over ₹999.",
      config: {
        tag: "New season arrivals",
        ctaText: "Shop all products",
        ctaUrl: "/shop-with-sidebar",
        secondaryText: "See today's deals",
        secondaryUrl: "/popular",
        images: [
          { imageUrl: "/images/hero/hero-01.png", alt: "Wireless over-ear headphones" },
          { imageUrl: "/images/promo/promo-01.png", alt: "Flagship smartphone" },
          { imageUrl: "/images/promo/promo-03.png", alt: "Rugged smartwatch" },
          { imageUrl: "/images/promo/promo-02.png", alt: "Folding treadmill" },
        ],
      },
    },
    {
      sectionType: "FEATURED_CATEGORIES",
      title: "Shop by category",
      subtitle: "Find what you need faster",
      config: { limit: 7 },
    },
    {
      sectionType: "FEATURED_PRODUCTS",
      title: "New arrivals",
      subtitle: "The latest additions to our catalogue",
      config: { limit: 8, sort: "newest", viewAllUrl: "/shop-with-sidebar", viewAllText: "View all products" },
    },
    {
      sectionType: "PROMO_TILES",
      title: "Featured collections",
      subtitle: "",
      config: {
        items: [
          { title: "Flagship smartphones", subtitle: "Pro cameras and all-day battery", badge: "New", imageUrl: "/images/promo/promo-01.png", ctaText: "Shop phones", ctaUrl: "/categories/mobiles-tablets" },
          { title: "Fitness at home", subtitle: "Treadmills and training gear", badge: "Popular", imageUrl: "/images/promo/promo-02.png", ctaText: "Shop fitness", ctaUrl: "/categories/health-fitness" },
          { title: "Smart wearables", subtitle: "Track workouts, sleep and more", badge: "Trending", imageUrl: "/images/promo/promo-03.png", ctaText: "Shop wearables", ctaUrl: "/categories/wearables" },
        ],
      },
    },
    {
      sectionType: "FEATURED_PRODUCTS",
      title: "Top deals",
      subtitle: "Biggest savings right now",
      config: { limit: 4, sort: "discount", viewAllUrl: "/popular", viewAllText: "More popular picks" },
    },
    {
      sectionType: "DEAL_BANNER",
      title: "Gaming headset, over 25% off",
      subtitle: "Surround-style sound, a noise-reducing mic and all-day comfort. Offer ends soon.",
      config: {
        badge: "Limited-time deal",
        endDate: dealEnd(),
        imageUrl: "/images/countdown/countdown-01.png",
        ctaText: "Grab the deal",
        ctaUrl: "/products/gaming-headset-with-mic",
      },
    },
    {
      sectionType: "PROMO_BANNER",
      title: "Buying for your business?",
      subtitle:
        "Apply for a B2B account to unlock wholesale pricing, GST input-credit invoices and credit terms on bulk orders.",
      config: { badge: "Trade & wholesale", ctaText: "Talk to our team", ctaUrl: "/contact" },
    },
    {
      sectionType: "VALUE_PROPOSITIONS",
      title: "Why shop with us",
      subtitle: "Simple, dependable and fully invoiced",
      config: {
        items: [
          { title: "Free delivery over ₹999", desc: "Tracked shipping across India. Orders under ₹999 ship for a flat ₹79." },
          { title: "Easy returns", desc: "Request a return from your account once your order is delivered." },
          { title: "GST invoices", desc: "A tax invoice for every order, with B2B GSTIN support." },
        ],
      },
    },
    {
      sectionType: "CUSTOMER_REVIEWS",
      title: "What customers say",
      subtitle: "Recent reviews from verified shoppers",
      config: { limit: 3 },
    },
  ];

  return defs.map((d, i) => ({
    sectionType: d.sectionType,
    title: d.title,
    subtitle: d.subtitle,
    configJson: JSON.stringify(d.config),
    sortOrder: i,
    isActive: true,
  }));
}
