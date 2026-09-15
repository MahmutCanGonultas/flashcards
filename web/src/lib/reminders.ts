import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

/**
 * Daily push reminders, from the app's side: is this device able to get
 * them, has the learner turned them on, and the two actions.
 *
 * On an iPhone push only works once the app is on the Home Screen
 * (iOS 16.4+); in a Safari tab there is no PushManager at all, which is
 * what `supported` reports.
 */

type Subscription = { endpoint: string; hour: number; timezone: string; last_sent_on: string | null };

const timezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Istanbul";

function base64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function usePushReminders() {
  const queryClient = useQueryClient();
  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const standalone =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() =>
    supported ? Notification.permission : "unsupported",
  );
  // What this device is subscribed to, read from the worker itself.
  const [endpoint, setEndpoint] = useState<string | null>(null);

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (!cancelled) setEndpoint(sub?.endpoint ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [supported]);

  const status = useQuery({
    queryKey: ["pushStatus"],
    queryFn: () => api.get<{ subscriptions: Subscription[] }>("/push/status").then((r) => r.subscriptions),
    staleTime: 60_000,
  });
  const mine = status.data?.find((s) => s.endpoint === endpoint) ?? null;

  const enable = useMutation({
    mutationFn: async (hour: number) => {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") throw new Error("denied");
      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await api.get<{ publicKey: string }>("/push/key");
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToUint8Array(publicKey) as BufferSource }));
      const json = sub.toJSON();
      await api.post("/push/subscribe", { subscription: { endpoint: sub.endpoint, keys: json.keys }, hour, timezone: timezone() });
      setEndpoint(sub.endpoint);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pushStatus"] }),
  });

  const disable = useMutation({
    mutationFn: async () => {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.post("/push/unsubscribe", { endpoint: sub.endpoint }).catch(() => {});
        await sub.unsubscribe();
      }
      setEndpoint(null);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pushStatus"] }),
  });

  const test = useMutation({ mutationFn: () => api.post<{ sent: number }>("/push/test", {}) });

  const refresh = useCallback(() => queryClient.invalidateQueries({ queryKey: ["pushStatus"] }), [queryClient]);

  return { supported, standalone, permission, subscribed: Boolean(mine), hour: mine?.hour ?? null, enable, disable, test, refresh, loading: status.isLoading };
}
