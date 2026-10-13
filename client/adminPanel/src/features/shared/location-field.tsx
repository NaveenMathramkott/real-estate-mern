import "leaflet/dist/leaflet.css";
import {
  AlertTriangleIcon,
  LinkIcon,
  MousePointerClickIcon,
  Trash2Icon,
  Undo2Icon,
} from "lucide-react";
import * as React from "react";
import {
  MapContainer,
  Marker,
  Polygon,
  TileLayer,
  useMap,
} from "react-leaflet";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_CENTER,
  type LatLng,
  type Ring,
  closeRing,
  centroid,
  isValidRing,
  parseLocationInput,
  pointFromInputs,
  pointToRing,
  ringToPoint,
  swapRingOrder,
  toRing,
} from "@/lib/geo";
import { cn } from "@/lib/utils";

type LeafletPoint = [number, number];

/**
 * Leaflet has no exported "render a handler" component, so a zero-height child
 * subscribes to map clicks and reports them upward.
 */
function MapClickTarget({ onPick }: { onPick: (point: LatLng) => void }) {
  const map = useMap();
  React.useEffect(() => {
    const handle: (event: { latlng: { lat: number; lng: number } }) => void = (
      event,
    ) => {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    };
    map.on("click", handle);
    return () => {
      map.off("click", handle);
    };
  }, [map, onPick]);
  return null;
}

function Viewport({ point, ring }: { point?: LatLng; ring?: Ring }) {
  const map = useMap();
  const target = point ?? centroid(ring ?? []);

  const lat = target?.lat;
  const lng = target?.lng;

  React.useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
  }, [map, lat, lng]);

  return null;
}

export type MapPickerProps = {
  mode: "point" | "polygon";
  point?: LatLng;
  ring?: Ring;
  onPointChange: (point: LatLng) => void;
  onRingChange: (ring: Ring) => void;
  className?: string;
};

/**
 * Plot a listing position or trace an area boundary.
 *
 * Point mode drops a single marker. Polygon mode appends a vertex per click and
 * reports the ring back, which the parent serialises as GeoJSON. Rings are held
 * in `[lng, lat]` order everywhere, matching what the API stores — only the
 * Leaflet `positions` prop takes `[lat, lng]`.
 */
export function MapPicker({
  mode,
  point,
  ring,
  onPointChange,
  onRingChange,
  className,
}: MapPickerProps) {
  const ringPoints: LeafletPoint[] = toRing(ring ?? []).map(([lng, lat]) => [
    lat,
    lng,
  ]);

  const center = point ?? centroid(ring ?? []) ?? DEFAULT_CENTER;

  const pick = React.useCallback(
    (next: LatLng) => {
      if (mode === "point") onPointChange(next);
      else onRingChange([...toRing(ring ?? []), pointToRing(next)]);
    },
    [mode, onPointChange, onRingChange, ring],
  );

  return (
    <div
      className={cn("bg-muted/40 overflow-hidden rounded-lg border", className)}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        className="h-72 w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickTarget onPick={pick} />
        <Viewport point={point} ring={ring} />

        {mode === "point" && point && (
          <Marker position={[point.lat, point.lng]} />
        )}

        {mode === "polygon" && ringPoints.length > 1 && (
          <Polygon
            positions={closeRing(ringPoints)}
            pathOptions={{ color: "#2563eb" }}
          />
        )}
      </MapContainer>
    </div>
  );
}

export type LocationFieldProps = {
  mode: "point" | "polygon";
  label: string;
  hint?: string;
  point?: LatLng;
  ring?: Ring;
  onPointChange: (point: LatLng) => void;
  onRingChange: (ring: Ring) => void;
  disabled?: boolean;
};

/**
 * Coordinate entry through three interchangeable routes — the map, the numeric
 * inputs, or a pasted Google Maps link. All three write the same value, so a
 * pasted link and a clicked pin never disagree.
 */
export function LocationField({
  mode,
  label,
  hint,
  point,
  ring,
  onPointChange,
  onRingChange,
  disabled,
}: LocationFieldProps) {
  const [link, setLink] = React.useState("");
  const [notice, setNotice] = React.useState<string>();

  const activePoint = point ?? ringToPoint(ring);
  const latText = React.useRef<HTMLInputElement>(null);
  const lngText = React.useRef<HTMLInputElement>(null);

  // The boxes mirror the authoritative value, so a map click or a pasted link
  // always lands in them. Keying on the coordinates remounts them with the new
  // value, which avoids mirroring through state and an effect.
  const mirror = `${activePoint ? activePoint.lat.toFixed(6) : ""}:${
    activePoint ? activePoint.lng.toFixed(6) : ""
  }`;

  const applyPoint = React.useCallback(
    (next: LatLng) => {
      if (mode === "point") onPointChange(next);
      else onRingChange([pointToRing(next)]);
    },
    [mode, onPointChange, onRingChange],
  );

  const applyLink = () => {
    const parsed = parseLocationInput(link);
    if (!parsed) {
      setNotice("Paste a Google Maps link or a `latitude, longitude` pair.");
      return;
    }
    if (parsed.warning) {
      setNotice(parsed.warning);
      return;
    }
    if (parsed.point) {
      applyPoint(parsed.point);
      setNotice(undefined);
      setLink("");
    }
  };

  const commitInputs = () => {
    const next = pointFromInputs(
      latText.current?.value ?? "",
      lngText.current?.value ?? "",
    );
    if (!next) {
      setNotice("Latitude must be between -90 and 90, longitude -180 and 180.");
      return;
    }
    setNotice(undefined);
    applyPoint(next);
  };

  const ringLength = ring?.length ?? 0;
  const ringReady = mode === "polygon" && isValidRing(ring ?? []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {mode === "polygon" && (
          <span className="text-muted-foreground text-xs tabular-nums">
            {ringLength} point{ringLength === 1 ? "" : "s"}
            {ringLength > 0 ? (ringReady ? " · closed" : " · open") : ""}
          </span>
        )}
      </div>

      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}

      <MapPicker
        mode={mode}
        point={point}
        ring={ring}
        onPointChange={applyPoint}
        onRingChange={onRingChange}
      />

      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <MousePointerClickIcon className="size-3.5" />
        {mode === "point"
          ? "Click the map to drop the pin."
          : "Click the map to add each vertex of the boundary."}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Latitude</Label>
          <Input
            key={`lat:${mirror}`}
            ref={latText}
            inputMode="decimal"
            defaultValue={activePoint ? activePoint.lat.toFixed(6) : ""}
            disabled={disabled}
            onChange={() => setNotice(undefined)}
            onBlur={commitInputs}
            placeholder="28.6139"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Longitude</Label>
          <Input
            key={`lng:${mirror}`}
            ref={lngText}
            inputMode="decimal"
            defaultValue={activePoint ? activePoint.lng.toFixed(6) : ""}
            disabled={disabled}
            onChange={() => setNotice(undefined)}
            onBlur={commitInputs}
            placeholder="77.2090"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Paste a Google Maps link</Label>
        <div className="flex gap-2">
          <Input
            value={link}
            disabled={disabled}
            onChange={(event) => {
              setLink(event.target.value);
              setNotice(undefined);
            }}
            placeholder="https://www.google.com/maps/place/… or 28.6139, 77.2090"
          />
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || !link.trim()}
            onClick={applyLink}
          >
            <LinkIcon className="size-4" />
            Use
          </Button>
        </div>
      </div>

      {mode === "polygon" && ringLength > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onRingChange(swapRingOrder(ring ?? []))}
          >
            <AlertTriangleIcon className="size-3.5" />
            Swap lng/lat
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onRingChange((ring ?? []).slice(0, -1))}
          >
            <Undo2Icon className="size-3.5" />
            Undo point
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onRingChange([])}
          >
            <Trash2Icon className="size-3.5" />
            Clear
          </Button>
        </div>
      )}

      {notice && <Alert variant="warning">{notice}</Alert>}

      {mode === "polygon" && ringLength > 0 && !ringReady && (
        <Alert variant="destructive">
          A ring needs at least four points and must be closed. It is closed
          automatically when the area is saved.
        </Alert>
      )}
    </div>
  );
}
