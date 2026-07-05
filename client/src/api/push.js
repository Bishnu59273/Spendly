import { useMutation, useQuery } from "@tanstack/react-query";
import api from "./client.js";

export function useVapidPublicKey() {
  return useQuery({
    queryKey: ["push-vapid-key"],
    queryFn: () => api.get("/push/vapid-public-key").then((r) => r.data.publicKey),
    staleTime: Infinity,
  });
}

export function useSubscribePush() {
  return useMutation({
    mutationFn: (subscription) => api.post("/push/subscribe", subscription).then((r) => r.data),
  });
}

export function useUnsubscribePush() {
  return useMutation({
    mutationFn: (endpoint) => api.post("/push/unsubscribe", { endpoint }).then((r) => r.data),
  });
}
