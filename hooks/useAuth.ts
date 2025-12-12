import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { useAuthStore } from "../stores/useAuthStore";
import * as SecureStore from "expo-secure-store";

interface LoginCredentials {
  email: string;
  password: string;
}

export const useLogin = () => {
  const { setToken, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await api.post("/api/login", credentials);
      return response.data;
    },
    onSuccess: async (data) => {
      await SecureStore.setItemAsync("userToken", data.token);
      setToken(data.token);
      setUser(data.user);
    },
  });
};

export const useProfile = () => {
  const { token, setUser } = useAuthStore();

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await api.get("/api/user/profile");
      return response.data;
    },
    onSuccess: (data) => {
      setUser(data);
    },
    enabled: !!token,
  });
};
