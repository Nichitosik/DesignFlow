import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gauge, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";

interface RegisterPageProps {
  onNavigateLogin: () => void;
}

export default function RegisterPage({ onNavigateLogin }: RegisterPageProps) {
  const { t } = useI18n();
  const { register, isRegistering, registerError } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [showPassword, setShowPassword] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
    } catch {
      // error shown via registerError
    }
  };

  const errorMsg = registerError
    ? (registerError as Error).message.replace(/^\d+:\s*/, "")
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-chart-2/10">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Gauge className="h-9 w-9 text-primary" />
            <h1 className="text-3xl font-bold">{t("app.name")}</h1>
          </div>
          <p className="text-muted-foreground text-sm">{t("auth.registerTitle")}</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">{t("auth.firstName")}</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={form.firstName}
                  onChange={set("firstName")}
                  autoComplete="given-name"
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">{t("auth.lastName")}</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={set("lastName")}
                  autoComplete="family-name"
                  data-testid="input-last-name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                required
                autoComplete="email"
                data-testid="input-email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="min. 6 characters"
                  value={form.password}
                  onChange={set("password")}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-sm text-destructive" data-testid="text-register-error">{errorMsg}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isRegistering}
              data-testid="button-register"
            >
              {isRegistering ? t("auth.registering") : t("auth.createAccount")}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {t("auth.hasAccount")}{" "}
            <button
              onClick={onNavigateLogin}
              className="text-primary underline-offset-4 hover:underline"
              data-testid="link-login"
            >
              {t("auth.login")}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
