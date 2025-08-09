import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Wrench, Clock3, GraduationCap } from "lucide-react";

interface CategoriesProps { onGetStarted: () => void }

const Categories = ({ onGetStarted }: CategoriesProps) => (
  <section id="categories" className="container py-12 md:py-16">
    <h2 className="text-3xl font-semibold">One platform — four ways to earn</h2>
    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="hover:shadow-elegant transition-shadow">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-xl"><ShoppingBag /> Product</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Physical or digital goods with local fulfillment or shipping.</CardContent>
      </Card>
      <Card className="hover:shadow-elegant transition-shadow">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-xl"><Wrench /> Service</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Bookable services from professionals and community members.</CardContent>
      </Card>
      <Card className="hover:shadow-elegant transition-shadow">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-xl"><Clock3 /> Time</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Time-based gigs and appointments — earn by the hour or slot.</CardContent>
      </Card>
      <Card className="hover:shadow-elegant transition-shadow">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-xl"><GraduationCap /> Learning</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Courses and events that bring people together beyond commerce.</CardContent>
      </Card>
    </div>

    <div className="mt-10">
      <Button variant="hero" size="lg" onClick={onGetStarted}>Start Your Community</Button>
    </div>
  </section>
);

export default Categories;
