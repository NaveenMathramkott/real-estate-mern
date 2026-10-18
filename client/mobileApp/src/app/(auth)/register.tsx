import { useRouter } from "expo-router";
import * as React from "react";
import { StyleSheet, View } from "react-native";

import { CURRENCIES, LOCALES } from "@/lib/constants";
import {
  homeRouteFor,
  ROLE_BLURBS,
  ROLE_LABELS,
  SELECTABLE_ROLES,
} from "@/lib/roles";
import type { Role } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { useTheme } from "@/theme";
import { Button, Chip, Txt } from "@/components/ui/primitives";
import { Field, Input, Select } from "@/components/ui/form";
import { Screen } from "@/components/ui/screen";

/** Self-service signup. `admin` is excluded until the API restricts role choice. */
export default function RegisterScreen() {
  const theme = useTheme();
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const error = useAuthStore((state) => state.error);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("buyer");
  const [locale, setLocale] = React.useState("en");
  const [currency, setCurrency] = React.useState("INR");
  const [pending, setPending] = React.useState(false);

  const submit = async () => {
    setPending(true);
    try {
      const user = await register({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
        role,
        locale,
        currency,
      });
      router.replace(homeRouteFor(user.role) as never);
    } catch {
      /* surfaced by the store */
    } finally {
      setPending(false);
    }
  };

  return (
    <Screen scroll contentStyle={styles.scroll}>
      <View style={{ gap: 6 }}>
        <Txt variant="display">Create your account</Txt>
        <Txt variant="small" tone="muted">
          Your role decides what you can do — listers publish stock, everyone
          can shortlist and message.
        </Txt>
      </View>

      <Field label="Full name" hint="Creates a linked public profile.">
        <Input value={name} onChangeText={setName} placeholder="Agent One" />
      </Field>

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

      <Field label="Password" required hint="At least 8 characters.">
        <Input
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholder="••••••••"
        />
      </Field>

      <View style={{ gap: 8 }}>
        <Txt variant="small" tone="muted">
          I am a
        </Txt>
        <View style={styles.roleRow}>
          {SELECTABLE_ROLES.map((option) => (
            <Chip
              key={option}
              label={ROLE_LABELS[option]}
              selected={role === option}
              onPress={() => setRole(option)}
            />
          ))}
        </View>
        <Txt variant="tiny" tone="muted">
          {ROLE_BLURBS[role]}
        </Txt>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Select
            label="Language"
            value={locale}
            onSelect={setLocale}
            options={LOCALES.map((value) => ({
              value,
              label: value.toUpperCase(),
            }))}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Select
            label="Currency"
            value={currency}
            onSelect={setCurrency}
            options={CURRENCIES.map((value) => ({ value, label: value }))}
          />
        </View>
      </View>

      {error ? (
        <View
          style={[styles.error, { backgroundColor: theme.destructiveSoft }]}
        >
          <Txt variant="small" tone="destructive">
            {error}
          </Txt>
        </View>
      ) : null}

      <Button
        title="Create account"
        onPress={() => void submit()}
        loading={pending}
        disabled={!email.trim() || password.length < 8}
        fullWidth
      />

      <Button
        title="I already have an account"
        variant="ghost"
        onPress={() => router.replace("/login")}
        fullWidth
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 32, gap: 16 },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  row: { flexDirection: "row", gap: 12 },
  error: { padding: 10, borderRadius: 10 },
});
