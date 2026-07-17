self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const fallback = { title: "ShopLinkk", body: "You have a new marketplace update.", href: "/notifications", tag: "shoplinkk-update" };
  let data = fallback;
  try {
    data = event.data ? { ...fallback, ...event.data.json() } : fallback;
  } catch {
    data = fallback;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/pwa/shoplinkk-logo-192.png",
      badge: "/pwa/shoplinkk-badge-96.png",
      tag: data.tag || "shoplinkk-update",
      renotify: true,
      data: { href: data.href || "/notifications" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data && event.notification.data.href ? event.notification.data.href : "/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const target = new URL(href, self.location.origin).href;
      for (const client of clients) {
        if ("navigate" in client && client.url.startsWith(self.location.origin)) {
          return client.navigate(target).then(() => client.focus());
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
