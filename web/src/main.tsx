import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { ApiError } from "./lib/api";
import { musicPreferred, startMusic } from "./lib/music";

// Someone who left the music on gets it back on their first tap of the next
// visit. Browsers won't allow it any sooner than a gesture, and that's fine.
if (musicPreferred()) {
  const resume = () => {
    startMusic();
    window.removeEventListener("pointerdown", resume);
  };
  window.addEventListener("pointerdown", resume, { once: true });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A 4xx won't fix itself on a retry; only retry infrastructure failures.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
