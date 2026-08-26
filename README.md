# Sanitarios Ticos — sitio web

Sitio estático (HTML + CSS + JavaScript, sin compilación) para **Grupo Ticos Sanitarios S.A.**
Se sube tal cual a cualquier hosting: basta con copiar el contenido de esta carpeta
dentro de `public_html`.

## Páginas

| Archivo | Qué contiene |
|---|---|
| `index.html` | Portada: presentación, índice de los cinco servicios, cobertura nacional, fotos reales y señales de alerta |
| `servicios.html` | Cada servicio en detalle, con su propia ancla (`#tanques-septicos`, `#destaqueo`, `#trampas`, `#construccion`, `#alquiler`) |
| `nosotros.html` | La empresa, por qué elegirnos, cómo trabajamos y cobertura |
| `contacto.html` | Datos directos, formulario de cotización y preguntas frecuentes |
| `privacidad.html` | Política de privacidad (Ley 8968), enlazada desde el pie de página y desde el formulario |

## Archivos

```
styles.css          → todo el diseño
main.js             → menú, animaciones, acordeón, mapa y formulario
lib/manifest.js     → teléfonos, correo y redes en un solo lugar
tools/              → herramientas de trabajo; NO hace falta subirlas
assets/img/         → logo y fotos, todo en formato WebP
assets/favicon.svg  → icono de la pestaña del navegador
assets/fotos-originales/ → originales sin comprimir; NO hace falta subirlas
_headers            → caché y seguridad en Cloudflare Pages
.htaccess           → lo mismo, para servidores Apache (Cloudflare lo ignora)
robots.txt, sitemap.xml → para Google
.claude/            → sólo para desarrollo, no hace falta subirlo
```

## Identidad

El diseño parte del logo de la empresa:

- **Naranja de marca** `#ef6511` — se usa como acento: botones, números, subrayados
  y la franja móvil. Nunca como fondo de una sección entera, para que no cargue la vista.
- **Papel cálido** `#faf7f2` — el fondo del 80 % del sitio.
- **Pizarra** `#1f2c33` — las secciones oscuras (cobertura, proceso, pie de página).
- **Tipografías**: Bricolage Grotesque para títulos, Instrument Sans para el texto.

El logo aparece en la cabecera de todas las páginas (versión horizontal) y en el
pie (versión apilada). Los archivos están en `assets/img/logo-*.webp` y los
originales con transparencia en `assets/fotos-originales/`.

## Dónde se cambian los datos

Los teléfonos, el WhatsApp y el correo aparecen **en cada archivo `.html`**
(enlaces `tel:`, `wa.me` y `mailto:`) y también en `lib/manifest.js`, que es lo
que usa el formulario. Si cambia un número, hay que cambiarlo en los dos sitios.

Números actuales:

- Teléfonos: **2440-1110** y **2265-4150**
- WhatsApp: **8341-7547** (`50683417547` en los enlaces `wa.me`)
- Correo: **info@sanitariosticos.com**

## Cómo funciona el formulario

Cuando alguien llena el formulario y pulsa el botón, pasan tres cosas en orden:

1. Los datos se guardan en la base de datos (`worker.js`, función `guardarSolicitud`).
2. Se manda un correo de aviso (ver "Aviso por correo" más abajo).
3. Se abre WhatsApp con el mensaje ya armado, listo para pulsar enviar.

El guardado y el correo pasan **antes** de abrir WhatsApp, así el dato queda
aunque la persona no llegue a pulsar "enviar" allá. Si el guardado o el correo
fallan por cualquier motivo (sin internet, Cloudflare caído), WhatsApp se abre
igual — nunca se le traba el paso al cliente.

Debajo del botón también hay un enlace para mandar los mismos datos por correo,
como alternativa manual.

### La base de datos

Las solicitudes quedan en una base de datos D1 de Cloudflare llamada
`sanitarios-ticos-datos`, en una tabla `solicitudes`. El SQL para crearla está
en `tools/crear-tabla.sql` (se pega una sola vez en la pestaña **Console** de
esa base de datos, en el panel de Cloudflare).

### Aviso por correo

Cada solicitud guardada manda un correo usando [Resend](https://resend.com),
un servicio externo gratuito (no hay forma de mandar correos desde Cloudflare
sin uno). Necesita dos cosas configuradas como variables en Cloudflare:

- `RESEND_API_KEY` — la clave que da Resend al crear la cuenta. Se configura en
  **Settings → Variables and Secrets** del Worker, marcada como **Encrypt**
  (para que sea secreta, igual que una contraseña).
- `CORREO_AVISO` — a qué correo llega el aviso. Este NO es secreto, así que
  vive directamente en `wrangler.jsonc` — para cambiarlo, editar ese archivo y
  hacer `git push`, nada más.

**Importante:** mientras no se verifique un dominio propio en Resend, sólo se
puede mandar correo **a la misma dirección con la que se creó la cuenta de
Resend**. Por eso hay que registrarse ahí con `byrhu36@gmail.com` — si se usa
otro correo para la cuenta de Resend, los avisos van a fallar en silencio
(la solicitud igual queda guardada, sólo no llega el correo).

### Panel privado

En `/panel` (archivo `panel.html`) hay una página protegida con contraseña
donde se ven las solicitudes guardadas, se pueden filtrar por rango de fechas
y descargarse en CSV (se abre bien en Excel, con acentos y todo).

Necesita una variable más en Cloudflare:

- `CLAVE_PANEL` — la contraseña para entrar. También se configura como
  **Encrypt** en **Settings → Variables and Secrets**. Elegir algo largo y
  que no se use en ningún otro sitio.

La página no aparece en ningún menú ni buscador (lleva `noindex` y está
bloqueada en `robots.txt`), pero cualquiera que sepa la dirección puede
*abrirla* — lo que la protege de verdad es la contraseña, que nunca queda
escrita en el código. Es una protección simple, sin límite de intentos
fallidos todavía; para algo más robusto (bloqueo tras varios intentos) se
puede agregar más adelante.

## Aviso legal y privacidad

La página `privacidad.html` explica, en lenguaje sencillo, qué datos se
recopilan (formulario y chat), para qué se usan, con qué proveedores se
comparten (Cloudflare, Resend, Google Gemini) y los derechos que da la
Ley N.º 8968 de Costa Rica. Está enlazada en el pie de página de todo el
sitio y como link dentro del formulario de cotización.

El formulario de `contacto.html` tiene una casilla obligatoria de
consentimiento ("Acepto que Sanitarios Ticos use estos datos..."): sin
marcarla no se guarda la solicitud ni se abre WhatsApp. La burbuja del
asistente de chat también lleva una línea pequeña avisando que usa
inteligencia artificial, con enlace a la misma política.

Bases de datos de uso interno (no vendidas ni distribuidas a terceros)
como esta no requieren inscripción ante PRODHAB, pero sí este aviso previo
y el consentimiento antes de recopilar los datos — que es justamente lo
que se implementó.

## Asistente de preguntas

Pensado para ayudar a que la visita se convierta en cliente sin reemplazar
la cotización real.

### Asistente de chat

El asistente se llama **Beto** — burbuja "Hablar con Beto" (abajo a la
izquierda, en las 6 páginas del sitio, pero no en `/panel`). Responde
preguntas sobre servicios, cobertura y el proceso, usando
[Gemini](https://ai.google.dev) en su capa gratuita. Todo lo que sabe (y su
personalidad, jocosa y costarricense) está en `worker.js`, en la constante
`CONOCIMIENTO_ASISTENTE` — si responde algo raro o se pasa de gracioso, es
ahí donde se corrige, no en el código de la conversación. El saludo inicial
(antes de que escriba nada) está aparte, en `main.js`, función
`initAsistente` → `saludarSiHaceFalta`.

Reglas que sigue siempre: nunca da un precio en colones (no los tiene
cargados), nunca inventa datos que no estén en esa constante, y en una
emergencia recomienda llamar en vez de seguir escribiendo.

Necesita una variable más en Cloudflare:

- `GEMINI_API_KEY` — se consigue gratis en
  [Google AI Studio](https://aistudio.google.com/apikey) ("Create API key").
  Se configura en **Settings → Variables and Secrets**, marcada como
  **Encrypt**, igual que las otras claves.

Mientras esa clave no esté puesta, la burbuja igual aparece pero responde
"está en configuración" y manda a WhatsApp — nunca se rompe.

Hay un tope diario simple (300 mensajes) guardado en la tabla `uso_ia` de la
base de datos (SQL en `tools/crear-tabla-ia.sql`, se pega una vez en la
Console de D1). Protege la cuota gratuita de Google; no hay límite por
visitante todavía, sólo el tope general del día.


## Los mapas

Las páginas **Nosotros** y **Contacto** llevan un mapa de Google en la sección
«Dónde estamos». Es un `iframe` normal, **sin clave de API y sin costo**, y carga
sólo cuando el visitante llega a esa parte de la página.

Al lado hay tres tarjetas, una por sede. **Al pulsar una tarjeta el mapa cambia**
a esa ubicación y se actualizan la dirección y el botón «Abrir en Google Maps».
Funciona con el ratón y con el teclado; sin JavaScript se ve la primera sede y
cada tarjeta conserva su enlace «Cómo llegar».

Sedes configuradas:

| Sede | Ubicación en el mapa |
|---|---|
| Heredia | San Joaquín de Flores — 100 m sur del Restaurante Caracoles de Colores (`10.0057727, -84.1580225`) |
| Alajuela | Llano, Provincia de Alajuela (búsqueda por nombre) |
| San José | Tibás (`9.9557932, -84.0854432`) |

### Cambiar o afinar una ubicación

En `nosotros.html` y `contacto.html`, cada tarjeta es un `<article class="sede">`
con estos atributos:

- `data-embed` — la URL del mapa que se muestra
- `data-ruta` — el enlace de «Cómo llegar»
- `data-dir` y `data-ref` — el texto que aparece bajo el mapa

Para mover un pin a un punto exacto: abra Google Maps, clic derecho sobre el
lugar → copiar coordenadas, y sustituya los números en `data-embed`
(`?q=LAT,LNG&hl=es&z=16&output=embed`) y en `data-ruta`
(`?api=1&destination=LAT,LNG`). Hay que hacerlo en los dos archivos.

### Ver los tres pines a la vez

El mapa incrustado gratuito sólo admite **un pin**. Para mostrar los tres
simultáneamente, como hacía el sitio anterior, hay dos caminos:

1. **Google My Maps** (gratis, recomendado): crear un mapa en
   <https://mymaps.google.com>, poner los tres pines, hacerlo público y pegar
   aquí su enlace «Insertar en mi sitio».
2. **Maps JavaScript API**: requiere una clave de Google con facturación activa.

La franja final «Todo Costa Rica» es la que deja claro que la cobertura es
nacional; conviene no quitarla.

## Antes de publicar

1. **Revisar los cantones** de las secciones de cobertura y ajustarlos a la
   realidad de las rutas.
2. **Revisar las preguntas frecuentes**: las respuestas son correctas en general,
   pero conviene confirmar frecuencias y detalles con la empresa.
3. Si más adelante hay fotos nuevas (más trabajos, el equipo, las sedes), se
   agregan a `assets/img/` en WebP y se sustituyen en el HTML.
4. Si cambia algún archivo después de publicar, subir el número de versión en las
   páginas (`styles.css?v=…` y `main.js?v=…`) para que los navegadores descarguen
   la versión nueva.

## Cambiar un teléfono o el correo

Los datos de contacto están escritos dentro de cada página (así funcionan aunque
el JavaScript falle, y así los lee Google), lo que significa que aparecen en unos
30 lugares. Para no cambiarlos a mano hay una herramienta:

1. Abra `tools/actualizar-contacto.py` y escriba los valores nuevos en el bloque
   `DATOS`.
2. Ejecute, desde la carpeta del proyecto:

```bash
python3 tools/actualizar-contacto.py --revisar
```

Eso sólo informa de lo que haría. Si el resumen es correcto, ejecútelo otra vez
sin `--revisar` y aplica los cambios en todas las páginas de una sola pasada.

## Imágenes

Cada foto existe en tres tamaños (por ejemplo `cisterna-rotulada-480.webp`,
`-800.webp` y `cisterna-rotulada.webp`). El navegador escoge la que corresponde
al tamaño de la pantalla, de forma que un teléfono descarga unos 60 KB en vez de
140 KB. Si sustituye una foto, hay que generar también sus versiones pequeñas y
actualizar el atributo `srcset` de esa imagen.

## Publicar en Cloudflare

**Aviso:** cuando escribí esto por primera vez, hablaba de "Cloudflare Pages".
Al conectar el repositorio real, Cloudflare llevó a un flujo distinto llamado
**Workers** (con "static assets", que es su forma actual de publicar sitios
como este). Es lo mismo en la práctica —un sitio publicado gratis, conectado a
GitHub—, pero cambia algún nombre en el panel. Esta sección ya está actualizada
a eso.

El sitio se sube conectando el repositorio de GitHub en
**Workers & Pages → Create → Import a repository**. No hace falta indicar
ningún comando de compilación: las páginas ya están listas, sólo se publican
tal cual.

El proyecto lleva un archivo `wrangler.jsonc` en la raíz — es el papel de
instrucciones que le dice a Cloudflare qué carpeta publicar. Sin él, el botón
"Deploy" falla. Ya está incluido, no hay que crearlo.

Un archivo `.assetsignore` evita que `wrangler.jsonc`, `_headers`, `.htaccess`,
`.gitignore` y `README.md` se publiquen como si fueran páginas del sitio.

**No subir** (ya excluidos en `.gitignore`): `assets/fotos-originales/`,
`tools/` ni `.claude/`.

### La dirección donde queda publicado

Cloudflare da una dirección gratuita del tipo `sanitarios-ticos.<algo>.workers.dev`.
Sirve para revisar el sitio y para que el cliente lo apruebe antes de mover el
dominio real. Cuando el dominio definitivo esté listo, se conecta desde el
mismo panel del proyecto, en **Custom domains**.

### El "fondo" del sitio (worker.js)

`worker.js` es el programa que corre en los servidores de Cloudflare (nunca en
el navegador del visitante). Recibe el formulario, guarda en la base de datos,
manda el correo de aviso y atiende el panel privado. `wrangler.jsonc` le dice
a Cloudflare, con `"main": "worker.js"` y `"run_worker_first": ["/api/*"]`,
que sólo las direcciones que empiezan con `/api/` pasan por ese programa —
todo lo demás (las páginas, las fotos) se sigue sirviendo directo, como antes.

Las claves (`RESEND_API_KEY`, `CLAVE_PANEL`) se configuran en el panel de
Cloudflare, nunca en el código — ver "Aviso por correo" y "Panel privado"
más arriba.

## Ver el sitio en el computador

Doble clic en `index.html` funciona. Para verlo igual que en el servidor:

```bash
python3 -m http.server 4173
```

y abrir `http://localhost:4173`.
