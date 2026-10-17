import {
  ArrowRightIcon,
  Building2Icon,
  CheckIcon,
  KeyRoundIcon,
  MailIcon,
} from "lucide-react";

import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";
import { homeRouteFor } from "@/lib/roles";
import type { Role } from "@/lib/types";

const DEMO_HINTS = [
  { role: "buyer", email: "buyer@example.com" },
  { role: "renter", email: "renter@example.com" },
  { role: "agent", email: "agent@example.com" },
  { role: "landlord", email: "landlord@example.com" },
];

/** Split-screen auth shell shared by sign-in and join. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="mx-auto w-full max-w-sm">
        <Logo className="mb-8" />
        <h1 className="font-display text-3xl leading-tight font-medium tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <div className="text-muted-foreground mt-6 text-sm">{footer}</div>
      </div>

      <div className="relative hidden lg:block">
        <div className="bg-primary/8 absolute inset-0 rounded-3xl" />
        <div className="grid-dots absolute inset-0 rounded-3xl opacity-70" />
        <div className="relative space-y-6 p-10">
          <h2 className="font-display text-3xl leading-tight font-medium text-balance">
            One account, four ways to use it.
          </h2>
          <ul className="space-y-4">
            {[
              {
                icon: KeyRoundIcon,
                title: "Buyers & renters",
                copy: "Shortlist homes, save searches and message agents.",
              },
              {
                icon: Building2Icon,
                title: "Agents & landlords",
                copy: "Publish listings and work your lead pipeline.",
              },
              {
                icon: CheckIcon,
                title: "Everyone",
                copy: "Neighbourhood insights, price history and building reviews.",
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="bg-card text-primary flex size-9 shrink-0 items-center justify-center rounded-lg border">
                  <item.icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-muted-foreground text-sm">{item.copy}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const loginWithOtp = useAuthStore((s) => s.loginWithOtp);
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const otpEmail = useAuthStore((s) => s.otpEmail);
  const error = useAuthStore((s) => s.error);
  const status = useAuthStore((s) => s.status);
  const clearError = useAuthStore((s) => s.clearError);

  const [mode, setMode] = React.useState<"password" | "otp">("password");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");

  const from =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const busy = status === "loading";

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    try {
      const user =
        mode === "password"
          ? await login(email, password)
          : await loginWithOtp(email, otp);
      navigate(from === "/login" ? homeRouteFor(user.role) : from, {
        replace: true,
      });
    } catch {
      /* the store already surfaced the message */
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to reach your shortlist, saved searches and messages."
      footer={
        <>
          New here?{" "}
          <Link
            to="/register"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Create a free account
          </Link>
        </>
      }
    >
      <div className="mb-5 inline-flex rounded-lg border p-0.5">
        {(["password", "otp"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setMode(option);
              clearError();
            }}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition ${
              mode === option
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option === "password" ? "Password" : "Email code"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>

        {mode === "password" ? (
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="otp">Six-digit code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="123456"
                className="tracking-[0.4em]"
              />
            </div>
            <Button
              type="button"
              variant="link"
              className="h-auto px-0"
              onClick={() => void sendOtp(email).catch(() => undefined)}
            >
              <MailIcon />
              {otpEmail ? "Resend code" : "Email me a code"}
            </Button>
            <p className="text-muted-foreground text-xs">
              OTP needs Redis on the server. Without it the code is logged
              server-side and verification returns 503.
            </p>
          </>
        )}

        {error && (
          <p className="text-destructive bg-destructive/8 rounded-lg px-3 py-2 text-sm">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
          <ArrowRightIcon />
        </Button>
      </form>

      <div className="mt-8 space-y-2">
        <p className="text-muted-foreground text-xs">
          Seeded accounts, if the database has them:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {DEMO_HINTS.map((hint) => (
            <Badge
              key={hint.role}
              variant="muted"
              className="cursor-pointer"
              onClick={() => setEmail(hint.email)}
            >
              {hint.role}
            </Badge>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}

export type { Role };
