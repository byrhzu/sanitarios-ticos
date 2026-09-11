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

const CACHE = "panel-st-v2";

/* Dónde la pantalla le deja la clave a este archivo. Un service worker
   no puede leer localStorage —no tiene ventana—, así que se usa la caché
   como buzón: es lo mismo que ya guarda ahí la aplicación, en el mismo
   origen, y evita tener que escribir media base de datos para pasar un
   texto de veinte letras.

   Sirve para una sola cosa: que el aviso que llega al teléfono pueda
   decir "3 sin responder" en vez de "tiene algo nuevo". */
const BUZON = "panel-clave";

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
        // El buzón de la clave NO se borra: no es una copia de nada, es
        // el único lugar donde este archivo puede leerla.
        llaves.filter((k) => k !== CACHE && k !== BUZON).map((k) => caches.delete(k))
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


/* ============================================================================
   Avisos

   El aviso llega VACÍO: el servidor sólo toca la puerta. Acá adentro se va
   a buscar el número al panel con la clave del buzón, y con eso se arma la
   frase. Así ningún dato del negocio pasa por los servidores de Google o de
   Apple, que es por donde viaja todo aviso web.

   Si no hay clave o no hay señal, el aviso sale genérico. Es preferible un
   "tiene algo nuevo" a no avisar del todo.
   ============================================================================ */

async function claveGuardada() {
  try {
    const c = await caches.open(BUZON);
    const r = await c.match("/clave");
    return r ? (await r.text()) : "";
  } catch (e) {
    return "";
  }
}

function frase(d) {
  const partes = [];
  const esperando = (d.esperando && d.esperando.total) || 0;
  if (esperando) {
    partes.push(esperando + (esperando === 1 ? " sin responder" : " sin responder"));
  }
  const proximos = d.proximos || [];
  const vencidos = proximos.filter((p) => p.dias < 0).length;
  const hoy = proximos.filter((p) => p.dias === 0).length;
  if (vencidos) partes.push(vencidos + (vencidos === 1 ? " mantenimiento vencido" : " mantenimientos vencidos"));
  if (hoy) partes.push(hoy + (hoy === 1 ? " mantenimiento hoy" : " mantenimientos hoy"));
  return partes.join(" · ");
}

async function mostrarAviso() {
  let cuerpo = "Tiene algo nuevo en el panel.";
  try {
    const clave = await claveGuardada();
    if (clave) {
      const r = await fetch("/api/panel/resumen", { headers: { "X-Clave": clave } });
      const d = await r.json();
      if (d && d.ok) cuerpo = frase(d) || cuerpo;
    }
  } catch (e) { /* sin señal: queda el aviso genérico */ }

  return self.registration.showNotification("Sanitarios Ticos", {
    body: cuerpo,
    icon: "/assets/img/icono-app-192.png",
    badge: "/assets/img/icono-app-192.png",
    // Una sola notificación a la vez: diez avisos apilados de lo mismo
    // no dicen diez veces más, sólo estorban al desbloquear.
    tag: "panel",
    renotify: true,
    data: { url: "/panel" }
  });
}

self.addEventListener("push", (evento) => {
  evento.waitUntil(mostrarAviso());
});

/* Tocar el aviso trae al frente la aplicación si ya estaba abierta, en vez
   de abrir una segunda copia. */
self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const destino = (evento.notification.data && evento.notification.data.url) || "/panel";
  evento.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) {
        if (v.url.indexOf("/panel") !== -1 && "focus" in v) return v.focus();
      }
      return self.clients.openWindow(destino);
    })
  );
});
