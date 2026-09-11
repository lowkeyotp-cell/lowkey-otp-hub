import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin-dashboard/",
        "/admin-login/",
        "/admin-orders/",
        "/admin-finance/",
        "/admin-market/",
        "/admin-users/",
        "/admin-smspool/",
        "/api/",
      ],
    },
    sitemap: "https://lowkey-otp-hub.vercel.app/sitemap.xml",
  };
}
