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

interface LoginPageProps {
  onNavigateRegister: () => void;
}

export default function LoginPage({ onNavigateRegister }: LoginPageProps) {
  const { t } = useI18n();
  const { login, isLoggingIn, loginError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
    } catch {
      // error shown via loginError
    }
  };

  const errorMsg = loginError
    ? (loginError as Error).message.replace(/^\d+:\s*/, "")
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
          <p className="text-muted-foreground text-sm">{t("auth.loginTitle")}</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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
              <p className="text-sm text-destructive" data-testid="text-login-error">{errorMsg}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoggingIn}
              data-testid="button-login"
            >
              {isLoggingIn ? t("auth.loggingIn") : t("auth.login")}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <button
              onClick={onNavigateRegister}
              className="text-primary underline-offset-4 hover:underline"
              data-testid="link-register"
            >
              {t("auth.register")}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
