import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { toast } from "sonner";
import { setSEO } from "@/lib/seo";
import useAuthRoles from "@/hooks/useAuthRoles";
import useUserRoles from "@/hooks/useUserRoles";
import useIsVendor from "@/hooks/useIsVendor";
import useIsRider from "@/hooks/useIsRider";
import { useProductionLogging } from "@/hooks/useProductionLogging";
import { SEOHead } from "@/components/seo/SEOHead";
import Hero from "./index/Hero";
import Explore from "./index/Explore";
import FeaturedListings from "./index/FeaturedListings";
import TrustSection from "./index/TrustSection";
import Testimonials from "./index/Testimonials";
import Categories from "./index/Categories";

const Index = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isSuperadmin } = useAuthRoles();
  const { roles, loading: userRolesLoading } = useUserRoles();
  const { isVendor, loading: vendorLoading } = useIsVendor();
  const { isRider, loading: riderLoading } = useIsRider();
  const { info } = useProductionLogging();
  
  useEffect(() => {
    setSEO(
      "CoopMarket — Community Marketplace",
      "Buy, sell, and deliver in a community-powered marketplace for products, services, time and learning."
    );
    info("Landing v2: Index mounted at", 'page', { location: window.location.href });
  }, []);

  // Smart redirection for existing users
  useEffect(() => {
    if (!user || userRolesLoading || vendorLoading || riderLoading) return;

    // Don't redirect if user is already on a specific page (e.g., came from direct link)
    if (window.location.pathname !== '/') return;

    // Priority order: Superadmin > Admin > Vendor > Rider > Buyer (stay on landing)
    if (isSuperadmin) {
      info("Redirecting superadmin to dashboard", 'navigation', { userId: user.id });
      navigate('/superadmin/dashboard');
      return;
    }

    if (isAdmin) {
      info("Redirecting admin to dashboard", 'navigation', { userId: user.id });
      navigate('/admin/dashboard');
      return;
    }

    if (isVendor) {
      info("Redirecting vendor to dashboard", 'navigation', { userId: user.id });
      navigate('/vendor/dashboard');
      return;
    }

    if (isRider) {
      info("Redirecting rider to dashboard", 'navigation', { userId: user.id });
      navigate('/rider/dashboard');
      return;
    }

    // If user has any community roles but none of the above, they can stay on landing page
    // This covers buyers and other community members
    
  }, [user, isSuperadmin, isAdmin, isVendor, isRider, userRolesLoading, vendorLoading, riderLoading, navigate, info]);

  const handleGetStarted = () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // If user is already a vendor, go to vendor dashboard
    if (isVendor) {
      navigate('/vendor/dashboard');
      return;
    }

    // If user is already a rider, go to rider dashboard  
    if (isRider) {
      navigate('/rider/dashboard');
      return;
    }

    // Otherwise, go to getting started
    navigate('/getting-started');
  };

  const content = (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "CoopMarket",
            url: window.location.origin,
            potentialAction: {
              "@type": "SearchAction",
              target: `${window.location.origin}/catalog?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      <Hero onGetStarted={handleGetStarted} />
      <FeaturedListings />
      <Explore />
      <Categories onGetStarted={handleGetStarted} />
      <TrustSection />
      <Testimonials />
    </main>
  );

  return (
    <>
      <SEOHead 
        title="CoopMarket - Community-Driven Marketplace"
        description="Buy, sell, and deliver in a community-powered marketplace for products, services, time and learning."
        keywords={["marketplace", "community", "local vendors", "cooperative", "e-commerce", "local shopping"]}
        schema={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "CoopMarket",
          url: window.location.origin,
          potentialAction: {
            "@type": "SearchAction",
            target: `${window.location.origin}/catalog?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          }
        }}
      />
      <PageLayout variant="full" className="flex-1">
        {content}
      </PageLayout>
    </>
  );
};

export default Index;