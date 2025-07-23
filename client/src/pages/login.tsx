import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { LanguageSelector } from "@/components/language-selector";
import { loginSchema, type LoginRequest } from "@shared/schema";
import netmonLogo from "@assets/Kwc_Netmon_Logo_Siyah_1749623422136.png";

export default function Login() {
  const { login, isLoggingIn } = useAuth();
  const { t } = useLanguage();
  
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginRequest) => {
    login(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-netmon-blue to-blue-800 flex items-center justify-center p-4">
      {/* Language selector in top right corner */}
      <div className="absolute top-4 right-4">
        <LanguageSelector variant="ghost" showText={false} />
      </div>
      
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img src={netmonLogo} alt="Netmon Logo" className="h-16 w-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.systemLogin}</h1>
            <p className="text-gray-600">{t.welcomeMessage}</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                {t.username}
              </Label>
              <Input
                id="username"
                type="text"
                placeholder={t.enterUsername}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-netmon-blue focus:border-transparent"
                {...form.register("username")}
              />
              {form.formState.errors.username && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t.password}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={t.enterPassword}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-netmon-blue focus:border-transparent"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-netmon-blue text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-netmon-blue focus:ring-offset-2 transition-colors"
            >
              {isLoggingIn ? t.loggingIn : t.login}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">{t.demoCredentials}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
