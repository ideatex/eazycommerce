import "./css/style.css";
import { Metadata, Viewport } from "next";
import { getSeoSettings, getSiteName } from "@/get-api-data/seo-setting";
import { GoogleTagManager } from '@next/third-parties/google';
import { DM_Sans } from 'next/font/google'

const dm_sans = DM_Sans({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: "--font-body",
  subsets: ['latin'],
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#3C50E0",
};

export async function generateMetadata(): Promise<Metadata> {
  const seoSettings = await getSeoSettings();
  const site_name = await getSiteName();
  return {
    title: `${seoSettings?.siteTitle || "Home Page"} | ${site_name}`,
    description: seoSettings?.metadescription || "Vanigam Commerce is an online store for retail and wholesale buyers.",
    keywords: seoSettings?.metaKeywords || "e-commerce, online store, wholesale",
    openGraph: {
      images: seoSettings?.metaImage ? [seoSettings.metaImage] : [],
    },
    icons: {
      icon: seoSettings?.favicon || "/favicon.ico",
      shortcut: seoSettings?.favicon || "/favicon.ico",
      apple: seoSettings?.favicon || "/favicon.ico",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const seoSettings = await getSeoSettings();
  return (
    <html lang="en">
      <body suppressHydrationWarning={true} className={`${dm_sans.variable} min-h-screen flex flex-col antialiased`}>
        {children}
        {seoSettings?.gtmId && <GoogleTagManager gtmId={seoSettings.gtmId} />}
      </body>
    </html>
  );
}
