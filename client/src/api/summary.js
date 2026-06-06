import { useQuery } from "@tanstack/react-query";
import api from "./client.js";

export function useCycleSummary(params = {}) {
  return useQuery({
    queryKey: ["summary", "cycle", params],
    queryFn: () => api.get("/summary/cycle", { params }).then((r) => r.data),
  });
}

export function useChartData(params = {}) {
  return useQuery({
    queryKey: ["summary", "chart", params],
    queryFn: () => api.get("/summary/chart", { params }).then((r) => r.data),
  });
}

export function useTrend() {
  return useQuery({
    queryKey: ["summary", "trend"],
    queryFn: () => api.get("/summary/trend").then((r) => r.data),
  });
}
