import { Redirect } from "expo-router";

/** Anchor for the auth group so the stack always has a first available screen. */
export default function AuthIndex() {
  return <Redirect href="/login" />;
}
