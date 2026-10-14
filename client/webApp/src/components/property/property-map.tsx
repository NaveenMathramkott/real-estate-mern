import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import { formatListingPrice } from "@/lib/format";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "@/lib/constants";
import type { Property, PropertyMapBounds } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Leaflet needs a CDN icon fixup under bundlers — the default marker images are
 * resolved relative to CSS and silently 404 otherwise.
 */
function useDefaultIconFix() {
  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);
}

function pricePin(property: Property, isActive: boolean) {
  const label = formatListingPrice(
    property.price,
    property.currency,
    property.purpose,
  );
  return L.divIcon({
    className: "bg-transparent border-0",
    html: `<span class="pin ${isActive ? "pin-active" : ""}">${label}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/** Keeps the viewport in sync when a new result set arrives. */
function FitBounds({ bounds }: { bounds?: PropertyMapBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    map.fitBounds(
      [
        [bounds.south, bounds.west],
        [bounds.north, bounds.east],
      ],
      { padding: [48, 48], maxZoom: 15 },
    );
  }, [bounds, map]);
  return null;
}

/**
 * Pans the map when the centre genuinely changes.
 *
 * Two guards matter here: the key check skips the redundant pan that StrictMode
 * and the first paint both trigger, and the size check avoids Leaflet's
 * projection step entirely on a container that has not been laid out yet — it
 * throws `Invalid LatLng object: (NaN, NaN)` on a zero-sized map.
 */
function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  const last = useRef<string | null>(null);

  useEffect(() => {
    const [lat, lng] = center;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const key = `${lat},${lng}`;
    if (last.current === key) return;
    last.current = key;

    const size = map.getSize();
    if (size.x === 0 || size.y === 0) return;

    const zoom = map.getZoom();
    map.setView(
      [lat, lng],
      Number.isFinite(zoom) && zoom > 0 ? zoom : DEFAULT_ZOOM,
    );
  }, [center, map]);

  return null;
}

export type DrawMode = "none" | "draw";

/**
 * Draws the search area. The API rejects unclosed rings, so the first point is
 * appended automatically on close — this is the single most common 400 from
 * this endpoint, so it is handled here rather than at the call site.
 */
function DrawControl({
  mode,
  onComplete,
  activePolygon,
}: {
  mode: DrawMode;
  onComplete: (ring: [number, number][]) => void;
  activePolygon?: [number, number][];
}) {
  const map = useMapEvents({
    click(event) {
      if (mode !== "draw") return;
      const point: [number, number] = [event.latlng.lng, event.latlng.lat];
      onComplete([...(activePolygon ?? []), point]);
    },
  });
  useEffect(() => {
    const container = map.getContainer();
    container.style.cursor = mode === "draw" ? "crosshair" : "";
  }, [map, mode]);
  return null;
}

/** Search-here button: converts the current viewport into a radius search. */
function SearchHereButton({
  onSearch,
}: {
  onSearch: (bounds: PropertyMapBounds) => void;
}) {
  const map = useMap();
  return (
    <button
      type="button"
      onClick={() => {
        const bounds = map.getBounds();
        onSearch({
          south: bounds.getSouth(),
          west: bounds.getWest(),
          north: bounds.getNorth(),
          east: bounds.getEast(),
        });
      }}
      className="bg-background text-foreground absolute top-3 left-1/2 z-[500] -translate-x-1/2 cursor-pointer rounded-full border px-4 py-2 text-xs font-medium shadow-md transition hover:border-primary/40 hover:text-primary"
    >
      Search this area
    </button>
  );
}

export type PropertyMapProps = {
  properties: Property[];
  center?: [number, number];
  bounds?: PropertyMapBounds | null;
  activeId?: string | null;
  onMarkerClick?: (id: string) => void;
  onMarkerHover?: (id: string | null) => void;
  onBoundsChange?: (bounds: PropertyMapBounds) => void;
  drawMode?: DrawMode;
  polygon?: [number, number][];
  onPolygonChange?: (ring: [number, number][]) => void;
  radius?: { lat: number; lng: number; metres: number } | null;
  onSearchHere?: (bounds: PropertyMapBounds) => void;
  className?: string;
  showSearchHere?: boolean;
};

export function PropertyMap({
  properties,
  center = DEFAULT_CENTER,
  bounds,
  activeId,
  onMarkerClick,
  onMarkerHover,
  drawMode = "none",
  polygon,
  onPolygonChange,
  radius,
  onSearchHere,
  className,
  showSearchHere = false,
}: PropertyMapProps) {
  useDefaultIconFix();

  const markers = useMemo(
    () =>
      properties
        .map((property) => {
          const coordinates = property.location?.coordinates;
          if (!coordinates || coordinates.length < 2) return null;
          return { property, lat: coordinates[1], lng: coordinates[0] };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    [properties],
  );

  return (
    <div className={cn("relative isolate", className)}>
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        className="size-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds bounds={bounds} />
        <Recenter center={center} />
        <DrawControl
          mode={drawMode}
          activePolygon={polygon}
          onComplete={(ring) => onPolygonChange?.(ring)}
        />

        {showSearchHere && onSearchHere && (
          <SearchHereButton onSearch={onSearchHere} />
        )}

        {radius && (
          <Circle
            center={[radius.lat, radius.lng]}
            radius={radius.metres}
            pathOptions={{
              color: "var(--primary)",
              weight: 1.5,
              fillColor: "var(--primary)",
              fillOpacity: 0.08,
              dashArray: "6 6",
            }}
          />
        )}

        {polygon && polygon.length > 1 && (
          <Polygon
            positions={polygon.map(
              ([lng, lat]) => [lat, lng] as [number, number],
            )}
            pathOptions={{
              color: "var(--primary)",
              weight: 2,
              fillColor: "var(--primary)",
              fillOpacity: 0.1,
            }}
          />
        )}

        {markers.map(({ property, lat, lng }) => (
          <Marker
            key={property._id}
            position={[lat, lng]}
            icon={pricePin(property, property._id === activeId)}
            zIndexOffset={property._id === activeId ? 1000 : 0}
            eventHandlers={{
              click: () => onMarkerClick?.(property._id),
              mouseover: () => onMarkerHover?.(property._id),
              mouseout: () => onMarkerHover?.(null),
            }}
          >
            <Popup closeButton={false} minWidth={220}>
              <div className="p-3">
                <p className="font-display text-base leading-none font-medium tabular">
                  {formatListingPrice(
                    property.price,
                    property.currency,
                    property.purpose,
                  )}
                </p>
                <p className="mt-1.5 line-clamp-1 text-xs font-medium">
                  {property.title}
                </p>
                <p className="text-muted-foreground mt-0.5 line-clamp-1 text-[11px]">
                  {property.address}
                </p>
                <a
                  href={`/properties/${property._id}`}
                  className="text-primary mt-2 inline-block text-[11px] font-medium hover:underline"
                >
                  View details →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

/** Single-purpose map used on area and building detail pages. */
export function StaticMap({
  center,
  className,
  zoom = 14,
}: {
  center: [number, number];
  className?: string;
  zoom?: number;
}) {
  useDefaultIconFix();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden rounded-xl", className)}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="size-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center} />
      </MapContainer>
    </div>
  );
}
