# Tenementary — mobile app

Expo SDK 57 / React Native client for the Tenementary property platform. It is a
mobile counterpart to `../webApp`: the same screens, the same role model, the
same API surface, adapted to touch and native navigation.

## Flow

The app is **authentication-first**. There is no public surface: the root layout
resolves the session on launch and mounts exactly one of two navigators.

- **Signed out** → `(auth)` — a login screen with password and OTP modes, and a
  register screen with a role picker.
- **Signed in** → the application, four native tabs plus a stack of detail
  screens.

Signing out swaps the navigator back, so no signed-in route is reachable without
a session.

## Running it

```bash
npm install
cp .env.example .env   # then point EXPO_PUBLIC_API_URL at your API
npx expo start
```

`EXPO_PUBLIC_API_URL` defaults to `http://localhost:4000/api/v1`. On a physical
device, leave it unset and the app derives the host from the Metro connection, so
it finds the API on your development machine.

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
```

`react-native-maps` ships native code, so a development build is required for the
map screen — Expo Go will not render it. Use `npx expo run:ios|android` or
`eas build --profile development`.

## Tabs

| Tab | Route | Contents |
| --- | --- | --- |
| Properties | `/` | Search, filters, sort, results and the map view. With no filters applied it also shows the discovery strips (price bands, areas, cities, property types) |
| Saved | `/saved` | Shortlist with combined asking value, plus stored saved searches |
| Chats | `/chats` | Conversation list with a realtime message thread at `/chats/[id]` |
| Profile | `/profile` | Public details, preferences, sign out, and every role-aware destination |

Above the tabs the stack carries `property/[id]`, `map`, `dashboard`,
`listings/*`, `inquiries`, `saved-searches`, `notifications`, `reviews`,
`areas/*`, `buildings/*`, `agencies/*` and `profiles/[userId]`.

## Roles

`buyer` / `renter` browse, shortlist, save searches, enquire and chat.
`agent` / `landlord` additionally get listing creation, media management and the
enquiry pipeline. `admin` sees platform totals and verification queues. The
capabilities matrix lives in `src/lib/roles.ts`; `RequireAuth` in
`src/components/guards.tsx` gates every role-restricted route, and the Profile
tab only renders the sections a role can use.

## Layout

```
src/
├── app/            Expo Router routes (one file per screen)
├── components/     UI kit, property cards/gallery/map, filter sheet, tab bar
├── features/       Reusable forms shared across routes
├── hooks/          useQuery / useMutation / geolocation / favourites
├── lib/            axios client, typed endpoints, domain types, socket client
├── store/          zustand stores: auth, favourites, search, toasts
└── theme.ts        "Ivory & Emerald" light/dark tokens
```

**API.** `src/lib/api-client.ts` is an axios instance with a bearer-token request
interceptor, a response interceptor that rotates the access token on a 401 and
replays the original request, and a TTL GET cache with in-flight de-duplication.
Access tokens live in `expo-secure-store`; the httpOnly refresh cookie rides on
React Native's native cookie jar via `withCredentials`.

**State.** All session, shortlist, search-filter and toast state is zustand —
the same four stores the web client uses.

**Theme.** `src/theme.ts` translates the web client's "Ivory & Emerald" OKLCH
palette into hex tokens for light and dark, so both clients read the same.