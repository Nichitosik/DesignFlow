import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getToken, setToken, clearToken, apiRequest } from "@/lib/queryClient";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// Dev mode: skip auth entirely — return a mock user always
const DEV_USER: AuthUser = {
  id: "dev-user",
  email: "dev@local",
  firstName: "Dev",
  lastName: "User",
  profileImageUrl: null,
  createdAt: null,
  updatedAt: null,
};

async function fetchUser(): Promise<AuthUser | null> {
  return DEV_USER;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      const data = await res.json();
      setToken(data.token);
      return data.user as AuthUser;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; firstName?: string; lastName?: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      const json = await res.json();
      setToken(json.token);
      return json.user as AuthUser;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
    },
  });

  const logout = () => {
    clearToken();
    queryClient.setQueryData(["/api/auth/user"], null);
    queryClient.clear();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout,
  };
}
