const SiteFooter = () => {
  return (
    <footer className="border-t py-8">
      <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} CoopMarket — Community-Powered Marketplace</p>
        <div className="flex items-center gap-6 text-sm">
          <a href="#" className="text-muted-foreground hover:text-foreground">Privacy</a>
          <a href="#" className="text-muted-foreground hover:text-foreground">Terms</a>
          <a href="#" className="text-muted-foreground hover:text-foreground">Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
