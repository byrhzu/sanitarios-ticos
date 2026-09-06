import { GEOGRAFIA } from "./lib/geografia-cr.js";
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

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

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
    await env.DB.prepare(
      `INSERT INTO solicitudes (nombre, telefono, servicio, zona, detalle, pagina,
                                cedula, correo, provincia, canton, distrito)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`
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
    from: "Sanitarios Ticos <onboarding@resend.dev>",
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
function claveValida(request, env) {
  if (!env.CLAVE_PANEL) return false;
  const recibida = request.headers.get("X-Clave") || new URL(request.url).searchParams.get("clave") || "";
  return recibida.length > 0 && recibida === env.CLAVE_PANEL;
}

/* Las dos tablas que el panel muestra. Se declaran acá y no en cada
   endpoint para que el nombre de la tabla nunca salga de la URL: lo
   que llega de afuera sólo sirve para escoger de esta lista, así que
   no hay forma de inyectar SQL por el nombre. */
const ORIGENES = { beto: "Beto", panel: "Panel", formulario: "Formulario" };

const TABLAS_PANEL = {
  solicitudes: {
    columnas: `id, datetime(creado, '-6 hours') AS creado, nombre, telefono,
               servicio, zona, detalle, pagina, cedula, correo`,
    csv: {
      archivo: "solicitudes",
      encabezado: ["Fecha (Costa Rica)", "Nombre", "Cédula", "Teléfono", "Correo",
                   "Servicio", "Zona", "Detalle", "Página"],
      fila: (f) => [f.creado, f.nombre, f.cedula || "", f.telefono, f.correo || "",
                    f.servicio, f.zona, f.detalle || "", f.pagina || ""]
    },
    // Lo que ve el panel en pantalla. Sale de la misma fuente que el CSV
    // para que nunca digan cosas distintas; lo que cambia es el formato,
    // porque en pantalla se lee y en el CSV se suma.
    vista: {
      encabezado: ["Fecha", "Nombre", "Teléfono", "Correo", "Servicio", "Zona", "Detalle", "Página"],
      ancha: 6,
      fila: (f) => [f.creado, f.nombre, f.telefono, f.correo || "—", f.servicio,
                    f.zona, f.detalle || "—", f.pagina || "—"]
    }
  },
  cotizaciones: {
    columnas: `id, numero, datetime(creado, '-6 hours') AS creado, servicio, perfil,
               ultimo, acceso, zona, monto_min, monto_max, provisional,
               origen, nombre, telefono, cedula, correo, provincia, canton, distrito,
               llave`,
    csv: {
      archivo: "cotizaciones",
      encabezado: ["Número", "Fecha (Costa Rica)", "Servicio", "Mínimo", "Máximo",
                   "Propiedad", "Último servicio", "Acceso",
                   "Provincia", "Cantón", "Distrito", "Cobro de zona",
                   "Precios provisionales", "Origen",
                   "Nombre", "Cédula", "Teléfono", "Correo"],
      fila: (f) => [
        f.numero || "", f.creado, etiqueta(f.servicio, null, "servicio"),
        f.monto_min, f.monto_max,
        etiqueta(f.servicio, f.perfil, "perfil"), etiqueta(f.servicio, f.ultimo, "ultimo"),
        etiqueta(f.servicio, f.acceso, "acceso"),
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
      encabezado: ["Número", "Fecha", "Rango", "Cliente", "Servicio", "Propiedad",
                   "Último servicio", "Acceso", "Zona", "Origen"],
      ancha: 5,
      fila: (f) => [
        f.numero || "—",
        f.creado,
        colones(f.monto_min) + " – " + colones(f.monto_max),
        f.nombre || "—",
        etiqueta(f.servicio, null, "servicio"),
        etiqueta(f.servicio, f.perfil, "perfil"),
        etiqueta(f.servicio, f.ultimo, "ultimo"),
        etiqueta(f.servicio, f.acceso, "acceso"),
        zonaTexto(f.provincia, f.canton, f.distrito) || etiqueta(null, f.zona, "zona"),
        ORIGENES[f.origen] || "Beto"
      ]
    }
  }
};

function tablaPedida(url) {
  const pedida = url.searchParams.get("tabla");
  return Object.prototype.hasOwnProperty.call(TABLAS_PANEL, pedida) ? pedida : "solicitudes";
}

// Arma el SQL de la consulta con el rango de fechas opcional.
// Las fechas se comparan en hora de Costa Rica (UTC-6), que es la
// única zona horaria del negocio, para que "hoy" signifique lo mismo
// en el panel que en el reloj del que lo está mirando.
function construirConsulta(url) {
  const desde = soloFecha(url.searchParams.get("desde"));
  const hasta = soloFecha(url.searchParams.get("hasta"));
  const tabla = tablaPedida(url);

  let sql = `SELECT ${TABLAS_PANEL[tabla].columnas} FROM ${tabla}`;
  const condiciones = [];
  const valores = [];

  if (desde) { condiciones.push(`date(creado, '-6 hours') >= ?`); valores.push(desde); }
  if (hasta) { condiciones.push(`date(creado, '-6 hours') <= ?`); valores.push(hasta); }
  if (condiciones.length) sql += ` WHERE ` + condiciones.join(" AND ");
  sql += ` ORDER BY creado DESC`;

  return { sql, valores, desde, hasta, tabla };
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
      // Un aviso arriba de la tabla vale más que una marca en cada
      // fila: mientras las tarifas sean las provisionales, lo son todas.
      hayProvisionales: results.some((f) => f.provisional),
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
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`
    }
  });
}

/* =============================================================
   3. Motor de cotizaciones
   =============================================================

   POR QUÉ ESTO NO LO CALCULA BETO
   --------------------------------
   Beto conversa y recoge los datos; el precio lo saca este código.
   Un modelo de lenguaje haciendo cuentas se equivoca tarde o temprano,
   y una cotización equivocada la paga la empresa: o come la diferencia
   o queda como que hizo carnada. Acá la aritmética siempre da igual, y
   cambiar un precio es editar la tabla de abajo, no reescribir a Beto.

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
//
// Mientras `provisional` sea true, cada cotización sale marcada como
// estimación y `tools/modo-publicacion.py` se niega a pasar el sitio a
// producción. Es a propósito: cotizar de verdad con precios inventados
// es peor que no cotizar.
const TARIFAS = {
  provisional: true,

  // null = sin confirmar. El propietario tiene que decir si sus precios
  // ya llevan el IVA adentro o si se suma aparte.
  iva: { incluido: null, tasa: 0.13 },

  vigenciaDias: 15,

  // Recargo por salir del GAM. El camión igual sale; lo que
  // cambia es el tiempo de ruta.
  zona: { valle: 1, resto: 1.25 },

  servicios: {
    "tanques-septicos": {
      nombre: "Limpieza de tanque séptico",
      // Por debajo de esto no vale la pena sacar la cisterna.
      minimo: 40000,
      // El perfil sustituye a la pregunta "¿de qué tamaño es su tanque?"
      perfil: {
        "casa-pequena":   { etiqueta: "Casa de 1 a 4 personas",           rango: [45000, 60000] },
        "casa-mediana":   { etiqueta: "Casa de 5 a 8 personas",           rango: [60000, 85000] },
        "casa-grande":    { etiqueta: "Casa de 9 personas o más",         rango: [85000, 115000] },
        "negocio-pequeno":{ etiqueta: "Soda, oficina o local pequeño",    rango: [70000, 100000] },
        "negocio-grande": { etiqueta: "Restaurante, hotel o escuela",     rango: [110000, 165000] },
        "industria":      { etiqueta: "Industria o condominio",           rango: [160000, 260000] }
      },
      // Más años sin limpiar = más lodo compactado = más trabajo.
      ultimo: {
        "menos2": { etiqueta: "Hace menos de 2 años", monto: 0 },
        "2a4":    { etiqueta: "Entre 2 y 4 años",     monto: 8000 },
        "mas5":   { etiqueta: "Hace 5 años o más",    monto: 18000 },
        "nose":   { etiqueta: "Nunca, o no sé",       monto: 12000 }
      },
      // Metros de manguera desde donde puede parquear el camión.
      acceso: {
        "directo": { etiqueta: "El camión llega al tanque",  monto: 0 },
        "corta":   { etiqueta: "Hasta 30 metros de manguera", monto: 9000 },
        "larga":   { etiqueta: "Más de 30 metros",            monto: 22000 }
      }
    },

    "trampas-grasa": {
      nombre: "Limpieza de trampa de grasa",
      minimo: 30000,
      perfil: {
        "negocio-pequeno":{ etiqueta: "Soda o cafetería",              rango: [30000, 45000] },
        "negocio-grande": { etiqueta: "Restaurante",                   rango: [45000, 75000] },
        "industria":      { etiqueta: "Comedor industrial o cadena",   rango: [75000, 130000] }
      },
      ultimo: {
        "menos2": { etiqueta: "Con mantenimiento al día",  monto: 0 },
        "2a4":    { etiqueta: "Hace varios meses",         monto: 7000 },
        "mas5":   { etiqueta: "Hace más de un año",        monto: 16000 },
        "nose":   { etiqueta: "Nunca, o no sé",            monto: 10000 }
      },
      acceso: {
        "directo": { etiqueta: "El camión llega a la trampa", monto: 0 },
        "corta":   { etiqueta: "Hasta 30 metros de manguera", monto: 8000 },
        "larga":   { etiqueta: "Más de 30 metros",            monto: 18000 }
      }
    },

    "destaqueo": {
      nombre: "Destaqueo de tubería con sonda eléctrica",
      // El destaqueo NO lleva cisterna: va la sonda, que es otro equipo
      // y otro costo de movilizar. Su mínimo es mucho más bajo.
      minimo: 20000,
      perfil: {
        "casa-pequena":   { etiqueta: "Tubería fina — baño o cocina",     rango: [22000, 35000] },
        "casa-mediana":   { etiqueta: "Varias salidas de la casa",        rango: [32000, 50000] },
        "negocio-grande": { etiqueta: "Colector principal o bajante",     rango: [50000, 85000] },
        "industria":      { etiqueta: "Red de edificio o condominio",     rango: [85000, 150000] }
      },
      ultimo: {
        "menos2": { etiqueta: "Se tapa de vez en cuando", monto: 0 },
        "2a4":    { etiqueta: "Se tapa seguido",          monto: 6000 },
        "mas5":   { etiqueta: "Está tapado del todo",     monto: 14000 },
        "nose":   { etiqueta: "No sé",                    monto: 6000 }
      },
      acceso: {
        "directo": { etiqueta: "El registro está a la vista",  monto: 0 },
        "corta":   { etiqueta: "Hay que buscar el registro",   monto: 7000 },
        "larga":   { etiqueta: "No se sabe dónde está",        monto: 15000 }
      }
    }
  }
};

// ₡ con punto de miles, como se escribe en Costa Rica.
// toLocaleString("es-CR") separa con espacio, que acá no se usa.
function colones(n) {
  return "₡" + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/* Calcula el rango. Devuelve `null` si algún dato no corresponde a las
   opciones conocidas — nunca adivina, porque un precio adivinado es
   exactamente lo que estamos tratando de evitar. */
/* Traduce los códigos guardados ("casa-mediana") al texto que lee una
   persona ("Casa de 5 a 8 personas"). La base guarda el código y no la
   etiqueta a propósito: si mañana se reescribe el texto de una opción,
   las cotizaciones viejas se leen con la redacción nueva en vez de
   quedar congeladas con la vieja. Si el código ya no existe en la
   tabla, se muestra tal cual en vez de un vacío — así se nota. */
const ZONAS = { valle: "Dentro del GAM y alrededores", resto: "Fuera del GAM" };

function etiqueta(servicio, codigo, campo) {
  if (campo === "zona") return ZONAS[codigo] || codigo || "";
  const svc = TARIFAS.servicios[servicio];
  if (!svc) return codigo || "";
  if (campo === "servicio") return svc.nombre;
  const opcion = svc[campo] && svc[campo][codigo];
  return opcion ? opcion.etiqueta : (codigo || "");
}

function calcularCotizacion(entrada) {
  const svc = TARIFAS.servicios[entrada.servicio];
  if (!svc) return null;

  const perfil = svc.perfil[entrada.perfil];
  const ultimo = svc.ultimo[entrada.ultimo];
  const acceso = svc.acceso[entrada.acceso];
  const factorZona = TARIFAS.zona[entrada.zona];
  if (!perfil || !ultimo || !acceso || !factorZona) return null;

  const extras = ultimo.monto + acceso.monto;
  let min = (perfil.rango[0] + extras) * factorZona;
  let max = (perfil.rango[1] + extras) * factorZona;

  // Si el mínimo del servicio levanta el piso, el techo sube lo mismo.
  // Aplastar el techo contra el piso daría rangos tipo "de ₡40.000 a
  // ₡40.000", que se leen como precio cerrado y no como estimación.
  const alza = Math.max(0, (svc.minimo || 0) - min);
  min += alza;
  max += alza;

  // Se redondea a miles: un rango con cifras exactas aparenta una
  // precisión que una estimación no tiene.
  const aMiles = (v) => Math.round(v / 1000) * 1000;

  const desglose = [
    { concepto: perfil.etiqueta, monto: null },
    { concepto: ultimo.etiqueta, monto: ultimo.monto },
    { concepto: acceso.etiqueta, monto: acceso.monto }
  ];
  if (factorZona !== 1) {
    desglose.push({
      concepto: "Fuera del GAM (ruta más larga)",
      monto: null,
      factor: factorZona
    });
  }

  return {
    servicio: entrada.servicio,
    servicioNombre: svc.nombre,
    min: aMiles(min),
    max: aMiles(max),
    desglose: desglose,
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
  razonSocial: "Grupo Ticos Sanitarios S.A.",
  cedula: null,           // ⚠ PENDIENTE: cédula jurídica del propietario
  telefonos: ["2440-1110", "2265-4150"],
  whatsapp: "8341-7547",
  correo: "info@sanitariosticos.com",
  sitio: "sanitariosticos.com",
  sedes: "Alajuela · Heredia · San José"
};

/* Qué mueve cada respuesta. Va debajo del dato en el documento, para que
   el cliente entienda de dónde sale el rango en vez de tener que creerlo. */
const PORQUE = {
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
    ["Rango", colones(datos.min) + " – " + colones(datos.max)],
    ["Nombre", datos.nombre || "—"],
    ["Teléfono", datos.telefono || "—"],
    ["Zona", ZONAS[datos.zona] || datos.zona],
    ["Origen", datos.origen === "panel" ? "Panel interno" : "Chat de Beto"]
  ].map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#7d736a;">${k}</td><td style="padding:4px 0;"><b>${escaparHtml(String(v))}</b></td></tr>`).join("");

  const aviso = datos.provisional
    ? `<p style="margin:16px 0 0;padding:10px 12px;background:#fbeee5;color:#b34c0d;font-size:13px;">
         <b>Ojo:</b> esta cotización salió con los precios provisionales.
         No son los precios reales de la empresa.</p>`
    : "";

  const cuerpoCorreo = {
    from: "Sanitarios Ticos <onboarding@resend.dev>",
    to: [env.CORREO_AVISO],
    subject: `Cotización ${datos.numero} — ${colones(datos.min)} a ${colones(datos.max)}`,
    html: `<div style="font-family:system-ui,sans-serif;color:#1b1917;">
             <h2 style="margin:0 0 12px;font-size:18px;">Beto emitió una cotización</h2>
             <table style="border-collapse:collapse;font-size:14px;">${filas}</table>
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

  const provincia = texto(cuerpo.provincia, 40);
  const canton = texto(cuerpo.canton, 60);
  const distrito = texto(cuerpo.distrito, 80);

  if (!direccionValida(provincia, canton, distrito)) {
    return json({ ok: false, error: "Esa dirección no existe en la lista de Costa Rica" }, 400);
  }

  const entrada = {
    servicio: texto(cuerpo.servicio, 40),
    perfil: texto(cuerpo.perfil, 40),
    ultimo: texto(cuerpo.ultimo, 40),
    acceso: texto(cuerpo.acceso, 40),
    // La zona no se pregunta: sale del cantón, que la persona ya dio.
    zona: zonaDeProvincia(provincia)
  };

  const calculo = calcularCotizacion(entrada);
  if (!calculo) {
    return json({ ok: false, error: "Datos incompletos o no reconocidos" }, 400);
  }

  const persona = limpiarDatosPersona(cuerpo, ["nombre", "telefono"]);
  if (persona.error) return json({ ok: false, error: persona.error }, 400);
  const { nombre, telefono, cedula, correo } = persona.datos;
  const origen = ["panel", "formulario"].indexOf(cuerpo.origen) !== -1 ? cuerpo.origen : "beto";

  let numero = null;
  let enlace = null;
  const llave = nuevaLlave();
  try {
    const res = await env.DB.prepare(
      `INSERT INTO cotizaciones
         (servicio, perfil, ultimo, acceso, zona, monto_min, monto_max,
          provisional, origen, nombre, telefono, llave,
          cedula, correo, provincia, canton, distrito)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12,
               ?13, ?14, ?15, ?16, ?17)`
    ).bind(
      entrada.servicio, entrada.perfil, entrada.ultimo, entrada.acceso, entrada.zona,
      calculo.min, calculo.max, calculo.provisional ? 1 : 0, origen, nombre, telefono, llave,
      cedula, correo, provincia, canton, distrito
    ).run();

    const id = res.meta && res.meta.last_row_id;
    if (id) {
      numero = numeroCotizacion(id);
      await env.DB.prepare(`UPDATE cotizaciones SET numero = ?1 WHERE id = ?2`)
        .bind(numero, id).run();
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

  const salida = Object.assign({ ok: true, numero: numero, enlace: enlace }, calculo);

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
async function verCotizacion(request, env) {
  const url = new URL(request.url);
  const numero = texto(url.searchParams.get("n"), 30);
  const llave = texto(url.searchParams.get("k"), 40);
  if (!numero || !llave) return json({ ok: false, error: "Faltan datos" }, 400);

  let f;
  try {
    f = await env.DB.prepare(
      `SELECT numero, datetime(creado, '-6 hours') AS creado, servicio, perfil,
              ultimo, acceso, zona, monto_min, monto_max, provisional, nombre, telefono,
              cedula, correo, provincia, canton, distrito
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
    servicio: etiqueta(f.servicio, null, "servicio"),
    min: f.monto_min,
    max: f.monto_max,
    minTexto: colones(f.monto_min),
    maxTexto: colones(f.monto_max),
    provisional: !!f.provisional,
    ivaIncluido: TARIFAS.iva.incluido,
    cliente: {
      nombre: f.nombre || null,
      cedula: f.cedula || null,
      telefono: f.telefono || null,
      correo: f.correo || null,
      zonaTexto: zonaTexto(f.provincia, f.canton, f.distrito)
    },
    // Las cuatro respuestas con las que se calculó, cada una con lo que
    // mueve. Es el reemplazo honesto de las líneas de una factura: no
    // tenemos artículos, tenemos motivos.
    base: [
      { campo: "Propiedad",       valor: etiqueta(f.servicio, f.perfil, "perfil"), porque: PORQUE.perfil },
      { campo: "Último servicio", valor: etiqueta(f.servicio, f.ultimo, "ultimo"), porque: PORQUE.ultimo },
      { campo: "Acceso",          valor: etiqueta(f.servicio, f.acceso, "acceso"), porque: PORQUE.acceso },
      { campo: "Zona",            valor: etiqueta(null, f.zona, "zona"),           porque: PORQUE.zona }
    ]
  });
}

/* Suma días a una fecha "AAAA-MM-DD" sin arrastrar la hora local. */
function sumarDias(iso, dias) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/* Las opciones que muestra el chat. Salen de la misma tabla que el
   cálculo, así que no pueden desincronizarse. */
function opcionesCotizacion() {
  const servicios = {};
  for (const [id, s] of Object.entries(TARIFAS.servicios)) {
    servicios[id] = {
      nombre: s.nombre,
      perfil: Object.entries(s.perfil).map(([k, v]) => ({ id: k, etiqueta: v.etiqueta })),
      ultimo: Object.entries(s.ultimo).map(([k, v]) => ({ id: k, etiqueta: v.etiqueta })),
      acceso: Object.entries(s.acceso).map(([k, v]) => ({ id: k, etiqueta: v.etiqueta }))
    };
  }
  return json({
    ok: true,
    provisional: TARIFAS.provisional,
    servicios: servicios,
    // La zona ya no es una pregunta: se deduce del cantón. La lista de
    // lugares viaja aparte, en /api/geografia, porque es grande y no
    // cambia nunca — así el navegador la guarda y no la vuelve a pedir.
    geografia: "/api/geografia"
  });
}

/* =============================================================
   4. Asistente de preguntas (Gemini, capa gratuita de Google)
   ============================================================= */

// Todo lo que el asistente sabe. Si contesta algo que no está acá,
// está inventando — por eso las reglas son estrictas.
const CONOCIMIENTO_ASISTENTE = `Eres Beto, el asistente virtual del sitio web de Sanitarios Ticos (Grupo Ticos Sanitarios S.A.), una empresa costarricense de limpieza de tanques sépticos y manejo de aguas residuales.

TU PERSONALIDAD: sos costarricense de pura cepa, cercano y con buen humor, pero sin dejar de ser útil ni profesional — la gente te escribe porque tiene un problema real con su tanque, así que primero ayudás y después bromeás. Hablás de "usted" (nunca de "vos" ni de "tú").

CÓMO HABLAR "TICO" SIN QUE SUENE FORZADO:
- Usá modismos costarricenses sólo cuando encajen natural en la frase, nunca metidos con calzador. Está bien una respuesta sin ningún modismo si no viene al caso.
- Elegí SÓLO de esta lista, y como mucho uno por respuesta: "pura vida", "diay", "al chile", "tuanis", "con toda la pata", "qué buena nota", "deme un toque", "con gusto". No inventes ni uses otras expresiones ticas que no estén en esta lista — muchas palabras que suenan "costarricenses" en realidad no se usan en el país, o se prestan a mal entendido.
- Nunca uses "despiche" ni ninguna palabra que se pueda confundir con una grosería o sonar mal educada, aunque sea de uso común en la calle. Ante la duda, no la uses — mejor quedarse corto de tico que ofender a alguien.
- Cuidado con el vocabulario en general (no sólo modismos): no uses palabras que no sean de uso común en Costa Rica, aunque existan en español — si una palabra suena "de otro país" o rebuscada, cambiala por una más sencilla y de uso diario acá.

BROMAS: podés bromear o hacer un chiste corto únicamente cuando la conversación se sale del tema de la empresa (alguien pregunta algo ajeno, o bromea primero), y siempre con la intención de traer la charla de vuelta a los tanques sépticos y los servicios. No bromees dentro de una respuesta que sí es sobre el negocio — ahí la prioridad es resolver la duda, con claridad y buen trato, no hacer reír.

Si alguien le pregunta su nombre, dice que se llama Beto.

SERVICIOS QUE OFRECE LA EMPRESA:
1. Limpieza de tanques sépticos — con camión cisterna y sistema de succión.
2. Limpieza y destaqueo de tuberías — con sonda eléctrica, para tubería fina o gruesa.
3. Limpieza de trampas de grasa y diesel — para restaurantes, sodas, talleres.
4. Construcción de tanques sépticos, drenajes y plantas de tratamiento.
5. Alquiler de tanques plásticos — para construcciones y eventos, con entrega y limpiezas calendarizadas.

COBERTURA: sedes en Alajuela, Heredia (San Joaquín de Flores) y San José. Dan servicio en TODO Costa Rica (Guanacaste, Puntarenas, Limón, Cartago, Zona Norte, Zona Sur), coordinando la visita según la ruta.

CONTACTO: teléfonos 2440-1110 y 2265-4150, WhatsApp 8341-7547, correo info@sanitariosticos.com. Atienden emergencias el mismo día.

PREGUNTAS FRECUENTES QUE YA RESPONDE EL SITIO:
- Frecuencia recomendada: cada 2-3 años en casas; más seguido en negocios con mucho movimiento.
- Señales de tanque lleno: malos olores, inodoros que se devuelven, desagües lentos, zonas húmedas sobre el drenaje.
- Qué no echar al tanque: toallas húmedas, pañales, aceite de cocina, pintura, solventes.
- La cotización es siempre gratuita y sin compromiso; se da el precio antes de salir a hacer el trabajo.

REGLAS QUE DEBES SEGUIR SIEMPRE:
- Responde en español de Costa Rica, de "usted", en tono amable y directo. Respuestas cortas (2-4 oraciones), no hagas listas larguísimas.
- NO insista en mandar a WhatsApp o a llamar en cada respuesta: eso suena a vendedor pesado, no a alguien que de verdad está ayudando. Conteste la pregunta con naturalidad y sólo mencione el teléfono, el WhatsApp o el formulario cuando de verdad haga falta: en una emergencia, o cuando la persona ya está lista para agendar. El resto de las veces, simplemente responda la duda y, si acaso, pregunte si necesita algo más — no cierre cada mensaje con la misma muletilla.
- NUNCA escriba usted un precio en colones ni un rango de precio, ni siquiera aproximado, ni aunque se lo pidan de frente o le insistan. Usted no conoce las tarifas y no las puede calcular.
- Cuando alguien pida una cotización, pregunte por precios, o pregunte cuánto sale algo, usted NO contesta con cifras: arranca el cotizador. Para arrancarlo, escriba al final de su respuesta, en una línea aparte, exactamente esto: [[COTIZAR]]
- Esa marca no es visible para la persona; lo que ella ve es sólo su respuesta. Antes de la marca, explique brevemente y con naturalidad qué va a pasar: que necesita unos datos para armarle la cotización formal, que son preguntas cortas, y que al final le queda el documento con su número. Dos o tres frases, no más. Ejemplo: "Con gusto le armo la cotización. Ocupo unos datos suyos y de la propiedad para dejarla formal; son preguntas cortitas y al final le queda el documento con su número. Vamos: [[COTIZAR]]"
- Use la marca [[COTIZAR]] SÓLO cuando la persona quiere cotizar. Si nada más está preguntando qué servicios hay o si llegan a su zona, conteste normal, sin la marca.
- El cotizador NO le pide el tamaño del tanque (casi nadie lo sabe): pregunta el tipo de propiedad, hace cuánto se limpió, qué tan cerca llega el camión, y después la provincia, el cantón y el distrito escogiéndolos de una lista, y por último el nombre, la cédula, el teléfono y el correo para emitir el documento. Si alguien se preocupa por no saber el tamaño, tranquilícelo con eso. La cédula y el correo se pueden dejar en blanco.
- El resultado del cotizador es un rango estimado, no un precio cerrado: el precio en firme lo confirma la empresa antes de salir, siempre gratis y sin compromiso.
- NUNCA inventes datos que no estén arriba: no inventes certificaciones, promociones, plazos exactos de llegada ni disponibilidad de camiones en tiempo real.
- Si es una emergencia (derrame, tanque rebalsado ahora mismo), recomiende llamar directo al 2440-1110 en vez de seguir escribiendo.
- Si preguntan algo que no tiene nada que ver con la empresa (temas ajenos, otras marcas, cultura general, etc.), NO responda esa pregunta aunque sepa la respuesta. Puede seguirle la broma con un comentario corto y de buen humor, pero sin contestar realmente lo que preguntaron, y siempre cerrando la respuesta con el regreso al tema: los servicios de la empresa.
- No es una persona real: si preguntan, aclare que es un asistente virtual (Beto es un nombre, no significa que sea un empleado de carne y hueso).`;

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
    return json({ ok: true, reply: "Beto todavía está en configuración, pura vida igual: mientras tanto escríbanos por WhatsApp o llame al 2440-1110 — le respondemos enseguida." });
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
    return json({ ok: true, reply: "Diay, hoy Beto ha tenido tela que cortar y está descansando un toque. Escríbanos por WhatsApp o llame al 2440-1110, ahí sí le atendemos al toque." });
  }

  // Historial corto: sólo los últimos mensajes, para no mandar de más.
  const historialCrudo = Array.isArray(cuerpo.history) ? cuerpo.history.slice(-6) : [];
  const mensajes = historialCrudo
    .filter((h) => h && (h.role === "user" || h.role === "model") && h.text)
    .map((h) => ({ role: h.role, parts: [{ text: texto(h.text, 500) }] }));
  mensajes.push({ role: "user", parts: [{ text: mensaje }] });

  const respuesta = await llamarGemini(env, mensajes);
  if (!respuesta) {
    return json({ ok: true, reply: "Uy, Beto no pudo responder justo ahora. Puede escribirnos por WhatsApp o llamar al 2440-1110, con gusto le ayudamos." });
  }

  return json({ ok: true, reply: respuesta });
}

/* =============================================================
   Entrada
   ============================================================= */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/solicitud" && request.method === "POST") {
      return guardarSolicitud(request, env, ctx);
    }
    if (url.pathname === "/api/panel/solicitudes" && request.method === "GET") {
      return listaPanel(request, env);
    }
    if (url.pathname === "/api/panel/csv" && request.method === "GET") {
      return descargarCsv(request, env);
    }
    if (url.pathname === "/api/asistente" && request.method === "POST") {
      return responderAsistente(request, env);
    }
    // Las opciones de la cotización salen de la misma tabla que el
    // cálculo, para que el chat nunca ofrezca algo que el motor no sepa
    // cobrar.
    if (url.pathname === "/api/cotizar/opciones" && request.method === "GET") {
      return opcionesCotizacion();
    }
    /* La lista de provincias, cantones y distritos. No lleva nada
       privado y no cambia nunca, así que se deja guardar en el
       navegador por un día: son ~490 distritos y no tiene sentido
       pedirlos otra vez en cada visita. */
    if (url.pathname === "/api/geografia" && request.method === "GET") {
      return new Response(JSON.stringify({ ok: true, geografia: GEOGRAFIA }), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=86400"
        }
      });
    }

    // El documento imprimible pide sus datos acá. No lleva clave de
    // panel: lo abre el cliente, y lo que lo protege es la llave.
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
