# Tenementary Admin Panel

Operations console for the Tenementary real-estate API. Every screen maps to a
documented endpoint in [`../serverApiDoc.md`](../serverApiDoc.md).

## Stack

| Concern      | Choice                                                        |
| ------------ | ------------------------------------------------------------- |
| Build        | Vite 8 + React 19 (React Compiler enabled)                    |
| Styling / UI | Tailwind CSS v4 + shadcn/ui primitives (Radix) + lucide icons |
| Charts       | Recharts                                                      |
| Server state | Axios + a shared response cache and query store               |
| Client state | Zustand (auth, UI, toasts)                                    |
| Routing      | React Router (lazy-loaded routes)                             |

## Getting started

```bash
cp .env.example .env      # point VITE_API_URL at your API
npm install
npm run dev               # http://localhost:5173
npm run build             # type-check + production build
npm run lint
```

The console talks to `VITE_API_URL` (default `http://localhost:4000/api/v1`).
Requests are sent with `withCredentials`, so the `httpOnly` cookie pair works,
and the access token is also attached as a bearer header for silent refresh.

## Screens

| Route             | Screen         | Endpoints covered                                                      |
| ----------------- | -------------- | ---------------------------------------------------------------------- |
| `/login`          | Login / OTP    | `/auth/login`, `/auth/otp`, `/auth/otp/verify`, `/auth/logout`         |
| `/`               | Dashboard      | `/dashboard/admin`, `/dashboard/admin/*/verify`                        |
| `/properties`     | Listings       | `GET/POST /properties`                                                 |
| `/properties/:id` | Listing detail | listing patch/delete, media, price history, similar, reviews           |
| `/search`         | Search lab     | `/search/suggest`, `/search/polygon`, `/search/commute`                |
| `/users`          | Users          | admin verification queues, `/dashboard/admin/users/:id/verify`         |
| `/agencies`       | Agencies       | `/agencies` CRUD, `/dashboard/admin/agencies/:id/verify`               |
| `/areas`          | Areas          | `/areas` CRUD with boundary polygons, `/areas/:id/insights`            |
| `/buildings`      | Buildings      | `/buildings` CRUD, `/buildings/:id/reviews`                            |
| `/inquiries`      | Inquiries      | `/inquiries`, `/inquiries/:id/status`                                  |
| `/conversations`  | Conversations  | `/conversations` and message history                                   |
| `/notifications`  | Notifications  | `/notifications`, `/notifications/:id/read`, `/notifications/read-all` |
| `/reviews`        | Reviews        | `/reviews` write, update and delete                                    |
| `/analytics`      | Analytics      | derived from `/dashboard/admin` and `/properties`                      |
| `/profile`        | Profile        | `/profiles/me`, `/profiles/me/preferences`, `/health`                  |

## Caching and state

- `src/lib/api-client.ts` — axios instance, bearer header, envelope-aware error
  mapping (`400/401/403/409/429/503`), and one-shot silent refresh via
  `POST /auth/refresh` with token-rotation safety.
- `src/lib/api-cache.ts` — TTL cache in memory and `sessionStorage`, plus
  in-flight de-duplication so repeated identical GETs share one request.
- `src/lib/query-store.ts` — observable query state read through
  `useSyncExternalStore`, so several screens requesting the same key stay in sync
  and invalidation is a single call.
- `src/hooks/use-query.ts` / `use-mutation.ts` — the read/write hooks built on
  those two modules; mutations invalidate the affected cache prefixes and raise
  a toast.
- `src/store/*` — Zustand slices for auth, UI (theme, sidebar) and toasts.

## Notes

- Authentication uses cookies plus a locally stored access token. Logout clears
  both and wipes the cache.
- The users screen reads from the admin dashboard queues because the API exposes
  no `GET /users` collection; verification writes go through
  `PATCH /dashboard/admin/users/{userId}/verify`.
- Area boundaries must be submitted as closed GeoJSON rings in `[lng, lat]`
  order — both constraints are validated client-side before the request is sent.
