import { BuildingIcon, MapIcon, UserIcon } from "lucide-react";
import * as React from "react";

import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useQuery } from "@/hooks/use-query";
import { areaApi, buildingApi, dashboardApi } from "@/lib/api";
import { formatShortDate } from "@/lib/format";
import type { AdminDashboard, ReviewTargetType, User } from "@/lib/types";
import { pickList } from "@/lib/safe";

const TYPES: { value: ReviewTargetType; label: string }[] = [
  { value: "building", label: "Building" },
  { value: "area", label: "Area" },
  { value: "agent", label: "Agent" },
];

export type ReviewTargetValue = {
  targetType: ReviewTargetType;
  targetId: string;
};

const ICONS: Record<ReviewTargetType, React.ReactNode> = {
  building: <BuildingIcon className="text-muted-foreground size-4" />,
  area: <MapIcon className="text-muted-foreground size-4" />,
  agent: <UserIcon className="text-muted-foreground size-4" />,
};

/**
 * Picks a review target by name rather than by Mongo id.
 *
 * The catalogue behind each type is fetched lazily and cached by the query
 * store, so switching types does not refetch what has already been loaded.
 */
export function ReviewTargetPicker({
  value,
  onChange,
}: {
  value: ReviewTargetValue;
  onChange: (next: ReviewTargetValue) => void;
}) {
  const target = useTargetOptions(value.targetType);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="text-sm font-medium">Target type</span>
          <Combobox
            options={TYPES.map((type) => ({
              value: type.value,
              label: type.label,
              icon: ICONS[type.value],
            }))}
            value={value.targetType}
            searchPlaceholder="Search types…"
            maxVisible={4}
            onChange={(next) =>
              // Ids are unique per collection, so switching type must clear the
              // selection rather than carry a stale building id into areas.
              onChange({ targetType: next as ReviewTargetType, targetId: "" })
            }
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium">
            {TYPES.find((type) => type.value === value.targetType)?.label}
          </span>
          <Combobox
            options={target.options}
            value={value.targetId}
            loading={target.loading}
            placeholder="Search by name…"
            searchPlaceholder={target.searchHint}
            emptyLabel={target.emptyLabel}
            onChange={(targetId) => onChange({ ...value, targetId })}
          />
        </div>
      </div>

      {value.targetId && (
        <p className="text-muted-foreground font-mono text-[11px]">
          id {value.targetId}
        </p>
      )}
    </div>
  );
}

type TargetOptions = {
  options: ComboboxOption[];
  loading: boolean;
  searchHint: string;
  emptyLabel: string;
};

function useTargetOptions(targetType: ReviewTargetType): TargetOptions {
  const buildings = useQuery<{
    buildings: { _id: string; name: string; developer?: string }[];
  }>(
    targetType === "building" ? "get|/buildings|all" : null,
    () => buildingApi.list({ limit: 100 }),
    { enabled: targetType === "building" },
  );

  const areas = useQuery<{
    areas: { _id: string; name: string; city: string }[];
  }>(
    targetType === "area" ? "get|/areas|all" : null,
    () => areaApi.list({ limit: 100 }),
    { enabled: targetType === "area" },
  );

  // Agents are users. There is no user-list endpoint in the API, so the admin
  // dashboard is the only source — and it exposes just a sample of them.
  const admins = useQuery<AdminDashboard>(
    targetType === "agent" ? "get|/dashboard/admin|" : null,
    dashboardApi.admin,
    { enabled: targetType === "agent" },
  );

  if (targetType === "building") {
    const list = pickList<{
      _id: string;
      name: string;
      developer?: string;
    }>(buildings.data, "buildings");

    return {
      options: list.map((building) => ({
        value: building._id,
        label: building.name,
        description: building.developer ?? "No developer on record",
        keywords: "building",
        icon: ICONS.building,
      })),
      loading: buildings.isLoading && !buildings.data,
      searchHint: "Search buildings…",
      emptyLabel: "No buildings on record",
    };
  }

  if (targetType === "area") {
    const list = pickList<{ _id: string; name: string; city: string }>(
      areas.data,
      "areas",
    );

    return {
      options: list.map((area) => ({
        value: area._id,
        label: area.name,
        description: area.city,
        keywords: `area ${area.city}`,
        icon: ICONS.area,
      })),
      loading: areas.isLoading && !areas.data,
      searchHint: "Search areas…",
      emptyLabel: "No areas on record",
    };
  }

  const users: User[] = [
    ...pickList<User>(admins.data, "recentUsers"),
    ...pickList<User>(admins.data, "verified", "users", "sample"),
    ...pickList<User>(admins.data, "unverified", "users", "sample"),
  ];
  const seen = new Set<string>();
  const agents = users.filter((user) => {
    if (user.role !== "agent" && user.role !== "landlord") return false;
    if (seen.has(user._id)) return false;
    seen.add(user._id);
    return true;
  });

  return {
    options: agents.map((user) => ({
      value: user._id,
      label: user.email,
      description: `${user.role} · joined ${formatShortDate(user.createdAt)}`,
      keywords: `agent landlord ${user.email} ${user.phone ?? ""}`,
      icon: ICONS.agent,
    })),
    loading: admins.isLoading && !admins.data,
    searchHint: "Search agents by email…",
    emptyLabel:
      "No agents exposed by the admin dashboard. The API has no user-list endpoint, so the picker is limited to the dashboard sample.",
  };
}
