"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  actionGetCmsContent,
  actionSaveHeroSlider,
  actionDeleteHeroSlider,
  actionSaveHeroBanner,
  actionDeleteHeroBanner,
  actionSaveCountdown,
  actionSaveHeaderSettings,
  actionSaveSeoSettings,
  actionSaveBlogPost,
  actionDeleteBlogPost,
  actionToggleBlogPublish,
} from "@/actions/vanigamActions";
import { HeroSliderType, HeroBannerType, HeaderSettingType, SeoSettingType, ExtendedBlogPost } from "@/services/cmsService";
import toast from "react-hot-toast";

export default function CMSManagementView() {
  const { currentWorkspace, currentRole, hasPermission } = useWorkspace();
  const canManage = hasPermission("content.manage" as any) || currentRole === "SUPER_ADMIN" || currentRole === "ORG_OWNER" || currentRole === "ORG_ADMIN";

  const [activeTab, setActiveTab] = useState<"sliders" | "banners" | "countdown" | "header" | "blog" | "preview">("sliders");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // CMS Content State
  const [sliders, setSliders] = useState<HeroSliderType[]>([]);
  const [banners, setBanners] = useState<HeroBannerType[]>([]);
  const [countdowns, setCountdowns] = useState<any[]>([]);
  const [headerSetting, setHeaderSetting] = useState<HeaderSettingType | null>(null);
  const [seoSetting, setSeoSetting] = useState<SeoSettingType | null>(null);
  const [blogPosts, setBlogPosts] = useState<ExtendedBlogPost[]>([]);
  const [products, setProducts] = useState<{ id: string; title: string }[]>([]);

  // Slider Modal State
  const [showSliderModal, setShowSliderModal] = useState(false);
  const [sliderForm, setSliderForm] = useState<{
    id?: number;
    sliderName: string;
    sliderImage: string;
    discountRate: number;
    productId: string;
    shortDescription: string;
    price: number;
    discountedPrice: number;
  }>({
    sliderName: "",
    sliderImage: "/images/hero/hero-01.png",
    discountRate: 20,
    productId: "1",
    shortDescription: "",
    price: 199,
    discountedPrice: 149,
  });

  // Banner Modal State
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [bannerForm, setBannerForm] = useState<{
    id?: number;
    bannerName: string;
    subtitle: string;
    bannerImage: string;
    productId: string;
    price: number;
    discountedPrice: number;
  }>({
    bannerName: "",
    subtitle: "",
    bannerImage: "/images/hero/bannar-1.png",
    productId: "1",
    price: 499,
    discountedPrice: 399,
  });

  // Countdown Form State
  const [countdownForm, setCountdownForm] = useState({
    title: "",
    subtitle: "",
    countdownImage: "/images/countdown/speaker.png",
    productId: "1",
  });

  // Header & SEO Form State
  const [headerText, setHeaderText] = useState("");
  const [headerLogo, setHeaderLogo] = useState("");
  const [emailLogo, setEmailLogo] = useState("");
  const [siteName, setSiteName] = useState("");
  const [siteTitle, setSiteTitle] = useState("");
  const [metadescription, setMetadescription] = useState("");

  // Blog Modal State
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [blogForm, setBlogForm] = useState<{
    id?: string;
    title: string;
    excerpt: string;
    category: string;
    coverImage: string;
    tags: string;
    readTime: string;
    content: string;
    isPublished: boolean;
  }>({
    title: "",
    excerpt: "",
    category: "Technology",
    coverImage: "/images/blog/blog-1.png",
    tags: "Productivity, Hardware",
    readTime: "5 min read",
    content: "",
    isPublished: true,
  });

  const loadCmsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await actionGetCmsContent();
      setSliders(data.sliders || []);
      setBanners(data.banners || []);
      setCountdowns(data.countdowns || []);
      setHeaderSetting(data.header || null);
      setSeoSetting(data.seo || null);
      setBlogPosts(data.blogPosts || []);
      setProducts(data.products || []);

      if (data.header) {
        setHeaderText(data.header.headerText || "");
        setHeaderLogo(data.header.headerLogo || "");
        setEmailLogo(data.header.emailLogo || "");
      }
      if (data.seo) {
        setSiteName(data.seo.siteName || "");
        setSiteTitle(data.seo.siteTitle || "");
        setMetadescription(data.seo.metadescription || "");
      }
      if (data.countdowns && data.countdowns.length > 0) {
        const c = data.countdowns[0];
        setCountdownForm({
          title: c.title || "",
          subtitle: c.subtitle || "",
          countdownImage: c.countdownImage || "/images/countdown/speaker.png",
          productId: String(c.productId || "1"),
        });
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load CMS content");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCmsData();
  }, [loadCmsData]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleOpenSliderModal = (slider?: HeroSliderType) => {
    if (slider) {
      setSliderForm({
        id: slider.id,
        sliderName: slider.sliderName,
        sliderImage: slider.sliderImage,
        discountRate: slider.discountRate,
        productId: slider.productId || "1",
        shortDescription: slider.product?.shortDescription || "",
        price: slider.product?.price || 199,
        discountedPrice: slider.product?.discountedPrice || 149,
      });
    } else {
      setSliderForm({
        sliderName: "",
        sliderImage: "/images/hero/hero-01.png",
        discountRate: 25,
        productId: products[0]?.id || "1",
        shortDescription: "Ultra-fast high performance smart device with 40-hour battery life.",
        price: 299,
        discountedPrice: 199,
      });
    }
    setShowSliderModal(true);
  };

  const handleSaveSlider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      toast.error("Permission denied: You do not have content management rights.");
      return;
    }
    setIsSaving(true);
    try {
      const selectedProd = products.find((p) => p.id === sliderForm.productId);
      await actionSaveHeroSlider({
        ...sliderForm,
        product: {
          title: selectedProd?.title || sliderForm.sliderName,
          slug: selectedProd?.id ? `product-${selectedProd.id}` : "featured-product",
          shortDescription: sliderForm.shortDescription,
          price: sliderForm.price,
          discountedPrice: sliderForm.discountedPrice,
        },
      });
      toast.success("Hero slider saved & published to storefront!");
      setShowSliderModal(false);
      await loadCmsData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save hero slider");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlider = async (id: number) => {
    if (!canManage) return toast.error("Permission denied");
    if (!confirm("Are you sure you want to delete this hero slider?")) return;
    try {
      await actionDeleteHeroSlider(id);
      toast.success("Hero slider deleted successfully");
      await loadCmsData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete slider");
    }
  };

  const handleOpenBannerModal = (banner?: HeroBannerType) => {
    if (banner) {
      setBannerForm({
        id: banner.id,
        bannerName: banner.bannerName || "",
        subtitle: banner.subtitle || "",
        bannerImage: banner.bannerImage,
        productId: banner.productId || "1",
        price: banner.product?.price || 499,
        discountedPrice: banner.product?.discountedPrice || 399,
      });
    } else {
      setBannerForm({
        bannerName: "",
        subtitle: "Special limited promo offer",
        bannerImage: "/images/hero/bannar-1.png",
        productId: products[0]?.id || "1",
        price: 599,
        discountedPrice: 479,
      });
    }
    setShowBannerModal(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return toast.error("Permission denied");
    setIsSaving(true);
    try {
      const selectedProd = products.find((p) => p.id === bannerForm.productId);
      await actionSaveHeroBanner({
        ...bannerForm,
        product: {
          title: selectedProd?.title || bannerForm.bannerName,
          slug: selectedProd?.id ? `product-${selectedProd.id}` : "banner-item",
          price: bannerForm.price,
          discountedPrice: bannerForm.discountedPrice,
        },
      });
      toast.success("Hero side banner saved successfully!");
      setShowBannerModal(false);
      await loadCmsData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save banner");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBanner = async (id: number) => {
    if (!canManage) return toast.error("Permission denied");
    if (!confirm("Are you sure you want to delete this promotional banner?")) return;
    try {
      await actionDeleteHeroBanner(id);
      toast.success("Banner deleted successfully");
      await loadCmsData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete banner");
    }
  };

  const handleSaveCountdown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return toast.error("Permission denied");
    setIsSaving(true);
    try {
      await actionSaveCountdown({
        id: countdowns[0]?.id || 1,
        title: countdownForm.title,
        subtitle: countdownForm.subtitle,
        countdownImage: countdownForm.countdownImage,
        productId: countdownForm.productId,
      });
      toast.success("Countdown flash deal updated on storefront!");
      await loadCmsData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save countdown deal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveHeaderAndSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return toast.error("Permission denied");
    setIsSaving(true);
    try {
      await Promise.all([
        actionSaveHeaderSettings({
          headerText,
          headerLogo,
          emailLogo,
        }),
        actionSaveSeoSettings({
          siteName,
          siteTitle,
          metadescription,
        }),
      ]);
      toast.success("Header announcements, logos, and SEO settings synchronized!");
      await loadCmsData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save storefront settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenBlogModal = (post?: ExtendedBlogPost) => {
    if (post) {
      setBlogForm({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        coverImage: post.coverImage,
        tags: post.tags.join(", "),
        readTime: post.readTime,
        content: post.content.join("\n\n"),
        isPublished: post.isPublished !== false,
      });
    } else {
      setBlogForm({
        title: "",
        excerpt: "",
        category: "Technology",
        coverImage: "/images/blog/blog-1.png",
        tags: "Ecommerce, Hardware, Trends",
        readTime: "4 min read",
        content: "Write your article content here...",
        isPublished: true,
      });
    }
    setShowBlogModal(true);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return toast.error("Permission denied");
    setIsSaving(true);
    try {
      await actionSaveBlogPost({
        ...blogForm,
        tags: blogForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
        content: blogForm.content.split("\n\n").filter(Boolean),
      });
      toast.success("Blog article saved successfully!");
      setShowBlogModal(false);
      await loadCmsData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save blog post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleBlogPublish = async (id: string) => {
    if (!canManage) return toast.error("Permission denied");
    try {
      const res = await actionToggleBlogPublish(id);
      toast.success(`Article ${res?.isPublished ? "Published" : "Moved to Drafts"}`);
      await loadCmsData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to toggle article status");
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!canManage) return toast.error("Permission denied");
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    try {
      await actionDeleteBlogPost(id);
      toast.success("Article deleted");
      await loadCmsData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete article");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-2 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue border border-blue-100">
              CMS Architecture
            </span>
            <span className="text-xs text-gray-400 font-medium">
              Org: {currentWorkspace.name} ({currentWorkspace.organizationType})
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-dark tracking-tight">
            Storefront CMS & Content Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage carousel sliders, side banners, flash deal countdowns, header announcements, and blog articles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-3 text-sm font-semibold text-dark hover:bg-gray-1 transition"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Public Storefront
          </Link>

          <button
            onClick={loadCmsData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue text-white text-sm font-semibold rounded-xl hover:bg-blue-dark transition shadow-xs disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoading ? "Refreshing..." : "Sync Storefront"}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-2 shadow-xs">
          <span className="text-xs text-gray-400 font-semibold uppercase block mb-1">Hero Sliders</span>
          <span className="text-2xl font-black text-dark">{sliders.length}</span>
          <span className="text-xs text-emerald-600 block mt-1">● Active on Home</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-2 shadow-xs">
          <span className="text-xs text-gray-400 font-semibold uppercase block mb-1">Side Banners</span>
          <span className="text-2xl font-black text-dark">{banners.length}</span>
          <span className="text-xs text-blue block mt-1">● Promo Grid Slots</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-2 shadow-xs">
          <span className="text-xs text-gray-400 font-semibold uppercase block mb-1">Flash Deal</span>
          <span className="text-2xl font-black text-dark">{countdowns.length > 0 ? "Live" : "Inactive"}</span>
          <span className="text-xs text-orange block mt-1">● 24h Countdown</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-2 shadow-xs">
          <span className="text-xs text-gray-400 font-semibold uppercase block mb-1">Blog Articles</span>
          <span className="text-2xl font-black text-dark">{blogPosts.length}</span>
          <span className="text-xs text-purple-600 block mt-1">● Published Insights</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-2 shadow-xs col-span-2 sm:col-span-1 lg:col-span-1">
          <span className="text-xs text-gray-400 font-semibold uppercase block mb-1">Topbar Status</span>
          <span className="text-xs font-bold text-dark block truncate">{headerSetting?.headerText || "Get free delivery..."}</span>
          <span className="text-xs text-teal-600 block mt-1">● Instant Sync Active</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-2 bg-white rounded-t-xl px-4 gap-2 overflow-x-auto momentum-scroll">
        {[
          { key: "sliders", label: "Hero Sliders", badge: sliders.length },
          { key: "banners", label: "Side Banners", badge: banners.length },
          { key: "countdown", label: "Countdown Flash Deal", badge: countdowns.length > 0 ? "1" : "0" },
          { key: "header", label: "Header & Branding", badge: null },
          { key: "blog", label: "Blog & Articles", badge: blogPosts.length },
          { key: "preview", label: "Storefront Simulation", badge: "Live" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`py-3.5 px-4 font-bold text-sm border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.key
                ? "border-blue text-blue"
                : "border-transparent text-gray-500 hover:text-dark hover:border-gray-3"
            }`}
          >
            {tab.label}
            {tab.badge && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === tab.key ? "bg-blue text-white" : "bg-gray-100 text-gray-600"
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: HERO SLIDERS */}
      {activeTab === "sliders" && (
        <div className="bg-white p-6 rounded-b-xl border border-t-0 border-gray-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-dark">Carousel Hero Sliders</h2>
              <p className="text-xs text-gray-500">
                Main rotating showcase at the top of the public homepage. Each slider references an authentic catalog product.
              </p>
            </div>
            {canManage && (
              <button
                onClick={() => handleOpenSliderModal()}
                className="px-4 py-2 bg-blue text-white text-xs font-bold rounded-lg hover:bg-blue-dark transition flex items-center gap-1.5"
              >
                <span>+</span> Add New Slider
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sliders.map((s) => (
              <div key={s.id} className="border border-gray-2 rounded-2xl p-4 bg-gray-50 flex flex-col justify-between hover:shadow-sm transition">
                <div className="space-y-3">
                  <div className="relative aspect-16/9 rounded-xl overflow-hidden bg-white border border-gray-2">
                    <Image src={s.sliderImage || "/images/hero/hero-01.png"} alt={s.sliderName} fill className="object-contain p-2" />
                    <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange text-white">
                      -{s.discountRate}% OFF
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-dark text-base">{s.sliderName}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {s.product?.shortDescription || "No description provided."}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-2 flex items-center justify-between text-xs text-gray-600">
                    <span>Target SKU: <strong className="text-dark">{s.productId}</strong></span>
                    <span className="font-bold text-blue">${s.product?.discountedPrice || s.product?.price || 199}</span>
                  </div>
                </div>

                {canManage && (
                  <div className="pt-4 mt-4 border-t border-gray-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenSliderModal(s)}
                      className="px-3 py-1.5 text-xs font-semibold text-blue bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSlider(s.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: HERO SIDE BANNERS */}
      {activeTab === "banners" && (
        <div className="bg-white p-6 rounded-b-xl border border-t-0 border-gray-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-dark">Hero Promotional Side Banners</h2>
              <p className="text-xs text-gray-500">
                Displayed in the 1/3 column adjacent to the hero slider carousel.
              </p>
            </div>
            {canManage && (
              <button
                onClick={() => handleOpenBannerModal()}
                className="px-4 py-2 bg-blue text-white text-xs font-bold rounded-lg hover:bg-blue-dark transition flex items-center gap-1.5"
              >
                <span>+</span> Add Side Banner
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((b) => (
              <div key={b.id} className="border border-gray-2 rounded-2xl p-5 bg-gray-50 flex items-center gap-4 hover:shadow-sm transition">
                <div className="w-28 h-28 relative rounded-xl overflow-hidden bg-white border border-gray-2 shrink-0">
                  <Image src={b.bannerImage || "/images/hero/bannar-1.png"} alt={b.bannerName || "banner"} fill className="object-contain p-2" />
                </div>
                <div className="flex-1 space-y-1">
                  <span className="text-xs font-bold text-blue uppercase tracking-wider">Highlight</span>
                  <h3 className="font-extrabold text-dark text-base">{b.bannerName}</h3>
                  <p className="text-xs text-gray-500">{b.subtitle}</p>
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="font-bold text-dark">${b.product?.discountedPrice || 499}</span>
                    <span className="text-gray-400 line-through">${b.product?.price || 599}</span>
                  </div>

                  {canManage && (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenBannerModal(b)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue bg-blue-50 rounded-md hover:bg-blue-100 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(b.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: COUNTDOWN DEAL */}
      {activeTab === "countdown" && (
        <div className="bg-white p-6 rounded-b-xl border border-t-0 border-gray-2 space-y-6 max-w-3xl">
          <div>
            <h2 className="text-lg font-bold text-dark">Countdown Flash Deal Campaign</h2>
            <p className="text-xs text-gray-500">
              Powers the full-width high-urgency countdown timer section on the storefront.
            </p>
          </div>

          <form onSubmit={handleSaveCountdown} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-dark mb-1">Deal Headline Title</label>
              <input
                type="text"
                value={countdownForm.title}
                onChange={(e) => setCountdownForm({ ...countdownForm, title: e.target.value })}
                required
                className="w-full px-4 py-2.5 text-sm border border-gray-3 rounded-lg focus:outline-none focus:border-blue"
                placeholder="Don't Miss The Sound Experience"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-dark mb-1">Subtitle / Deal Badge</label>
              <input
                type="text"
                value={countdownForm.subtitle}
                onChange={(e) => setCountdownForm({ ...countdownForm, subtitle: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-gray-3 rounded-lg focus:outline-none focus:border-blue"
                placeholder="Special Limited Offer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-dark mb-1">Linked Catalog Product (Phase 19)</label>
                <select
                  value={countdownForm.productId}
                  onChange={(e) => setCountdownForm({ ...countdownForm, productId: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-3 rounded-lg focus:outline-none focus:border-blue bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.title} (ID: {p.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Product Showcase Image URL</label>
                <input
                  type="text"
                  value={countdownForm.countdownImage}
                  onChange={(e) => setCountdownForm({ ...countdownForm, countdownImage: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-3 rounded-lg focus:outline-none focus:border-blue"
                  placeholder="/images/countdown/speaker.png"
                />
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="p-4 bg-gray-50 border border-gray-2 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-orange uppercase block mb-1">Live Storefront Preview</span>
                <h4 className="font-extrabold text-dark text-base">{countdownForm.title || "Headline Here"}</h4>
                <p className="text-xs text-gray-500">{countdownForm.subtitle || "Subtitle Here"}</p>
              </div>
              <div className="w-16 h-16 relative bg-white rounded-lg border border-gray-2 overflow-hidden">
                <Image src={countdownForm.countdownImage || "/images/countdown/speaker.png"} alt="Preview" fill className="object-contain p-1" />
              </div>
            </div>

            {canManage && (
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue text-white font-bold text-sm rounded-lg hover:bg-blue-dark transition disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Update Countdown Deal"}
              </button>
            )}
          </form>
        </div>
      )}

      {/* TAB 4: HEADER ANNOUNCEMENT & SEO BRANDING */}
      {activeTab === "header" && (
        <div className="bg-white p-6 rounded-b-xl border border-t-0 border-gray-2 space-y-6 max-w-3xl">
          <div>
            <h2 className="text-lg font-bold text-dark">Header Announcement & SEO Settings</h2>
            <p className="text-xs text-gray-500">
              Manage the global topbar notification banner, storefront logos, and search engine metadata.
            </p>
          </div>

          <form onSubmit={handleSaveHeaderAndSeo} className="space-y-5">
            <div className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-2">
              <h3 className="text-sm font-bold text-dark uppercase tracking-wider">Storefront Header & Announcement</h3>
              
              <div>
                <label className="block text-xs font-bold text-dark mb-1">Global Topbar Announcement Text</label>
                <input
                  type="text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-3 rounded-lg focus:outline-none focus:border-blue bg-white"
                  placeholder="Get free delivery on orders over $100"
                />
                <span className="text-xs text-gray-400 mt-1 block">Renders at the very top of all public customer pages.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Header Logo URL</label>
                  <input
                    type="text"
                    value={headerLogo}
                    onChange={(e) => setHeaderLogo(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-3 rounded-lg focus:outline-none focus:border-blue bg-white"
                    placeholder="/images/logo/logo.svg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Email Template Logo URL</label>
                  <input
                    type="text"
                    value={emailLogo}
                    onChange={(e) => setEmailLogo(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-3 rounded-lg focus:outline-none focus:border-blue bg-white"
                    placeholder="/images/logo/logo.svg"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-2">
              <h3 className="text-sm font-bold text-dark uppercase tracking-wider">SEO & Metadata Architecture</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Marketplace Platform Name</label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-3 rounded-lg focus:outline-none focus:border-blue bg-white"
                    placeholder="VANIGAM"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">SEO Page Title</label>
                  <input
                    type="text"
                    value={siteTitle}
                    onChange={(e) => setSiteTitle(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-3 rounded-lg focus:outline-none focus:border-blue bg-white"
                    placeholder="VANIGAM — Unified B2B2C Marketplace"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Meta Description</label>
                <textarea
                  rows={2}
                  value={metadescription}
                  onChange={(e) => setMetadescription(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-3 rounded-lg focus:outline-none focus:border-blue bg-white"
                  placeholder="Comprehensive description for search engine snippet generation..."
                />
              </div>
            </div>

            {canManage && (
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue text-white font-bold text-sm rounded-lg hover:bg-blue-dark transition disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Storefront Settings"}
              </button>
            )}
          </form>
        </div>
      )}

      {/* TAB 5: BLOG & ARTICLES */}
      {activeTab === "blog" && (
        <div className="bg-white p-6 rounded-b-xl border border-t-0 border-gray-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-dark">Blog & Articles Management</h2>
              <p className="text-xs text-gray-500">
                Publish articles, technical guides, and marketplace trends for retail shoppers and wholesale partners.
              </p>
            </div>
            {canManage && (
              <button
                onClick={() => handleOpenBlogModal()}
                className="px-4 py-2 bg-blue text-white text-xs font-bold rounded-lg hover:bg-blue-dark transition flex items-center gap-1.5"
              >
                <span>+</span> New Article
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-2">
                <tr>
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Read Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-2">
                {blogPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-4 font-bold text-dark">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 relative shrink-0">
                          <Image src={post.coverImage || "/images/blog/blog-1.png"} alt={post.title} fill className="object-cover" />
                        </div>
                        <div>
                          <span className="block font-bold text-dark leading-tight">{post.title}</span>
                          <span className="text-xs text-gray-400 font-normal">{post.publishedAt}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-gray-600">{post.category}</td>
                    <td className="py-3.5 px-4 text-xs font-medium text-dark">{post.author.name}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{post.readTime}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        post.isPublished !== false
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {post.isPublished !== false ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {canManage && (
                        <>
                          <button
                            onClick={() => handleToggleBlogPublish(post.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-gray-100 hover:bg-gray-200 transition text-dark"
                          >
                            {post.isPublished !== false ? "Unpublish" : "Publish"}
                          </button>
                          <button
                            onClick={() => handleOpenBlogModal(post)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue bg-blue-50 rounded hover:bg-blue-100 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBlog(post.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 rounded hover:bg-red-100 transition"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: STOREFRONT PREVIEW SIMULATION */}
      {activeTab === "preview" && (
        <div className="bg-white p-6 rounded-b-xl border border-t-0 border-gray-2 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-dark">Storefront Live Simulation</h2>
            <p className="text-xs text-gray-500">
              Simulated public rendering of active header announcement, hero slider, side banners, and flash deals.
            </p>
          </div>

          <div className="border border-gray-3 rounded-2xl overflow-hidden shadow-sm">
            {/* Topbar Simulation */}
            <div className="bg-[#111928] py-2 px-6 flex justify-between items-center text-xs text-white">
              <span>{headerText || "Get free delivery on orders over $100"}</span>
              <div className="flex gap-4">
                <span>Create an account</span>
                <span>Sign In</span>
              </div>
            </div>

            {/* Header Simulation */}
            <div className="p-4 bg-white border-b border-gray-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image src={headerLogo || "/images/logo/logo.svg"} alt="Logo" width={160} height={40} className="h-9.5 w-auto object-contain" />
                <span className="text-[11px] font-bold bg-blue/10 text-blue border border-blue/20 px-2 py-0.5 rounded-full">Storefront</span>
              </div>
              <div className="flex gap-6 text-sm font-semibold text-dark">
                <span>Popular</span>
                <span>Shop</span>
                <span>Pages</span>
                <span>Blog</span>
                <span>Contact</span>
              </div>
              <span className="text-xs text-gray-400">Cart (0)</span>
            </div>

            {/* Hero Simulation */}
            <div className="p-6 bg-[#F7F7F7] grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-gray-2 flex items-center justify-between">
                <div className="space-y-2 max-w-md">
                  <span className="text-xs font-bold text-blue uppercase">Flash Deal -{sliders[0]?.discountRate || 20}%</span>
                  <h3 className="text-2xl font-black text-dark">{sliders[0]?.sliderName || "Featured Product"}</h3>
                  <p className="text-xs text-gray-500">{sliders[0]?.product?.shortDescription || "Ergonomic hardware for high performance."}</p>
                  <button className="px-5 py-2 bg-blue text-white rounded-lg text-xs font-bold mt-2">
                    Shop Now
                  </button>
                </div>
                <div className="w-40 h-40 relative bg-gray-50 rounded-xl overflow-hidden">
                  <Image src={sliders[0]?.sliderImage || "/images/hero/hero-01.png"} alt="Hero" fill className="object-contain p-2" />
                </div>
              </div>

              <div className="space-y-4">
                {banners.slice(0, 2).map((b, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-2 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-orange">Special</span>
                      <h4 className="font-bold text-dark text-sm">{b.bannerName}</h4>
                      <p className="text-xs text-gray-400">{b.subtitle}</p>
                    </div>
                    <div className="w-16 h-16 relative bg-gray-50 rounded-lg overflow-hidden shrink-0">
                      <Image src={b.bannerImage} alt="Banner" fill className="object-contain p-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLIDER MODAL */}
      {showSliderModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-dark">
              {sliderForm.id ? "Edit Hero Slider" : "Add New Hero Slider"}
            </h3>
            <form onSubmit={handleSaveSlider} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-dark mb-1">Slider Headline Title</label>
                <input
                  type="text"
                  value={sliderForm.sliderName}
                  onChange={(e) => setSliderForm({ ...sliderForm, sliderName: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-3 rounded-lg focus:border-blue outline-none"
                  placeholder="e.g. Next-Gen Ultra Watch Series 9"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Discount Rate (%)</label>
                  <input
                    type="number"
                    value={sliderForm.discountRate}
                    onChange={(e) => setSliderForm({ ...sliderForm, discountRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-3 rounded-lg focus:border-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Target Product (Phase 19)</label>
                  <select
                    value={sliderForm.productId}
                    onChange={(e) => setSliderForm({ ...sliderForm, productId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-3 rounded-lg focus:border-blue outline-none bg-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Slider Image URL</label>
                <input
                  type="text"
                  value={sliderForm.sliderImage}
                  onChange={(e) => setSliderForm({ ...sliderForm, sliderImage: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-3 rounded-lg focus:border-blue outline-none"
                  placeholder="/images/hero/hero-01.png"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={sliderForm.shortDescription}
                  onChange={(e) => setSliderForm({ ...sliderForm, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-3 rounded-lg focus:border-blue outline-none"
                  placeholder="Highlights for this offer..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-2">
                <button
                  type="button"
                  onClick={() => setShowSliderModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue text-white text-sm font-bold rounded-lg hover:bg-blue-dark disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Slider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BANNER MODAL */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-dark">
              {bannerForm.id ? "Edit Side Banner" : "Add Side Banner"}
            </h3>
            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-dark mb-1">Banner Title</label>
                <input
                  type="text"
                  value={bannerForm.bannerName}
                  onChange={(e) => setBannerForm({ ...bannerForm, bannerName: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-3 rounded-lg focus:border-blue outline-none"
                  placeholder="e.g. Logitech MX Master 3S"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Subtitle</label>
                <input
                  type="text"
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-3 rounded-lg focus:border-blue outline-none"
                  placeholder="Ergonomic wireless performance mouse"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Target Product</label>
                  <select
                    value={bannerForm.productId}
                    onChange={(e) => setBannerForm({ ...bannerForm, productId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-3 rounded-lg focus:border-blue outline-none bg-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Image URL</label>
                  <input
                    type="text"
                    value={bannerForm.bannerImage}
                    onChange={(e) => setBannerForm({ ...bannerForm, bannerImage: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-3 rounded-lg focus:border-blue outline-none"
                    placeholder="/images/hero/bannar-1.png"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-2">
                <button
                  type="button"
                  onClick={() => setShowBannerModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue text-white text-sm font-bold rounded-lg hover:bg-blue-dark disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BLOG MODAL */}
      {showBlogModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-dark">
              {blogForm.id ? "Edit Blog Article" : "Create New Blog Article"}
            </h3>
            <form onSubmit={handleSaveBlog} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-dark mb-1">Article Title</label>
                <input
                  type="text"
                  value={blogForm.title}
                  onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-3 rounded-lg focus:border-blue outline-none"
                  placeholder="10 Essential Gadgets That Will Revolutionize Your Work..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Category</label>
                  <input
                    type="text"
                    value={blogForm.category}
                    onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-3 rounded-lg focus:border-blue outline-none"
                    placeholder="Technology"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-dark mb-1">Read Time</label>
                  <input
                    type="text"
                    value={blogForm.readTime}
                    onChange={(e) => setBlogForm({ ...blogForm, readTime: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-3 rounded-lg focus:border-blue outline-none"
                    placeholder="5 min read"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Excerpt / Summary</label>
                <textarea
                  rows={2}
                  value={blogForm.excerpt}
                  onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-3 rounded-lg focus:border-blue outline-none"
                  placeholder="A brief teaser for grid views..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Cover Image URL</label>
                <input
                  type="text"
                  value={blogForm.coverImage}
                  onChange={(e) => setBlogForm({ ...blogForm, coverImage: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-3 rounded-lg focus:border-blue outline-none"
                  placeholder="/images/blog/blog-1.png"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={blogForm.tags}
                  onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-3 rounded-lg focus:border-blue outline-none"
                  placeholder="Hardware, Productivity, Workspace"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dark mb-1">Article Body (Paragraphs separated by blank lines)</label>
                <textarea
                  rows={4}
                  value={blogForm.content}
                  onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-3 rounded-lg focus:border-blue outline-none font-mono text-xs"
                  placeholder="Paragraph 1...&#10;&#10;Paragraph 2..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublishedCheck"
                  checked={blogForm.isPublished}
                  onChange={(e) => setBlogForm({ ...blogForm, isPublished: e.target.checked })}
                  className="w-4 h-4 text-blue rounded"
                />
                <label htmlFor="isPublishedCheck" className="text-xs font-bold text-dark">
                  Publish Immediately (If unchecked, saved as Draft)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-2">
                <button
                  type="button"
                  onClick={() => setShowBlogModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue text-white text-sm font-bold rounded-lg hover:bg-blue-dark disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
