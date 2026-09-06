# Sanitarios Ticos — sitio web

Sitio estático (HTML + CSS + JavaScript, sin compilación) para **Grupo Ticos Sanitarios S.A.**
Se sube tal cual a cualquier hosting: basta con copiar el contenido de esta carpeta
dentro de `public_html`.

## Páginas

| Archivo | Qué contiene |
|---|---|
| `index.html` | Portada: presentación, índice de los cinco servicios, la empresa, quiénes nos contratan, cobertura y cierre con el aviso de emergencia |
| `servicios.html` | Señales de que hay que llamar, y cada servicio en detalle con su propia ancla (`#tanques-septicos`, `#destaqueo`, `#trampas`, `#construccion`, `#alquiler`) |
| `nosotros.html` | La empresa, por qué elegirnos, cómo trabajamos, cobertura con mapa y la galería de fotos de campo |
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
- **Tipografía**: **Archivo** (Omnibus-Type), una sola familia variable. Los
  titulares usan el corte estrecho y pesado —el mismo lenguaje del logo y del
  rótulo del camión— y el texto el corte normal. El criterio completo está en
  `DIRECCION-DE-ARTE.md`.

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

En `/panel` (archivo `panel.html`) hay una página protegida con contraseña,
con dos pestañas:

- **Solicitudes** — lo que la gente manda por el formulario del sitio.
- **Cotizaciones** — cada estimado que emitió Beto, con el rango de precio y
  las respuestas con que se calculó. Mientras las tarifas sean las
  provisionales, aparece un aviso arriba de la tabla.

Las dos comparten el filtro por rango de fechas, la paginación (50 por
página) y el botón de descargar CSV, que se lleva la pestaña que se esté
viendo. El CSV sale con el rango de fechas completo, no sólo la página que
está a la vista, y se abre bien en Excel, con acentos y todo.

Necesita una variable más en Cloudflare:

- `CLAVE_PANEL` — la contraseña para entrar. Va en **Settings → Variables and
  Secrets**, con el tipo **Secret** (no *Text*). Elegir algo largo y que no se
  use en ningún otro sitio.

  Si la clave deja de funcionar después de un despliegue, casi siempre es que
  quedó guardada como *Text* en vez de *Secret*: los valores de tipo *Text* se
  reemplazan por lo que diga `wrangler.jsonc` en cada despliegue, y como ahí no
  está `CLAVE_PANEL`, desaparece. Los *Secret* sí sobreviven. La pantalla de
  entrada ahora distingue "clave incorrecta" de "el servidor falló", para no
  perder tiempo cambiando una contraseña que no era el problema.

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

## Cotizaciones

### Por qué Beto no calcula el precio

Beto conversa y recoge los datos; **el precio lo saca código normal**, en
`worker.js`, sección "Motor de cotizaciones". Un modelo de lenguaje haciendo
cuentas se equivoca tarde o temprano, y una cotización equivocada la paga la
empresa: o come la diferencia o queda como que hizo carnada.

Para el cliente se siente igual —"Beto me cotizó"— pero la aritmética siempre
da bien, y cambiar un precio es editar una tabla, no reescribir a Beto.

### Cómo se le da la vuelta al tamaño del tanque

Casi nadie sabe cuántos litros tiene su tanque. Pero todo el mundo sabe cuánta
gente vive en la casa y hace cuánto se lo limpiaron, y eso predice el volumen
igual de bien. Por eso el sistema **no pregunta el tamaño**: pregunta cuatro
cosas que la persona sí puede contestar.

1. Qué tipo de propiedad y de qué tamaño (por personas, no por litros)
2. Hace cuánto se limpió
3. Qué tan lejos queda del punto donde puede parquear el camión
4. Si está dentro o fuera del Valle Central

Esas cuatro cubren los tres factores de costo reales: **volumen, acceso y
distancia**.

### ⚠️ Los precios de hoy son INVENTADOS

La tabla `TARIFAS` en `worker.js` tiene cifras verosímiles pero falsas, puestas
para poder construir y probar el sistema completo antes de tener las reales.

Mientras `provisional: true`:

- Cada cotización sale marcada como estimación.
- `tools/modo-publicacion.py` **se niega** a pasar el sitio a producción.

Para ponerlas de verdad hacen falta seis datos del propietario:

1. Precio base de una limpieza de tanque de casa normal
2. Qué hace que suba (tamaño, metros de manguera, acceso, hora)
3. Cuánto sube cada cosa, aunque sea aproximado
4. El mínimo por el que vale la pena salir — **por servicio**, porque el
   destaqueo no lleva cisterna y no cuesta lo mismo movilizar
5. Cómo se cobra fuera del Valle Central
6. Si los montos llevan IVA incluido o se suma aparte

Falta también la **cédula jurídica**, que va en toda cotización formal.

### La tabla de la base de datos

Las cotizaciones emitidas se guardan en la tabla `cotizaciones`. El SQL está en
`tools/crear-tabla-cotizaciones.sql` y se pega una vez en la Console de D1, igual
que las otras dos tablas.

La columna `provisional` queda en 1 mientras las tarifas sean las inventadas, así
que después se sabe cuáles cotizaciones no hay que tomar en serio.

### Las direcciones que atiende

- `GET /api/cotizar/opciones` — las preguntas y sus opciones, sacadas de la
  misma tabla que el cálculo, para que el chat nunca ofrezca algo que el motor
  no sepa cobrar.
- `POST /api/cotizar` — recibe las cuatro respuestas, devuelve el rango, guarda
  la cotización con su número correlativo (`COT-2026-0001`) y manda el reporte
  por correo a `CORREO_AVISO`.

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

### Pasar de Beto a una persona

Apenas la visita escribe algo, dentro del chat aparece **"Seguir con una
persona por WhatsApp"**. Ese enlace abre WhatsApp con el mensaje ya
redactado, incluyendo lo que la persona acaba de contarle a Beto — para
que no tenga que repetir la historia.

El resumen se arma con **lo que ella misma escribió**, no con un resumen
que invente la IA: es más fiel, no gasta una llamada del cupo diario y
no puede meter datos falsos. Sale como borrador, así que lo lee y lo
puede corregir antes de mandarlo.

El botón aparece aunque Beto esté caído o sin clave configurada; de
hecho ese es el caso en que más sirve. Se arma en `main.js`, función
`initAsistente` → `refrescarPase`, con topes de largo para que el
enlace no se pase de tamaño.

Ojo: el traspaso es de ida. Beto entrega la conversación, pero no ve ni
puede seguir lo que pase después en WhatsApp. Para un hilo único haría
falta la API de WhatsApp Business, que obliga a sacar el número de la
app normal — no conviene mientras se atienda desde un teléfono.

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
