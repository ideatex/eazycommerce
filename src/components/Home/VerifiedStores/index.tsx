import React from "react";
import Link from "next/link";
import Image from "next/image";
import { initialOrganizations } from "@/lib/b2b2c/mockVanigamData";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

export default function VerifiedStoresSpotlight() {
  const verifiedStores = initialOrganizations.filter((o) => o.organizationType !== "PLATFORM");

  return (
    <section className="py-12 bg-white border-y border-gray-2">
      <div className="w-full px-4 mx-auto max-w-7xl sm:px-8 xl:px-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-blue uppercase tracking-wider">
                Vetted & Authorized Partners
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                KYC Verified
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-dark">
              Shop by Verified Marketplace Store
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Direct-to-consumer storefronts backed by platform buyer protection and escrow guarantees.
            </p>
          </div>

          <Link
            href="/stores"
            className="text-xs font-bold text-blue hover:text-blue-dark flex items-center gap-1 transition-colors"
          >
            View All Stores & Brands →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                className="bg-gray-1 rounded-2xl border border-gray-3 p-5 flex flex-col justify-between hover:border-blue/40 hover:shadow-sm transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-3 p-1 flex items-center justify-center overflow-hidden shadow-2xs">
                      <Image
                        src={store.logo || "/images/sellers/sellers-01.png"}
                        alt={store.name}
                        width={44}
                        height={44}
                        className="object-contain"
                      />
                    </div>
                    <VerifiedBadge type={badgeType} size="sm" />
                  </div>

                  <h3 className="text-base font-bold text-dark group-hover:text-blue transition-colors mb-1">
                    <Link href={`/store/${store.slug}`}>{store.name}</Link>
                  </h3>

                  <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                    {store.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-2 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">
                    📍 {store.city}, {store.state}
                  </span>
                  <Link
                    href={`/store/${store.slug}`}
                    className="font-bold text-blue hover:underline"
                  >
                    Visit Store →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
