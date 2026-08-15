import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRegisterSW } from "virtual:pwa-register/react";
import App from "./App.jsx";
import { init as initSyncEngine } from "./lib/syncEngine.js";
import "./index.css";

function SWUpdater() {
  useRegisterSW({
    onNeedRefresh() {
      window.location.reload();
    },
  });
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
    // Mutations manage their own online/offline branching and queuing
    // (see syncEngine.js) - React Query's default networkMode:"online"
    // would otherwise pause mutationFn entirely while offline and never
    // call it, which defeats that logic.
    mutations: { networkMode: "always" },
  },
});

initSyncEngine(queryClient);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SWUpdater />
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
