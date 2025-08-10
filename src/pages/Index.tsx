import { useEffect } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import AppTopbar from "@/components/layout/AppTopbar";
import AppSidebar from "@/components/layout/AppSidebar";
import * as Sidebar from "@/components/ui/sidebar";
import { toast } from "sonner";
import { setSEO } from "@/lib/seo";
import useAuthRoles from "@/hooks/useAuthRoles";
import Hero from "./index/Hero";
import Explore from "./index/Explore";
import FeaturedListings from "./index/FeaturedListings";
import TrustSection from "./index/TrustSection";
import Testimonials from "./index/Testimonials";
import Categories from "./index/Categories";

const Index = () => {
  const { user } = useAuthRoles();
  
  useEffect(() => {
    setSEO(
      "CoopMarket — Community Marketplace",
      "Buy, sell, and deliver in a community-powered marketplace for products, services, time and learning."
    );
    console.log("Landing v2: Index mounted at", window.location.href);
  }, []);

  const handleGetStarted = () => {
    toast("To enable accounts and roles, connect Supabase (top-right green button).", {
      description: "We'll wire up Superadmin, Vendor, Delivery & Buyer once connected.",
    });
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

  if (user) {
    // Logged in: use sidebar layout
    return (
      <Sidebar.SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <Sidebar.SidebarInset>
            <AppTopbar />
            {content}
            <SiteFooter />
          </Sidebar.SidebarInset>
        </div>
      </Sidebar.SidebarProvider>
    );
  }

  // Not logged in: use standalone header
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {content}
      <SiteFooter />
    </div>
  );
};

export default Index;