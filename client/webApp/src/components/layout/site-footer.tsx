import { Link } from "react-router-dom";
import logo from "../../../public/logo.png";

import { Button } from "@/components/ui/button";
import { NAV_FOOTER } from "@/components/layout/nav-items";

export function SiteFooter() {
  return (
    <footer className="bg-surface-soft mt-auto border-t">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="size-9" />
              <span className="font-display text-lg leading-none font-medium">
                Tenementary
              </span>
            </Link>
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
              Search homes for rent and sale with real area insights, commute
              times and drawings on the map — not just a list of pins.
            </p>
          </div>

          {NAV_FOOTER.map((column) => (
            <div key={column.title} className="space-y-3">
              <p className="text-[11px] font-medium tracking-wider uppercase">
                {column.title}
              </p>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-muted-foreground hover:text-primary text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-muted-foreground mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} Tenementary. All rights reserved.</p>
          <p className="text-center sm:text-right">
            Listing data is served by the Tenementary API. Map data ©{" "}
            OpenStreetMap contributors.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function FooterCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="bg-primary text-primary-foreground relative overflow-hidden rounded-3xl px-8 py-14 text-center">
        <div className="grid-lines absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-2xl space-y-5">
          <h2 className="font-display text-3xl leading-tight font-medium text-balance">
            Save your search and let the listings come to you
          </h2>
          <p className="text-primary-foreground/80 text-[0.98rem] leading-relaxed">
            Shortlist what you like, set an alert frequency, and pick your
            search back up on any device.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Create a free account</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
            >
              <Link to="/search">Browse listings</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
