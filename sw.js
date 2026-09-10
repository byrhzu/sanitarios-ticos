/* ============================================================================
   Service worker del panel.

   Es lo que convierte /panel en una aplicación instalable: guarda una copia
   de la pantalla para que abra de una, aunque el teléfono venga con mala
   señal desde la calle.

   Tres reglas, y ninguna más:

     1. /api/*  no se guarda NUNCA. Son solicitudes, montos y clientes: si
        no hay red, es mejor que el panel diga que no pudo cargar a que
        muestre cifras de ayer como si fueran de hoy.

     2. Las navegaciones van primero a la red. Así un despliegue nuevo se
        ve de inmediato; la copia guardada sólo aparece si no hay señal.

     3. Lo estático (css, iconos, fotos) se sirve de la copia y se
        refresca por detrás. Es lo que hace que abra sin parpadeo.

   Registrado con alcance /panel, así que el sitio público no pasa por acá
   y nada de lo que se publique en la página queda atrapado en esta caché.

   Al cambiar este archivo hay que subirle el número a CACHE. Si no, los
   teléfonos que ya lo tienen se quedan con la copia vieja.
   ============================================================================ */

const CACHE = "panel-st-v1";

// Lo mínimo para que la pantalla se dibuje sin red.
const CONCHA = [
  "/panel",
  "/styles.css",
  "/assets/img/logo-mascota.webp",
  "/assets/img/icono-app-192.png",
  "/assets/img/icono-app-512.png"
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE)
      // Uno por uno y sin reventar: si una sola dirección falla,
      // addAll() tumba la instalación entera y el panel se queda sin
      // service worker por un archivo que ni siquiera es esencial.
      .then((c) => Promise.all(CONCHA.map((u) => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((llaves) => Promise.all(
        llaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;

  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;

  // Regla 1: los datos nunca se guardan.
  if (url.pathname.startsWith("/api/")) return;

  // Regla 2: la pantalla, primero de la red.
  if (pedido.mode === "navigate") {
    evento.respondWith(
      fetch(pedido)
        .then((r) => {
          const copia = r.clone();
          caches.open(CACHE).then((c) => c.put("/panel", copia)).catch(() => {});
          return r;
        })
        .catch(() => caches.match("/panel").then((r) => r || Response.error()))
    );
    return;
  }

  // Regla 3: lo estático, de la copia y refrescando por detrás.
  // `ignoreSearch` porque los enlaces llevan ?v=fecha y sin esto la
  // copia guardada nunca coincidiría con lo que pide la página.
  evento.respondWith(
    caches.match(pedido, { ignoreSearch: true }).then((guardado) => {
      const red = fetch(pedido).then((r) => {
        if (r && r.ok) {
          const copia = r.clone();
          caches.open(CACHE).then((c) => c.put(pedido, copia)).catch(() => {});
        }
        return r;
      }).catch(() => guardado);
      return guardado || red;
    })
  );
});
