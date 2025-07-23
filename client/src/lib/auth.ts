import { apiRequest } from "./queryClient";
import type { LoginRequest } from "@shared/schema";

export const authApi = {
  login: async (credentials: LoginRequest) => {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    return response.json();
  },

  logout: async () => {
    const response = await apiRequest("POST", "/api/auth/logout");
    return response.json();
  },

  getCurrentUser: async () => {
    try {
      const response = await apiRequest("GET", "/api/auth/me");
      return response.json();
    } catch (error: any) {
      if (error.message?.includes("401")) {
        return null;
      }
      throw error;
    }
  },
};
