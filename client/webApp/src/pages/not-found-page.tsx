import { HomeIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center">
      <p className="font-display text-muted-foreground/30 text-7xl leading-none font-medium tabular">
        404
      </p>
      <h1 className="font-display text-2xl font-medium">
        We could not find that page
      </h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        The link may be out of date, or the listing may have been expired by its
        owner.
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <Link to="/">
            <HomeIcon />
            Back home
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/search">Search listings</Link>
        </Button>
      </div>
    </div>
  );
}
