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

El sitio no tiene servidor propio, así que el formulario **no envía correos por su
cuenta**: arma el mensaje con lo que la persona escribió y abre WhatsApp con todo
listo para pulsar enviar. Debajo hay un enlace alternativo que hace lo mismo por
correo. Es la opción más fiable en un hosting estático y además llega antes al
teléfono de la empresa.

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

### Formulario y funciones con datos

Cloudflare permite añadir código de servidor sin contratar nada más: se agrega
un archivo dentro de una carpeta `functions/` en la raíz del proyecto y se
convierte en un pequeño programa que corre en los servidores de Cloudflare.
Ahí es donde iría el guardado de solicitudes, con las claves guardadas en el
panel de Cloudflare (nunca en el código).

## Ver el sitio en el computador

Doble clic en `index.html` funciona. Para verlo igual que en el servidor:

```bash
python3 -m http.server 4173
```

y abrir `http://localhost:4173`.
