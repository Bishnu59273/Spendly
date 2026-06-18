import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRegisterSW } from "virtual:pwa-register/react";
import App from "./App.jsx";
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
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SWUpdater />
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
