# La app del panel

Cómo instalar el panel en el celular, qué hace y qué falta.

---

## Qué es

El panel de siempre (`sanitariosticos.com/panel`), pero guardado en la
pantalla de inicio del teléfono con su icono, abriendo sin barra de
navegador y sin volver a pedir la contraseña cada vez.

**No es una app de la App Store ni de Google Play.** No hace falta: no hay
cuenta de desarrollador, no hay cuota anual, no hay que esperar aprobación
para corregir una coma. Es la misma página que ya se publica con cada
cambio, con el envoltorio puesto.

**No cuesta nada más.** Ni una suscripción nueva. Todo corre en el mismo
Cloudflare que ya está pagado.

---

## Cómo instalarla

Hágalo usted en el teléfono de él, no le mande un link. En Android es un
toque; en iPhone hay que entrar al menú de Compartir y nadie lo encuentra
solo. Además, en iPhone **las notificaciones sólo funcionan si está
instalada de esta forma**, así que este paso no es opcional para la
tanda 3.

### iPhone (Safari)

1. Abrir **Safari** (no Chrome: en iPhone sólo Safari puede instalarla).
2. Ir a `sanitariosticos.com/panel`.
3. Escribir la clave y entrar una vez.
4. Tocar el botón de **Compartir** (el cuadrito con la flecha para arriba,
   abajo en el centro).
5. Bajar en la lista hasta **"Añadir a pantalla de inicio"**.
6. Tocar **Añadir**.

### Android (Chrome)

1. Abrir `sanitariosticos.com/panel`.
2. Escribir la clave y entrar una vez.
3. Sale solo un aviso abajo que dice **Instalar**. Tocarlo.
4. Si no sale: menú de los tres puntos → **Instalar aplicación** o
   **Añadir a pantalla de inicio**.

Queda un icono con el camión sobre fondo oscuro, con el nombre
**Sanitarios**.

---

## Qué cambió por dentro

**Abre en la pantalla de "Hoy".** Lo urgente arriba, después a quién hay
que responderle, y de último los mantenimientos que vienen. Sin controles
de fecha: eso vive en Resumen, que es donde se mira cómo viene el mes.

**Cada pendiente trae sus botones**: WhatsApp con el mensaje ya escrito,
Llamar, y "Ya la atendí" para marcarla sin abrir nada.

**No vuelve a pedir la clave.** Queda guardada en ese teléfono. El botón de
salir (arriba a la derecha) la borra, y hay que usarlo si el teléfono se
pierde o se presta.

**Abre aunque no haya señal.** La pantalla está guardada en el teléfono.
Los datos no: si no hay internet, el panel abre y dice
*"No se pudo traer la información"*. Es a propósito. Es preferible que diga
que no pudo a que muestre las cotizaciones de ayer como si fueran de hoy.

---

## Lo que falta

**Tanda 2 — que sirva desde la calle.** Botones de contacto en el resto de
las pantallas, cambiar el estado de un trabajo con un toque, revisar que
todo se alcance con el pulgar.

**Tanda 3 — que avise sola.** Notificación al entrar una solicitud nueva y
recordatorio de los mantenimientos. Gratis, pero **en iPhone sólo llegan si
la app está instalada** como dice arriba.

**Antes de la tanda 3 hay que separar usuarios.** Hoy la seguridad es una
sola clave compartida. Para una persona está bien. Si entran los choferes,
cualquiera con esa clave ve todos los precios y todos los clientes.

---

## Notas para quien mantenga esto

- Los archivos son `manifest.webmanifest` (la etiqueta), `sw.js` (la copia
  local) y `assets/img/icono-app-*.png` (los iconos).
- **Al tocar `sw.js` hay que subirle el número a `CACHE`.** Si no, los
  teléfonos que ya lo tienen se quedan con la copia vieja y no hay forma de
  sacarlos de ahí.
- Los iconos viven en `/assets/img/`, que se sirve con caché de un año.
  Como todo lo de esa carpeta: **si cambia el dibujo, cambia el nombre del
  archivo**, o los teléfonos siguen con el icono anterior.
- El service worker se registra con alcance `/panel`. El sitio público no
  pasa por él, así que nada de lo que se publique en la página queda
  atrapado en esa copia.
