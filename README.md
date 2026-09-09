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
- **Cotizaciones** — cada estimado emitido, con el rango de precio y
  las respuestas con que se calculó. Mientras las tarifas sean las
  provisionales, aparece un aviso arriba de la tabla. El número de cotización
  es un enlace al documento imprimible, que es el camino para reenviarle a
  alguien su cotización sin volver a emitirla.

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

## El panel: centro de control

Está en **`/panel`**, con la clave que vive en Cloudflare como *Secret*
(`CLAVE_PANEL`). Cuatro secciones en una barra lateral, que en el
teléfono baja a una barra fija abajo.

El diseño sale de `DIRECCION-DE-ARTE.md` §14 y §15, contra tres
referencias medidas: Kinsta (la estructura), Linear (cómo se comporta
una herramienta que uno tiene abierta todo el día) y Vuesax (el chip de
icono, la línea de tendencia y el aro).

**Rango de fechas.** Botones de 7 / 30 / 90 días más dos campos para
cualquier otro periodo. Manda sobre las cifras de conteo, el aro de
cierre, la serie diaria y los cuatro desgloses. **No** manda sobre "Sin
atender" ni sobre "Cotizado sin cerrar": esos son estado de hoy, y una
cotización vieja sin atender tiene que seguir apareciendo aunque el
rango no la cubra.

**Tipografía Inter**, no Archivo. Archivo es el tipo de cartel del
rótulo del camión y sirve para el sitio público; acá hay cifras chicas
en tablas, que es justo para lo que está dibujada Inter.

**Modo claro y oscuro.** Arranca con lo que tenga puesto el sistema y
se queda con lo que uno escoja; la elección vive en el navegador. El
botón está arriba a la derecha.

**En el teléfono la lista no es una tabla.** Debajo de 720px cada
registro es una ficha con el nombre de titular, los datos apilados y
los botones de WhatsApp y llamar a lo ancho. No hay que arrastrar de
lado para nada.

### Resumen

Abre saludando y con la fecha. Debajo, en este orden — que es el orden
de lo que hay que saber:

1. **Cuatro cifras**: cotizaciones y solicitudes del rango, cada una
   con su variación contra el periodo anterior; lo que sigue sin
   atender; y lo **cobrado**, que sale de los trabajos anotados y no
   del rango de las cotizaciones, porque eso último es una estimación
   de algo que puede no pasar.
2. **Requiere atención** — la única sección que dice qué *hacer*:
   cotizaciones sin responder, solicitudes de más de un día,
   mantenimientos pasados de fecha, cotizaciones por vencerse. Cada
   línea lleva a su lista.
3. **Actividad** y **Cierre**.
4. **Pendientes** y **Próximos servicios**.
5. Los cuatro desgloses.

Todas las cifras se tocan: cada una abre su propia lista ya filtrada.
Si dice 2 sin atender, tocar el 2 muestra esas dos.

| Tarjeta | Qué dice |
|---|---|
| **Sin atender** | Cuántas cosas nadie ha tocado, y cuánto lleva esperando la más vieja. Se pinta naranja si hay alguna. |
| **Hoy** | Cotizaciones y solicitudes que entraron hoy |
| **Últimos 7 días** | Lo mismo, de la semana |
| **Embudo abierto** | La plata de las cotizaciones que todavía se pueden cerrar (ni hechas ni perdidas) |
| **Cierre** | De las cotizaciones ya resueltas, qué porcentaje terminó en trabajo |

Debajo va **lo que está esperando**: la cola de todo lo que sigue en
"sin atender", lo más viejo de primero, mezclando solicitudes y
cotizaciones. Cada línea trae tres botones — **WhatsApp** con el mensaje
ya escrito, **Llamar**, y **Ya la atendí**. Lo que lleva más de un día
se pinta naranja.

Después, una barra por día de los últimos 30 —con el detalle al pasar
el mouse, y tocando un día se abre la lista de ese día— y cuatro
desgloses: en qué van las cotizaciones, qué servicio se pide, en qué
provincia, y por dónde entró (Beto, formulario o panel). Tocar
cualquier barra de los tres primeros filtra la lista por eso.

Arriba de la lista queda dicho con palabras qué filtro tiene puesto
("Provincia: Alajuela") y un enlace para quitarlo. Sin eso, tocar una
barra sería magia: la lista cambiaría sin explicar por qué.

### Nueva cotización

Cuatro pasos, no una pared de once campos: **Servicio → Ubicación →
Cliente → Confirmar**. No se puede avanzar sin contestar lo del paso,
que es lo que evita llegar al final con un hueco; hacia atrás se salta
libremente tocando el riel de arriba.

En el paso del cliente, al escribir un teléfono ya registrado aparece
**"Ya está registrado: ... — Traer sus datos"**. Es lo que evita
terminar con el mismo señor tres veces con el nombre escrito distinto.

Desde la ficha de un cliente, el botón **Nueva cotización** abre el
formulario con sus datos y su ubicación ya puestos.

Se llenan las mismas preguntas que hace Beto —servicio, tipo de propiedad, último
servicio, acceso, provincia/cantón/distrito, nombre y teléfono— y sale
**la misma cotización**: con su número, su documento y su llave, guardada
en la misma tabla y marcada con origen `panel`.

Al terminar aparecen tres botones: ver el documento, **mandársela por
WhatsApp** al cliente (el mensaje ya trae el enlace), y hacer otra.

Es la cuarta puerta al mismo motor. Ninguna de las cuatro calcula nada:
el formulario, el botón de Beto, la conversación con Beto y esta mandan
los mismos datos a `/api/cotizar`, y el precio sale del código del
servidor. Una cotización hecha por teléfono vale exactamente igual que
una que sacó el cliente solo.

Decir "origen: panel" **exige la clave**. Sin ella la cotización se
guarda igual, pero como venida de Beto: de ese dato dependen las
estadísticas de por dónde entra el trabajo.

### Clientes

Quien ya vino una vez. **No hay que llenarlo a mano:** el cliente y el
trabajo se crean solos al marcar una cotización como *Hecha*, que es
algo que el propietario ya hace. Ahí se le piden las dos cosas que el
sistema no puede adivinar — cuándo se hizo y cuánto se cobró — y con
eso queda armado el recordatorio.

El teléfono es la llave: la cédula mucha gente no la da y el correo se
pierde, pero el número siempre está. Si alguien vuelve, se reconoce y
no se duplica.

En la ficha de cada cliente están sus datos, las señas para llegar, el
historial completo de trabajos con lo que se cobró, y tres controles:
**si se le manda recordatorio**, **por cuál canal** (WhatsApp, correo o
ambos) y **cada cuánto**: 3, 6, 9, 12, 18, 24, 36 o 48 meses. Arranca
en tres porque una trampa de grasa de restaurante se limpia trimestral,
no cada dos años como un tanque séptico de casa.

Cambiar la periodicidad **recalcula la fecha ya guardada** del último
trabajo. Antes no lo hacía: uno ponía seis meses y la agenda seguía
mostrando los veinticuatro con que se registró.

### Agenda

A quién le toca mantenimiento. El calendario responde *cuándo* y la
lista de al lado responde *a quién*; tocar un día une las dos.

Cuatro cifras arriba, todas tocables: **Vencidos**, **Este mes**,
**Próximos 90 días** y **Sin recordatorio**.

Sólo cuenta el **último** trabajo de cada cliente. Si a alguien se le
hizo el tanque en 2024 y otra vez en 2026, la fecha del 2024 ya no dice
nada: el reloj arranca de nuevo con el trabajo más reciente.

Cada fila trae el mensaje de recordatorio ya redactado, con la fecha
del último servicio adentro. Hoy se manda de un toque desde el WhatsApp
de la empresa; **mandarlo solo, sin tocar nada, necesita la API de
WhatsApp de Meta**, que exige verificación de empresa y el dominio ya
migrado.

### Por qué esto importa más que lo demás

Un tanque séptico se limpia cada dos o tres años. Eso quiere decir que
**cada trabajo hecho es un cliente futuro con fecha conocida**, y que
no tener este registro es regalar esa venta. Es lo que convierte un
negocio de una sola venta en uno que se repite solo.

Las tablas se crean con `tools/crear-clientes-y-servicios.sql`, que se
pega **una sola vez** en la Console de D1.

### Cotizaciones y Solicitudes

Las dos tablas de siempre, con tres columnas nuevas pegadas a la derecha
que no se van al arrastrar:

- **Estado** — un menú: sin atender · contactada · agendada · hecha · perdida.
  Se guarda solo al cambiarlo.
- **Nota** — una línea ("llamar después de las 5"). Se guarda al salir del campo.
- **Contactar** — WhatsApp y llamar.

En pantalla van sólo las columnas con las que se decide qué hacer. El
último servicio, el acceso y el origen **siguen en el CSV y en el
documento**: se sacaron de la tabla para dejarle campo a las tres
columnas de trabajo.

Arriba van las **pestañas de estado con su conteo** —Todas, Sin
atender, Contactada, Agendada, Hecha, Perdida— que responden "¿cuántas
hay en cada punto?" antes de abrir ninguna. Los números respetan los
demás filtros: "Hecha 13" en todo el año no es "Hecha 13" en la última
semana.

Debajo, un campo para **filtrar esa lista** (nombre, teléfono, cédula o
número) y el rango de fechas. Todo se aplica solo al cambiarlo, sin
botón: un "Filtrar" que hay que acordarse de apretar es la forma más
común de mirar una lista equivocada creyendo que está filtrada. El CSV
baja lo que esté filtrado, todas las páginas y no sólo la que se ve.

### Por qué WhatsApp es un enlace y no un envío

En Costa Rica nadie coordina un camión por correo. Pero mandar mensajes
*desde* el sistema necesitaría la API de WhatsApp de Meta, con
verificación de empresa de por medio.

Mientras tanto el panel hace lo siguiente mejor: arma el mensaje con los
datos de la fila y abre WhatsApp con el número puesto y el texto escrito.
La persona revisa y le da enviar. Sale del WhatsApp real de la empresa,
no cuesta nada, y no hay nada que configurar.

### La tabla de estados

Se agrega con `tools/agregar-estados.sql`, que se pega **una sola vez**
en la Console de D1 (Workers & Pages → D1 → `sanitarios-ticos-datos` →
Console). Agrega `estado`, `nota` y `actualizado` a las dos tablas.

## Cotizaciones

### Las tres puertas al precio

Hay tres formas de llegar a una cotización, y las tres terminan en la
misma cuenta del servidor (`/api/cotizar`), en la misma tabla y con el
mismo documento imprimible. Lo único que cambia es la columna `origen`,
que sirve para saber por dónde entra el trabajo:

| Puerta | Dónde | `origen` |
|---|---|---|
| El chat de Frank | cualquier página, botón naranja | `beto` |
| El cotizador público | `/cotizar` (`cotizador.js`) | `formulario` |
| El panel | `panel.html`, "+ Nueva cotización" | `panel` |

`panel` es el único que hay que probar: decir que una cotización la hizo
alguien de la empresa cambia las estadísticas, así que sin la clave del
panel se guarda como `beto`. El valor `beto` **no se renombra** aunque el
personaje ahora se llame Frank: renombrarlo dejaría huérfanas las
cotizaciones ya emitidas.

El cotizador público existe porque no todo el mundo quiere conversar con
un asistente para saber cuánto sale limpiar un tanque. Ver
DIRECCION-DE-ARTE.md §22.

### Quién da el precio oficial

El monto que calcula el servidor es un **estimado automático**. El precio
oficial lo da **el encargado**, antes de empezar el trabajo.

Esto no es una etapa de transición mientras se afinan las tarifas: es
como funciona el negocio y va a seguir siendo así, porque en sitio
aparecen cosas que un formulario no ve. Por eso la frase está redactada
en presente permanente en las cuatro bocas por donde sale el monto —el
chat, el cotizador público, el documento imprimible y el correo al
encargado— y no depende de la bandera `provisional`, que es otra cosa
(esa marca si las tarifas del código todavía no vienen del propietario, y
hoy está en `false`).

### Por qué Beto no calcula el precio

Beto conversa y recoge los datos; **el precio lo saca código normal**, en
`worker.js`, sección "Motor de cotizaciones". Un modelo de lenguaje haciendo
cuentas se equivoca tarde o temprano, y una cotización equivocada la paga la
empresa: o come la diferencia o queda como que hizo carnada.

Para el cliente se siente igual —"Beto me cotizó"— pero la aritmética siempre
da bien, y cambiar un precio es editar una tabla, no reescribir a Beto.

### Los precios

Son los reales, entregados por el propietario el 8 de setiembre de 2026.
Cada monto del código salió de él; donde no hay número no se inventa
uno — se dice "desde".

**Tanque séptico.** El precio sale del **tamaño**. Como casi nadie sabe
los litros de su tanque, no se pregunta el tamaño: se pregunta la
**forma**, y de ahí la medida. La forma se ve saliendo al patio.

| Forma | Medida | Precio |
|---|---|---|
| Redondo, de cemento | 2 m de fondo × 1 m de diámetro | ₡40.000 |
| Hueco de tierra | 4 m · 5 m · 6 m | ₡90.000 · ₡110.000 · ₡140.000 |
| Tanque plástico | 750 · 1000 · 1500 · 2000 · 2500 L | ₡40.000 · ₡60.000 · ₡90.000 · ₡120.000 · ₡140.000 |
| Cuadrado de block | 1,5³ m · 2³ m | ₡70.000 · ₡100.000 |

A eso se le suma el tiempo sin limpiar: **1–2 años nada, 3–4 años
₡5.000, 5 o más ₡10.000.**

**Los otros servicios** van con precio de tabla, sin preguntas sobre el
trabajo:

| Servicio | Precio |
|---|---|
| Limpieza de trampa de grasa | ₡35.000 – 40.000 |
| Limpieza de tanque de grasa | desde ₡50.000 |
| Destaqueo de tuberías | ₡30.000 – 35.000 |
| Alquiler de tanque plástico | ₡15.000 por día, mínimo 8 días |

Los rangos son la variación del trabajo **dentro de la misma zona**, no
de la distancia.

### Por qué no hay recargo por distancia

Porque el propietario decidió que el cliente no lo vea. El negocio
apunta a llenar los camiones dentro de las zonas que ya cubre, no a
viajar; para lo que cae fuera, el precio base es el mismo y **el
recargo lo pone él** antes de dar el precio en firme.

Meterlo en la fórmula habría sido inventar un número que él no dio, y
además mostrarle al cliente algo que no quiere mostrarle. La zona se
sigue guardando en cada cotización para poder estudiarla después y
afinar el perímetro.

### "Desde" no es lo mismo que un rango

Un rango de cero de ancho —"₡65.000 – ₡65.000"— finge una precisión que
no existe y se lee raro. Cuando el mínimo y el máximo coinciden, todo
el sistema escribe **"desde ₡65.000"**: el chat, el panel, el WhatsApp
y el documento. La decisión vive en una sola función (`montoTexto`)
para que no puedan contradecirse.

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

### El documento de cotización

Cada cotización emitida tiene su propia dirección:

```
/cotizacion?n=COT-2026-0007&k=<llave>
```

Esa página (`cotizacion.html`) es el documento formal. De ahí salen las tres
formas de entregarlo:

- **PDF** — «Imprimir → Guardar como PDF», desde cualquier navegador o teléfono.
- **Imagen** — una captura de la misma página.
- **Enlace** — se pega en WhatsApp y el cliente lo abre sin instalar nada.

El diseño está especificado en `DIRECCION-DE-ARTE.md` §12, con las referencias
que se usaron y qué se tomó de cada una.

Los datos del cliente —nombre, cédula, teléfono, correo y la dirección por
provincia, cantón y distrito— se recogen por cualquiera de las tres puertas
(el formulario, el botón de Beto o pidiéndoselo a Beto conversando) y las tres
terminan en la misma cotización guardada.

**La dirección se escoge, nunca se escribe.** Las tres listas están encadenadas
—provincia abre cantón, cantón abre distrito— y salen de `lib/geografia-cr.js`:
7 provincias, 84 cantones y 487 distritos, del archivo que entregó el
propietario. El servidor vuelve a validar los tres niveles antes de guardar
nada, porque una lista en el navegador se puede saltar.

Así no llega la misma zona como "Belén", "Belen" y "belen", y el cantón —que
decide el cobro de ruta— siempre existe. La zona de cobro ya no se pregunta:
sale de la provincia. Fuera del GAM son Guanacaste, Puntarenas y Limón; las
otras cuatro provincias se consideran alcanzables. Es una regla gruesa a
propósito, y se va a afinar por ubicación más adelante.
(`tools/agregar-datos-cliente.sql` agrega las columnas.)

### Formatos: teléfono, cédula y correo

La gente no contesta con el dato pelado. A "¿a qué número la contactamos?"
responden *"escríbame al 8888-8888"*, y guardar eso tal cual mete la frase
entera en un documento formal.

`lib/datos-cr.js` saca el dato de la frase, comprueba que tenga sentido y lo
deja en un solo formato:

| Campo | Qué acepta | Cómo queda |
|---|---|---|
| Teléfono | 8 dígitos, con o sin `+506`, dentro de una frase | `8888-8888` |
| Cédula física | 9 dígitos | `1-2345-6789` |
| Cédula jurídica | 10 dígitos empezando con 3 | `3-101-123456` |
| DIMEX | 11 o 12 dígitos | sin guiones |
| Correo | dentro de una frase | en minúscula |
| Nombre | quita "soy", "me llamo" | como lo escribió |

Los teléfonos empiezan con 2, 4, 6, 7 u 8 — el 3 no se asigna, así que un
número que empieza con 3 en esa casilla es casi seguro una cédula jurídica
puesta donde no va, y se rechaza diciéndolo.

Un campo opcional vacío pasa; uno opcional **mal escrito** no, porque
terminaría impreso. En el formulario, al validar se reescribe el campo con el
dato ya en formato, para que la persona vea qué se va a guardar. Beto, cuando
el dato no cuadra, lo dice y vuelve a preguntar, como haría alguien al
teléfono.

`main.js` repite estas reglas para avisar de una vez, pero el servidor las
vuelve a aplicar: una validación en el navegador se puede saltar.

**La llave no es decorativa.** El número es correlativo, así que sin ella
cualquiera podría ir probando `COT-2026-0001`, `0002`… y leer el nombre y el
teléfono de otras personas. La columna se agrega con
`tools/agregar-llave-cotizaciones.sql`, que se pega una vez en la Console de D1.

Falta la **cédula jurídica**: mientras no esté, el documento lo dice en el
bloque de la empresa, en naranja. Es a propósito — un documento formal sin
cédula tiene que verse incompleto, no verse bien.

## Asistente de preguntas

**Se llama Frank.** Antes se llamaba Beto; el cambio es sólo de nombre
visible. En la base de datos el origen de una cotización se sigue
guardando con la clave `beto`, y **eso no se toca**: renombrarla dejaría
huérfanas todas las cotizaciones ya emitidas. Lo único que cambió es la
etiqueta que se muestra.

**Pendiente:** el dibujo del personaje. El botón tiene el hueco listo
(`.asistente-fab .cara`, recorte circular de 26px); cuando llegue el
archivo se cambia el `src` en las seis páginas y ya. La animación de
saludo espera al dibujo a propósito — sin ver dónde queda el brazo ni
cuánto margen transparente trae, cualquier animación habría que
rehacerla.


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

y abrir `http://localhost:4173`. (`\.claude/launch.json` tiene esa misma
configuración con el nombre `estatico`, para las herramientas que la
levantan solas.)

Ojo: así se ve el sitio, pero **no el Worker**. Todo lo que empieza con
`/api/` no responde, así que el panel y las cotizaciones sólo funcionan
de verdad en Cloudflare.
