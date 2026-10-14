import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExpandIcon,
  ImagesIcon,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PropertyTypeIcon } from "@/features/property-type-icon";
import { bedsLabel } from "@/lib/format";
import type { PropertyMedia } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Deterministic placeholder so galleries still read as designed when empty. */
function placeholder(propertyId?: string) {
  const seed = (propertyId ?? "")
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  const hue = 150 + (seed % 90);
  return {
    backgroundImage: `linear-gradient(135deg, oklch(0.95 0.03 ${hue}) 0%, oklch(0.88 0.06 ${hue + 18}) 55%, oklch(0.82 0.07 ${hue + 30}) 100%)`,
  };
}

const MEDIA_TABS = ["image", "video", "floorplan", "tour"] as const;

export function PropertyGallery({
  media,
  title,
  propertyId,
  propertyType,
}: {
  media: PropertyMedia[];
  title: string;
  propertyId?: string;
  propertyType?: string;
}) {
  const [tab, setTab] = React.useState<(typeof MEDIA_TABS)[number]>("image");
  const [lightbox, setLightbox] = React.useState(false);

  const visible = React.useMemo(
    () =>
      media
        .filter((item) => item.type === tab)
        .sort((a, b) => a.order - b.order),
    [media, tab],
  );
  const counts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const item of media) {
      map.set(item.type, (map.get(item.type) ?? 0) + 1);
    }
    return map;
  }, [media]);

  const available = MEDIA_TABS.filter((type) => (counts.get(type) ?? 0) > 0);
  // The cursor is reset as soon as the tab changes, during render rather than
  // in an effect so the gallery never flashes a stale index.
  const [cursor, setCursor] = React.useState({ tab, index: 0 });
  const index = cursor.tab === tab ? cursor.index : 0;
  const setIndex = (next: React.SetStateAction<number>) =>
    setCursor((current) => ({
      tab,
      index:
        typeof next === "function"
          ? next(current.tab === tab ? current.index : 0)
          : next,
    }));

  const step = (delta: number) =>
    setIndex((current) => (current + delta + visible.length) % visible.length);

  const hero = visible[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border bg-muted">
        {hero ? (
          <img src={hero.url} alt={title} className="size-full object-cover" />
        ) : (
          <div
            className="grid-dots flex size-full items-center justify-center"
            style={placeholder(propertyId)}
          >
            <PropertyTypeIcon
              type={propertyType}
              className="text-foreground/20 size-14"
            />
          </div>
        )}

        {visible.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Previous image"
              className="bg-background/90 absolute top-1/2 left-3 -translate-y-1/2 backdrop-blur-sm"
              onClick={() => step(-1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Next image"
              className="bg-background/90 absolute top-1/2 right-3 -translate-y-1/2 backdrop-blur-sm"
              onClick={() => step(1)}
            >
              <ChevronRightIcon />
            </Button>
          </>
        )}

        <div className="absolute right-3 bottom-3 flex gap-2">
          <span className="bg-background/90 text-foreground rounded-full px-2.5 py-1 text-xs font-medium tabular backdrop-blur-sm">
            {index + 1} / {visible.length || 1}
          </span>
          <Dialog open={lightbox} onOpenChange={setLightbox}>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="bg-background/90 backdrop-blur-sm"
              >
                <ExpandIcon />
                View all
              </Button>
            </DialogTrigger>
            <DialogContent
              showCloseButton
              className="max-w-5xl border-0 bg-transparent p-0 shadow-none"
            >
              <DialogTitle className="sr-only">{title}</DialogTitle>
              <GalleryLightbox media={visible} title={title} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {available.length > 1 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
          {available.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTab(type)}
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-all",
                tab === type
                  ? "border-primary bg-primary/5 text-primary"
                  : "hover:border-primary/30 hover:bg-accent/50",
              )}
            >
              <ImagesIcon className="size-3.5" />
              {type}
              <span className="text-muted-foreground tabular">
                {counts.get(type)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryLightbox({
  media,
  title,
}: {
  media: PropertyMedia[];
  title: string;
}) {
  const [index, setIndex] = React.useState(0);
  const current = media[index];
  if (!current) return null;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-black/90">
        <img
          src={current.url}
          alt={title}
          className="max-h-[70vh] w-full object-contain"
        />
        <Button
          variant="secondary"
          size="icon"
          aria-label="Previous"
          className="absolute top-1/2 left-3 -translate-y-1/2"
          onClick={() => setIndex((i) => (i - 1 + media.length) % media.length)}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          aria-label="Next"
          className="absolute top-1/2 right-3 -translate-y-1/2"
          onClick={() => setIndex((i) => (i + 1) % media.length)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
      <div className="scrollbar-none flex gap-2 overflow-x-auto">
        {media.map((item, i) => (
          <button
            key={item._id}
            type="button"
            onClick={() => setIndex(i)}
            className={cn(
              "size-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition",
              i === index ? "border-primary" : "border-transparent opacity-60",
            )}
          >
            <img src={item.url} alt="" className="size-full object-cover" />
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-white/60">
        {index + 1} of {media.length}
      </p>
    </div>
  );
}

/** Compact spec strip: the numbers buyers scan first. */
export function PropertySpecStrip({
  beds,
  baths,
  size,
  floor,
  type,
}: {
  beds?: number;
  baths?: number;
  size?: number;
  floor?: string;
  type?: string;
}) {
  const items = [
    beds !== undefined ? bedsLabel(beds) : null,
    baths !== undefined ? `${baths} bath${baths === 1 ? "" : "s"}` : null,
    size ? `${size.toLocaleString("en-IN")} sq.ft` : null,
    floor ? `Floor ${floor}` : null,
    type ? type.replace("-", " ") : null,
  ].filter(Boolean) as string[];

  if (items.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      {items.map((item, index) => (
        <li key={item} className="flex items-center gap-3">
          {index > 0 && <span className="text-border">·</span>}
          <span className="capitalize">{item}</span>
        </li>
      ))}
    </ul>
  );
}
