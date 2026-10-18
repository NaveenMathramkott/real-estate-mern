import * as SecureStore from "expo-secure-store";

/** SecureStore keys may only contain alphanumerics, `.`, `-` and `_`. */
export const ACCESS_TOKEN_KEY = "tenementary_access_token";

let cached: string | null | undefined;
let inflight: Promise<string | null> | undefined;

/** Reads the access token, keeping it in memory after the first read so the
 *  request interceptor never pays a keychain round trip on every call. */
export async function readAccessToken() {
  if (cached !== undefined) return cached;
  inflight ??= SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
    .then((value) => {
      cached = value;
      return value;
    })
    .catch(() => {
      // Deliberately not memoised: a keychain read that fails once (locked
      // device, transient error) must not look like "no token" for the rest of
      // the session, or every later request would go out unauthenticated.
      return null;
    })
    .finally(() => {
      inflight = undefined;
    });
  return inflight;
}

export async function writeAccessToken(token: string | null) {
  cached = token;
  try {
    if (token) await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    // A locked keychain must never take the whole app down; the in-memory value
    // still authenticates for this session and the next bootstrap re-reads.
  }
}
