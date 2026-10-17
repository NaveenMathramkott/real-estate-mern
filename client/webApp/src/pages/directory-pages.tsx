import {
  ArrowRightIcon,
  Building2Icon,
  CalendarIcon,
  CheckCircle2Icon,
  UsersIcon,
} from "lucide-react";
import * as React from "react";
import { Link, useParams } from "react-router-dom";

import {
  Breadcrumbs,
  EmptyState,
  ErrorState,
  LoadingBlock,
  RatingStars,
} from "@/components/common";
import { PropertyResultsGrid } from "@/components/search/property-results";
import { PropertyMap } from "@/components/property/property-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/common";
import { useQuery } from "@/hooks/use-query";
import { agencyApi, buildingApi } from "@/lib/api";
import { AMENITY_ICONS } from "@/lib/constants";
import { formatRelative, initials, pluralise } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------- buildings */

export function BuildingsPage() {
  const [term, setTerm] = React.useState("");
  const [developer, setDeveloper] = React.useState("");
  const [page, setPage] = React.useState(1);

  const { data, isLoading, error, refetch } = useQuery(
    `get|/buildings|name=${term}|developer=${developer}|page=${page}`,
    () =>
      buildingApi.list({
        name: term || undefined,
        developer: developer || undefined,
        page,
        limit: 12,
      }),
  );

  const buildings = data?.buildings ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl leading-none font-medium tracking-tight">
        Buildings
      </h1>
      <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">
        Reviews attach to a building rather than a single listing, so the
        reputation travels with every home in the same place.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Input
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setPage(1);
          }}
          placeholder="Search by name"
          className="max-w-xs"
        />
        <Input
          value={developer}
          onChange={(event) => {
            setDeveloper(event.target.value);
            setPage(1);
          }}
          placeholder="Filter by developer"
          className="max-w-xs"
        />
      </div>

      <div className="mt-8">
        {isLoading && <LoadingBlock />}
        {error && <ErrorState message={error} onRetry={() => void refetch()} />}

        {!isLoading && !error && buildings.length === 0 && (
          <EmptyState
            icon={Building2Icon}
            title="No buildings match"
            description="Try a different name or clear the developer filter."
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {buildings.map((building) => (
            <Link
              key={building._id}
              to={`/buildings/${building._id}`}
              className="group bg-card lift-hover rounded-xl border p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display truncate text-lg font-medium">
                    {building.name}
                  </p>
                  {building.developer && (
                    <p className="text-muted-foreground text-xs">
                      by {building.developer}
                    </p>
                  )}
                </div>
                <ArrowRightIcon className="text-primary size-4 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </div>
              <div className="text-muted-foreground mt-3 flex flex-wrap gap-3 text-xs">
                {building.yearBuilt && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon className="size-3.5" />
                    {building.yearBuilt}
                  </span>
                )}
                {building.amenities && building.amenities.length > 0 && (
                  <span>{pluralise(building.amenities.length, "amenity")}</span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {(data?.pages ?? 1) > 1 && (
          <Pagination
            className="mt-8"
            page={page}
            pages={data!.pages}
            onPage={setPage}
          />
        )}
      </div>
    </div>
  );
}

export function BuildingDetailPage() {
  const { id = "" } = useParams();

  const { data, isLoading, error, refetch } = useQuery(
    id ? `get|/buildings/${id}` : null,
    () => buildingApi.detail(id),
    { enabled: Boolean(id) },
  );
  const { data: reviewsData } = useQuery(
    id ? `get|/buildings/${id}/reviews` : null,
    () => buildingApi.reviews(id),
    { enabled: Boolean(id) },
  );

  const building = data?.building;
  const properties = data?.properties ?? [];
  const distribution = reviewsData?.distribution ?? {};

  if (isLoading) return <LoadingBlock className="min-h-[50vh]" />;
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <ErrorState message={error} onRetry={() => void refetch()} />
      </div>
    );
  }
  if (!building) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          icon={Building2Icon}
          title="Building not found"
          action={
            <Button asChild>
              <Link to="/buildings">All buildings</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const coordinates = building.location?.coordinates;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Buildings", to: "/buildings" },
          { label: building.name },
        ]}
      />

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-display text-4xl leading-none font-medium tracking-tight">
            {building.name}
          </h1>
          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
            {building.developer && <span>by {building.developer}</span>}
            {building.yearBuilt && <span>Built {building.yearBuilt}</span>}
          </div>
        </div>
        {reviewsData && reviewsData.total > 0 && (
          <RatingStars
            value={reviewsData.avgRating}
            count={reviewsData.total}
            size="md"
          />
        )}
      </header>

      {(building.amenities?.length ?? 0) > 0 && (
        <section className="mt-6 flex flex-wrap gap-2">
          {building.amenities!.map((amenity) => (
            <Badge key={amenity} variant="muted" className="capitalize">
              {AMENITY_ICONS[amenity] ?? amenity}
            </Badge>
          ))}
        </section>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-8">
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-display text-2xl font-medium">
                Active listings
              </h2>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/search?q=${encodeURIComponent(building.name)}`}>
                  Search
                  <ArrowRightIcon />
                </Link>
              </Button>
            </div>
            {properties.length === 0 ? (
              <EmptyState
                icon={Building2Icon}
                title="No active listings right now"
                description="Nothing in this building is currently on the market."
              />
            ) : (
              <PropertyResultsGrid properties={properties} columns={2} />
            )}
          </section>

          {coordinates && (
            <section className="space-y-3">
              <h2 className="font-display text-2xl font-medium">Location</h2>
              <PropertyMap
                properties={[]}
                center={[coordinates[1], coordinates[0]]}
                className="h-80 overflow-hidden rounded-2xl border"
              />
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="gap-4 p-5">
            <h3 className="font-display text-lg font-medium">
              Rating breakdown
            </h3>
            {reviewsData && reviewsData.total > 0 ? (
              <ul className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = distribution[String(star)] ?? 0;
                  const percent = (count / reviewsData.total) * 100;
                  return (
                    <li key={star} className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground w-6 tabular">
                        {star} ★
                      </span>
                      <span className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                        <span
                          className="bg-gold block h-full rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                      <span className="text-muted-foreground w-8 text-right tabular">
                        {count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                No reviews yet. Be the first.
              </p>
            )}
          </Card>

          {(reviewsData?.reviews?.length ?? 0) > 0 && (
            <Card className="gap-4 p-5">
              <h3 className="font-display text-lg font-medium">
                Recent reviews
              </h3>
              <ul className="space-y-3">
                {reviewsData!.reviews.slice(0, 4).map((review) => (
                  <li
                    key={review._id}
                    className="space-y-1 border-b pb-3 last:border-0"
                  >
                    <RatingStars value={review.rating} />
                    {review.body && (
                      <p className="text-sm leading-relaxed">{review.body}</p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      {formatRelative(review.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- agencies */

export function AgenciesPage() {
  const [verifiedOnly, setVerifiedOnly] = React.useState(false);
  const [page, setPage] = React.useState(1);

  const { data, isLoading, error, refetch } = useQuery(
    `get|/agencies|verified=${verifiedOnly}|page=${page}`,
    () => agencyApi.list({ verified: verifiedOnly, page, limit: 12 }),
  );

  const agencies = data?.agencies ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl leading-none font-medium tracking-tight">
        Agencies
      </h1>
      <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">
        Verified agencies carry a licence number and a badge on every listing
        their members publish.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {(["all", "verified"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setVerifiedOnly(option === "verified");
              setPage(1);
            }}
            className={cn(
              "cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-all",
              (option === "verified") === verifiedOnly
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:border-primary/30 hover:bg-accent/50",
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {isLoading && <LoadingBlock />}
        {error && <ErrorState message={error} onRetry={() => void refetch()} />}

        {!isLoading && !error && agencies.length === 0 && (
          <EmptyState
            icon={UsersIcon}
            title="No agencies listed"
            description="Agencies are reference data maintained in the admin console."
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agencies.map((agency) => (
            <Link
              key={agency._id}
              to={`/agencies/${agency._id}`}
              className="group bg-card lift-hover flex items-center gap-4 rounded-xl border p-5"
            >
              <span className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl text-lg font-semibold">
                {agency.logo ? (
                  <img
                    src={agency.logo}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  initials(agency.name)
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display flex items-center gap-1.5 truncate font-medium">
                  {agency.name}
                  {agency.verified && (
                    <CheckCircle2Icon className="text-success size-3.5 shrink-0" />
                  )}
                </p>
                {agency.licenseNo && (
                  <p className="text-muted-foreground truncate text-xs">
                    Licence {agency.licenseNo}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {(data?.pages ?? 1) > 1 && (
          <Pagination
            className="mt-8"
            page={page}
            pages={data!.pages}
            onPage={setPage}
          />
        )}
      </div>
    </div>
  );
}

export function AgencyDetailPage() {
  const { id = "" } = useParams();

  const { data, isLoading, error, refetch } = useQuery(
    id ? `get|/agencies/${id}` : null,
    () => agencyApi.detail(id),
    { enabled: Boolean(id) },
  );

  const agency = data?.agency;
  const members = data?.members ?? [];

  if (isLoading) return <LoadingBlock className="min-h-[50vh]" />;
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <ErrorState message={error} onRetry={() => void refetch()} />
      </div>
    );
  }
  if (!agency) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          icon={UsersIcon}
          title="Agency not found"
          action={
            <Button asChild>
              <Link to="/agencies">All agencies</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[{ label: "Agencies", to: "/agencies" }, { label: agency.name }]}
      />

      <header className="mt-4 flex flex-wrap items-center gap-5">
        <span className="bg-muted text-muted-foreground flex size-20 items-center justify-center overflow-hidden rounded-2xl text-2xl font-semibold">
          {agency.logo ? (
            <img src={agency.logo} alt="" className="size-full object-cover" />
          ) : (
            initials(agency.name)
          )}
        </span>
        <div className="space-y-2">
          <h1 className="font-display flex items-center gap-2 text-4xl leading-none font-medium tracking-tight">
            {agency.name}
            {agency.verified && (
              <Badge variant="success" className="align-middle">
                <CheckCircle2Icon />
                Verified
              </Badge>
            )}
          </h1>
          {agency.licenseNo && (
            <p className="text-muted-foreground text-sm">
              Licence {agency.licenseNo}
            </p>
          )}
        </div>
      </header>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-2xl font-medium">Team</h2>
        {members.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No members linked"
            description="Members are linked through their profile's agency reference."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <Card
                key={member._id}
                className="flex-row items-center gap-3 p-4"
              >
                <span className="bg-accent text-primary flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    initials(member.name)
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {member.name ?? "Unnamed member"}
                  </p>
                  <p className="text-muted-foreground truncate font-mono text-xs">
                    {member.userId}
                  </p>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10 flex justify-end">
        <Button asChild>
          <Link to="/search">
            Browse all listings
            <ArrowRightIcon />
          </Link>
        </Button>
      </div>
    </div>
  );
}
