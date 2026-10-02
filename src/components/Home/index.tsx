import Image from "next/image";
import Link from "next/link";
import Newsletter from "../Common/Newsletter";
import ProductCard from "@/components/Common/ProductCard";
import DealCountdown from "./DealCountdown";
import HeroCarousel, { type HeroImage } from "./HeroCarousel";
import {
  getStorefrontCategories,
  getStorefrontProducts,
  getStorefrontSections,
  getTopReviews,
  type ProductSort,
} from "@/lib/storefront";
import { asNumber, asString, safeHref, safeImage } from "@/lib/safeUrl";
import type { StoreSection } from "@/types/storefront";

const SORTS: ProductSort[] = ["newest", "popular", "price-low", "price-high", "rating", "discount"];
const isLocal = (src: string) => src.startsWith("/");

function SectionHeading({ section, action }: { section: StoreSection; action?: { href: string; text: string } }) {
  if (!section.title) return null;
  return (
    <div className="flex items-end justify-between gap-4 mb-8">
      <div>
        <h2 className="text-xl font-semibold xl:text-heading-5 text-dark">{section.title}</h2>
        {section.subtitle && <p className="text-sm text-gray-500 mt-1">{section.subtitle}</p>}
      </div>
      {action && (
        <Link href={action.href} className="shrink-0 text-sm font-semibold text-blue hover:underline">
          {action.text} →
        </Link>
      )}
    </div>
  );
}

/** Images for the hero slider: `images`, else the images of older `slides`, else the single `imageUrl`. */
function heroImages(c: Record<string, unknown>, alt: string): HeroImage[] {
  const raw: unknown[] = Array.isArray(c.images)
    ? c.images
    : Array.isArray(c.slides)
      ? (c.slides as Array<Record<string, unknown>>).map((x) => x?.imageUrl)
      : [c.imageUrl];
  const out: HeroImage[] = [];
  for (const item of raw.slice(0, 8)) {
    const entry = item && typeof item === "object" ? (item as Record<string, unknown>) : { imageUrl: item };
    const url = safeImage(entry.imageUrl ?? entry.url);
    if (url) out.push({ url, alt: asString(entry.alt) || alt });
  }
  return out;
}

function Hero({ section }: { section: StoreSection }) {
  const c = section.config;
  const images = heroImages(c, section.title ?? "Featured");
  return (
    <section className="overflow-hidden pb-12 pt-40 bg-[#F7F7F7]">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center bg-white border border-gray-2 rounded-2xl overflow-hidden">
          {/* Fixed copy: only the picture on the right scrolls */}
          <div className="p-8 pb-4 sm:p-12 lg:pb-12 lg:pl-16">
            {asString(c.tag) && (
              <span className="inline-block mb-4 px-3 py-1 rounded-full bg-blue/10 text-blue text-xs font-bold uppercase tracking-wider">
                {asString(c.tag)}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-dark leading-tight mb-4">{section.title}</h1>
            {section.subtitle && <p className="text-sm sm:text-base text-gray-600 mb-8 leading-relaxed">{section.subtitle}</p>}
            <div className="flex flex-wrap gap-3">
              {asString(c.ctaText) && (
                <Link
                  href={safeHref(c.ctaUrl, "/shop-with-sidebar")}
                  className="inline-flex items-center px-6 py-3 rounded-xl bg-blue text-white text-sm font-bold hover:bg-blue-dark transition-colors"
                >
                  {asString(c.ctaText)}
                </Link>
              )}
              {asString(c.secondaryText) && (
                <Link
                  href={safeHref(c.secondaryUrl, "/shop-with-sidebar")}
                  className="inline-flex items-center px-6 py-3 rounded-xl border border-gray-3 text-dark text-sm font-bold hover:bg-gray-1 transition-colors"
                >
                  {asString(c.secondaryText)}
                </Link>
              )}
            </div>
          </div>
          {images.length > 0 && (
            <div className={`relative h-full ${c.imageFit === "cover" ? "" : "bg-gradient-to-br from-blue/5 via-white to-blue/10"}`}>
              <HeroCarousel images={images} contain={c.imageFit !== "cover"} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

async function FeaturedCategories({ section }: { section: StoreSection }) {
  const limit = Math.min(Math.max(asNumber(section.config.limit, 6), 1), 12);
  const categories = (await getStorefrontCategories()).filter((c) => !c.parentId).slice(0, limit);
  if (categories.length === 0) return null;
  return (
    <section className="py-14 overflow-hidden">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <SectionHeading section={section} />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6">
          {categories.map((cat) => {
            const img = safeImage(cat.imageUrl);
            return (
              <Link key={cat.id} href={`/categories/${cat.slug}`} className="group flex flex-col items-center text-center">
                <div className="relative w-[110px] h-[110px] bg-[#F2F3F8] rounded-full flex items-center justify-center mb-4 overflow-hidden group-hover:ring-2 group-hover:ring-blue/30 transition">
                  {img ? (
                    <Image src={img} alt={cat.name} width={64} height={64} unoptimized={!isLocal(img)} className="object-contain w-16 h-16" />
                  ) : (
                    <span className="text-3xl font-bold text-blue/60">{cat.name.charAt(0)}</span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-dark group-hover:text-blue duration-300">{cat.name}</h3>
                <span className="text-xs text-gray-400">{cat.productCount} {cat.productCount === 1 ? "product" : "products"}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

async function FeaturedProducts({ section }: { section: StoreSection }) {
  const limit = Math.min(Math.max(asNumber(section.config.limit, 8), 1), 24);
  const sort = SORTS.includes(section.config.sort as ProductSort) ? (section.config.sort as ProductSort) : "newest";
  const categorySlug = asString(section.config.categorySlug) || undefined;
  const products = (await getStorefrontProducts({ sort, categorySlug, take: 60 })).slice(0, limit);
  if (products.length === 0 && sort === "discount") return null;

  const viewAllUrl = safeHref(section.config.viewAllUrl, "/shop-with-sidebar");
  return (
    <section className="py-10 overflow-hidden">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <SectionHeading section={section} action={{ href: viewAllUrl, text: asString(section.config.viewAllText, "View all") }} />
        {products.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">New products are on their way. Please check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PromoTiles({ section }: { section: StoreSection }) {
  const items = Array.isArray(section.config.items)
    ? (section.config.items as Array<Record<string, unknown>>).filter((i) => i && typeof i === "object").slice(0, 4)
    : [];
  if (items.length === 0) return null;
  return (
    <section className="py-10 overflow-hidden">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <SectionHeading section={section} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, i) => {
            const img = safeImage(item.imageUrl);
            return (
              <Link
                key={i}
                href={safeHref(item.ctaUrl, "/shop-with-sidebar")}
                className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-gray-3 bg-white p-6 hover:border-blue/40 hover:shadow-md transition-all"
              >
                <div className="relative z-10 max-w-[55%]">
                  {asString(item.badge) && (
                    <span className="inline-block mb-3 px-2.5 py-0.5 rounded-full bg-blue/10 text-blue text-[11px] font-bold uppercase tracking-wider">
                      {asString(item.badge)}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-dark leading-snug mb-1">{asString(item.title)}</h3>
                  <p className="text-xs text-gray-500 mb-4">{asString(item.subtitle)}</p>
                  <span className="text-sm font-semibold text-blue group-hover:underline">{asString(item.ctaText, "Shop now")} →</span>
                </div>
                {img && (
                  <div className="relative h-36 w-36 shrink-0">
                    <Image src={img} alt={asString(item.title)} fill unoptimized={!isLocal(img)} className="object-contain transition-transform duration-300 group-hover:scale-105" sizes="144px" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DealBanner({ section }: { section: StoreSection }) {
  const c = section.config;
  const end = new Date(asString(c.endDate)).getTime();
  // Hidden once the deal has ended (or when no valid end date is configured).
  if (Number.isNaN(end) || end <= Date.now()) return null;
  const img = safeImage(c.imageUrl);
  return (
    <section className="py-10 overflow-hidden">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <div className="relative overflow-hidden rounded-2xl bg-dark px-6 py-10 sm:px-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            {asString(c.badge) && (
              <span className="inline-block mb-3 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider">
                {asString(c.badge)}
              </span>
            )}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">{section.title}</h2>
            {section.subtitle && <p className="text-sm text-white/80 mb-6 max-w-lg">{section.subtitle}</p>}
            <div className="mb-8">
              <DealCountdown endDate={asString(c.endDate)} />
            </div>
            {asString(c.ctaText) && (
              <Link
                href={safeHref(c.ctaUrl, "/shop-with-sidebar")}
                className="inline-flex items-center px-6 py-3 rounded-xl bg-blue text-white text-sm font-bold hover:bg-blue-dark transition-colors"
              >
                {asString(c.ctaText)}
              </Link>
            )}
          </div>
          {img && (
            <div className="relative h-56 md:h-72">
              <Image src={img} alt={section.title ?? "Deal"} fill unoptimized={!isLocal(img)} className="object-contain" sizes="(min-width: 768px) 50vw, 100vw" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PromoBanner({ section }: { section: StoreSection }) {
  const c = section.config;
  return (
    <section className="py-10 overflow-hidden">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <div className="rounded-2xl border border-blue/20 bg-blue/5 p-8 sm:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            {asString(c.badge) && (
              <span className="inline-block mb-3 px-3 py-1 rounded-full bg-blue/10 text-blue text-xs font-bold uppercase tracking-wider">
                {asString(c.badge)}
              </span>
            )}
            <h2 className="text-xl sm:text-2xl font-extrabold text-dark mb-2">{section.title}</h2>
            {section.subtitle && <p className="text-sm text-gray-600">{section.subtitle}</p>}
          </div>
          {asString(c.ctaText) && (
            <Link
              href={safeHref(c.ctaUrl, "/contact")}
              className="shrink-0 inline-flex items-center px-6 py-3 rounded-xl bg-dark text-white text-sm font-bold hover:bg-dark-2 transition-colors"
            >
              {asString(c.ctaText)}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function ValuePropositions({ section }: { section: StoreSection }) {
  const items = Array.isArray(section.config.items)
    ? (section.config.items as Array<Record<string, unknown>>).filter((i) => i && typeof i === "object")
    : [];
  if (items.length === 0) return null;
  return (
    <section className="py-12 overflow-hidden">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <SectionHeading section={section} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div key={i} className="p-6 bg-white rounded-2xl border border-gray-3">
              <div className="w-9 h-9 mb-4 rounded-lg bg-blue/10 text-blue flex items-center justify-center font-bold">{i + 1}</div>
              <h3 className="font-bold text-dark mb-2">{asString(item.title)}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{asString(item.desc)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

async function CustomerReviews({ section }: { section: StoreSection }) {
  const reviews = await getTopReviews(asNumber(section.config.limit, 3));
  // Only real, approved reviews are shown; the section disappears until there are some.
  if (reviews.length === 0) return null;
  return (
    <section className="py-12 overflow-hidden">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <SectionHeading section={section} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <figure key={r.id} className="p-6 bg-white rounded-2xl border border-gray-3 flex flex-col">
              <div className="text-amber-500 text-sm mb-3" aria-label={`${r.rating} out of 5`}>
                {"★".repeat(r.rating)}
                {"☆".repeat(5 - r.rating)}
              </div>
              {r.title && <p className="font-bold text-dark mb-1">{r.title}</p>}
              <blockquote className="text-sm text-gray-600 leading-relaxed flex-1">{r.comment}</blockquote>
              <figcaption className="mt-4 text-xs text-gray-500">
                <span className="font-semibold text-dark">{r.name}</span>
                {r.isVerifiedPurchase && <span className="ml-2 text-emerald-700">Verified purchase</span>}
                <Link href={`/products/${r.product.slug}`} className="block mt-1 text-blue hover:underline">
                  {r.product.title}
                </Link>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const Home = async () => {
  const sections = await getStorefrontSections();

  return (
    <main>
      {sections.map((section) => {
        switch (section.sectionType) {
          case "HERO":
            return <Hero key={section.id} section={section} />;
          case "FEATURED_CATEGORIES":
            return <FeaturedCategories key={section.id} section={section} />;
          case "FEATURED_PRODUCTS":
            return <FeaturedProducts key={section.id} section={section} />;
          case "PROMO_TILES":
            return <PromoTiles key={section.id} section={section} />;
          case "DEAL_BANNER":
            return <DealBanner key={section.id} section={section} />;
          case "PROMO_BANNER":
            return <PromoBanner key={section.id} section={section} />;
          case "VALUE_PROPOSITIONS":
            return <ValuePropositions key={section.id} section={section} />;
          case "CUSTOMER_REVIEWS":
            return <CustomerReviews key={section.id} section={section} />;
          default:
            return null;
        }
      })}
      <Newsletter />
    </main>
  );
};

export default Home;
