import { prisma } from "@/lib/prismaDB";
import { unstable_cache } from "next/cache";

export const defaultHeroSliders = [
  {
    id: 1,
    sliderName: "True Wireless",
    sliderImage: "/images/hero/hero-01.png",
    discountRate: 30,
    slug: "true-wireless",
    productId: "1",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    product: {
      title: "True Wireless Noise Canceling Headphones",
      slug: "havit-hv-g69-usb-gamepad",
      shortDescription: "Immerse yourself in studio-grade audio with active noise canceling and up to 40 hours of battery life.",
      price: 299,
      discountedPrice: 199,
    },
  },
  {
    id: 2,
    sliderName: "Apple Watch Ultra",
    sliderImage: "/images/hero/hero-02.png",
    discountRate: 25,
    slug: "apple-watch-ultra",
    productId: "2",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    product: {
      title: "Next-Gen Ultra Smart Watch Series 9",
      slug: "apple-watch-ultra-titanium",
      shortDescription: "Track workouts, blood oxygen, and heart metrics with ultra bright display and titanium durability.",
      price: 799,
      discountedPrice: 729,
    },
  },
  {
    id: 3,
    sliderName: "Havit HV-G69",
    sliderImage: "/images/hero/hero-03.png",
    discountRate: 40,
    slug: "havit-gamepad",
    productId: "3",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    product: {
      title: "Havit HV-G69 Dual Vibration Gamepad",
      slug: "havit-hv-g69-usb-gamepad",
      shortDescription: "Ergonomic precision controller with dual vibration feedback for PC and console gaming.",
      price: 59,
      discountedPrice: 29,
    },
  },
];

export const defaultHeroBanners = [
  {
    id: 1,
    bannerName: "iPhone 14 Plus",
    subtitle: "Superspeedy A15 Bionic chip with dual camera",
    bannerImage: "/images/hero/bannar-1.png",
    slug: "iphone-14-plus",
    productId: "1",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    product: {
      slug: "iphone-14-plus-6-128gb",
      title: "iPhone 14 Plus, 6/128GB",
      price: 899,
      discountedPrice: 799,
    },
  },
  {
    id: 2,
    bannerName: "Logitech MX Master 3S",
    subtitle: "Ergonomic wireless performance mouse",
    bannerImage: "/images/hero/bannar-2.png",
    slug: "logitech-mx-master-3s",
    productId: "2",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    product: {
      slug: "logitech-mx-master-3s",
      title: "Logitech MX Master 3S Wireless Mouse",
      price: 99,
      discountedPrice: 79,
    },
  },
];

export type HeroBannerType = typeof defaultHeroBanners[0];
export type HeroSliderType = typeof defaultHeroSliders[0];

// get hero banners
export const getHeroBanners = unstable_cache(
  async (): Promise<HeroBannerType[]> => {
    try {
      const { getCmsHeroBanners } = await import("@/services/cmsService");
      return await getCmsHeroBanners();
    } catch {
      return defaultHeroBanners;
    }
  },
  ['heroBanners'], { tags: ['heroBanners'] }
);

// get hero sliders
export const getHeroSliders = unstable_cache(
  async (): Promise<HeroSliderType[]> => {
    try {
      const { getCmsHeroSliders } = await import("@/services/cmsService");
      return await getCmsHeroSliders();
    } catch {
      return defaultHeroSliders;
    }
  },
  ['heroSliders'], { tags: ['heroSliders'] }
);

// single hero banner
export const getSingleHeroBanner = async (id: number) => 
  unstable_cache(
    async () => {
      try {
        const banner = await prisma.heroBanner.findUnique({
          where: {
            id: id
          }
        });
        if (banner) return banner;
        return (defaultHeroBanners.find((b) => b.id === id) as any) || null;
      } catch {
        return (defaultHeroBanners.find((b) => b.id === id) as any) || null;
      }
    },
    ['single-hero-banner'], { tags: [`single-hero-banner-${id}`] }
  )
