import {
  Building2Icon,
  FactoryIcon,
  HomeIcon,
  LandmarkIcon,
  TractorIcon,
  type LucideIcon,
} from "lucide-react";

import type { PropertyType } from "@/lib/types";

const ICONS: Record<PropertyType, LucideIcon> = {
  apartment: HomeIcon,
  villa: LandmarkIcon,
  plot: TractorIcon,
  commercial: FactoryIcon,
  farmhouse: Building2Icon,
};

export function PropertyTypeIcon({
  type,
  className,
}: {
  type?: string;
  className?: string;
}) {
  const Icon: LucideIcon =
    (type ? ICONS[type as PropertyType] : undefined) ?? HomeIcon;
  return <Icon className={className} />;
}
