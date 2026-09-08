import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { initialOrganizations } from "@/lib/b2b2c/mockVanigamData";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { TrustFeaturesBar } from "@/components/ui/TrustFeaturesBar";

export const metadata: Metadata = {
  title: "Verified Marketplace Stores & Brands | VANIGAM",
  description: "Browse certified and KYC-verified sellers, manufacturers, and authorized distributors on the VANIGAM marketplace.",
};

export default function StoresDirectoryPage() {
  const verifiedStores = initialOrganizations.filter((o) => o.organizationType !== "PLATFORM");

  return (
    <div className="pb-24 pt-8 bg-gray-1 min-h-screen">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        {/* Header */}
        <div className="bg-white rounded-3xl border border-gray-3 p-8 sm:p-12 shadow-xs mb-10">
          <div className="max-w-2xl">
            <span className="text-xs font-bold text-blue uppercase tracking-wider block mb-2">
              Marketplace Seller Directory
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-dark mb-3">
              Verified Stores & Authorized Brands
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              Every seller on our marketplace undergoes strict business identity and tax verification. Purchase directly from certified manufacturers and retail partners with guaranteed buyer protection.
            </p>
          </div>
        </div>

        {/* Store Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {verifiedStores.map((store) => {
            const badgeType =
              store.organizationType === "MANUFACTURER"
                ? "OFFICIAL_STORE"
                : store.organizationType === "DISTRIBUTOR"
                ? "AUTHORIZED_DISTRIBUTOR"
                : "VERIFIED_SELLER";

            return (
              <div
                key={store.id}
                className="bg-white rounded-3xl border border-gray-3 p-6 sm:p-8 flex flex-col justify-between hover:border-blue/40 hover:shadow-md transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-gray-2 border border-gray-3 p-2 flex items-center justify-center overflow-hidden">
                      <Image
                        src={store.logo || "/images/sellers/sellers-01.png"}
                        alt={store.name}
                        width={56}
                        height={56}
                        className="object-contain"
                      />
                    </div>
                    <VerifiedBadge type={badgeType} size="sm" />
                  </div>

                  <h2 className="text-lg font-bold text-dark group-hover:text-blue transition-colors mb-2">
                    <Link href={`/store/${store.slug}`}>{store.name}</Link>
                  </h2>

                  <p className="text-xs text-gray-500 line-clamp-3 mb-6 leading-relaxed">
                    {store.description}
                  </p>

                  <div className="space-y-2 py-3 border-t border-gray-2 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Location</span>
                      <span className="font-semibold text-dark">{store.city}, {store.state} ({store.country})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Partner Type</span>
                      <span className="font-semibold text-dark">{store.organizationType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dispatch Speed</span>
                      <span className="font-semibold text-emerald-600">24-48 Business Hours</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-2">
                  <Link
                    href={`/store/${store.slug}`}
                    className="w-full py-2.5 px-4 bg-gray-2 hover:bg-blue hover:text-white text-dark font-bold text-xs rounded-xl transition-all duration-150 flex items-center justify-center gap-1"
                  >
                    <span>Visit Store Catalog</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Buyer Protection Banner */}
        <TrustFeaturesBar />
      </div>
    </div>
  );
}
