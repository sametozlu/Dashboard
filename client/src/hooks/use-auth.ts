import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { LoginRequest } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: authApi.getCurrentUser,
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 5 * 60 * 1000, // 5 dakika
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: t.loginSuccessTitle || "Giriş Başarılı",
        description: t.loginSuccessMessage || "Netmon sistemine hoş geldiniz",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: t.loginErrorTitle || "Giriş Hatası",
        description: error.message || t.loginErrorMessage || "Giriş yapılırken bir hata oluştu",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Çıkış Yapıldı",
        description: "Güvenli bir şekilde çıkış yapıldı",
      });
    },
  });

  const login = (credentials: LoginRequest) => {
    loginMutation.mutate(credentials);
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: user?.user,
    isLoading,
    isAuthenticated: !!user?.user,
    login,
    logout,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
