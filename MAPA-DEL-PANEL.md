# Mapa del panel

Todo lo que el panel hace hoy, por pantalla. Sirve para marcar encima qué
falta, qué sobra y qué hay que reordenar.

---

## De dónde entra el trabajo

```
Formulario /contacto ─────────► SOLICITUD  (sin precio)
Cotizador público /cotizar ───► COTIZACIÓN (precio calculado)
Frank, el chat ───────────────► COTIZACIÓN (origen: beto)
Panel → Nueva cotización ─────► COTIZACIÓN (calculada o a mano)
                                     │
                                     ▼
                        se marca HECHA  ──► nace el CLIENTE
                                                 │
                                                 ▼
                                        SERVICIO anotado
                                                 │
                                                 ▼
                                    recordatorio en la AGENDA
```

**Ese es el único camino por el que nace un cliente.** No se crean a mano.

---

## Los cinco estados

`nueva` (Sin atender) → `contactada` → `agendada` → `hecha` → y aparte
`perdida`. Los mismos para solicitudes y cotizaciones.

---

## Pantalla 1 · HOY

Qué hay que hacer ahora. Es la que abre la aplicación.

| Bloque | Qué muestra | Qué se puede hacer |
|---|---|---|
| Requiere atención | Conteos de lo urgente | Tocar cada línea lleva a esa lista filtrada |
| Pendientes | Quien espera respuesta, con cuánto lleva esperando | WhatsApp · Llamar · Ya la atendí |
| Próximos servicios | Mantenimientos de los próximos 45 días | Tocar abre la ficha del cliente |

Todo sale de **una sola consulta**, la misma del Resumen.

---

## Pantalla 2 · RESUMEN

Las cifras. Rango de 7 / 30 / 90 días, o fechas exactas.

- **Cuatro cifras:** Solicitudes · Cotizaciones · Sin atender · Cobrado.
  Cada una es un botón que abre su lista.
- **Actividad:** barras apiladas por día.
- **Cierre:** porcentaje de cotizaciones enviadas que terminaron en trabajo.
- **Cuatro desgloses:** Estado · Servicios · Ubicaciones · Entrada (por
  dónde llegó: formulario, Frank, panel).

---

## Pantalla 3 · SOLICITUDES · Pantalla 4 · COTIZACIONES

La misma pantalla con dos fuentes.

- Pestañas por estado, con conteo.
- Filtro por texto, y por fecha desde/hasta.
- **Descargar CSV** de lo que se está viendo.
- En escritorio: tabla con tres columnas fijas (Estado, Nota, Contactar).
- En celular: ficha por registro.
- Por registro: **cambiar el estado**, **escribir una nota**, **WhatsApp**,
  **Llamar**, y en cotizaciones **abrir el documento**.
- Marcar **Hecha** abre la hoja *Anotar el trabajo*.

---

## Pantalla 5 · CLIENTES

Quien ya tuvo un trabajo hecho.

- Buscar por nombre, teléfono o cédula.
- Por tarjeta: cuándo le toca el mantenimiento, cuántos trabajos lleva, el
  último, dónde queda, y **WhatsApp / Llamar** sin abrir la ficha.

- **Anotar un trabajo:** registra al cliente y el trabajo que no vino de
  una cotización. También sirve para guardar sólo al cliente.

### Ficha de un cliente

- Editar: nombre, cédula, correo, señas, nota.
- **Recordar por:** WhatsApp · Correo · Ninguno.
- **Cada cuánto:** el periodo del recordatorio.
- Interruptor de recordatorio.
- **Nueva cotización** con sus datos ya puestos.
- **Historial:** cada trabajo con fecha, qué fue, cuánto se cobró y cuándo
  toca el próximo.

---

## Pantalla 6 · AGENDA

A quién le toca mantenimiento.

- Cuatro conteos que filtran: Vencidos · Este mes · Próximos 90 días ·
  Sin recordatorio.
- Calendario del mes, con el mes y el año tocables.
- Lista del filtro puesto, con **Recordar** (WhatsApp) y **Ver** el cliente.

---

## Pantalla 7 · NUEVA COTIZACIÓN

Cuatro pasos: el trabajo → el lugar → los datos → revisar.

- Toda lista termina en **Otro (escribir)**.
- **Precio final** a mano, opcional.
- Si el teléfono ya existe, ofrece **traer los datos** de ese cliente.
- Al crear: se abre el **PDF** solo, y quedan los botones de WhatsApp y
  ver el documento.

---

## Lo que atraviesa todas las pantallas

- **Buscador global** (⌘K): clientes, cotizaciones y solicitudes.
- **Menú del avatar:** hora del último refresco, modo claro/oscuro, salir.
- **Refrescar**, con punto naranja cuando los datos pasan de 10 minutos.
- **Avisos** abajo al guardar algo.

---

## Hoja · ANOTAR EL TRABAJO

Sale al marcar una cotización como hecha. Es **el único lugar donde nace
un cliente**.

Pide: fecha del trabajo · cuánto se cobró (opcional) · cada cuánto
recordar · si se le manda recordatorio.
Botón alterno: *Sólo marcar como hecha*, sin registrar cliente.

---

## Las conexiones con el servidor

| Dirección | Para qué |
|---|---|
| `/api/panel/resumen` | Hoy y Resumen |
| `/api/panel/solicitudes` | Las dos listas (y su CSV) |
| `/api/panel/csv` | Descargar lo que se está viendo |
| `/api/panel/estado` | Cambiar estado, nota, y anotar el trabajo |
| `/api/panel/clientes` | Lista de clientes |
| `/api/panel/cliente` | Ver y guardar una ficha |
| `/api/panel/trabajo` | Anotar un trabajo a mano y registrar al cliente |
| `/api/panel/agenda` | Mantenimientos |
| `/api/panel/buscar` | El buscador global |
| `/api/cotizar` | Crear una cotización |
| `/api/cotizar/opciones` · `/api/geografia` | Llenar las listas del formulario |
| `/api/cotizacion` | Los datos del documento imprimible |

Todas piden la clave del panel menos `/api/cotizacion`, que va con su
propia llave dentro del enlace.

---

## Lo que el panel NO hace hoy

Para marcar encima:

- **No agenda el camión.** La Agenda dice a quién le toca, no qué se hace
  mañana ni con cuál camión.
- **No registra gastos.** "Cobrado" suma lo que entró; no hay salidas.
- **No manda los recordatorios solo.** Hay que abrir la Agenda y tocar
  Recordar uno por uno.
- **No avisa.** Sin notificaciones: hay que entrar a ver.
- **No hay usuarios.** Una sola clave compartida; cualquiera que la tenga
  ve todos los precios y todos los clientes.
- **No guarda fotos.** Ni del tanque, ni del trabajo hecho.
- **No factura.** No hay comprobante electrónico ni conexión con Hacienda.
- ~~No deja crear un cliente a mano~~ · **hecho:** Clientes → *Anotar un
  trabajo* → *Sólo guardar el cliente*.
- ~~No registra un trabajo sin cotización previa~~ · **hecho:** la misma
  hoja guarda el trabajo, suma en lo cobrado y arma el recordatorio.
