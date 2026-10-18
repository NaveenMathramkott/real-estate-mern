import type { Section } from "~/content/types";

export const MOBILE_APP: Section = {
  slug: "mobile-app",
  title: "Mobile App",
  nav: "Mobile App",
  step: "05",
  summary:
    "The Expo / React Native app: native tabs, realtime chat, on-device maps and the same feature set in your pocket.",
  icon: "Smartphone",
  blocks: [
    {
      t: "lead",
      text: "The mobile app is the fourth application: Expo SDK 57 on React Native 0.86, using Expo Router's file-based navigation and gluestack-ui for components. It is the only one of the three front ends with a live WebSocket connection, and the only one that stores credentials in the OS keychain.",
    },

    {
      t: "callout",
      kind: "info",
      title: "Screenshots",
      text: "Every screen in this section is shown as a real capture. File names follow `mobile_app_<screen>.png`; the tall aspect ratio is a 1206 × 2622 device screenshot.",
    },

    { t: "h2", text: "Stack" },

    {
      t: "table",
      columns: ["Concern", "Choice", "Version"],
      rows: [
        ["Framework", "Expo SDK", "`~57.0.30`"],
        ["Runtime", "React Native", "`0.86.3`"],
        ["React", "React", "`19.2.3`"],
        ["Navigation", "Expo Router (file-based)", "`~57.0.28`"],
        ["Tabs", "`expo-router/unstable-native-tabs`", "built in"],
        [
          "Components",
          "gluestack-ui v5 (copy-paste)",
          "`@gluestack-ui/core ^5.0.15`",
        ],
        ["Styling", "UniWind (Tailwind v4 for native)", "`^1.12.2`"],
        ["Motion", "Reanimated + Worklets", "`4.5.1` / `0.10.1`"],
        ["Maps", "react-native-maps", "`1.27.2`"],
        ["Storage", "expo-secure-store", "`~57.0.4`"],
        ["Location", "expo-location (opt-in)", "`~57.0.21`"],
        ["Realtime", "socket.io-client", "`^4.8.4`"],
        ["State", "Zustand", "`^5.0.15`"],
        ["Language", "TypeScript, strict", "`~6.0.3`"],
      ],
    },

    {
      t: "callout",
      kind: "warn",
      title: "Expo SDK 57 authoring rules",
      text: "The repository ships an `AGENTS.md` in `client/mobileApp/` with the rules that actually matter here: install native packages with `expo install` rather than `npm install` so the versions match the SDK, run `tsc --noEmit` and `expo lint` before committing, and never hand-edit the `ios/` or `android/` directories. Read it before changing anything native.",
    },

    { t: "h2", text: "Project structure" },

    {
      t: "code",
      lang: "bash",
      title: "client/mobileApp/",
      code: `mobileApp/
├── app.json                       Expo config — icons, plugins, permissions
├── babel.config.js                babel-preset-expo only
├── metro.config.js                withUniwindConfig()
├── gluestack-ui.config.json       Tailwind + component output paths
├── uniwind-types.d.ts             Generated style types
│
├── assets/images/                 Icons and splash artwork
│
└── src/
    ├── app/                       Expo Router — one file per screen
    ├── components/
    │   ├── ui/                    gluestack sources + app wrappers
    │   ├── property/              cards, gallery, map, icons, rating
    │   ├── search/filter-sheet.tsx
    │   ├── app-tabs.tsx           NativeTabs with an unread badge
    │   └── guards.tsx             RequireAuth, with optional roles
    ├── context/TabBarContext.tsx  Hides the tab bar on pushed screens
    ├── features/listings/         Shared listing form
    ├── hooks/                     use-query, use-mutation, geolocation, search
    ├── lib/                       api, api-client, socket, token-store, …
    ├── store/                     auth, favorites, search, toast
    ├── theme.ts                   Light/dark hex tokens
    └── global.css                 UniWind + Tailwind v4 theme
`,
    },

    { t: "h2", text: "Navigation" },

    {
      t: "p",
      text: "Expo Router maps the file tree directly onto routes, and this app uses three groups to keep it organised. `(auth)` and `(tabs)` are *route groups* — the parentheses mean they add no path segment.",
    },

    {
      t: "code",
      lang: "bash",
      title: "src/app/ — the route tree",
      code: `src/app/
├── _layout.tsx              Root: providers, session resolution, navigator choice
│
├── (auth)/                  ── signed out ──
│   ├── _layout.tsx
│   ├── index.tsx            Redirects to /login
│   ├── login.tsx            LoginScreen
│   └── register.tsx         RegisterScreen
│
├── (tabs)/                  ── signed in ──
│   ├── _layout.tsx          → components/app-tabs.tsx
│   ├── index.tsx            Properties      /
│   ├── saved/index.tsx      Saved           /saved
│   ├── chats/
│   │   ├── _layout.tsx      Own stack: a thread pushes full-screen
│   │   ├── index.tsx        Chats           /chats
│   │   └── [id].tsx         Conversation    /chats/:id
│   ├── map.tsx              SearchMap       /map
│   └── profile/index.tsx    Profile         /profile
│
├── property/[id].tsx        PropertyDetail  /property/:id
├── listings/
│   ├── index.tsx            Listings        /listings
│   ├── new.tsx              NewListing      /listings/new
│   ├── [id]/edit.tsx        EditListing     /listings/:id/edit
│   └── [id]/media.tsx       ListingMedia    /listings/:id/media
│
├── dashboard.tsx            Dashboard       /dashboard
├── inquiries.tsx            Inquiries       /inquiries
├── saved-searches.tsx       SavedSearches   /saved-searches
├── notifications.tsx        Notifications   /notifications
├── reviews.tsx              Reviews         /reviews
│
├── areas/{index,[id]}.tsx   Area directory and detail
├── buildings/{index,[id]}.tsx
├── agencies/{index,[id]}.tsx
├── profiles/[userId].tsx    PublicProfile   /profiles/:userId
│
└── +not-found.tsx           NotFoundScreen
`,
    },

    { t: "h3", text: "The root layout decides the navigator" },

    {
      t: "p",
      text: "`app/_layout.tsx` resolves the stored session on launch, then mounts **exactly one** of two navigators: the `(auth)` stack when signed out, or the signed-in stack listing every screen in `APP_SCREENS`. There is no public surface in the mobile app — if you are signed out, the tab navigator does not exist.",
    },

    {
      t: "code",
      lang: "tsx",
      title: "src/app/_layout.tsx — provider and navigator setup",
      code: `export default function RootLayout() {
  const { status } = useAuthStore();

  return (
    <SafeAreaListener />
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GluestackUIProvider mode="system">
        <SafeAreaProvider>
          <ThemeProvider value={useTheme()}>
            <Stack>
              {status === "authenticated" ? (
                // Signed in — the full application.
                APP_SCREENS.map((screen) => (
                  <Stack.Screen key={screen.name} {...screen} />
                ))
              ) : (
                // Signed out — the auth stack only.
                <Stack.Screen name="(auth)" />
              )}
            </Stack>
            <Toaster />
          </ThemeProvider>
        </SafeAreaProvider>
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}`,
    },

    {
      t: "p",
      text: "The providers are ordered deliberately: `GestureHandlerRootView` must wrap Reanimated, `SafeAreaProvider` supplies the insets that `SafeAreaListener` then feeds to `Uniwind.updateInsets` so native styles respect the notch.",
    },

    { t: "h3", text: "Native tabs" },

    {
      t: "p",
      text: "`components/app-tabs.tsx` uses `expo-router/unstable-native-tabs`' `NativeTabs` — real platform tab bars with native blur, not a JS imitation. There is a `.web.tsx` sibling providing a headless fallback, because native tabs have no equivalent system bar in a browser.",
    },

    {
      t: "table",
      columns: ["Tab", "Route", "Screen"],
      rows: [
        [
          "Properties",
          "`/`",
          "`(tabs)/index.tsx` — search box, result list, filter sheet",
        ],
        [
          "Map",
          "`/map`",
          "`(tabs)/map.tsx` — react-native-maps, pan to search",
        ],
        ["Chats", "`/chats`", "`(tabs)/chats/index.tsx` — conversation inbox"],
        [
          "Saved",
          "`/saved`",
          "`(tabs)/saved/index.tsx` — shortlist and saved searches",
        ],
        [
          "Profile",
          "`/profile`",
          "`(tabs)/profile/index.tsx` — role dashboard and settings",
        ],
      ],
    },

    {
      t: "callout",
      kind: "info",
      title: "The unread badge on Chats",
      text: "The badge combines three sources: the REST unread count on mount, a `notification:new` socket subscription, and a 120-second polling sweep as a fallback. The polling is what makes the badge survive a suspended app on iOS, where the socket is torn down in the background and never reconnected.",
    },

    { t: "h3", text: "Hiding the tab bar" },

    {
      t: "p",
      text: "A chat thread is a pushed screen and should be full-bleed. Since `NativeTabs` reads its visibility declaratively, `TabBarContext` exposes a `setIsTabBarHidden` function that the thread calls on focus and clears on blur. `app-tabs.tsx` consumes it as `hidden={isTabBarHidden}`.",
    },

    { t: "h2", text: "Authentication" },

    {
      t: "p",
      text: "The mobile app is the only front end that stores its access token in the OS keychain, via `expo-secure-store`. That single substitution is the entire difference between `lib/token-store.ts` and the web app's version — everything else in `lib/` is a near-identical copy.",
    },

    {
      t: "code",
      lang: "ts",
      title: "src/lib/token-store.ts",
      code: `import * as SecureStore from "expo-secure-store";

const KEY = "tenementary_access_token";

let cached: string | null = null;   // Keychain reads are async and not free.

export async function writeAccessToken(token: string) {
  cached = token;
  await SecureStore.setItemAsync(KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function readAccessToken(): Promise<string | null> {
  if (cached) return cached;
  try {
    cached = await SecureStore.getItemAsync(KEY);
    return cached;
  } catch {
    // A keychain failure must never poison the cache — return null and let
    // the caller fall back to an anonymous session.
    return null;
  }
}

export async function clearAccessToken() {
  cached = null;
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    /* already gone */
  }
}`,
    },

    {
      t: "image",
      src: "/images/mobile_app_login.png",
      caption:
        "The login screen. Password and OTP are both offered, and the four demo accounts are listed so the app can be explored without creating anything.",
      alt: "Mobile app login screen",
      size: "phone",
    },

    {
      t: "image",
      src: "/images/mobile_app_register.png",
      caption:
        "Registration. The role picker offers buyer, renter, agent and landlord — admin is deliberately absent from every public signup form in all three front ends.",
      alt: "Mobile app registration screen",
      size: "phone",
    },

    { t: "h3", text: "Bootstrap and resilience" },

    {
      t: "p",
      text: "On launch the store calls `GET /auth/me` to decide which navigator to mount. It behaves differently from the web app in two deliberate ways:",
    },

    {
      t: "ul",
      items: [
        '**A `status: 0` error is retried once.** On a device the API host is often not resolvable on the very first frame — the network interface is still coming up. One retry distinguishes "not ready yet" from "not reachable".',
        "**Credentials are cleared only on 401 or 403.** Any other failure leaves the stored token in place, so a flaky network never logs the user out.",
      ],
    },

    {
      t: "code",
      lang: "ts",
      title: "src/store/auth-store.ts",
      code: `bootstrap: async () => {
  set({ status: "loading" });

  const token = await readAccessToken();
  if (!token) {
    set({ status: "unauthenticated" });
    return;
  }

  try {
    const user = await withRetry(authApi.me, { retries: 1 });
    set({ user, status: "authenticated" });
  } catch (error) {
    const status = (error as ApiError).status;

    if (status === 401 || status === 403) {
      // Genuinely rejected — drop the token and start signed out.
      await clearAccessToken();
      set({ status: "unauthenticated" });
    } else {
      // status 0 or 5xx: the network or the server, not the credentials.
      // Keep the token so a retry can succeed later.
      set({ status: "unauthenticated" });
    }
  },
}`,
    },

    { t: "h2", text: "Every screen" },

    { t: "h3", text: "Properties" },

    {
      t: "p",
      text: "The app's landing tab. A search field, the result list, and the entry point to the filter sheet. `useSearchResults` is the hook that makes the list and the map share one query, so switching tabs never refetches.",
    },

    {
      t: "image",
      src: "/images/mobile_app_properties.png",
      caption:
        "The properties tab — search, sort and the result list, with the filter sheet one tap away.",
      alt: "Mobile app properties list",
      size: "phone",
    },

    { t: "h3", text: "Filters" },

    {
      t: "p",
      text: "`components/search/filter-sheet.tsx` wraps a gluestack `Actionsheet`, which is the native-appropriate pattern for a bottom sheet on mobile. It carries the same facets as the web filter panel — purpose, type, price band, bedrooms, furnishing, amenities — and writes into the same shared search store shape.",
    },

    {
      t: "image",
      src: "/images/mobile_app_filters.png",
      caption:
        "The filter sheet. The same facets as the web app's panel, presented as a native bottom sheet with a live result count.",
      alt: "Mobile app filter bottom sheet",
      size: "phone",
    },

    { t: "h3", text: "Property detail" },

    {
      t: "p",
      text: "At 895 lines this is the largest screen in the mobile app, and it is the mobile counterpart of the web detail page: gallery, spec facts, a native map, price history, building reviews, similar homes, an enquiry sheet and a message sheet.",
    },

    {
      t: "image",
      src: "/images/mobile_app_property_detail.png",
      caption:
        "Property detail — the full-bleed gallery with a thumbnail strip, followed by the specification facts and the price trend.",
      alt: "Mobile app property detail screen",
      size: "phone",
    },

    {
      t: "image",
      src: "/images/mobile_app_property_detail_2.png",
      caption:
        "Continuing down the same screen — the native map, resident reviews and the similar-homes carousel.",
      alt: "Mobile app property detail lower section",
      size: "phone",
    },

    {
      t: "callout",
      kind: "info",
      title: "The gallery has no pager",
      text: "`PropertyGallery` is a full-bleed hero with a thumbnail strip and a tap-to-open full-screen viewer — deliberately not a swipeable pager. A horizontal pager inside a horizontally scrollable page fights the user's gesture on both axes. The viewer takes the swipe, the page takes the scroll.",
    },

    { t: "h3", text: "Map" },

    {
      t: "p",
      text: 'A standalone map tab using `react-native-maps`. Panning updates the centre but does not refetch; a "Search this area" button commits the new centre to the search store. That two-step is deliberate — auto-searching on every pan would fire dozens of requests while a thumb drags across a city.',
    },

    {
      t: "callout",
      kind: "tip",
      title: "There is a web variant",
      text: "`property-map.web.tsx` renders a static map instead, because `react-native-maps` has no web implementation. Expo's web output therefore works for the whole app except live interactive maps. That is the one place the `.web.tsx` convention earns its keep in this project.",
    },

    { t: "h3", text: "Chats" },

    {
      t: "image",
      src: "/images/mobile_app_chats.png",
      caption:
        "The chat inbox. Conversation rows resolve participants that may be raw ids or populated documents, and show the linked listing inline when a thread is attached to a property.",
      alt: "Mobile app chat inbox",
      size: "phone",
    },

    {
      t: "p",
      text: "The inbox handles the same shape variation as the server: a participant can be a bare `userId` or a populated profile carrying `name` and `avatar`. Each row renders whichever is available, and falls back to an initial-based avatar when neither is.",
    },

    { t: "h3", text: "Conversation" },

    {
      t: "image",
      src: "/images/mobile_app_chat_detail.png",
      caption:
        "A conversation thread. Messages arrive live over the socket, typing indicators show as they are relayed, and the tab bar hides so the thread gets the full screen.",
      alt: "Mobile app chat conversation thread",
      size: "phone",
    },

    {
      t: "p",
      text: "The 535-line thread screen is the app's realtime centrepiece and the clearest demonstration of the socket layer anywhere in the project.",
    },

    {
      t: "p",
      text: "On focus it joins the conversation room and subscribes to `message:new`, `typing` and `notification:new`. Each keystroke emits `typing`; incoming typing events drive an indicator. On blur it leaves the room. REST remains available as a fallback — `conversationApi.messages` with a `before` cursor for pagination, and `markRead` on focus.",
    },

    {
      t: "code",
      lang: "tsx",
      title: "src/app/(tabs)/chats/[id].tsx — the realtime lifecycle",
      code: `export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { setIsTabBarHidden } = useTabBar();

  // Hide the tab bar so the thread is full-bleed.
  React.useEffect(() => { setIsTabBarHidden(true); }, []);

  React.useEffect(() => {
    joinConversation(id);

    // Live messages arrive through the socket, not by polling.
    const offMessage = onSocket("message:new", (message) => {
      if (message.conversationId !== id) return;
      setMessages((current) => appendSorted(current, message));
    });

    const offTyping = onSocket("typing", ({ userId, conversationId }) => {
      if (conversationId !== id || userId === currentUserId) return;
      setTypingUserId(userId);
    });

    return () => {
      offMessage();
      offTyping();
      leaveConversation(id);
    };
  }, [id]);

  return (
    <Screen>
      <MessageList messages={rows} typingUserId={typingUserId} />

      <Input
        value={draft}
        onChangeText={(text) => {
          setDraft(text);
          sendTyping(id);          // tell the other side
        }}
        onSubmitEditing={handleSend}
      />
    </Screen>
  );
}`,
    },

    {
      t: "p",
      text: "A `buildRows()` helper post-processes the message array for presentation: it inserts WhatsApp-style day dividers and visually groups messages sent within five minutes of each other, so a burst of short messages reads as one block rather than a column of fragments.",
    },

    { t: "h2", text: "Saved and profile" },

    { t: "h3", text: "Saved" },

    {
      t: "image",
      src: "/images/mobile_app_saved.png",
      caption:
        "The saved tab. The shortlist resolves full listing details eagerly for the first 24 cards, so every entry shows a real image and price without a spinner per row.",
      alt: "Mobile app saved properties tab",
      size: "phone",
    },

    {
      t: "image",
      src: "/images/mobile_app_saved_search.png",
      caption:
        'Saved searches live on the same tab, with their alert frequency and a one-tap "run" that loads the results.',
      alt: "Mobile app saved searches",
      size: "phone",
    },

    {
      t: "callout",
      kind: "info",
      title: "Why 24",
      text: "The shortlist fetches full details for the first 24 cards and falls back to the summary data from the favourites response beyond that. Twenty-four is roughly two screens of a phone — enough that the user never notices the boundary, small enough that the fan-out stays cheap.",
    },

    { t: "h3", text: "Profile" },

    {
      t: "image",
      src: "/images/mobile_app_profile.png",
      caption:
        "The profile tab — role-aware destinations, so a buyer and an agent see different navigation.",
      alt: "Mobile app profile screen",
      size: "phone",
    },

    {
      t: "image",
      src: "/images/mobile_app_profile_2.png",
      caption: "Account settings below the profile header.",
      alt: "Mobile app profile settings",
      size: "phone",
    },

    {
      t: "image",
      src: "/images/mobile_app_profile_portfolio.png",
      caption:
        "For listers the profile tab also surfaces their portfolio: listing count, portfolio value and their enquiry pipeline.",
      alt: "Mobile app profile portfolio for listers",
      size: "phone",
    },

    {
      t: "p",
      text: "The profile screen calls `dashboardApi.generic()` and `profileApi.me()` in parallel, then renders a role-aware destination list. A buyer's list leads to their dashboard and shortlist; an agent's adds listings, media management and enquiries.",
    },

    { t: "h2", text: "Stack screens" },

    {
      t: "p",
      text: "Everything above the tab bar is pushed onto the root stack and listed in `APP_SCREENS`. These are the routes a user reaches but does not live in.",
    },

    {
      t: "table",
      columns: ["Route", "Screen", "Notes"],
      rows: [
        [
          "`/dashboard`",
          "`dashboard.tsx` — 478 lines",
          "Calls `dashboardApi.admin()`, `.agent()` or `.buyer()` based on role rather than the generic dispatcher.",
        ],
        [
          "`/listings`",
          "`listings/index.tsx`",
          "Own stock with inline status change and delete. `STATUSES` is the same five-state enum as the server.",
        ],
        [
          "`/listings/new`",
          "`listings/new.tsx`",
          "17 lines — renders the shared `ListingForm`.",
        ],
        [
          "`/listings/:id/edit`",
          "`listings/[id]/edit.tsx`",
          "30 lines — seeds the same form from `propertyApi.detail`.",
        ],
        [
          "`/listings/:id/media`",
          "`listings/[id]/media.tsx`",
          "313 lines of hosted-URL media management with drag reordering.",
        ],
        [
          "`/inquiries`",
          "`inquiries.tsx`",
          "The lead pipeline, same three states as the web app.",
        ],
        ["`/saved-searches`", "`saved-searches.tsx`", "Full CRUD plus run."],
        [
          "`/notifications`",
          "`notifications.tsx`",
          "Refetches on `notification:new`, not just on mount.",
        ],
        ["`/reviews`", "`reviews.tsx`", "Your reviews, with delete."],
        [
          "`/areas`, `/buildings`, `/agencies`",
          "index + `[id]` for each",
          "The reference directories, mirroring the web app.",
        ],
        [
          "`/profiles/:userId`",
          "`profiles/[userId].tsx`",
          "Public profile view.",
        ],
      ],
    },

    {
      t: "callout",
      kind: "tip",
      title: "Two tiny screens, on purpose",
      text: "`listings/new.tsx` is 17 lines and `listings/[id]/edit.tsx` is 30 because both delegate entirely to `features/listings/listing-form.tsx`. File-based routing makes it natural to give each URL its own file, and a shared component keeps the logic in one place. This is the pattern to copy when adding screens.",
    },

    { t: "h2", text: "Components" },

    {
      t: "p",
      text: "gluestack-ui is a copy-paste library, so `components/ui/` contains the generated sources alongside five app-level wrappers that give the app a consistent vocabulary. Feature code imports the wrappers, never the generated files directly.",
    },

    {
      t: "table",
      columns: ["Wrapper", "Exports"],
      rows: [
        [
          "`ui/primitives.tsx`",
          "`Txt`, `Card`, `Divider`, `Badge`, `Button`, `IconButton`, `Chip`, `FilterChip`, `ChipRow`, `Segmented`, `Avatar`, `Tone`",
        ],
        ["`ui/form.tsx`", "`Field`, `Input`, `Select`"],
        [
          "`ui/feedback.tsx`",
          "`LoadingBlock`, `ErrorState`, `EmptyState`, `SectionHeading`, `KeyValue`, `StatTile`, `Distribution`, `Pagination`, `ListRow`, `SectionCard`",
        ],
        ["`ui/screen.tsx`", "`Screen`, `ScreenHeader`"],
        ["`ui/toaster.tsx`", "`Toaster`"],
      ],
    },

    {
      t: "p",
      text: "The generated gluestack sources number around 30 files across `button`, `card`, `input`, `select`, `modal`, `actionsheet`, `alert`, `avatar`, `badge`, `toast`, `skeleton`, `slider`, `switch`, `form-control` and their `.web` variants.",
    },

    {
      t: "callout",
      kind: "info",
      title: "What the wrappers buy",
      text: "Without them, every screen would compose raw gluestack primitives at slightly different sizes and spacings — the classic way a component library erodes into visual noise across an app. `Txt` in particular means nobody hand-rolls a `Text` with a one-off font size, which is how type systems stay consistent.",
    },

    { t: "h2", text: "Theming" },

    {
      t: "p",
      text: "Two layers. `global.css` declares the UniWind theme as shadcn-style space-separated RGB triplets under `@layer theme`, so Tailwind opacity modifiers like `bg-primary/10` work. `theme.ts` mirrors the same tokens as hex values for the places that need imperative colours — map markers, the tab bar tint.",
    },

    {
      t: "code",
      lang: "css",
      title: "src/global.css",
      code: `@layer theme {
  :root {
    @variant light {
      --color-background: 250 250 248;
      --color-foreground: 28 33 30;
      --color-primary: 14 159 110;         /* #0E9F6E */
      --color-muted: 243 244 242;
      --color-border: 226 229 226;
    }

    @variant dark {
      --color-background: 18 24 22;
      --color-foreground: 240 244 242;
      --color-primary: 45 190 140;
      --color-muted: 30 37 34;
      --color-border: 44 52 49;
    }
  }
}`,
    },

    {
      t: "p",
      text: "Using RGB triplets rather than hex is the detail that matters: Tailwind's opacity modifier works by injecting an alpha channel into the channel values, and it can only do that if the variable is three space-separated numbers.",
    },

    {
      t: "code",
      lang: "ts",
      title: "src/theme.ts — the imperative mirror",
      code: `export const lightTheme = {
  background: "#fafaf8",
  foreground: "#1c211e",
  primary: "#0E9F6E",
  border: "#e2e5e2",
  tabBarTint: "#0E9F6E",
};

export const darkTheme = {
  background: "#121816",
  foreground: "#f0f4f2",
  primary: "#2dbe8c",
  border: "#2c3431",
  tabBarTint: "#2dbe8c",
};

export function useTheme() {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkTheme : lightTheme;
}`,
    },

    {
      t: "callout",
      kind: "info",
      title: '"Ivory & Emerald"',
      text: "The emerald `#0E9F6E` is the product's identity colour — it appears in the adaptive icon, the splash screen, the tab bar tint and the sign-in button. It is the same hue as the web app's `--primary` at `oklch(0.56 0.115 166)`, expressed differently for each platform's colour model.",
    },

    { t: "h2", text: "State and networking" },

    {
      t: "p",
      text: "Four Zustand stores with the same contracts as the web app — `auth-store`, `favorites-store`, `search-store` and `toast-store` — plus the shared `queryStore` and `apiCache`. The token backend and the socket layer are the two places where the mobile copies genuinely diverge.",
    },

    { t: "h3", text: "Resolving the API host" },

    {
      t: "p",
      text: "A phone cannot reach `localhost` on your development machine. `resolveBaseUrl()` therefore prefers `EXPO_PUBLIC_API_URL`, and when that is absent it derives the LAN IP from Metro's `hostUri` — which is the machine already serving the bundle.",
    },

    {
      t: "code",
      lang: "ts",
      title: "src/lib/api-client.ts",
      code: `const DEFAULT_PORT = 4000;

function resolveBaseUrl() {
  // 1. An explicit override always wins.
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Derive the LAN address from Metro's own host.
  const hostUri = Constants.expoConfig?.hostUri;      // e.g. "192.168.1.24:8081"
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return \`http://\${host}:\${DEFAULT_PORT}/api/v1\`;
  }

  // 3. Last resort — simulators only.
  return \`http://localhost:\${DEFAULT_PORT}/api/v1\`;
}

const BASE_URL = resolveBaseUrl();

// The socket lives on the same origin, without the /api/v1 prefix.
const SOCKET_URL = BASE_URL.replace(/\\/api\\/v1$/, "");`,
    },

    {
      t: "callout",
      kind: "warn",
      title: "Cleartext HTTP on Android",
      text: "Android blocks plain HTTP by default, so `app.json` enables `usesCleartextTraffic` through the `expo-build-properties` plugin and requests `ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION`. Both are development conveniences — a production build should be HTTPS-only and should drop the cleartext exception.",
    },

    { t: "h3", text: "The socket client" },

    {
      t: "code",
      lang: "ts",
      title: "src/lib/socket.ts",
      code: `export function connectSocket() {
  const token = getAccessToken();
  if (!token) return;

  socket = io(SOCKET_URL, {
    auth: { token },
    // React Native has no XMLHttpRequest long-polling, so websocket
    // must be forced rather than left to auto-discovery.
    transports: ["websocket"],
    reconnectionAttempts: 8,
  });
}

// A tiny pub/sub so screens never need to know about the socket instance.
export function onSocket(event: SocketEvent, listener: (payload: any) => void) {
  const wrapped = (payload: any) => listener(payload);
  socket?.on(event, wrapped);
  return () => socket?.off(event, wrapped);
}`,
    },

    {
      t: "p",
      text: "The pub/sub wrapper is what keeps the thread screen readable. The screen subscribes to an event name and gets an unsubscribe function back; it never touches `socket.on` or `socket.off`, so a re-render can never leak a listener.",
    },

    { t: "h2", text: "Running the mobile app" },

    {
      t: "code",
      lang: "bash",
      title: "Terminal",
      code: `# The API must be reachable from the device
cd server && npm start

# The mobile app
cd client/mobileApp
echo "EXPO_PUBLIC_API_URL=http://192.168.1.24:4000/api/v1" > .env
npm start        # then press i, a, or scan the QR code`,
    },

    {
      t: "callout",
      kind: "danger",
      title: "Use your LAN IP, not localhost",
      text: "Setting `EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1` and running on a physical device means the app is looking for the server on the phone itself. It will fail, and the failure looks like a CORS problem rather than a networking one. Use the machine's LAN address, or omit the variable entirely and let Metro's `hostUri` derivation handle it.",
    },

    {
      t: "p",
      text: "That completes the storybook. If you read front to back you have now seen the same platform described from the database upwards: fifteen collections, fifty-one endpoints and one socket gateway on the server; then the operator's view; then the public web; then the mobile app.",
    },

    { t: "hr" },

    { t: "h2", text: "Where to go next" },

    {
      t: "cards",
      cols: 3,
      items: [
        {
          title: "Read the source",
          text: "Every claim in this documentation points at a real file in the repository. Start from `server.js` and follow the imports.",
          href: "https://github.com/NaveenMathramkott/Tenementary-property-finder",
        },
        {
          title: "Run the live API docs",
          text: "Start the server and open `/api-docs` for the generated OpenAPI reference — 51 endpoints with request and response schemas.",
          href: "/docs/backend#h2-swagger-and-openapi",
        },
        {
          title: "Extend it",
          text: "The cleanest entry points are a new resource with its own model, router and controller, plus a page in whichever front end needs it.",
          href: "/docs/backend#h2-project-structure",
        },
      ],
    },

    {
      t: "callout",
      kind: "tip",
      title: "Use this freely",
      text: "This storybook was written to be read, copied and adapted for teaching. Everything in it describes the open-source Tenementary repository — take the structure, the patterns and the diagrams for your own learning projects.",
    },
  ],
};
