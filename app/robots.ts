import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/landing",
        "/download",
        "/rentals",
        "/buildings",
        "/services",
        "/advertisers",
        "/faqs",
        "/help",
        "/privacy-policy",
        "/terms-and-conditions",
        "/login",
        "/signup",
      ],
      disallow: [
        "/super-admin/",
        "/settings/",
        "/messages/",
        "/analytics/",
        "/helper/",
        "/users/",
        "/delete-account/",
        "/return-to-app/",
        "/sso-authorize/",
        "/verification/",
      ],
    },
    sitemap: "https://ishinadwelly.com/sitemap.xml",
  };
}
