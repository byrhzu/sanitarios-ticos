import { GEOGRAFIA } from "./lib/geografia-cr.js";
import { RECARGOS } from "./lib/recargos-cr.js";
import { normalizarTelefono, normalizarCedula, normalizarCorreo, normalizarNombre }
  from "./lib/datos-cr.js";

/* =============================================================
   SANITARIOS TICOS — worker.js
   Este es el "fondo" del sitio: un programa que corre en los
   servidores de Cloudflare, no en el navegador del visitante.

   Qué hace:
   1. Sirve las páginas normales del sitio (como hasta ahora).
   2. /api/solicitud (POST): guarda una solicitud del formulario en
      la base de datos y avisa por correo. Nunca bloquea WhatsApp,
      aunque el guardado o el correo fallen.
   3. /api/panel/solicitudes y /api/panel/csv (GET, con contraseña):
      alimentan el panel privado donde se ven y se descargan las
      solicitudes.

   Las claves (contraseña del panel, clave de Resend) NUNCA están
   escritas acá. Viven como "secrets" en el panel de Cloudflare y
   llegan por env.CLAVE_PANEL / env.RESEND_API_KEY.
   ============================================================= */

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  // La API no la indexa nadie, no se adivina el tipo, y no se guarda en
  // cachés compartidas: casi todo lleva datos personales (lo poco público,
  // como la geografía, fija su propio cache aparte).
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cache-Control": "no-store"
};

function json(datos, estado) {
  return new Response(JSON.stringify(datos), { status: estado || 200, headers: JSON_HEADERS });
}

// Recorta y limpia un texto: nunca guardamos más de lo razonable,
// para que nadie pueda mandar un archivo enorme disfrazado de nombre.
function texto(valor, maxLargo) {
  return String(valor == null ? "" : valor).trim().slice(0, maxLargo);
}

// Una fecha "YYYY-MM-DD" válida, o null si no la mandaron o está mal escrita.
function soloFecha(valor) {
  const v = String(valor || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

/* =============================================================
   1. Guardar una solicitud del formulario
   ============================================================= */

async function guardarSolicitud(request, env, ctx) {
  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch (e) {
    return json({ ok: false, error: "Formato inválido" }, 400);
  }

  const provincia = texto(cuerpo.provincia, 40);
  const canton = texto(cuerpo.canton, 60);
  const distrito = texto(cuerpo.distrito, 80);

  const persona = limpiarDatosPersona(cuerpo, ["nombre", "telefono"]);
  if (persona.error) return json({ ok: false, error: persona.error }, 400);

  const datos = {
    nombre: persona.datos.nombre,
    telefono: persona.datos.telefono,
    servicio: texto(cuerpo.servicio, 200),
    // Se sigue guardando `zona` como texto legible, que es lo que el
    // panel viene mostrando desde el principio.
    zona: zonaTexto(provincia, canton, distrito) || texto(cuerpo.zona, 200),
    detalle: texto(cuerpo.detalle, 2000),
    pagina: texto(cuerpo.pagina, 300),
    cedula: persona.datos.cedula,
    correo: persona.datos.correo,
    provincia: provincia,
    canton: canton,
    distrito: distrito
  };

  // El nombre y el teléfono ya vinieron comprobados de arriba.
  if (!datos.servicio || !datos.zona) {
    return json({ ok: false, error: "Faltan datos obligatorios" }, 400);
  }
  if (provincia && !direccionValida(provincia, canton, distrito)) {
    return json({ ok: false, error: "Esa dirección no existe en la lista de Costa Rica" }, 400);
  }

  try {
    // Si el teléfono ya es de un cliente conocido, la solicitud queda
    // enlazada a él por ID (§21). NO se crea un cliente desde el
    // formulario público: eso lo haría el spam. Solo se reconoce a quien
    // ya existe; si no, cliente_id queda NULL y se enlaza al cotizar.
    await env.DB.prepare(
      `INSERT INTO solicitudes (nombre, telefono, servicio, zona, detalle, pagina,
                                cedula, correo, provincia, canton, distrito, cliente_id)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11,
               (SELECT id FROM clientes WHERE telefono = ?2 AND papelera IS NULL))`
    ).bind(datos.nombre, datos.telefono, datos.servicio, datos.zona, datos.detalle,
           datos.pagina, datos.cedula, datos.correo, provincia, canton, distrito).run();
  } catch (e) {
    console.error("Error al guardar en D1:", e);
    return json({ ok: false, error: "No se pudo guardar" }, 500);
  }

  // El correo se manda EN SEGUNDO PLANO: la respuesta al visitante no
  // espera a que Resend conteste. ctx.waitUntil() le avisa a Cloudflare
  // "seguí trabajando en esto aunque ya respondiste", así el correo
  // sale igual sin retrasar la apertura de WhatsApp.
  ctx.waitUntil(avisarPorCorreo(datos, env));
  // Y el toque de puerta al teléfono, que es el que se ve en el momento.
  ctx.waitUntil(avisarAlPanel(env));

  return json({ ok: true });
}

async function avisarPorCorreo(datos, env) {
  if (!env.RESEND_API_KEY || !env.CORREO_AVISO) return;

  const filas = [
    ["Nombre", datos.nombre],
    ["Teléfono", datos.telefono],
    ["Servicio", datos.servicio],
    ["Zona", datos.zona],
    ["Detalle", datos.detalle || "—"],
    ["Página", datos.pagina || "—"]
  ].map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#7d736a;">${k}</td><td style="padding:4px 0;"><b>${escaparHtml(v)}</b></td></tr>`).join("");

  const cuerpoCorreo = {
    from: "Sanitarios Ticos <avisos@sanitariosticoscr.com>",
    to: [env.CORREO_AVISO],
    subject: `Nueva solicitud — ${datos.nombre}`,
    html: `<div style="font-family:sans-serif;font-size:15px;color:#1b1917;">
      <p>Llegó una solicitud nueva desde el sitio web:</p>
      <table>${filas}</table>
    </div>`
  };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.RESEND_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(cuerpoCorreo)
    });
    if (!res.ok) console.error("Resend respondió", res.status, await res.text());
  } catch (e) {
    // Si el correo falla, la solicitud ya quedó guardada en la base de
    // datos de todas formas: no se pierde nada, sólo no llega el aviso.
    console.error("Error al enviar el correo de aviso:", e);
  }
}

function escaparHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

/* =============================================================
   2. Panel privado: consultar y descargar
   ============================================================= */

// Compara la contraseña recibida contra la guardada en Cloudflare.
// Antes de tener una clave configurada, el panel queda bloqueado
// para todos (más seguro que dejarlo abierto por error).
/* Comparación en tiempo constante: no corta apenas encuentra el primer
   carácter distinto, así el tiempo de respuesta no delata cuánto de la
   clave se acertó. */
function igualSeguro(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/* ============================================================================
   El candado del panel

   La clave sola no basta: sin límite de intentos, quien conozca la
   dirección puede probar claves a máquina hasta dar con la buena. Tres
   fallos seguidos desde una IP y esa IP no entra más, aunque después
   acierte, hasta que el encargado del sistema la abra a mano.

   Se cuenta por IP y no por sesión porque la sesión la escoge el que
   ataca. Y una entrada correcta borra la cuenta: equivocarse tres veces
   en un mes, escribiendo, no es un ataque.
   ============================================================================ */
const TOPE_FALLOS = 3;

/* ============================================================================
   Cloudflare Access

   Cuando Access está puesto, él es la puerta y la clave del panel sobra:
   pedir las dos cosas es pedir dos veces lo mismo.

   Pero NO basta con ver que la cabecera venga: el programa también
   responde en su dirección de workers.dev, que no pasa por Access, y ahí
   cualquiera podría inventarse la cabecera. Así que el vale se verifica
   de verdad — firma, destinatario y vencimiento — contra las llaves
   públicas del equipo.

   Se activa poniendo ACCESS_TEAM y ACCESS_AUD en Cloudflare. Mientras no
   estén, manda la clave de siempre y nada cambia.
   ============================================================================ */
let _llavesAccess = null, _llavesAl = 0;

async function llavesDeAccess(env) {
  const ahora = Date.now();
  // Las llaves rotan; una hora de memoria es lo que recomienda Cloudflare.
  if (_llavesAccess && ahora - _llavesAl < 3600000) return _llavesAccess;
  const r = await fetch(`https://${env.ACCESS_TEAM}.cloudflareaccess.com/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error("No se pudieron traer las llaves de Access");
  const j = await r.json();
  _llavesAccess = j.keys || [];
  _llavesAl = ahora;
  return _llavesAccess;
}

function base64url(txt) {
  const s = txt.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "=".repeat((4 - (s.length % 4)) % 4));
  const b = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return b;
}

/* Quién es cada petición, decidido UNA vez y recordado.

   La firma se revisa al entrar y el resultado se guarda acá; de ahí en
   adelante cualquier parte del código puede preguntar sin volver a
   verificar y, sobre todo, sin pedir la contraseña: el navegador no
   manda la cabecera X-Clave en una navegación directa, y pedírsela a
   quien ya entró por Access dejaba el panel sin datos. */
const VALE = new WeakMap();

function traeVale(request) {
  return !!request.headers.get("Cf-Access-Jwt-Assertion") ||
         /CF_Authorization=/.test(request.headers.get("Cookie") || "");
}

async function identificar(request, env) {
  if (VALE.has(request)) return VALE.get(request);
  let correo = null;
  if (env.ACCESS_TEAM && env.ACCESS_AUD && traeVale(request)) {
    const revisado = await revisarValeAccess(request, env);
    correo = revisado.correo || null;
    /* Si el vale no verifica no se cierra todo: se sigue hasta la clave
       de siempre. El muro de verdad es Access, que corta en el borde
       antes de que esto corra. Que el segundo muro falle no puede dejar
       al encargado sin herramienta a media mañana — y pasó. */
    if (!correo) {
      console.error("Vale de Access sin verificar (" + revisado.motivo +
                    ", " + (revisado.deDonde || "sin origen") + "); se sigue con la clave.");
    }
  }
  VALE.set(request, correo);
  return correo;
}

/* Lo mismo, pero contando POR QUÉ falló. Adivinarlo a ciegas costó una
   mañana de panel caído; ahora el motivo se puede leer. No dice nada
   secreto: sólo qué comprobación no pasó. */
async function revisarValeAccess(request, env) {
  if (!env.ACCESS_TEAM || !env.ACCESS_AUD) return { correo: null, motivo: "sin-configurar" };

  const cabeceraVale = request.headers.get("Cf-Access-Jwt-Assertion");
  const galleta = (request.headers.get("Cookie") || "").match(/CF_Authorization=([^;]+)/);
  const vale = cabeceraVale || (galleta && galleta[1]);
  if (!vale) return { correo: null, motivo: "no-llego-el-vale" };
  const deDonde = cabeceraVale ? "cabecera" : "galleta";

  const partes = vale.split(".");
  if (partes.length !== 3) return { correo: null, motivo: "vale-mal-formado", deDonde };

  try {
    const cabecera = JSON.parse(new TextDecoder().decode(base64url(partes[0])));
    const cuerpo = JSON.parse(new TextDecoder().decode(base64url(partes[1])));

    if (!cuerpo.exp || cuerpo.exp * 1000 < Date.now()) {
      return { correo: null, motivo: "vencido", deDonde };
    }
    const aud = Array.isArray(cuerpo.aud) ? cuerpo.aud : [cuerpo.aud];
    if (!aud.includes(env.ACCESS_AUD)) {
      return { correo: null, motivo: "aud-no-coincide", deDonde,
               esperaba: env.ACCESS_AUD.slice(0, 12) + "…",
               traia: String(aud[0] || "").slice(0, 12) + "…" };
    }
    if (cuerpo.iss !== `https://${env.ACCESS_TEAM}.cloudflareaccess.com`) {
      return { correo: null, motivo: "emisor-no-coincide", deDonde, traia: cuerpo.iss };
    }

    let llaves;
    try { llaves = await llavesDeAccess(env); }
    catch (e) { return { correo: null, motivo: "no-se-pudieron-traer-las-llaves", deDonde }; }

    const jwk = llaves.find((k) => k.kid === cabecera.kid);
    if (!jwk) return { correo: null, motivo: "llave-desconocida", deDonde };

    const llave = await crypto.subtle.importKey(
      "jwk", { kty: jwk.kty, n: jwk.n, e: jwk.e },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const firmaOk = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5", llave, base64url(partes[2]),
      new TextEncoder().encode(partes[0] + "." + partes[1]));
    if (!firmaOk) return { correo: null, motivo: "firma-no-cuadra", deDonde };

    return { correo: cuerpo.email || cuerpo.common_name || "(sin correo)", motivo: "ok", deDonde };
  } catch (e) {
    return { correo: null, motivo: "error: " + String(e && e.message), deDonde };
  }
}

/* A dónde manda el botón "Salir".

   Hay DOS galletas, no una: la del dominio del panel y la de la sesión
   de Cloudflare. Cerrando sólo la segunda, la primera seguía sirviendo
   unos veinte o treinta segundos: el encargado le daba a Salir, volvía
   al panel y lo veía cargado como si nada; recargando ya sí salía. Así
   que se pasa por las dos, en este orden:

     1. el dominio del panel  — borra la galleta de acá, de una
     2. el de Cloudflare      — cierra la sesión, para que Google no lo
                                vuelva a dejar entrar sin preguntar
     3. /panel                — sin galletas, es la pantalla de ingreso

   returnTo no está en la documentación de Cloudflare. Está probado
   contra el servicio real, y si algún día lo quitan esto no se rompe:
   la salida sigue cerrando la sesión, sólo que termina en la página de
   Cloudflare en vez de en la de ingreso. */
function salidaDeAccess(url, env) {
  const equipo = `https://${env.ACCESS_TEAM}.cloudflareaccess.com/cdn-cgi/access/logout` +
                 `?returnTo=${encodeURIComponent(url.origin + "/panel")}`;
  return `${url.origin}/cdn-cgi/access/logout?returnTo=${encodeURIComponent(equipo)}`;
}

function ipDe(request) {
  return request.headers.get("CF-Connecting-IP") ||
         request.headers.get("X-Forwarded-For") || "desconocida";
}

/* ¿Está cerrada la puerta para esta IP? Si la tabla todavía no existe,
   se contesta que no: un candado que no se instaló no puede dejar a
   nadie por fuera. */
async function puertaCerrada(env, ip) {
  try {
    const f = await env.DB.prepare(
      `SELECT bloqueado FROM intentos_panel WHERE ip = ?`).bind(ip).first();
    return !!(f && f.bloqueado);
  } catch { return false; }
}

async function anotarFallo(env, ip) {
  try {
    await env.DB.prepare(
      `INSERT INTO intentos_panel (ip, fallos, bloqueado, ultimo)
       VALUES (?1, 1, 0, datetime('now'))
       ON CONFLICT(ip) DO UPDATE SET
         fallos = fallos + 1,
         bloqueado = CASE WHEN fallos + 1 >= ${TOPE_FALLOS} THEN 1 ELSE bloqueado END,
         ultimo = datetime('now')`
    ).bind(ip).run();
  } catch (e) {
    console.error("No se pudo anotar el intento fallido:", e);
  }
}

async function limpiarFallos(env, ip) {
  try {
    await env.DB.prepare(`DELETE FROM intentos_panel WHERE ip = ?`).bind(ip).run();
  } catch {}
}

/* La puerta, antes de cualquier ruta del panel. Devuelve una respuesta
   cuando hay que cortar, o null cuando se puede seguir. */
async function revisarPuerta(request, env, ctx) {
  // Con Access, él abre la puerta y la clave no hace falta.
  if (VALE.get(request)) return null;

  const ip = ipDe(request);

  if (await puertaCerrada(env, ip)) {
    return json({ ok: false, bloqueado: true,
      error: "Esta conexión quedó bloqueada por intentos fallidos. " +
             "Hable con el encargado del sistema para que la habilite." }, 429);
  }

  if (claveValida(request, env)) {
    // Entró bien: se borra la cuenta de fallos sin hacer esperar a nadie.
    if (ctx && ctx.waitUntil) ctx.waitUntil(limpiarFallos(env, ip));
    return null;
  }

  /* Clave mala. Se anota ANTES de contestar —y no en segundo plano— para
     que no se puedan disparar mil intentos en paralelo y colarse todos
     antes de que el contador suba. */
  await anotarFallo(env, ip);
  const f = await env.DB.prepare(
    `SELECT fallos FROM intentos_panel WHERE ip = ?`).bind(ip).first().catch(() => null);
  const quedan = f ? Math.max(0, TOPE_FALLOS - f.fallos) : null;
  return json({ ok: false,
    error: quedan === 0
      ? "Clave incorrecta. Esta conexión quedó bloqueada: hable con el encargado del sistema."
      : "Clave incorrecta." + (quedan != null ? " Le " + (quedan === 1 ? "queda 1 intento" : "quedan " + quedan + " intentos") + "." : ""),
    quedan: quedan }, 401);
}

function claveValida(request, env) {
  /* Quien ya entró por Access no tiene contraseña que mandar. Esto vale
     para las rutas del panel y también para /api/cotizar, donde "tiene
     la clave" es lo que distingue una cotización hecha por la empresa
     de una que se cotizó sola un visitante. */
  if (VALE.get(request)) return true;
  if (!env.CLAVE_PANEL) return false;
  // Sólo por cabecera. En la URL, una clave queda en el historial del
  // navegador, en el Referer y en los logs de cualquier intermediario.
  const recibida = request.headers.get("X-Clave") || "";
  return recibida.length > 0 && igualSeguro(recibida, env.CLAVE_PANEL);
}

/* Las dos tablas que el panel muestra. Se declaran acá y no en cada
   endpoint para que el nombre de la tabla nunca salga de la URL: lo
   que llega de afuera sólo sirve para escoger de esta lista, así que
   no hay forma de inyectar SQL por el nombre. */
const ORIGENES = { beto: "Víctor", panel: "Panel", formulario: "Formulario", solicitud: "Solicitud" };

/* En qué va cada solicitud y cada cotización.

   Antes el panel sólo mostraba lo que había entrado, así que la única
   forma de no perder una cotización era acordarse de ella. Con esto
   cada fila dice en qué quedó, y el resumen puede contar lo que sigue
   esperando — que es la única cifra que de verdad obliga a hacer algo.

   El orden importa: es el del embudo, y así salen en los botones. */
const ESTADOS = {
  nueva:      { etiqueta: "Sin atender", tono: "espera" },
  contactada: { etiqueta: "Contactada",  tono: "curso"  },
  agendada:   { etiqueta: "Agendada",    tono: "curso"  },
  hecha:      { etiqueta: "Hecha",       tono: "ok"     },
  perdida:    { etiqueta: "Perdida",     tono: "off"    }
};
const ESTADO_INICIAL = "nueva";

/* WhatsApp es el canal en Costa Rica: acá nadie abre un correo para
   coordinar un camión. Entonces el panel no manda mensajes — abre
   WhatsApp con el texto ya escrito y el número ya puesto, y la persona
   sólo revisa y le da enviar. Sin API de Meta, sin verificación de
   empresa, y el mensaje sale del WhatsApp real de la empresa.

   El texto lo arma el servidor porque es el que tiene los datos; si lo
   armara el panel habría que repetir acá los nombres de los servicios. */
function waDe(telefono, mensaje) {
  const d = String(telefono == null ? "" : telefono).replace(/\D/g, "");
  if (d.length !== 8) return null;
  return "https://wa.me/506" + d + "?text=" + encodeURIComponent(mensaje);
}

function nombreEstado(codigo) {
  return (ESTADOS[codigo] || ESTADOS[ESTADO_INICIAL]).etiqueta;
}

/* Para el mensaje de WhatsApp. "Buenas María Fernanda Rojas Vargas" se
   lee a máquina; "Buenas María" se lee a persona. */
function primerNombre(nombre) {
  return String(nombre || "").trim().split(/\s+/)[0] || "";
}

const TABLAS_PANEL = {
  solicitudes: {
    columnas: `id, datetime(creado, '-6 hours') AS creado, nombre, telefono,
               servicio, zona, detalle, pagina, cedula, correo,
               estado, nota, provincia, canton, distrito`,
    csv: {
      archivo: "solicitudes",
      encabezado: ["Fecha (Costa Rica)", "Estado", "Nombre", "Cédula", "Teléfono", "Correo",
                   "Servicio", "Zona", "Detalle", "Nota", "Página"],
      fila: (f) => [f.creado, nombreEstado(f.estado), f.nombre, f.cedula || "", f.telefono,
                    f.correo || "", f.servicio, f.zona, f.detalle || "", f.nota || "",
                    f.pagina || ""]
    },
    // Lo que ve el panel en pantalla. Sale de la misma fuente que el CSV
    // para que nunca digan cosas distintas; lo que cambia es el formato,
    // porque en pantalla se lee y en el CSV se suma.
    vista: {
      encabezado: ["Fecha", "Nombre", "Teléfono", "Servicio", "Zona", "Detalle"],
      ancha: 5,
      fila: (f) => [f.creado, f.nombre, f.telefono, f.servicio,
                    f.zona, f.detalle || "—"],
      /* `meta` lleva los mismos datos que la fila, pero con nombre. En
         escritorio la tabla se arma con `encabezado` y `fila`, que es lo
         correcto para una tabla; en el teléfono la ficha necesita saber
         cuál dato es el monto y cuál el lugar para darles distinto peso,
         y eso no se puede deducir de un arreglo de celdas. */
      meta: (f) => ({
        id: f.id,
        estado: f.estado || ESTADO_INICIAL,
        nota: f.nota || "",
        nombre: f.nombre || "",
        tel: f.telefono || null,
        servicio: f.servicio || "",
        detalle: f.detalle || "",
        monto: null,            // una solicitud todavía no tiene precio
        lugar: f.zona || null,
        fecha: f.creado,
        // Para el atajo de "Cotizar": exportar lo que ya mandó el cliente.
        cedula: f.cedula || "",
        correo: f.correo || "",
        provincia: f.provincia || "",
        canton: f.canton || "",
        distrito: f.distrito || "",
        wa: waDe(f.telefono,
          "Buenas" + (f.nombre ? " " + primerNombre(f.nombre) : "") + ", le escribo de " +
          "Sanitarios Ticos. Nos entró su solicitud de " + (f.servicio || "servicio").toLowerCase() +
          ". ¿Cuándo le queda bien que se lo coordinemos?")
      })
    }
  },
  cotizaciones: {
    columnas: `id, numero, datetime(creado, '-6 hours') AS creado, servicio, forma,
               medida, ultimo, dias, zona, monto_min, monto_max, provisional,
               origen, nombre, telefono, cedula, correo, provincia, canton, distrito,
               llave, estado, nota`,
    csv: {
      archivo: "cotizaciones",
      encabezado: ["Número", "Fecha (Costa Rica)", "Estado", "Nota", "Servicio", "Mínimo", "Máximo",
                   "Forma del tanque", "Medida", "Último servicio",
                   "Provincia", "Cantón", "Distrito", "Cobro de zona",
                   "Precios provisionales", "Origen",
                   "Nombre", "Cédula", "Teléfono", "Correo"],
      fila: (f) => [
        f.numero || "", f.creado, nombreEstado(f.estado), f.nota || "",
        etiqueta(f.servicio, null, "servicio"),
        f.monto_min, f.monto_max,
        etiqueta(f.servicio, f.forma, "forma"), etiqueta(f.servicio, f.medida, "medida"),
        etiqueta(f.servicio, f.ultimo, "ultimo"),
        f.provincia || "", f.canton || "", f.distrito || "", etiqueta(null, f.zona, "zona"),
        f.provisional ? "Sí" : "No", ORIGENES[f.origen] || f.origen || "",
        f.nombre || "", f.cedula || "", f.telefono || "", f.correo || ""
      ]
    },
    vista: {
      // La primera celda se vuelve enlace al documento. La llave viaja
      // en la dirección, así que sólo la ve quien ya entró al panel.
      enlace: (f, origen) => (f.numero && f.llave)
        ? origen + "/cotizacion?n=" + encodeURIComponent(f.numero) +
          "&k=" + encodeURIComponent(f.llave)
        : null,
      /* En pantalla van sólo las columnas con las que se decide qué
         hacer. El último servicio, el acceso y el origen siguen en el
         CSV y en el documento: sacarlos de acá es lo que deja espacio
         para el estado y el botón de WhatsApp, que es lo que uno de
         verdad viene a tocar. */
      encabezado: ["Número", "Fecha", "Cliente", "Servicio", "Rango", "Detalle", "Zona"],
      ancha: 5,
      meta: (f) => ({
        id: f.id,
        estado: f.estado || ESTADO_INICIAL,
        nota: f.nota || "",
        nombre: f.nombre || "",
        tel: f.telefono || null,
        servicio: etiqueta(f.servicio, null, "servicio"),
        detalle: [etiqueta(f.servicio, f.forma, "forma"),
                  etiqueta(f.servicio, f.medida, "medida")].filter(Boolean).join(", "),
        monto: montoTexto(f.monto_min, f.monto_max),
        lugar: [f.canton, f.provincia].filter(Boolean).join(", ") || null,
        fecha: f.creado,
        // De dónde vino: sirve de pastilla y de filtro (guía § Cotizaciones).
        origen: f.origen || "beto",
        origenTxt: ORIGENES[f.origen] || "Víctor",
        wa: waDe(f.telefono,
          "Buenas" + (f.nombre ? " " + primerNombre(f.nombre) : "") + ", le escribo de " +
          "Sanitarios Ticos por su cotización " + (f.numero || "") + ": " +
          etiqueta(f.servicio, null, "servicio").toLowerCase() + ", " +
          montoTexto(f.monto_min, f.monto_max) +
          ". ¿Le sirve que se lo coordinemos esta semana?")
      }),
      fila: (f) => [
        f.numero || "—",
        f.creado,
        f.nombre || "—",
        etiqueta(f.servicio, null, "servicio"),
        montoTexto(f.monto_min, f.monto_max),
        detalleTrabajo(f),
        zonaTexto(f.provincia, f.canton, f.distrito) || etiqueta(null, f.zona, "zona")
      ]
    }
  }
};

/* Qué se puede filtrar en cada tabla. Es una lista cerrada por la misma
   razón que el nombre de la tabla: lo que llega de la URL sólo sirve
   para escoger de acá. `servicio` sólo está en cotizaciones porque
   solicitudes guarda el texto que escogió la persona, no el código. */
const FILTROS_TABLA = {
  solicitudes:  ["provincia"],
  cotizaciones: ["estado", "provincia", "servicio", "origen"]
};

/* Contra qué columnas busca el término libre de cada tabla. Son las
   formas en que alguien recuerda un registro: por quién, por el
   número, o por el teléfono. */
const BUSCA_TABLA = {
  solicitudes:  ["nombre", "telefono", "cedula"],
  cotizaciones: ["numero", "nombre", "telefono", "cedula"]
};

function tablaPedida(url) {
  const pedida = url.searchParams.get("tabla");
  return Object.prototype.hasOwnProperty.call(TABLAS_PANEL, pedida) ? pedida : "solicitudes";
}

// Arma el SQL de la consulta con el rango de fechas opcional.
// Las fechas se comparan en hora de Costa Rica (UTC-6), que es la
// única zona horaria del negocio, para que "hoy" signifique lo mismo
// en el panel que en el reloj del que lo está mirando.
/* `sinEstado` sirve para el conteo de las pestañas: hay que contar
   cuántas hay en CADA estado con los demás filtros puestos, y para eso
   el estado no puede estar filtrando. */
function construirConsulta(url, sinEstado) {
  const desde = soloFecha(url.searchParams.get("desde"));
  const hasta = soloFecha(url.searchParams.get("hasta"));
  const tabla = tablaPedida(url);

  let sql = `SELECT ${TABLAS_PANEL[tabla].columnas} FROM ${tabla}`;
  const condiciones = [];
  const valores = [];

  if (desde) { condiciones.push(`date(creado, '-6 hours') >= ?`); valores.push(desde); }
  if (hasta) { condiciones.push(`date(creado, '-6 hours') <= ?`); valores.push(hasta); }

  /* Los filtros del tablero. Cada valor se comprueba contra la lista que
     ya existe —los estados, las provincias de Costa Rica, los servicios
     que sabe cobrar el motor— y el que no esté se ignora. Así el
     tablero puede mandar cualquier cosa sin que llegue a la consulta. */
  const permitidos = FILTROS_TABLA[tabla] || [];
  const valido = {
    estado:    (v) => Object.prototype.hasOwnProperty.call(ESTADOS, v),
    provincia: (v) => Object.prototype.hasOwnProperty.call(GEOGRAFIA, v),
    servicio:  (v) => Object.prototype.hasOwnProperty.call(TARIFAS.servicios, v),
    origen:    (v) => Object.prototype.hasOwnProperty.call(ORIGENES, v)
  };
  for (const campo of permitidos) {
    if (sinEstado && campo === "estado") continue;
    const v = url.searchParams.get(campo);
    if (v && valido[campo](v)) {
      condiciones.push(campo + ` = ?`);
      valores.push(v);
    }
  }

  /* Término libre. Los nombres de columna salen del registro de arriba
     y nunca de la URL; lo que llega de afuera viaja siempre como valor
     enlazado. */
  const busca = texto(url.searchParams.get("buscar"), 60);
  const cols = BUSCA_TABLA[tabla] || [];
  if (busca && cols.length) {
    condiciones.push("(" + cols.map((c) => c + " LIKE ?").join(" OR ") + ")");
    for (const _ of cols) valores.push("%" + busca + "%");
  }
  /* Solicitudes: dos estados y una papelera (guía final). La columna
     `estado` de la base se mantiene, pero la pantalla sólo ve dos cosas:
     pendiente (todo lo que no está hecho) y realizada (hecha). Y la
     papelera esconde las inválidas sin borrarlas. */
  if (tabla === "solicitudes") {
    const svista = url.searchParams.get("svista");
    if (svista === "papelera") {
      condiciones.push("papelera IS NOT NULL");
    } else {
      condiciones.push("papelera IS NULL");
      if (svista === "realizadas") condiciones.push("estado = 'hecha'");
      else if (svista === "pendientes") condiciones.push("estado <> 'hecha'");
    }
  } else if (tabla === "cotizaciones") {
    // Sin esto, una cotización enviada a la papelera seguía apareciendo
    // en su lista hasta que se la eliminaba definitivamente (bug).
    condiciones.push("papelera IS NULL");
  }

  const donde = condiciones.length ? ` WHERE ` + condiciones.join(" AND ") : "";
  sql += donde + ` ORDER BY creado DESC`;

  return { sql, valores, desde, hasta, tabla, donde };
}

/* Cuántas filas por página. Con 50 solicitudes no se notaba, pero el
   panel traía TODAS de golpe: con unos miles, el teléfono se arrastra y
   la consulta a D1 empieza a costar. */
const POR_PAGINA = 50;

async function listaPanel(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);

  const url = new URL(request.url);
  const { sql, valores, tabla } = construirConsulta(url);

  // Página 1 si no la mandan o si mandan cualquier cosa.
  const pedida = parseInt(url.searchParams.get("pagina"), 10);
  const pagina = Number.isFinite(pedida) && pedida > 0 ? pedida : 1;
  const desplazamiento = (pagina - 1) * POR_PAGINA;

  // El total se cuenta con los mismos filtros, para poder decir
  // "mostrando 51 a 100 de 340" sin traerse las 340.
  const sqlTotal = sql
    .replace(/^SELECT[\s\S]*?FROM/, "SELECT COUNT(*) AS n FROM")
    .replace(/\s+ORDER BY[\s\S]*$/, "");

  try {
    const fila = await env.DB.prepare(sqlTotal).bind(...valores).first();
    const total = fila ? fila.n : 0;

    const { results } = await env.DB
      .prepare(sql + ` LIMIT ?${valores.length + 1} OFFSET ?${valores.length + 2}`)
      .bind(...valores, POR_PAGINA, desplazamiento)
      .all();

    /* Cuántas hay en cada estado con los demás filtros puestos. Es lo
       que hace que las pestañas digan un número en vez de ser cinco
       botones a ciegas — y que uno sepa que no hay nada perdido en
       "Agendadas" sin tener que entrar a mirar. */
    let conteos = {};
    let pestanas = null;
    if (tabla === "solicitudes") {
      /* Las tres pestañas de solicitudes. Se cuentan sin el filtro de
         pestaña puesto, para que cada una diga su número aunque se esté
         viendo otra. */
      const c = await env.DB.prepare(
        `SELECT
           SUM(CASE WHEN papelera IS NULL AND estado <> 'hecha' THEN 1 ELSE 0 END) AS pend,
           SUM(CASE WHEN papelera IS NULL AND estado =  'hecha' THEN 1 ELSE 0 END) AS real2,
           SUM(CASE WHEN papelera IS NOT NULL THEN 1 ELSE 0 END) AS pap
         FROM solicitudes`
      ).first().catch(() => ({ pend: 0, real2: 0, pap: 0 }));
      pestanas = [
        { id: "pendientes", etiqueta: "Pendientes", n: (c && c.pend) || 0 },
        { id: "realizadas", etiqueta: "Realizadas", n: (c && c.real2) || 0 },
        { id: "papelera",   etiqueta: "Papelera",   n: (c && c.pap) || 0 }
      ];
    } else {
      const sinEst = construirConsulta(url, true);
      const conteo = await env.DB
        .prepare(`SELECT estado, COUNT(*) AS n FROM ${tabla}${sinEst.donde} GROUP BY estado`)
        .bind(...sinEst.valores).all();
      for (const f of conteo.results || []) conteos[f.estado] = f.n;
    }

    const vista = TABLAS_PANEL[tabla].vista;
    const origen = url.origin;
    return json({
      ok: true,
      tabla: tabla,
      encabezado: vista.encabezado,
      ancha: vista.ancha,
      filas: results.map(vista.fila),
      // Paralelo a `filas`: la dirección del documento de cada una, o
      // null. Se manda aparte para no meter etiquetas HTML en los datos.
      enlaces: vista.enlace ? results.map((f) => vista.enlace(f, origen)) : null,
      // Lo que necesita cada fila para poder ACTUAR sobre ella: el id
      // para cambiarle el estado, y el teléfono y el mensaje ya armado
      // para escribirle sin salirse del panel.
      meta: vista.meta ? results.map(vista.meta) : null,
      estados: ESTADOS,
      pestanas,
      svista: url.searchParams.get("svista") || (tabla === "solicitudes" ? "pendientes" : null),
      // Un aviso arriba de la tabla vale más que una marca en cada
      // fila: mientras las tarifas sean las provisionales, lo son todas.
      hayProvisionales: results.some((f) => f.provisional),
      conteos,
      total: total,
      pagina: pagina,
      porPagina: POR_PAGINA,
      paginas: Math.max(1, Math.ceil(total / POR_PAGINA))
    });
  } catch (e) {
    console.error("Error al consultar D1:", e);
    return json({ ok: false, error: "No se pudo consultar" }, 500);
  }
}

// Convierte un valor a una celda de CSV segura: si tiene coma, comillas
// o salto de línea, va entre comillas y las comillas internas se duplican.
function celdaCsv(valor) {
  const s = String(valor == null ? "" : valor);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/* El CSV NO se pagina a propósito: quien lo descarga quiere el rango de
   fechas completo en el archivo, no la página que estaba viendo. */
async function descargarCsv(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);

  const { sql, valores, desde, hasta, tabla } = construirConsulta(new URL(request.url));
  let filas;
  try {
    const r = await env.DB.prepare(sql).bind(...valores).all();
    filas = r.results;
  } catch (e) {
    console.error("Error al consultar D1:", e);
    return json({ ok: false, error: "No se pudo consultar" }, 500);
  }

  const forma = TABLAS_PANEL[tabla].csv;
  const lineas = [forma.encabezado.join(",")];
  for (const f of filas) {
    lineas.push(forma.fila(f).map(celdaCsv).join(","));
  }

  // El "﻿" al inicio es para que Excel abra el archivo reconociendo
  // los acentos correctamente, en vez de mostrar símbolos raros.
  const csv = "﻿" + lineas.join("\r\n");
  const nombreArchivo = forma.archivo + (desde ? "_" + desde : "") + (hasta ? "_a_" + hasta : "") + ".csv";

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      // Es un export de datos personales: ni se indexa ni se cachea.
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store"
    }
  });
}

/* -------------------------------------------------------------
   Cambiar el estado de una fila

   Es la única escritura que hace el panel. Va por POST y con la clave
   en encabezado, no en la dirección: un GET se guarda en el historial
   del navegador y en los registros del servidor, y esto modifica datos.
   ------------------------------------------------------------- */
async function cambiarEstado(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);

  let cuerpo;
  try { cuerpo = await request.json(); }
  catch { return json({ ok: false, error: "Petición mal formada" }, 400); }

  // La tabla se escoge del registro, nunca se interpola lo que llegue.
  const tabla = Object.prototype.hasOwnProperty.call(TABLAS_PANEL, cuerpo.tabla)
    ? cuerpo.tabla : null;
  if (!tabla) return json({ ok: false, error: "Tabla desconocida" }, 400);

  const id = parseInt(cuerpo.id, 10);
  if (!Number.isFinite(id) || id <= 0) return json({ ok: false, error: "Fila inválida" }, 400);

  /* Papelera de solicitudes: botar (soft), restaurar y eliminar de
     verdad. Sólo para solicitudes; una cotización no se bota. */
  if (tabla === "solicitudes" && cuerpo.accion) {
    try {
      if (cuerpo.accion === "papelera") {
        await env.DB.prepare(`UPDATE solicitudes SET papelera = datetime('now') WHERE id = ?`).bind(id).run();
      } else if (cuerpo.accion === "restaurar") {
        await env.DB.prepare(`UPDATE solicitudes SET papelera = NULL WHERE id = ?`).bind(id).run();
      } else if (cuerpo.accion === "eliminar") {
        await env.DB.prepare(`DELETE FROM solicitudes WHERE id = ? AND papelera IS NOT NULL`).bind(id).run();
      } else {
        return json({ ok: false, error: "Acción desconocida" }, 400);
      }
      return json({ ok: true, accion: cuerpo.accion });
    } catch (e) {
      console.error("Error en la papelera:", e);
      return json({ ok: false, error: "No se pudo guardar" }, 500);
    }
  }

  const estado = Object.prototype.hasOwnProperty.call(ESTADOS, cuerpo.estado)
    ? cuerpo.estado : null;
  if (!estado) return json({ ok: false, error: "Estado desconocido" }, 400);

  // La nota es opcional y se recorta: es un recordatorio de una línea
  // ("llamar después de las 5"), no un expediente.
  const nota = cuerpo.nota == null ? null : String(cuerpo.nota).trim().slice(0, 400) || null;

  try {
    await env.DB
      .prepare(`UPDATE ${tabla} SET estado = ?, nota = ?, actualizado = datetime('now') WHERE id = ?`)
      .bind(estado, nota, id)
      .run();

    /* Marcar una cotización como hecha es el único momento en que se
       sabe con certeza que hubo un trabajo. Ahí —y no antes— nace el
       cliente y se anota el servicio, con lo que el recordatorio de
       dentro de dos años queda armado sin que nadie tenga que
       acordarse de nada. */
    let cliente = null;
    if (estado === "hecha" && tabla === "cotizaciones" && cuerpo.servicio) {
      cliente = await registrarDesdeCotizacion(env, id, cuerpo.servicio);
    }

    return json({ ok: true, estado, nota: nota || "", cliente });
  } catch (e) {
    console.error("Error al cambiar el estado:", e);
    return json({ ok: false, error: "No se pudo guardar" }, 500);
  }
}

/* Del registro de la cotización salen los datos del cliente; del
   formulario que llena el propietario al marcarla, la fecha real del
   trabajo y lo que cobró. Si esto falla, el estado ya quedó guardado:
   se pierde el recordatorio, no el trabajo. */
async function registrarDesdeCotizacion(env, id, extra) {
  try {
    const c = await env.DB.prepare(
      `SELECT numero, servicio, forma, medida, ultimo, dias, nombre, telefono, cedula, correo,
              provincia, canton, distrito, monto_min, solicitud_id
       FROM cotizaciones WHERE id = ?`
    ).bind(id).first();
    if (!c) return null;

    const cliente = await guardarCliente(env, c);
    if (!cliente) return null;

    await guardarServicio(env, cliente.id, {
      fecha: extra.fecha,
      servicio: c.servicio,
      detalle: detalleTrabajo(c),
      monto: extra.monto != null && extra.monto !== "" ? extra.monto : c.monto_min,
      cotizacion: c.numero,
      cotizacionId: id,                 // enlace por ID (lo que lee guardarServicio)
      solicitudId: c.solicitud_id || null,
      meses: extra.meses,
      metodo: extra.metodo,
      nota: extra.nota
    }, cliente.meses);

    if (extra.recordatorio === false) {
      await env.DB.prepare(`UPDATE clientes SET recordatorio = 0 WHERE id = ?`)
        .bind(cliente.id).run();
    }
    return { id: cliente.id, nombre: c.nombre };
  } catch (e) {
    console.error("No se pudo registrar el cliente/servicio:", e);
    return null;
  }
}


/* -------------------------------------------------------------
   Un trabajo anotado a mano

   Hasta acá, un cliente sólo podía nacer marcando una cotización como
   hecha, y un trabajo sólo existía si antes hubo cotización. Eso deja
   por fuera el caso más común de todos: el que llamó, se le fue a hacer
   el trabajo y se le cobró, sin que nadie abriera el cotizador.

   Ese trabajo no estaba en ningún lado. No sumaba en lo cobrado, el
   cliente no quedaba registrado y no se le armaba el recordatorio — que
   es justamente de donde sale el próximo trabajo.

   Acá entra por el teléfono, igual que todo lo demás: si ya existe se
   actualiza, y si no, se crea. `cotizacion` queda en null, que es la
   forma honesta de decir "este no vino de una".
   ------------------------------------------------------------- */
async function trabajoAMano(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);

  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch (e) {
    return json({ ok: false, error: "Formato inválido" }, 400);
  }

  const persona = limpiarDatosPersona(cuerpo, ["nombre", "telefono"]);
  if (persona.error) return json({ ok: false, error: persona.error }, 400);

  const provincia = texto(cuerpo.provincia, 40);
  const canton = texto(cuerpo.canton, 60);
  const distrito = texto(cuerpo.distrito, 80);
  if (provincia && !direccionValida(provincia, canton, distrito)) {
    return json({ ok: false, error: "Esa dirección no existe en la lista de Costa Rica" }, 400);
  }

  const conTrabajo = cuerpo.conTrabajo !== false;
  if (conTrabajo && !texto(cuerpo.servicio, 40)) {
    return json({ ok: false, error: "Falta decir qué trabajo se hizo" }, 400);
  }

  try {
    // Saber si ya existía antes de tocarlo: es lo que le permite al panel
    // decir "se registró" o "se actualizó" sin adivinar.
    const antes = await env.DB.prepare(`SELECT id FROM clientes WHERE telefono = ?`)
      .bind(normalizarTelefono(persona.datos.telefono).valor).first();

    const cliente = await guardarCliente(env, Object.assign({}, persona.datos, {
      provincia, canton, distrito
    }));
    if (!cliente) return json({ ok: false, error: "No se pudo guardar el cliente" }, 500);

    /* Las señas, la nota y la forma de recordar no las toca
       `guardarCliente` —ese se usa también desde una cotización, donde no
       existen—, así que se ponen acá y sólo si vinieron. */
    const meses = PERIODOS.indexOf(+cuerpo.meses) !== -1 ? +cuerpo.meses : cliente.meses;
    const canal = ["whatsapp", "correo", "ninguno"].indexOf(cuerpo.canal) !== -1
      ? cuerpo.canal : null;

    await env.DB.prepare(
      `UPDATE clientes SET
         senas        = COALESCE(NULLIF(?1, ''), senas),
         nota         = COALESCE(NULLIF(?2, ''), nota),
         meses        = ?3,
         canal        = COALESCE(?4, canal),
         recordatorio = ?5,
         actualizado  = datetime('now')
       WHERE id = ?6`
    ).bind(
      texto(cuerpo.senas, 200) || "", texto(cuerpo.nota, 300) || "",
      meses, canal, cuerpo.recordatorio === false ? 0 : 1, cliente.id
    ).run();

    if (conTrabajo) {
      await guardarServicio(env, cliente.id, {
        fecha: cuerpo.fecha,
        servicio: texto(cuerpo.servicio, 40),
        detalle: texto(cuerpo.detalle, 200),
        monto: cuerpo.monto,
        cotizacion: null,
        meses: meses,
        metodo: cuerpo.metodo,
        nota: texto(cuerpo.notaTrabajo, 300)
      }, meses);
    }

    return json({
      ok: true,
      id: cliente.id,
      nombre: persona.datos.nombre,
      nuevo: !antes,
      conTrabajo
    });
  } catch (e) {
    console.error("No se pudo anotar el trabajo:", e);
    return json({ ok: false, error: "No se pudo guardar" }, 500);
  }
}

/* -------------------------------------------------------------
   Resumen: las cifras del tablero

   Todo se calcula en SQL y en hora de Costa Rica. Traerse las filas
   para contarlas en el navegador funcionaría hoy con doscientas y se
   caería solo con veinte mil, y además obligaría a repetir en el panel
   reglas que ya viven acá.

   Las nueve consultas van en un solo `batch`: D1 cobra por viaje, no
   por consulta, y así el tablero abre de una.
   ------------------------------------------------------------- */
const DIAS_RESUMEN = 30;
// Tope de puntos que se dibujan. Con más de medio año de barras diarias
// no se distingue una de otra y la respuesta se hincha sin utilidad.
const DIAS_TOPE = 186;

function rangoResumen(url) {
  const hoy = new Date(Date.now() - 6 * 3600 * 1000).toISOString().slice(0, 10);
  let hasta = soloFecha(url.searchParams.get("hasta")) || hoy;
  let desde = soloFecha(url.searchParams.get("desde"));
  if (!desde) {
    const d = new Date(hasta + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - (DIAS_RESUMEN - 1));
    desde = d.toISOString().slice(0, 10);
  }
  if (desde > hasta) { const t = desde; desde = hasta; hasta = t; }

  const dias = Math.round(
    (Date.parse(hasta + "T00:00:00Z") - Date.parse(desde + "T00:00:00Z")) / 86400000
  ) + 1;
  return { desde, hasta, dias: Math.min(Math.max(dias, 1), DIAS_TOPE) };
}

async function resumenPanel(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);

  const url = new URL(request.url);
  const { desde, hasta, dias } = rangoResumen(url);

  // El mismo largo, pegado hacia atrás: si el rango son 30 días, el
  // periodo anterior son los 30 anteriores a `desde`.
  const previo = (function () {
    const fin = new Date(Date.parse(desde + "T00:00:00Z") - 86400000);
    const ini = new Date(fin.getTime() - (dias - 1) * 86400000);
    return { desde: ini.toISOString().slice(0, 10), hasta: fin.toISOString().slice(0, 10) };
  })();

  const dia = `date(creado, '-6 hours')`;
  const enRango = `${dia} BETWEEN ? AND ?`;
  const R = [desde, hasta];
  // Horas esperando: sirve para ordenar y para marcar lo que ya pasó de
  // un día sin que nadie lo tocara.
  const espera = `CAST((julianday('now') - julianday(creado)) * 24 AS INTEGER) AS horas`;

  const q = (sql, val) => env.DB.prepare(sql).bind(...(val || []));

  /* ¿Ya se corrió la migración de la factura electrónica? De eso depende
     si el desglose por factura es real o si todo cae en "sin factura". */
  const conFE = await hayColumna(env, "servicios", "fe");

  try {
    const r = await env.DB.batch([
      // 0 · serie diaria de cotizaciones
      q(`SELECT ${dia} AS d, COUNT(*) AS n FROM cotizaciones WHERE ${enRango} GROUP BY d ORDER BY d`, R),
      // 1 · serie diaria de solicitudes
      q(`SELECT ${dia} AS d, COUNT(*) AS n FROM solicitudes WHERE ${enRango} GROUP BY d ORDER BY d`, R),
      /* 2 · estado de las cotizaciones DEL RANGO. Es lo que pidió el
             propietario: cuántas se enviaron y cuántas terminaron en
             venta, contado por estado y no por otra cosa. */
      q(`SELECT estado, COUNT(*) AS n FROM cotizaciones WHERE ${enRango} GROUP BY estado`, R),
      // 3 · estado de las solicitudes del rango
      q(`SELECT estado, COUNT(*) AS n FROM solicitudes WHERE ${enRango} GROUP BY estado`, R),
      /* 4 y 5 · lo que está esperando. SIN filtro de fecha: una
             cotización de hace dos meses que nadie tocó sigue estando
             sin atender hoy, y esconderla porque cae fuera del rango
             sería justamente perderla. */
      q(`SELECT id, numero, nombre, telefono, servicio, monto_min, monto_max,
                provincia, canton, ${dia} AS d, ${espera}
         FROM cotizaciones WHERE estado = 'nueva' AND papelera IS NULL ORDER BY creado ASC LIMIT 15`),
      q(`SELECT id, nombre, telefono, servicio, zona, ${dia} AS d, ${espera}
         FROM solicitudes WHERE estado = 'nueva' AND papelera IS NULL ORDER BY creado ASC LIMIT 15`),
      /* 6 y 7 · qué se HIZO y DÓNDE se hizo. Salen de los trabajos
             anotados, no de las cotizaciones emitidas. La pregunta de fin
             de mes es "qué hice y para dónde fui", y una cotización que
             nunca se convirtió en trabajo contestaba que no.

             Además así entran los trabajos anotados a mano, que no
             tienen cotización y antes no aparecían en ningún desglose. */
      q(`SELECT servicio AS k, COUNT(*) AS n, COALESCE(SUM(monto), 0) AS m
         FROM servicios WHERE fecha BETWEEN ? AND ? AND estado = 'completado' AND papelera IS NULL
         GROUP BY k ORDER BY n DESC`, R),
      q(`SELECT COALESCE(NULLIF(c.provincia, ''), '—') AS k, COUNT(*) AS n
         FROM servicios s JOIN clientes c ON c.id = s.cliente_id
         WHERE s.fecha BETWEEN ? AND ? AND s.estado = 'completado' AND s.papelera IS NULL
         GROUP BY k ORDER BY n DESC`, R),
      // 8 · por dónde entró: dice si Víctor está sirviendo
      q(`SELECT COALESCE(origen, 'beto') AS k, COUNT(*) AS n FROM cotizaciones WHERE ${enRango} GROUP BY k ORDER BY n DESC`, R),
      /* 9 · el monto que sigue vivo. También sin filtro de fecha: es
             plata que todavía se puede cobrar, no importa cuándo se
             cotizó. */
      q(`SELECT SUM(monto_min) AS smin, SUM(monto_max) AS smax FROM cotizaciones
         WHERE estado NOT IN ('perdida', 'hecha') AND papelera IS NULL`),
      // 10 · cuántas siguen sin atender, en total (excluye papelera)
      q(`SELECT
           (SELECT COUNT(*) FROM cotizaciones WHERE estado = 'nueva' AND papelera IS NULL) AS cot,
           (SELECT COUNT(*) FROM solicitudes  WHERE estado = 'nueva' AND papelera IS NULL) AS sol`),
      /* 11 · lo cobrado en el rango. Sale de los trabajos anotados, que
             es plata real recibida — no del rango de las cotizaciones,
             que es una estimación de algo que puede no pasar. */
      q(`SELECT COUNT(*) AS n, COALESCE(SUM(monto), 0) AS s
         FROM servicios WHERE fecha BETWEEN ? AND ? AND estado = 'completado' AND papelera IS NULL`, R),
      /* 12 · el mismo periodo, corrido hacia atrás. Sin esto un número
             solo no dice nada: 38 cotizaciones puede ser un buen mes o
             la mitad del anterior. */
      q(`SELECT
           (SELECT COUNT(*) FROM cotizaciones WHERE ${dia} BETWEEN ?1 AND ?2) AS cot,
           (SELECT COUNT(*) FROM solicitudes  WHERE ${dia} BETWEEN ?1 AND ?2) AS sol,
           (SELECT COALESCE(SUM(monto),0) FROM servicios WHERE fecha BETWEEN ?1 AND ?2 AND estado = 'completado' AND papelera IS NULL) AS ing`,
        [previo.desde, previo.hasta]),
      // 13 · solicitudes que llevan más de un día sin que nadie las toque
      q(`SELECT COUNT(*) AS n FROM solicitudes
         WHERE estado = 'nueva' AND papelera IS NULL AND creado < datetime('now', '-24 hours')`),
      /* 14 · cotizaciones abiertas que se están venciendo. La vigencia
             son ${TARIFAS.vigenciaDias} días; se avisa cinco antes. */
      q(`SELECT COUNT(*) AS n FROM cotizaciones
         WHERE estado IN ('nueva', 'contactada') AND papelera IS NULL
           AND ${dia} <= date('now', '-6 hours', '-${Math.max(1, TARIFAS.vigenciaDias - 5)} days')`),
      /* 15 · los mantenimientos que vienen. Sólo el último trabajo de
             cada cliente y sólo si tiene el recordatorio prendido. */
      q(`SELECT m.fecha AS proximo, so.fecha AS fecha, m.tipo AS servicio, c.id AS cliente_id, c.nombre,
                c.telefono, c.canton, c.provincia,
                CAST(julianday(m.fecha) - julianday(date('now','-6 hours')) AS INTEGER) AS dias
         FROM mantenimientos m
         JOIN clientes c ON c.id = m.cliente_id
         LEFT JOIN servicios so ON so.id = m.servicio_id
         WHERE m.estado = 'programado' AND m.papelera IS NULL
           AND c.recordatorio = 1 AND c.papelera IS NULL
           AND m.fecha <= date('now', '-6 hours', '+45 days')
         ORDER BY m.fecha LIMIT 8`),
      /* 16 · cobrado REAL en el rango: plata que de verdad entró, sumada
             de los pagos (no del monto del servicio, que puede estar a
             medias). La fecha es la del pago. */
      q(`SELECT COALESCE(SUM(monto), 0) AS s FROM pagos
          WHERE fecha BETWEEN ? AND ? AND papelera IS NULL`, R),
      /* 17 · saldo pendiente TOTAL (a hoy, sin filtro de fecha): de cada
             trabajo completado, lo que falta por cobrar. Es la plata que
             ya se ganó pero no ha entrado. */
      q(`SELECT COALESCE(SUM(saldo), 0) AS s FROM (
           SELECT s.monto - COALESCE(
                    (SELECT SUM(p.monto) FROM pagos p WHERE p.servicio_id = s.id AND p.papelera IS NULL), 0
                  ) AS saldo
             FROM servicios s
            WHERE s.estado = 'completado' AND s.papelera IS NULL AND s.monto IS NOT NULL
         ) WHERE saldo > 0`),
      /* 18 · Top 5 clientes por facturación en el rango. La pregunta que
             ninguna cifra suelta contesta: "quién sostiene el negocio". */
      q(`SELECT c.id, c.nombre, c.telefono, COUNT(*) AS trabajos, SUM(s.monto) AS monto
         FROM servicios s JOIN clientes c ON c.id = s.cliente_id
         WHERE s.fecha BETWEEN ? AND ? AND s.estado = 'completado' AND s.papelera IS NULL
           AND c.papelera IS NULL AND s.monto IS NOT NULL
         GROUP BY c.id ORDER BY monto DESC LIMIT 5`, R),
      /* 19 · Cobros pendientes (hasta 20). Trabajos completados con
             saldo > 0, ordenados por más viejo primero (los que más
             urgen). Es lo que "se ganó pero no ha entrado". */
      q(`SELECT s.id, s.fecha, s.servicio, s.monto,
                COALESCE((SELECT SUM(p.monto) FROM pagos p
                          WHERE p.servicio_id = s.id AND p.papelera IS NULL), 0) AS pagado,
                c.id AS cliente_id, c.nombre, c.telefono
         FROM servicios s JOIN clientes c ON c.id = s.cliente_id
         WHERE s.estado = 'completado' AND s.papelera IS NULL AND c.papelera IS NULL
           AND s.monto IS NOT NULL AND s.monto > 0
           AND s.monto > COALESCE((SELECT SUM(p.monto) FROM pagos p
                                    WHERE p.servicio_id = s.id AND p.papelera IS NULL), 0)
         ORDER BY s.fecha ASC LIMIT 20`),
      /* 20 · Cotizaciones a las que hay que darles seguimiento: se pasó
             el precio y todavía no se sabe en qué quedó. Se caen de la
             lista cuando alguien dice en qué quedaron —agendada, hecha o
             no se hizo— o cuando ya existe el trabajo que salió de ellas.
             Las que nadie toca se van solas a los 14 días: a esa altura
             ya no es seguimiento, es historia. */
      q(`SELECT co.id, co.numero, co.nombre, co.telefono, co.servicio,
                co.cedula, co.correo, co.provincia, co.canton, co.distrito,
                co.cliente_id, co.servicio_libre,
                co.monto_min, co.monto_max, datetime(co.creado, '-6 hours') AS creado,
                CAST((julianday('now') - julianday(co.creado)) * 24 AS INTEGER) AS horas
         FROM cotizaciones co
         WHERE co.papelera IS NULL
           AND co.estado NOT IN ('agendada', 'hecha', 'perdida')
           AND ${dia} >= date('now', '-6 hours', '-14 days')
           AND NOT EXISTS (SELECT 1 FROM servicios s
                            WHERE s.cotizacion_id = co.id AND s.papelera IS NULL)
         ORDER BY co.creado DESC LIMIT 10`),
      /* 21 · Trabajos AGENDADOS para hoy. La lista más importante del
             día, con la hora y el cliente. */
      q(`SELECT s.id, s.fecha, s.hora, s.servicio, s.detalle, s.estado,
                c.id AS cliente_id, c.nombre, c.telefono
         FROM servicios s JOIN clientes c ON c.id = s.cliente_id
         WHERE s.fecha = date('now', '-6 hours') AND s.papelera IS NULL AND c.papelera IS NULL
           AND s.estado IN ('programado', 'en_proceso')
         ORDER BY s.hora, s.id`),
      /* 22 · Ticket promedio del rango: facturado ÷ trabajos completados.
             Un número que dice si el mix está subiendo o bajando. */
      q(`SELECT COALESCE(AVG(monto), 0) AS avg, COUNT(*) AS n
         FROM servicios WHERE fecha BETWEEN ? AND ?
           AND estado = 'completado' AND papelera IS NULL AND monto > 0`, R),
      /* 23 · Cotizaciones emitidas en el rango (total, sin embudo). Y las
             que se convirtieron en servicio, para la tasa de conversión. */
      q(`SELECT
           (SELECT COUNT(*) FROM cotizaciones
             WHERE ${enRango} AND papelera IS NULL) AS total,
           (SELECT COUNT(DISTINCT s.cotizacion_id) FROM servicios s
             JOIN cotizaciones co ON co.id = s.cotizacion_id
             WHERE ${dia.replace(/creado/g, 'co.creado')} BETWEEN ? AND ?
               AND s.papelera IS NULL AND co.papelera IS NULL) AS convertidas`, [...R, ...R]),
      /* 24 · Trabajos agendados que YA PASARON y nadie cerró. Más de 24
             horas desde su momento —la fecha con su hora, y si no tiene
             hora, el final de ese día— y siguen en 'programado'. No son
             historia: son trabajo abierto. O se hizo y falta anotarlo, o
             no se hizo y hay que reagendarlo; en los dos casos alguien
             tiene que tocarlo, que es la definición de un pendiente. */
      q(`SELECT s.id, s.fecha, s.hora, s.servicio, s.detalle, s.nota, s.estado,
                c.id AS cliente_id, c.nombre, c.telefono,
                c.provincia, c.canton, c.distrito, c.senas,
                CAST(julianday(date('now', '-6 hours')) - julianday(s.fecha) AS INTEGER) AS dias
         FROM servicios s JOIN clientes c ON c.id = s.cliente_id
         WHERE s.estado IN ('programado', 'en_proceso')
           AND s.papelera IS NULL AND c.papelera IS NULL
           AND datetime(s.fecha || ' ' || COALESCE(NULLIF(s.hora, ''), '23:59'))
               < datetime('now', '-6 hours', '-1 day')
         ORDER BY s.fecha ASC, s.hora ASC LIMIT 20`),
      /* 25 · Lo facturado del rango, partido entre quien pidió factura
             electrónica y quien no. De la primera mitad sale el IVA que
             hay que enterarle a Hacienda; la segunda es sólo informativa.
             Si la columna todavía no existe, todo cae en "sin factura",
             que es la verdad hasta que se corra la migración. */
      q(conFE
        ? `SELECT fe, COUNT(*) AS n, COALESCE(SUM(monto), 0) AS s
             FROM servicios
            WHERE fecha BETWEEN ? AND ? AND estado = 'completado' AND papelera IS NULL
            GROUP BY fe`
        : `SELECT 0 AS fe, COUNT(*) AS n, COALESCE(SUM(monto), 0) AS s
             FROM servicios
            WHERE fecha BETWEEN ? AND ? AND estado = 'completado' AND papelera IS NULL`, R)
    ]);

    const filas = (i) => (r[i] && r[i].results) || [];
    const uno = (i) => filas(i)[0] || {};

    // La serie se rellena día por día: los días sin nada van en cero,
    // si no la gráfica miente sobre el ritmo.
    const porDiaCot = new Map(filas(0).map((f) => [f.d, f.n]));
    const porDiaSol = new Map(filas(1).map((f) => [f.d, f.n]));
    const serie = [];
    const inicio = Date.parse(desde + "T00:00:00Z");
    for (let i = 0; i < dias; i++) {
      const d = new Date(inicio + i * 86400000).toISOString().slice(0, 10);
      serie.push({ d, cot: porDiaCot.get(d) || 0, sol: porDiaSol.get(d) || 0 });
    }

    const porEstado = (i) => {
      const m = {};
      for (const f of filas(i)) m[f.estado] = f.n;
      return m;
    };
    const estCot = porEstado(2), estSol = porEstado(3);
    const suma = (m) => Object.keys(m).reduce((a, k) => a + m[k], 0);

    const enviadas = suma(estCot);
    const cerradas = estCot.hecha || 0;

    const pendientes = filas(4).map((f) => ({
      tabla: "cotizaciones", id: f.id, horas: f.horas, fecha: f.d,
      titulo: f.numero || ("Cotización " + f.id),
      nombre: f.nombre || "Sin nombre",
      detalle: etiqueta(f.servicio, null, "servicio") + ", " +
               montoTexto(f.monto_min, f.monto_max),
      lugar: [f.canton, f.provincia].filter(Boolean).join(", ") || null,
      tel: f.telefono || null,
      wa: waDe(f.telefono,
        "Buenas" + (f.nombre ? " " + primerNombre(f.nombre) : "") + ", le escribo de " +
        "Sanitarios Ticos por su cotización " + (f.numero || "") + ": " +
        etiqueta(f.servicio, null, "servicio").toLowerCase() + ", entre " +
        montoTexto(f.monto_min, f.monto_max) +
        ". ¿Le sirve que se lo coordinemos esta semana?")
    })).concat(filas(5).map((f) => ({
      tabla: "solicitudes", id: f.id, horas: f.horas, fecha: f.d,
      titulo: "Solicitud",
      nombre: f.nombre || "Sin nombre",
      detalle: f.servicio || "",
      lugar: f.zona || null,
      tel: f.telefono || null,
      wa: waDe(f.telefono,
        "Buenas" + (f.nombre ? " " + primerNombre(f.nombre) : "") + ", le escribo de " +
        "Sanitarios Ticos. Nos entró su solicitud de " + (f.servicio || "servicio").toLowerCase() +
        ". ¿Cuándo le queda bien que se lo coordinemos?")
    }))).sort((a, b) => b.horas - a.horas).slice(0, 20);

    const abierto = uno(9);
    const esperando = uno(10);
    const cobrado = uno(11);
    const antes = uno(12);
    const solViejas = (uno(13).n) || 0;
    const porVencer = (uno(14).n) || 0;

    // Variación contra el periodo anterior. Sin base no hay porcentaje:
    // pasar de 0 a 5 no es "subió 500%", es que antes no había nada.
    const variacion = (hoy, ayer) => (ayer > 0 ? Math.round(((hoy - ayer) / ayer) * 100) : null);

    const proximos = filas(15).map((f) => ({
      clienteId: f.cliente_id, nombre: f.nombre, telefono: f.telefono,
      servicio: etiqueta(f.servicio, null, "servicio"),
      lugar: [f.canton, f.provincia].filter(Boolean).join(", ") || null,
      proximo: f.proximo, dias: f.dias
    }));

    /* Lo que hay que hacer hoy, en una sola lista. El panel deja de ser
       una pantalla donde uno mira números y pasa a decir qué sigue.
       Cada línea es un conteo con su destino: no se listan los
       registros uno por uno porque la pregunta acá es "cuánto hay",
       no "cuál es". */
    /* Cada línea tiene que caber en un renglón de 375px. "solicitudes
       llevan más de un día esperando" se partía en dos y la tarjeta
       pasaba de cinco renglones a nueve. El número ya está al lado en
       su pastilla, así que el texto sólo tiene que nombrar la cosa. */
    // Hoy operativo: cinco bloques, cada uno una lista corta con enlace
    // directo al registro. Ya no se cuentan "cotizaciones sin responder"
    // (las cotizaciones dejaron de tener estado).
    const cobrosPend = filas(19).map((f) => ({
      id: f.id, clienteId: f.cliente_id, nombre: f.nombre, telefono: f.telefono,
      servicio: etiqueta(f.servicio, null, "servicio"),
      fecha: f.fecha, monto: f.monto, pagado: f.pagado, saldo: f.monto - f.pagado,
      wa: waDe(f.telefono, "Buenas" + (f.nombre ? " " + primerNombre(f.nombre) : "") +
        ", le escribo de Sanitarios Ticos por el saldo pendiente del " + fechaTexto(f.fecha) + ".")
    }));
    const cotizSinServicio = filas(20).map((f) => ({
      id: f.id, numero: f.numero || ("Cotización " + f.id),
      nombre: f.nombre, telefono: f.telefono,
      servicio: f.servicio_libre || etiqueta(f.servicio, null, "servicio"),
      /* Lo que hace falta para agendar sin volver a escribir nada: la
         clave cruda del servicio y la dirección que ya dio al cotizar. */
      servicioKey: f.servicio, clienteId: f.cliente_id || null,
      cedula: f.cedula || null, correo: f.correo || null,
      provincia: f.provincia || null, canton: f.canton || null, distrito: f.distrito || null,
      monto: montoTexto(f.monto_min, f.monto_max),
      creado: f.creado, horas: f.horas,
      wa: waDe(f.telefono, "Buenas" + (f.nombre ? " " + primerNombre(f.nombre) : "") +
        ", ¿quedó bien la cotización " + (f.numero || "") + " que le pasamos? ¿La coordinamos?")
    }));
    const trabajosHoy = filas(21).map((f) => ({
      id: f.id, clienteId: f.cliente_id, nombre: f.nombre, telefono: f.telefono,
      servicio: etiqueta(f.servicio, null, "servicio"),
      fecha: f.fecha, hora: f.hora, detalle: f.detalle, estado: f.estado,
      wa: waDe(f.telefono, "Buenas" + (f.nombre ? " " + primerNombre(f.nombre) : "") +
        ", le confirmo de Sanitarios Ticos la visita" +
        (f.hora ? " a las " + f.hora : " de hoy") + ".")
    }));
    /* Se devuelven con la misma forma que una cita de la agenda, porque
       las dos acciones que ofrecen —reagendar y marcar como hecha— son
       las mismas de allá y reciben el mismo objeto. */
    /* El IVA se calcula acá y no en el panel: la tasa vive en TARIFAS y
       el panel no tiene por qué saberla. */
    let feSi = { n: 0, s: 0 }, feNo = { n: 0, s: 0 };
    for (const f of filas(25)) {
      if (+f.fe === 1) feSi = { n: f.n || 0, s: f.s || 0 };
      else feNo = { n: (feNo.n + (f.n || 0)), s: (feNo.s + (f.s || 0)) };
    }
    const factura = {
      con: feSi.s, conTrabajos: feSi.n,
      sin: feNo.s, sinTrabajos: feNo.n,
      total: feSi.s + feNo.s,
      // Lo que hay que enterar: 13% de lo facturado con factura electrónica.
      iva: Math.round(feSi.s * TARIFAS.iva.tasa),
      tasa: TARIFAS.iva.tasa,
      // Mientras la migración no se corra, todo sale como "sin factura" y
      // el panel lo dice en vez de mostrar un cero que parece un dato.
      listo: conFE
    };

    const trabajosVencidos = filas(24).map((f) => ({
      id: f.id, clienteId: f.cliente_id, nombre: f.nombre, telefono: f.telefono || null,
      servicio: etiqueta(f.servicio, null, "servicio"), servicioKey: f.servicio,
      detalle: f.detalle || null, nota: f.nota || null,
      provincia: f.provincia || null, canton: f.canton || null,
      distrito: f.distrito || null, senas: f.senas || null,
      lugar: [f.canton, f.provincia].filter(Boolean).join(", ") || null,
      fecha: f.fecha, hora: f.hora || null, estado: f.estado, dias: f.dias,
      wa: waDe(f.telefono, "Buenas" + (f.nombre ? " " + primerNombre(f.nombre) : "") +
               ", le escribo de Sanitarios Ticos por la visita que teníamos para " +
               fechaTexto(f.fecha) + ".")
    }));

    const solicitudesNuevas = filas(5).slice(0, 6).map((f) => ({
      id: f.id, nombre: f.nombre, telefono: f.telefono,
      servicio: f.servicio, zona: f.zona, horas: f.horas
    }));
    const mantVencidos = proximos.filter((p) => p.dias < 0);
    const mantSemana = proximos.filter((p) => p.dias >= 0 && p.dias <= 7);

    return json({
      ok: true,
      desde, hasta, dias,
      serie,
      // Lo que pasó dentro del rango
      rango: { cot: suma(estCot), sol: suma(estSol) },
      // `monto` = facturado (lo que valieron los trabajos del rango).
      // `cobrado` = plata real recibida (suma de pagos del rango).
      // `saldo` = lo que falta por cobrar a hoy, de todo lo completado.
      ingresos: { monto: cobrado.s || 0, trabajos: cobrado.n || 0,
                  cobrado: (uno(16).s) || 0, saldo: (uno(17).s) || 0 },
      // Lo facturado partido por factura electrónica, y el IVA que sale.
      factura,
      previo: {
        desde: previo.desde, hasta: previo.hasta,
        cot: antes.cot || 0, sol: antes.sol || 0, ing: antes.ing || 0
      },
      variacion: {
        cot: variacion(suma(estCot), antes.cot || 0),
        sol: variacion(suma(estSol), antes.sol || 0),
        ing: variacion(cobrado.s || 0, antes.ing || 0)
      },
      // ---- Hoy: cinco listas operativas ----
      hoy: {
        trabajos: trabajosHoy,
        trabajosVencidos,
        cobrosPend, cotizSinServicio, solicitudes: solicitudesNuevas,
        mantenimientos: { vencidos: mantVencidos, semana: mantSemana }
      },
      // ---- Resumen: KPIs y desglose estratégico ----
      cotEmit: (uno(23).total) || 0,
      convertidas: (uno(23).convertidas) || 0,
      // Tasa de conversión: qué % de las cotizaciones acabó en servicio.
      conversion: (uno(23).total) > 0
        ? Math.round(((uno(23).convertidas || 0) / uno(23).total) * 100) : null,
      ticket: Math.round(uno(22).avg || 0),
      topClientes: filas(18).map((f) => ({
        id: f.id, nombre: f.nombre, telefono: f.telefono, trabajos: f.trabajos, monto: f.monto || 0
      })),
      porVencer,
      proximos,
      servicios:  filas(6).map((f) => ({
        id: f.k, k: etiqueta(f.k, null, "servicio"), n: f.n, monto: f.m || 0
      })),
      provincias: filas(7).map((f) => ({ id: f.k, k: f.k, n: f.n })),
      origenes:   filas(8).map((f) => ({ k: ORIGENES[f.k] || f.k, n: f.n })),
      abierto: { min: abierto.smin || 0, max: abierto.smax || 0 },
      estados: ESTADOS
    });
  } catch (e) {
    console.error("Error al armar el resumen:", e);
    return json({ ok: false, error: "No se pudo armar el resumen" }, 500);
  }
}

/* -------------------------------------------------------------
   Buscador global

   Una sola caja que encuentra lo mismo que uno buscaría a mano en tres
   pantallas distintas. El término se compara contra el nombre, el
   teléfono, la cédula y el número de cotización, que son las cuatro
   formas en que alguien recuerda a un cliente.
   ------------------------------------------------------------- */
async function buscarPanel(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);

  const q = texto(new URL(request.url).searchParams.get("q"), 60);
  if (!q || q.length < 2) return json({ ok: true, resultados: [] });
  const like = "%" + q + "%";

  try {
    const r = await env.DB.batch([
      env.DB.prepare(
        `SELECT id, nombre, telefono, canton, provincia FROM clientes
         WHERE nombre LIKE ?1 OR telefono LIKE ?1 OR cedula LIKE ?1
         ORDER BY nombre LIMIT 6`).bind(like),
      env.DB.prepare(
        `SELECT id, numero, nombre, telefono, servicio, estado,
                datetime(creado,'-6 hours') AS creado
         FROM cotizaciones
         WHERE numero LIKE ?1 OR nombre LIKE ?1 OR telefono LIKE ?1 OR cedula LIKE ?1
         ORDER BY creado DESC LIMIT 6`).bind(like),
      env.DB.prepare(
        `SELECT id, nombre, telefono, servicio, estado,
                datetime(creado,'-6 hours') AS creado
         FROM solicitudes
         WHERE nombre LIKE ?1 OR telefono LIKE ?1 OR cedula LIKE ?1
         ORDER BY creado DESC LIMIT 6`).bind(like)
    ]);

    const filas = (i) => (r[i] && r[i].results) || [];
    const resultados = [];

    for (const c of filas(0)) {
      resultados.push({
        tipo: "cliente", etiqueta: c.nombre,
        detalle: [c.telefono, [c.canton, c.provincia].filter(Boolean).join(", ")].filter(Boolean).join("   "),
        ir: { vista: "cliente", id: c.id }
      });
    }
    for (const c of filas(1)) {
      resultados.push({
        tipo: "cotizacion", etiqueta: c.numero || ("Cotización " + c.id),
        detalle: [c.nombre, etiqueta(c.servicio, null, "servicio"), nombreEstado(c.estado)]
                 .filter(Boolean).join("   "),
        ir: { vista: "cotizaciones", buscar: c.numero || c.telefono || c.nombre }
      });
    }
    for (const c of filas(2)) {
      resultados.push({
        tipo: "solicitud", etiqueta: c.nombre || ("Solicitud " + c.id),
        detalle: [c.telefono, c.servicio, nombreEstado(c.estado)].filter(Boolean).join("   "),
        ir: { vista: "solicitudes", buscar: c.telefono || c.nombre }
      });
    }
    return json({ ok: true, resultados });
  } catch (e) {
    console.error("Error al buscar:", e);
    return json({ ok: false, error: "No se pudo buscar" }, 500);
  }
}

/* =============================================================
   2b. Clientes, servicios hechos y recordatorios
   =============================================================

   Hasta acá el sistema guardaba lo que ENTRABA. Esto guarda lo que
   SALIÓ: qué trabajo se hizo, a quién, y cuándo le toca el siguiente.

   Un tanque séptico se limpia cada dos o tres años. Eso quiere decir
   que cada trabajo hecho es un cliente futuro con fecha conocida — y
   que no tener este registro es regalar esa venta. Es la razón de ser
   de esta sección.

   NO HAY QUE ALIMENTARLO A MANO. El cliente y el servicio se crean
   solos cuando el propietario marca una cotización como "Hecha", que
   es algo que ya hace. Lo único que se le pide de más es la fecha del
   trabajo y lo que cobró.
   ============================================================= */

const CANALES = { whatsapp: "WhatsApp", correo: "Correo", ambos: "WhatsApp y correo" };

/* Cada cuánto se repite un servicio. Va de tres meses porque una trampa
   de grasa de restaurante se limpia trimestral, no cada dos años como
   un tanque séptico de casa. La lista es cerrada: es lo que se acepta
   del panel y lo que se ofrece en los menús, de un solo lugar. */
const PERIODOS = [1, 2, 3, 6, 9, 12, 18, 24, 36, 48];
const MESES_LARGO = ["enero","febrero","marzo","abril","mayo","junio",
                     "julio","agosto","setiembre","octubre","noviembre","diciembre"];

function mesYAno(iso) {
  const p = String(iso || "").split("-");
  return p.length >= 2 ? MESES_LARGO[Number(p[1]) - 1] + " de " + p[0] : "";
}

// "el 18 de setiembre" — para confirmarle una cita al cliente.
function fechaTexto(iso) {
  const p = String(iso || "").split("-");
  return p.length === 3 ? "el " + Number(p[2]) + " de " + MESES_LARGO[Number(p[1]) - 1] : "";
}

const DIAS_LARGO = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

/* "miércoles 07 de octubre del 2026" — como lo escribe el certificado.
   El día de la semana se saca en UTC a propósito: con la hora local, una
   fecha como "2026-10-07" se corre un día según el huso y el certificado
   diría el día equivocado. */
function fechaConDia(iso) {
  const p = String(iso || "").split("-");
  if (p.length !== 3) return "";
  const d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  if (isNaN(d.getTime())) return "";
  return DIAS_LARGO[d.getUTCDay()] + " " + String(+p[2]).padStart(2, "0") +
         " de " + MESES_LARGO[+p[1] - 1] + " del " + p[0];
}

/* Crea el cliente o lo actualiza si ya existe. El teléfono es la llave:
   la cédula mucha gente no la da y el correo se pierde, pero el número
   siempre está. Los datos nuevos sólo pisan a los viejos cuando traen
   algo — así una cotización sin correo no le borra el correo a alguien
   que ya lo había dado. */
async function guardarCliente(env, d) {
  const tel = normalizarTelefono(d.telefono);
  if (!tel.ok) return null;

  await env.DB.prepare(
    `INSERT INTO clientes (nombre, telefono, cedula, correo, provincia, canton, distrito, senas, actualizado)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'))
     ON CONFLICT(telefono) DO UPDATE SET
       nombre      = COALESCE(NULLIF(excluded.nombre, ''), clientes.nombre),
       cedula      = COALESCE(NULLIF(excluded.cedula, ''), clientes.cedula),
       correo      = COALESCE(NULLIF(excluded.correo, ''), clientes.correo),
       provincia   = COALESCE(NULLIF(excluded.provincia, ''), clientes.provincia),
       canton      = COALESCE(NULLIF(excluded.canton, ''), clientes.canton),
       distrito    = COALESCE(NULLIF(excluded.distrito, ''), clientes.distrito),
       senas       = COALESCE(NULLIF(excluded.senas, ''), clientes.senas),
       actualizado = datetime('now')`
  ).bind(
    texto(d.nombre, 120) || "Sin nombre", tel.valor, texto(d.cedula, 20) || "",
    texto(d.correo, 120) || "", texto(d.provincia, 40) || "",
    texto(d.canton, 60) || "", texto(d.distrito, 80) || "", texto(d.senas, 200) || ""
  ).run();

  const fila = await env.DB.prepare(`SELECT id, meses FROM clientes WHERE telefono = ?`)
    .bind(tel.valor).first();
  return fila || null;
}

/* Anota el trabajo y calcula cuándo toca el siguiente. La fecha es la
   del trabajo, no la del registro: de ella sale el recordatorio, así
   que anotarla mal corre la fecha dos años. */
/* `servicios` es ahora la única tabla de trabajos: programados, en
   proceso, completados o cancelados (F1). El ESTADO manda:
     - 'completado' es lo que de verdad se hizo. SOLO ese lleva `proximo`
       (corre el mantenimiento) y cuenta como cobrado.
     - 'programado' es un trabajo con fecha futura (lo que antes era una
       cita): sin `proximo` ni `monto`, para no correr el reloj ni sumar
       plata que nadie ha cobrado.
   Devuelve el id del servicio recién creado. */
async function guardarServicio(env, clienteId, d, meses) {
  const m = PERIODOS.indexOf(+d.meses) !== -1 ? +d.meses : (meses || 24);
  const estado = ["programado", "en_proceso", "completado", "cancelado"].indexOf(d.estado) !== -1
    ? d.estado : "completado";
  const fecha = soloFecha(d.fecha) || new Date(Date.now() - 6 * 3600 * 1000).toISOString().slice(0, 10);
  const hm = String(d.hora || "").match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  const hora = hm ? (hm[1].padStart(2, "0") + ":" + hm[2]) : null;
  // El reloj del mantenimiento solo arranca cuando el trabajo se hizo.
  const proximo = estado === "completado" ? `date(?2, '+' || ${m} || ' months')` : "NULL";

  const r = await env.DB.prepare(
    `INSERT INTO servicios (cliente_id, fecha, hora, servicio, detalle, monto,
                            cotizacion, cotizacion_id, solicitud_id, proximo, nota, estado)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ${proximo}, ?10, ?11)`
  ).bind(
    clienteId, fecha, hora, texto(d.servicio, 40) || "servicio",
    texto(d.detalle, 200) || null,
    Number.isFinite(+d.monto) ? Math.round(+d.monto) : null,
    texto(d.cotizacion, 30) || null,
    Number.isFinite(+d.cotizacionId) ? +d.cotizacionId : null,
    Number.isFinite(+d.solicitudId) ? +d.solicitudId : null,
    texto(d.nota, 300) || null, estado
  ).run();

  // Si en el registro se cambió la periodicidad, el cliente se queda
  // con la nueva: es la que va a usar el próximo trabajo.
  if (m !== meses) {
    await env.DB.prepare(`UPDATE clientes SET meses = ?1, actualizado = datetime('now') WHERE id = ?2`)
      .bind(m, clienteId).run();
  }
  const id = r.meta && r.meta.last_row_id;

  // Un trabajo COMPLETADO arma (o reemplaza) el mantenimiento del cliente
  // y, si se dijo cómo pagó (no "pendiente"), deja el pago registrado.
  if (estado === "completado") {
    await gestionarMantenimiento(env, {
      id, clienteId, tipo: texto(d.servicio, 40) || "servicio", fecha, meses: m
    }, d.mantenimiento);
    const montoNum = Number.isFinite(+d.monto) ? Math.round(+d.monto) : 0;
    if (d.metodo && d.metodo !== "pendiente" && montoNum > 0) {
      await registrarPago(env, { servicioId: id, clienteId, monto: montoNum, metodo: d.metodo, fecha });
    }
  }
  return id;
}

/* El mantenimiento como entidad (F2). Cuando un servicio se completa,
   este es el único lugar que decide qué pasa con "cuándo le toca la
   próxima" de ese cliente para ese tipo de trabajo:

     - No tenía mantenimiento de ese tipo → nace uno 'programado'.
     - Ya tenía uno y llegó su fecha → el viejo queda 'hecho' y nace el
       siguiente.
     - Ya tenía uno a FUTURO y el cliente re-contrató antes (§14):
         · decisión 'mantener' → se respeta el viejo, no nace ninguno.
         · por defecto → el viejo queda 'reemplazado' (apuntando a qué
           servicio lo reemplazó) y nace el nuevo. NUNCA se borra: el
           historial queda entero. */
async function gestionarMantenimiento(env, s, decision) {
  if (!s || !s.clienteId || !s.tipo || !s.fecha) return null;
  const m = PERIODOS.indexOf(+s.meses) !== -1 ? +s.meses : 24;
  try {
    const prev = await env.DB.prepare(
      `SELECT id, fecha FROM mantenimientos
        WHERE cliente_id = ?1 AND tipo = ?2 AND estado = 'programado' AND papelera IS NULL
        ORDER BY fecha DESC, id DESC LIMIT 1`
    ).bind(s.clienteId, s.tipo).first();

    let accion = "nuevo", anterior = null;
    if (prev) {
      anterior = prev.fecha;
      const adelantado = String(s.fecha) < String(prev.fecha);
      if (adelantado && decision === "mantener") {
        return { accion: "mantenido", anterior };           // se respeta el viejo
      }
      accion = adelantado ? "reemplazado" : "renovado";
      await env.DB.prepare(
        `UPDATE mantenimientos SET estado = ?1, reemplazado_por = ?2, actualizado = datetime('now')
          WHERE id = ?3`
      ).bind(adelantado ? "reemplazado" : "hecho", adelantado ? (s.id || null) : null, prev.id).run();
    }

    // La fecha del próximo: una escrita a mano (fechaManual) o la del
    // trabajo + la periodicidad.
    const fechaManual = soloFecha(s.fechaManual);
    const r = fechaManual
      ? await env.DB.prepare(
          `INSERT INTO mantenimientos (cliente_id, servicio_id, tipo, fecha, meses, estado)
           VALUES (?1, ?2, ?3, date(?4), ?5, 'programado')`
        ).bind(s.clienteId, s.id || null, s.tipo, fechaManual, m).run()
      : await env.DB.prepare(
          `INSERT INTO mantenimientos (cliente_id, servicio_id, tipo, fecha, meses, estado)
           VALUES (?1, ?2, ?3, date(?4, '+' || ?5 || ' months'), ?5, 'programado')`
        ).bind(s.clienteId, s.id || null, s.tipo, s.fecha, m).run();

    return { accion, anterior, id: r.meta && r.meta.last_row_id };
  } catch (e) {
    console.error("No se pudo gestionar el mantenimiento:", e);
    return null;
  }
}

/* ¿Este cliente ya tiene un mantenimiento a FUTURO de este tipo? Lo usa el
   panel antes de completar un trabajo, para ofrecer la decisión del §14
   (reemplazarlo o mantenerlo) en vez de decidir a ciegas. */
async function mantenimientoFuturo(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);
  const url = new URL(request.url);
  const cliente = parseInt(url.searchParams.get("cliente"), 10);
  const tipo = texto(url.searchParams.get("tipo"), 40);
  const fecha = soloFecha(url.searchParams.get("fecha")) ||
                new Date(Date.now() - 6 * 3600 * 1000).toISOString().slice(0, 10);
  if (!Number.isFinite(cliente) || !tipo) return json({ ok: true, mantenimiento: null });
  try {
    const prev = await env.DB.prepare(
      `SELECT id, fecha FROM mantenimientos
        WHERE cliente_id = ?1 AND tipo = ?2 AND estado = 'programado' AND papelera IS NULL AND fecha > ?3
        ORDER BY fecha DESC LIMIT 1`
    ).bind(cliente, tipo, fecha).first();
    return json({ ok: true, mantenimiento: prev ? { id: prev.id, fecha: prev.fecha } : null });
  } catch (e) {
    return json({ ok: true, mantenimiento: null });
  }
}

/* -------------------------------------------------------------
   Pagos (F3): un servicio puede recibir varios abonos. El saldo y el
   estado se calculan; nunca se guardan a mano.
   ------------------------------------------------------------- */
const METODOS_PAGO = ["efectivo", "sinpe", "transferencia", "tarjeta", "otro", "no-registrado"];

async function registrarPago(env, p) {
  if (!p || !Number.isFinite(+p.servicioId)) return null;
  const monto = Math.round(+p.monto);
  if (!Number.isFinite(monto) || monto <= 0) return null;
  const metodo = METODOS_PAGO.indexOf(p.metodo) !== -1 ? p.metodo : "otro";
  const fecha = soloFecha(p.fecha) || new Date(Date.now() - 6 * 3600 * 1000).toISOString().slice(0, 10);
  const r = await env.DB.prepare(
    `INSERT INTO pagos (servicio_id, cliente_id, monto, metodo, fecha, nota)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
  ).bind(+p.servicioId, Number.isFinite(+p.clienteId) ? +p.clienteId : null,
         monto, metodo, fecha, texto(p.nota, 300) || null).run();
  return r.meta && r.meta.last_row_id;
}

// Registrar un abono desde el panel (pago parcial o total de un servicio).
async function crearPago(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);
  let b;
  try { b = await request.json(); }
  catch { return json({ ok: false, error: "Formato inválido" }, 400); }

  const servicioId = parseInt(b.servicioId, 10);
  if (!Number.isFinite(servicioId)) return json({ ok: false, error: "Servicio inválido" }, 400);
  // Solo los dígitos: acepta "40000", "₡40.000" o 40000.
  const monto = Math.round(+String(b.monto == null ? "" : b.monto).replace(/\D/g, ""));
  if (!Number.isFinite(monto) || monto <= 0) return json({ ok: false, error: "El monto del pago no es válido" }, 400);

  try {
    // El cliente del pago sale del propio servicio, para no confiar en el panel.
    const s = await env.DB.prepare(`SELECT cliente_id FROM servicios WHERE id = ? AND papelera IS NULL`)
      .bind(servicioId).first();
    if (!s) return json({ ok: false, error: "No existe ese servicio" }, 404);
    const id = await registrarPago(env, {
      servicioId, clienteId: s.cliente_id, monto, metodo: b.metodo, fecha: b.fecha, nota: b.nota
    });
    return json({ ok: true, id });
  } catch (e) {
    console.error("No se pudo registrar el pago:", e);
    return json({ ok: false, error: "No se pudo guardar el pago" }, 500);
  }
}

// Borrar un pago = mandarlo a la papelera (nunca se destruye: §29).
async function borrarPago(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);
  let b;
  try { b = await request.json(); }
  catch { return json({ ok: false, error: "Formato inválido" }, 400); }
  const id = parseInt(b.id, 10);
  if (!Number.isFinite(id)) return json({ ok: false, error: "Pago inválido" }, 400);
  try {
    await env.DB.prepare(`UPDATE pagos SET papelera = datetime('now') WHERE id = ?`).bind(id).run();
    return json({ ok: true });
  } catch (e) {
    console.error("No se pudo borrar el pago:", e);
    return json({ ok: false, error: "No se pudo borrar el pago" }, 500);
  }
}

// El estado de pago de un servicio, a partir de su monto final y lo pagado.
function estadoPago(monto, pagado) {
  const m = Math.round(+monto) || 0, p = Math.round(+pagado) || 0;
  if (m <= 0) return p > 0 ? "pagado" : "sin-monto";
  if (p <= 0) return "pendiente";
  if (p < m) return "parcial";
  return "pagado";
}

/* -------------------------------------------------------------
   La sección Servicios (§8): todos los trabajos de todos los clientes en
   una sola lista, con filtros por estado y tipo. Cada fila trae su cliente
   (enlace) y su estado de pago.
   ------------------------------------------------------------- */
async function listaServicios(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);

  const url = new URL(request.url);
  const estados = ["programado", "en_proceso", "completado", "cancelado"];
  const estado = estados.indexOf(url.searchParams.get("estado")) !== -1 ? url.searchParams.get("estado") : "";
  const tipo = texto(url.searchParams.get("tipo"), 40);
  const q = texto(url.searchParams.get("q"), 60);
  const pedida = parseInt(url.searchParams.get("pagina"), 10);
  const pagina = Number.isFinite(pedida) && pedida > 0 ? pedida : 1;
  const POR = 30;

  const cond = ["s.papelera IS NULL", "c.papelera IS NULL"];
  const val = [];
  if (estado) { cond.push("s.estado = ?"); val.push(estado); }
  if (tipo) { cond.push("s.servicio = ?"); val.push(tipo); }
  if (q) { cond.push("(c.nombre LIKE ? OR c.telefono LIKE ?)"); val.push("%" + q + "%", "%" + q + "%"); }
  const donde = "WHERE " + cond.join(" AND ");

  try {
    const total = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM servicios s JOIN clientes c ON c.id = s.cliente_id ${donde}`
    ).bind(...val).first();

    const { results } = await env.DB.prepare(
      `SELECT s.id, s.fecha, s.hora, s.servicio, s.detalle, s.monto, s.estado, s.proximo,
              s.cotizacion, s.cotizacion_id,
              ${(await hayColumna(env, "servicios", "fe")) ? "s.fe" : "0"} AS fe,
              ${(await hayColumna(env, "servicios", "volumen")) ? "s.volumen" : "NULL"} AS volumen,
              ${(await hayColumna(env, "servicios", "placa")) ? "s.placa" : "NULL"} AS placa,
              ${await columnaDocumentos(env, "s")},
              c.id AS cliente_id, c.nombre, c.telefono, c.cedula, c.provincia, c.canton, c.distrito,
              (SELECT COALESCE(SUM(p.monto), 0) FROM pagos p
                WHERE p.servicio_id = s.id AND p.papelera IS NULL) AS pagado
         FROM servicios s JOIN clientes c ON c.id = s.cliente_id
         ${donde}
         ORDER BY s.fecha DESC, s.hora DESC, s.id DESC
         LIMIT ? OFFSET ?`
    ).bind(...val, POR, (pagina - 1) * POR).all();

    // Conteo por estado (para las pastillas de los filtros) y tipos que hay.
    const cnt = ((await env.DB.prepare(
      `SELECT estado, COUNT(*) AS n FROM servicios WHERE papelera IS NULL GROUP BY estado`
    ).all()).results) || [];
    const counts = {};
    cnt.forEach((r) => { counts[r.estado] = r.n; });

    const tipos = ((await env.DB.prepare(
      `SELECT servicio AS k, COUNT(*) AS n FROM servicios
        WHERE papelera IS NULL AND servicio IS NOT NULL AND servicio <> ''
        GROUP BY k ORDER BY n DESC`
    ).all()).results) || [];

    return json({
      ok: true,
      servicios: results.map((s) => {
        const monto = s.monto || 0, pagado = s.pagado || 0;
        return {
          id: s.id, clienteId: s.cliente_id, cliente: s.nombre, telefono: s.telefono || null,
          servicio: etiqueta(s.servicio, null, "servicio"), servicioKey: s.servicio,
          fe: +s.fe === 1,
          // Para el certificado: si ya se anotaron, no se vuelven a pedir.
          volumen: s.volumen || null, placa: s.placa || null,
          /* Lo que ya se emitió de este trabajo y qué le falta al
             cliente para poder certificarlo. Con esto el menú dice
             "Ver certificado" en vez de "Crear", y avisa de lo que
             falta antes de hacer el viaje. */
          documentos: documentosDeFila(s.docs),
          faltaCertificado: faltaParaCertificar(s),
          detalle: s.detalle || null,
          provincia: s.provincia || null, canton: s.canton || null,
          lugar: [s.canton, s.provincia].filter(Boolean).join(", ") || null,
          fecha: s.fecha, hora: s.hora || null, estado: s.estado, proximo: s.proximo || null,
          cotizacion: s.cotizacion || null, cotizacionId: s.cotizacion_id || null,
          monto, pagado,
          saldo: s.estado === "completado" ? Math.max(0, monto - pagado) : 0,
          estadoPago: estadoPago(monto, pagado),
          // Un WhatsApp ya armado para contactar sin salir de la lista.
          wa: waDe(s.telefono, "Buenas" + (s.nombre ? " " + primerNombre(s.nombre) : "") +
                   ", le escribo de Sanitarios Ticos.")
        };
      }),
      total: total ? total.n : 0,
      pagina, porPagina: POR,
      paginas: Math.max(1, Math.ceil((total ? total.n : 0) / POR)),
      counts,
      tipos: tipos.map((t) => ({ id: t.k, etiqueta: etiqueta(t.k, null, "servicio"), n: t.n }))
    });
  } catch (e) {
    console.error("Error al listar servicios:", e);
    return json({ ok: false, error: "No se pudo consultar" }, 500);
  }
}

/* Corregir un servicio en cualquier estado (incluido 'completado'):
   fecha, hora, monto y detalle. Sirve para arreglar un error de captura
   sin tener que borrar y volver a crear. Si es completado y cambia la
   fecha, se mueve también su próximo mantenimiento (el que él generó). */
async function editarServicio(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);
  let b;
  try { b = await request.json(); } catch { return json({ ok: false, error: "Formato inválido" }, 400); }
  const id = parseInt(b.id, 10);
  const fecha = soloFecha(b.fecha);
  if (!Number.isFinite(id) || !fecha) return json({ ok: false, error: "Falta la fecha" }, 400);
  const hm = String(b.hora || "").match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  const hora = hm ? (hm[1].padStart(2, "0") + ":" + hm[2]) : null;
  const monto = (b.monto === "" || b.monto == null) ? null
              : (Number.isFinite(+b.monto) ? Math.round(+b.monto) : null);
  try {
    const s = await env.DB.prepare(
      `SELECT s.estado, s.nota, c.meses FROM servicios s JOIN clientes c ON c.id = s.cliente_id
        WHERE s.id = ? AND s.papelera IS NULL`).bind(id).first();
    if (!s) return json({ ok: false, error: "No existe ese servicio" }, 404);
    const comp = s.estado === "completado";
    const conFE = await hayColumna(env, "servicios", "fe");
    const fe = b.fe === true || b.fe === 1 || b.fe === "1" ? 1 : 0;
    await env.DB.prepare(
      `UPDATE servicios SET fecha = ?1, hora = ?2, monto = ?3, detalle = ?4, nota = ?8
              ${conFE ? ", fe = ?9" : ""},
              proximo = CASE WHEN ?5 = 1 AND proximo IS NOT NULL
                             THEN date(?1, '+' || ?6 || ' months') ELSE proximo END,
              actualizado = datetime('now')
        WHERE id = ?7`
    ).bind(fecha, hora, monto, texto(b.detalle, 200) || null, comp ? 1 : 0, s.meses || 24, id,
           texto(b.nota, 600) || null, ...(conFE ? [fe] : [])).run();
    if (comp) {
      await env.DB.prepare(
        `UPDATE mantenimientos SET fecha = date(?1, '+' || COALESCE(meses, ?2) || ' months'),
                actualizado = datetime('now')
          WHERE servicio_id = ?3 AND estado = 'programado' AND papelera IS NULL`
      ).bind(fecha, s.meses || 24, id).run();
    }
    return json({ ok: true });
  } catch (e) {
    console.error("Error al editar el servicio:", e);
    return json({ ok: false, error: "No se pudo guardar" }, 500);
  }
}

/* Crear, editar o quitar el mantenimiento de un cliente a mano. Sigue
   habiendo UNO programado por cliente y tipo: si ya existe, se actualiza
   ese. Cuando el trabajo se hace, nace el siguiente con la misma
   periodicidad (repetición sin llenar el calendario). */
async function guardarMantenimiento(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);
  let b;
  try { b = await request.json(); } catch { return json({ ok: false, error: "Formato inválido" }, 400); }
  const id = parseInt(b.id, 10);
  try {
    if (b.quitar === true) {
      if (!Number.isFinite(id)) return json({ ok: false, error: "Mantenimiento inválido" }, 400);
      await env.DB.prepare(`UPDATE mantenimientos SET estado = 'cancelado', actualizado = datetime('now') WHERE id = ?`)
        .bind(id).run();
      // El "próximo" del servicio que lo originó deja de mostrarse.
      await env.DB.prepare(`UPDATE servicios SET proximo = NULL
         WHERE id = (SELECT servicio_id FROM mantenimientos WHERE id = ?)`).bind(id).run();
      return json({ ok: true });
    }
    const clienteId = parseInt(b.clienteId, 10);
    const tipo = texto(b.tipo, 40);
    const fecha = soloFecha(b.fecha);
    const meses = PERIODOS.indexOf(+b.meses) !== -1 ? +b.meses : 24;
    if (!Number.isFinite(clienteId) || !tipo || !fecha) return json({ ok: false, error: "Faltan datos" }, 400);
    let destino = Number.isFinite(id) ? id : null;
    if (!destino) {
      const ya = await env.DB.prepare(
        `SELECT id FROM mantenimientos WHERE cliente_id = ?1 AND tipo = ?2
            AND estado = 'programado' AND papelera IS NULL LIMIT 1`).bind(clienteId, tipo).first();
      destino = ya ? ya.id : null;
    }
    if (destino) {
      await env.DB.prepare(
        `UPDATE mantenimientos SET tipo = ?1, fecha = ?2, meses = ?3, actualizado = datetime('now')
          WHERE id = ?4`).bind(tipo, fecha, meses, destino).run();
      // Mantener sincronizado el "próximo" del servicio que lo originó
      // (es lo que muestra el historial del cliente).
      await env.DB.prepare(`UPDATE servicios SET proximo = ?1
         WHERE id = (SELECT servicio_id FROM mantenimientos WHERE id = ?2)`).bind(fecha, destino).run();
    } else {
      await env.DB.prepare(
        `INSERT INTO mantenimientos (cliente_id, tipo, fecha, meses, estado)
         VALUES (?1, ?2, ?3, ?4, 'programado')`).bind(clienteId, tipo, fecha, meses).run();
    }
    return json({ ok: true });
  } catch (e) {
    console.error("Error al guardar el mantenimiento:", e);
    return json({ ok: false, error: "No se pudo guardar" }, 500);
  }
}

/* Todos los mantenimientos, agrupados para la vista dedicada (§12). No es
   la Agenda (que solo muestra los 'programado' con recordatorio): acá
   está TODO, incluido el historial de reemplazos (§14), para poder ver
   qué le tocó a quién y qué pasó con cada uno. Se lee de `mantenimientos`,
   la única fuente. La ubicación y el nombre salen del cliente. */
async function listaMantenimientos(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);
  try {
    const { results } = await env.DB.prepare(
      `SELECT m.id, m.tipo, m.fecha, m.estado, m.meses, m.reemplazado_por,
              so.fecha AS hechoFecha,
              c.id AS cliente_id, c.nombre, c.telefono, c.canton, c.provincia, c.recordatorio,
              CAST(julianday(m.fecha) - julianday(date('now','-6 hours')) AS INTEGER) AS dias
         FROM mantenimientos m
         JOIN clientes c ON c.id = m.cliente_id
         LEFT JOIN servicios so ON so.id = m.servicio_id
        WHERE m.papelera IS NULL AND c.papelera IS NULL
        ORDER BY m.fecha DESC, m.id DESC`
    ).all();

    const items = (results || []).map((m) => ({
      id: m.id, clienteId: m.cliente_id, nombre: m.nombre, telefono: m.telefono || null,
      servicio: etiqueta(m.tipo, null, "servicio"), tipo: m.tipo,
      lugar: [m.canton, m.provincia].filter(Boolean).join(", ") || null,
      fecha: m.fecha, hechoFecha: m.hechoFecha || null, estado: m.estado,
      dias: m.dias, recordatorio: !!m.recordatorio
    }));

    // Un mantenimiento 'programado' con fecha pasada es un VENCIDO: se
    // saca aparte porque es lo que de verdad hay que atender.
    const vencidos = items.filter((i) => i.estado === "programado" && i.dias < 0);
    const proximos = items.filter((i) => i.estado === "programado" && i.dias >= 0)
                          .sort((a, b) => a.dias - b.dias);
    const historial = items.filter((i) => i.estado !== "programado");

    return json({
      ok: true,
      vencidos, proximos, historial,
      counts: { vencidos: vencidos.length, proximos: proximos.length, historial: historial.length }
    });
  } catch (e) {
    console.error("Error al listar mantenimientos:", e);
    return json({ ok: false, error: "No se pudo consultar" }, 500);
  }
}

/* =============================================================
   F4 · Papelera universal (borrado lógico)

   Nada se destruye al borrar: se marca `papelera` con la fecha. Deja de
   verse en las listas, pero se puede restaurar. Eliminar de verdad
   (DELETE) es un segundo paso, solo desde la papelera. Borrar un cliente
   NO borra en cascada sus cotizaciones/servicios/pagos: quedan, y como
   las listas filtran por el cliente activo, no aparecen huérfanos; al
   restaurar el cliente vuelven a verse.
   ============================================================= */
const PAPELERA_TABLAS = {
  cliente: "clientes", cotizacion: "cotizaciones", servicio: "servicios",
  pago: "pagos", solicitud: "solicitudes", mantenimiento: "mantenimientos"
};

async function papeleraAccion(request, env, accion) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);
  let b;
  try { b = await request.json(); } catch { return json({ ok: false, error: "Formato inválido" }, 400); }
  const tabla = PAPELERA_TABLAS[b.tabla];   // clave de un allowlist: nunca texto libre
  const id = parseInt(b.id, 10);
  if (!tabla || !Number.isFinite(id)) return json({ ok: false, error: "Registro inválido" }, 400);
  try {
    if (accion === "borrar") {
      await env.DB.prepare(`UPDATE ${tabla} SET papelera = datetime('now') WHERE id = ?`).bind(id).run();
    } else if (accion === "restaurar") {
      await env.DB.prepare(`UPDATE ${tabla} SET papelera = NULL WHERE id = ?`).bind(id).run();
    } else { // eliminar definitivo: solo lo que YA está en la papelera
      await env.DB.prepare(`DELETE FROM ${tabla} WHERE id = ? AND papelera IS NOT NULL`).bind(id).run();
    }
    return json({ ok: true });
  } catch (e) {
    console.error("Papelera (" + accion + "):", e);
    return json({ ok: false, error: "No se pudo completar" }, 500);
  }
}

async function papeleraLista(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);
  const money = (n) => "₡" + String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const q = (sql) => env.DB.prepare(sql).all().then((r) => r.results || []).catch(() => []);
  try {
    const [cli, cot, ser, pag, sol, man] = await Promise.all([
      q(`SELECT id, nombre, telefono, papelera FROM clientes WHERE papelera IS NOT NULL ORDER BY papelera DESC`),
      q(`SELECT id, numero, nombre, papelera FROM cotizaciones WHERE papelera IS NOT NULL ORDER BY papelera DESC`),
      q(`SELECT s.id, s.servicio, s.fecha, s.papelera, c.nombre FROM servicios s
          LEFT JOIN clientes c ON c.id = s.cliente_id WHERE s.papelera IS NOT NULL ORDER BY s.papelera DESC`),
      q(`SELECT p.id, p.monto, p.fecha, p.papelera, c.nombre FROM pagos p
          LEFT JOIN clientes c ON c.id = p.cliente_id WHERE p.papelera IS NOT NULL ORDER BY p.papelera DESC`),
      q(`SELECT id, nombre, servicio, papelera FROM solicitudes WHERE papelera IS NOT NULL ORDER BY papelera DESC`),
      q(`SELECT m.id, m.tipo, m.fecha, m.papelera, c.nombre FROM mantenimientos m
          LEFT JOIN clientes c ON c.id = m.cliente_id WHERE m.papelera IS NOT NULL ORDER BY m.papelera DESC`)
    ]);
    const it = (tabla, id, titulo, sub, papelera) => ({ tabla, id, titulo, sub: sub || "", papelera });
    const grupos = [
      { tabla: "cliente", nombre: "Clientes", items: cli.map((r) => it("cliente", r.id, r.nombre || "Sin nombre", r.telefono, r.papelera)) },
      { tabla: "cotizacion", nombre: "Cotizaciones", items: cot.map((r) => it("cotizacion", r.id, r.numero || ("Cotización " + r.id), r.nombre, r.papelera)) },
      { tabla: "servicio", nombre: "Servicios", items: ser.map((r) => it("servicio", r.id, etiqueta(r.servicio, null, "servicio"), [r.nombre, r.fecha].filter(Boolean).join(" · "), r.papelera)) },
      { tabla: "pago", nombre: "Pagos", items: pag.map((r) => it("pago", r.id, money(r.monto), [r.nombre, r.fecha].filter(Boolean).join(" · "), r.papelera)) },
      { tabla: "solicitud", nombre: "Solicitudes", items: sol.map((r) => it("solicitud", r.id, r.nombre || "Solicitud", r.servicio, r.papelera)) },
      { tabla: "mantenimiento", nombre: "Mantenimientos", items: man.map((r) => it("mantenimiento", r.id, etiqueta(r.tipo, null, "servicio"), [r.nombre, r.fecha].filter(Boolean).join(" · "), r.papelera)) }
    ].filter((g) => g.items.length);
    return json({ ok: true, grupos, total: grupos.reduce((a, g) => a + g.items.length, 0) });
  } catch (e) {
    console.error("Lista de papelera:", e);
    return json({ ok: false, error: "No se pudo consultar" }, 500);
  }
}

// Qué cuelga de un registro, para avisar antes de borrarlo (§21).
async function dependenciasRegistro(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);
  const url = new URL(request.url);
  const tabla = texto(url.searchParams.get("tabla"), 20);
  const id = parseInt(url.searchParams.get("id"), 10);
  if (!Number.isFinite(id)) return json({ ok: true, dep: {} });
  try {
    if (tabla === "cliente") {
      const r = await env.DB.prepare(
        `SELECT
           (SELECT COUNT(*) FROM cotizaciones  WHERE cliente_id = ?1 AND papelera IS NULL) AS cotizaciones,
           (SELECT COUNT(*) FROM servicios     WHERE cliente_id = ?1 AND papelera IS NULL) AS servicios,
           (SELECT COUNT(*) FROM pagos         WHERE cliente_id = ?1 AND papelera IS NULL) AS pagos,
           (SELECT COUNT(*) FROM mantenimientos WHERE cliente_id = ?1 AND papelera IS NULL AND estado = 'programado') AS mantenimientos`
      ).bind(id).first();
      return json({ ok: true, dep: r || {} });
    }
    if (tabla === "servicio") {
      const r = await env.DB.prepare(
        `SELECT (SELECT COUNT(*) FROM pagos WHERE servicio_id = ?1 AND papelera IS NULL) AS pagos`
      ).bind(id).first();
      return json({ ok: true, dep: r || {} });
    }
    return json({ ok: true, dep: {} });
  } catch (e) {
    return json({ ok: true, dep: {} });
  }
}

// El texto del recordatorio. Sale del servidor porque es el que tiene
// la fecha y el servicio; el panel sólo lo abre en WhatsApp.
function mensajeRecordatorio(f) {
  const quien = f.nombre ? " " + primerNombre(f.nombre) : "";
  const donde = f.canton ? " en " + f.canton : "";
  return "Buenas" + quien + ", le escribo de Sanitarios Ticos. " +
    "La última vez que le hicimos " + etiqueta(f.servicio, null, "servicio").toLowerCase() +
    donde + " fue en " + mesYAno(f.fecha) + ", así que ya le toca la siguiente. " +
    "¿Se la agendamos?";
}

/* -------------------------------------------------------------
   Listado de clientes
   ------------------------------------------------------------- */
async function listaClientes(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);

  const url = new URL(request.url);
  /* Dos listas en una pantalla (guía § Clientes):
       clientes — a quien ya se le HIZO un servicio (tabla clientes).
       posibles — a quien se le cotizó pero todavía no se le ha hecho
                  nada. Esos no viven en la tabla clientes: salen de las
                  cotizaciones, agrupadas por teléfono, quitando a los que
                  ya son clientes de verdad. */
  if (url.searchParams.get("tipo") === "posibles") return listaPosibles(request, env);
  const busca = texto(url.searchParams.get("q"), 60);
  const provincia = texto(url.searchParams.get("provincia"), 40);
  const servicio = texto(url.searchParams.get("servicio"), 40);
  const pedida = parseInt(url.searchParams.get("pagina"), 10);
  const pagina = Number.isFinite(pedida) && pedida > 0 ? pedida : 1;

  /* Tres formas de ordenar, y cada una contesta una pregunta distinta:
       nombre    ¿dónde está fulano?
       pronto    ¿a quién le toca ya?      — lo vencido primero
       reciente  ¿qué acabo de hacer?      — el último trabajo primero
     Sin esto la lista salía siempre alfabética, que es el único orden
     que no sirve para trabajar. */
  const ORDENES = {
    nombre:   "(c.nombre IS NULL), c.nombre",
    pronto:   "(proximo IS NULL), proximo ASC",
    reciente: "(ultimo IS NULL), ultimo DESC"
  };
  const pedidoOrden = url.searchParams.get("orden");
  const orden = Object.prototype.hasOwnProperty.call(ORDENES, pedidoOrden) ? pedidoOrden : "nombre";

  const cond = [];
  const val = [];
  if (busca) {
    cond.push("(c.nombre LIKE ? OR c.telefono LIKE ? OR c.cedula LIKE ?)");
    val.push("%" + busca + "%", "%" + busca + "%", "%" + busca + "%");
  }
  if (provincia) { cond.push("c.provincia = ?"); val.push(provincia); }
  if (servicio) {
    cond.push("EXISTS (SELECT 1 FROM servicios sx WHERE sx.cliente_id = c.id AND sx.servicio = ?)");
    val.push(servicio);
  }
  const donde = cond.length ? "WHERE " + cond.join(" AND ") : "";

  try {
    const total = await env.DB.prepare(`SELECT COUNT(*) AS n FROM clientes c ${donde}`)
      .bind(...val).first();

    /* `proximo` sale del ÚLTIMO trabajo, esté vencido o no. Antes sólo
       tomaba fechas futuras, así que a quien ya se le pasó le quedaba en
       blanco: justo el que hay que ver de primero desaparecía de la
       lista de avisos. Es la misma regla que usa la Agenda. */
    const { results } = await env.DB.prepare(
      `SELECT c.id, c.nombre, c.telefono, c.correo, c.provincia, c.canton, c.distrito,
              c.recordatorio, c.canal, c.meses,
              COUNT(s.id) AS trabajos,
              MAX(s.fecha) AS ultimo,
              (SELECT MIN(m.fecha) FROM mantenimientos m WHERE m.cliente_id = c.id
                AND m.estado = 'programado' AND m.papelera IS NULL) AS proximo,
              (SELECT s3.servicio FROM servicios s3 WHERE s3.cliente_id = c.id
                AND s3.estado = 'completado' AND s3.papelera IS NULL
                ORDER BY s3.fecha DESC, s3.id DESC LIMIT 1) AS servicio
       FROM clientes c LEFT JOIN servicios s
            ON s.cliente_id = c.id AND s.estado = 'completado' AND s.papelera IS NULL
       ${donde}
       GROUP BY c.id
       ORDER BY ${ORDENES[orden]}
       LIMIT ? OFFSET ?`
    ).bind(...val, POR_PAGINA, (pagina - 1) * POR_PAGINA).all();

    /* Las listas de los filtros salen de lo que hay, no de un catálogo:
       ofrecer "Limón" cuando no hay un solo cliente en Limón es ofrecer
       una lista vacía. */
    const provincias = ((await env.DB.prepare(
      `SELECT provincia AS k, COUNT(*) AS n FROM clientes
        WHERE provincia IS NOT NULL AND provincia <> ''
        GROUP BY k ORDER BY k`
    ).all()).results) || [];

    const servicios = ((await env.DB.prepare(
      `SELECT servicio AS k, COUNT(*) AS n FROM servicios
        WHERE servicio IS NOT NULL AND servicio <> '' AND estado = 'completado' AND papelera IS NULL
        GROUP BY k ORDER BY n DESC`
    ).all()).results) || [];

    /* El contador de la otra pestaña, para el segmento, sin otra llamada. */
    const otros = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM (
         SELECT c.telefono FROM cotizaciones c
          WHERE c.telefono IS NOT NULL AND c.telefono <> ''
            AND c.telefono NOT IN (SELECT cl.telefono FROM clientes cl JOIN servicios s ON s.cliente_id = cl.id)
          GROUP BY c.telefono)`
    ).first().catch(() => ({ n: 0 }));

    return json({
      ok: true,
      clientes: results.map((c) => Object.assign({}, c, {
        servicioNombre: c.servicio ? etiqueta(c.servicio, null, "servicio") : null,
        wa: waDe(c.telefono, "Buenas" + (c.nombre ? " " + primerNombre(c.nombre) : "") +
                             ", le escribo de Sanitarios Ticos.")
      })),
      total: total ? total.n : 0,
      otros: (otros && otros.n) || 0,
      pagina, porPagina: POR_PAGINA,
      paginas: Math.max(1, Math.ceil((total ? total.n : 0) / POR_PAGINA)),
      orden,
      filtros: {
        provincias: provincias.map((f) => ({ id: f.k, etiqueta: f.k, n: f.n })),
        servicios: servicios.map((f) => ({
          id: f.k, etiqueta: etiqueta(f.k, null, "servicio"), n: f.n
        }))
      },
      canales: CANALES,
      periodos: PERIODOS
    });
  } catch (e) {
    console.error("Error al listar clientes:", e);
    return json({ ok: false, error: "No se pudo consultar" }, 500);
  }
}

/* -------------------------------------------------------------
   Posibles clientes: cotizados que todavía no son clientes

   Salen de las cotizaciones, una por teléfono (la más reciente), y se
   quitan los que ya tienen un servicio hecho —esos ya son clientes—.
   Así la lista de Cotizaciones no se vuelve una lista larga donde de
   cien sólo diez terminan en trabajo: los cien viven acá como posibles,
   y los que se concretan pasan a Clientes.
   ------------------------------------------------------------- */
async function listaPosibles(request, env) {
  const url = new URL(request.url);
  const busca = texto(url.searchParams.get("q"), 60);
  const provincia = texto(url.searchParams.get("provincia"), 40);
  const servicio = texto(url.searchParams.get("servicio"), 40);
  const pedida = parseInt(url.searchParams.get("pagina"), 10);
  const pagina = Number.isFinite(pedida) && pedida > 0 ? pedida : 1;

  const ORDENES = {
    reciente: "ultima DESC",
    nombre:   "(nombre IS NULL), nombre"
  };
  const pedidoOrden = url.searchParams.get("orden");
  const orden = Object.prototype.hasOwnProperty.call(ORDENES, pedidoOrden) ? pedidoOrden : "reciente";

  /* Sólo teléfonos que NO tienen ningún servicio hecho. `telefono` va
     normalizado igual en las dos tablas, así que la comparación directa
     alcanza. */
  const noEsCliente =
    "c.telefono NOT IN (SELECT cl.telefono FROM clientes cl " +
    "JOIN servicios s ON s.cliente_id = cl.id)";

  const cond = [noEsCliente, "c.telefono IS NOT NULL", "c.telefono <> ''"];
  const val = [];
  if (busca) {
    cond.push("(c.nombre LIKE ? OR c.telefono LIKE ? OR c.cedula LIKE ?)");
    val.push("%" + busca + "%", "%" + busca + "%", "%" + busca + "%");
  }
  if (provincia) { cond.push("c.provincia = ?"); val.push(provincia); }
  if (servicio) { cond.push("c.servicio = ?"); val.push(servicio); }
  const donde = "WHERE " + cond.join(" AND ");

  try {
    /* Una fila por teléfono: la cotización más reciente de cada persona.
       El GROUP BY colapsa las repetidas; MAX(creado) escoge la última y
       las demás columnas se toman de esa misma fila vía subconsulta de
       orden. Para no complicar, se agrupa y se toma el mayor id. */
    const base = `FROM cotizaciones c ${donde} GROUP BY c.telefono`;

    const total = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM (SELECT 1 ${base})`
    ).bind(...val).first();

    const { results } = await env.DB.prepare(
      `SELECT c.telefono, MAX(c.nombre) AS nombre, MAX(c.cedula) AS cedula,
              MAX(c.provincia) AS provincia, MAX(c.canton) AS canton,
              COUNT(*) AS cotizaciones,
              MAX(date(c.creado, '-6 hours')) AS ultima,
              (SELECT c2.servicio FROM cotizaciones c2 WHERE c2.telefono = c.telefono
                ORDER BY c2.creado DESC, c2.id DESC LIMIT 1) AS servicio,
              (SELECT c3.servicio_libre FROM cotizaciones c3 WHERE c3.telefono = c.telefono
                ORDER BY c3.creado DESC, c3.id DESC LIMIT 1) AS servicio_libre,
              (SELECT c4.numero FROM cotizaciones c4 WHERE c4.telefono = c.telefono
                ORDER BY c4.creado DESC, c4.id DESC LIMIT 1) AS numero
       ${base}
       ORDER BY ${ORDENES[orden]}
       LIMIT ? OFFSET ?`
    ).bind(...val, POR_PAGINA, (pagina - 1) * POR_PAGINA).all();

    const provincias = ((await env.DB.prepare(
      `SELECT provincia AS k, COUNT(DISTINCT telefono) AS n FROM cotizaciones c
        WHERE ${noEsCliente} AND provincia IS NOT NULL AND provincia <> ''
        GROUP BY k ORDER BY k`
    ).all()).results) || [];
    const servicios = ((await env.DB.prepare(
      `SELECT servicio AS k, COUNT(DISTINCT telefono) AS n FROM cotizaciones c
        WHERE ${noEsCliente} AND servicio IS NOT NULL AND servicio <> ''
        GROUP BY k ORDER BY n DESC`
    ).all()).results) || [];

    const otros = await env.DB.prepare(
      `SELECT COUNT(DISTINCT cl.id) AS n FROM clientes cl JOIN servicios s ON s.cliente_id = cl.id`
    ).first().catch(() => ({ n: 0 }));

    return json({
      ok: true,
      posibles: results.map((c) => ({
        telefono: c.telefono, nombre: c.nombre, cedula: c.cedula,
        provincia: c.provincia, canton: c.canton,
        cotizaciones: c.cotizaciones, ultima: c.ultima, numero: c.numero,
        servicioNombre: c.servicio_libre || (c.servicio ? etiqueta(c.servicio, null, "servicio") : null),
        wa: waDe(c.telefono, "Buenas" + (c.nombre ? " " + primerNombre(c.nombre) : "") +
                             ", le escribo de Sanitarios Ticos por su cotización" +
                             (c.numero ? " " + c.numero : "") + ".")
      })),
      total: total ? total.n : 0,
      otros: (otros && otros.n) || 0,
      pagina, porPagina: POR_PAGINA,
      paginas: Math.max(1, Math.ceil((total ? total.n : 0) / POR_PAGINA)),
      orden,
      filtros: {
        provincias: provincias.map((f) => ({ id: f.k, etiqueta: f.k, n: f.n })),
        servicios: servicios.map((f) => ({ id: f.k, etiqueta: etiqueta(f.k, null, "servicio"), n: f.n }))
      }
    });
  } catch (e) {
    console.error("Error al listar posibles:", e);
    return json({ ok: false, error: "No se pudo consultar" }, 500);
  }
}

/* -------------------------------------------------------------
   Un cliente con su historial
   ------------------------------------------------------------- */
async function verCliente(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);

  const id = parseInt(new URL(request.url).searchParams.get("id"), 10);
  if (!Number.isFinite(id)) return json({ ok: false, error: "Cliente inválido" }, 400);

  try {
    const c = await env.DB.prepare(`SELECT * FROM clientes WHERE id = ?`).bind(id).first();
    if (!c) return json({ ok: false, error: "No existe ese cliente" }, 404);

    const { results } = await env.DB.prepare(
      `SELECT id, fecha, hora, servicio, detalle, monto, cotizacion, cotizacion_id,
              (SELECT m.fecha FROM mantenimientos m WHERE m.servicio_id = servicios.id
                 AND m.estado = 'programado' AND m.papelera IS NULL LIMIT 1) AS proximo, nota, estado
              ${(await hayColumna(env, "servicios", "fe")) ? ", fe" : ", 0 AS fe"}
              ${(await hayColumna(env, "servicios", "volumen")) ? ", volumen" : ", NULL AS volumen"}
              ${(await hayColumna(env, "servicios", "placa")) ? ", placa" : ", NULL AS placa"}
              , ${await columnaDocumentos(env, "servicios")}
       FROM servicios WHERE cliente_id = ? AND papelera IS NULL ORDER BY fecha DESC, id DESC`
    ).bind(id).all();

    // Pagos del cliente (F3), agrupados por servicio para calcular saldo.
    const pagos = ((await env.DB.prepare(
      `SELECT id, servicio_id, monto, metodo, fecha FROM pagos
        WHERE cliente_id = ? AND papelera IS NULL ORDER BY fecha, id`
    ).bind(id).all()).results) || [];
    const porServicio = {};
    pagos.forEach((p) => { (porServicio[p.servicio_id] = porServicio[p.servicio_id] || []).push(p); });

    // Expediente 360° (§21): las cotizaciones, solicitudes y
    // mantenimientos del cliente, para poder navegar desde su ficha.
    // Las solicitudes se cruzan por cliente_id O por teléfono, porque el
    // formulario público entra sin cliente_id.
    const cotiz = ((await env.DB.prepare(
      `SELECT id, numero, servicio, estado, monto_min, monto_max,
              datetime(creado,'-6 hours') AS creado
         FROM cotizaciones WHERE cliente_id = ? AND papelera IS NULL
         ORDER BY creado DESC LIMIT 40`
    ).bind(id).all()).results) || [];
    const solic = ((await env.DB.prepare(
      `SELECT id, servicio, estado, datetime(creado,'-6 hours') AS creado
         FROM solicitudes WHERE (cliente_id = ?1 OR telefono = ?2) AND papelera IS NULL
         ORDER BY creado DESC LIMIT 40`
    ).bind(id, c.telefono || "").all()).results) || [];
    const mant = ((await env.DB.prepare(
      `SELECT id, tipo, fecha, estado, meses FROM mantenimientos
        WHERE cliente_id = ? AND papelera IS NULL
        ORDER BY (estado = 'programado') DESC, fecha DESC LIMIT 40`
    ).bind(id).all()).results) || [];

    let cobrado = 0, saldoPendiente = 0;
    const servicios = results.map((s) => {
      const lista = porServicio[s.id] || [];
      const pagado = lista.reduce((a, p) => a + (p.monto || 0), 0);
      const monto = s.monto || 0;
      cobrado += pagado;
      // El saldo solo cuenta en trabajos completados (un programado aún no cobra).
      const saldo = s.estado === "completado" ? Math.max(0, monto - pagado) : 0;
      saldoPendiente += saldo;
      return Object.assign({}, s, {
        servicioNombre: etiqueta(s.servicio, null, "servicio"),
        fe: +s.fe === 1,
        // Lo mismo que en la lista de Servicios: qué papeles ya existen
        // y qué le falta a este cliente para poder certificarlo.
        documentos: documentosDeFila(s.docs),
        faltaCertificado: faltaParaCertificar(c),
        pagado, saldo, estadoPago: estadoPago(monto, pagado), pagos: lista
      });
    });

    return json({
      ok: true,
      cliente: Object.assign({}, c, {
        wa: waDe(c.telefono, "Buenas" + (c.nombre ? " " + primerNombre(c.nombre) : "") +
                             ", le escribo de Sanitarios Ticos."),
        cobrado, saldoPendiente
      }),
      servicios,
      cotizaciones: cotiz.map((x) => ({
        id: x.id, numero: x.numero || ("Cotización " + x.id),
        servicio: etiqueta(x.servicio, null, "servicio"),
        estado: x.estado, estadoTxt: nombreEstado(x.estado),
        monto: montoTexto(x.monto_min, x.monto_max), fecha: x.creado
      })),
      solicitudes: solic.map((x) => ({
        id: x.id, servicio: x.servicio || "—",
        estado: x.estado, estadoTxt: nombreEstado(x.estado), fecha: x.creado
      })),
      mantenimientos: mant.map((x) => ({
        id: x.id, servicio: etiqueta(x.tipo, null, "servicio"), tipo: x.tipo, meses: x.meses || null,
        fecha: x.fecha, estado: x.estado
      })),
      metodos: METODOS_PAGO.filter((m) => m !== "no-registrado"),
      canales: CANALES,
      periodos: PERIODOS
    });
  } catch (e) {
    console.error("Error al ver el cliente:", e);
    return json({ ok: false, error: "No se pudo consultar" }, 500);
  }
}

/* Guardar los datos de un cliente desde el panel: nombre, cédula, correo,
   teléfono y dirección. El "cada cuánto" (mantenimiento) ya NO se
   configura acá: se decide en cada servicio al completarlo. Se conserva
   el valor viejo del cliente como default para el próximo trabajo, pero
   la fuente de verdad del recordatorio es la tabla `mantenimientos`. */
async function editarCliente(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);

  let b;
  try { b = await request.json(); }
  catch { return json({ ok: false, error: "Petición mal formada" }, 400); }

  const id = parseInt(b.id, 10);
  if (!Number.isFinite(id)) return json({ ok: false, error: "Cliente inválido" }, 400);

  // Teléfono: solo se acepta si viene bien; si no lo mandan, se deja el que ya está.
  let telUp = null;
  if (b.telefono != null && String(b.telefono).trim() !== "") {
    const t = normalizarTelefono(b.telefono);
    if (!t.ok) return json({ ok: false, error: "Teléfono inválido" }, 400);
    telUp = t.valor;
  }

  try {
    // COALESCE mantiene lo viejo si no llega un campo nuevo (útil para
    // ir editando de a poco sin borrar datos por accidente).
    await env.DB.prepare(
      `UPDATE clientes SET nombre = ?1, cedula = ?2, correo = ?3,
                           provincia = COALESCE(?4, provincia),
                           canton    = COALESCE(?5, canton),
                           distrito  = COALESCE(?6, distrito),
                           senas = ?7, nota = ?8,
                           telefono = COALESCE(?9, telefono),
                           actualizado = datetime('now')
       WHERE id = ?10`
    ).bind(
      texto(b.nombre, 120) || "Sin nombre",
      texto(b.cedula, 20) || null,
      texto(b.correo, 120) || null,
      texto(b.provincia, 40),
      texto(b.canton, 60),
      texto(b.distrito, 80),
      texto(b.senas, 200) || null,
      texto(b.nota, 400) || null,
      telUp, id
    ).run();

    return json({ ok: true });
  } catch (e) {
    // El teléfono es UNIQUE: si chocó con otro cliente, avisarlo con
    // texto útil en vez del error crudo de SQLite.
    if (String((e && e.message) || "").indexOf("UNIQUE") !== -1) {
      return json({ ok: false, error: "Ese teléfono ya está registrado en otro cliente." }, 409);
    }
    console.error("Error al guardar el cliente:", e);
    return json({ ok: false, error: "No se pudo guardar" }, 500);
  }
}

/* Crear un cliente desde el panel (formulario "Agregar cliente"). Usa
   `guardarCliente`, que hace el ON CONFLICT por teléfono — si ya existe
   uno con ese número, se enlaza a ESE en vez de fallar (y se completan
   los datos que faltaban). */
async function crearCliente(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);

  let b;
  try { b = await request.json(); }
  catch { return json({ ok: false, error: "Petición mal formada" }, 400); }

  const persona = limpiarDatosPersona(b, ["nombre", "telefono"]);
  if (persona.error) return json({ ok: false, error: persona.error }, 400);

  const provincia = texto(b.provincia, 40);
  const canton = texto(b.canton, 60);
  const distrito = texto(b.distrito, 80);
  if (provincia && !direccionValida(provincia, canton, distrito)) {
    return json({ ok: false, error: "Esa dirección no existe en la lista de Costa Rica" }, 400);
  }

  try {
    const cl = await guardarCliente(env, Object.assign({}, persona.datos, {
      provincia, canton, distrito, senas: texto(b.senas, 200)
    }));
    if (!cl) return json({ ok: false, error: "No se pudo guardar" }, 500);
    return json({ ok: true, id: cl.id });
  } catch (e) {
    console.error("Error al crear el cliente:", e);
    return json({ ok: false, error: "No se pudo guardar" }, 500);
  }
}

/* -------------------------------------------------------------
   La agenda: a quién le toca y cuándo

   Sólo cuenta el ÚLTIMO servicio de cada cliente. Si a alguien se le
   hizo el tanque en 2024 y otra vez en 2026, la fecha del 2024 ya no
   dice nada: el reloj arranca de nuevo con el trabajo más reciente.
   ------------------------------------------------------------- */
async function agendaPanel(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);

  try {
    // Recordatorios: salen de la tabla `mantenimientos` (F2), que es la
    // única fuente de "a quién le toca y cuándo". Cada mantenimiento
    // 'programado' es una fila; el servicio que lo originó da la fecha de
    // "la última vez" y el detalle.
    const { results } = await env.DB.prepare(
      `SELECT m.id, so.fecha AS fecha, m.tipo AS servicio, so.detalle AS detalle,
              so.monto AS monto, m.fecha AS proximo,
              c.id AS cliente_id, c.nombre, c.telefono, c.correo,
              c.provincia, c.canton, c.distrito, c.recordatorio, c.canal, c.meses,
              CAST(julianday(m.fecha) - julianday(date('now','-6 hours')) AS INTEGER) AS dias
       FROM mantenimientos m
       JOIN clientes c ON c.id = m.cliente_id
       LEFT JOIN servicios so ON so.id = m.servicio_id
       WHERE m.estado = 'programado' AND m.papelera IS NULL AND c.papelera IS NULL
       ORDER BY m.fecha`
    ).all();

    const items = results.map((f) => ({
      id: f.id, clienteId: f.cliente_id, nombre: f.nombre, telefono: f.telefono,
      correo: f.correo || null,
      servicio: etiqueta(f.servicio, null, "servicio"),
      servicioKey: f.servicio,             // la clave cruda: el panel le pone ícono y color
      detalle: f.detalle || null,
      lugar: [f.canton, f.provincia].filter(Boolean).join(", ") || null,
      fecha: f.fecha, proximo: f.proximo, dias: f.dias,
      meses: f.meses, canal: f.canal, recordatorio: !!f.recordatorio,
      wa: f.recordatorio ? waDe(f.telefono, mensajeRecordatorio(f)) : null,
      correoEnlace: (f.recordatorio && f.correo)
        ? "mailto:" + encodeURIComponent(f.correo) +
          "?subject=" + encodeURIComponent("Le toca el mantenimiento, Sanitarios Ticos") +
          "&body=" + encodeURIComponent(mensajeRecordatorio(f))
        : null
    }));

    const activos = items.filter((i) => i.recordatorio);

    /* Los trabajos PROGRAMADOS (lo que el calendario llama "citas"): salen
       de la misma tabla `servicios`, filtrando por estado. La ubicación se
       toma del cliente, que es la fuente de verdad. */
    let citas = [];
    try {
      const cr = await env.DB.prepare(
        `SELECT s.id, s.cliente_id, s.servicio, s.detalle, s.fecha, s.hora, s.nota,
                c.nombre, c.telefono, c.provincia, c.canton, c.distrito, c.senas,
                CAST(julianday(s.fecha) - julianday(date('now','-6 hours')) AS INTEGER) AS dias
         FROM servicios s
         JOIN clientes c ON c.id = s.cliente_id
         WHERE s.estado = 'programado' AND s.papelera IS NULL AND c.papelera IS NULL
         ORDER BY s.fecha, s.hora, s.id`
      ).all();
      citas = (cr.results || []).map((c) => ({
        id: c.id, clienteId: c.cliente_id, nombre: c.nombre, telefono: c.telefono || null,
        servicio: etiqueta(c.servicio, null, "servicio"),
        servicioKey: c.servicio,             // la clave cruda, para reabrir el formulario
        detalle: c.detalle || null,
        provincia: c.provincia || null, canton: c.canton || null,
        distrito: c.distrito || null, senas: c.senas || null,
        lugar: [c.canton, c.provincia].filter(Boolean).join(", ") || null,
        fecha: c.fecha, hora: c.hora || null, nota: c.nota || null, dias: c.dias,
        wa: waDe(c.telefono, "Buenas" + (c.nombre ? " " + primerNombre(c.nombre) : "") +
                 ", le confirmo de Sanitarios Ticos la visita para " + fechaTexto(c.fecha) +
                 (c.hora ? " a las " + c.hora : "") + ".")
      }));
    } catch (e) {
      console.error("No se pudieron leer los trabajos programados:", e);
    }

    /* Los trabajos YA HECHOS (estado='completado'): salen en el
       calendario con otro color, para poder mirar hacia atrás qué se
       hizo y cuándo. Solo se traen los últimos 6 meses para no cargar
       de más el JSON en agendas con años de historial. */
    let completados = [];
    try {
      const cr = await env.DB.prepare(
        `SELECT s.id, s.cliente_id, s.servicio, s.detalle, s.fecha, s.hora, s.monto,
                ${await columnaDocumentos(env, "s")},
                c.nombre, c.telefono, c.cedula, c.provincia, c.canton, c.distrito
         FROM servicios s
         JOIN clientes c ON c.id = s.cliente_id
         WHERE s.estado = 'completado' AND s.papelera IS NULL AND c.papelera IS NULL
           AND s.fecha >= date('now','-6 hours','-6 months')
         ORDER BY s.fecha DESC, s.id DESC`
      ).all();
      completados = (cr.results || []).map((c) => ({
        id: c.id, clienteId: c.cliente_id, nombre: c.nombre, telefono: c.telefono || null,
        servicio: etiqueta(c.servicio, null, "servicio"), servicioKey: c.servicio,
        detalle: c.detalle || null, monto: c.monto || 0,
        lugar: [c.canton, c.provincia].filter(Boolean).join(", ") || null,
        fecha: c.fecha, hora: c.hora || null, estado: "completado",
        /* Para poder sacar el certificado o el tiquete desde la misma
           Agenda. Un trabajo de hace tres días se busca acá, no dando
           vueltas por Clientes. */
        documentos: documentosDeFila(c.docs),
        faltaCertificado: faltaParaCertificar(c),
        wa: waDe(c.telefono, "Buenas" + (c.nombre ? " " + primerNombre(c.nombre) : "") +
                 ", le escribo de Sanitarios Ticos.")
      }));
    } catch (e) {
      console.error("No se pudieron leer los trabajos completados:", e);
    }

    return json({
      ok: true,
      items,
      citas,
      completados,
      resumen: {
        vencidos: activos.filter((i) => i.dias < 0).length,
        mes:      activos.filter((i) => i.dias >= 0 && i.dias <= 30).length,
        trimestre:activos.filter((i) => i.dias >= 0 && i.dias <= 90).length,
        apagados: items.length - activos.length,
        citas:    citas.length
      }
    });
  } catch (e) {
    console.error("Error al armar la agenda:", e);
    return json({ ok: false, error: "No se pudo consultar" }, 500);
  }
}

/* -------------------------------------------------------------
   Agendar un trabajo (crear o mover una cita)

   Sin `id` crea; con `id` mueve/edita la que ya existe. La cita SIEMPRE
   queda enlazada a un cliente: el teléfono lo crea o lo reconoce, igual
   que "anotar un trabajo". Lo que cambia es que acá no nace ningún
   servicio ni se toca lo cobrado — es un plan, no un hecho.
   ------------------------------------------------------------- */
async function guardarCita(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);

  let cuerpo;
  try { cuerpo = await request.json(); }
  catch { return json({ ok: false, error: "Formato inválido" }, 400); }

  const persona = limpiarDatosPersona(cuerpo, ["nombre", "telefono"]);
  if (persona.error) return json({ ok: false, error: persona.error }, 400);

  const fecha = soloFecha(cuerpo.fecha);
  if (!fecha) return json({ ok: false, error: "Falta la fecha del trabajo" }, 400);

  /* Una visita puede traer VARIOS trabajos: dos tanques, el tanque y la
     trampa. Cada uno es su propia fila en `servicios` —se completa y se
     cobra por separado— pero comparten cliente, día y hora, que es lo
     que los hace una sola salida del camión.

     El cuerpo viejo, con el servicio suelto en la raíz, se sigue
     aceptando como una línea única. */
  /* La cotización de la que salió este trabajo, cuando se agenda desde
     Pendientes. Enlazarlos es lo que la saca de la lista de seguimiento
     —ya se sabe en qué quedó— y lo que deja la conversión bien contada. */
  const cotizacionId = parseInt(cuerpo.cotizacionId, 10);
  const deCotizacion = Number.isFinite(cotizacionId) && cotizacionId > 0 ? cotizacionId : null;

  const trabajos = ((Array.isArray(cuerpo.servicios) && cuerpo.servicios.length
      ? cuerpo.servicios
      : [{ servicio: cuerpo.servicio, detalle: cuerpo.detalle }])
    .slice(0, MAX_TRABAJOS_POR_VISITA)
    .map((t) => ({ servicio: texto(t.servicio, 40), detalle: texto(t.detalle, 200) }))
    .filter((t) => t.servicio));

  if (!trabajos.length) return json({ ok: false, error: "Falta decir qué trabajo es" }, 400);

  const provincia = texto(cuerpo.provincia, 40);
  const canton = texto(cuerpo.canton, 60);
  if (provincia && !direccionValida(provincia, canton, null)) {
    return json({ ok: false, error: "Esa dirección no existe en la lista de Costa Rica" }, 400);
  }

  // La hora es opcional; si viene, se guarda como HH:MM y nada más.
  const hm = String(cuerpo.hora || "").match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  const hora = hm ? (hm[1].padStart(2, "0") + ":" + hm[2]) : null;

  try {
    // El cliente es la fuente de verdad de la ubicación: se guarda ahí, no
    // en cada trabajo. Agendar crea o reconoce al cliente por teléfono.
    const cliente = await guardarCliente(env, Object.assign({}, persona.datos, {
      provincia, canton, distrito: texto(cuerpo.distrito, 80), senas: texto(cuerpo.senas, 200)
    }));
    if (!cliente) return json({ ok: false, error: "No se pudo enlazar el cliente" }, 500);

    const id = parseInt(cuerpo.id, 10);
    if (Number.isFinite(id)) {
      /* Reagendar: solo mueve trabajos que aún no se completaron. Edita
         UNO, siempre: corregir un trabajo no puede crear otros, y por eso
         el panel esconde el "+ Agregar servicio" cuando se está editando. */
      await env.DB.prepare(
        `UPDATE servicios SET cliente_id=?1, servicio=?2, detalle=?3, fecha=?4, hora=?5,
                              nota=?6, actualizado=datetime('now')
         WHERE id=?7 AND estado IN ('programado','en_proceso') AND papelera IS NULL`
      ).bind(
        cliente.id, trabajos[0].servicio, trabajos[0].detalle || null,
        fecha, hora, texto(cuerpo.nota, 300) || null, id
      ).run();
      return json({ ok: true, id, movida: true });
    }

    // Nuevos trabajos programados: nacen en `servicios` con estado
    // 'programado', uno por servicio, todos en la misma visita.
    const ids = [];
    for (const t of trabajos) {
      ids.push(await guardarServicio(env, cliente.id, {
        estado: "programado", fecha, hora,
        servicio: t.servicio,
        detalle: t.detalle,
        nota: texto(cuerpo.nota, 300),
        // Sólo el primero se enlaza: la cotización dio origen a la
        // visita, no a cada uno de los trabajos que se le agreguen acá.
        cotizacionId: ids.length === 0 ? deCotizacion : null
      }, cliente.meses));
    }

    /* Y la cotización queda dicha: "agendada". Con eso sale de
       Pendientes aunque alguien borre después el trabajo, y la lista de
       Cotizaciones muestra en qué quedó sin tener que abrirla. */
    if (deCotizacion) {
      await env.DB.prepare(
        `UPDATE cotizaciones SET estado = 'agendada', actualizado = datetime('now')
          WHERE id = ? AND papelera IS NULL`
      ).bind(deCotizacion).run().catch((e) => console.error("No se marcó la cotización:", e));
      await env.DB.prepare(
        `UPDATE cotizaciones SET cliente_id = COALESCE(cliente_id, ?1) WHERE id = ?2`
      ).bind(cliente.id, deCotizacion).run().catch(() => {});
    }

    return json({ ok: true, id: ids[0], ids, cuantos: ids.length, clienteId: cliente.id });
  } catch (e) {
    console.error("No se pudo guardar la cita:", e);
    return json({ ok: false, error: "No se pudo agendar" }, 500);
  }
}

/* Cerrar una cita: 'hecho' (ya se hizo — el servicio se anota aparte) o
   'cancelado'. No borra la fila: queda como historia de la agenda. */
async function estadoCita(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);

  let cuerpo;
  try { cuerpo = await request.json(); }
  catch { return json({ ok: false, error: "Formato inválido" }, 400); }

  const id = parseInt(cuerpo.id, 10);
  if (!Number.isFinite(id)) return json({ ok: false, error: "Trabajo inválido" }, 400);
  // 'hecho' → completado; 'cancelado'; 'pendiente' → vuelve a programado.
  if (["hecho", "cancelado", "pendiente"].indexOf(cuerpo.estado) === -1) {
    return json({ ok: false, error: "Estado inválido" }, 400);
  }

  try {
    if (cuerpo.estado === "cancelado" || cuerpo.estado === "pendiente") {
      const nuevo = cuerpo.estado === "cancelado" ? "cancelado" : "programado";
      // Al re-programar (o cancelar) el reloj del mantenimiento se apaga:
      // solo un trabajo completado lo corre.
      await env.DB.prepare(
        `UPDATE servicios SET estado=?1, proximo=NULL, actualizado=datetime('now')
         WHERE id=?2 AND papelera IS NULL`
      ).bind(nuevo, id).run();
      return json({ ok: true });
    }

    // 'hecho' = completar: nace el cobro y arranca el mantenimiento.
    const s = await env.DB.prepare(
      `SELECT s.cliente_id, s.fecha, s.servicio, c.meses FROM servicios s
       JOIN clientes c ON c.id = s.cliente_id WHERE s.id = ?`
    ).bind(id).first();
    if (!s) return json({ ok: false, error: "No existe ese trabajo" }, 404);

    // Si no se escogió periodicidad, se hereda la del mantenimiento que ya
    // tenía para este tipo de trabajo (así un "mes a mes" sigue mes a mes).
    let mesesPrev = null;
    if (PERIODOS.indexOf(+cuerpo.meses) === -1) {
      const mp = await env.DB.prepare(
        `SELECT meses FROM mantenimientos WHERE cliente_id = ?1 AND tipo = ?2
            AND estado = 'programado' AND papelera IS NULL ORDER BY fecha DESC LIMIT 1`
      ).bind(s.cliente_id, s.servicio).first();
      mesesPrev = mp && PERIODOS.indexOf(+mp.meses) !== -1 ? +mp.meses : null;
    }
    const meses = PERIODOS.indexOf(+cuerpo.meses) !== -1 ? +cuerpo.meses : (mesesPrev || s.meses || 24);
    const fecha = soloFecha(cuerpo.fecha) || s.fecha ||
                  new Date(Date.now() - 6 * 3600 * 1000).toISOString().slice(0, 10);
    const monto = Number.isFinite(+cuerpo.monto) ? Math.round(+cuerpo.monto) : null;

    // ¿Requiere mantenimiento? (§ mantenimiento del servicio)
    //   sinMantenimiento = no se le programa próximo (proximo = NULL).
    //   proximoManual    = una fecha exacta escrita a mano.
    //   por defecto      = fecha del trabajo + la periodicidad (meses).
    const sinMant = cuerpo.sinMantenimiento === true;
    const proxManual = sinMant ? null : soloFecha(cuerpo.proximoManual);
    const proxExpr = sinMant ? "NULL"
      : (proxManual ? "date(?3)" : "date(?1, '+' || ?3 || ' months')");
    const proxBind = sinMant ? meses : (proxManual || meses);

    /* El apunte del trabajo: lo que sólo se sabe estando ahí —el tanque
       era de 1000 litros, la tapa de atrás no abre, la trampa está bajo
       la cocina—. Vive en el servicio y no en el cliente porque un
       cliente puede tener dos casas con dos tanques distintos, y una
       nota pegada al cliente mezclaría las dos.

       Se escribe acá, al cerrar el trabajo, que es el único momento en
       que la información existe. COALESCE: dejarlo en blanco no borra lo
       que ya se hubiera escrito al agendar. */
    const apunte = texto(cuerpo.nota, 600);

    /* Si el cliente pidió factura electrónica. Se anota acá, al cerrar
       el trabajo, porque es cuando se sabe: en la cotización era una
       intención y al facturar puede haber cambiado. De esto sale el IVA
       que hay que enterar. */
    const conFE = await hayColumna(env, "servicios", "fe");
    const fe = cuerpo.fe === true || cuerpo.fe === 1 || cuerpo.fe === "1" ? 1 : 0;

    await env.DB.prepare(
      `UPDATE servicios
          SET estado='completado', fecha=?1, monto=COALESCE(?2, monto),
              nota=COALESCE(?5, nota)${conFE ? ", fe=?6" : ""},
              proximo=${proxExpr}, actualizado=datetime('now')
        WHERE id=?4 AND papelera IS NULL`
    ).bind(fecha, monto, proxBind, id, apunte || null, ...(conFE ? [fe] : [])).run();

    /* Los m³ sacados y el camión, si se anotaron al cerrar el trabajo.
       Sirven para el certificado, que se pide después y a veces meses
       después: acordarse entonces de cuántos metros cúbicos fueron es
       mucho pedir. */
    await guardarMedidaDelTrabajo(env, id, cuerpo.volumen, cuerpo.placa);

    // El cliente se queda con la periodicidad usada, para el próximo.
    if (!sinMant && !proxManual && meses !== s.meses) {
      await env.DB.prepare(`UPDATE clientes SET meses=?1, actualizado=datetime('now') WHERE id=?2`)
        .bind(meses, s.cliente_id).run();
    }

    // Arma/reemplaza el mantenimiento (§14). Si se dijo que NO requiere,
    // no se crea ninguno. La decisión ('mantener' vs reemplazar) viene del
    // panel cuando había uno a futuro.
    const mant = sinMant ? null : await gestionarMantenimiento(env, {
      id, clienteId: s.cliente_id, tipo: s.servicio, fecha, meses, fechaManual: proxManual
    }, cuerpo.mantenimiento);

    // Si se dijo cómo pagó, queda el pago registrado (F3).
    if (cuerpo.metodo && cuerpo.metodo !== "pendiente" && Number.isFinite(monto) && monto > 0) {
      await registrarPago(env, { servicioId: id, clienteId: s.cliente_id, monto, metodo: cuerpo.metodo, fecha });
    }
    return json({ ok: true, mant: mant });
  } catch (e) {
    console.error("No se pudo cambiar el trabajo:", e);
    return json({ ok: false, error: "No se pudo actualizar" }, 500);
  }
}

/* =============================================================
   3. Motor de cotizaciones
   =============================================================

   POR QUÉ ESTO NO LO CALCULA BETO
   --------------------------------
   Víctor conversa y recoge los datos; el precio lo saca este código.
   Un modelo de lenguaje haciendo cuentas se equivoca tarde o temprano,
   y una cotización equivocada la paga la empresa: o come la diferencia
   o queda como que hizo carnada. Acá la aritmética siempre da igual, y
   cambiar un precio es editar la tabla de abajo, no reescribir a Víctor.

   CÓMO SE LE DA LA VUELTA AL TAMAÑO DEL TANQUE
   ---------------------------------------------
   Casi nadie sabe cuántos litros tiene su tanque. Pero todo el mundo
   sabe cuánta gente vive en la casa y hace cuánto lo limpiaron, y eso
   predice el volumen igual de bien. Por eso no se pregunta el tamaño:
   se pregunta lo que la persona sí puede contestar.
   ============================================================= */

// ⚠️⚠️  PRECIOS PROVISIONALES — NO SON LOS DE LA EMPRESA  ⚠️⚠️
//
// Están puestos para poder construir y probar el sistema completo. Son
// cifras verosímiles para Costa Rica, pero INVENTADAS.
//
// Cuando el propietario entregue los precios reales:
//   1. Cambie los números de TARIFAS.
//   2. Ponga `provisional: false`.
//   3. Confirme si los montos llevan IVA incluido y ajuste `iva`.
//      (Confirmado el 2026-09-10: NO lo llevan, se suma aparte.)
//
// Mientras `provisional` sea true, cada cotización sale marcada como
// estimación y `tools/modo-publicacion.py` se niega a pasar el sitio a
// producción. Es a propósito: cotizar de verdad con precios inventados
// es peor que no cotizar.
/* Precios reales, entregados por el propietario el 8 de setiembre de 2026.
   Ya no son provisionales: cada monto de acá salió de él, y donde no hay
   número no se inventa uno — se dice "desde". */
/* Qué incluye cada servicio, para el documento. Sólo los de extracción
   dicen "succión, transporte y disposición"; el resto no lleva esa línea
   —y un servicio escrito a mano nunca la lleva—. */
/* Qué dice el certificado según lo que se hizo.

   El que se emitía a mano era siempre de aguas residuales, porque es lo
   que más se certifica. Pero un certificado que diga "recolección de
   aguas residuales" de un destaqueo es un papel falso, así que cada
   servicio trae su propia frase.

     que      — cómo se nombra el trabajo dentro del texto
     brindado — la línea "Servicio brindado:" de la cabecera
     saca     — si se extrae algo (entonces se dicen los m³)
     planta   — si lo extraído va a una planta de tratamiento avalada */
const CERTIFICA = {
  "tanques-septicos": {
    que: "recolección de aguas residuales", articulo: "la ",
    brindado: "Servicio de recolección de aguas residuales.",
    saca: "aguas residuales", planta: true
  },
  "trampas-grasa": {
    que: "limpieza de trampa de grasa", articulo: "la ",
    brindado: "Servicio de limpieza y recolección de trampa de grasa.",
    saca: "residuos de trampa de grasa", planta: true
  },
  "tanques-grasa": {
    que: "limpieza de tanque de grasa", articulo: "la ",
    brindado: "Servicio de limpieza y recolección de tanque de grasa.",
    saca: "residuos de grasa", planta: true
  },
  destaqueo: {
    que: "destaqueo de tuberías", articulo: "el ",
    brindado: "Servicio de destaqueo de tuberías.",
    saca: null, planta: false
  },
  "alquiler-tanques": {
    que: "alquiler de tanques", articulo: "el ",
    brindado: "Alquiler de tanques.",
    saca: null, planta: false
  }
};

/* Un servicio escrito a mano no está en la lista de arriba. Entonces el
   certificado dice lo que el encargado escribió, sin inventarle ni la
   planta de tratamiento ni los metros cúbicos. */
function certificaDe(clave, nombreLibre) {
  /* El artículo lo trae cada servicio: "la recolección" pero "el
     destaqueo". Ponerlo fijo en la plantilla daba "para la destaqueo
     de tuberías", que es justo el tipo de error que nadie revisa en un
     papel que se entrega firmado. */
  if (CERTIFICA[clave]) return CERTIFICA[clave];
  /* Un servicio escrito a mano no lleva artículo: los de la lista son
     todos femeninos ("la recolección", "la limpieza") y el artículo va
     fijo en la plantilla, pero con un texto libre salía "para la bombeo
     de pozo". Sin artículo funciona con cualquier cosa que escriban. */
  return {
    que: nombreLibre || "el servicio contratado",
    articulo: "",
    brindado: nombreLibre || "Servicio contratado.",
    saca: null, planta: false
  };
}

const INCLUYE_SERVICIO = {
  "tanques-septicos": "Incluye la succión, el transporte y la disposición final de lo extraído.",
  "trampas-grasa":    "Incluye la succión, el transporte y la disposición final de lo extraído.",
  "tanques-grasa":    "Incluye la succión, el transporte y la disposición final de lo extraído."
};

const TARIFAS = {
  provisional: false,

  /* Los montos de acá son la BASE: el IVA va aparte. Así se dice en el
     sitio y en el documento, para que quien pide factura no se lleve una
     sorpresa del 13% al final. Cómo se cobra en cada caso es cosa del
     encargado y NO se explica en la página. */
  iva: { incluido: false, tasa: 0.13 },

  vigenciaDias: 30,

  /* Cuánto sube por el tiempo sin limpiar. Más años es más lodo
     compactado, que es más trabajo. Sólo aplica al tanque séptico. */
  antiguedad: {
    "1a2":  { etiqueta: "Hace 1 o 2 años",  monto: 0 },
    "3a4":  { etiqueta: "Hace 3 o 4 años",  monto: 5000 },
    "5mas": { etiqueta: "Hace 5 años o más", monto: 10000 },
    /* No saberlo no se castiga. Antes "no sabe" iba junto con "5 años
       o más" y cobraba los 10.000: a quien compró la casa el año
       pasado se le cobraba de más por no saber algo que nadie le dijo.

       Ahora paga el precio base y el documento avisa que el monto
       final se ve en la visita, diciendo hasta cuánto puede subir.
       Decir el techo es lo que hace que el aviso sirva: "puede subir"
       a secas no deja decidir nada. */
    "nose": {
      etiqueta: "No lo sé",
      monto: 0,
      tope: 10000,
      aviso: "Al no conocer la antigüedad, el precio final se confirma en la visita. " +
             "El recargo máximo por lodo acumulado es de ₡10.000."
    }
  },

  servicios: {
    /* El precio del tanque séptico sale del TAMAÑO. Como casi nadie lo
       sabe en litros, no se pregunta el tamaño: se pregunta la FORMA, y
       de ahí la medida. La forma se ve saliendo al patio; los litros no.
       La inversión es del propietario y es mejor que la que había. */
    "tanques-septicos": {
      nombre: "Limpieza de tanque séptico",
      formas: {
        redondo: {
          etiqueta: "Redondo, de cemento o de alcantarillas",
          medidas: {
            "2x1": { etiqueta: "2 m de fondo por 1 m de diámetro", precio: 40000 }
          }
        },
        tierra: {
          etiqueta: "Hueco de tierra",
          medidas: {
            "4m": { etiqueta: "4 metros de fondo por 1 m de diámetro", precio: 60000 },
            "5m": { etiqueta: "5 metros de fondo por 1 m de diámetro", precio: 80000 },
            "6m": { etiqueta: "6 metros de fondo por 1 m de diámetro", precio: 110000 }
          }
        },
        plastico: {
          etiqueta: "Tanque plástico",
          medidas: {
            "750":  { etiqueta: "750 litros",   precio: 40000 },
            "1000": { etiqueta: "1000 litros",  precio: 60000 },
            "1500": { etiqueta: "1500 litros",  precio: 90000 },
            "2000": { etiqueta: "2000 litros",  precio: 120000 },
            "2500": { etiqueta: "2500 litros",  precio: 140000 }
          }
        },
        block: {
          etiqueta: "Cuadrado, hecho en block",
          medidas: {
            "1.5": { etiqueta: "1,5 × 1,5 × 1,5 metros", precio: 70000 },
            "2":   { etiqueta: "2 × 2 × 2 metros",       precio: 100000 }
          }
        }
      }
    },

    /* Estos tres van con precio de tabla. Donde hay rango, el rango es
       la variación del trabajo DENTRO de la misma zona — no la
       distancia. Eso lo aclaró el propietario y cambia todo: la
       distancia no entra en la cuenta automática. */
    "trampas-grasa": {
      nombre: "Limpieza de trampa de grasa",
      desde: 35000
    },
    "tanques-grasa": {
      nombre: "Limpieza de tanque de grasa",
      desde: 50000
    },
    "destaqueo": {
      nombre: "Destaqueo de tuberías",
      desde: 30000
    },

    // El alquiler se cobra por día con un piso de ocho.
    "alquiler-tanques": {
      nombre: "Alquiler de tanque plástico",
      porDia: 15000,
      diasMinimo: 8
    }
  }
};

/* EL RECARGO POR UBICACIÓN

   Antes no existía: el precio era el mismo desde Alajuela centro que
   desde Atenas, y el encargado lo ajustaba por aparte. Ahora el
   encargado llenó la tabla distrito por distrito y el recargo entra en
   la cuenta, sumado al precio base.

   El cliente NO ve el desglose del recargo: ve un precio. Lo que paga
   por llegar hasta su casa es asunto de la empresa, no una línea que
   haya que justificarle. En el panel sí se ve, porque ahí sirve.

   Y donde la tabla no llega, no se inventa: ver `coberturaDe`. */

/* ¿Se puede cotizar sola esta dirección?

   Devuelve el recargo cuando sí, y por qué no cuando no. Son dos
   motivos y los dos quieren decir "esto lo ve el encargado":

     sin-distrito — no se escogió distrito; sin él no hay precio
     fuera       — el distrito está marcado "no aplica", o la provincia
                   entera queda fuera del área (Cartago, Guanacaste,
                   Limón, Puntarenas)

   Que no se cotice sola NO quiere decir que no se haga el trabajo: la
   solicitud entra desde cualquier parte del país y el encargado pone
   el precio. Lo que no se hace es que una tabla invente un número para
   un viaje que nadie ha medido. */
function coberturaDe(provincia, canton, distrito) {
  if (!distrito) return { cubierto: false, motivo: "sin-distrito" };
  const cantones = RECARGOS[provincia];
  const distritos = cantones && cantones[canton];
  const monto = distritos && distritos[distrito];
  if (typeof monto !== "number") return { cubierto: false, motivo: "fuera" };
  return { cubierto: true, recargo: monto };
}

/* Las provincias donde la tabla sí llega. El sitio las usa para avisar
   antes de que la persona llene todo el formulario. */
function provinciasCubiertas() {
  return Object.keys(RECARGOS);
}

function colones(n) {
  return "₡" + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

const ZONAS = { valle: "Dentro del GAM y alrededores", resto: "Fuera del GAM" };

/* Una línea que describe el trabajo, para las listas y el historial del
   cliente. Cada servicio guarda cosas distintas —el tanque su forma y
   medida, el alquiler sus días— así que se arma con lo que haya. */
/* Cómo se escribe lo cotizado. Cuando el mínimo y el máximo son
   iguales no es un rango de cero de ancho: es un piso, y se dice
   "desde". Vive en un solo lugar para que el panel, el WhatsApp y el
   correo no se contradigan. */
/* El monto como se escribe en las listas. Un piso sin techo se decía
   "desde ₡65.000"; ahora se dice el número y ya. La palabra sobraba:
   quien mira una cotización ya sabe que es un estimado —lo dice el
   rótulo— y "desde" le metía al monto una duda que no tenía. */
function montoTexto(min, max) {
  return min === max ? colones(min) : colones(min) + " – " + colones(max);
}

function detalleTrabajo(f) {
  const partes = [];
  if (f.forma)  partes.push(etiqueta(f.servicio, f.forma, "forma"));
  if (f.medida) partes.push(etiqueta(f.servicio, f.medida, "medida"));
  if (f.dias)   partes.push(f.dias + " días");
  return partes.join(", ") || etiqueta(f.servicio, null, "servicio");
}

/* Traduce un código guardado a lo que se lee en pantalla. Los campos
   `perfil` y `acceso` son de la estructura vieja: no se traducen, pero
   se dejan pasar porque hay cotizaciones ya emitidas con ellos y no se
   les puede borrar el detalle. */
function etiqueta(servicio, codigo, campo) {
  if (campo === "zona") return ZONAS[codigo] || codigo || "";
  if (campo === "antiguedad" || campo === "ultimo") {
    const a = TARIFAS.antiguedad[codigo];
    return a ? a.etiqueta : (codigo || "");
  }
  const svc = TARIFAS.servicios[servicio];
  /* Si el servicio se escribió a mano no está en la tarifa. Antes salía
     en blanco; mejor devolver lo que la persona escribió. */
  if (!svc) return campo === "servicio" ? (servicio || codigo || "") : (codigo || "");
  if (campo === "servicio") return svc.nombre;

  if (campo === "forma") {
    const f = svc.formas && svc.formas[codigo];
    return f ? f.etiqueta : (codigo || "");
  }
  if (campo === "medida") {
    // Las medidas viven dentro de cada forma, pero sus códigos no se
    // repiten entre formas, así que se pueden buscar sin saber cuál era.
    for (const f of Object.values(svc.formas || {})) {
      if (f.medidas[codigo]) return f.medidas[codigo].etiqueta;
    }
    return codigo || "";
  }
  return codigo || "";
}

/* Un tope. No hay trabajo real de veinte servicios en una visita, y sin
   límite un cuerpo armado a mano puede hacer veinte cálculos y un JSON
   enorme por cada cotización. */
const MAX_LINEAS_COTIZACION = 10;

/* Un monto en colones venido del formulario. Devuelve el número, `null`
   si no se escribió nada, o `false` si lo que se escribió no es un monto
   —que no es lo mismo que no escribir— para que quien llame avise. */
function montoEnColones(v) {
  if (v == null || v === "") return null;
  const n = Math.round(Number(v));
  if (!isFinite(n) || n <= 0 || n > 99999999) return false;
  return n;
}

/* Lo mismo para la agenda: el camión no hace quince trabajos en una
   parada, y sin tope un cuerpo armado a mano llena la agenda de un día. */
const MAX_TRABAJOS_POR_VISITA = 10;

/* El total de una cotización de varias líneas. Suma los pisos y los
   techos; si alguna línea sólo tiene piso, el total también lo es —por
   encima no hay techo que prometer— y eso es justo lo que significa que
   el mínimo y el máximo salgan iguales.

   Devuelve null si NINGUNA línea se pudo calcular: ahí no hay nada que
   sumar y quien llama decide si eso es un error o un precio a mano. */
function sumarLineas(lineas) {
  const buenas = lineas.filter((L) => montoDeLinea(L));
  if (!buenas.length) return null;

  let min = 0, max = 0, dias = null, provisional = false, soloPiso = false;
  for (const L of buenas) {
    const m = montoDeLinea(L);
    min += m.min;
    max += m.max;
    if (m.desde) soloPiso = true;
    // Un precio escrito a mano no es provisional: ya se vio el trabajo.
    if (L.montoFijo == null && L.calculo && L.calculo.provisional) provisional = true;
    if (L.calculo && L.calculo.dias != null) dias = L.calculo.dias;
  }

  const una = buenas.length === 1 ? buenas[0] : null;
  return {
    servicio: (una || buenas[0]).entrada.servicio,
    servicioNombre: una ? nombreDeLinea(una) : nombresDeLineas(lineas),
    min: min,
    max: soloPiso ? min : max,
    desde: soloPiso,
    dias: dias,
    desglose: buenas.reduce((a, L) => a.concat((L.calculo && L.calculo.desglose) || []), []),
    provisional: provisional,
    ivaIncluido: TARIFAS.iva.incluido,
    vigenciaDias: TARIFAS.vigenciaDias
  };
}

/* El monto de UNA línea. Un precio escrito a mano NO es un estimado con
   piso y techo: es lo que vale, así que el mínimo y el máximo quedan
   iguales y sin "desde". Si no hay precio a mano manda el cálculo de la
   tarifa, y si tampoco se pudo calcular, la línea no tiene monto. */
function montoDeLinea(L) {
  const u = unitarioDeLinea(L);
  if (!u) return null;
  const n = L.cantidad || 1;
  return { min: u.min * n, max: u.max * n, desde: u.desde };
}

/* El precio de UNA unidad. Es el que se escribe a mano y el que calcula
   la tarifa; el total de la línea sale de multiplicarlo. Se separan
   porque una factura electrónica pide los dos por aparte. */
function unitarioDeLinea(L) {
  if (L.montoFijo != null) return { min: L.montoFijo, max: L.montoFijo, desde: false };
  if (!L.calculo) return null;
  return { min: L.calculo.min, max: L.calculo.max, desde: !!L.calculo.desde };
}

/* Un entero de 1 a 99. Sin cantidad, 1: lo normal es un tanque. */
function cantidadDeLinea(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 1 && n <= 99 ? n : 1;
}

/* "Tanque séptico y 2 más". Es lo que el panel muestra en la tarjeta de
   la cotización recién creada y en el aviso: el documento sí lleva la
   lista completa, pero un renglón no aguanta cinco nombres. */
function nombresDeLineas(lineas) {
  const n = lineas.map((L) => nombreDeLinea(L)).filter(Boolean);
  if (!n.length) return "";
  if (n.length === 1) return n[0];
  return n[0] + " y " + (n.length - 1) + " más";
}

function nombreDeLinea(L) {
  return L.servicioLibre ||
    (L.calculo && L.calculo.servicioNombre) ||
    etiqueta(L.entrada.servicio, null, "servicio");
}

/* El desglose que se guarda en la columna `lineas` y que el documento
   lee para armar la tabla. Se guarda ya resuelto —con el nombre y el
   monto, no con los códigos— porque las tarifas cambian y una
   cotización emitida tiene que seguir diciendo lo que dijo. */
function lineasParaGuardar(lineas) {
  return lineas.map((L) => {
    const m = montoDeLinea(L);
    const u = unitarioDeLinea(L);
    return {
      servicio: L.entrada.servicio,
      nombre: nombreDeLinea(L),
      forma: L.entrada.forma || null,
      medida: L.entrada.medida || null,
      ultimo: L.entrada.antiguedad || null,
      dias: (L.calculo && L.calculo.dias) || null,
      detalle: L.detalleLibre || null,
      cantidad: L.cantidad || 1,
      // El unitario se guarda aparte del total: es lo que pide una
      // factura, y además deja ver de dónde salió el monto de la línea.
      unitMin: u ? u.min : null,
      unitMax: u ? u.max : null,
      min: m ? m.min : null,
      max: m ? m.max : null,
      desde: m ? m.desde : false,
      // Con precio puesto a mano el documento dice el monto a secas, sin
      // "Desde": ya se vio el trabajo y vale eso.
      aMano: L.montoFijo != null
    };
  });
}

/* Las columnas nuevas llegan con migraciones que se corren a mano en la
   consola de D1. Mientras no se hayan corrido, nombrarlas en un INSERT
   o un SELECT revienta la consulta entera. Se pregunta una vez por
   tabla y por isolate, y se recuerda. */
const _cols = new Map();
async function columnasDe(env, tabla) {
  if (_cols.has(tabla)) return _cols.get(tabla);
  let set = new Set();
  try {
    const { results } = await env.DB.prepare(`PRAGMA table_info(${tabla})`).all();
    set = new Set((results || []).map((c) => c.name));
  } catch (e) {
    console.error("No se pudo leer la forma de " + tabla + ":", e);
  }
  _cols.set(tabla, set);
  return set;
}
async function hayColumna(env, tabla, col) {
  return (await columnasDe(env, tabla)).has(col);
}
/* Una tabla existe si tiene columnas. Sirve para que una migración que
   todavía no se corrió no tumbe una pantalla entera: se consulta sin
   ella y listo. */
async function hayTabla(env, tabla) {
  return (await columnasDe(env, tabla)).size > 0;
}
async function hayColumnaLineas(env) {
  return hayColumna(env, "cotizaciones", "lineas");
}

function calcularCotizacion(entrada) {
  const svc = TARIFAS.servicios[entrada.servicio];
  if (!svc) return null;

  let min = null, max = null, diasAlquiler = null, avisoAntiguedad = null;
  const desglose = [];

  if (svc.formas) {
    // Tanque séptico: forma → medida → antigüedad.
    const forma = svc.formas[entrada.forma];
    if (!forma) return null;
    const medida = forma.medidas[entrada.medida];
    if (!medida) return null;
    const anos = TARIFAS.antiguedad[entrada.antiguedad];
    if (!anos) return null;

    min = medida.precio + anos.monto;
    desglose.push({ concepto: forma.etiqueta + ", " + medida.etiqueta, monto: medida.precio });
    if (anos.monto) desglose.push({ concepto: anos.etiqueta, monto: anos.monto });
    // Cuando no se sabe la antigüedad, el precio sale sin recargo pero
    // con el aviso de hasta cuánto puede subir en la visita.
    if (anos.aviso) avisoAntiguedad = anos.aviso;

  } else if (svc.rango) {
    min = svc.rango[0];
    max = svc.rango[1];
    desglose.push({ concepto: svc.nombre, monto: null });

  } else if (svc.desde) {
    min = svc.desde;
    desglose.push({ concepto: svc.nombre, monto: null });

  } else if (svc.porDia) {
    const pedidos = parseInt(entrada.dias, 10);
    const dias = Number.isFinite(pedidos) && pedidos > svc.diasMinimo
      ? Math.min(pedidos, 365) : svc.diasMinimo;
    min = svc.porDia * dias;
    diasAlquiler = dias;
    desglose.push({
      concepto: dias + " días de alquiler, a " + colones(svc.porDia) + " por día",
      monto: min
    });
  }

  if (min == null) return null;

  /* El recargo por llegar hasta ahí. Se suma al precio, y en el
     desglose queda nombrado como lo que es para que el panel lo pueda
     ver; el documento del cliente no lo muestra aparte. */
  const cob = coberturaDe(entrada.provincia, entrada.canton, entrada.distrito);
  if (cob.cubierto && cob.recargo > 0) {
    min += cob.recargo;
    if (max != null) max += cob.recargo;
    desglose.push({ concepto: "Recargo por la zona", monto: cob.recargo, interno: true });
  }

  /* `max` en null quiere decir "desde": es un piso, no un rango. Se
     guarda igual al mínimo porque la columna de la base no acepta
     nulos, y quien muestra el dato entiende que min igual a max es un
     "desde" y no un rango de cero de ancho. */
  return {
    servicio: entrada.servicio,
    servicioNombre: svc.nombre,
    min: min,
    max: max == null ? min : max,
    desde: max == null,
    dias: diasAlquiler,
    desglose: desglose,
    recargoZona: cob.cubierto ? cob.recargo : null,
    avisoAntiguedad: avisoAntiguedad,
    provisional: TARIFAS.provisional,
    ivaIncluido: TARIFAS.iva.incluido,
    vigenciaDias: TARIFAS.vigenciaDias
  };
}

/* =============================================================
   División territorial de Costa Rica
   =============================================================

   La lista completa vive en lib/geografia-cr.js, que salió del archivo
   del propietario. Acá sólo está lo que el negocio hace con ella:
   validar que la dirección exista de verdad y sacar el factor de zona.

   Antes la zona era una pregunta aparte ("¿dentro o fuera del GAM?") y
   el distrito se escribía a mano. Las dos cosas producían basura: la
   misma zona escrita de cinco formas distintas, y un cobro de ruta que
   dependía de que la persona supiera clasificarse sola. */

/* Qué se cobra como ruta larga. Lo definió el propietario: fuera del
   GAM son estas tres provincias completas, y las otras cuatro se
   consideran alcanzables. Es más grueso que ir cantón por cantón —un
   viaje a Pérez Zeledón no cuesta lo mismo que uno a Escazú, y los dos
   caen en "valle"— pero es la regla con que la empresa trabaja hoy, y
   una regla real y gruesa vale más que una fina que yo me inventé.
   Va a afinarse por ubicación más adelante. */
const PROVINCIAS_LEJANAS = new Set(["Guanacaste", "Puntarenas", "Limón"]);

/* El factor de zona sale de la dirección, no de una pregunta aparte:
   pedirle a alguien que se clasifique solo entre "dentro" y "fuera"
   del GAM es pedirle que adivine un cobro que no conoce. */
function zonaDeProvincia(provincia) {
  return PROVINCIAS_LEJANAS.has(provincia) ? "resto" : "valle";
}

/* La dirección se valida entera. El distrito es opcional —hay gente que
   no sabe en cuál está— pero si viene, tiene que ser uno de los que le
   corresponden a ese cantón, no cualquier texto. */
function direccionValida(provincia, canton, distrito) {
  const cantones = GEOGRAFIA[provincia];
  if (!cantones) return false;
  const distritos = cantones[canton];
  if (!distritos) return false;
  return !distrito || distritos.indexOf(distrito) !== -1;
}

/* "San Antonio, Belén, Heredia" — de lo fino a lo ancho, como se
   escribe una dirección en Costa Rica. */
function zonaTexto(provincia, canton, distrito) {
  return [distrito, canton, provincia].filter(Boolean).join(", ") || null;
}

/* Limpia los datos personales de una petición. Devuelve o los datos ya
   en formato, o el primer error para decírselo a quien escribió.

   `obligatorios` dice cuáles no pueden faltar: el formulario y el
   cotizador piden cosas distintas, pero el formato es el mismo en los
   dos. Un campo opcional vacío pasa; uno opcional MAL ESCRITO no —
   guardar "escríbame al 8888" como cédula es peor que no guardar nada. */
function limpiarDatosPersona(cuerpo, obligatorios) {
  const campos = {
    nombre:   { fn: normalizarNombre,   etiqueta: "el nombre" },
    telefono: { fn: normalizarTelefono, etiqueta: "el teléfono" },
    cedula:   { fn: normalizarCedula,   etiqueta: "la cédula" },
    correo:   { fn: normalizarCorreo,   etiqueta: "el correo" }
  };

  const salida = {};
  for (const [clave, campo] of Object.entries(campos)) {
    const crudo = texto(cuerpo[clave], 300);
    if (!crudo) {
      if (obligatorios.indexOf(clave) !== -1) {
        return { error: "Falta " + campo.etiqueta + "." };
      }
      salida[clave] = "";
      continue;
    }
    const r = campo.fn(crudo);
    if (!r.ok) return { error: r.error };
    salida[clave] = r.valor;
    if (clave === "cedula") salida.tipoCedula = r.tipo;
  }
  return { datos: salida };
}

/* Lo que va impreso en toda cotización. Está acá y no en el HTML del
   documento para que un cambio de teléfono se haga en un solo lugar. */
const EMPRESA = {
  nombre: "Sanitarios Ticos",
  razonSocial: "Ticos Sanitarios S.A.",
  cedula: "3-101-702385",
  telefonos: ["2440-1110", "2265-4150"],
  whatsapp: "8341-7547",
  correo: "info@sanitariosticos.com",
  sitio: "sanitariosticoscr.com",
  /* Va bajo el nombre en el documento imprimible. Ya no son sedes: es
     un negocio de área de servicio, va donde el cliente. */
  cobertura: "Cobertura en todo el país",

  /* Lo que el certificado tiene que nombrar para que valga: quién firma
     y con qué permisos. Salen del certificado que ya se emitía a mano
     (2026-069, PAVICEN); acá quedan en un solo lugar, en vez de
     reescribirse en cada documento de Word. */
  representante: "Carlos Vinicio Leitón Villegas",
  cargo: "Representante legal",
  permisoSanitario: "0230-2020",
  /* La planta de tratamiento que recibe lo que se extrae. Está en
     Alajuela y no cambia: el certificado la nombra siempre igual. */
  plantaProvincia: "Alajuela",
  // El camión de siempre. Es sólo el valor por defecto: al emitir el
  // certificado se puede cambiar, que para eso un día habrá dos.
  placa: "C146776"
};

/* El número del certificado: año y correlativo, como se venían
   numerando a mano. El último hecho a mano fue el 2026-069, así que el
   panel arranca en el 070. Cambiar esto NO renumera lo ya emitido: sólo
   mueve el piso por si se emite alguno por fuera. */
const CERTIFICADO_DESDE = 70;

/* Qué mueve cada respuesta. Va debajo del dato en el documento, para que
   el cliente entienda de dónde sale el rango en vez de tener que creerlo. */
const PORQUE = {
  forma: "De la forma sale el tamaño, que es lo que cobra",
  medida: "El tamaño del tanque es lo que decide el precio",
  antiguedad: "Entre más tiempo pasa, más lodo hay que sacar",
  dias: "Se cobra por día, con un mínimo de ocho",
  perfil: "Estima el volumen del tanque",
  ultimo: "Entre más tiempo pasa, más lodo hay que sacar",
  acceso: "Metros de manguera desde donde para el camión",
  zona:   "Distancia de la ruta"
};

/* Llave aleatoria del documento. Sin esto, el número correlativo sería
   suficiente para que cualquiera fuera probando COT-2026-0001, 0002… y
   leyera el nombre y el teléfono de otras personas. */
function nuevaLlave() {
  const b = new Uint8Array(18);
  crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* Número correlativo a partir del id que devuelve D1: COT-2026-0007. */
function numeroCotizacion(id) {
  return "COT-" + new Date().getFullYear() + "-" + String(id).padStart(4, "0");
}

async function avisarCotizacion(datos, env) {
  if (!env.RESEND_API_KEY || !env.CORREO_AVISO) return;

  const filas = [
    ["Número", datos.numero],
    ["Servicio", datos.servicioNombre],
    ["Monto", montoTexto(datos.min, datos.max)],
    ["Nombre", datos.nombre || "—"],
    ["Teléfono", datos.telefono || "—"],
    ["Zona", ZONAS[datos.zona] || datos.zona],
    ["Origen", ORIGENES[datos.origen] || datos.origen || "—"]
  ].map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#7d736a;">${k}</td><td style="padding:4px 0;"><b>${escaparHtml(String(v))}</b></td></tr>`).join("");

  /* El monto de arriba es lo que la máquina calculó con lo que la
     persona escribió. Quien pone el precio oficial es el encargado, y
     eso no cambia: el recordatorio va en todos los correos, no sólo
     mientras las tarifas se afinan. */
  const aviso = `<p style="margin:16px 0 0;padding:10px 12px;background:#fbeee5;color:#b34c0d;font-size:13px;">
       <b>Estimado automático.</b> El precio oficial lo pone usted al hablar
       con el cliente${datos.provisional ? " (además, estas tarifas siguen en revisión)" : ""}.</p>`;

  /* De dónde salió la cotización cambia qué hay que hacer con ella. Una
     del sitio es alguien que entró solo y todavía no ha hablado con
     nadie: es la que hay que contestar hoy. Una del panel ya la hizo el
     encargado, con el cliente al teléfono. */
  const deAfuera = datos.origen !== "panel";
  const quien = datos.origen === "panel" ? "Se emitió una cotización desde el panel"
              : datos.origen === "solicitud" ? "Se cotizó una solicitud"
              : datos.origen === "formulario" ? "Alguien se cotizó en el sitio web"
              : "Víctor cotizó a alguien";

  /* El WhatsApp ya armado dentro del correo: el objetivo del aviso es
     escribirle antes de que llame a otro, y buscar el número a mano es
     justo lo que hace que eso no pase. */
  const wa = waDe(datos.telefono,
    "Buenas" + (datos.nombre ? " " + primerNombre(datos.nombre) : "") +
    ", le escribo de Sanitarios Ticos por la cotización " + (datos.numero || "") +
    " que acaba de hacer en la página. ¿Se la coordinamos?");
  const boton = wa && deAfuera
    ? `<p style="margin:18px 0 0;"><a href="${wa}" style="display:inline-block;background:#25d366;
         color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:10px 18px;
         border-radius:8px;">Escribirle por WhatsApp</a></p>`
    : "";

  const cuerpoCorreo = {
    from: "Sanitarios Ticos <avisos@sanitariosticoscr.com>",
    to: [env.CORREO_AVISO],
    // Un solo monto no se escribe "₡65.000 a ₡65.000".
    subject: (deAfuera ? "Cotización nueva en el sitio" : "Cotización") +
             ` ${datos.numero} — ${montoTexto(datos.min, datos.max)}`,
    html: `<div style="font-family:system-ui,sans-serif;color:#1b1917;">
             <h2 style="margin:0 0 12px;font-size:18px;">${quien}</h2>
             <table style="border-collapse:collapse;font-size:14px;">${filas}</table>
             ${boton}
             ${aviso}
           </div>`
  };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.RESEND_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(cuerpoCorreo)
    });
    if (!res.ok) console.error("Resend rechazó el aviso de cotización:", await res.text());
  } catch (e) {
    console.error("No se pudo avisar de la cotización:", e);
  }
}

async function cotizar(request, env, ctx) {
  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch (e) {
    return json({ ok: false, error: "Formato inválido" }, 400);
  }

  /* Todo lo que viene a continuación —precio a mano, servicio escrito,
     dirección escrita— sólo lo puede mandar quien tiene la clave del
     panel. Desde el sitio público no hay forma de poner un precio: eso
     convertiría el cotizador en un formulario donde el visitante se
     cotiza a sí mismo lo que quiera. */
  const esPanel = claveValida(request, env);

  // Factura electrónica (solo desde el panel):
  //   'iva' → cobrar IVA 13%
  //   'exo' → exonerado (IVA 0, se rotula "Exonerado" en el documento)
  //   'no'  → sin factura electrónica (el monto sale tal cual)
  /* Quién pide factura electrónica. Desde el sitio se puede marcar
     "iva": es la casilla del cotizador, y de ella depende que el monto
     salga con el 13% aparte o a secas. "exo" (exonerado) sigue siendo
     sólo del panel: es una condición tributaria que la empresa tiene
     que verificar, no algo que el visitante declare de sí mismo. */
  const factura = ["iva", "exo"].indexOf(cuerpo.factura) !== -1
    ? (cuerpo.factura === "exo" && !esPanel ? "no" : cuerpo.factura)
    : "no";

  const provincia = texto(cuerpo.provincia, 40);
  const canton = texto(cuerpo.canton, 60);
  const distrito = texto(cuerpo.distrito, 80);
  const lugarLibre = esPanel ? texto(cuerpo.lugarLibre, 120) : "";

  /* Con dirección escrita a mano no se valida contra la lista: el caso
     es justamente el que no está en ella. Pero si además mandó
     provincia, esa sí tiene que existir, o el guardado quedaría con un
     cantón inventado que después ensucia las estadísticas de zona. */
  if (!lugarLibre || provincia) {
    if (!direccionValida(provincia, canton, distrito)) {
      return json({ ok: false, error: "Esa dirección no existe en la lista de Costa Rica" }, 400);
    }
  }

  /* La zona gruesa (dentro o fuera del GAM) se sigue guardando para
     poder estudiar de dónde viene el trabajo. El precio ya no sale de
     ella sino del recargo por distrito. */
  const zona = zonaDeProvincia(provincia);

  /* ¿Llega la tabla hasta ahí?

     Si no llega, la página NO inventa un precio. Desde el sitio se
     contesta que esa zona se cotiza directo con el encargado, y la
     persona tiene el WhatsApp y la solicitud a mano: el trabajo se
     puede hacer igual, lo que no se puede es ponerle precio solo.

     Desde el PANEL sí se deja pasar: ahí el precio lo escribe el
     encargado a mano, que es exactamente para lo que existe este
     camino. */
  if (!esPanel && !lugarLibre) {
    const cob = coberturaDe(provincia, canton, distrito);
    if (!cob.cubierto) {
      return json({
        ok: false,
        fueraDeTabla: true,
        motivo: cob.motivo,
        zona: zonaTexto(provincia, canton, distrito),
        error: cob.motivo === "sin-distrito"
          ? "Para darle el precio hace falta el distrito."
          : "Esa zona no tiene precio automático: la cotiza el encargado."
      }, 422);
    }
  }

  /* UNA cotización puede llevar VARIOS servicios: dos tanques de
     tamaños distintos, el tanque y la trampa de grasa. Partirlo en dos
     cotizaciones le manda al cliente dos documentos por un solo
     trabajo, así que van como líneas de la misma.

     El cuerpo viejo —un servicio suelto en la raíz— se sigue aceptando
     y se trata como una línea única: el formulario público lo manda así
     y no tiene por qué cambiar. */
  const crudas = (Array.isArray(cuerpo.lineas) && cuerpo.lineas.length)
    ? cuerpo.lineas.slice(0, MAX_LINEAS_COTIZACION)
    : [cuerpo];

  const lineas = crudas.map((x) => {
    const e = {
      /* El panel manda "__otro" cuando el encargado escribió el servicio.
         Se guarda como "otro" a secas: el doble guion bajo es una marca
         interna del formulario y no tiene por qué aparecer en el CSV ni en
         los desgloses del resumen. El nombre de verdad va en
         `servicio_libre`. */
      servicio: texto(x.servicio, 40) === "__otro" ? "otro" : texto(x.servicio, 40),
      // Tanque séptico
      forma: texto(x.forma, 40),
      medida: texto(x.medida, 40),
      antiguedad: texto(x.antiguedad, 40),
      // Alquiler
      dias: x.dias,
      zona
    };
    return {
      entrada: e,
      /* Cuántos iguales. Cuatro tanques del mismo tamaño son una línea
         con cantidad 4 y no cuatro líneas repetidas: así se cotiza y así
         se factura, con precio unitario y total de línea. */
      cantidad: cantidadDeLinea(x.cantidad),
      calculo: calcularCotizacion(e),
      /* El precio de ESTA línea, puesto a mano. Es el caso de "ya lo vi y
         vale esto", servicio por servicio: con dos tanques de tamaños
         distintos cada uno tiene su precio y el documento los suma. */
      montoFijo: esPanel ? montoEnColones(x.montoFijo) : null,
      servicioLibre: esPanel ? texto(x.servicioLibre, 80) : "",
      detalleLibre:  esPanel ? texto(x.detalleLibre, 200) : ""
    };
  });

  if (lineas.some((L) => L.montoFijo === false)) {
    return json({ ok: false, error: "El precio tiene que ser un monto en colones" }, 400);
  }

  /* Las columnas de siempre guardan la PRIMERA línea. No es un
     resumen: es que la tabla nació con un servicio por fila y todo lo
     que la lee —el CSV, el resumen, las estadísticas por tipo— sigue
     esperando eso. El desglose completo va aparte, en `lineas`. */
  const entrada = lineas[0].entrada;
  const servicioLibre = lineas[0].servicioLibre;
  const detalleLibre  = lineas[0].detalleLibre;

  /* El precio a mano. Es el caso de "ya lo vi y vale esto": no es un
     estimado con un piso y un techo, es un monto. Por eso el mínimo y
     el máximo quedan iguales y se marca `a_mano`, que es lo que después
     le dice al documento que diga "₡95.000" y no "Desde ₡95.000". */
  /* El precio a mano de la cotización ENTERA. Es la forma vieja —un solo
     monto para todo— y sigue valiendo cuando ninguna línea trae el suyo:
     así un cuerpo de antes, o el formulario público, se comportan igual.
     Si las líneas sí traen precio, mandan ellas y éste se ignora. */
  const hayPrecioPorLinea = lineas.some((L) => L.montoFijo != null);
  let montoFijo = null;
  if (esPanel && !hayPrecioPorLinea && cuerpo.montoFijo != null && cuerpo.montoFijo !== "") {
    montoFijo = montoEnColones(cuerpo.montoFijo);
    if (montoFijo === false) {
      return json({ ok: false, error: "El precio tiene que ser un monto en colones" }, 400);
    }
  }

  /* El total es la SUMA de las líneas. Si alguna sólo tiene piso
     ("desde"), el total también: por encima de ese piso no hay techo
     que prometer. */
  let calculo = sumarLineas(lineas);

  /* Sin precio a mano hay que poder calcular. Con precio a mano no hace
     falta: es el caso del trabajo que no está en la tabla, y obligar a
     escoger un servicio de la lista para después ignorar su precio sería
     pedir un dato falso. */
  if (!calculo) {
    if (montoFijo === null) {
      return json({ ok: false, error: "Datos incompletos o no reconocidos" }, 400);
    }
    calculo = { min: montoFijo, max: montoFijo, dias: null, provisional: false };
  }
  if (montoFijo !== null) {
    calculo = { min: montoFijo, max: montoFijo, dias: calculo.dias, provisional: false };
  }

  /* Una línea que ni se pudo calcular ni trae precio no vale cero: vale
     lo que nadie dijo. Sumarla como cero daría un total más bajo que el
     trabajo, que es la clase de error que se descubre cobrando. Se deja
     pasar sólo cuando hay un precio único para toda la cotización, que
     es el caso de "el total es éste y punto". */
  if (montoFijo === null && lineas.some((L) => !montoDeLinea(L))) {
    const cual = lineas.findIndex((L) => !montoDeLinea(L)) + 1;
    return json({ ok: false, error: lineas.length > 1
      ? "Al servicio " + cual + " le falta el precio: no está en la tabla de tarifas"
      : "Datos incompletos o no reconocidos" }, 400);
  }

  /* La cotización es "a mano" cuando el precio NO es un estimado: o se
     puso uno solo para todo, o se puso el de CADA línea. Con unas a mano
     y otras calculadas el total sigue siendo un estimado, y decir
     "Precio" sería cerrar un monto que todavía puede moverse. */
  const todoAMano = montoFijo !== null ||
    (lineas.length > 0 && lineas.every((L) => L.montoFijo != null));

  const persona = limpiarDatosPersona(cuerpo, ["nombre", "telefono"]);
  if (persona.error) return json({ ok: false, error: persona.error }, 400);
  const { nombre, telefono, cedula, correo } = persona.datos;
  /* Decir que una cotización salió del panel es decir que la hizo
     alguien de la empresa, y de eso dependen las estadísticas de por
     dónde entra el trabajo. Así que hay que probarlo con la clave; sin
     ella, la cotización se guarda igual pero como venida de Víctor. */
  let origen = ["panel", "formulario"].indexOf(cuerpo.origen) !== -1 ? cuerpo.origen : "beto";
  if (origen === "panel" && !claveValida(request, env)) origen = "beto";

  /* Si la cotización nació de una solicitud, la etiqueta es "solicitud":
     de ahí sale el filtro de dónde proviene cada cotización, y ésas —como
     las del +— tienen más probabilidad de concretarse que las de la web
     de alguien que sólo quería saber el precio. */
  const solicitudId = esPanel ? parseInt(cuerpo.solicitudId, 10) : NaN;
  if (esPanel && Number.isFinite(solicitudId) && solicitudId > 0) origen = "solicitud";

  let numero = null;
  let enlace = null;
  const llave = nuevaLlave();
  /* El desglose sólo se guarda cuando hay más de un servicio: una
     cotización de uno solo ya está entera en sus columnas, y repetirla
     en un JSON sería dos fuentes de verdad para el mismo dato. */
  /* También cuando hay una sola línea pero con cantidad: "4 tanques a
     ₡35.000" no cabe en las columnas de siempre, que guardan un servicio
     y un monto. */
  const hayCantidad = lineas.some((L) => (L.cantidad || 1) > 1);
  const desgloseJSON = (lineas.length > 1 || hayCantidad)
    ? JSON.stringify(lineasParaGuardar(lineas)) : null;
  const guardaLineas = desgloseJSON !== null && await hayColumnaLineas(env);
  if (desgloseJSON !== null && !guardaLineas) {
    console.error("Falta la columna `lineas`: la cotización se guarda con el total " +
                  "pero sin desglose. Correr tools/agregar-lineas-cotizacion.sql.");
  }

  try {
    const res = await env.DB.prepare(
      `INSERT INTO cotizaciones
         (servicio, forma, medida, ultimo, dias, zona, monto_min, monto_max,
          provisional, origen, nombre, telefono, llave,
          cedula, correo, provincia, canton, distrito,
          a_mano, servicio_libre, detalle_libre, lugar_libre, factura
          ${guardaLineas ? ", lineas" : ""})
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13,
               ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23
               ${guardaLineas ? ", ?24" : ""})`
    ).bind(
      // `ultimo` guarda la antigüedad: es la misma pregunta de siempre
      // —hace cuánto fue el último servicio— con otro nombre en el
      // código, así que no hace falta una columna nueva.
      entrada.servicio, entrada.forma || null, entrada.medida || null,
      entrada.antiguedad || null, calculo.dias || null, entrada.zona,
      calculo.min, calculo.max, calculo.provisional ? 1 : 0, origen, nombre, telefono, llave,
      cedula, correo, provincia, canton, distrito,
      todoAMano ? 1 : 0, servicioLibre || null, detalleLibre || null, lugarLibre || null,
      factura,
      ...(guardaLineas ? [desgloseJSON] : [])
    ).run();

    const id = res.meta && res.meta.last_row_id;
    if (id) {
      numero = numeroCotizacion(id);
      const solId = (Number.isFinite(solicitudId) && solicitudId > 0) ? solicitudId : null;
      // Enlaza la cotización a su cliente (por teléfono, si ya existe) y a
      // la solicitud de la que salió — por ID, no por nombre (F0).
      await env.DB.prepare(
        `UPDATE cotizaciones SET numero = ?1,
           cliente_id = (SELECT cl.id FROM clientes cl WHERE cl.telefono = ?2),
           solicitud_id = ?3
         WHERE id = ?4`
      ).bind(numero, telefono, solId, id).run();
      // Y la solicitud recuerda en qué cotización terminó y, si por el
      // teléfono se reconoció al cliente, a quién pertenece (§21).
      if (solId) {
        await env.DB.prepare(
          `UPDATE solicitudes SET cotizacion_id = ?1,
             cliente_id = COALESCE(cliente_id, (SELECT id FROM clientes WHERE telefono = ?2 AND papelera IS NULL))
           WHERE id = ?3`
        ).bind(id, telefono, solId).run().catch(() => {});
      }
      // La dirección del documento: sirve de PDF, de imagen y de enlace
      // para pegar en WhatsApp, que es la que no se pierde.
      enlace = new URL(request.url).origin +
        "/cotizacion?n=" + encodeURIComponent(numero) + "&k=" + encodeURIComponent(llave);
    }
  } catch (e) {
    // Que falle el guardado no debe dejar al cliente sin su número:
    // la cotización se entrega igual y el fallo queda en el registro.
    console.error("Error al guardar la cotización:", e);
  }

  /* El nombre y el teléfono vuelven ya limpios. Los necesita el panel
     para armar el WhatsApp con el que se le manda el documento al
     cliente: lo que la persona escribió podía venir dentro de una frase. */
  /* El orden importa: lo de `calculo` primero y lo de acá después. Al
     revés, el nombre que trae la tabla pisaría el que escribió el
     encargado y el panel diría "Otro" en vez de "Bombeo de pozo". */
  /* El IVA, ya resuelto. Antes el sitio decía "al monto se le suma el
     IVA" y dejaba la cuenta al cliente; ahora, si marcó la casilla, el
     documento y la pantalla muestran los tres números —monto, IVA y
     total— y si no la marcó, sale el precio y nada más. */
  const ivaMonto = factura === "iva" ? Math.round(calculo.max * TARIFAS.iva.tasa) : 0;

  const salida = Object.assign(
    { ok: true, numero: numero, enlace: enlace, nombre: nombre, telefono: telefono },
    calculo,
    {
      aMano: todoAMano,
      factura: factura,
      ivaTasa: TARIFAS.iva.tasa,
      ivaMonto: ivaMonto,
      totalConIVA: factura === "iva" ? calculo.max + ivaMonto : null,
      servicioNombre: servicioLibre || calculo.servicioNombre ||
                      etiqueta(entrada.servicio, null, "servicio")
    }
  );

  /* La solicitud de origen pasa a "realizada": deja la lista de
     pendientes y su lugar queda en Cotizaciones (guía § Solicitudes). */
  if (esPanel && Number.isFinite(solicitudId) && solicitudId > 0) {
    ctx.waitUntil(env.DB.prepare(
      `UPDATE solicitudes SET estado = 'hecha', actualizado = datetime('now') WHERE id = ?`
    ).bind(solicitudId).run().catch(function (e) { console.error("No se marcó la solicitud:", e); }));
  }

  // El aviso sale en segundo plano, como el del formulario.
  ctx.waitUntil(avisarCotizacion(Object.assign({}, salida, {
    nombre: nombre, telefono: telefono, zona: entrada.zona, origen: origen
  }), env));

  return json(salida);
}

/* Los datos de una cotización ya emitida, para el documento imprimible.
   Pide número Y llave: el número solo no alcanza, porque es correlativo.
   La comparación se hace en la consulta, así que una llave equivocada
   simplemente no devuelve fila. */
/* ============================================================================
   Certificados y tiquetes

   Dos papeles que a veces piden después de un trabajo ya hecho:

     certificado — el que exige el Ministerio de Salud a las empresas:
                   qué se recogió, cuánto, qué día y a dónde fue. Se
                   emitía a mano en Word, uno por uno.
     tiquete     — el comprobante informal de lo cobrado, para mandarle
                   al cliente por WhatsApp.

   Ninguno de los dos se pide siempre, así que no se generan solos: se
   emiten cuando alguien los pide desde el panel.

   Lo emitido queda CONGELADO. Si mañana el cliente cambia de nombre o
   se corrige el monto, el papel que ya se entregó sigue diciendo lo que
   decía — que es justamente lo que lo hace servir de comprobante.
   ============================================================================ */

const TIPOS_DOC = ["certificado", "tiquete"];

/* Los m³ sacados y el camión que fue. Los dos son opcionales y casi
   siempre vienen vacíos, así que se guardan en su propia sentencia: no
   vale la pena renumerar los parámetros de un UPDATE que ya funciona
   por un dato que la mayoría de las veces no viene.

   Se llama desde dos lados: al cerrar el trabajo (si se anotaron ahí) y
   al emitir el certificado (si se escribieron en ese momento). */
async function guardarMedidaDelTrabajo(env, id, volumen, placa) {
  const sets = [], vals = [];
  const v = Number(String(volumen == null ? "" : volumen).replace(",", "."));
  if (Number.isFinite(v) && v > 0 && await hayColumna(env, "servicios", "volumen")) {
    sets.push("volumen = ?"); vals.push(v);
  }
  const p = texto(placa, 15);
  if (p && await hayColumna(env, "servicios", "placa")) {
    sets.push("placa = ?"); vals.push(p.toUpperCase());
  }
  if (!sets.length) return;
  try {
    await env.DB.prepare(`UPDATE servicios SET ${sets.join(", ")} WHERE id = ?`)
      .bind(...vals, id).run();
  } catch (e) {
    // Que falte la columna no puede tumbar el cierre de un trabajo.
    console.error("No se pudieron guardar los m³ o la placa:", e);
  }
}

/* El número que sigue. Se mira el último emitido de ese tipo en el año
   y se suma uno; para los certificados hay además un piso, porque los
   primeros 69 del 2026 se hicieron a mano y no están en la base. */
async function numeroSiguiente(env, tipo, ano) {
  const prefijo = tipo === "certificado" ? ano + "-" : "TIQ-" + ano + "-";
  const anchura = tipo === "certificado" ? 3 : 4;
  let ultimo = 0;
  try {
    const { results } = await env.DB.prepare(
      `SELECT numero FROM documentos WHERE tipo = ?1 AND numero LIKE ?2`
    ).bind(tipo, prefijo + "%").all();
    (results || []).forEach((r) => {
      const n = parseInt(String(r.numero).slice(prefijo.length), 10);
      if (Number.isFinite(n) && n > ultimo) ultimo = n;
    });
  } catch (e) {
    console.error("No se pudo leer la numeración de documentos:", e);
    throw e;
  }
  const piso = tipo === "certificado" ? CERTIFICADO_DESDE : 1;
  return prefijo + String(Math.max(ultimo + 1, piso)).padStart(anchura, "0");
}

/* Qué le falta al cliente para poder certificarlo.

   Un certificado es un papel que la empresa firma ante el Ministerio:
   sin el nombre y sin el lugar no dice a quién ni dónde se le hizo el
   trabajo, y no sirve de nada. Más vale negarse acá que emitir uno en
   blanco y que lo devuelvan.

   La cédula NO se exige. Es un dato que mucha gente no da —y que de un
   cliente de casa no siempre hay— y por un número que falta no se va a
   quedar sin su certificado: si está, el documento la pone; si no,
   simplemente no la menciona.

   El tiquete no pide nada de esto: es un comprobante informal. */
function faltaParaCertificar(c) {
  const falta = [];
  if (!(c.nombre || "").trim()) falta.push("el nombre");
  if (!lugarCorto(c.provincia, c.canton, c.distrito)) falta.push("la dirección");
  return falta;
}

/* Lo que ya se emitió de un servicio, por tipo. De acá sale que el
   panel diga "Ver certificado" en vez de "Crear certificado": sin eso
   se emitían dos del mismo trabajo sin querer. */
function documentosDeFila(texto) {
  const r = {};
  String(texto || "").split("|").forEach((t) => {
    const p = t.split(":");
    if (p.length === 3 && p[0]) {
      r[p[0]] = { numero: p[1], llave: p[2],
                  url: `/documento?t=${p[0]}&n=${encodeURIComponent(p[1])}&k=${encodeURIComponent(p[2])}` };
    }
  });
  return r;
}

/* El trozo de SQL que trae lo emitido de cada servicio. Se arma acá para
   no repetirlo en las dos pantallas que lo necesitan, y devuelve vacío
   mientras la tabla no exista. */
async function columnaDocumentos(env, alias) {
  if (!(await hayTabla(env, "documentos"))) return "'' AS docs";
  return `(SELECT group_concat(d.tipo || ':' || d.numero || ':' || d.llave, '|')
             FROM documentos d
            WHERE d.servicio_id = ${alias}.id AND d.papelera IS NULL) AS docs`;
}

/* El lugar, sin repetir. En Alajuela de Alajuela, zonaTexto() da
   "Coyol, Alajuela, Alajuela" — correcto pero feo en un papel que lee
   el Ministerio. Acá se quita el repetido seguido: "Coyol, Alajuela". */
function lugarCorto(provincia, canton, distrito) {
  const partes = [];
  [distrito, canton, provincia].forEach((p) => {
    const v = (p || "").trim();
    if (v && v.toLowerCase() !== (partes[partes.length - 1] || "").toLowerCase()) partes.push(v);
  });
  return partes.join(", ") || null;
}

/* Lo que va escrito en el papel, resuelto en el momento de emitirlo. */
function armarDocumento(tipo, s, c, extra) {
  const nombreSv = s.detalle || etiqueta(s.servicio, null, "servicio");
  const base = {
    tipo: tipo,
    empresa: EMPRESA,
    emitido: new Date().toISOString().slice(0, 10),
    cliente: {
      nombre: c.nombre || null,
      cedula: c.cedula || null,
      telefono: c.telefono || null,
      correo: c.correo || null,
      lugar: lugarCorto(c.provincia, c.canton, c.distrito),
      senas: c.senas || null
    },
    servicio: {
      nombre: nombreSv,
      clave: s.servicio || null,
      fecha: s.fecha || null,
      fechaLarga: fechaConDia(s.fecha),
      detalle: s.detalle || null
    }
  };

  if (tipo === "certificado") {
    const q = certificaDe(s.servicio, s.detalle);
    base.certifica = {
      que: q.que,
      articulo: q.articulo == null ? "la " : q.articulo,
      brindado: q.brindado,
      // Los m³ sólo se dicen si de verdad se sacó algo y hay cuánto.
      saca: q.saca,
      volumen: q.saca && extra.volumen > 0 ? extra.volumen : null,
      planta: !!q.planta,
      /* Dónde está la planta que recibe lo extraído. Es SIEMPRE la
         misma, y es un dato de la empresa — no del cliente.

         Acá decía `c.provincia`, o sea la provincia del cliente: a un
         cliente de Heredia le salió un certificado jurando que los
         residuos se descargaron en una planta de Heredia. Eso es decir
         algo falso en un papel firmado ante el Ministerio. */
      plantaProvincia: EMPRESA.plantaProvincia,
      placa: extra.placa || EMPRESA.placa
    };
  } else {
    base.cobro = {
      monto: extra.monto,
      montoTexto: extra.monto != null ? colones(extra.monto) : null,
      pagado: extra.pagado || 0,
      pagadoTexto: colones(extra.pagado || 0),
      saldo: Math.max(0, (extra.monto || 0) - (extra.pagado || 0)),
      saldoTexto: colones(Math.max(0, (extra.monto || 0) - (extra.pagado || 0))),
      metodo: extra.metodo || null,
      // Si pidió factura electrónica, el tiquete lo dice: así nadie lo
      // confunde con la factura de Hacienda, que sale aparte.
      fe: !!extra.fe
    };
  }
  return base;
}

/* Emitir (o recuperar) el papel de un servicio. Desde el panel. */
async function emitirDocumento(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);

  let d;
  try { d = await request.json(); }
  catch (e) { return json({ ok: false, error: "Formato inválido" }, 400); }

  const tipo = TIPOS_DOC.indexOf(d.tipo) !== -1 ? d.tipo : "";
  if (!tipo) return json({ ok: false, error: "Tipo de documento inválido" }, 400);

  /* Certificado suelto: sin servicio detrás.

     Pasa cuando el trabajo no entró por la herramienta, o cuando lo
     contrató una empresa y el certificado va a nombre de otra —el
     dueño del local, el condominio—. Ahí no hay servicio al que
     colgarse, así que los datos vienen escritos a mano.

     Se guarda igual, con servicio_id 0. No es por tener el dato: es
     por el NÚMERO. Si estos no gastaran correlativo, dos certificados
     distintos podrían salir con el mismo 2026-07X y eso es
     exactamente lo que no puede pasar ante Salud. */
  if (d.libre === true) return certificadoSuelto(d, env);

  const servicioId = parseInt(d.servicioId, 10);
  if (!Number.isFinite(servicioId)) return json({ ok: false, error: "Servicio inválido" }, 400);

  try {
    const hayVol = await hayColumna(env, "servicios", "volumen");
    const hayPlaca = await hayColumna(env, "servicios", "placa");
    const hayFe = await hayColumna(env, "servicios", "fe");

    const s = await env.DB.prepare(
      `SELECT s.*, ${hayVol ? "s.volumen" : "NULL"} AS vol,
              ${hayPlaca ? "s.placa" : "NULL"} AS pla,
              ${hayFe ? "s.fe" : "0"} AS feSi,
              (SELECT COALESCE(SUM(p.monto), 0) FROM pagos p
                WHERE p.servicio_id = s.id AND p.papelera IS NULL) AS pagado,
              (SELECT p.metodo FROM pagos p
                WHERE p.servicio_id = s.id AND p.papelera IS NULL
                ORDER BY p.fecha DESC, p.id DESC LIMIT 1) AS metodo
         FROM servicios s WHERE s.id = ? AND s.papelera IS NULL`
    ).bind(servicioId).first();
    if (!s) return json({ ok: false, error: "No existe ese servicio" }, 404);
    if (s.estado !== "completado") {
      return json({ ok: false, error: "El servicio todavía no está marcado como hecho." }, 400);
    }

    const c = await env.DB.prepare(`SELECT * FROM clientes WHERE id = ?`).bind(s.cliente_id).first();
    if (!c) return json({ ok: false, error: "No existe el cliente de ese servicio" }, 404);

    if (tipo === "certificado") {
      const falta = faltaParaCertificar(c);
      if (falta.length) {
        const lista = falta.length === 1 ? falta[0]
          : falta.slice(0, -1).join(", ") + " y " + falta[falta.length - 1];
        return json({ ok: false, falta: falta,
          error: "Para el certificado falta " + lista + " del cliente. " +
                 "Complete la ficha de " + (c.nombre || "ese cliente") +
                 " y vuelva a intentar." }, 400);
      }
    }

    /* Los m³ y la placa que vengan del panel se guardan en el servicio:
       así el dato queda aunque el certificado se vuelva a emitir, y la
       próxima vez ya sale puesto. */
    const volumen = Number.isFinite(+d.volumen) && +d.volumen > 0 ? +d.volumen : (s.vol || 0);
    const placa = (texto(d.placa, 15) || s.pla || EMPRESA.placa).toUpperCase();
    if (tipo === "certificado") {
      await guardarMedidaDelTrabajo(env, servicioId, volumen, placa);
    }

    /* ¿Ya se había emitido? Se devuelve el mismo, no uno nuevo. Pedir
       dos veces el certificado de un trabajo no puede gastar dos
       números del correlativo: eso rompe la numeración ante Salud. */
    const previo = await env.DB.prepare(
      `SELECT id, numero, llave FROM documentos
        WHERE servicio_id = ?1 AND tipo = ?2 AND papelera IS NULL
        ORDER BY id DESC LIMIT 1`
    ).bind(servicioId, tipo).first();

    const armar = () => armarDocumento(tipo, s, c, {
      volumen: volumen, placa: placa,
      monto: s.monto, pagado: s.pagado, metodo: s.metodo, fe: !!s.feSi
    });

    /* Corregir uno ya emitido. Se equivocó en los m³, en la placa o en
       los datos del cliente: se vuelve a armar con lo que hay HOY y se
       guarda sobre el mismo papel.

       El número NO cambia. Es una corrección del mismo documento, no
       uno nuevo: si cada arreglo gastara un número del correlativo, la
       numeración ante Salud quedaría llena de huecos. La llave tampoco,
       para que el enlace que ya se le mandó al cliente siga abriendo —
       y abriendo lo corregido. */
    if (previo && d.rehacer) {
      await env.DB.prepare(
        `UPDATE documentos SET datos = ?1 WHERE id = ?2`
      ).bind(JSON.stringify(Object.assign({ numero: previo.numero }, armar())), previo.id).run();
      return json({ ok: true, corregido: true, tipo,
        numero: previo.numero, llave: previo.llave,
        url: `/documento?t=${tipo}&n=${encodeURIComponent(previo.numero)}&k=${encodeURIComponent(previo.llave)}` });
    }

    if (previo) {
      return json({ ok: true, reusado: true, tipo,
        numero: previo.numero, llave: previo.llave,
        url: `/documento?t=${tipo}&n=${encodeURIComponent(previo.numero)}&k=${encodeURIComponent(previo.llave)}` });
    }

    const datos = armar();
    const numero = await numeroSiguiente(env, tipo, new Date().getFullYear());
    const llave = nuevaLlave();

    await env.DB.prepare(
      `INSERT INTO documentos (tipo, numero, llave, servicio_id, cliente_id, datos)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
    ).bind(tipo, numero, llave, servicioId, s.cliente_id,
           JSON.stringify(Object.assign({ numero }, datos))).run();

    return json({ ok: true, tipo, numero, llave,
      url: `/documento?t=${tipo}&n=${encodeURIComponent(numero)}&k=${encodeURIComponent(llave)}` });
  } catch (e) {
    console.error("No se pudo emitir el documento:", e);
    // La tabla puede no existir todavía: se dice en claro, no "error 500".
    if (/no such table|no such column/i.test(String(e && e.message))) {
      return json({ ok: false, error: "Falta correr la migración de documentos en la base." }, 500);
    }
    return json({ ok: false, error: "No se pudo emitir el documento" }, 500);
  }
}

/* Un certificado escrito a mano, sin servicio detrás. Mismo formato,
   mismo correlativo, misma llave pública: desde afuera no se distingue
   de los demás, que es como tiene que ser. */
async function certificadoSuelto(d, env) {
  const nombre = texto(d.nombre, 120);
  const lugar = texto(d.lugar, 160);
  const fecha = soloFecha(d.fecha);

  const falta = [];
  if (!nombre) falta.push("el nombre del cliente");
  if (!lugar) falta.push("la dirección");
  if (!fecha) falta.push("la fecha de la visita");
  if (falta.length) {
    return json({ ok: false, error: "Falta " + (falta.length === 1 ? falta[0]
      : falta.slice(0, -1).join(", ") + " y " + falta[falta.length - 1]) + "." }, 400);
  }

  const clave = texto(d.servicio, 40);
  const libre = texto(d.servicioLibre, 120);
  const q = certificaDe(CERTIFICA[clave] ? clave : "", libre);
  const volumen = Number(String(d.volumen == null ? "" : d.volumen).replace(",", "."));
  const placa = (texto(d.placa, 15) || EMPRESA.placa).toUpperCase();

  const datos = {
    tipo: "certificado",
    empresa: EMPRESA,
    emitido: new Date().toISOString().slice(0, 10),
    // Sin ficha de cliente: lo que se escribió es lo que hay.
    cliente: { nombre, cedula: texto(d.cedula, 30) || null, telefono: null,
               correo: null, lugar, senas: null },
    servicio: {
      nombre: libre || (CERTIFICA[clave] ? q.brindado : "Servicio contratado"),
      clave: clave || null,
      fecha,
      fechaLarga: fechaConDia(fecha),
      detalle: null
    },
    certifica: {
      que: q.que,
      articulo: q.articulo == null ? "la " : q.articulo,
      brindado: libre || q.brindado,
      saca: q.saca,
      volumen: q.saca && volumen > 0 ? volumen : null,
      planta: !!q.planta,
      plantaProvincia: EMPRESA.plantaProvincia,
      placa
    }
  };

  try {
    const numero = await numeroSiguiente(env, "certificado", new Date().getFullYear());
    const llave = nuevaLlave();
    await env.DB.prepare(
      `INSERT INTO documentos (tipo, numero, llave, servicio_id, cliente_id, datos)
       VALUES ('certificado', ?1, ?2, 0, NULL, ?3)`
    ).bind(numero, llave, JSON.stringify(Object.assign({ numero }, datos))).run();

    return json({ ok: true, tipo: "certificado", numero, llave,
      url: `/documento?t=certificado&n=${encodeURIComponent(numero)}&k=${encodeURIComponent(llave)}` });
  } catch (e) {
    console.error("No se pudo emitir el certificado suelto:", e);
    if (/no such table|no such column/i.test(String(e && e.message))) {
      return json({ ok: false, error: "Falta correr la migración de documentos en la base." }, 500);
    }
    return json({ ok: false, error: "No se pudo emitir el certificado" }, 500);
  }
}

/* Leer un documento emitido. Público, por número y llave — igual que
   las cotizaciones: el cliente abre el enlace sin entrar al panel. */
async function verDocumento(request, env) {
  const url = new URL(request.url);
  const tipo = TIPOS_DOC.indexOf(url.searchParams.get("t")) !== -1 ? url.searchParams.get("t") : "";
  const numero = texto(url.searchParams.get("n"), 30);
  const llave = texto(url.searchParams.get("k"), 60);
  if (!tipo || !numero || !llave) return json({ ok: false, error: "Faltan datos" }, 400);

  let f;
  try {
    f = await env.DB.prepare(
      `SELECT numero, datos, datetime(creado, '-6 hours') AS creado
         FROM documentos
        WHERE tipo = ?1 AND numero = ?2 AND llave = ?3 AND papelera IS NULL`
    ).bind(tipo, numero, llave).first();
  } catch (e) {
    console.error("Error al consultar el documento:", e);
    return json({ ok: false, error: "No se pudo consultar" }, 500);
  }

  // Mismo mensaje para "no existe" y "la llave está mal": distinguirlos
  // le confirmaría a alguien que ese número sí existe.
  if (!f) return json({ ok: false, error: "Ese documento no existe o el enlace está incompleto" }, 404);

  let datos;
  try { datos = JSON.parse(f.datos); }
  catch (e) { return json({ ok: false, error: "El documento quedó mal guardado" }, 500); }

  datos.numero = f.numero;
  if (f.creado) datos.emitido = f.creado.slice(0, 10);

  /* Los certificados emitidos antes de que el artículo se guardara no
     lo traen, y sin él la plantilla pone "la" — que a un destaqueo le
     queda mal. Se deduce del texto congelado, así los ya entregados
     salen bien al volverlos a abrir sin tener que rehacerlos. */
  if (datos.certifica && datos.certifica.articulo == null) {
    const match = Object.values(CERTIFICA).find((c) => c.que === datos.certifica.que);
    datos.certifica.articulo = match ? match.articulo : "la ";
  }

  return json(Object.assign({ ok: true }, datos));
}

async function verCotizacion(request, env) {
  const url = new URL(request.url);
  const numero = texto(url.searchParams.get("n"), 30);
  const llave = texto(url.searchParams.get("k"), 40);
  if (!numero || !llave) return json({ ok: false, error: "Faltan datos" }, 400);

  let f;
  const conLineas = await hayColumnaLineas(env);
  try {
    f = await env.DB.prepare(
      `SELECT numero, datetime(creado, '-6 hours') AS creado, servicio, forma, medida,
              ultimo, dias, perfil, acceso, zona, monto_min, monto_max, provisional,
              nombre, telefono, cedula, correo, provincia, canton, distrito,
              a_mano, servicio_libre, detalle_libre, lugar_libre, factura
              ${conLineas ? ", lineas" : ""}
         FROM cotizaciones
        WHERE numero = ?1 AND llave = ?2`
    ).bind(numero, llave).first();
  } catch (e) {
    console.error("Error al consultar la cotización:", e);
    return json({ ok: false, error: "No se pudo consultar" }, 500);
  }

  // Mismo mensaje para "no existe" y "la llave está mal": decir cuál de
  // las dos es le confirmaría a alguien que ese número sí existe.
  if (!f) return json({ ok: false, error: "Esa cotización no existe o el enlace está incompleto" }, 404);

  const emitida = f.creado ? f.creado.slice(0, 10) : null;
  const vence = emitida ? sumarDias(emitida, TARIFAS.vigenciaDias) : null;

  return json({
    ok: true,
    empresa: EMPRESA,
    numero: f.numero,
    emitida: emitida,
    vence: vence,
    vigenciaDias: TARIFAS.vigenciaDias,
    // Lo que se escribió a mano manda: si el encargado puso "Bombeo de
    // pozo", el documento dice eso y no la etiqueta de la lista.
    servicio: f.servicio_libre || etiqueta(f.servicio, null, "servicio"),
    /* Los servicios de la cotización, cuando lleva más de uno. El
       documento arma con esto una fila por servicio en vez de una sola.
       Viene ya resuelto desde que se emitió: nombre y monto, no códigos,
       para que un cambio de tarifas no reescriba lo que ya se prometió.
       En una cotización de un solo servicio es null y el documento se
       comporta como siempre. */
    lineas: lineasDelDocumento(f),
    /* El "incluye…" del documento sale de acá, no del HTML fijo. Sólo lo
       llevan los servicios de extracción, y NUNCA un servicio escrito a
       mano: poner "incluye la succión…" en un "Bombeo de pozo" que el
       encargado inventó da información falsa (bug que cazó Byron). */
    incluye: f.servicio_libre ? null : (INCLUYE_SERVICIO[f.servicio] || null),
    min: f.monto_min,
    max: f.monto_max,
    minTexto: colones(f.monto_min),
    maxTexto: colones(f.monto_max),
    provisional: !!f.provisional,
    ivaIncluido: TARIFAS.iva.incluido,
    // Factura electrónica (si aplica): 'iva' 13%, 'exo' exonerado, 'no'
    // sin FE. El documento decide qué línea mostrar.
    factura: f.factura || "no",
    ivaTasa: TARIFAS.iva.tasa,
    ivaMonto: f.factura === "iva" ? Math.round(f.monto_max * TARIFAS.iva.tasa) : 0,
    totalConIVA: f.factura === "iva" ? f.monto_max + Math.round(f.monto_max * TARIFAS.iva.tasa)
               : f.factura === "exo" ? f.monto_max : null,
    cliente: {
      nombre: f.nombre || null,
      cedula: f.cedula || null,
      telefono: f.telefono || null,
      correo: f.correo || null,
      zonaTexto: f.lugar_libre || zonaTexto(f.provincia, f.canton, f.distrito)
    },
    /* Es un "desde" cuando no hay techo: el mínimo y el máximo iguales
       no son un rango de cero de ancho, son un piso.

       Salvo cuando el precio lo puso el encargado a mano: ahí los dos
       iguales significan lo contrario —ya se vio el trabajo y vale
       exactamente eso—, y decir "Desde ₡95.000" sería abrirle la puerta
       a un cobro mayor que nadie pensó cobrar. */
    desde: f.monto_min === f.monto_max && !f.a_mano,
    aMano: !!f.a_mano,
    /* Las respuestas con las que se calculó, cada una con lo que mueve.
       Es el reemplazo honesto de las líneas de una factura: no tenemos
       artículos, tenemos motivos.

       Se arma con lo que cada servicio guardó — un tanque tiene forma y
       medida, un alquiler tiene días, un destaqueo no tiene nada de
       esto — y la zona sólo aparece si se sabe. La distancia nunca se
       menciona: el recargo lo decide el encargado y el cliente no lo ve. */
    base: baseDelCalculo(f)
  });
}

/* Las líneas tal como las necesita el documento: el nombre, con qué se
   calculó cada una en una sola frase, y su monto ya escrito en colones.

   Una cotización vieja —o de un solo servicio— no tiene `lineas` y
   devuelve null: el documento entonces usa la fila única de siempre. */
function lineasDelDocumento(f) {
  if (!f.lineas) return null;
  let arr;
  try { arr = JSON.parse(f.lineas); } catch { return null; }
  if (!Array.isArray(arr) || !arr.length) return null;
  // Una sola línea de cantidad 1 no necesita tabla: es el caso de siempre.
  if (arr.length === 1 && (arr[0].cantidad || 1) <= 1) return null;

  return arr.map((L) => {
    const detalles = [
      L.forma  && etiqueta(L.servicio, L.forma,  "forma"),
      L.medida && etiqueta(L.servicio, L.medida, "medida"),
      L.ultimo && etiqueta(L.servicio, L.ultimo, "ultimo"),
      L.dias   && (L.dias + " días de alquiler"),
      L.detalle
    ].filter(Boolean);
    const n = L.cantidad || 1;
    // Un solo número cuando hay un solo número; el rango sólo cuando de
    // verdad hay piso y techo distintos.
    const precio = (min, max) =>
      min == null ? null
      : min === max ? colones(min)
      : colones(min) + " – " + colones(max);
    return {
      nombre: L.nombre || etiqueta(L.servicio, null, "servicio"),
      detalle: detalles.join(" · ") || null,
      // Un servicio escrito a mano nunca lleva el "incluye…": sería
      // prometer una succión en un trabajo que no es ese.
      incluye: L.servicio === "otro" ? null : (INCLUYE_SERVICIO[L.servicio] || null),
      cantidad: n,
      // El unitario de las cotizaciones viejas no se guardó: se deduce
      // del total, que con cantidad 1 es el mismo número.
      unitario: precio(L.unitMin != null ? L.unitMin : L.min,
                       L.unitMax != null ? L.unitMax : L.max),
      min: L.min, max: L.max,
      monto: precio(L.min, L.max)
    };
  });
}

function baseDelCalculo(f) {
  const filas = [];
  // Sin texto explicativo (se pidió quitarlo). "Otro (escribir)" no se
  // muestra como "__otro": lo escrito a mano ya va en la fila "Detalle".
  const poner = (campo, valor) => {
    if (!valor || valor === "__otro" || valor === "otro") return;
    filas.push({ campo, valor, porque: "" });
  };

  poner("Forma del tanque", f.forma  && etiqueta(f.servicio, f.forma, "forma"),   PORQUE.forma);
  poner("Tamaño",           f.medida && etiqueta(f.servicio, f.medida, "medida"), PORQUE.medida);
  poner("Último servicio",  f.ultimo && etiqueta(f.servicio, f.ultimo, "ultimo"), PORQUE.antiguedad);
  poner("Días de alquiler", f.dias   && (f.dias + " días"),                       PORQUE.dias);

  // Cotizaciones viejas, emitidas con la estructura anterior.
  poner("Propiedad", f.perfil && etiqueta(f.servicio, f.perfil, "perfil"), PORQUE.perfil);
  poner("Acceso",    f.acceso && etiqueta(f.servicio, f.acceso, "acceso"), PORQUE.acceso);

  // Lo escrito a mano va de primero: es lo más específico que hay.
  if (f.detalle_libre) filas.unshift({ campo: "Detalle", valor: f.detalle_libre, porque: "" });

  poner("Zona", etiqueta(null, f.zona, "zona"), PORQUE.zona);
  return filas;
}

/* Suma días a una fecha "AAAA-MM-DD" sin arrastrar la hora local. */
function sumarDias(iso, dias) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/* Las opciones que muestra el chat. Salen de la misma tabla que el
   cálculo, así que no pueden desincronizarse. */
/* El precio, y nada más.

   La barra del cotizador muestra el monto desde la primera respuesta y lo
   va actualizando (§45.3). Para eso hace falta calcular antes de que la
   persona dé su nombre, y la otra opción —mandar la tabla de precios al
   navegador— dejaría los recargos por distrito legibles en el inspector.

   Entonces: este endpoint calcula y devuelve el número. No guarda nada, no
   pide datos personales, no manda correos, no gasta un número de
   cotización. Es la calculadora sola. */
async function precioEnVivo(request, env) {
  let d;
  try { d = await request.json(); }
  catch (e) { return json({ ok: false, error: "Formato inválido" }, 400); }

  const provincia = texto(d.provincia, 40);
  const canton = texto(d.canton, 60);
  const distrito = texto(d.distrito, 80);

  /* La dirección sólo se valida si viene entera. A media respuesta se
     calcula igual, sin recargo: la barra tiene que mostrar algo desde la
     primera pregunta, no esperar a que se escoja el distrito. */
  if (provincia && canton && distrito) {
    if (!direccionValida(provincia, canton, distrito)) {
      return json({ ok: false, error: "Esa dirección no existe" }, 400);
    }
    const cob = coberturaDe(provincia, canton, distrito);
    if (!cob.cubierto) {
      return json({ ok: true, fueraDeTabla: true, motivo: cob.motivo, min: null });
    }
  }

  const calculo = calcularCotizacion({
    servicio: texto(d.servicio, 40),
    forma: texto(d.forma, 40),
    medida: texto(d.medida, 40),
    antiguedad: texto(d.antiguedad, 20),
    dias: d.dias,
    provincia, canton, distrito
  });
  if (!calculo) return json({ ok: true, min: null });

  const conIVA = d.factura === "iva";
  const iva = conIVA ? Math.round(calculo.max * TARIFAS.iva.tasa) : 0;

  return json({
    ok: true,
    min: calculo.min,
    max: calculo.max,
    desde: calculo.desde,
    // Si todavía no se escogió distrito, el monto puede subir por la zona.
    conZona: !!(provincia && canton && distrito),
    avisoAntiguedad: calculo.avisoAntiguedad || null,
    factura: conIVA ? "iva" : "no",
    ivaTasa: TARIFAS.iva.tasa,
    ivaMonto: iva,
    totalConIVA: conIVA ? calculo.max + iva : null
  });
}

function opcionesCotizacion() {
  const servicios = {};
  for (const [id, s] of Object.entries(TARIFAS.servicios)) {
    const o = { nombre: s.nombre };
    if (s.formas) {
      // Tanque séptico: forma, después medida, después hace cuánto.
      o.tipo = "tanque";
      o.formas = Object.entries(s.formas).map(([k, f]) => ({
        id: k, etiqueta: f.etiqueta,
        medidas: Object.entries(f.medidas).map(([mk, m]) => ({ id: mk, etiqueta: m.etiqueta }))
      }));
      o.antiguedad = Object.entries(TARIFAS.antiguedad)
        .map(([k, a]) => ({ id: k, etiqueta: a.etiqueta, aviso: a.aviso || null }));
    } else if (s.porDia) {
      o.tipo = "alquiler";
      o.porDia = s.porDia;
      o.diasMinimo = s.diasMinimo;
    } else {
      // Precio de tabla: no hay nada que preguntar sobre el trabajo.
      o.tipo = "fijo";
    }
    servicios[id] = o;
  }
  return json({
    ok: true,
    provisional: TARIFAS.provisional,
    servicios: servicios,
    /* La lista de lugares viaja aparte, en /api/geografia: son ~490
       distritos, no cambia nunca y así el navegador la guarda. */
    geografia: "/api/geografia"
  });
}

/* =============================================================
   4. Asistente de preguntas (Gemini, capa gratuita de Google)
   ============================================================= */

// Todo lo que el asistente sabe. Si contesta algo que no está acá,
// está inventando — por eso las reglas son estrictas.
const CONOCIMIENTO_ASISTENTE = `Eres Víctor, el asistente virtual del sitio web de Sanitarios Ticos (Grupo Ticos Sanitarios S.A.), una empresa costarricense de limpieza de tanques sépticos y manejo de aguas residuales.

TU PERSONALIDAD: sos costarricense de pura cepa, cercano y con buen humor, pero sin dejar de ser útil ni profesional — la gente te escribe porque tiene un problema real con su tanque, así que primero ayudás y después bromeás. Hablás de "usted" (nunca de "vos" ni de "tú").

CÓMO HABLAR "TICO" SIN QUE SUENE FORZADO:
- Usá modismos costarricenses sólo cuando encajen natural en la frase, nunca metidos con calzador. Está bien una respuesta sin ningún modismo si no viene al caso.
- Elegí SÓLO de esta lista, y como mucho uno por respuesta: "pura vida", "diay", "al chile", "tuanis", "con toda la pata", "qué buena nota", "deme un toque", "con gusto". No inventes ni uses otras expresiones ticas que no estén en esta lista — muchas palabras que suenan "costarricenses" en realidad no se usan en el país, o se prestan a mal entendido.
- Nunca uses "despiche" ni ninguna palabra que se pueda confundir con una grosería o sonar mal educada, aunque sea de uso común en la calle. Ante la duda, no la uses — mejor quedarse corto de tico que ofender a alguien.
- Cuidado con el vocabulario en general (no sólo modismos): no uses palabras que no sean de uso común en Costa Rica, aunque existan en español — si una palabra suena "de otro país" o rebuscada, cambiala por una más sencilla y de uso diario acá.

BROMAS: podés bromear o hacer un chiste corto únicamente cuando la conversación se sale del tema de la empresa (alguien pregunta algo ajeno, o bromea primero), y siempre con la intención de traer la charla de vuelta a los tanques sépticos y los servicios. No bromees dentro de una respuesta que sí es sobre el negocio — ahí la prioridad es resolver la duda, con claridad y buen trato, no hacer reír.

Si alguien le pregunta su nombre, dice que se llama Víctor.

SERVICIOS QUE OFRECE LA EMPRESA:
1. Limpieza de tanques sépticos — con camión cisterna y sistema de succión.
2. Limpieza y destaqueo de tuberías — con sonda eléctrica, para tubería fina o gruesa.
3. Limpieza de trampas de grasa y diesel — para restaurantes, sodas, talleres.
4. Construcción de tanques sépticos, drenajes y plantas de tratamiento.
5. Alquiler de tanques plásticos: para la RECOLECCIÓN DE AGUAS RESIDUALES en construcciones y eventos. Incluye el servicio de entrega y las limpiezas del tanque calendarizadas. Eso es todo lo que se sabe de este servicio: no invente usos, tamaños ni capacidades.

COBERTURA: es un negocio que va donde el cliente; no hay local ni sala de espera y NUNCA invite a nadie a visitar una oficina. La zona de trabajo diaria es el GRAN ÁREA METROPOLITANA: San José, Heredia y Alajuela con sus cantones cercanos al centro. Ahí llegan rápido y en emergencia el mismo día. Fuera de esa zona (Cartago, Guanacaste, Puntarenas, Limón, Zona Norte, Zona Sur) también dan servicio, coordinando la fecha según la ruta del camión. Los camiones son TRES cisternas propias. No diga que tienen sedes ni sucursales.

CONTACTO: teléfonos 2440-1110 y 2265-4150, WhatsApp 8341-7547, correo info@sanitariosticos.com. Atienden emergencias el mismo día.

PREGUNTAS FRECUENTES QUE YA RESPONDE EL SITIO:
- Frecuencia recomendada: cada 2-3 años en casas; más seguido en negocios con mucho movimiento.
- Señales de tanque lleno: malos olores, inodoros que se devuelven, desagües lentos, zonas húmedas sobre el drenaje.
- Qué no echar al tanque: toallas húmedas, pañales, aceite de cocina, pintura, solventes.
- La cotización es siempre gratuita y sin compromiso.
- SI LA PERSONA NO SABE QUÉ TIENE ni de dónde viene el problema: pídale una foto por WhatsApp al 8341-7547. Con eso se le orienta y, si hace falta ir a verlo, se coordina ahí mismo. NO hable de costos de visita ni invente montos: eso lo resuelve el encargado por WhatsApp.
- El cotizador de la web da un estimado automático; el precio oficial lo da el encargado antes de empezar el trabajo. Esto no es temporal ni un "período de prueba": así funciona siempre.

REGLAS QUE DEBES SEGUIR SIEMPRE:
- NUNCA use la raya larga (—) ni el guion largo para separar frases. Use coma, dos puntos, punto o paréntesis, como escribe una persona. La raya larga delata que el texto lo escribió una máquina.
- Responde en español de Costa Rica, de "usted", en tono amable y directo. Respuestas cortas (2-4 oraciones), no hagas listas larguísimas.
- NO insista en mandar a WhatsApp o a llamar en cada respuesta: eso suena a vendedor pesado, no a alguien que de verdad está ayudando. Conteste la pregunta con naturalidad y sólo mencione el teléfono, el WhatsApp o el formulario cuando de verdad haga falta: en una emergencia, o cuando la persona ya está lista para agendar. El resto de las veces, simplemente responda la duda y, si acaso, pregunte si necesita algo más — no cierre cada mensaje con la misma muletilla.
- NUNCA escriba usted un precio en colones ni un rango de precio, ni siquiera aproximado, ni aunque se lo pidan de frente o le insistan. Usted no conoce las tarifas y no las puede calcular.
- Hay dos caminos para cotizar y los dos sirven: el cotizador de la página (botón "Cotizar en línea", también en /cotizar) y usted mismo aquí en el chat. Si la persona prefiere llenarlo por su cuenta, mándela a /cotizar sin problema.
- Cuando alguien pida una cotización, pregunte por precios, o pregunte cuánto sale algo, usted NO contesta con cifras: arranca el cotizador. Para arrancarlo, escriba al final de su respuesta, en una línea aparte, exactamente esto: [[COTIZAR]]
- Esa marca no es visible para la persona; lo que ella ve es sólo su respuesta. Antes de la marca, explique brevemente y con naturalidad qué va a pasar: que necesita unos datos para armarle la cotización formal, que son preguntas cortas, y que al final le queda el documento con su número. Dos o tres frases, no más. Ejemplo: "Con gusto le armo la cotización. Ocupo unos datos suyos y de la propiedad para dejarla formal; son preguntas cortitas y al final le queda el documento con su número. Vamos: [[COTIZAR]]"
- Use la marca [[COTIZAR]] SÓLO cuando la persona quiere cotizar. Si nada más está preguntando qué servicios hay o si llegan a su zona, conteste normal, sin la marca.
- El cotizador NO le pide metros cúbicos ni litros de memoria: le pregunta la FORMA del tanque (redondo de cemento, hueco de tierra, plástico, cuadrado de block) y la medida aproximada, que se ve desde el patio; después hace cuánto se limpió, la provincia, el cantón y el distrito escogiéndolos de una lista, y por último el nombre, la cédula, el teléfono y el correo para emitir el documento. Si alguien se preocupa por no saber el tamaño exacto, tranquilícelo: basta con la forma y una medida aproximada. La cédula y el correo se pueden dejar en blanco.
- Los montos del cotizador son la BASE: el IVA (13%) se suma aparte. Si alguien pregunta, dígalo así de simple, en una frase. NUNCA explique a quién se le cobra el IVA y a quién no, ni mencione la factura electrónica: eso lo resuelve el encargado hablando con el cliente.
- El resultado del cotizador es un estimado automático, no un precio cerrado: el precio oficial lo da el encargado antes de empezar, gratis y sin compromiso. Dígalo así, como algo normal del negocio (en sitio pueden aparecer cosas que un formulario no ve), nunca como si el cotizador estuviera "en pruebas" o los precios fueran provisionales.
- NUNCA inventes datos que no estén arriba: no inventes certificaciones, promociones, plazos exactos de llegada ni disponibilidad de camiones en tiempo real.
- Si es una emergencia (derrame, tanque rebalsado ahora mismo), recomiende llamar directo al 2440-1110 en vez de seguir escribiendo.
- Si preguntan algo que no tiene nada que ver con la empresa (temas ajenos, otras marcas, cultura general, etc.), NO responda esa pregunta aunque sepa la respuesta. Puede seguirle la broma con un comentario corto y de buen humor, pero sin contestar realmente lo que preguntaron, y siempre cerrando la respuesta con el regreso al tema: los servicios de la empresa.
- No es una persona real: si preguntan, aclare que es un asistente virtual (Víctor es un nombre, no significa que sea un empleado de carne y hueso).`;

// Se intenta primero el modelo más liviano; si falla, el siguiente.
const MODELOS_GEMINI = ["gemini-3.5-flash-lite", "gemini-3.6-flash"];

async function llamarGemini(env, mensajes) {
  let ultimoError = null;
  for (const modelo of MODELOS_GEMINI) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: CONOCIMIENTO_ASISTENTE }] },
            contents: mensajes,
            generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
            ]
          })
        }
      );
      if (!res.ok) { ultimoError = await res.text(); continue; }
      const datos = await res.json();
      const respuesta = datos.candidates && datos.candidates[0] && datos.candidates[0].content
        && datos.candidates[0].content.parts && datos.candidates[0].content.parts[0]
        && datos.candidates[0].content.parts[0].text;
      if (respuesta) return respuesta.trim();
      ultimoError = "Respuesta vacía de " + modelo;
    } catch (e) {
      ultimoError = e;
    }
  }
  console.error("Gemini falló con todos los modelos:", ultimoError);
  return null;
}

// Tope diario simple: protege la cuota gratuita de un uso descontrolado.
// No es por visitante (no distingue direcciones IP), es un tope global
// de toda la conversación del sitio en el día.
const TOPE_MENSAJES_DIA = 300;

async function usoDelDiaYSumar(env) {
  const hoy = new Date().toISOString().slice(0, 10);
  try {
    await env.DB.prepare(
      `INSERT INTO uso_ia (fecha, mensajes) VALUES (?1, 1)
       ON CONFLICT(fecha) DO UPDATE SET mensajes = mensajes + 1`
    ).bind(hoy).run();
    const fila = await env.DB.prepare(`SELECT mensajes FROM uso_ia WHERE fecha = ?1`).bind(hoy).first();
    return fila ? fila.mensajes : 1;
  } catch (e) {
    console.error("Error al contar uso del asistente:", e);
    return 0; // si falla el conteo, se deja pasar antes que romper el chat
  }
}

async function responderAsistente(request, env) {
  if (!env.GEMINI_API_KEY) {
    return json({ ok: true, reply: "Víctor todavía está en configuración, pura vida igual: mientras tanto escríbanos por WhatsApp o llame al 2440-1110 — le respondemos enseguida." });
  }

  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch (e) {
    return json({ ok: false, error: "Formato inválido" }, 400);
  }

  const mensaje = texto(cuerpo.message, 500);
  if (!mensaje) return json({ ok: false, error: "Falta el mensaje" }, 400);

  const usados = await usoDelDiaYSumar(env);
  if (usados > TOPE_MENSAJES_DIA) {
    return json({ ok: true, reply: "Diay, hoy Víctor ha tenido tela que cortar y está descansando un toque. Escríbanos por WhatsApp o llame al 2440-1110, ahí sí le atendemos al toque." });
  }

  // Historial corto: sólo los últimos mensajes, para no mandar de más.
  const historialCrudo = Array.isArray(cuerpo.history) ? cuerpo.history.slice(-6) : [];
  const mensajes = historialCrudo
    .filter((h) => h && (h.role === "user" || h.role === "model") && h.text)
    .map((h) => ({ role: h.role, parts: [{ text: texto(h.text, 500) }] }));
  mensajes.push({ role: "user", parts: [{ text: mensaje }] });

  const respuesta = await llamarGemini(env, mensajes);
  if (!respuesta) {
    return json({ ok: true, reply: "Uy, Víctor no pudo responder justo ahora. Puede escribirnos por WhatsApp o llamar al 2440-1110, con gusto le ayudamos." });
  }

  return json({ ok: true, reply: respuesta });
}

/* =============================================================
   Entrada
   ============================================================= */

/* =============================================================
   Direcciones viejas del sitio de Wix
   -------------------------------------------------------------
   El sitio que vivía en sanitariosticos.com tenía quince páginas,
   diez de ellas de zona ("limpieza de tanques sépticos Heredia",
   etc.). Google todavía las tiene indexadas. Si el dominio pasa a
   apuntar acá y esas direcciones dan 404, se pierde de un solo golpe
   el posicionamiento que la empresa ya tenía.

   Un 301 le dice a Google "esto se mudó aquí" y traslada parte del
   valor a la página nueva. Parte, no todo: mandar diez páginas de
   zona a una sola de servicios pierde la especificidad por la que
   rankeaban. La solución de verdad es rehacer las páginas de zona
   —el "perímetro" que quedó pendiente—; mientras tanto, esto evita
   el 404, que es lo peor de los dos males.

   Las direcciones vienen cortadas a 34 caracteres porque así las
   generaba Wix. No son errores de copia.
   ============================================================= */
const REDIRECCIONES_WIX = {
  // Zona por zona: cada una cae en la página nueva de su misma zona, que
  // es lo que hace que Google traslade el valor en vez de perderlo.
  "/limpieza-de-tanques-septicos-heredi": "/limpieza-de-tanques-septicos-heredia",
  "/limpieza-de-tanques-septicos-alajue": "/limpieza-de-tanques-septicos-alajuela",
  "/limpieza-de-tanques-septicos-san-jo": "/limpieza-de-tanques-septicos-san-jose",
  // "san-joa" es San Joaquín de Flores, que es Heredia.
  "/tanques-septicos-y-drenajes-san-joa": "/limpieza-de-tanques-septicos-heredia",

  "/limpieza-de-tuberias-san-joaquin-de": "/destaqueo-de-tuberias",
  "/destaqueo-de-tuberias-san-joaquin-f": "/destaqueo-de-tuberias",
  "/limpieza-de-trampas-de-grasa-san-jo": "/limpieza-de-trampas-de-grasa",

  "/construccion-de-drenajes-san-joaqui": "/construccion-de-tanques-septicos-y-drenajes",
  "/construccion-de-plantas-de-tratamie": "/construccion-de-tanques-septicos-y-drenajes",
  "/construccion-de-tanques-septicos-sa": "/construccion-de-tanques-septicos-y-drenajes",

  "/aprende-mas-sanitarios-ticos": "/nosotros",
  "/blog": "/"
};


/* =============================================================
   AVISOS AL TELÉFONO

   El panel no avisaba: había que entrar a mirar. Esto le toca la
   puerta al teléfono cuando entra una solicitud o cuando hay
   mantenimientos del día.

   El aviso viaja VACÍO, a propósito. Mandar contenido dentro de una
   notificación web obliga a cifrarlo (ECDH + HKDF + AES-GCM) contra la
   clave de cada aparato, que es mucho código delicado para ganar poco;
   y además ese contenido pasa por los servidores de Google o Apple. Acá
   sólo se toca la puerta, y el propio teléfono va a buscar los números
   al panel con la clave que ya tiene guardada. Menos código, y ningún
   dato del negocio sale de nuestro servidor.

   La clave pública va escrita acá porque es pública —el navegador la
   necesita para suscribirse—. La privada vive en Cloudflare como Secret.
   ============================================================= */
const VAPID_PUBLICA =
  "BKMDOH2dzFyPRe8jfSeB7_RfwSIc7ECL1ljm37GWxhnoyvvXarysNqqeYsR25ED32o6YuhH2eA11OHWukZhf2ag";
const VAPID_SUJETO = "mailto:info@sanitariosticos.com";

function b64uABytes(s) {
  const base = String(s).replace(/-/g, "+").replace(/_/g, "/");
  const crudo = atob(base + "=".repeat((4 - base.length % 4) % 4));
  const salida = new Uint8Array(crudo.length);
  for (let i = 0; i < crudo.length; i++) salida[i] = crudo.charCodeAt(i);
  return salida;
}

function bytesAB64u(b) {
  let s = "";
  const u = new Uint8Array(b);
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* La clave privada se arma con la `d` secreta y con la x/y que ya vienen
   dentro de la pública: los 65 bytes de la pública son 0x04 seguido de
   las dos mitades. Así el secreto que hay que guardar es uno solo. */
async function clavePrivadaVapid(env) {
  const pub = b64uABytes(VAPID_PUBLICA);
  return crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC", crv: "P-256", ext: true,
      d: env.VAPID_PRIVADA,
      x: bytesAB64u(pub.slice(1, 33)),
      y: bytesAB64u(pub.slice(33, 65))
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

/* El pase que le prueba al servicio de empuje —Google, Apple, Mozilla—
   que el aviso lo manda quien dice. Dura doce horas. */
async function jwtVapid(destino, env) {
  const cod = (o) => bytesAB64u(new TextEncoder().encode(JSON.stringify(o)));
  const cabeza = cod({ typ: "JWT", alg: "ES256" });
  const cuerpo = cod({
    aud: destino,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: VAPID_SUJETO
  });
  const firma = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    await clavePrivadaVapid(env),
    new TextEncoder().encode(cabeza + "." + cuerpo)
  );
  return cabeza + "." + cuerpo + "." + bytesAB64u(firma);
}

/* Toca la puerta de un aparato. Devuelve el código que contestó el
   servicio de empuje: 404 y 410 quieren decir "ese aparato ya no
   existe", y entonces se borra de la tabla. */
async function empujar(endpoint, env) {
  try {
    const jwt = await jwtVapid(new URL(endpoint).origin, env);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "TTL": "86400",
        "Authorization": "vapid t=" + jwt + ", k=" + VAPID_PUBLICA,
        "Content-Length": "0"
      }
    });
    return res.status;
  } catch (e) {
    console.error("No se pudo empujar el aviso:", e);
    return 0;
  }
}

/* Le avisa a todos los aparatos registrados. Se llama sin esperar: que
   un aviso no salga nunca puede detener lo que estaba pasando. */
async function avisarAlPanel(env) {
  if (!env.VAPID_PRIVADA) return;
  let filas;
  try {
    filas = (await env.DB.prepare(`SELECT id, endpoint FROM avisos`).all()).results || [];
  } catch (e) {
    // La tabla puede no existir todavía; no es motivo para romper nada.
    return;
  }

  for (const f of filas) {
    const codigo = await empujar(f.endpoint, env);
    if (codigo === 404 || codigo === 410) {
      await env.DB.prepare(`DELETE FROM avisos WHERE id = ?`).bind(f.id).run().catch(() => {});
    }
  }
}

async function avisosPanel(request, env) {
  if (!claveValida(request, env)) return json({ ok: false, error: "Clave incorrecta" }, 401);

  if (request.method === "GET") {
    const endpoint = new URL(request.url).searchParams.get("endpoint") || "";
    let activo = false;
    if (endpoint) {
      const f = await env.DB.prepare(`SELECT id FROM avisos WHERE endpoint = ?`)
        .bind(endpoint).first().catch(() => null);
      activo = !!f;
    }
    return json({ ok: true, publica: VAPID_PUBLICA, activo, listo: !!env.VAPID_PRIVADA });
  }

  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch (e) {
    return json({ ok: false, error: "Formato inválido" }, 400);
  }

  const endpoint = texto(cuerpo.endpoint, 600);
  if (!endpoint) return json({ ok: false, error: "Falta la dirección del aparato" }, 400);

  try {
    if (cuerpo.baja) {
      await env.DB.prepare(`DELETE FROM avisos WHERE endpoint = ?`).bind(endpoint).run();
      return json({ ok: true, activo: false });
    }
    await env.DB.prepare(
      `INSERT INTO avisos (endpoint, p256dh, auth, agente) VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(endpoint) DO UPDATE SET
         p256dh = excluded.p256dh, auth = excluded.auth,
         agente = excluded.agente, fallo = NULL`
    ).bind(
      endpoint, texto(cuerpo.p256dh, 200) || null, texto(cuerpo.auth, 100) || null,
      texto(cuerpo.agente, 200) || null
    ).run();
    return json({ ok: true, activo: true });
  } catch (e) {
    console.error("No se pudo guardar el aviso:", e);
    return json({ ok: false, error: "No se pudo guardar" }, 500);
  }
}

/* =============================================================
   LO QUE CORRE SOLO CADA DÍA

   Dos cosas: mandarle el recordatorio por correo a quien le toca, y
   tocarle la puerta al teléfono del encargado con lo del día.

   Por CORREO y no por WhatsApp: mandar un WhatsApp solo necesita la API
   de empresa de Meta —cuenta verificada, plantillas aprobadas y cobro
   por mensaje—. Los de WhatsApp se siguen mandando a mano desde la
   Agenda, que es un toque. Este proceso no los toca ni los marca.
   ============================================================= */
async function tareaDiaria(env) {
  const hoy = new Date(Date.now() - 6 * 3600 * 1000).toISOString().slice(0, 10);

  let vencen = [];
  try {
    /* Sólo el último trabajo de cada cliente, sólo si el recordatorio
       está prendido, y sólo si todavía no se le escribió por este.
       `recordado` es lo que evita escribirle todos los días desde que le
       toca hasta que por fin hace el trabajo. */
    vencen = (await env.DB.prepare(
      `SELECT m.id, so.fecha AS fecha, m.tipo AS servicio, m.fecha AS proximo,
              c.id AS cliente_id, c.nombre, c.correo, c.canton, c.canal
         FROM mantenimientos m
         JOIN clientes c ON c.id = m.cliente_id
         LEFT JOIN servicios so ON so.id = m.servicio_id
        WHERE m.estado = 'programado' AND m.papelera IS NULL AND m.fecha <= ?1
          AND m.recordado IS NULL
          AND c.recordatorio = 1 AND c.papelera IS NULL`
    ).bind(hoy).all()).results || [];
  } catch (e) {
    console.error("No se pudo leer la agenda del día:", e);
  }

  let enviados = 0;
  for (const f of vencen) {
    const porCorreo = (f.canal === "correo" || f.canal === "ambos") && f.correo;
    if (!porCorreo) continue;
    const ok = await correoRecordatorio(f, env);
    if (!ok) continue;
    enviados++;
    await env.DB.prepare(`UPDATE mantenimientos SET recordado = ?1 WHERE id = ?2`)
      .bind(hoy, f.id).run().catch(() => {});
  }

  // Un solo toque de puerta, con todo lo del día junto.
  if (vencen.length) await avisarAlPanel(env);
  console.log("Tarea diaria:", vencen.length, "vencen,", enviados, "correos");
}

async function correoRecordatorio(f, env) {
  if (!env.RESEND_API_KEY || !f.correo) return false;
  const texto0 = mensajeRecordatorio(f);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.RESEND_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Sanitarios Ticos <avisos@sanitariosticoscr.com>",
        to: [f.correo],
        subject: "Le toca el mantenimiento, Sanitarios Ticos",
        html: `<div style="font-family:sans-serif;font-size:15px;color:#1b1917;line-height:1.6;">
          <p>${escaparHtml(texto0)}</p>
          <p style="margin-top:1.2rem;">
            <b>${escaparHtml(EMPRESA.nombre)}</b><br>
            ${EMPRESA.telefonos.map(escaparHtml).join(" / ")} ·
            WhatsApp ${escaparHtml(EMPRESA.whatsapp)}
          </p>
        </div>`
      })
    });
    if (!res.ok) {
      console.error("Resend respondió", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("No se pudo mandar el recordatorio:", e);
    return false;
  }
}

export default {
  /* Lo dispara Cloudflare con el horario que está en wrangler.jsonc. No
     hay nadie esperando la respuesta, así que todo lo que falle queda en
     el registro y no se le avisa a nadie. */
  async scheduled(evento, env, ctx) {
    ctx.waitUntil(tareaDiaria(env));
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    /* Lo primero de todo: las direcciones que vienen del sitio viejo.
       Se compara en minúsculas y sin la barra final, que es como llegan
       desde Google y desde los enlaces que otros sitios ya publicaron. */
    const vieja = url.pathname.toLowerCase().replace(/\/+$/, "") || "/";
    if (Object.prototype.hasOwnProperty.call(REDIRECCIONES_WIX, vieja)) {
      return Response.redirect(url.origin + REDIRECCIONES_WIX[vieja], 301);
    }

    /* Quién viene. Para el visitante del sitio no cuesta nada (no trae
       vale y se resuelve sin tocar nada); para el panel se revisa la
       firma una sola vez y de ahí en adelante todas las rutas ya saben
       quién es. */
    await identificar(request, env);

    if (url.pathname === "/api/solicitud" && request.method === "POST") {
      return guardarSolicitud(request, env, ctx);
    }

    /* Cómo se entra hoy. El panel lo pregunta al arrancar: si Access
       está puesto no tiene que pedir contraseña, porque ya la pidió
       Cloudflare antes de dejar pasar la página. */
    if (url.pathname === "/api/panel/sesion" && request.method === "GET") {
      const porAccess = !!(env.ACCESS_TEAM && env.ACCESS_AUD);
      const correo = VALE.get(request) || null;
      // ?diag=1 dice por qué no se verificó, sin tener que leer registros.
      if (url.searchParams.get("diag") === "1") {
        const revisado = porAccess ? await revisarValeAccess(request, env) : { correo: null, motivo: "sin-configurar" };
        return json({ ok: true, modo: revisado.correo ? "access" : "clave", correo: revisado.correo, diagnostico: revisado });
      }
      /* Sin vale verificable se contesta "clave": el panel pide la
         contraseña, que es molesto pero funciona. Antes contestaba un
         error y el panel quedaba abierto sin poder traer un solo dato. */
      return json({ ok: true, modo: correo ? "access" : "clave", correo: correo || null,
        // Para que "Salir" cierre también la sesión de Access, no sólo la
        // copia local de la clave.
        salir: correo ? salidaDeAccess(url, env) : null });
    }

    /* La puerta del panel, antes de cualquiera de sus rutas. Acá y no en
       cada endpoint: una ruta nueva que se olvide de pedir la clave
       queda igual de cerrada que las demás. */
    if (url.pathname.startsWith("/api/panel/")) {
      const corte = await revisarPuerta(request, env, ctx);
      if (corte) return corte;
    }
    if (url.pathname === "/api/panel/solicitudes" && request.method === "GET") {
      return listaPanel(request, env);
    }
    if (url.pathname === "/api/panel/csv" && request.method === "GET") {
      return descargarCsv(request, env);
    }
    if (url.pathname === "/api/panel/resumen" && request.method === "GET") {
      return resumenPanel(request, env);
    }
    if (url.pathname === "/api/panel/estado" && request.method === "POST") {
      return cambiarEstado(request, env);
    }
    if (url.pathname === "/api/panel/clientes" && request.method === "GET") {
      return listaClientes(request, env);
    }
    if (url.pathname === "/api/panel/cliente" && request.method === "GET") {
      return verCliente(request, env);
    }
    if (url.pathname === "/api/panel/avisos" &&
        (request.method === "GET" || request.method === "POST")) {
      return avisosPanel(request, env);
    }
    /* Emitir el certificado o el tiquete de un trabajo ya hecho. */
    if (url.pathname === "/api/panel/documento" && request.method === "POST") {
      return emitirDocumento(request, env);
    }
    if (url.pathname === "/api/panel/trabajo" && request.method === "POST") {
      return trabajoAMano(request, env);
    }
    if (url.pathname === "/api/panel/cliente" && request.method === "POST") {
      return editarCliente(request, env);
    }
    if (url.pathname === "/api/panel/cliente/nuevo" && request.method === "POST") {
      return crearCliente(request, env);
    }
    if (url.pathname === "/api/panel/agenda" && request.method === "GET") {
      return agendaPanel(request, env);
    }
    if (url.pathname === "/api/panel/cita" && request.method === "POST") {
      return guardarCita(request, env);
    }
    if (url.pathname === "/api/panel/cita/estado" && request.method === "POST") {
      return estadoCita(request, env);
    }
    if (url.pathname === "/api/panel/mantenimiento" && request.method === "POST") {
      return guardarMantenimiento(request, env);
    }
    if (url.pathname === "/api/panel/mantenimiento/futuro" && request.method === "GET") {
      return mantenimientoFuturo(request, env);
    }
    if (url.pathname === "/api/panel/pago" && request.method === "POST") {
      return crearPago(request, env);
    }
    if (url.pathname === "/api/panel/pago/borrar" && request.method === "POST") {
      return borrarPago(request, env);
    }
    if (url.pathname === "/api/panel/mantenimientos" && request.method === "GET") {
      return listaMantenimientos(request, env);
    }
    if (url.pathname === "/api/panel/servicio/editar" && request.method === "POST") {
      return editarServicio(request, env);
    }
    if (url.pathname === "/api/panel/servicios" && request.method === "GET") {
      return listaServicios(request, env);
    }
    if (url.pathname === "/api/panel/borrar" && request.method === "POST") {
      return papeleraAccion(request, env, "borrar");
    }
    if (url.pathname === "/api/panel/restaurar" && request.method === "POST") {
      return papeleraAccion(request, env, "restaurar");
    }
    if (url.pathname === "/api/panel/eliminar" && request.method === "POST") {
      return papeleraAccion(request, env, "eliminar");
    }
    if (url.pathname === "/api/panel/papelera" && request.method === "GET") {
      return papeleraLista(request, env);
    }
    if (url.pathname === "/api/panel/dependencias" && request.method === "GET") {
      return dependenciasRegistro(request, env);
    }
    if (url.pathname === "/api/panel/buscar" && request.method === "GET") {
      return buscarPanel(request, env);
    }
    if (url.pathname === "/api/asistente" && request.method === "POST") {
      return responderAsistente(request, env);
    }
    // Las opciones de la cotización salen de la misma tabla que el
    // cálculo, para que el chat nunca ofrezca algo que el motor no sepa
    // cobrar.
    /* La calculadora sola: devuelve el monto y nada más. La usa la barra
       del cotizador para mostrar el precio mientras se contesta. */
    if (url.pathname === "/api/cotizar/precio" && request.method === "POST") {
      return precioEnVivo(request, env);
    }
    if (url.pathname === "/api/cotizar/opciones" && request.method === "GET") {
      return opcionesCotizacion();
    }
    /* La lista de provincias, cantones y distritos. No lleva nada
       privado y no cambia nunca, así que se deja guardar en el
       navegador por un día: son ~490 distritos y no tiene sentido
       pedirlos otra vez en cada visita. */
    if (url.pathname === "/api/geografia" && request.method === "GET") {
      /* Junto con la lista va QUÉ distritos tienen precio automático,
         para que el cotizador lo pueda decir apenas se escoge el
         distrito y no después de llenar todo el formulario.

         Van sólo los nombres, NUNCA los montos: cuánto se cobra por
         llegar a cada lado es cuenta de la empresa. */
      const cubiertos = {};
      Object.keys(RECARGOS).forEach((prov) => {
        cubiertos[prov] = {};
        Object.keys(RECARGOS[prov]).forEach((cant) => {
          cubiertos[prov][cant] = Object.keys(RECARGOS[prov][cant]);
        });
      });
      return new Response(JSON.stringify({ ok: true, geografia: GEOGRAFIA, cubiertos }), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=86400"
        }
      });
    }

    // El documento imprimible pide sus datos acá. No lleva clave de
    // panel: lo abre el cliente, y lo que lo protege es la llave.
    /* El certificado o el tiquete ya emitido. Público por enlace con
       llave, como la cotización: el cliente lo abre sin entrar al panel. */
    if (url.pathname === "/api/documento" && request.method === "GET") {
      return verDocumento(request, env);
    }
    if (url.pathname === "/api/cotizacion" && request.method === "GET") {
      return verCotizacion(request, env);
    }
    if (url.pathname === "/api/cotizar" && request.method === "POST") {
      return cotizar(request, env, ctx);
    }

    // Cualquier otra dirección: se sirve como una página normal del sitio.
    return env.ASSETS.fetch(request);
  }
};
