/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { clientsClaim } from "workbox-core";

declare let self: ServiceWorkerGlobalScope;

/*
 * The app shell is precached; the API is never cached (it lives on another
 * origin and every card read or written must be the real one). On top of
 * that, push: a reminder arrives as {title, body, url, tag} and opens the
 * app at `url` when tapped.
 */
self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html"), { denylist: [/^\/api/] }));

type ReminderPayload = { title?: string; body?: string; url?: string; tag?: string };

self.addEventListener("push", (event) => {
  let payload: ReminderPayload;
  try {
    payload = (event.data?.json() as ReminderPayload | null) ?? {};
  } catch {
    payload = { body: event.data?.text() ?? "" };
  }
  const title = payload.title ?? "Kelimece";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body ?? "Kartların seni bekliyor. 🃏",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.tag ?? "kelimece",
      data: { url: payload.url ?? "/decks" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? "/decks";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => "focus" in w);
      if (open) {
        open.navigate(url);
        return open.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
