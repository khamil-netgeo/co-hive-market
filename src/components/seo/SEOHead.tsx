import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  canonical?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  schema?: Record<string, any>;
}

export const SEOHead = ({ 
  title = "CoopMarket - Community-Driven Marketplace",
  description = "Join CoopMarket, the community-driven marketplace connecting local vendors, buyers, and service providers. Discover products, services, and build meaningful connections.",
  keywords = ["marketplace", "community", "local vendors", "cooperative", "e-commerce"],
  image = "/og-image.jpg",
  canonical,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  schema
}: SEOHeadProps) => {
  const location = useLocation();
  const currentUrl = `${window.location.origin}${location.pathname}`;
  const canonicalUrl = canonical || currentUrl;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords.join(', '));

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', canonicalUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'CoopMarket', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Article specific tags
    if (type === 'article') {
      if (publishedTime) updateMetaTag('article:published_time', publishedTime, true);
      if (modifiedTime) updateMetaTag('article:modified_time', modifiedTime, true);
      if (author) updateMetaTag('article:author', author, true);
    }

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    // Structured data
    if (schema) {
      let scriptTag = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schema);
    }

    // Cleanup function
    return () => {
      // Remove dynamic meta tags on unmount to prevent conflicts
      const dynamicTags = document.querySelectorAll('meta[data-dynamic="true"]');
      dynamicTags.forEach(tag => tag.remove());
    };
  }, [title, description, keywords, image, canonicalUrl, type, publishedTime, modifiedTime, author, schema]);

  return null; // This component doesn't render anything visible
};