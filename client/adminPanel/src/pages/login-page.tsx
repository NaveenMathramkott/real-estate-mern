import {
  ArrowRightIcon,
  CheckCircle2Icon,
  KeyRoundIcon,
  MailIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import * as React from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/common";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";
import { toast } from "@/store/toast-store";

const highlights = [
  "Verify users, listings and agencies in one queue",
  "Curate areas, buildings and agencies as reference data",
  "Track leads, inquiries and deal value platform-wide",
];

type Mode = "password" | "otp";

export default function LoginPage() {
  const [mode, setMode] = React.useState<Mode>("password");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");

  const login = useAuthStore((s) => s.login);
  const loginWithOtp = useAuthStore((s) => s.loginWithOtp);
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const otpEmail = useAuthStore((s) => s.otpEmail);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const status = useAuthStore((s) => s.user);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  const navigate = useNavigate();
  const location = useLocation();
  const pending = useAuthStore((s) => s.status === "loading");
  const [otpSent, setOtpSent] = React.useState(false);

  if (status) {
    return <Navigate to="/" replace />;
  }

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

  const handlePasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await login(email.trim(), password);
      toast.success("Welcome back", "Signed in to the admin console.");
      navigate(redirectTo, { replace: true });
    } catch {
      /* error surfaced through store */
    }
  };

  const handleSendOtp = async () => {
    try {
      await sendOtp(email.trim());
      setOtpSent(true);
      toast.success("OTP sent", "Check the server logs for the 6-digit code.");
    } catch {
      /* handled */
    }
  };

  const handleOtpLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await loginWithOtp(email.trim(), otp.trim());
      toast.success("Verified", "Account verified and signed in.");
      navigate(redirectTo, { replace: true });
    } catch {
      /* handled */
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-muted/40 relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <div className="grid-dots pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="from-primary to-primary/60 text-primary-foreground shadow-primary/30 flex size-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg">
              <span className="font-bold">T</span>
            </div>
            <div>
              <p className="font-semibold tracking-tight">Tenementary</p>
              <p className="text-muted-foreground text-xs">Admin console</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <div className="bg-primary/10 text-primary mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
            <SparklesIcon className="size-3.5" />
            Platform operations, simplified
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            Run the whole property marketplace from one console.
          </h1>
          <ul className="mt-6 space-y-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2Icon className="text-success mt-0.5 size-4 shrink-0" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-muted-foreground relative text-xs">
          73 operations · 54 paths · Express + MongoDB + Redis
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="from-primary to-primary/60 text-primary-foreground flex size-9 items-center justify-center rounded-xl bg-gradient-to-br">
                <span className="font-bold">T</span>
              </div>
              <p className="font-semibold tracking-tight">Tenementary</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-muted-foreground"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </Button>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="flex-col items-start gap-1">
              <div className="bg-primary/10 text-primary mb-3 flex size-10 items-center justify-center rounded-xl">
                <ShieldCheckIcon className="size-5" />
              </div>
              <CardTitle className="text-xl">
                {mode === "password"
                  ? "Sign in to continue"
                  : "Verify your account"}
              </CardTitle>
              <CardDescription>
                {mode === "password"
                  ? "Use an admin account to manage the platform."
                  : otpSent
                    ? `Enter the 6-digit code sent to ${otpEmail ?? email}.`
                    : "We will email a 6-digit code to verify your account."}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  {error}
                </Alert>
              )}

              {mode === "password" ? (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <MailIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                      <Input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          clearError();
                        }}
                        placeholder="admin@tenementary.com"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <KeyRoundIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                      <Input
                        id="password"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          clearError();
                        }}
                        placeholder="••••••••"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={pending}>
                    {pending ? <Spinner /> : null}
                    Sign in
                    {!pending && <ArrowRightIcon className="size-4" />}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("otp");
                      clearError();
                    }}
                    className="text-muted-foreground hover:text-foreground w-full cursor-pointer text-center text-xs transition-colors"
                  >
                    Sign in with a one-time code instead
                  </button>
                </form>
              ) : (
                <form onSubmit={handleOtpLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp-email">Email</Label>
                    <Input
                      id="otp-email"
                      type="email"
                      required
                      value={email}
                      disabled={otpSent}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification code</Label>
                    <Input
                      id="otp"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(event) => {
                        setOtp(event.target.value.replace(/\D/g, ""));
                        clearError();
                      }}
                      placeholder="000000"
                      className={cn(
                        "font-mono text-lg tracking-[0.4em] text-center",
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={pending}>
                    {pending ? <Spinner /> : null}
                    Verify and sign in
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={pending}
                    onClick={() => {
                      if (otpSent) {
                        setOtpSent(false);
                        setOtp("");
                      } else {
                        void handleSendOtp();
                      }
                    }}
                  >
                    {otpSent ? "Use a different email" : "Send code"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("password");
                      clearError();
                    }}
                    className="text-muted-foreground hover:text-foreground w-full cursor-pointer text-center text-xs transition-colors"
                  >
                    Back to password sign in
                  </button>
                </form>
              )}
            </CardContent>
          </Card>

          <p className="text-muted-foreground mt-6 text-center text-xs">
            Need an account? Register with role{" "}
            <code className="font-mono">admin</code> through{" "}
            <span className="font-mono">POST /auth/register</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
