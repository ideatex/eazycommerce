/** @type {import('next-sitemap').IConfig} */
const siteUrl =
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  // Private areas stay out of search results.
  exclude: ["/admin", "/admin/*", "/api/*", "/account", "/checkout", "/cart", "/orders", "/order-confirmation", "/signin", "/signup", "/wishlist", "/error", "/mail-success"],
  robotsTxtOptions: {
    policies: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/account", "/checkout", "/cart", "/orders"] }],
  },
};
