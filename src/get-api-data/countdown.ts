import { prisma } from "@/lib/prismaDB";
import { unstable_cache } from "next/cache";

export const defaultCountdown = [
  {
    id: 1,
    title: "Don't Miss The Sound Experience",
    subtitle: "Special Limited Offer",
    countdownImage: "/images/countdown/speaker.png",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    productId: 1,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    product: {
      title: "Wireless Hi-Fi Smart Audio Speaker",
    }
  }
];

export const getCountdowns = unstable_cache(
  async () => {
    try {
      const { getCmsCountdowns } = await import("@/services/cmsService");
      return await getCmsCountdowns();
    } catch {
      return defaultCountdown as any;
    }
  },
  ['countdowns'], { tags: ['countdowns'] }
);