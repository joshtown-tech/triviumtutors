import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://triviumtutors.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/request", "/integrity", "/privacy", "/terms"].map((p) => ({ url: `${SITE}${p}`, changeFrequency: "monthly", priority: p === "" ? 1 : 0.6 }));
}
