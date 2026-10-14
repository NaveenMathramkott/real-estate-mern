import { ArrowRightIcon, CheckIcon } from "lucide-react";
import * as React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { AuthShell } from "@/pages/login-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";
import {
  ROLE_BLURBS,
  ROLE_LABELS,
  SELECTABLE_ROLES,
  homeRouteFor,
} from "@/lib/roles";
import { CURRENCIES } from "@/lib/constants";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const register = useAuthStore((s) => s.register);
  const error = useAuthStore((s) => s.error);
  const status = useAuthStore((s) => s.status);
  const clearError = useAuthStore((s) => s.clearError);

  const requestedRole = params.get("role");
  const [role, setRole] = React.useState<Role>(
    (SELECTABLE_ROLES.find((value) => value === requestedRole) ??
      "buyer") as Role,
  );
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    currency: "INR",
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    try {
      const user = await register({
        email: form.email,
        password: form.password,
        name: form.name || undefined,
        role,
        currency: form.currency,
        locale: "en",
      });
      navigate(homeRouteFor(user.role), { replace: true });
    } catch {
      /* surfaced by the store */
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free, and it takes about twenty seconds."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2.5">
          <Label>I am joining as</Label>
          <div className="grid grid-cols-2 gap-2">
            {SELECTABLE_ROLES.map((option) => {
              const active = role === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setRole(option)}
                  className={cn(
                    "flex cursor-pointer flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                    active
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/30 hover:bg-accent/40",
                  )}
                >
                  <span className="flex w-full items-center justify-between">
                    <span className="text-sm font-medium">
                      {ROLE_LABELS[option]}
                    </span>
                    {active && <CheckIcon className="text-primary size-4" />}
                  </span>
                  <span className="text-muted-foreground text-xs leading-snug">
                    {ROLE_BLURBS[option]}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-muted-foreground text-xs">
            You can list a property straight away if you chose agent or
            landlord.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(event) => set("name")(event.target.value)}
            placeholder="Asha Menon"
            autoComplete="name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(event) => set("email")(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(event) => set("password")(event.target.value)}
              placeholder="Passw0rd!"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              value={form.currency}
              onChange={(event) => set("currency")(event.target.value)}
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-destructive bg-destructive/8 rounded-lg px-3 py-2 text-sm">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Creating account…" : "Create account"}
          <ArrowRightIcon />
        </Button>

        <p className="text-muted-foreground text-xs leading-relaxed">
          By joining you agree to be contacted about listings you enquire on.
          Access and refresh tokens are stored as httpOnly cookies.
        </p>
      </form>
    </AuthShell>
  );
}
