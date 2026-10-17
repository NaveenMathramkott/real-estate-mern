import {
  ArrowRightIcon,
  BadgeCheckIcon,
  Building2Icon,
  CompassIcon,
  HandshakeIcon,
  KeyRoundIcon,
  LayersIcon,
  MapIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState, LoadingBlock, SectionHeading } from "@/components/common";
import { Hero, ListingMarquee } from "@/components/home/hero";
import { PropertyResultsGrid } from "@/components/search/property-results";
import { FooterCta } from "@/components/layout/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@/hooks/use-query";
import { areaApi, propertyApi } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";

/* -------------------------------------------------------------- intents */

function IntentCards() {
  const cards = [
    {
      to: "/search?purpose=rent",
      eyebrow: "Renting",
      title: "A place to live, not just a listing",
      copy: "Filter by furnishing, bedrooms and move-in date, then message the landlord or agent directly.",
      icon: KeyRoundIcon,
      chips: ["1–5 BHK", "Furnishing", "Move-in date"],
    },
    {
      to: "/search?purpose=buy",
      eyebrow: "Buying",
      title: "Verified titles, visible price history",
      copy: "Every change to a listing price is recorded, so you can see exactly how a seller has moved it.",
      icon: Building2Icon,
      chips: ["Ownership checks", "Price history", "Plots"],
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-5 md:grid-cols-2">
        {cards.map((card) => (
          <Card
            key={card.to}
            className="group border-border/70 hover:border-primary/30 relative overflow-hidden p-7 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="bg-primary/5 absolute -top-20 -right-20 size-48 rounded-full blur-3xl" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-3">
                <span className="bg-accent text-primary flex size-11 items-center justify-center rounded-xl">
                  <card.icon className="size-5" />
                </span>
                <span className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                  {card.eyebrow}
                </span>
              </div>
              <h3 className="font-display text-2xl leading-snug font-medium text-balance">
                {card.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {card.copy}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {card.chips.map((chip) => (
                  <Badge key={chip} variant="muted">
                    {chip}
                  </Badge>
                ))}
              </div>
              <Button asChild variant="link" className="px-0">
                <Link to={card.to}>
                  Start browsing
                  <ArrowRightIcon />
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ featured */

function Featured() {
  const { data, isLoading } = useQuery(
    "get|/properties|featured=home|limit=6",
    () => propertyApi.search({ limit: 6 }),
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Live inventory"
        title="Fresh on the market"
        description="Straight from the database — price, size and location up front, with no lead-capture form in the way."
        action={
          <Button variant="outline" asChild>
            <Link to="/search">
              View all listings
              <ArrowRightIcon />
            </Link>
          </Button>
        }
      />

      <div className="mt-8">
        <PropertyResultsGrid
          properties={data?.properties ?? []}
          isLoading={isLoading}
          columns={3}
          emptyState={
            <EmptyState
              icon={SearchIcon}
              title="Nothing published yet"
              description="The moment an agent or landlord lists a property it appears here. You could be the first."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild>
                    <Link to="/register?role=agent">List a property</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/search">Open search</Link>
                  </Button>
                </div>
              }
            />
          }
        />
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- areas */

function Areas() {
  const { data, isLoading } = useQuery("get|/areas|home=1|limit=6", () =>
    areaApi.list({ limit: 6 }),
  );
  const areas = data?.areas ?? [];

  return (
    <section className="bg-surface-soft border-y">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Neighbourhoods"
          title="Start with the area, not the address"
          description="Every neighbourhood carries live insight, aggregated from the listings that intersect its boundary."
          action={
            <Button variant="outline" asChild>
              <Link to="/areas">
                All neighbourhoods
                <ArrowRightIcon />
              </Link>
            </Button>
          }
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-card h-32 animate-pulse rounded-xl border"
                />
              ))
            : areas.map((area) => <AreaCard key={area._id} area={area} />)}
        </div>

        {!isLoading && areas.length === 0 && (
          <LoadingBlock label="No neighbourhoods published yet." />
        )}
      </div>
    </section>
  );
}

function AreaCard({
  area,
}: {
  area: { _id: string; name: string; city: string };
}) {
  const { data: insights } = useQuery(
    `get|/areas/${area._id}/insights|page=tile`,
    () => areaApi.insights(area._id),
  );

  return (
    <Link
      to={`/areas/${area._id}`}
      className="bg-card lift-hover group relative overflow-hidden rounded-xl border p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display truncate text-lg font-medium">
            {area.name}
          </p>
          <p className="text-muted-foreground text-xs">{area.city}</p>
        </div>
        <CompassIcon className="text-primary size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {insights ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl leading-none font-medium tabular">
              {formatCurrency(insights.priceStats.avgPrice, undefined, true)}
            </span>
            <span className="text-muted-foreground text-xs">avg price</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="muted">{insights.total} listings</Badge>
            {insights.rating.count > 0 && (
              <Badge variant="gold">
                ★ {insights.rating.average.toFixed(1)}
              </Badge>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 h-12 animate-pulse rounded-lg bg-muted" />
      )}
    </Link>
  );
}

/* --------------------------------------------------------- how it works */

function HowItWorks() {
  const steps = [
    {
      icon: SearchIcon,
      title: "Search the way you think",
      copy: "Type a place, drop a pin, draw a boundary, or give it a 20-minute commute. All four feed the same result grid.",
    },
    {
      icon: LayersIcon,
      title: "Flip between list and map",
      copy: "Hovering a card highlights its price pin, and vice versa. Change the filters without losing your place.",
    },
    {
      icon: HandshakeIcon,
      title: "Shortlist, then talk",
      copy: "Save what you like, send an enquiry to the agent or owner, and keep the conversation in one thread.",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="How it works"
        title="Three steps, no forms"
        description="The parts of a property search that usually end up scattered across email threads, kept in one place."
        align="center"
      />
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="group relative space-y-4">
            {index < steps.length - 1 && (
              <span
                aria-hidden
                className="from-border absolute top-6 left-[3.25rem] hidden h-px w-[calc(100%-2rem)] bg-gradient-to-r to-transparent md:block"
              />
            )}
            <div className="flex items-center gap-4">
              <span className="bg-accent text-primary group-hover:bg-primary group-hover:text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300">
                <step.icon className="size-5" />
              </span>
              <span className="font-display text-muted-foreground/30 text-4xl leading-none font-medium tabular">
                0{index + 1}
              </span>
            </div>
            <h3 className="font-display text-xl font-medium">{step.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {step.copy}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------- role props */

function RoleProps() {
  const user = useAuthStore((s) => s.user);
  const isPublisher =
    user?.role === "agent" ||
    user?.role === "landlord" ||
    user?.role === "admin";

  const groups = isPublisher
    ? [
        {
          icon: LayersIcon,
          title: "Publish once, reach the right people",
          copy: "Photos, floorplans, video and virtual tours, all reorderable without re-uploading anything.",
          points: ["Rich media library", "Price history on every change"],
        },
        {
          icon: HandshakeIcon,
          title: "Work the lead pipeline",
          copy: "Every enquiry lands in one queue with a status you control, and the inquirer is notified on each move.",
          points: ["New → contacted → closed", "Dashboard for lead flow"],
        },
        {
          icon: TrendingUpIcon,
          title: "Know your market",
          copy: "Portfolio value, live versus rented stock, and average price per purpose — from your own listings.",
          points: ["Portfolio valuation", "Recent price changes"],
        },
      ]
    : [
        {
          icon: SparklesIcon,
          title: "A shortlist that survives the week",
          copy: "Favourites, saved searches and a running value of everything you are watching, synced to your account.",
          points: ["Value of your shortlist", "Alert frequency per search"],
        },
        {
          icon: Building2Icon,
          title: "The detail before you commit",
          copy: "Price history, area insight and building reviews, all on the listing itself.",
          points: ["Full price history", "Building & area reviews"],
        },
        {
          icon: MapIcon,
          title: "Talk to the right person",
          copy: "Enquire on the listing or open a thread and keep it with everyone else in one place.",
          points: ["Direct chat", "Enquiry tracking"],
        },
      ];

  return (
    <section className="bg-surface-soft border-t">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={
            isPublisher ? "For agents & landlords" : "For buyers & renters"
          }
          title={
            isPublisher
              ? "Your listings, your pipeline"
              : "More than a list of pins"
          }
          description={
            isPublisher
              ? "Everything you publish comes back as structured performance data you can act on."
              : "Structured, current information — the kind that normally lives in six different tabs."
          }
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.title} className="gap-4 p-6">
              <span className="bg-accent text-primary flex size-10 items-center justify-center rounded-xl">
                <group.icon className="size-4.5" />
              </span>
              <h3 className="font-display text-lg leading-snug font-medium">
                {group.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {group.copy}
              </p>
              <ul className="mt-auto space-y-2 pt-2">
                {group.points.map((point) => (
                  <li
                    key={point}
                    className="text-muted-foreground flex items-start gap-2 text-sm"
                  >
                    <BadgeCheckIcon className="text-primary mt-0.5 size-4 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- trust band */

function TrustBand() {
  const items = [
    { icon: ShieldCheckIcon, label: "Verified listings & users" },
    { icon: TrendingUpIcon, label: "Live market pricing" },
    { icon: CompassIcon, label: "Geo-accurate boundaries" },
    { icon: Building2Icon, label: "Building-level reviews" },
  ];

  return (
    <section className="border-t">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-10 sm:px-6 lg:px-8">
        {items.map((item) => (
          <span
            key={item.label}
            className="text-muted-foreground flex items-center gap-2 text-sm"
          >
            <item.icon className="text-primary size-4" />
            {item.label}
          </span>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <ListingMarquee />
      <IntentCards />
      <Featured />
      <Areas />
      <HowItWorks />
      <RoleProps />
      <TrustBand />
      <FooterCta />
    </>
  );
}
