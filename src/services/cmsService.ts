import { prisma } from "@/lib/prismaDB";
import { revalidatePath, revalidateTag } from "next/cache";
import { defaultHeroBanners, defaultHeroSliders, HeroBannerType, HeroSliderType } from "@/get-api-data/hero";
import { defaultCountdown } from "@/get-api-data/countdown";
import { blogPosts as initialBlogPosts, BlogPost } from "@/data/blogData";
import { createAuditLog, createNotification } from "@/services/auditAndNotificationService";

export type { HeroBannerType, HeroSliderType };

export interface ExtendedBlogPost extends BlogPost {
  isPublished?: boolean;
}

export interface HeaderSettingType {
  id: number;
  headerText: string;
  headerLogo: string;
  emailLogo: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeoSettingType {
  id: number;
  siteName: string;
  siteTitle: string;
  metadescription: string;
  metaKeywords: string;
  metaImage: string;
  favicon: string;
  gtmId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// In-Memory Fallback Ledgers (Dual Persistence)
let inMemoryHeroSliders: HeroSliderType[] = [...defaultHeroSliders];
let inMemoryHeroBanners: HeroBannerType[] = [...defaultHeroBanners];
let inMemoryCountdowns: any[] = [...defaultCountdown];
let inMemoryHeaderSetting: HeaderSettingType = {
  id: 1,
  headerText: "Get free delivery on orders over $100",
  headerLogo: "/images/logo/logo.svg",
  emailLogo: "/images/logo/logo.svg",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};
let inMemorySeoSetting: SeoSettingType = {
  id: 1,
  siteName: "Vanigam Commerce",
  siteTitle: "Vanigam Commerce — Unified B2B2C Marketplace",
  metadescription: "Next-generation B2B2C ecommerce platform connecting verified manufacturers, distributors, and consumers.",
  metaKeywords: "b2b2c, marketplace, ecommerce, wholesale, retail",
  metaImage: "/images/hero/hero-01.png",
  favicon: "/favicon.ico",
  gtmId: "GTM-VANIGAM01",
};
let inMemoryBlogPosts: ExtendedBlogPost[] = initialBlogPosts.map((p) => ({
  ...p,
  isPublished: true,
}));

// Safe cache helper
function purgeCache(tag: string, path = "/") {
  try {
    (revalidateTag as any)(tag);
  } catch {}
  try {
    revalidatePath(path);
  } catch {}
}

// ==========================================
// 1. HERO SLIDERS
// ==========================================

export async function getCmsHeroSliders(): Promise<HeroSliderType[]> {
  try {
    const sliders = await prisma.heroSlider.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        product: {
          select: {
            price: true,
            discountedPrice: true,
            title: true,
            slug: true,
            shortDescription: true,
          },
        },
      },
    });

    if (sliders && sliders.length > 0) {
      return sliders.map((item) => ({
        ...item,
        product: {
          ...item.product,
          price: item.product.price.toNumber(),
          discountedPrice: item.product.discountedPrice
            ? item.product.discountedPrice.toNumber()
            : null,
        },
      })) as any;
    }
    return inMemoryHeroSliders;
  } catch {
    return inMemoryHeroSliders;
  }
}

export async function saveHeroSlider(
  data: Partial<HeroSliderType> & { title?: string; shortDescription?: string; price?: number; discountedPrice?: number },
  authorUser?: { id: string; email: string }
): Promise<HeroSliderType> {
  let savedItem: HeroSliderType;
  const isNew = !data.id || data.id <= 0;
  const targetId = isNew ? Date.now() : Number(data.id);

  const productData = {
    title: data.product?.title || data.sliderName || "Featured Product",
    slug: data.slug || data.product?.slug || `prod-${targetId}`,
    shortDescription: data.product?.shortDescription || "High-performance selected product for our curated storefront.",
    price: data.product?.price || data.price || 199,
    discountedPrice: data.product?.discountedPrice || data.discountedPrice || 149,
  };

  const sliderObj: HeroSliderType = {
    id: targetId,
    sliderName: data.sliderName || "Exclusive Offer",
    sliderImage: data.sliderImage || "/images/hero/hero-01.png",
    discountRate: Number(data.discountRate) || 20,
    slug: data.slug || productData.slug,
    productId: String(data.productId || "1"),
    createdAt: new Date(),
    updatedAt: new Date(),
    product: productData,
  };

  try {
    if (isNew) {
      await prisma.heroSlider.create({
        data: {
          sliderName: sliderObj.sliderName,
          sliderImage: sliderObj.sliderImage,
          discountRate: sliderObj.discountRate,
          slug: sliderObj.slug,
          productId: sliderObj.productId,
        },
      });
    } else {
      await prisma.heroSlider.update({
        where: { id: targetId },
        data: {
          sliderName: sliderObj.sliderName,
          sliderImage: sliderObj.sliderImage,
          discountRate: sliderObj.discountRate,
          slug: sliderObj.slug,
          productId: sliderObj.productId,
        },
      });
    }
  } catch {}

  const existingIdx = inMemoryHeroSliders.findIndex((s) => s.id === targetId);
  if (existingIdx >= 0) {
    inMemoryHeroSliders[existingIdx] = sliderObj;
  } else {
    inMemoryHeroSliders.unshift(sliderObj);
  }
  savedItem = sliderObj;

  await createAuditLog({
    action: isNew ? "CMS_CREATE_HERO_SLIDER" : "CMS_UPDATE_HERO_SLIDER",
    entityType: "HERO_SLIDER",
    entityId: String(targetId),
    actorId: authorUser?.id,
    details: { sliderName: sliderObj.sliderName, discountRate: sliderObj.discountRate },
  });

  await createNotification({
    title: isNew ? "New Hero Slider Published" : "Hero Slider Updated",
    message: `Slider "${sliderObj.sliderName}" has been updated on the storefront carousel.`,
    type: "SUCCESS",
    recipientOrgId: "org-platform",
  });

  purgeCache("heroSliders", "/");

  return savedItem;
}

export async function deleteHeroSlider(id: number, authorUser?: { id: string; email: string }): Promise<boolean> {
  try {
    await prisma.heroSlider.delete({ where: { id } });
  } catch {}

  inMemoryHeroSliders = inMemoryHeroSliders.filter((s) => s.id !== id);

  await createAuditLog({
    action: "CMS_DELETE_HERO_SLIDER",
    entityType: "HERO_SLIDER",
    entityId: String(id),
    actorId: authorUser?.id,
  });

  purgeCache("heroSliders", "/");

  return true;
}

// ==========================================
// 2. HERO BANNERS
// ==========================================

export async function getCmsHeroBanners(): Promise<HeroBannerType[]> {
  try {
    const banners = await prisma.heroBanner.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        product: {
          select: {
            price: true,
            discountedPrice: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    if (banners && banners.length > 0) {
      return banners.map((item) => ({
        ...item,
        product: {
          ...item.product,
          price: item.product.price.toNumber(),
          discountedPrice: item.product.discountedPrice
            ? item.product.discountedPrice.toNumber()
            : null,
        },
      })) as any;
    }
    return inMemoryHeroBanners;
  } catch {
    return inMemoryHeroBanners;
  }
}

export async function saveHeroBanner(
  data: Partial<HeroBannerType>,
  authorUser?: { id: string; email: string }
): Promise<HeroBannerType> {
  const isNew = !data.id || data.id <= 0;
  const targetId = isNew ? Date.now() : Number(data.id);

  const productData = {
    title: data.product?.title || data.bannerName || "Promotional Item",
    slug: data.slug || data.product?.slug || `banner-${targetId}`,
    price: data.product?.price || 499,
    discountedPrice: data.product?.discountedPrice || 399,
  };

  const bannerObj: HeroBannerType = {
    id: targetId,
    bannerName: data.bannerName || "Featured Highlight",
    subtitle: data.subtitle || "Limited time marketplace showcase",
    bannerImage: data.bannerImage || "/images/hero/bannar-1.png",
    slug: data.slug || productData.slug,
    productId: String(data.productId || "1"),
    createdAt: new Date(),
    updatedAt: new Date(),
    product: productData,
  };

  try {
    if (isNew) {
      await prisma.heroBanner.create({
        data: {
          bannerName: bannerObj.bannerName,
          subtitle: bannerObj.subtitle,
          bannerImage: bannerObj.bannerImage,
          slug: bannerObj.slug,
          productId: bannerObj.productId,
        },
      });
    } else {
      await prisma.heroBanner.update({
        where: { id: targetId },
        data: {
          bannerName: bannerObj.bannerName,
          subtitle: bannerObj.subtitle,
          bannerImage: bannerObj.bannerImage,
          slug: bannerObj.slug,
          productId: bannerObj.productId,
        },
      });
    }
  } catch {}

  const existingIdx = inMemoryHeroBanners.findIndex((b) => b.id === targetId);
  if (existingIdx >= 0) {
    inMemoryHeroBanners[existingIdx] = bannerObj;
  } else {
    inMemoryHeroBanners.push(bannerObj);
  }

  await createAuditLog({
    action: isNew ? "CMS_CREATE_HERO_BANNER" : "CMS_UPDATE_HERO_BANNER",
    entityType: "HERO_BANNER",
    entityId: String(targetId),
    actorId: authorUser?.id,
    details: { bannerName: bannerObj.bannerName },
  });

  purgeCache("heroBanners", "/");

  return bannerObj;
}

export async function deleteHeroBanner(id: number, authorUser?: { id: string; email: string }): Promise<boolean> {
  try {
    await prisma.heroBanner.delete({ where: { id } });
  } catch {}

  inMemoryHeroBanners = inMemoryHeroBanners.filter((b) => b.id !== id);

  await createAuditLog({
    action: "CMS_DELETE_HERO_BANNER",
    entityType: "HERO_BANNER",
    entityId: String(id),
    actorId: authorUser?.id,
  });

  purgeCache("heroBanners", "/");

  return true;
}

// ==========================================
// 3. COUNTDOWN FLASH DEAL
// ==========================================

export async function getCmsCountdowns(): Promise<any[]> {
  try {
    const countdowns = await prisma.countdown.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        product: {
          select: {
            title: true,
          },
        },
      },
    });
    if (countdowns && countdowns.length > 0) return countdowns;
    return inMemoryCountdowns;
  } catch {
    return inMemoryCountdowns;
  }
}

export async function saveCountdown(
  data: {
    id?: number;
    title: string;
    subtitle?: string;
    countdownImage?: string;
    productId: string;
    date?: string | Date;
  },
  authorUser?: { id: string; email: string }
): Promise<any> {
  const targetId = data.id || 1;
  const updatedItem = {
    id: targetId,
    title: data.title,
    subtitle: data.subtitle || "Special Limited Offer",
    countdownImage: data.countdownImage || "/images/countdown/speaker.png",
    productId: String(data.productId || "1"),
    date: data.date ? new Date(data.date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    product: {
      title: data.title,
    },
  };

  try {
    const existing = await prisma.countdown.findFirst();
    if (existing) {
      await prisma.countdown.update({
        where: { id: existing.id },
        data: {
          title: updatedItem.title,
          subtitle: updatedItem.subtitle,
          countdownImage: updatedItem.countdownImage,
          productId: updatedItem.productId,
        },
      });
    } else {
      await prisma.countdown.create({
        data: {
          title: updatedItem.title,
          subtitle: updatedItem.subtitle,
          countdownImage: updatedItem.countdownImage,
          productId: updatedItem.productId,
        },
      });
    }
  } catch {}

  inMemoryCountdowns = [updatedItem];

  await createAuditLog({
    action: "CMS_UPDATE_COUNTDOWN",
    entityType: "COUNTDOWN",
    entityId: String(targetId),
    actorId: authorUser?.id,
    details: { title: updatedItem.title },
  });

  purgeCache("countdowns", "/");

  return updatedItem;
}

// ==========================================
// 4. HEADER & STOREFRONT ANNOUNCEMENTS
// ==========================================

export async function getCmsHeaderSettings(): Promise<HeaderSettingType> {
  try {
    const setting = await prisma.headerSetting.findFirst();
    if (setting) {
      return {
        id: setting.id,
        headerText: setting.headerText || inMemoryHeaderSetting.headerText,
        headerLogo: setting.headerLogo || inMemoryHeaderSetting.headerLogo,
        emailLogo: setting.emailLogo || inMemoryHeaderSetting.emailLogo,
        createdAt: setting.createdAt,
        updatedAt: setting.updatedAt,
      };
    }
    return inMemoryHeaderSetting;
  } catch {
    return inMemoryHeaderSetting;
  }
}

export async function saveHeaderSettings(
  data: Partial<HeaderSettingType>,
  authorUser?: { id: string; email: string }
): Promise<HeaderSettingType> {
  const updated: HeaderSettingType = {
    id: data.id || inMemoryHeaderSetting.id || 1,
    headerText: data.headerText !== undefined ? data.headerText : inMemoryHeaderSetting.headerText,
    headerLogo: data.headerLogo || inMemoryHeaderSetting.headerLogo,
    emailLogo: data.emailLogo || inMemoryHeaderSetting.emailLogo,
    createdAt: inMemoryHeaderSetting.createdAt,
    updatedAt: new Date(),
  };

  try {
    const existing = await prisma.headerSetting.findFirst();
    if (existing) {
      await prisma.headerSetting.update({
        where: { id: existing.id },
        data: {
          headerText: updated.headerText,
          headerLogo: updated.headerLogo,
          emailLogo: updated.emailLogo,
        },
      });
    } else {
      await prisma.headerSetting.create({
        data: {
          headerText: updated.headerText,
          headerLogo: updated.headerLogo,
          emailLogo: updated.emailLogo,
        },
      });
    }
  } catch {}

  inMemoryHeaderSetting = updated;

  await createAuditLog({
    action: "CMS_UPDATE_HEADER_SETTING",
    entityType: "HEADER_SETTING",
    entityId: String(updated.id),
    actorId: authorUser?.id,
    details: { headerText: updated.headerText },
  });

  purgeCache("header-setting", "/");

  return updated;
}

// ==========================================
// 5. SEO SETTINGS
// ==========================================

export async function getCmsSeoSettings(): Promise<SeoSettingType> {
  try {
    const setting = await prisma.seoSetting.findFirst();
    if (setting) {
      return {
        id: setting.id,
        siteName: setting.siteName || inMemorySeoSetting.siteName,
        siteTitle: setting.siteTitle || inMemorySeoSetting.siteTitle,
        metadescription: setting.metadescription || inMemorySeoSetting.metadescription,
        metaKeywords: setting.metaKeywords || inMemorySeoSetting.metaKeywords,
        metaImage: setting.metaImage || inMemorySeoSetting.metaImage,
        favicon: setting.favicon || inMemorySeoSetting.favicon,
        gtmId: setting.gtmId || inMemorySeoSetting.gtmId,
        createdAt: setting.createdAt,
        updatedAt: setting.updatedAt,
      };
    }
    return inMemorySeoSetting;
  } catch {
    return inMemorySeoSetting;
  }
}

export async function saveSeoSettings(
  data: Partial<SeoSettingType>,
  authorUser?: { id: string; email: string }
): Promise<SeoSettingType> {
  const updated: SeoSettingType = {
    id: data.id || inMemorySeoSetting.id || 1,
    siteName: data.siteName || inMemorySeoSetting.siteName,
    siteTitle: data.siteTitle || inMemorySeoSetting.siteTitle,
    metadescription: data.metadescription || inMemorySeoSetting.metadescription,
    metaKeywords: data.metaKeywords || inMemorySeoSetting.metaKeywords,
    metaImage: data.metaImage || inMemorySeoSetting.metaImage,
    favicon: data.favicon || inMemorySeoSetting.favicon,
    gtmId: data.gtmId || inMemorySeoSetting.gtmId,
    createdAt: inMemorySeoSetting.createdAt,
    updatedAt: new Date(),
  };

  try {
    const existing = await prisma.seoSetting.findFirst();
    if (existing) {
      await prisma.seoSetting.update({
        where: { id: existing.id },
        data: {
          siteName: updated.siteName,
          siteTitle: updated.siteTitle,
          metadescription: updated.metadescription,
          metaKeywords: updated.metaKeywords,
          metaImage: updated.metaImage,
          favicon: updated.favicon,
          gtmId: updated.gtmId,
        },
      });
    } else {
      await prisma.seoSetting.create({
        data: {
          siteName: updated.siteName,
          siteTitle: updated.siteTitle,
          metadescription: updated.metadescription,
          metaKeywords: updated.metaKeywords,
          metaImage: updated.metaImage,
          favicon: updated.favicon,
          gtmId: updated.gtmId,
        },
      });
    }
  } catch {}

  inMemorySeoSetting = updated;

  await createAuditLog({
    action: "CMS_UPDATE_SEO_SETTING",
    entityType: "SEO_SETTING",
    entityId: String(updated.id),
    actorId: authorUser?.id,
    details: { siteName: updated.siteName },
  });

  purgeCache("seo-setting", "/");

  return updated;
}

// ==========================================
// 6. BLOG & CONTENT ARTICLES
// ==========================================

export async function getCmsBlogPosts(includeDrafts = true): Promise<ExtendedBlogPost[]> {
  if (includeDrafts) {
    return inMemoryBlogPosts;
  }
  return inMemoryBlogPosts.filter((p) => p.isPublished !== false);
}

export async function saveBlogPost(
  data: Partial<ExtendedBlogPost>,
  authorUser?: { id: string; email: string }
): Promise<ExtendedBlogPost> {
  const isNew = !data.id || !inMemoryBlogPosts.some((p) => p.id === data.id);
  const postId = isNew ? `blog-${Date.now()}` : data.id!;

  const newPost: ExtendedBlogPost = {
    id: postId,
    title: data.title || "Untitled Article",
    slug: data.slug || `article-${Date.now()}`,
    excerpt: data.excerpt || "",
    coverImage: data.coverImage || "/images/blog/blog-1.png",
    category: data.category || "General",
    author: {
      name: data.author?.name || authorUser?.email?.split("@")[0] || "Staff Editor",
      avatar: data.author?.avatar || "/images/users/user-01.png",
      role: data.author?.role || "Content Team",
    },
    publishedAt: data.publishedAt || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    readTime: data.readTime || "4 min read",
    tags: data.tags || ["Ecommerce", "Updates"],
    content: data.content || ["Welcome to our latest market intelligence report."],
    isPublished: data.isPublished !== undefined ? data.isPublished : true,
  };

  const idx = inMemoryBlogPosts.findIndex((p) => p.id === postId);
  if (idx >= 0) {
    inMemoryBlogPosts[idx] = newPost;
  } else {
    inMemoryBlogPosts.unshift(newPost);
  }

  await createAuditLog({
    action: isNew ? "CMS_CREATE_BLOG_POST" : "CMS_UPDATE_BLOG_POST",
    entityType: "BLOG_POST",
    entityId: postId,
    actorId: authorUser?.id,
    details: { title: newPost.title, isPublished: newPost.isPublished },
  });

  purgeCache("blogPosts", "/blogs");

  return newPost;
}

export async function deleteBlogPost(id: string, authorUser?: { id: string; email: string }): Promise<boolean> {
  inMemoryBlogPosts = inMemoryBlogPosts.filter((p) => p.id !== id);

  await createAuditLog({
    action: "CMS_DELETE_BLOG_POST",
    entityType: "BLOG_POST",
    entityId: id,
    actorId: authorUser?.id,
  });

  purgeCache("blogPosts", "/blogs");

  return true;
}

export async function toggleBlogPublish(id: string, authorUser?: { id: string; email: string }): Promise<ExtendedBlogPost | null> {
  const post = inMemoryBlogPosts.find((p) => p.id === id);
  if (!post) return null;

  post.isPublished = !post.isPublished;

  await createAuditLog({
    action: post.isPublished ? "CMS_PUBLISH_BLOG_POST" : "CMS_UNPUBLISH_BLOG_POST",
    entityType: "BLOG_POST",
    entityId: id,
    actorId: authorUser?.id,
    details: { isPublished: post.isPublished },
  });

  purgeCache("blogPosts", "/blogs");

  return post;
}

// ==========================================
// 7. COMPREHENSIVE OVERVIEW METRICS
// ==========================================

export async function getCmsOverview(): Promise<{
  slidersCount: number;
  bannersCount: number;
  activeCountdowns: number;
  publishedPostsCount: number;
  draftPostsCount: number;
  headerAnnouncement: string;
  siteName: string;
}> {
  const [sliders, banners, countdowns, posts, header, seo] = await Promise.all([
    getCmsHeroSliders(),
    getCmsHeroBanners(),
    getCmsCountdowns(),
    getCmsBlogPosts(true),
    getCmsHeaderSettings(),
    getCmsSeoSettings(),
  ]);

  return {
    slidersCount: sliders.length,
    bannersCount: banners.length,
    activeCountdowns: countdowns.length,
    publishedPostsCount: posts.filter((p) => p.isPublished !== false).length,
    draftPostsCount: posts.filter((p) => p.isPublished === false).length,
    headerAnnouncement: header.headerText,
    siteName: seo.siteName,
  };
}
