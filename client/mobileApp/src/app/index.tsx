import { Redirect } from "expo-router";

/**
 * Entry point. The root layout already swaps the whole navigator on sign-in and
 * sign-out, so this simply sends each visitor to the side they belong on.
 */
export default function Index() {
  return <Redirect href="/login" />;
}
