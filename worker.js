/* =============================================================
   SANITARIOS TICOS — worker.js
   Este es el "fondo" del sitio: un programa que corre en los
   servidores de Cloudflare, no en el navegador del visitante.

   Hace sólo dos cosas:
   1. Si piden una página normal (index, servicios, la foto del
      camión, etc.) la sirve tal cual, como hasta ahora.
   2. Si el formulario manda datos a /api/solicitud, los guarda
      en la base de datos ANTES de que se abra WhatsApp.
   ============================================================= */

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

function json(datos, estado) {
  return new Response(JSON.stringify(datos), { status: estado || 200, headers: JSON_HEADERS });
}

// Recorta y limpia un texto: nunca guardamos más de lo razonable,
// para que nadie pueda mandar un archivo enorme disfrazado de nombre.
function texto(valor, maxLargo) {
  return String(valor == null ? "" : valor).trim().slice(0, maxLargo);
}

async function guardarSolicitud(request, env) {
  // Sólo aceptamos JSON enviado por nuestro propio formulario.
  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch (e) {
    return json({ ok: false, error: "Formato inválido" }, 400);
  }

  const nombre = texto(cuerpo.nombre, 200);
  const telefono = texto(cuerpo.telefono, 60);
  const servicio = texto(cuerpo.servicio, 200);
  const zona = texto(cuerpo.zona, 200);
  const detalle = texto(cuerpo.detalle, 2000);
  const pagina = texto(cuerpo.pagina, 300);

  // Los mismos cuatro campos que el formulario marca como obligatorios.
  if (!nombre || !telefono || !servicio || !zona) {
    return json({ ok: false, error: "Faltan datos obligatorios" }, 400);
  }

  try {
    await env.DB.prepare(
      `INSERT INTO solicitudes (nombre, telefono, servicio, zona, detalle, pagina)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
    ).bind(nombre, telefono, servicio, zona, detalle, pagina).run();
  } catch (e) {
    // No mostramos el error real al visitante, sólo lo registramos.
    console.error("Error al guardar en D1:", e);
    return json({ ok: false, error: "No se pudo guardar" }, 500);
  }

  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/solicitud" && request.method === "POST") {
      return guardarSolicitud(request, env);
    }

    // Cualquier otra dirección: se sirve como una página normal del sitio.
    return env.ASSETS.fetch(request);
  }
};
