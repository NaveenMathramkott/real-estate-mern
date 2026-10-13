# API Documentation

## Overview

A production-grade real estate platform demonstrating geospatial querying, complex
state management, cross-platform parity, and 3rd-party API orchestration.

- **Base URL (local):** `http://localhost:4000/api/v1`
- **Interactive docs:** `http://localhost:4000/api-docs` (Swagger UI)
- **Machine-readable spec:** `http://localhost:4000/api-docs.json` (OpenAPI 3.0.3)
- **Total endpoints:** 73 operations across 54 paths
- **Socket.IO:** same host and port (chat + notifications)

> Every response uses a consistent envelope. Success carries `success: true`;
> errors always carry `success: false` plus a human-readable `message`.

```json
// success
{ "success": true, "user": { } }

// error
{ "success": false, "message": "Property not found" }
```

---

## Authentication

Register or log in to receive two `httpOnly` cookies — `accessToken` and
`refreshToken`. Requests can also send `Authorization: Bearer <accessToken>`.

| Token         | Lifetime                        | Purpose                                      |
| ------------- | ------------------------------- | -------------------------------------------- |
| Access token  | `JWT_ACCESS_TIME` (default 15m) | Sent on every authenticated request          |
| Refresh token | `JWT_REFRESH_TIME` (default 7d) | Rotated via `/auth/refresh`; httpOnly cookie |

**Token rotation.** `POST /auth/refresh` issues a fresh pair and invalidates the
presented refresh token. Replaying an already-rotated token is treated as theft:
the entire token family for that user is revoked. Each token carries a unique
`jti` so tokens minted in the same second remain distinguishable, and at most 10
concurrent sessions are retained per user.

### Roles

| Role                | Capabilities                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `buyer`, `renter`   | Search, favorite, save searches, inquire, chat, buyer dashboard                             |
| `agent`, `landlord` | Everything above, plus create listings, manage own media, answer inquiries, agent dashboard |
| `admin`             | Full reference-data CRUD, verification control, admin dashboard                             |

Listing creation requires `agent`, `landlord`, or `admin`. Areas, buildings and
agencies are reference data and are writable by `admin` only.

---

## Endpoints

### Health

| Method | Path      | Function                                        | Codes |
| ------ | --------- | ----------------------------------------------- | ----- |
| GET    | `/health` | Liveness probe. Confirms the API process is up. | 200   |

```json
{ "success": true, "status": "ok" }
```

---

### Auth

| Method | Path               | Function                                                                                                         | Codes              |
| ------ | ------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------ |
| POST   | `/auth/register`   | Creates an account and sets access/refresh cookies. Optionally creates a linked profile when `name` is supplied. | 201, 400, 429      |
| POST   | `/auth/login`      | Verifies credentials and issues a token pair.                                                                    | 200, 400, 429      |
| POST   | `/auth/refresh`    | Rotates the refresh token and mints a new access token.                                                          | 200, 401, 403      |
| POST   | `/auth/logout`     | Revokes the stored refresh token and clears both cookies.                                                        | 200, 500           |
| POST   | `/auth/otp`        | Generates a 6-digit OTP. Only a salted hash is stored; the raw code is never written to the database.            | 200, 404, 429      |
| POST   | `/auth/otp/verify` | Compares the submitted OTP against the stored hash and marks the account `verified`.                             | 200, 400, 429, 503 |
| GET    | `/auth/me`         | Returns the current session's user.                                                                              | 200, 401           |

**Register** — `POST /auth/register`

```json
// request
{ "email": "agent@example.com", "password": "Passw0rd!", "role": "agent",
  "name": "Agent One", "locale": "en", "currency": "INR" }

// 201 response
{ "success": true,
  "user": { "_id": "...", "email": "agent@example.com", "role": "agent",
            "verified": false, "locale": "en", "currency": "INR" },
  "accessToken": "eyJhbGciOi..." }
```

**OTP** — `POST /auth/otp` then `POST /auth/otp/verify`

```json
// request
{ "email": "buyer@example.com" }
// 200
{ "success": true, "message": "OTP sent" }

// verification request
{ "email": "buyer@example.com", "otp": "123456" }
// 200 — same shape as login, with user.verified now true
```

> OTP requires Redis. Without it, `/auth/otp` logs the code server-side and
> `/auth/otp/verify` returns **503**. Attempts are capped at 5 per code.

---

### Properties

| Method | Path                               | Function                                                                                            | Codes                   |
| ------ | ---------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------- |
| GET    | `/properties`                      | The primary search endpoint. Filters listings by scalar fields, free text, radius or drawn polygon. | 200, 400                |
| POST   | `/properties`                      | Creates a listing. `agent`/`landlord`/`admin` only.                                                 | 201, 400, 401, 403      |
| GET    | `/properties/{id}`                 | Listing detail plus its ordered media.                                                              | 200, 400, 404           |
| PATCH  | `/properties/{id}`                 | Updates a listing. Owner, assigned agent or admin only.                                             | 200, 400, 401, 403, 404 |
| DELETE | `/properties/{id}`                 | Soft delete — sets `status` to `expired`, preserving the record.                                    | 200, 401, 403, 404      |
| POST   | `/properties/{id}/media`           | Attaches an image, video, floorplan or tour.                                                        | 201, 400, 401, 403      |
| PATCH  | `/properties/{id}/media/reorder`   | Sets the display order of a listing's media in one round trip.                                      | 200, 400, 401, 403, 404 |
| DELETE | `/properties/{id}/media/{mediaId}` | Removes a single media item.                                                                        | 200, 401, 403, 404      |
| GET    | `/properties/{id}/price-history`   | Price change history, newest first.                                                                 | 200, 400                |
| GET    | `/properties/{id}/similar`         | Similar listings nearby — same purpose/type, ±20% price, within 5 km.                               | 200, 404                |
| POST   | `/properties/{id}/inquire`         | Sends an inquiry, routed to the assigned agent or the owner.                                        | 201, 400, 401, 404      |
| GET    | `/properties/{id}/reviews`         | Reviews for the listing's building, with average rating.                                            | 200, 404                |

**Search filters** — all optional and freely combinable:

| Param                   | Type            | Behaviour                                           |
| ----------------------- | --------------- | --------------------------------------------------- |
| `purpose`               | `rent` \| `buy` | Exact match                                         |
| `type`                  | csv             | Any of `apartment,villa,plot,commercial,farmhouse`  |
| `beds`                  | integer         | Minimum (`$gte`)                                    |
| `priceMin` / `priceMax` | number          | Price range                                         |
| `furnished`             | csv             | `unfurnished`, `semi-furnished`, `furnished`        |
| `amenities`             | csv             | All listed amenities must match (`$all`)            |
| `city`                  | string          | Fuzzy match on address                              |
| `q`                     | string          | Full-text search across title, description, address |
| `lat`, `lng`, `radius`  | number          | Radius search in metres (`$near`)                   |
| `polygon`               | JSON string     | Draw-area search (`$geoIntersects`)                 |
| `page`, `limit`         | integer         | Pagination (default 20, max 100)                    |

```json
// GET /properties?purpose=rent&beds=2&priceMax=50000
{
  "success": true,
  "page": 1,
  "limit": 20,
  "total": 1,
  "pages": 1,
  "properties": [
    {
      "_id": "6ace16cc066d213846840f88",
      "title": "Doc Sample",
      "type": "apartment",
      "purpose": "rent",
      "price": 42000,
      "currency": "INR",
      "size": 1100,
      "beds": 2,
      "baths": 2,
      "furnished": "unfurnished",
      "amenities": [],
      "location": { "type": "Point", "coordinates": [77.209, 28.6139] },
      "address": "Connaught Place, New Delhi",
      "ownerId": "...",
      "agentId": "...",
      "status": "active",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

```json
// GET /properties/{id}
{
  "success": true,
  "property": { "...": "as above" },
  "media": [{ "_id": "...", "type": "image", "url": "https://...", "order": 0 }]
}
```

```json
// POST /properties  — location uses GeoJSON [lng, lat] order
{
  "title": "Doc Sample", "type": "apartment", "purpose": "rent",
  "price": 42000, "beds": 2, "baths": 2, "size": 1100,
  "location": { "type": "Point", "coordinates": [77.209, 28.6139] },
  "address": "Connaught Place, New Delhi"
}
// 201
{ "success": true,
  "property": { "_id": "...", "title": "Doc Sample", "status": "active", "price": 42000 } }
```

**Price history** is written automatically whenever `PATCH /properties/{id}`
changes `price`.

```json
// GET /properties/{id}/price-history
{
  "success": true,
  "history": [
    {
      "_id": "...",
      "propertyId": "...",
      "oldPrice": 45000,
      "newPrice": 42000,
      "changedAt": "..."
    }
  ]
}
```

> **Polygon rings must be closed** — the first `[lng, lat]` point must repeat as
> the last, otherwise MongoDB rejects the query. Unclosed rings return 400 with
> an explicit message.

---

### Search

| Method | Path              | Function                                                                                             | Codes    |
| ------ | ----------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| GET    | `/search/suggest` | Autocomplete across area names, cities, listing titles and addresses. Takes `q`.                     | 200, 400 |
| POST   | `/search/polygon` | Draw-area search. Returns listings intersecting the polygon plus price statistics. Cached 2 min.     | 200, 400 |
| POST   | `/search/commute` | Commute/isochrone search. Derives a reachable radius from an origin and a time budget. Cached 5 min. | 200, 400 |

```json
// GET /search/suggest?q=Connaught
{
  "success": true,
  "suggestions": [
    { "type": "area", "label": "Connaught Place, New Delhi", "areaId": "..." },
    {
      "type": "property",
      "label": "Doc Sample",
      "address": "Connaught Place",
      "price": 42000,
      "currency": "INR",
      "coordinates": [77.209, 28.6139],
      "propertyId": "..."
    }
  ]
}
```

```json
// POST /search/polygon
{ "coordinates": [[77.19,28.6],[77.23,28.6],[77.23,28.63],[77.19,28.6]] }
// 200
{
  "success": true, "total": 1,
  "stats": { "avgPrice": 42000, "minPrice": 42000, "maxPrice": 42000 },
  "properties": [ { } ]
}
```

```json
// POST /search/commute
{ "lat": 28.6139, "lng": 77.209, "minutes": 20, "speedKph": 30 }
// 200 — radius derived as (minutes/60) * speedKph * 1000
{
  "success": true,
  "origin": { "lat": 28.6139, "lng": 77.209 },
  "minutes": 20, "radiusMetres": 10000,
  "total": 1, "properties": [ { } ]
}
```

---

### Favorites

| Method | Path                      | Function                                                                 | Codes              |
| ------ | ------------------------- | ------------------------------------------------------------------------ | ------------------ |
| GET    | `/favorites`              | Lists favorited properties, fully populated.                             | 200, 401           |
| POST   | `/favorites`              | Adds a favorite. Idempotent — re-favoriting returns the existing record. | 201, 400, 401, 404 |
| DELETE | `/favorites`              | Removes a favorite (body `{ "propertyId": "..." }`).                     | 200, 400, 401      |
| DELETE | `/favorites/{propertyId}` | Removes a favorite by path parameter.                                    | 200, 400, 401      |

```json
// POST /favorites
{ "propertyId": "6ace16cc066d213846840f88" }
// 201
{ "success": true,
  "favorite": { "_id": "...", "userId": "...", "propertyId": "...", "createdAt": "..." } }
```

A unique compound index on `{ userId, propertyId }` prevents duplicates.

---

### Saved Searches

| Method | Path                           | Function                                                                       | Codes              |
| ------ | ------------------------------ | ------------------------------------------------------------------------------ | ------------------ |
| GET    | `/saved-searches`              | Lists the user's saved searches.                                               | 200, 401           |
| POST   | `/saved-searches`              | Stores a search. Filters are validated against the search layer before saving. | 201, 400, 401      |
| DELETE | `/saved-searches/{id}`         | Deletes a saved search. Owner only.                                            | 200, 401, 403, 404 |
| GET    | `/saved-searches/{id}/results` | Re-runs the stored filters and stamps `lastRunAt`. Owner only.                 | 200, 401, 403, 404 |

```json
// POST /saved-searches
{ "filters": { "purpose": "rent", "beds": 2, "priceMax": 50000 },
  "alertFrequency": "daily" }
// 201
{ "success": true,
  "savedSearch": { "_id": "...", "userId": "...", "filters": { },
                   "alertFrequency": "daily", "lastRunAt": null } }
```

`filters` accepts the same keys as `GET /properties`. `alertFrequency` is one of
`off`, `daily`, `weekly`, `instant`.

---

### Inquiries

| Method | Path                     | Function                                                   | Codes                   |
| ------ | ------------------------ | ---------------------------------------------------------- | ----------------------- |
| GET    | `/inquiries`             | Lists inquiries addressed to the signed-in agent/landlord. | 200, 401, 403           |
| PATCH  | `/inquiries/{id}/status` | Updates an inquiry status and notifies the inquirer.       | 200, 400, 401, 403, 404 |

```json
// PATCH /inquiries/{id}/status
{ "status": "contacted" }
// 200
{ "success": true,
  "inquiry": { "_id": "...", "propertyId": "...", "userId": "...",
               "agentId": "...", "message": "...", "status": "contacted" } }
```

Status is one of `new`, `contacted`, `closed`.

---

### Chat

| Method | Path                           | Function                                                                        | Codes                   |
| ------ | ------------------------------ | ------------------------------------------------------------------------------- | ----------------------- |
| GET    | `/conversations`               | Lists conversations ordered by most recent activity.                            | 200, 401                |
| POST   | `/conversations`               | Starts a thread. Reuses an existing one between the same pair.                  | 200, 201, 400, 401      |
| GET    | `/conversations/{id}`          | Conversation detail with populated participants.                                | 200, 401, 403, 404      |
| GET    | `/conversations/{id}/messages` | Message history, oldest to newest. Supports `before` for backfill.              | 200, 401, 403, 404      |
| POST   | `/conversations/{id}/messages` | Sends a message, then broadcasts to the thread and notifies other participants. | 201, 400, 401, 403, 404 |
| POST   | `/conversations/{id}/read`     | Marks the other party's unread messages as read.                                | 200, 401, 403, 404      |

```json
// GET /conversations/{id}/messages
{
  "success": true,
  "messages": [
    {
      "_id": "...",
      "conversationId": "...",
      "senderId": "...",
      "body": "Is this still available?",
      "attachments": [],
      "readAt": null,
      "createdAt": "..."
    }
  ]
}
```

Only participants may read or post to a thread.

### Realtime (Socket.IO)

Connects to the same origin; the handshake must carry the access token.

```js
const socket = io("http://localhost:4000", { auth: { token: accessToken } });
```

| Direction | Event                                      | Payload                                               |
| --------- | ------------------------------------------ | ----------------------------------------------------- |
| → server  | `message:send`                             | `{ conversationId, body, attachments }`, optional ack |
| → server  | `conversation:join` / `conversation:leave` | `{ conversationId }`                                  |
| → server  | `typing`                                   | `{ conversationId }`                                  |
| ← server  | `message:new`                              | The stored message                                    |
| ← server  | `notification:new`                         | The persisted notification                            |
| ← server  | `typing`                                   | `{ userId, conversationId }`                          |

Unauthenticated handshakes are rejected. Messages sent over REST reach the same
sockets as socket-originated messages — both share one delivery path.

---

### Notifications

| Method | Path                       | Function                                                            | Codes         |
| ------ | -------------------------- | ------------------------------------------------------------------- | ------------- |
| GET    | `/notifications`           | Notification feed. `unreadOnly=true` filters, `limit` caps results. | 200, 401      |
| PATCH  | `/notifications/{id}/read` | Marks one notification as read.                                     | 200, 401, 404 |
| PATCH  | `/notifications/read-all`  | Marks every unread notification as read.                            | 200, 401      |

```json
{
  "success": true,
  "notifications": [
    {
      "_id": "...",
      "userId": "...",
      "type": "message",
      "payload": {
        "conversationId": "...",
        "messageId": "...",
        "preview": "Is this..."
      },
      "readAt": null,
      "createdAt": "..."
    }
  ]
}
```

---

### Areas & Buildings

| Method | Path                      | Function                                                               | Codes                   |
| ------ | ------------------------- | ---------------------------------------------------------------------- | ----------------------- |
| GET    | `/areas`                  | Lists areas. Filter by `city`/`name`, paginated.                       | 200                     |
| GET    | `/areas/{id}`             | Area detail including its boundary polygon.                            | 200, 400, 404           |
| GET    | `/areas/{id}/insights`    | Market insights for an area. Cached 10 min.                            | 200, 400, 404           |
| POST   | `/areas`                  | Creates an area. **Admin only.**                                       | 201, 400, 401, 403      |
| PATCH  | `/areas/{id}`             | Updates an area and clears its cached insights. **Admin only.**        | 200, 400, 401, 403, 404 |
| DELETE | `/areas/{id}`             | Deletes an area. **Admin only.** 409 while reviews reference it.       | 200, 401, 403, 404, 409 |
| GET    | `/buildings`              | Lists buildings. Filter by `name`/`developer`, paginated.              | 200                     |
| GET    | `/buildings/{id}`         | Building detail with its active listings.                              | 200, 400, 404           |
| GET    | `/buildings/{id}/reviews` | Reviews with a 1–5 star distribution. Paginated.                       | 200, 400, 404           |
| POST   | `/buildings`              | Creates a building. **Admin only.**                                    | 201, 400, 401, 403      |
| PATCH  | `/buildings/{id}`         | Updates a building. **Admin only.**                                    | 200, 400, 401, 403, 404 |
| DELETE | `/buildings/{id}`         | Deletes a building. **Admin only.** 409 while properties reference it. | 200, 401, 403, 404, 409 |

**Insights** aggregate every active listing intersecting the area boundary into
price statistics, purpose split, type mix, bedroom distribution and rating.

```json
// GET /areas/{id}/insights
{
  "success": true,
  "area": { "_id": "...", "name": "Connaught Place", "city": "New Delhi" },
  "total": 12,
  "priceStats": {
    "avgPrice": 45000,
    "medianPrice": 42000,
    "minPrice": 22000,
    "maxPrice": 120000
  },
  "byPurpose": {
    "rent": { "count": 9, "avgPrice": 38000 },
    "buy": { "count": 3, "avgPrice": 82000 }
  },
  "byType": { "apartment": 8, "villa": 3, "commercial": 1 },
  "byBeds": { "1": 2, "2": 6, "3": 4 },
  "rating": { "average": 4.2, "count": 15 }
}
```

```json
// GET /buildings/{id}/reviews
{
  "success": true,
  "page": 1,
  "total": 15,
  "avgRating": 4.2,
  "reviews": [
    {
      "_id": "...",
      "targetType": "building",
      "targetId": "...",
      "rating": 5,
      "body": "Great building",
      "userId": {}
    }
  ],
  "distribution": { "1": 1, "2": 0, "3": 1, "4": 4, "5": 9 }
}
```

```json
// POST /areas — boundary must be a closed ring
{ "name": "Connaught Place", "city": "New Delhi",
  "boundary": { "type": "Polygon",
    "coordinates": [ [[77.19,28.60],[77.23,28.60],[77.23,28.63],
                      [77.19,28.63],[77.19,28.60]] ] } }
// 201
{ "success": true,
  "area": { "_id": "...", "name": "Connaught Place", "city": "New Delhi" } }
```

---

### Agencies & Profiles

| Method | Path                       | Function                                                                      | Codes                   |
| ------ | -------------------------- | ----------------------------------------------------------------------------- | ----------------------- |
| GET    | `/agencies`                | Lists agencies. Filter by `verified`, paginated.                              | 200                     |
| GET    | `/agencies/{id}`           | Agency detail with member profiles.                                           | 200, 400, 404           |
| POST   | `/agencies`                | Creates an agency. **Admin only.**                                            | 201, 400, 401, 403      |
| PATCH  | `/agencies/{id}`           | Updates an agency. **Admin only.** `verified` only applies for admins.        | 200, 401, 403, 404      |
| DELETE | `/agencies/{id}`           | Deletes an agency. **Admin only.** 409 while profiles reference it.           | 200, 401, 403, 404, 409 |
| GET    | `/profiles/me`             | Your profile.                                                                 | 200, 401                |
| PATCH  | `/profiles/me`             | Updates your profile. Upserts, so it works even if registration created none. | 200, 401                |
| PATCH  | `/profiles/me/preferences` | Updates your locale and currency.                                             | 200, 401                |
| GET    | `/profiles/{userId}`       | Public profile for a user.                                                    | 200, 400, 401, 404      |

```json
// PATCH /profiles/me
{ "name": "Agent One", "avatar": "https://...", "agencyId": "...", "bio": "..." }
// 200
{ "success": true,
  "profile": { "_id": "...", "userId": "...", "name": "Agent One", "agencyId": "..." } }

// PATCH /profiles/me/preferences
{ "locale": "fr", "currency": "USD" }
// 200
{ "success": true,
  "user": { "_id": "...", "email": "...", "locale": "fr", "currency": "USD" } }
```

---

### Reviews

| Method | Path            | Function                                | Codes              |
| ------ | --------------- | --------------------------------------- | ------------------ |
| GET    | `/reviews`      | Reviews you have written.               | 200, 401           |
| POST   | `/reviews`      | Writes or updates a review.             | 201, 400, 401, 404 |
| DELETE | `/reviews/{id}` | Deletes a review. Author or admin only. | 200, 401, 403, 404 |

```json
// POST /reviews — upserts on (targetType, targetId, userId)
{ "targetType": "building", "targetId": "...", "rating": 5, "body": "Great building" }
// 201
{ "success": true,
  "review": { "_id": "...", "targetType": "building", "targetId": "...",
              "rating": 5, "body": "Great building", "userId": "...", "createdAt": "..." } }
```

`targetType` is `building`, `area` or `agent`; `rating` is 1–5. A unique compound
index means reviewing twice edits the earlier review rather than duplicating it.
Self-reviews are rejected with 400.

---

### Dashboards

| Method | Path                                              | Function                                                                          | Codes                   |
| ------ | ------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------- |
| GET    | `/dashboard`                                      | Returns the dashboard matching the caller's role.                                 | 200, 401, 403           |
| GET    | `/dashboard/buyer`                                | Buyer/renter activity and the value of their shortlist.                           | 200, 401, 403           |
| GET    | `/dashboard/agent`                                | Agent/landlord listing performance and lead pipeline.                             | 200, 401, 403           |
| GET    | `/dashboard/admin`                                | Platform-wide totals with verified/unverified queues.                             | 200, 401, 403           |
| PATCH  | `/dashboard/admin/users/{userId}/verify`          | Sets a user's verification. **Admin only.**                                       | 200, 400, 401, 403, 404 |
| PATCH  | `/dashboard/admin/properties/{propertyId}/verify` | Sets a listing's verification, stamping or clearing `verifiedAt`. **Admin only.** | 200, 400, 401, 403, 404 |
| PATCH  | `/dashboard/admin/agencies/{agencyId}/verify`     | Sets an agency's verification. **Admin only.**                                    | 200, 400, 401, 403, 404 |

**Buyer dashboard** — favourites, saved searches, inquiries sent, conversations,
unread notifications, and a value summary of favorited listings by purpose.

```json
{
  "success": true,
  "role": "buyer",
  "summary": {
    "favorites": 2,
    "savedSearches": 1,
    "inquiriesSent": 2,
    "conversations": 1,
    "unreadNotifications": 0
  },
  "favoriteSummary": {
    "rent": {
      "count": 2,
      "totalValue": 80000,
      "avgPrice": 40000,
      "minPrice": 30000,
      "maxPrice": 50000
    }
  },
  "recentFavorites": [{}],
  "recentInquiries": [{}]
}
```

**Agent dashboard** — listing totals by status and purpose, portfolio value,
live-market value, price range, media count and lead pipeline. Covers listings the
user owns _or_ is assigned as agent.

```json
{
  "success": true,
  "role": "agent",
  "summary": {
    "totalListings": 3,
    "activeListings": 2,
    "totalInquiries": 2,
    "newInquiries": 1,
    "mediaAssets": 4,
    "portfolioValue": 150000,
    "avgPrice": 50000,
    "priceRange": { "min": 30000, "max": 70000 },
    "livePortfolioValue": 80000
  },
  "listingsByStatus": { "active": 2, "rented": 1 },
  "listingsByPurpose": {
    "rent": { "count": 3, "avgPrice": 50000, "totalValue": 150000 }
  },
  "inquiriesByStatus": { "new": 1, "contacted": 1 },
  "recentListings": [],
  "recentInquiries": [],
  "recentPriceChanges": []
}
```

> `portfolioValue` sums every listing; `livePortfolioValue` counts only
> `status: "active"`, so rented or sold stock is excluded.

**Admin dashboard** — platform totals plus explicit verified/unverified queues
for users, properties and agencies.

```json
{
  "success": true,
  "role": "admin",
  "summary": {
    "totalUsers": 128,
    "usersByRole": { "buyer": 90, "agent": 30, "admin": 8 },
    "verifiedUsers": 96,
    "unverifiedUsers": 32,
    "totalProperties": 412,
    "propertiesByStatus": { "active": 380, "rented": 24, "draft": 8 },
    "verifiedProperties": 310,
    "unverifiedProperties": 102,
    "totalAgencies": 14,
    "verifiedAgencies": 9,
    "unverifiedAgencies": 5,
    "totalAreas": 22,
    "totalBuildings": 61,
    "totalReviews": 240,
    "reviewsByTarget": { "building": 180, "area": 45, "agent": 15 },
    "totalMessages": 1890,
    "inquiriesByStatus": { "new": 18, "contacted": 25, "closed": 40 },
    "closedDeals": 32,
    "closedDealValue": 2450000
  },
  "verified": {
    "users": { "count": 96, "sample": [] },
    "properties": { "count": 310, "sample": [] },
    "agencies": { "count": 9, "sample": [] }
  },
  "unverified": {
    "users": { "count": 32, "sample": [] },
    "properties": { "count": 102, "sample": [] },
    "agencies": { "count": 5, "sample": [] }
  },
  "recentUsers": [],
  "recentProperties": []
}
```

```json
// PATCH /dashboard/admin/properties/{id}/verify
{ "verified": true }
// 200 — stamps verifiedAt
{ "success": true,
  "property": { "_id": "...", "verifiedAt": "2026-01-15T10:30:00.000Z" } }
```

---

## Data Model (Mongoose schemas)

```
User          { _id, email, phone, role, verified, locale, currency,
                passwordHash, refreshTokens[{ token, expiresAt }], createdAt }
                role: buyer|renter|agent|landlord|admin
                unique: email   sparse-unique: phone

Profile       { userId, name, avatar, agencyId, bio, createdAt }
                unique: userId

Agency        { name, logo, licenseNo, verified, createdAt }

Property      { _id, title, description, type, purpose: 'rent'|'buy',
                price, currency, size, beds, baths, floor, furnished,
                amenities: [String],
                location: { type: 'Point', coordinates: [lng, lat] },
                address, buildingId?, ownerId, agentId,
                status, verifiedAt, availableFrom, createdAt }
                type: apartment|villa|plot|commercial|farmhouse
                status: draft|active|rented|sold|expired
                furnished: unfurnished|semi-furnished|furnished
                indexes: 2dsphere(location),
                         compound(purpose, status, price),
                         text(title, description, address)

PropertyMedia { propertyId, type: 'image'|'video'|'floorplan'|'tour',
                url, publicId, blurhash, order }
                index: compound(propertyId, order)

PriceHistory  { propertyId, oldPrice, newPrice, changedAt }
                index: compound(propertyId, changedAt desc)

SavedSearch   { userId, filters: Object, alertFrequency, lastRunAt }
                alertFrequency: off|daily|weekly|instant
                index: compound(userId, createdAt desc)

Favorite      { userId, propertyId, createdAt }
                index: unique compound(userId, propertyId)

Inquiry       { propertyId, userId, agentId, message, status, createdAt }
                status: new|contacted|closed
                index: compound(agentId, status, createdAt desc)

Conversation  { participants: [userId], propertyId?, lastMessageAt }
                index: compound(participants, lastMessageAt desc)

Message       { conversationId, senderId, body, attachments, readAt }
                index: compound(conversationId, createdAt desc)

Review        { targetType: 'building'|'area'|'agent', targetId, rating,
                body, userId, createdAt }
                index: unique compound(targetType, targetId, userId)

Building      { name, developer, yearBuilt, amenities: [String],
                location: GeoJSON Point }
                index: 2dsphere(location)

Area          { name, city, boundary: GeoJSON Polygon }
                index: 2dsphere(boundary)

Notification  { userId, type, payload: Object, readAt }
                index: compound(userId, readAt, createdAt desc)
```

---

## Errors

| Status | Meaning                                                             |
| ------ | ------------------------------------------------------------------- |
| 400    | Validation failed, malformed id, bad query or body                  |
| 401    | Missing or invalid access token                                     |
| 403    | Authenticated but not permitted (wrong role, or not the owner)      |
| 404    | Resource does not exist                                             |
| 409    | Delete blocked because another record still references the resource |
| 429    | Rate limit exceeded (auth: 20 per 15 min, search: 60 per minute)    |
| 503    | Feature unavailable because Redis is not configured                 |

## Notes on the geospatial design

- Property, building and area documents carry **2dsphere** indexes, which power
  `$near`, `$geoIntersects` and `$nearSphere` queries.
- GeoJSON coordinate order is **`[longitude, latitude]`** everywhere — swapping
  this silently breaks every spatial query.
- Polygon and area-boundary rings **must be closed** (first point repeated last).
- Counts for radius queries use `$geoWithin`/`$centerSphere`, because `$near` is
  not permitted inside an aggregation pipeline.

---

# high level architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Clients                                                    │
│  ├── React (Web)  — Vite + React Router + Leaflet/Mapbox    │
│  └── React Native — Expo + react-native-maps                │
│      Shared: TypeScript types, zod schemas, API client      │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS / REST (or tRPC)
┌──────────────────────▼──────────────────────────────────────┐
│  API — Node.js + Express                                    │
│  - Auth (JWT access + refresh), bcrypt                     │
│  - Rate limiting (express-rate-limit)                       │
│  - REST endpoints                                           │
│  - Socket.IO for chat + notifications                       │
│  - Swagger UI at /api-docs                                  │
└──────┬──────────────┬──────────────┬──────────────┬─────────┘
       │              │              │              │
┌──────▼─────┐ ┌──────▼─────┐ ┌──────▼─────┐ ┌──────▼──────┐
│ MongoDB    │ │  Upstash   │ │ Cloudinary │ │ Atlas       │
│ Atlas M0   │ │  Redis     │ │  (images)  │ │ Search      │
│ + 2dsphere │ │  cache +   │ │            │ │             │
│            │ │  OTP store │ │            │ │             │
└────────────┘ └────────────┘ └────────────┘ └─────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  Background Jobs — node-cron / BullMQ                       │
│  - Image processing (Cloudinary transforms)                 │
│  - Availability re-check pings (every 7 days)               │
│  - Price-drop alert fanout                                  │
│  - Saved-search match notifier                              │
│  - Commute-time / isochrone cache warmer                    │
└─────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  Realtime: Socket.IO (chat + notifications)                 │
│  Push: Expo Push Notifications (FCM/APNs)                   │
│  Email: Resend / Brevo                                      │
└─────────────────────────────────────────────────────────────┘
```

### Environment variables

| Variable                                             | Purpose                                            |
| ---------------------------------------------------- | -------------------------------------------------- |
| `PORT`                                               | HTTP port (default 4000)                           |
| `MONGODB_URL`                                        | MongoDB connection string                          |
| `CLIENT_URL`                                         | CORS origin, also used for the Socket.IO handshake |
| `JWT_SECRET_KEY`                                     | Signs access tokens                                |
| `JWT_REFRESH_SECRET_KEY`                             | Signs refresh tokens                               |
| `JWT_ACCESS_TIME` / `JWT_REFRESH_TIME`               | Token lifetimes                                    |
| `OTP_SECRET_KEY`                                     | Salts the OTP hash                                 |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Media uploads                                      |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN`                  | Cache, OTP store, job queues                       |

Cloudinary and Upstash Redis are optional: the server degrades gracefully
without them (caching becomes a no-op and OTP returns 503). See `.env.example`.

### Known limitations

- Media upload accepts a hosted `url`; multipart uploads need a multipart
  middleware (multer) that is not installed yet.
- Registration currently allows a caller to self-select any role, including
  `admin`. Restrict this before deploying publicly.
- Background jobs, push notifications and email are described in the architecture
  above but are not yet implemented.
