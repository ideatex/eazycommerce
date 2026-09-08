import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { initialOrganizations, initialProductOffers } from "@/lib/b2b2c/mockVanigamData";
import { mockProducts } from "@/data/mockProducts";
import ProductCard from "@/components/Common/ProductCard";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { TrustFeaturesBar } from "@/components/ui/TrustFeaturesBar";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = initialOrganizations.find((o) => o.slug === slug);

  if (!store) {
    return {
      title: "Store Not Found | VANIGAM",
    };
  }

  return {
    title: `${store.name} | Verified Storefront`,
    description: store.description,
  };
}

export default async function StorePage({ params }: PageProps) {
  const { slug } = await params;
  const store = initialOrganizations.find((o) => o.slug === slug);

  if (!store) {
    notFound();
  }

  // Get active offers for this store
  const storeOffers = initialProductOffers.filter((o) => o.organizationId === store.id);

  // Match products available from this store
  const storeProducts = mockProducts.filter((p) => {
    // If offer exists or general catalog
    return storeOffers.some((o) => o.productId === p.id) || true;
  });

  const badgeType =
    store.organizationType === "MANUFACTURER"
      ? "OFFICIAL_STORE"
      : store.organizationType === "DISTRIBUTOR"
      ? "AUTHORIZED_DISTRIBUTOR"
      : "VERIFIED_SELLER";

  return (
    <div className="pb-24 pt-8 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        {/* Store Header Banner */}
        <div className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-10 shadow-xs mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-gray-2">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gray-2 border border-gray-3 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                <Image
                  src={store.logo || "/images/sellers/sellers-01.png"}
                  alt={store.name}
                  width={68}
                  height={68}
                  className="object-contain"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-dark">
                    {store.name}
                  </h1>
                  <VerifiedBadge type={badgeType} size="md" />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <span>📍 {store.city}, {store.state}</span>
                  <span>•</span>
                  <span>Partner Tier: <strong className="text-dark">{store.organizationType}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-600 font-bold">★ 4.9 (500+ Verified Orders)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="/shop-with-sidebar"
                className="py-2.5 px-5 bg-gray-2 text-dark font-bold text-xs rounded-xl hover:bg-gray-3 transition-colors text-center w-full sm:w-auto"
              >
                All Marketplace Catalog
              </Link>
            </div>
          </div>

          <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-gray-600">
            <div>
              <span className="font-bold text-dark block mb-1">About the Partner</span>
              <p className="leading-relaxed text-gray-500">{store.description}</p>
            </div>
            <div>
              <span className="font-bold text-dark block mb-1">Fulfillment & Shipping</span>
              <p className="leading-relaxed text-gray-500">
                Direct dispatch from {store.city} facility. Packages are tracked and protected under the platform buyer guarantee.
              </p>
            </div>
            <div>
              <span className="font-bold text-dark block mb-1">Return Policy</span>
              <p className="leading-relaxed text-gray-500">
                Accepts 30-day returns for defective or unopened merchandise. Submit return claims directly via your Customer Account.
              </p>
            </div>
          </div>
        </div>

        {/* Store Catalog */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-dark">
                Products Available from {store.name}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Showing {storeProducts.length} verified listings
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {storeProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                sellerName={store.name}
              />
            ))}
          </div>
        </div>

        {/* Trust Features Bar */}
        <TrustFeaturesBar />
      </div>
    </div>
  );
}
