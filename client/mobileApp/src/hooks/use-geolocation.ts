import * as Location from "expo-location";
import * as React from "react";

export type GeolocationState = {
  coords: { lat: number; lng: number } | null;
  status: "idle" | "prompt" | "granted" | "denied";
  request: () => Promise<void>;
};

/**
 * Lazily-requested device location for the radius search. Nothing is requested
 * on mount — the visitor has to ask for it from the map, which keeps the
 * permission prompt contextual.
 */
export function useGeolocation(): GeolocationState {
  const [coords, setCoords] = React.useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [status, setStatus] =
    React.useState<GeolocationState["status"]>("idle");

  const request = React.useCallback(async () => {
    try {
      const { status: permission } =
        await Location.requestForegroundPermissionsAsync();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setStatus("granted");
    } catch {
      setStatus("denied");
    }
  }, []);

  return { coords, status, request };
}
