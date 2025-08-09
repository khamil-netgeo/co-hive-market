// Small helper to set per-page SEO without extra deps
export const setSEO = (title: string, description: string) => {
  if (title) document.title = title;

  const ensureMeta = (name: string, content: string) => {
    let el = document.querySelector(`meta[name='${name}']`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.name = name;
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  if (description) ensureMeta("description", description);

  // Canonical link (basic SPA handling)
  let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = window.location.href;
};

export type SEOOptions = {
  title: string;
  description?: string;
  url?: string;
  image?: string;
  type?: "website" | "article" | "product" | "service";
  jsonLd?: Record<string, any> | null;
};

export const setSEOAdvanced = ({ title, description, url, image, type = "website", jsonLd }: SEOOptions) => {
  if (title) document.title = title;

  const ensureNameMeta = (name: string, content: string) => {
    let el = document.querySelector(`meta[name='${name}']`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.name = name;
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };
  const ensurePropMeta = (property: string, content: string) => {
    let el = document.querySelector(`meta[property='${property}']`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      (el as any).setAttribute("property", property);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  if (description) ensureNameMeta("description", description);

  const canonical = url || window.location.href;
  let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = canonical;

  // Open Graph
  ensurePropMeta("og:title", title);
  if (description) ensurePropMeta("og:description", description);
  ensurePropMeta("og:type", type);
  ensurePropMeta("og:url", canonical);
  if (image) ensurePropMeta("og:image", image);

  // Twitter
  ensureNameMeta("twitter:card", image ? "summary_large_image" : "summary");
  ensureNameMeta("twitter:title", title);
  if (description) ensureNameMeta("twitter:description", description);
  if (image) ensureNameMeta("twitter:image", image);

  // Structured data
  const scriptId = "structured-data";
  let existing = document.getElementById(scriptId);
  if (!existing) {
    const script = document.createElement("script") as HTMLScriptElement;
    script.type = "application/ld+json";
    script.id = scriptId;
    document.head.appendChild(script);
    existing = script;
  }
  (existing as HTMLScriptElement).text = jsonLd ? JSON.stringify(jsonLd) : "";
};
