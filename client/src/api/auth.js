import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./client.js";
import { unsubscribeFromPush } from "../utils/push.js";

function saveToken(data) {
  if (data?.token) localStorage.setItem("spendly_token", data.token);
}

function clearSessionKeys() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith("sp_"))
    .forEach((k) => localStorage.removeItem(k));
}

// A prior account's push subscription can linger in the browser (it isn't
// tied to our login state) if they never hit the logout button — e.g. a
// token expired and force-redirected to /login. Clear it out so a new
// session on this device doesn't inherit someone else's subscription.
function clearStalePush() {
  unsubscribeFromPush().catch(() => {});
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
      clearSessionKeys();
      clearStalePush();
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
      clearSessionKeys();
      clearStalePush();
      saveToken(data);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Push subscriptions live at the browser level, not per-login — unsubscribe
      // here so the next account on this device/browser starts with a clean slate.
      try {
        const endpoint = await unsubscribeFromPush();
        if (endpoint) await api.post("/push/unsubscribe", { endpoint });
      } catch {
        // best-effort — don't block logout on push cleanup failing
      }
      return api.post("/auth/logout");
    },
    onSuccess: () => {
      localStorage.removeItem("spendly_token");
      qc.clear();
      window.location.href = "/login";
    },
  });
}

export function useUpdateOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch("/auth/onboarding", data).then((r) => r.data),
    onSuccess: (data) => qc.setQueryData(["me"], data),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch("/auth/me", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data) => api.patch("/auth/password", data).then((r) => r.data),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data) => api.post("/auth/forgot-password", data).then((r) => r.data),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data) => api.post("/auth/reset-password", data).then((r) => r.data),
  });
}

export function useValidateResetToken(token) {
  return useQuery({
    queryKey: ["reset-token", token],
    queryFn: () =>
      api.get("/auth/reset-password/validate", { params: { token } }).then((r) => r.data),
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
