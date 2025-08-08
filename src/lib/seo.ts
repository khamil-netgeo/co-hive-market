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
