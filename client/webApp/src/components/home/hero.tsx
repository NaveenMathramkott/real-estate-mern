import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";

import { PropertyCover } from "@/components/property/property-cover";
import { HeroSearch } from "@/components/search/hero-search";
import { Button } from "@/components/ui/button";
import { useQuery } from "@/hooks/use-query";
import { propertyApi } from "@/lib/api";
import {
  bedsLabel,
  formatCompact,
  formatListingPrice,
  formatSize,
} from "@/lib/format";
import type { Property } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Tracks the reduced-motion preference so the counter can stay honest. */
function usePrefersReducedMotion() {
  const [reduce, setReduce] = React.useState(
    () =>
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );

  React.useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    const onChange = () => setReduce(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduce;
}

/**
 * Counts from zero to `value` whenever the value changes.
 *
 * Deliberately not gated on an IntersectionObserver: the first render carries
 * `0` while the query is in flight, and an observer that fired during that
 * window would latch at zero and never animate the real figure once it
 * arrived. The hero stats sit above the fold, so there is nothing to gain by
 * waiting for visibility.
 */
function CountUp({
  value,
  format,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const reduce = usePrefersReducedMotion();
  const [display, setDisplay] = React.useState(0);

  // Nothing to animate, so the final number is derived rather than stored.
  const settle = reduce || value <= 0;
  const shown = settle ? value : display;

  React.useEffect(() => {
    if (settle) return;

    const duration = 1100;
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      // Ease-out cubic, so it settles rather than stops dead.
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    // Safety net for a throttled or skipped animation frame loop.
    const done = window.setTimeout(() => setDisplay(value), duration + 400);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(done);
    };
  }, [value, settle]);

  return (
    <span className={cn("tabular", className)}>
      {format ? format(shown) : shown}
    </span>
  );
}

function StatStrip({ total }: { total: number }) {
  const stats = [
    {
      value: total,
      label: "Live listings",
      format: (n: number) => formatCompact(n),
    },
    {
      value: 20,
      label: "Minute commute search",
      format: (n: number) => `${n} min`,
    },
    { value: 5, label: "Roles on one platform", format: (n: number) => `${n}` },
    { value: 0, label: "Lead-capture forms", format: () => "None" },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1">
          <dd className="font-display order-1 text-2xl leading-none font-medium sm:text-[1.7rem]">
            <CountUp value={stat.value} format={stat.format} />
          </dd>
          <dt className="text-muted-foreground order-2 text-[11px] leading-snug">
            {stat.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}

/** Miniature of the draw-on-map interaction, so the collage shows all three. */
function DrawCard({ className, delay }: { className?: string; delay: string }) {
  return (
    <div
      style={{ animationDelay: delay }}
      className={cn(
        "animate-in-up rounded-2xl border border-white/60 bg-card/85 p-3 shadow-[0_18px_50px_-24px_rgb(0_0_0/0.35)] backdrop-blur-xl lg:animate-[float_7s_ease-in-out_infinite]",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-primary/6">
        <div className="grid-lines absolute inset-0 opacity-60" />
        <svg
          viewBox="0 0 160 100"
          className="absolute inset-0 size-full text-primary"
          fill="none"
          aria-hidden
        >
          <path
            d="M30 70 L64 26 L104 44 L132 22 L132 78 L30 78 Z"
            fill="currentColor"
            fillOpacity="0.12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="64" cy="26" r="3.5" fill="currentColor" />
          <circle cx="132" cy="22" r="3.5" fill="currentColor" />
        </svg>
        <span className="bg-background/90 absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-medium">
          3 points · closed automatically
        </span>
      </div>
      <div className="px-1 pt-3">
        <p className="font-display text-lg leading-none font-medium">
          Draw an area
        </p>
        <p className="text-muted-foreground mt-1.5 text-xs">
          Point anywhere on the map
        </p>
      </div>
    </div>
  );
}

/**
 * A listing card that floats over the hero. Uses a real listing when one is
 * available so the collage reflects live inventory rather than a mock-up.
 */
function FloatingCard({
  property,
  className,
  delay,
}: {
  property?: Property;
  className?: string;
  delay: string;
}) {
  return (
    <div
      style={{ animationDelay: delay }}
      className={cn(
        "animate-in-up bg-card/85 rounded-2xl border border-white/60 p-3 shadow-[0_18px_50px_-24px_rgb(0_0_0/0.35)] backdrop-blur-xl",
        "lg:animate-[float_7s_ease-in-out_infinite]",
        className,
      )}
    >
      <PropertyCover
        property={property}
        alt={property?.title}
        iconSize="size-7"
        resolve={false}
        className="aspect-[16/10] rounded-xl"
      />
      <div className="px-1 pt-3">
        <p className="font-display text-lg leading-none font-medium">
          {formatListingPrice(
            property?.price,
            property?.currency,
            property?.purpose ?? "rent",
          )}
        </p>
        <p className="text-muted-foreground mt-1.5 truncate text-xs">
          {[
            property?.title,
            bedsLabel(property?.beds),
            formatSize(property?.size),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {property?.address && (
          <p className="text-muted-foreground/80 mt-1 truncate text-[11px]">
            {property.address}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * The hero leans on the pointer for a shallow parallax. Disabled for touch and
 * for anyone who has asked for reduced motion.
 */
function usePointerParallax() {
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced || !window.matchMedia?.("(pointer: fine)").matches) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setOffset({
          x: (event.clientX / window.innerWidth - 0.5) * 2,
          y: (event.clientY / window.innerHeight - 0.5) * 2,
        });
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return offset;
}

export function Hero() {
  const { data } = useQuery("get|/properties|hero=1|limit=6", () =>
    propertyApi.search({ limit: 6 }),
  );

  const listings = data?.properties ?? [];
  const total = data?.total ?? 0;
  const parallax = usePointerParallax();

  return (
    <section className="relative isolate overflow-hidden">
      {/* Backdrop: warm wash over a fine dot grid, plus two soft colour blooms. */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/6 via-background to-background" />
        <div className="grid-dots absolute inset-0 opacity-70" />
        <div className="animate-pulse bg-primary/12 absolute -top-32 -right-24 size-[34rem] rounded-full blur-3xl" />
        <div className="bg-gold/10 absolute top-1/3 -left-40 size-[26rem] rounded-full blur-3xl" />
        <div className="from-background absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-12 pb-12 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* ------------------------------------------------- copy + search */}
          <div className="animate-in-up space-y-7">
            <span className="border-border bg-card/70 inline-flex items-center gap-2 rounded-full border py-1.5 pr-4 pl-2 text-xs font-medium shadow-xs backdrop-blur">
              <span className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full">
                <SparklesIcon className="size-3" />
              </span>
              Area insights · commute search · draw on the map
            </span>

            <h1 className="font-display text-[2.6rem] leading-[1.05] font-medium tracking-[-0.02em] text-balance sm:text-6xl lg:text-[4.1rem]">
              Find the place that{" "}
              <span className="relative inline-block">
                <span className="bg-primary/10 relative px-1.5 italic">
                  actually
                </span>
              </span>{" "}
              fits your life.
            </h1>

            <p className="text-muted-foreground max-w-xl text-lg leading-relaxed text-pretty">
              Rent or buy, filtered the way you actually think — by
              neighbourhood, by how long the commute really takes, or by drawing
              the area you want straight onto the map.
            </p>

            <HeroSearch />

            <div className="pt-2">
              <StatStrip total={total} />
            </div>
          </div>

          {/* ------------------------------------------------ live collage */}
          <div
            className="relative hidden lg:block"
            style={{
              transform: `translate3d(${parallax.x * -10}px, ${
                parallax.y * -6
              }px, 0)`,
              transition: "transform 400ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            aria-hidden
          >
            <div className="bg-primary/8 absolute inset-10 rounded-full blur-3xl" />
            {/* Two offset columns rather than one tall stack — the composition
                stays roughly as tall as the copy beside it, so the hero does
                not stretch to fit the decoration. */}
            <div className="grid grid-cols-2 items-start gap-4">
              <div className="space-y-4 pt-10">
                <FloatingCard
                  property={listings[0]}
                  delay="0ms"
                  className="-rotate-2"
                />
                <DrawCard delay="900ms" className="rotate-1" />
              </div>
              <div className="space-y-4">
                <FloatingCard
                  property={listings[1]}
                  delay="500ms"
                  className="rotate-2"
                />
                <FloatingCard
                  property={listings[2]}
                  delay="1300ms"
                  className="-rotate-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Compact strip of the newest listings, scrolling continuously. */
export function ListingMarquee() {
  const { data } = useQuery("get|/properties|marquee=1|limit=12", () =>
    propertyApi.search({ limit: 12 }),
  );
  const listings = data?.properties ?? [];
  if (listings.length === 0) return null;

  // Duplicated so the -50% translation loops seamlessly.
  const loop = [...listings, ...listings];

  return (
    <div className="border-border bg-surface-soft relative overflow-hidden border-y">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6 lg:px-8">
        <span className="text-muted-foreground hidden shrink-0 text-[11px] font-medium tracking-[0.16em] uppercase sm:block">
          Just listed
        </span>
        <div className="group relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
          <div className="animate-marquee flex w-max items-center gap-6 group-hover:[animation-play-state:paused]">
            {loop.map((property, index) => (
              <Link
                key={`${property._id}-${index}`}
                to={`/properties/${property._id}`}
                className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-2 text-xs transition-colors"
              >
                <span className="text-foreground font-medium">
                  {formatListingPrice(
                    property.price,
                    property.currency,
                    property.purpose,
                  )}
                </span>
                <span className="max-w-[14rem] truncate">{property.title}</span>
                <span className="hidden md:inline">
                  {property.address ? `· ${property.address}` : ""}
                </span>
              </Link>
            ))}
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link to="/search">
            View all
            <ArrowRightIcon />
          </Link>
        </Button>
      </div>
    </div>
  );
}
