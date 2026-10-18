import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { homeRouteFor } from "@/lib/roles";
import { useAuthStore } from "@/store/auth-store";
import { useTheme } from "@/theme";
import { Button, Chip, Txt } from "@/components/ui/primitives";
import { Field, Input } from "@/components/ui/form";
import { Screen } from "@/components/ui/screen";

const DEMO_ACCOUNTS = [
  { role: "Buyer", email: "buyer@example.com" },
  { role: "Renter", email: "renter@example.com" },
  { role: "Agent", email: "agent@example.com" },
  { role: "Landlord", email: "landlord@example.com" },
];

/** Password sign-in plus the Redis-backed OTP flow, mirroring the web login page. */
export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const sendOtp = useAuthStore((state) => state.sendOtp);
  const loginWithOtp = useAuthStore((state) => state.loginWithOtp);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const otpEmail = useAuthStore((state) => state.otpEmail);

  const [mode, setMode] = React.useState<"password" | "otp">("password");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const finish = (role: Parameters<typeof homeRouteFor>[0]) =>
    router.replace(homeRouteFor(role) as never);

  const submitPassword = async () => {
    setPending(true);
    try {
      const user = await login(email.trim(), password);
      finish(user.role);
    } catch {
      /* the store already surfaced the message */
    } finally {
      setPending(false);
    }
  };

  const requestOtp = async () => {
    setPending(true);
    try {
      await sendOtp(email.trim());
    } catch {
      /* surfaced by the store */
    } finally {
      setPending(false);
    }
  };

  const submitOtp = async () => {
    setPending(true);
    try {
      const user = await loginWithOtp(email.trim(), otp.trim());
      finish(user.role);
    } catch {
      /* surfaced by the store */
    } finally {
      setPending(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.scroll}>
      <View style={styles.hero}>
        <Txt variant="display">Welcome back</Txt>
        <Txt variant="small" tone="muted">
          Sign in to shortlist, save searches and message agents directly.
        </Txt>
      </View>

      <View style={styles.modes}>
        <Chip
          label="Password"
          selected={mode === "password"}
          onPress={() => {
            clearError();
            setMode("password");
          }}
        />
        <Chip
          label="One-time code"
          selected={mode === "otp"}
          onPress={() => {
            clearError();
            setMode("otp");
          }}
        />
      </View>

      <Field label="Email" required>
        <Input
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholder="you@example.com"
        />
      </Field>

      {mode === "password" ? (
        <>
          <Field label="Password" required>
            <Input
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              placeholder="••••••••"
              onSubmitEditing={() => void submitPassword()}
            />
          </Field>
          <Button
            title="Sign in"
            onPress={() => void submitPassword()}
            loading={pending}
            disabled={!email.trim() || !password}
            fullWidth
          />
        </>
      ) : (
        <>
          <Field
            label="6-digit code"
            hint="The server needs Redis configured; without it the endpoint returns 503."
          >
            <Input
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              placeholder="123456"
              maxLength={6}
            />
          </Field>
          <Button
            title={otpEmail === email.trim() ? "Verify code" : "Send code"}
            variant={otpEmail === email.trim() ? "primary" : "outline"}
            onPress={() =>
              void (otpEmail === email.trim() ? submitOtp() : requestOtp())
            }
            loading={pending}
            disabled={
              !email.trim() || (otpEmail === email.trim() && otp.length !== 6)
            }
            fullWidth
          />
        </>
      )}

      {error ? (
        <View
          style={[styles.error, { backgroundColor: theme.destructiveSoft }]}
        >
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color={theme.destructive}
          />
          <Txt variant="small" tone="destructive" style={{ flex: 1 }}>
            {error}
          </Txt>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/register")}
        style={{ paddingVertical: 8 }}
      >
        <Txt variant="small" tone="muted" center>
          No account?{" "}
          <Txt variant="small" style={{ color: theme.primary }}>
            Create one
          </Txt>
        </Txt>
      </Pressable>

      <View style={[styles.demo, { borderColor: theme.border }]}>
        <Txt variant="tiny" tone="muted" uppercase>
          Demo accounts
        </Txt>
        <View style={styles.demoRow}>
          {DEMO_ACCOUNTS.map((account) => (
            <Chip
              key={account.email}
              label={account.role}
              onPress={() => {
                setEmail(account.email);
                setPassword("");
                setMode("password");
              }}
            />
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 32, gap: 16, justifyContent: "flex-start" },
  hero: { gap: 6, marginBottom: 4 },
  modes: { flexDirection: "row", gap: 8 },
  error: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  demo: {
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  demoRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
