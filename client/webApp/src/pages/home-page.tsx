import {
  ArrowRightIcon,
  BadgeCheckIcon,
  Building2Icon,
  ClockIcon,
  CompassIcon,
  HandshakeIcon,
  KeyRoundIcon,
  MapIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState, LoadingBlock, SectionHeading } from "@/components/common";
import { FooterCta } from "@/components/layout/site-footer";
import { HeroSearch } from "@/components/search/hero-search";
import { PropertyResultsGrid } from "@/components/search/property-results";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@/hooks/use-query";
import { areaApi, propertyApi } from "@/lib/api";
import { formatCurrency, formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

/** Four headline numbers, pulled from whatever data is already on screen. */
function HeroStats({ total }: { total: number }) {
  const stats = [
    { value: total ? formatCompact(total) : "—", label: "Active listings" },
    { value: "2dsphere", label: "Geo-accurate search" },
    { value: "20 min", label: "Commute radius" },
    { value: "5", label: "Roles, one platform" },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="space-y-1">
          <dt className="text-muted-foreground order-2 text-xs">
            {stat.label}
          </dt>
          <dd className="font-display order-1 text-2xl leading-none font-medium tabular">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Hero() {
  const { data, isLoading } = useQuery(
    "get|/properties|limit=1|featured",
    () => propertyApi.search({ limit: 1 }),
    { enabled: true },
  );
  const total = data?.total ?? 0;

  return (
    <section className="relative overflow-hidden">
      {/* Layered background: soft emerald wash over a dot grid. */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="from-primary/8 absolute inset-0 bg-gradient-to-b via-background to-background" />
        <div className="grid-dots absolute inset-0 opacity-60" />
        <div className="bg-primary/10 absolute -top-24 -right-24 size-[28rem] rounded-full blur-3xl" />
        <div className="bg-gold/8 absolute top-40 -left-32 size-96 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-16 pb-14 sm:px-6 sm:pt-24 lg:px-8 lg:pt-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-in-up space-y-7">
            <Badge variant="outline-solid" className="gap-1.5 py-1.5">
              <SparklesIcon className="text-primary size-3" />
              Area insights, commute search & draw-on-map
            </Badge>

            <h1 className="font-display text-4xl leading-[1.08] font-medium tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]">
              Find the place that actually fits your life.
            </h1>

            <p className="text-muted-foreground max-w-xl text-lg leading-relaxed text-pretty">
              Rent or buy, filtered the way you actually think — by
              neighbourhood, by how long the commute takes, or by drawing the
              area you want on the map.
            </p>

            <HeroSearch />

            <div className="pt-4">
              <HeroStats total={total} />
            </div>
          </div>

          {/* Visual: layered floating cards echoing a search result. */}
          <div className="relative hidden lg:block" aria-hidden>
            <div className="bg-primary/6 absolute inset-8 rounded-full blur-2xl" />
            <div className="relative space-y-4">
              <FloatCard
                className="ml-12 rotate-[-3deg]"
                title="2BHK · Connaught Place"
                meta="₹42,000/mo · 1,100 sq.ft"
                accent
              />
              <FloatCard
                className="mr-8 rotate-2"
                title="Villa · Whitefield"
                meta="12 min commute · 4 beds"
              />
              <FloatCard
                className="ml-16 -rotate-1"
                title="Studio · Indiranagar"
                meta="Drawn area · 6 matches"
              />
              <div className="bg-card animate-in-up ml-4 w-64 rounded-2xl border p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="bg-success/10 text-success flex size-8 items-center justify-center rounded-lg">
                    <ShieldCheckIcon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">Verified listing</p>
                    <p className="text-muted-foreground text-xs">
                      Owner identity checked
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border" />
      )}
    </section>
  );
}

function FloatCard({
  title,
  meta,
  accent,
  className,
}: {
  title: string;
  meta: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card lift-hover rounded-2xl border p-4 shadow-sm",
        accent && "border-primary/25",
        className,
      )}
    >
      <div className="bg-muted mb-3 flex aspect-[16/9] items-center justify-center rounded-xl">
        <Building2Icon className="text-foreground/20 size-8" />
      </div>
      <p className="font-display text-lg leading-none font-medium">{title}</p>
      <p className="text-muted-foreground mt-1.5 text-xs">{meta}</p>
    </div>
  );
}

function PurposeCards() {
  const cards = [
    {
      to: "/search?purpose=rent",
      title: "Looking to rent",
      copy: "Furnished and unfurnished homes, filter by landlord preferences, and message directly.",
      icon: KeyRoundIcon,
      chips: ["1–5 BHK", "Furnishing", "Move-in date"],
    },
    {
      to: "/search?purpose=buy",
      title: "Ready to buy",
      copy: "Apartments, villas and plots with verified ownership and a clear price history.",
      icon: Building2Icon,
      chips: ["Verified titles", "Price history", "Plots"],
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
            <div className="bg-primary/5 absolute -top-16 -right-16 size-40 rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative space-y-4">
              <span className="bg-accent text-primary flex size-11 items-center justify-center rounded-xl">
                <card.icon className="size-5" />
              </span>
              <h3 className="font-display text-2xl font-medium">
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

function FeaturedListings() {
  const { data, isLoading } = useQuery("get|/properties|featured=home", () =>
    propertyApi.search({ limit: 6 }),
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Fresh on the market"
        title="Listings worth a look"
        description="A rotating selection of active listings. Every one is shown with its price, size and location up front — no lead-capture forms."
        action={
          <Button variant="outline" asChild>
            <Link to="/search">
              View all
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
              title="No listings published yet"
              description="Once agents and landlords publish properties they will appear here. You can be the first."
              action={
                <div className="flex gap-2">
                  <Button asChild>
                    <Link to="/register?role=agent">List a property</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/search">Browse search</Link>
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

function AreasSection() {
  const { data, isLoading } = useQuery("get|/areas|home=1|limit=6", () =>
    areaApi.list({ limit: 6 }),
  );
  const areas = data?.areas ?? [];

  return (
    <section className="bg-surface-soft border-y py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Neighbourhoods"
          title="Start with the area, not the listing"
          description="Every area carries live market insight — average price, bedroom mix, what is for rent versus for sale, and how residents rate it."
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
          <LoadingBlock label="No areas published yet." />
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
    `get|/areas/${area._id}/insights`,
    () => areaApi.insights(area._id),
    { enabled: Boolean(area._id) },
  );

  return (
    <Link
      to={`/areas/${area._id}`}
      className="group bg-card lift-hover relative overflow-hidden rounded-xl border p-5"
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

function HowItWorks() {
  const steps = [
    {
      icon: SearchIcon,
      title: "Search the way you think",
      copy: "Type a place, drop a pin, draw a boundary, or give it a 20-minute commute. All four feed the same result grid.",
    },
    {
      icon: MapIcon,
      title: "Compare on the map",
      copy: "Switch between list and map at any point. Hovering a card highlights its pin, and vice versa.",
    },
    {
      icon: HandshakeIcon,
      title: "Shortlist and talk",
      copy: "Save what you like, then message the agent or landlord and send an enquiry in a click.",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="How it works"
        title="Three steps, no lead forms"
        align="center"
      />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="relative space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                <step.icon className="size-5" />
              </span>
              <span className="font-display text-muted-foreground/40 text-3xl font-medium tabular">
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

/** Copy adapts to whether the visitor is browsing or looking to publish. */
function RoleValueProps() {
  const user = useAuthStore((s) => s.user);
  const isPublisher =
    user?.role === "agent" ||
    user?.role === "landlord" ||
    user?.role === "admin";

  const groups = isPublisher
    ? [
        {
          title: "Publish once, reach the right people",
          copy: "Listings carry photos, floorplans, video and a virtual tour, all reorderable without a re-upload.",
          points: ["Rich media library", "Price history on every change"],
        },
        {
          title: "Work the lead pipeline",
          copy: "Every enquiry lands in one queue with a status you control, and the inquirer is notified on each move.",
          points: ["New → contacted → closed", "Dashboard for lead flow"],
        },
        {
          title: "Know your market",
          copy: "Portfolio value, live versus rented stock, and average price per purpose — all from your own listings.",
          points: ["Portfolio valuation", "Recent price changes"],
        },
      ]
    : [
        {
          title: "Shortlist that survives the week",
          copy: "Favourites, saved searches and a value summary of everything you are watching — synced to your account.",
          points: ["Value of your shortlist", "Alert frequency per search"],
        },
        {
          title: "Details before you commit",
          copy: "Price history, area insights, building reviews and building-level ratings, all on the listing page.",
          points: ["Full price history", "Building & area reviews"],
        },
        {
          title: "Talk to the right person",
          copy: "Send an enquiry to the assigned agent or owner, or open a chat thread and keep it in one place.",
          points: ["Direct chat", "Enquiry tracking"],
        },
      ];

  return (
    <section className="bg-surface-soft border-t py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
              : "The parts of a property search that usually happen over email, gathered in one place."
          }
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.title} className="gap-4 p-6">
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

function TrustBand() {
  const items = [
    { icon: ShieldCheckIcon, label: "Verified listings & users" },
    { icon: TrendingUpIcon, label: "Live market pricing" },
    { icon: ClockIcon, label: "Saved-search alerts" },
    { icon: CompassIcon, label: "Geo-accurate boundaries" },
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
      <PurposeCards />
      <FeaturedListings />
      <AreasSection />
      <HowItWorks />
      <RoleValueProps />
      <TrustBand />
      <FooterCta />
    </>
  );
}
