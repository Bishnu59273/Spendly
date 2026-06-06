import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client.js";

function saveToken(data) {
  if (data?.token) localStorage.setItem("spendly_token", data.token);
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api.get("/auth/me").then((r) => r.data),
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/auth/login", data).then((r) => r.data),
    onSuccess: (data) => {
      saveToken(data);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/auth/register", data).then((r) => r.data),
    onSuccess: (data) => {
      saveToken(data);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSuccess: () => {
      localStorage.removeItem("spendly_token");
      qc.clear();
      window.location.href = "/login";
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch("/auth/me", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}
