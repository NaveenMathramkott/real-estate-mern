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

| Tab        | Route      | Contents                                                                                                                                                 |
| ---------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Properties | `/`        | Search, filters, sort, results and the map view. With no filters applied it also shows the discovery strips (price bands, areas, cities, property types) |
| Saved      | `/saved`   | Shortlist with combined asking value, plus stored saved searches                                                                                         |
| Chats      | `/chats`   | Conversation list with a realtime message thread at `/chats/[id]`                                                                                        |
| Profile    | `/profile` | Public details, preferences, sign out, and every role-aware destination                                                                                  |

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
├── components/     gluestack wrappers, property cards/gallery/map, filter sheet, tabs
├── features/       Reusable forms shared across routes
├── hooks/          useQuery / useMutation / geolocation / favourites
├── lib/            axios client, typed endpoints, domain types, socket client
├── store/          zustand stores: auth, favourites, search, toasts
└── theme.ts        "Ivory & Emerald" light/dark tokens
```

**UI.** Every component is built on [gluestack-ui](https://gluestack.io) v5.
Gluestack v5 is copy-paste: `src/components/ui/*` holds the generated component
sources plus five thin app-level wrappers (`primitives.tsx`, `form.tsx`,
`feedback.tsx`, `screen.tsx`, `toaster.tsx`) that map the web client's "Ivory &
Emerald" tokens onto them. Styling goes through
[UniWind](https://uniwind.dev) (Tailwind CSS v4, no PostCSS step), configured in
`metro.config.js`; the theme lives in `src/global.css` and `gluestack-ui.config.json`
tells the CLI where the components are. Regenerate or add components with
`npx gluestack-ui@latest add <component>`.

**API.** `src/lib/api-client.ts` is an axios instance with a bearer-token request
interceptor, a response interceptor that rotates the access token on a 401 and
replays the original request, and a TTL GET cache with in-flight de-duplication.
Access tokens live in `expo-secure-store`; the httpOnly refresh cookie rides on
React Native's native cookie jar via `withCredentials`.

**State.** All session, shortlist, search-filter and toast state is zustand —
the same four stores the web client uses.

**Theme.** The web client's "Ivory & Emerald" OKLCH palette is translated into
semantic RGB tokens twice: `src/global.css` (what UniWind compiles for
classNames) and `src/theme.ts` (the JS mirror, still needed for the handful of
imperative styles such as map markers and the native tab tint). Change both
together.
