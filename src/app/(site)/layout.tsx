import Footer from "../../components/Footer";
import ScrollToTop from "@/components/Common/ScrollToTop";
import PreLoader from "@/components/Common/PreLoader";
import { Toaster } from "react-hot-toast";
import Providers from "./Providers";
import NextTopLoader from "nextjs-toploader";
import MainHeader from "@/components/Header/MainHeader";
import { getHeaderSettings } from "@/get-api-data/header-setting";
import Breadcrumb from "@/components/Common/Breadcrumb";
import { getActiveTheme, getStorefrontCategories } from "@/lib/storefront";

// The storefront reflects admin changes immediately and must not need a database at build time.
export const dynamic = "force-dynamic";

/** Darkens a #rrggbb colour by a fraction (used for hover shades). */
function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 - amount))));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [headerSettingData, categories, theme] = await Promise.all([
    getHeaderSettings(),
    getStorefrontCategories().catch(() => []),
    getActiveTheme().catch(() => null),
  ]);

  // Theme values were validated as hex colours / rem|px lengths, so they are safe in a <style> block.
  const themeCss = theme
    ? `:root{--color-blue:${theme.accentColor};--color-blue-dark:${shade(theme.accentColor, 0.2)};--color-dark:${theme.primaryColor};--theme-radius:${theme.borderRadius};}`
    : "";

  return (
    <div className="min-h-screen flex flex-col" data-theme={theme?.presetName}>
      {themeCss && <style dangerouslySetInnerHTML={{ __html: themeCss }} />}
      <PreLoader />
      <Providers>
        <NextTopLoader
          color="#3C50E0"
          crawlSpeed={300}
          showSpinner={false}
          shadow="none"
        />
        <MainHeader
          headerData={headerSettingData}
          categories={categories.filter((c) => !c.parentId).map((c) => ({ name: c.name, slug: c.slug }))}
        />
        <Breadcrumb />
        <Toaster position="top-center" reverseOrder={false} />
        <main className="flex-1 w-full">
          {children}
        </main>
      </Providers>

      <ScrollToTop />
      <Footer />
    </div>
  );
}
