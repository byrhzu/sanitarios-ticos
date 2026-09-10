# Dirección de arte — Sanitarios Ticos

Fecha: 2026-09-01 · Rubro: manejo de aguas residuales (tanques sépticos) · Quién decide: Byron

Este archivo es el contrato del proyecto. Todo valor del CSS tiene que poder rastrearse hasta
acá. Si algo del sitio no está en este documento, o se agrega acá con su razón, o se saca del
sitio.

---

## 1. El negocio antes que el diseño

- **Qué vende y a quién:** limpieza de tanques sépticos, destaqueo, trampas de grasa,
  construcción de drenajes y alquiler de tanques. A casas, restaurantes, hoteles, escuelas
  e industrias, en todo Costa Rica desde tres sedes del Valle Central.
- **Cómo llega hoy el cliente:** llamada o WhatsApp, casi siempre con un problema que ya
  está pasando. El formulario es el canal menor.
- **Qué tiene que pasar en el sitio para que sea un éxito:** que la persona con un tanque
  rebalsándose marque el teléfono.
- **Qué mira primero, segundo, tercero:** (1) que esta gente hace exactamente lo que
  necesita, (2) que llegan a su zona, (3) cómo los contacta ya.

## 2. Referencias

### Referencia 1 — El camión rotulado (material del cliente) · PRINCIPAL

- **Tipo:** material del cliente — `assets/img/cisterna-rotulada.webp`
- **Medido (lectura de la imagen):**
  - Tipografía: **grotesca condensada pesada, en versalitas**, blanca sobre el naranja.
    "LIMPIEZA DE TANQUES SÉPTICOS" y "sanitariosticos.com" ocupan casi todo el tanque.
  - Contraste de escala brutal: el titular del tanque contra "TRANSPORTE EXCLUSIVO DE
    LODOS SÉPTICOS" en itálica condensada minúscula, abajo a la derecha. Razón ≈ 5–6×.
  - Naranja: **campo, no acento.** El tanque entero es naranja saturado; el blanco es la
    tipografía y una banda horizontal que cruza el cilindro.
  - Todo alineado a la izquierda, apilado por importancia: teléfonos arriba en una franja
    comprimida, servicio y dominio en el cuerpo grande, letra legal chica en la esquina.
  - Marcas regulatorias reales: disco "60 km/h", rombo de residuo peligroso clase 6.
- **Tomo:** la condensada pesada en versalitas; el naranja como superficie y no como
  detalle; la alineación a la izquierda; el contraste de escala 5–6×; las marcas
  regulatorias como material gráfico.
- **Descarto:** la banda blanca literal cruzando cada bloque, porque en pantalla no hay un
  cilindro que justifique la curva y quedaría como decoración.
- **Traducido a este cliente:** los titulares del sitio se escriben con la misma voz con la
  que está pintado el camión. Si el camión lleva 40 años diciendo las cosas en condensada
  pesada, el sitio no tiene por qué decirlas en una grotesca de moda.

### Referencia 2 — El logo (material del cliente)

- **Tipo:** material del cliente — `assets/img/logo-horizontal.webp`
- **Medido:** "SANITARIOS TICOS" en **condensada muy pesada, versalitas, con inclinación
  hacia adelante** (~6°), tracking apretado, naranja pleno. La mascota del camión al lado.
- **Tomo:** la condensada pesada en caja alta y la inclinación como recurso disponible.
- **Descarto:** la inclinación en todo el sitio — en el logo funciona porque son dos
  palabras; en párrafos sería ilegible.
- **Traducido:** la familia de titulares tiene que ser pariente del logo, no una vecina.
  Hoy no lo es y ese es el problema de fondo.

### Referencia 3 — thronelabs.co (in-sector, con dirección de arte)

- **Tipo:** link, abierto y medido
- **Medido:**
  - **`divisoresAnchos: 0`** — cero líneas divisorias de más de 400px en toda la página.
  - Las secciones se separan **solo por campos de color a sangre**: blanco azulado
    `rgb(247,250,250)` dominante, azul profundo `rgb(4,59,105)`, verde lima
    `rgb(169,197,97)`, ciruela `rgb(120,47,90)`.
  - Titulares H2 de 32–44px sobre cuerpo de 14–16px. Razón ≈ 2,8×. Sin versalitas.
- **Tomo:** **la separación por campo de color, sin una sola regla.** Es la respuesta
  directa a "eliminar toda línea divisora".
- **Descarto:** su paleta y su escala tipográfica moderada — es una empresa de baños
  públicos inteligentes hablándole a municipalidades; nosotros le hablamos a alguien con
  una emergencia.
- **Traducido:** el sitio separa secciones cambiando el fondo (papel / papel-2 / pizarra)
  y cambiando el ancho del contenedor. Nunca con una raya. El naranja quedó fuera de esa
  rotación por decisión de Byron — ver §5.

### Hallazgo — el gremio local no tiene de dónde copiar

`tanqueseconomicos.com` y `limpiezatanquescr.com` **están caídos**, los dos con
"Error al establecer una conexión con la base de datos" (WordPress). La búsqueda de sitios
del rubro con dirección de arte no devolvió ninguno.

Esto no es un fallo de la búsqueda: es el estado del gremio. Y confirma la decisión de
sacar el sistema visual del **material físico** (camión, logo, señalética) y no de la web
de un competidor. También es la oportunidad: el estándar a vencer es muy bajo.

## 3. Concepto rector

> **El costado del tanque.** Un cilindro naranja rotulado para que se lea a 30 metros
> desde un carro en movimiento: condensada pesada, blanco sobre naranja, todo lo
> importante primero y la letra legal chiquita en la esquina.

**De dónde sale materialmente:** la rotulación del camión cisterna y el logo, que ya usan
ese lenguaje desde antes de que existiera el sitio.

## 4. Tipografía

Se cambió **Bricolage Grotesque + Instrument Sans** —dos tipografías de catálogo de moda,
elegidas sin relación con la marca, ninguna parecida al logo— por **Archivo**, de la
fundición argentina Omnibus-Type.

Es **una sola familia variable** con ejes de peso y de ancho. El titular usa el corte
estrecho y pesado (el del logo y el rótulo del camión) y el texto el corte normal: son la
misma tipografía, no dos que se llevan bien.

| Rol | Ancho (`font-stretch`) | Peso | Tamaño | Caja |
|---|---|---|---|---|
| h1 (cartel) | 68% | 800 | `clamp(2.6rem, 7vw, 5.5rem)` | versalitas |
| h2 / h3 / display | 76% | 700 | según sección | normal |
| Cuerpo | 100% | 400 | 17px / `line-height 1.6` | normal |

- **Por qué Archivo:** grotesca pensada para *"excelente rendimiento en tamaños pequeños y
  gran impacto en titulares"* — que es exactamente el contraste que pide el camión. Al ser
  de una fundición latinoamericana, los acentos y la ñ están resueltos de origen, no
  adaptados después. Y no es de las tipografías saturadas de la web.
- **Se descartó Barlow** aunque encaja perfecto en concepto (su raíz declarada es la
  señalética vial): está en más de 625.000 sitios. Habría cambiado un molde por otro.
- **Se aplica con `font-stretch`,** no con `font-variation-settings`: el primero respeta la
  cascada y el segundo se la salta.
- **Razón display:cuerpo:** **5,2×** (88px / 17px en escritorio) — sale del camión, donde
  el titular del tanque es 5–6 veces la letra legal de la esquina. Antes estaba en 2,7×,
  que es lo que lo hacía sentirse plano y de plantilla.
- **Ancho de línea del texto corrido:** 62ch.
- **Sistema de énfasis del sitio (uno solo):** **la escala.** Lo importante es más grande.
  Nada de palabras en color dentro del titular, nada de subrayados de color como énfasis.
  El subrayado queda reservado exclusivamente para enlaces reales.

## 5. Color

| Rol | Hex | Dónde aparece | Cuánta superficie |
|---|---|---|---|
| Dominante | `#faf7f2` papel | fondo de la mayoría de secciones | ~55% |
| Neutro medio | `#f3ece2` papel-2 | secciones intercaladas y franjas alternas | ~20% |
| Neutro oscuro | `#1f2c33` pizarra | 2 secciones a sangre | ~20% |
| Acento | `#ef6511` naranja | botón principal y estados activos | ~2% |
| Tinta | `#1b1917` | texto sobre papel | — |

**Decidido por Byron (2026-09-01): el naranja se queda como acento.** Se evaluó pasarlo a
campo de sección entera —el camión es un cilindro naranja y en su propio material el
naranja *es* superficie— y se descartó por ser un salto muy grande respecto de lo ya
aprobado. Consecuencia: la separación entre secciones descansa **solo** en papel,
papel-2 y pizarra, más el cambio de ancho de contenedor. Sin naranja de apoyo, esos tres
campos tienen que alternarse con más disciplina.

- **El naranja aparece exactamente en:** el botón principal de cada sección, el cuadro del
  kicker de portada, el estado activo del selector de sedes, y los enlaces (en `--orange-dk`,
  que es el que pasa contraste AA). En ningún lado más.
- Nada de `#ffffff` ni `#000000` puros.

## 6. Espaciado y ritmo

- **Escala base:** 4px.
- **Anchos de contenedor por sección (varían a propósito):** portada a sangre completa ·
  servicios a 1240px · la empresa a 720px (columna angosta, para que se lea como texto) ·
  cobertura a 1240px · cierre a sangre.
- **Secciones apretadas:** la tira de datos y el cierre. **Con mucho aire:** la portada y
  el campo naranja.
- **Qué rompe el contenedor:** la foto del camión, que sangra hasta el borde derecho de la
  ventana (ya está y se conserva).

## 7. Separación entre secciones

> **Solo cambio de campo de color y de ancho de contenedor. Ninguna regla, ningún número,
> en ninguna parte del sitio.**

De Throne, medido: cero divisores anchos en toda su página. De ahí se toma el criterio.

Consecuencia directa, y es lo que pediste:

- **Fuera la numeración de secciones** (`01`, `02`, `03`…). No hay un orden que la persona
  deba seguir; era cosmética de "sitio con criterio".
- **Fuera la barra naranja de la etiqueta** y cualquier resto del `01 SERVICIOS ————`.
- **Las secciones abren con el h2 solo**, grande, sin etiqueta encima.
- **Fuera también las hairline dentro de las listas.** Decidido por Byron (2026-09-01).
  Los ítems de una lista —las cinco filas de servicio, los datos de contacto, las sedes—
  se separan con **franjas alternas de papel y papel-2**: mismo efecto de separación, con
  materia en vez de con una raya de 1px. Sale de la banda que cruza el tanque del camión.

**Inventario de lo que hay que quitar** (para poder verificarlo al final):

| Dónde | Qué se quita | Con qué se reemplaza |
|---|---|---|
| `.tag` | número + barra naranja | nada: el h2 abre solo |
| `.index` / `.row` | `border-bottom` entre servicios | franjas alternas |
| `.data li` | `border-bottom` entre datos de contacto | franjas alternas |
| `.sedes` / `.sede` | rejilla de 1px entre sedes | franjas alternas |
| `.marcas li` | `border-top` / `border-bottom` | franjas alternas |
| `.hq li` | `border-bottom` | franjas alternas |
| `.qa details` | `border-bottom` entre preguntas | franjas alternas |
| `.facts` / `.fact` | `border-block` y `border-right` | espacio + cambio de campo |
| `.mapa-foot`, `.band` | `border-top` / `border-bottom` | cambio de campo |

## 8. Fotografía

- **Origen:** fotos reales del cliente. No hay stock en el sitio y no debe entrar.
- **Tratamiento:** ninguno. Son fotos de celular en obra y esa es la prueba de que el
  trabajo es real; tratarlas las volvería stock.
- **Regla:** la foto de portada lleva su pie encima con velo, porque es la única en la que
  el rótulo del camión *es* el mensaje. Las demás no llevan texto encima.

## 9. Movimiento

**Actualizado el 2026-09-01.** Byron pidió movimiento que le diera fluidez al sitio. El
criterio con el que se decidió qué entra: **el movimiento tiene que hacer algo, no
decorar.** Si sólo adorna, no entra — por eso no hay contadores animados en las cifras ni
`fade-in-up` nuevos.

- Por defecto casi nada. Transiciones de 150–350 ms en estados reales.
- **La única animación de entrada:** el `rv` existente, que ya escalona 65 ms por hermano
  y tiene red de rescate a los 3 s. No se agregó ninguna otra.
- **Los tres movimientos que sí entraron, y qué problema resuelve cada uno:**

| Movimiento | Qué arregla |
|---|---|
| Transición entre páginas (`@view-transition`) | Cada clic del menú daba un parpadeo en blanco. En un sitio de seis páginas es la mayor ganancia de fluidez. La barra de teléfonos y la cabecera van nombradas, así que se quedan quietas y sólo cambia el contenido. |
| Acordeón de preguntas con altura animada | Abría de golpe y la página pegaba un salto: lo que estabas leyendo se te iba de la pantalla. Va dentro de `@supports`; donde no se entienda, abre de golpe como antes. |
| El paso entre páginas | **No arregla nada — es una decisión estética que pidió Byron.** Queda registrado como tal para no fingir después que resolvía un problema. Una franja naranja cruza la pantalla y detrás va quedando la página nueva: el costado del camión pasando. Empezó siendo un iris —el círculo del efecto «Curtains: Iris» de Motion, abriéndose desde el punto del clic— y se cambió porque un iris es el diafragma de una cámara: quedaba bien, pero podría estar en cualquier sitio del mundo y no decía nada de esta empresa. La franja no es un elemento nuevo: es el fondo del grupo de la transición, visible en el hueco entre la página que sale y la que entra, que viene 16 % atrás. Cero HTML y cero JavaScript — se borraron las 52 líneas que guardaban el punto del clic, que el barrido ya no necesita. Es el mismo naranja del costado del camión y la misma franja que encabeza el documento de cotización: un elemento de marca haciendo tres trabajos, en vez de tres efectos sin relación entre sí. Dura .62 s, en `--paso-tiempo` y `--paso-curva`. Se hace con la API del navegador; Motion+ es de pago, monta su propio velo opaco con JS y está pensado para aplicaciones de una sola página, donde el cambio de ruta es instantáneo. Acá las páginas son documentos separados y un velo opaco taparía la pantalla mientras la siguiente carga: sumaría espera en vez de disimularla. La barra de teléfonos y la cabecera siguen nombradas, así que se quedan quietas y la franja sólo cruza el contenido — el teléfono nunca parpadea, que en una emergencia importa más que el efecto. |
| Fundido del mapa al cambiar de sede | El iframe se recargaba y parpadeaba en gris, que se lee como un fallo. Lleva red de seguridad a los 2,5 s por si el `load` no llega. |

- `prefers-reduced-motion` apaga los tres, además de la marquesina.

## 10. Firma humana

> **Las marcas regulatorias del tanque.** El camión lleva pintado
> "TRANSPORTE EXCLUSIVO DE LODOS SÉPTICOS", el rombo de residuo clase 6 y el disco de
> 60 km/h. Son marcas obligatorias, reales, y ningún competidor las puede usar porque son
> del vehículo de ellos.

Se usa **una**: la leyenda `TRANSPORTE EXCLUSIVO DE LODOS SÉPTICOS` en condensada
minúscula, como sello al pie del campo naranja. Es el detalle que no se puede copiar
cambiando el logo.

## 11. Excepciones al catálogo de tics

| Tic | Se usa | Referencia que lo justifica | Justificación |
|---|---|---|---|
| 1 · Píldora sobre el titular | **No** | Camión | Eliminada. El dato subió al titular: "Su tanque séptico, atendido **hoy mismo**". Si la urgencia es el argumento de venta, no va en 12px arriba — va en 88px. La promesa exacta ("atendemos emergencias el mismo día") abre el párrafo en negrita, para que el compromiso quede acotado a emergencias y no a todo trabajo. |
| 2 · Palabra de acento en el titular | **No** | — | Se elimina "en *manos ticas*" en naranja. El énfasis pasa a ser de escala. |
| 3 · Etiqueta numerada con línea | **No** | — | Se elimina entera: número y barra. Las secciones se separan por campo de color. |
| 4 · Grid de chips con borde | **No** | — | Ya se quitó en "Quiénes nos contratan"; se revisa que no queden en señales. |
| 5 · Botón relleno + fantasma | **Sí, se conserva** | — | Byron decidió (2026-09-01) que la jerarquía entre "Llamar" y "Cotizar por WhatsApp" da igual. Queda registrado como excepción consciente, no como olvido: si algún día se ve que la mayoría llama, conviene revisarlo. |
| 6 · Subrayado de color como énfasis | **No** | — | El subrayado queda solo para enlaces. |
| 7–12 | **No** | — | Ausentes hoy y se mantienen ausentes. |

## 12. Auditoría de entrega

- [ ] **Prueba del logo** — cambio logo y textos por los de un bufete: ¿deja de funcionar?
- [ ] **Prueba del hermano** — al lado de Caña Brava (Fraunces + Inter, editorial oscuro):
      ¿se nota el molde? Con condensada de señalética no debería.
- [ ] **Catálogo de tics** — cada uno ausente o justificado arriba.
- [ ] **Trazabilidad** — cada valor del CSS sale de este documento.
- [ ] **Copy** — suena al dueño, no a agencia.
- [ ] **Firma humana** — la leyenda del tanque, en una frase.

---

## Decisiones tomadas

| Fecha | Decisión | Quién |
|---|---|---|
| 2026-09-01 | Las hairline de las listas también se van → franjas alternas | Byron |
| 2026-09-01 | El naranja se queda como acento, no pasa a campo de sección | Byron |
| 2026-09-01 | Tipografía: **Archivo** (opción A del comparador) | Byron |

## Cómo se eligió la tipografía

Se descartó elegirla de una lista de nombres: una tipografía puede leerse bien en un
catálogo y funcionar pésimo en un sitio de servicios. Se armó un comparador con la misma
frase, el mismo párrafo y el mismo teléfono en cuatro opciones, con el logo arriba, para
decidir viéndolo. Ganó **Archivo**.

Criterios que no eran de gusto y que la elegida cumple:

1. **Parecerse al logo.** Condensada, pesada, versalitas. Hoy no se parece en nada.
2. **Números legibles y de buen tamaño.** El teléfono es la conversión principal del sitio.
3. **Acentos y ñ bien resueltos.** Es un sitio en español de Costa Rica.
4. **Aguantar 17px de texto corrido en celular**, que es de donde viene la mayoría del
   tráfico. Muchas condensadas se ven bien en titular y son ilegibles en párrafo — por eso
   la familia de texto tiene que ser el corte normal de la misma familia, no otra distinta.
5. **No ser de las más usadas de la web**, o se cambia un molde por otro. Barlow quedó
   descartada por esto: encaja perfecto en concepto —sale de la señalética vial— pero
   está en más de 625.000 sitios.

## Lo que se ejecutó (2026-09-01)

- Bricolage Grotesque + Instrument Sans → **Archivo** en las 7 páginas. Una sola familia
  variable: `font-stretch` 68% para el h1, 76% para titulares y piezas de display, 100%
  para el cuerpo. Cuerpo a 17px, razón display:cuerpo de 5,2x.
- El h1 pasa a versalitas. Es el único que va en caja alta.
- **Cero numeración**: fuera las etiquetas `01`–`05` de sección, los números de las filas
  de servicio, los números gigantes de las bandas y los rótulos "PASO 01".."PASO 04".
- **Cero líneas divisorias**, verificado midiendo en las 6 páginas: ningún borde visible
  de más de 200px. Se quitaron también dos rejillas de 1px (`.facts` y `.steps`), que son
  la misma línea con otro nombre, y la raya inferior de la cabecera, que salía en todas
  las páginas.
- Listas separadas por **franjas alternas** (papel / papel-2, y pizarra / pizarra-2 en las
  secciones oscuras). Contraste medido: 14,9:1 los títulos y 5,1:1 los párrafos sobre la
  franja tintada; 11:1 sobre la oscura.
- Tic 2 eliminado: "manos ticas" ya no va en naranja dentro del titular.
- Tic 4 eliminado: las siete señales de alarma dejan de ser recuadros con borde y pasan a
  leerse como lista, igual que "quiénes nos contratan".

**Se conservan** los bordes que no son divisores: los campos del formulario (un campo sin
borde no se ve), el contorno de los botones fantasma, y los separadores internos del panel
de chat, que es una interfaz compacta y no una página.

## Segunda pasada (2026-09-01, misma fecha)

- **Tic 1 eliminado.** Fuera la píldora del titular. El titular pasa a ser
  "Su tanque séptico, atendido **hoy mismo**", con "hoy mismo" solo en su renglón —
  énfasis de posición, no de color, que es el sistema del §4. La promesa acotada
  ("atendemos emergencias el mismo día") abre el párrafo en negrita.
- **Tic 5 conservado** por decisión de Byron: la jerarquía de los dos botones da igual.
  Queda como excepción consciente.
- El cuadrito naranja (`.dot`) desaparece del CSS: ya no lo usaba ninguna página.

Con esto el catálogo de tics queda **todo ausente salvo el 5**, que está justificado
arriba como decisión del cliente.

---

## 12. El documento de cotización

Pendiente del visto bueno de Byron. Nada de esto está maquetado todavía.

### 12.1 Referencias leídas

**Referencia A — plantilla "Borcelle" (Canva), factura en español**

A4 vertical sobre blanco. Dos olas azules degradadas, arriba y abajo, que se
comen cerca del 28 % del papel. Logo circular y marca en versalitas espaciadas,
arriba a la derecha. Debajo, dos bloques de datos enfrentados: *Datos del
cliente* alineado a la izquierda, *Datos de la empresa* alineado a la derecha,
cada línea etiquetada (`Nombre:`, `Dirección:`, `Mail:`, `Teléfono:`). Fecha en
negrita sobre la tabla. Encabezado de tabla en azul marino con las celdas
separadas por huecos blancos. Filas separadas por filetes negros finos, sin
zebra. Abajo de la tabla, dos columnas: condiciones de pago y nota a la
izquierda; escalera Subtotal / IVA / IRPF / **Total** a la derecha. Firma con
línea, a la derecha. Sans geométrica con letter-spacing generoso en el cuerpo.

**Referencia B — plantilla "Saldo Apps", factura**

A4 sobre blanco puro, sin ornamento. Logo azul brillante a la izquierda, título
en negrita a la derecha. Metadatos a la derecha, en pares etiqueta/valor de
tipografía diminuta y gris. Tres bloques de direcciones (*De*, *Cobrar a*,
*Envíe a*) con el nombre en negrita y el resto en gris pequeño. Barra de
encabezado de tabla azul continua, con las etiquetas en mayúsculas de unos 7 px
y mucho letter-spacing. Filas con zebra azulada muy tenue. Dentro de la celda de
descripción hay **dos niveles**: nombre en negro y párrafo explicativo en gris
más pequeño. Números alineados a la derecha. Escalera de totales con la última
cifra sobre un fondo gris azulado. Firma manuscrita en azul.

### 12.2 Qué tomo y qué no

| De | Tomo | Porque para este negocio |
|---|---|---|
| A | Los dos bloques de datos enfrentados, cliente y empresa | Es la convención del documento comercial en español. El dueño la reconoce sin que nadie se la explique. |
| A | El pie partido: condiciones a la izquierda, montos a la derecha | Separa lo que se lee una vez de lo que se busca con el dedo. |
| A | La firma con línea | Una cotización de servicio en Costa Rica se firma. Sin eso no se ve formal. |
| B | Etiquetas diminutas en mayúsculas sobre valores grandes | Es lo que hace que un documento se vea *de sistema* y no *de plantilla*. Es también el contraste de anchos que ya usa el sitio. |
| B | Dos niveles dentro de una celda: dato arriba, explicación gris abajo | Calza exacto con nuestro problema: hay que decir **de qué depende** el precio, no sólo cuánto es. |
| B | Números alineados a la derecha, `tabular-nums` | Sin esto, ₡96.000 y ₡135.000 no se comparan de un vistazo. |

| De | No tomo | Porque |
|---|---|---|
| A | Las olas azules degradadas | Es la firma de la plantilla de Canva, no de la empresa. Se comen un cuarto del papel, imprimen sucio y gastan tinta. Quien haya visto otra factura hecha en Canva reconoce la ola. |
| A | El letter-spacing amplio en el cuerpo | Estorba para leer cifras, que es el 80 % de para qué se abre este papel. |
| A | El encabezado de tabla partido en celdas con huecos | Ruido decorativo; una barra continua dice lo mismo. |
| B | El azul brillante | No es nuestra marca. Va el naranja del logo, y con la misma tacañería que en el sitio. |
| B | La zebra | Con cinco filas no aporta nada. |

### 12.3 El problema que ninguna referencia resuelve

Las dos son **facturas**: concepto × cantidad × precio = total. Nuestra
cotización no es eso. Es **un rango** — ₡96.000 a ₡135.000 — más el porqué de ese
rango.

Copiar la tabla de factura línea a línea sería fingir una precisión que no
tenemos, y eso se paga después: el cliente lee ₡96.000 como precio cerrado, llega
el camión, cobra ₡128.000 y la empresa queda de mentirosa.

Decisiones que salen de ahí:

- **No hay columnas de cantidad ni de precio unitario.** No existen.
- **La tabla lista las respuestas que dio el cliente**, no artículos: tipo de
  propiedad, hace cuánto se limpió, acceso del camión, zona. Cada una con su
  explicación gris debajo, al estilo de la referencia B.
- **La cifra grande del documento es el rango**, no un total. Va sola, sin nada
  compitiendo a la par.
- **Debajo del rango, en el mismo bloque, la frase que lo acota**: el precio en
  firme se confirma antes de salir, gratis y sin compromiso.
- **Vigencia visible** (15 días), porque un rango sin fecha de caducidad es una
  promesa abierta.

### 12.4 Sistema visual

Todo sale de las secciones 4 y 5 de este documento; no se inventa nada nuevo.

| Elemento | Decisión | Origen |
|---|---|---|
| Papel | Blanco `#ffffff`, no el papel cálido del sitio | Se imprime y se manda por WhatsApp. El papel cálido en una impresora se ve sucio. |
| Banda de identidad | Una franja naranja sólida de 6 mm arriba, a sangre | Reemplaza la ola de la referencia A: mismo trabajo (identificar el documento de un vistazo), un solo color plano, sin degradado. Es el naranja del costado del camión. |
| Titular `COTIZACIÓN` | Archivo 800, `font-stretch` 68 %, versalitas | Igual que el `h1` del sitio (§4). Es el rótulo del camión. |
| Etiquetas | Archivo 500, 100 %, mayúsculas, 8 pt, `letter-spacing .14em` | De la referencia B. |
| Cifra del rango | Archivo 800, 68 %, ~32 pt | Único elemento grande del documento aparte del titular. |
| Cuerpo | Archivo 400, 100 %, 9.5 pt | §4. |
| Naranja | Franja superior, número de cotización, filete bajo el rango | ~3 % de superficie, igual que en el sitio (§5). |
| Filetes | `#e0dbd4`, 0.5 pt | La regla de "cero líneas divisorias" (§7) **no aplica acá** y queda declarado como excepción: en un documento impreso de una página no hay franjas alternas que hagan el trabajo, y una tabla de datos sin filetes se lee mal en papel. Es la referencia A justificándolo. |
| Formato | A4 vertical, márgenes 16 mm | Es el papel que hay en cualquier oficina de Costa Rica. |

### 12.5 Datos que van en el documento

**De la empresa** (fijos, en el código): nombre legal Grupo Ticos Sanitarios
S.A., cédula jurídica *(falta)*, teléfonos 2440-1110 / 2265-4150, WhatsApp
8341-7547, correo info@sanitariosticos.com, sitio, sedes.

**Del cliente** (de lo que él mismo dio): nombre, teléfono, zona. Nada más — no
se le pide dirección exacta ni correo para poder emitir la cotización, porque
cada campo obligatorio de más es gente que abandona.

**De la cotización** (calculados): número `COT-2026-0000`, fecha de emisión,
fecha de vencimiento, servicio, las cuatro respuestas con su explicación, el
rango, y el sello de tarifas provisionales mientras lo sean.

### 12.6 Cómo se genera

Una página propia, `cotizacion.html`, que se abre con la cotización ya cargada y
está hecha para imprimirse. De ahí salen las tres cosas que se pidieron:

- **PDF** — «Imprimir → Guardar como PDF» en cualquier navegador o teléfono.
- **Imagen de alta calidad** — captura de la misma página.
- **Enlace** — la dirección se puede pegar en WhatsApp, y el cliente la abre sin
  instalar nada. Esto es además lo que después va a permitir unificar los
  canales: la cotización deja de ser un archivo suelto y pasa a ser una
  dirección única con dueño.

**Riesgo a resolver antes de maquetar:** los números son correlativos
(`COT-2026-0007`), así que quien tenga uno puede adivinar los demás y leer
nombres y teléfonos de otras personas. La dirección tiene que llevar además una
llave aleatoria — `/cotizacion?n=COT-2026-0007&k=<24 caracteres>` — guardada en
la fila. Sin la llave, no se muestra nada.

### 12.7 Prueba del logo

Si a este documento se le cambia el logo por el de una veterinaria, ¿sigue
sirviendo? Sí en la estructura — cualquier cotización de servicio se ve así — y
**no** en el contenido: la tabla de "de qué depende el precio" con propiedad,
último servicio, acceso del camión y zona es de este oficio y de ningún otro.
Ahí es donde el documento es de Sanitarios Ticos y no de nadie.

## 13. El panel

No es una página de venta y no se diseña como tal, pero tampoco es un
tablero genérico: quien lo abre todos los días tiene que reconocerlo
como de la misma empresa. Lo que se mantiene del sistema es la
tipografía (Archivo), el naranja y el papel; lo que se suelta son las
animaciones, el menú y el ritmo pausado de las secciones.

**Decisiones**

- **Ancho 78rem, no 62.** Acá se comparan columnas; el ancho de lectura
  cómoda no aplica.
- **Sin librería de gráficas.** Las barras son divs con ancho en
  porcentaje y la serie de 30 días es un `<svg>` de sesenta rectángulos
  escrito a mano. Traer 90 KB de JavaScript para dibujar eso costaría
  más que toda la página junta, y el sitio no tiene paso de compilación.
- **La cifra grande es "sin atender".** Un tablero que abre con
  "ingresos del mes" se mira; uno que abre con lo que está esperando
  obliga a hacer algo. Es la única tarjeta que cambia de color.
- **Las tres columnas de trabajo van fijas a la derecha.** Estado, nota
  y contacto no se van al arrastrar la tabla. Tener que ir a buscarlas
  es exactamente lo que hace que las cosas se queden sin atender.
- **El estado es un `<select>` nativo.** En el teléfono abre la rueda
  del sistema, que es más rápida que cualquier menú dibujado.
- **El verde de WhatsApp se usa tal cual** (`--wa`), aunque no sea del
  sistema. Es señalización, no decoración: se reconoce antes de leerlo.


## 14. El panel, segunda versión

La primera versión del panel se hizo sin referencia. Se nota, y se nota
en el mismo lugar donde ya se había notado antes: **la tipografía de
etiqueta en mayúsculas rastreadas**. En el documento de cotización el
propietario la señaló como "tipografía de IA" y se dejó en un solo
lugar. En el panel volvió a aparecer en cuatro (`.tarjeta-t`,
`.nueva-t`, `.hecha-num`, el `th` de las tablas), más dos usos de
`font-stretch: 112%` en las cifras.

No es casualidad que reaparezca: es lo que sale por defecto cuando no
hay de dónde sacar el criterio. Por eso esta versión sí tiene
referencia.

### 14.1 La referencia leída

**Panel de control de Kinsta** (captura entregada por el propietario).
Es un tablero de hosting: nada que ver con tanques sépticos, y por eso
mismo sirve — lo que se toma es el sistema, no el rubro.

Lo que hay, medido a ojo sobre la captura:

- **Una barra lateral oscura fija**, de un azul muy profundo, con el
  logo arriba y ocho destinos con icono. El activo se marca con una
  píldora clara y el icono relleno. No hay pestañas en ninguna parte.
- **Fondo de página gris azulado muy claro; tarjetas blancas puras.**
  Las tarjetas **no tienen borde ni sombra visible**: se separan del
  fondo por contraste de valor, nada más.
- **Sin mayúsculas rastreadas en ningún título.** "Sus Sitios", "Uso de
  Recursos", "Notificaciones" van en caja normal, semibold, del mismo
  tamaño que el cuerpo o un punto más. La única excepción en toda la
  pantalla son los encabezados de columna de la tabla —"NOMBRE",
  "VISITAS"— en gris, chiquitos.
- **Cabecera de tarjeta de dos partes:** título a la izquierda, acción o
  rango de fechas a la derecha en gris. Se repite idéntica en las tres
  tarjetas de arriba.
- **Las cifras grandes van arriba de su gráfica, alineadas a la
  izquierda**, en el color de acento. "42.63 MB" y "284" pesan unas 2,3
  veces el cuerpo. Peso semibold, sin condensar ni expandir.
- **Filas separadas por líneas de un pixel**, sin cajas, sin radios.
- **Un solo acento** (violeta) más un segundo color de dato (turquesa)
  que sólo aparece dentro de las gráficas.
- **Lo que NO hay:** ni bordes, ni sombras, ni iconos decorativos, ni
  degradados, ni una sola caja con borde de 1px.

### 14.2 Qué tomo, qué descarto

| | |
|---|---|
| **Tomo** | La barra lateral oscura fija como única navegación. Las tarjetas blancas sin borde sobre fondo tintado. La cabecera de tarjeta título-izquierda / acción-derecha. La cifra grande arriba de su gráfica. Las líneas hairline en vez de cajas. Un acento y un color secundario de dato. |
| **Descarto** | El violeta y el turquesa: son la marca de Kinsta. La dona de consumo — mide cuota contra un tope contratado, y acá no hay cuotas; una dona sin denominador es decoración. La burbuja de chat flotante, que es su producto de soporte. La grotesca geométrica: el sitio ya tiene Archivo, sacada del rótulo del camión, y esa sí es del cliente. |
| **Traducido** | El azul profundo de la barra pasa a `--slate` (#1f2c33), que ya existe y es el gris azulado de la carrocería. El violeta pasa a `--orange`. El fondo gris azulado pasa a `--paper-2`, el papel tibio del sitio. La tarjeta blanca pasa a `--paper`. |

### 14.3 Decisiones

- **Barra lateral en vez de pestañas.** Las pestañas obligan a recordar
  cuál está activa y se apilan en dos líneas en el teléfono. La barra
  pone los cuatro destinos siempre a la vista y siempre en el mismo
  sitio. En pantallas angostas baja a una barra inferior fija, que es
  donde el pulgar ya busca.
- **Cero bordes en las superficies.** La versión anterior tenía
  `border: 1px solid var(--line)` en tarjetas, tablas, cola, formulario
  y resultado — todo. Es el tic 12 del catálogo con borde en vez de
  sombra. Las tarjetas se separan por contraste; las líneas de 1px
  quedan sólo **entre filas**, que es donde separan datos.
- **Mayúsculas rastreadas: un solo lugar.** El encabezado de columna de
  la tabla, igual que en la referencia. Todo lo demás en caja normal.
  Se elimina `font-stretch` de las cifras: la referencia las pone en
  semibold sin deformar, y deformar un tipo variable "porque se puede"
  es exactamente lo que delata al generador.
- **Todo número es un filtro.** Es lo que pidió el propietario con
  "dashboard interactuable", y es también lo más predecible: si en la
  pantalla dice 2 sin atender, tocar ese 2 tiene que llevar a esas dos.
  Se vuelven tocables las tarjetas de cifra, las barras de los
  desgloses (servicio, provincia, estado) y las barras del calendario.
  Cada una lleva a la lista ya filtrada.
- **Se quita el aviso de tarifas provisionales.** Lo pidió el
  propietario: él sabe que lo son. Se queda dentro del documento que ve
  el cliente, que es donde importa, y en el resultado al crear una
  cotización desde el panel.

### 14.4 Excepciones al catálogo de tics

> **Tic 12 (radio uniforme).** Se usa un radio de 6px en tarjetas y
> botones, uniforme. La referencia lo tiene así y en una herramienta de
> trabajo la uniformidad **es** la función: nada acá compite por
> atención, todo es del mismo rango. El sitio público sigue con radio 0.
> Sombras: ninguna, como en la referencia.

> **El `th` en mayúsculas rastreadas.** Se mantiene en ese único lugar
> porque la referencia lo hace exactamente ahí y en ningún otro, y
> porque es la misma resolución a la que se llegó en el documento de
> cotización (§12).

### 14.5 Segunda referencia — Linear (linear.app), medida

Kinsta da la estructura de un tablero. Lo que no da es cómo se comporta
una herramienta que alguien tiene abierta ocho horas. Para eso se midió
Linear, que es el caso canónico. Tres hallazgos, todos contra la
medición y no de memoria:

**1. Toda la interfaz corre a 13px.** Cuerpo, enlaces, botones, ítems de
lista y hasta los `h3`: 13px, una sola familia (Inter). Sólo los
titulares de marketing suben a 40–48px. En una herramienta la interfaz
es chica y callada; lo grande se reserva para el dato.

**2. La jerarquía la carga el peso, no el tamaño — y en medio paso.**
400 para todo, **510** para lo enfatizado. No 700, no 800. La diferencia
entre un ítem normal y uno importante es casi imperceptible y aun así
funciona, porque no compite con nada más.

**3. El acento ocupa casi nada.** El amarillo ácido de Linear suma 207
unidades de área contra 156.434 del texto: **el 0,13%**. Todo lo demás
son tres grises casi idénticos (#08090a, #0f1011, #161718), separados
por siete puntos. La profundidad sale de esos escalones, no de bordes
ni de sombras.

**Traducido a este panel.** El tercer punto es el que corrige el error
real de la primera versión: había naranja en las tarjetas, en las
cifras, en las barras, en los botones y en la píldora activa. El naranja
vuelve a ser lo que era en el sitio — la señal de "esto se toca" o "esto
urge" — y nada más.

Los tres escalones de fondo ya existen en el sitio y son tibios en vez
de negros: `--paper` (#faf7f2), `--paper-2` (#f3ece2) y `--paper-3`
(#e9dfd1). Se usan igual que Linear usa sus tres negros.

De la escala: la interfaz del panel corre a 13–14px con Archivo en 400,
y 500 para lo enfatizado. Las cifras grandes se quedan grandes porque
son el dato, pero bajan de 800 a 600 y pierden el `font-stretch`. El
tracking se hace negativo y crece con el tamaño, como en Linear: −0,01em
en la interfaz, −0,025em en las cifras.

### 14.6 Auditoría de la v2

**Catálogo de tics.** Los doce, uno por uno:

| | |
|---|---|
| 1 píldora sobre el titular | ausente |
| 2 palabra de acento en el titular | ausente |
| 3 etiqueta de sección numerada | ausente |
| 4 grid de chips con borde de 1px | las marcas de "Provincia: Alajuela" no llevan borde y **no son decorativas**: dicen qué filtro está puesto y se quitan tocándolas. Es estado, no adorno |
| 5 par de botones relleno + fantasma | **estaba y se quitó.** Había un `[Filtrar]` fantasma junto a un `[Descargar CSV]` relleno, además con la jerarquía al revés: filtrar se hace mil veces al día y el CSV casi nunca. Ahora los filtros se aplican al cambiarlos y no hay botón; queda un solo botón discreto para el CSV |
| 6 subrayado de color como énfasis | los subrayados son de enlaces y botones de texto, en gris, no en el acento |
| 7 tres cards con icono en círculo | ausente |
| 8 degradado o vidrio | ausente |
| 9 divisor SVG | ausente |
| 10 fade-in-up en todo | la única animación es el destello al guardar una celda, que marca un cambio real, y respeta `prefers-reduced-motion` |
| 11 copy de agencia | "Lo que está esperando", "Ya la atendí", "Dónde para el camión" |
| 12 radio uniforme + sombra | radio 6px declarado como excepción en §14.4; sombras, ninguna |

Comprobado además contra el archivo: `text-transform: uppercase` aparece
**una sola vez** (el `th` de la tabla), `font-stretch` sólo en la regla
que lo devuelve a normal, y el único `border: 1px` es el del campo de
nota, que es la señal de que se puede escribir ahí.

**Prueba del logo.** Cambiando el logo y los textos, la estructura
—barra lateral, tarjetas, tabla— sigue sirviendo, y eso es correcto:
un tablero interno se juzga por si se entiende rápido, no por si es
irrepetible. Lo que sí es de este cliente es todo lo demás: el fondo de
papel tibio en vez del gris azulado de tablero, el `--slate` de la
carrocería en la barra, el naranja del rótulo, y Archivo. Cambiados
esos cuatro, queda un tablero cualquiera — que es justamente la prueba
de que están trabajando.

**Prueba del hermano.** No hay otro tablero en `~/Paginas Web`, así que
no hay molde del que salga. Contra el propio sitio público sí hay
diferencia deliberada y documentada: allá el h1 va condensado al 68%,
peso 800 y en versalitas, como está pintado el tanque; acá los títulos
son texto normal. Una herramienta de trabajo no lleva tipografía de
rótulo — y ese h1 heredado era buena parte de lo que se sentía mal en
la v1.


## 15. El panel, tercera versión — impacto y teléfono

### 15.1 La tercera referencia: Vuesax

Tablero de administración oscuro, en índigo profundo con líneas de neón.
Lo que se leyó de la captura:

- Fondo índigo muy oscuro, tarjetas un escalón más claras, radios ~10px,
  sombra suave, sin bordes.
- **Tarjeta de cifra con tres partes:** un chip de icono en cuadrado
  redondeado arriba, el número grande, la etiqueta, y **una línea de
  tendencia sangrada hasta el borde de abajo**.
- **Un aro grande con el porcentaje en el centro**, y debajo un pie de
  dos celdas separadas por una línea.
- Cada tarjeta de cifra en un color distinto: morado, verde, rojo,
  naranja.

**Tomo:** el chip de icono, la línea de tendencia sangrada, el aro con
su pie de dos celdas, y el fondo oscuro con la tarjeta un escalón
arriba.

**Descarto:** el índigo y los degradados de neón —son la marca de
Vuesax y son también lo que hace que todos los tableros de plantilla se
sientan hermanos— y el color distinto por tarjeta, que es el
antipatrón de "ocho tonos categóricos cuando la historia es un número".

**Traducido:** el modo oscuro se construye con el slate de la
carrocería en tres escalones (#10171b fondo, #1a242a tarjeta, #24313a
realce), no con el morado de nadie. Las cuatro tarjetas comparten el
mismo naranja.

### 15.2 La regla de la línea de tendencia

Sólo la llevan **las dos tarjetas que cuentan entradas en el tiempo**
("Hoy" con catorce días, "Últimos 30 días" con treinta). Las otras dos
—un estado ("sin atender") y una suma ("embudo abierto")— no tienen
serie, y dibujarles una tendencia inventada en una herramienta de
trabajo es peor que dejar el número solo.

Que dos tarjetas la lleven y dos no, no es un descuido: es la regla
hecha visible. Cuando existan los históricos de estado, las otras dos
la tendrán.

### 15.3 El modo oscuro no es el claro invertido

Los tokens del modo oscuro están escogidos aparte, y los colores de
dato se volvieron a validar contra la superficie oscura. El naranja de
marca (#ef6511) **se sale de la banda de luminosidad del modo oscuro**
por un punto; la serie usa #ec6618, que es el mismo naranja corrido lo
mínimo para entrar, con #5990cf de segunda serie. Las cinco
comprobaciones pasan.

### 15.4 En el teléfono no hay tabla

Una lista de diez columnas en 375px obliga a arrastrar de lado hasta el
final para llegar al botón de WhatsApp — que es lo único que uno vino a
tocar. Debajo de 720px cada registro es una **ficha**: el nombre de
titular, los datos apilados con su etiqueta, la nota a lo ancho, y los
dos botones del tamaño de un dedo.

No son dos maquetados en paralelo: se dibuja uno o el otro según el
ancho, y se vuelve a dibujar si la ventana cruza el límite.

### 15.5 Las palabras

"Actualizar", "Salir" y la hora exacta eran tres etiquetas de texto que
no decían gran cosa. Ahora:

- La hora se cambió por **"Recién traído" / "Hace 3 min"**, que responde
  lo que uno de verdad quiere saber —si lo que está viendo está
  fresco— y se actualiza sola, así que la pantalla nunca dice que está
  al día cuando lleva media hora.
- "Actualizar" y "Salir" son **botones redondos de icono** con su
  título: en una herramienta de todos los días un icono conocido se
  toca más rápido que una palabra, y de paso liberan el ancho de la
  cabecera.

### 15.6 Excepción al catálogo

> **Tic 7 (fila de cards con icono).** Se usa: cada tarjeta de cifra
> lleva un chip de icono. La referencia que entregó el propietario lo
> tiene exactamente así, y acá los iconos distinguen cuatro métricas
> **distintas** de un vistazo en una pantalla que se mira todos los
> días — no son tres servicios con iconos decorativos. El chip es un
> cuadrado redondeado, no un círculo, y no hay tres columnas iguales.


## 16. Beto: el componente que delataba al sitio entero

Al buscar "qué se ve hecho por IA", el que aparecía no era el panel:
era el asistente. En un solo componente había **seis tics del
catálogo**, y está en las seis páginas.

| Qué tenía | Tic |
|---|---|
| Botón flotante en píldora con degradado naranja de tres paradas | 8 (degradado como identidad) |
| Cabecera del panel con degradado slate | 8 |
| Avatar circular con otro degradado naranja | 8 |
| Icono de **destello** ✨ como cara de Beto y como botón | — el glifo que significa literalmente "esto es IA" |
| Anillo que late en bucle infinito alrededor del botón | 10 (animación sin estado real) |
| Sombras difusas de color, `0 10px 24px rgba(naranja,.38)` | 12 |
| Radios de 999px, 22px y 50% en un sitio cuyo radio es 0 | 12 |

Eso no era el asistente de esta empresa: era el widget que trae puesto
cualquier sitio generado.

**Qué se hizo.** El destello se cambió por **la mascota del camión**,
que es lo único de acá que no puede estar en ningún otro lado. Los
cuatro degradados pasaron a color plano. El anillo que latía se
eliminó. Los radios bajaron a 0, como el resto del sitio. Las sombras
de color pasaron a sombras de tinta, más cortas.

El botón flotante de WhatsApp recibió el mismo trato: acompaña al de
Beto en la esquina, y si uno deja de ser píldora con degradado, el
otro también.

**Lo que NO se tocó:** la maquetación del sitio público, sus botones y
su tipografía de cartel. Están construidos contra el rótulo del camión
y funcionan; el problema era el widget pegado encima, no la página.


## 17. Cuarta pasada: sacarle la voz al tablero

Revisión del propietario sobre capturas marcadas. Lo que señaló, junto,
tenía un patrón: **el tablero hablaba en vez de mostrar.**

| Decía | Dice |
|---|---|
| "Recién traído" / "Hace 3 min" | **Actualizado 14:32** |
| "todo al día" | nada |
| "nadie lo ha tocado todavía" | el número de pendientes |
| "de lo ya resuelto" · "sin resolver" | nada |
| "Embudo abierto" | **Cotizado sin cerrar** |
| "desde ₡273 k, lo que todavía se puede cerrar" | **mínimo ₡273.000** |
| "₡387 k" | **₡387.000** |
| "Hoy" · "Últimos 30 días" | **Cotizaciones** · **Solicitudes**, sobre el rango escogido |
| "Hechas / Perdidas" | **Enviadas / Cerradas** |

"Embudo" era jerga de ventas que no significa nada para quien abre
esto todos los días. Las abreviaturas con k y M ahorran cuatro
caracteres y obligan a hacer una cuenta mental: en una pantalla de
plata se escribe la plata.

### 17.1 Tipografía: Inter

Archivo sale del rótulo del camión y es la tipografía de la marca. Es un
tipo de **cartel**: dibujado para leerse a diez metros y en cuerpos
grandes. Lo que hay en el panel son cifras chicas en tablas.

Inter está dibujada justo para eso —números de ancho fijo, formas
abiertas en cuerpos de 12 y 13px— y es la que usan Linear, Vercel y
Grafana. Que el sitio público y la herramienta usen tipografías
distintas es a propósito: hacen trabajos opuestos. Es la misma
conclusión de §15, llevada hasta el final.

### 17.2 Rango de fechas

Botones de 7 / 30 / 90 días, más dos campos de fecha para lo demás. El
rango manda sobre las dos cifras de conteo, el aro, la serie y los
cuatro desgloses.

**No manda sobre "Sin atender" ni sobre "Cotizado sin cerrar"**, y es
deliberado: una cotización de hace dos meses que nadie tocó sigue sin
atender hoy, y esconderla porque cae fuera del rango sería justamente
perderla. Son estado de hoy, no historia.

### 17.3 El porcentaje de cierre cambió de denominador

Antes era `hechas / (hechas + perdidas)` — sobre lo ya resuelto. Ahora
es `cerradas / enviadas`, que es lo que pidió el propietario y es la
lectura que no se infla sola: con el denominador viejo, dejar
cotizaciones abiertas para siempre mejoraba el número.

### 17.4 La asimetría eran 16 píxeles

Las dos cosas que el propietario marcó —la tarjeta de "Estado" más alta
que sus vecinas, y "Pendientes" sin cerrar parejo con "Cierre"— eran el
mismo error: la regla `.tarj + .tarj { margin-top: 1rem }` se colaba
dentro de las rejillas y le restaba 16px de alto a toda tarjeta que no
fuera la primera de su fila. Ahora está limitada a los bloques apilados
de la vista.


## 18. Sistema de estados, y el conflicto con el naranja

El brief de rediseño pide dos cosas que en este proyecto chocan:

> 🟠 Naranja: pendiente, requiere atención, próximo a vencer
> 🔵 Color corporativo: botones principales, elementos activos

Eso funciona cuando el color de la empresa es azul. **Acá el color de
la empresa es el naranja**, sacado del rótulo del camión. Si el naranja
significara además "hay un problema", el color de Sanitarios Ticos
estaría gritando alarma en cada pantalla del panel — y al mismo tiempo
dejaría de señalar dónde se toca, porque estaría en todos lados.

**Resuelto así:** el naranja es **acción** y nada más. Los cinco
estados usan una familia aparte, y el de espera usa ámbar, medido a
26° de tono del naranja de marca para que no se confundan.

| Estado | Claro | Oscuro | Contraste |
|---|---|---|---|
| Hecha (ok) | `#e7f3ea` / `#136c3a` | `#63d69b` | 5.69 / 8.74 |
| Contactada, Agendada (curso) | `#e8eefb` / `#1f56a3` | `#8ab8ef` | 6.19 / 7.66 |
| Sin atender (espera) | `#f8f0d0` / `#736213` | `#e2ac5a` | 5.27 / 7.73 |
| Vencido (mal) | `#fbeae9` / `#a82a2a` | `#ef9084` | 5.96 / 6.76 |
| Perdida (off) | `#ece7e0` / `#655c53` | `#93a1a9` | 5.32 / 5.95 |

Todos pasan 4.5:1 sobre su propia pastilla. Y ninguno depende sólo del
color: cada pastilla lleva un punto y su palabra, porque quien no
separa el verde del rojo tiene que poder leer el estado igual.

### 18.1 Los rótulos de grupo de la barra

El brief los pide en versalitas (`PRINCIPAL`, `GESTIÓN`). Van en caja
normal: es la tercera vez que aparecería esa tipografía, y el
propietario ya la señaló dos veces como tipografía de máquina. El
grupo se entiende igual con el rótulo en minúscula y el aire de
arriba.

### 18.2 "Nueva cotización" sale de la navegación

Estaba como sexto destino de la barra. No es un destino: es la acción
principal. Pasó a botón sólido naranja en la cabecera —el único
elemento sólido de ese color en toda la pantalla— y de paso la barra
del teléfono bajó de seis casillas a cinco, que es donde se vuelve
cómoda.


## 19. Estados de carga, de vacío y de error

Tres momentos que casi siempre se dejan de último y son los que
deciden si una herramienta se siente terminada.

**Cargando.** Se dibuja la forma de lo que viene, no la palabra
"Cargando". Así la pantalla no salta cuando llegan los datos y se ve de
una qué tan larga va a ser la lista. Los bloques laten en opacidad, sin
el barrido de brillo que traen las librerías — respeta
`prefers-reduced-motion` por la regla general de §17.

**Vacío.** No es lo mismo *"todavía no ha entrado nada"* que *"el
filtro no encontró nada"*: lo primero se arregla esperando y lo segundo
quitando el filtro. Decir "no hay nada" para las dos deja a uno sin
saber cuál es. Cada lista distingue las dos, y el gráfico sin datos lo
dice con palabras en vez de dibujar treinta ceros, que no se leen como
"no hay nada" sino como "está roto". Las líneas de tendencia
desaparecen cuando su serie está en cero: una línea plana pegada al
borde parece un dato.

**Error y confirmación.** Fuera el `alert()` del navegador, que congela
la página, se ve igual en todas las webs del mundo y no dice dónde
pasó. En su lugar, un aviso que aparece abajo, no tapa nada y se va
solo a los 3,6 segundos.

## 20. Teclado

- **Foco propio y visible**: contorno naranja de 2px con separación. El
  del navegador se perdía sobre los fondos oscuros. Va con
  `:focus-visible`, así que aparece al navegar con teclado y no al
  hacer clic.
- **La hoja modal atrapa el tabulador** mientras está abierta y
  **devuelve el foco** a donde estaba al cerrarse. Sin lo primero el
  foco se va a la página de atrás, que está tapada; sin lo segundo
  queda en el aire.
- Ningún botón de sólo icono se quedó sin nombre accesible: se
  comprobó contra el archivo, no a ojo.
- Ningún estado depende sólo del color — cada pastilla lleva punto y
  palabra.


## 21. Frank

### 21.0 Se rehizo con el original

El propietario entregó después el **PNG con transparencia de verdad**:
29.413 píxeles semitransparentes, o sea bordes suavizados. Todo el
corte se rehízo desde ahí. Lo de abajo queda como registro de qué se
hizo mientras sólo estaba el JPEG, y de por qué una captura de un PNG
no sustituye al PNG.

### 21.1 El archivo llegó sin transparencia

El dibujo entregado es un **JPEG**, y el JPEG no guarda transparencia:
el cuadriculado que se ve no es transparencia, son píxeles grises y
blancos pintados. Es una captura de pantalla del PNG original.

Se reconstruyó con **relleno por inundación desde los bordes**: se
arranca en el marco, se avanza por los píxeles neutros y claros, y el
contorno negro del dibujo hace de dique. Por eso no le abre huecos por
dentro aunque tenga blancos (los dientes, los ojos) y grises (la
camisa, el pelo) — un recorte por color sí lo habría perforado.

Salió el 81% de la imagen. El resultado se comprobó compuesto sobre el
naranja y sobre el fondo oscuro: sin halo y sin huecos.

**Sigue siendo preferible el PNG original.** Esto es una
reconstrucción, y en los bordes carga lo que el JPEG ya había
degradado.

### 21.2 No va dentro del botón: se para encima

Un muñeco de 26px encogido dentro de la píldora es una mancha. Frank
mide **74px de alto sobre un botón de 46**: se para en el borde de
abajo y saca la cabeza y el brazo por arriba.

Empezó más grande —90 sobre 50, con el botón de 216px— y se apretó
porque los dos flotantes viven sobre el contenido y a ese tamaño le
quedaban encima a una columna entera de datos. El ancho del botón
(11,75rem) sale de la cuenta y no del ojo: la etiqueta mide 114px,
Frank y su aire se comen 3,25rem y quedan 1,2rem de margen.

Eso usa el dibujo por lo que es —una figura de cuerpo entero saludando—
en vez de recortarlo a una cara, y le da al botón algo que ningún sitio
genérico tiene. En el teléfono el botón se encoge a un círculo de 50px
y Frank se queda parado encima igual: ahí él **es** el botón.

### 21.3 El saludo

Son **dos capas** —cuerpo y brazo— cortadas del dibujo y exportadas en
el mismo lienzo, así que se apilan con `inset: 0` y el hombro cae
siempre en el mismo punto. El brazo gira sobre ese hombro
(`transform-origin: 69.2% 35.3%`, medido sobre el original).

Dos cosas que costaron y quedan anotadas:

- **El giro va sólo hacia afuera**, de 0° a −17°. Hacia adentro la mano
  se le mete en la gorra.
- **El borde de la gorra se colaba en la capa del brazo** y al girar
  aparecía una lasca azul oscura al lado de la cabeza. El corte excluye
  todo lo que quede a la izquierda de x=305 por encima de y=210, que es
  donde el brazo ya no está.
- **El corte recto se veía.** La primera versión partía el hombro con
  una línea vertical, y al girar el brazo quedaba a la vista. Ahora el
  corte sigue la **costura de la manga**: se detecta por color dónde
  empieza la piel en cada fila —el gris de la camisa y el durazno del
  brazo se separan solos— y se corta cinco píxeles antes para llevarse
  el contorno. La manga se queda en el cuerpo y tapa la juntura. El
  hueco que queda debajo se pinta del gris de la camisa sin salirse de
  la silueta, así que si algo asoma, asoma hombro.

### 21.3b El parche gris sobre el fondo claro

Frank sobresale 40px del botón, así que **el hombro queda por encima
del botón, contra el papel de la página**. Ahí el relleno gris con que
se tapaba el hueco se veía como un parche pegado — un bloque de color
plano sin contorno, flotando junto al brazo.

La corrección no fue rellenar mejor: fue **dejarle al cuerpo el
contorno oscuro del brazo**. Ahora la piel se va con la capa que gira y
la línea se queda, así que el hombro termina en un trazo dibujado y no
en un corte de color. Ya no hace falta ningún relleno.

Además las dos capas **se solapan tres píxeles**: el brazo se lleva un
poco de más hacia adentro pero el cuerpo no lo suelta. Ese solape es lo
que evita que al girar se abra una rendija entre la piel y el hombro.

### 21.3c La caché de un año

`_headers` sirve `/assets/img/*` con `max-age=31536000, immutable`, y
el propio archivo dice por qué: **las imágenes cambian de nombre cuando
cambian**. Sobrescribirlas con el mismo nombre deja a quien ya visitó
el sitio con la versión vieja durante un año.

Por eso las capas de Frank llevan sufijo (`frank-cuerpo-2.webp`). Si
hay que retocarlas otra vez, sube el número — no se sobrescriben.

### 21.3d El avatar de la cabecera

El primer recorte era sólo la cara, y encima cortaba la gorra arriba y
el mentón abajo: adentro de un círculo se leía como una foto mal
encuadrada.

El recorte bueno lleva **gorra completa, cara, hombros y el pecho con
el logo** — que es lo que pidió el propietario — y deja **la mano
levantada fuera del cuadro**. Con la mano adentro, el círculo la
cortaba por la mitad y ese pedazo suelto se leía como una mancha.

El avatar subió de 34 a 40px: a 34 el torso no se distinguía.

### 21.3e La solución definitiva: el codo, no el hombro

Todo lo de arriba fueron parches a un problema mal planteado. Cortar
por el hombro obliga a dejarle al cuerpo **un hueco con la forma exacta
del brazo en reposo**, así que cualquier giro lo destapa — y detrás de
ese hueco está el fondo de la página. Por eso reaparecía la juntura
por más que se afinara el corte.

**La gente no saluda desde el hombro: saluda desde el codo.** Cortando
ahí se resuelve solo:

- El hombro **no se mueve**, así que no hay nada que destapar.
- Si al girar se abre una rendija, detrás hay **piel del mismo brazo**,
  no fondo. Un error de un píxel deja de importar.
- El cuerpo conserva 22px por encima del corte, de modo que siempre hay
  material debajo del antebrazo.
- El borde del corte va **desvanecido en veinte píxeles**: como las dos
  capas son la misma piel, la transición no tiene línea que ver.

Y de paso el saludo mejora: ahora va **para los dos lados** (+12°,
−10°). Desde el hombro sólo podía abrirse hacia afuera, porque hacia
adentro la mano se metía en la gorra.

El pivote es `86.2% 28.8%`, medido sobre el dibujo.

### 21.4 Qué sí se nota a 44px y qué no

A tamaño de botón Frank mide 44×90: la cara son 14px y los ojos dos.
Se descartaron el parpadeo y el giro de cabeza — a esa escala son
ruido, no vida. Lo que sí se lee:

- El **saludo** (la mano recorre unos 8px).
- La **respiración**: pixel y medio, cada 4,2 segundos. No se ve, se
  siente.
- Que al **abrir el chat** baje el brazo y se meta detrás del botón en
  vez de desaparecer de un frame, que se lee como un error.

Si algún día Frank aparece más grande —dentro del panel del chat, o en
la página de contacto— ahí sí valen el parpadeo y el giro de cabeza.

Saluda tres veces y descansa cuatro segundos. Un muñeco que se mueve
sin parar deja de ser simpático a los diez segundos. Con
`prefers-reduced-motion` no se mueve.

**El hover no cambia la velocidad, sólo se salta la espera.** La
primera versión comprimía el ciclo entero —descanso incluido— de 6s a
1,4s, así que el gesto salía cuatro veces más rápido y la mano parecía
un limpiaparabrisas. Ahora hay dos keyframes: el ciclo largo, y el
mismo gesto solo, con los porcentajes reescalados (el 62% pasa a ser el
0 y el 90% el 100) y con la duración que ese tramo ocupaba dentro del
ciclo — 28% de 6s son 1,68s.

Comprobado posicionando las dos animaciones en instantes idénticos y
leyendo el ángulo: 0°, −13,1°, −17°, −7°, −4° a los 0, 120, 240, 360 y
480 ms en las dos. La respiración tampoco se acelera; el cuerpo no
tiene por qué cambiar de ritmo porque uno pase el mouse.

## 22. El cotizador público (/cotizar)

**El problema.** Hasta ahora sólo había dos puertas al precio: preguntarle a
Frank en el chat, o llenar el formulario de contacto y esperar a que alguien
escriba. La primera obliga a conversar con un robot; la segunda no da ningún
número. Faltaba la puerta del medio: contestar cuatro cosas y ver el monto.

**Referencia.** El propio sitio. No se fue a buscar afuera porque el sistema ya
estaba resuelto —papel cálido, tinta, naranja de acción, Archivo con eje de
ancho— y una página nueva con vocabulario propio se habría visto pegada. Lo
único que se tomó de fuera es la forma del cotizador de seguros y de envíos:
una pregunta a la vez, con el riel de pasos arriba para que se vea cuánto falta.

### 22.1 Una pregunta a la vez, no un formulario largo

Un formulario de diez campos se contesta sentado en una computadora. Esto se
contesta de pie en el patio, con el teléfono en una mano y viendo el tanque.
Por eso las respuestas son botones grandes (`.cot-op`, mínimo 3.4rem de alto) y
no `select`s: se aciertan con el pulgar.

Las excepciones son deliberadas. La provincia, el cantón y el distrito sí van
en `select` —son cientos de opciones, no caben en botones— y los datos
personales van en el formulario normal del sitio (`.form`, `.f`), porque
escribir un nombre es escribir un nombre.

### 22.2 El riel

Cuatro círculos numerados arriba de la caja. Es la única promesa que se le hace
a alguien que no sabe en qué se metió: esto se acaba en cuatro. El paso hecho
se marca con un ✓ en tinta; el vivo, con el naranja de acción.

El largo del riel cambia según el servicio: una trampa de grasa tiene precio de
tabla y no hay nada que preguntar sobre el trabajo, así que ese paso desaparece
y quedan tres. Antes de escoger servicio el riel muestra cuatro, porque casi
todos los servicios lo llevan y es peor que el riel se acorte bajo los pies.

En pantallas de menos de 600px las etiquetas se van y quedan sólo los números:
cuatro círculos caben, "Servicio · El trabajo · Dónde queda · Sus datos" no.

**Trampa pisada otra vez:** `[hidden]` pierde contra el `display: flex` de
`.cot-rail li`. Hay que escribir `.cot-rail li[hidden] { display: none }`.

### 22.3 El paso del trabajo se revela solo

La forma del tanque, el tamaño y la antigüedad viven en una sola pantalla, pero
el tamaño no aparece hasta que se escoge la forma, y la antigüedad no aparece
hasta que se escoge el tamaño. Es la misma cascada de provincia → cantón →
distrito, y por la misma razón: las medidas dependen de la forma.

Cambiar de servicio borra lo contestado del trabajo anterior. No es limpieza
cosmética: mandar la forma de otro servicio daría un precio equivocado sin que
nadie se diera cuenta. Es el mismo error que ya se había cometido en el panel
con el formulario que arrastraba el servicio anterior.

### 22.4 El resultado, y quién manda

El monto va en el corte de cartel (`--ancho-cartel`), del tamaño de un h1. Es
lo que la persona vino a ver.

Inmediatamente debajo, en la caja naranja suave, va lo que **no** se puede
esconder en letra chica: el monto es un estimado automático y **el precio
oficial lo da el encargado**. Está redactado en presente permanente, no como
una transición: no es que "por ahora" se confirme por teléfono y algún día el
número automático vaya a ser el definitivo. Nunca lo va a ser, porque en sitio
aparecen cosas que un formulario no ve. Decirlo como provisional sería mentir
sobre cómo funciona el negocio.

Esa misma redacción se replicó en las otras tres bocas por donde sale el monto:
el chat de Frank (`mostrarCotizacion`), el documento imprimible
(`cotizacion.html`, la nota del rango y las condiciones) y el correo de aviso
al encargado (`avisarCotizacion`), donde además el recordatorio ya no depende
de que las tarifas sean provisionales: sale siempre.

### 22.5 Fallar en voz alta

Si los endpoints no cargan, el cotizador no se queda girando: reemplaza la
lista de servicios por el teléfono y el WhatsApp. Si el envío falla, el mensaje
dice qué pasó y ofrece el 2440-1110. Una página de precios que se cae en
silencio es una venta perdida; una que dice "llámenos" es una venta por otro
canal.

## 23. La segunda tanda de fotos

Llegaron nueve fotos y dos videos del propietario. No se armó ninguna
sección nueva con ellas: se metieron en los huecos que el sitio ya tenía.

**Dónde entraron.**

| Foto | Dónde | Por qué ahí |
|---|---|---|
| `trampa-sotano` | banda de Trampas de grasa (servicios) y su fila en el inicio | Era la única banda con placa de icono en vez de foto. La foto muestra justo lo que dice el texto: mantenimiento dentro de un edificio comercial, fuera del horario |
| `cisterna-edificio` | encabezado de Nosotros | Ese encabezado repetía la foto del inicio. Ahora cada página abre con una imagen distinta |
| `camion-rotulado` | teja grande de "En el campo" | Repetía otra vez la misma cisterna. Esta tiene el rótulo legible: teléfonos y dominio |
| `planta-tratamiento` | teja 5 | El mosaico no tenía ninguna foto de planta, y el sitio ofrece el servicio |
| `cisterna-parqueo` | teja 6 | Segundo camión, rotulado, en un edificio comercial |

El mosaico nació de cuatro tejas y se le agregó una fila de dos mitades
con el mismo alto que la teja grande, para que las nuevas no quedaran
como dos rendijas anchas de 190px.

**Lo que se descartó, y por qué.**

- **La del Burger King.** Identifica a un cliente. El propietario ya había
  descartado poner logos de clientes; una foto de su local hace lo mismo
  sin el logo.
- **`IMG_3764` y `IMG_3407.MOV`.** Ampliadas se ve que el camión cisterna
  del encuadre es **azul y de otra empresa**, con los teléfonos de ella
  pintados. Publicarlas sería pagarle publicidad a la competencia. Se
  alcanzaron a generar los WebP y hubo que borrarlos.
- **La del Banco Nacional.** 960×960 y el camión sale de lejos; las otras
  del mismo camión son mejores.

**Regla que salió de acá:** antes de publicar una foto de campo hay que
ampliarla y leer lo que está rotulado dentro del encuadre —camiones,
chalecos, fachadas—. A tamaño de miniatura, el camión azul parecía
nuestro.

**El EXIF se borra al convertir.** Son fotos tomadas en propiedades de
clientes y el EXIF del teléfono lleva las coordenadas GPS. Pillow no lo
escribe si no se le pasa, pero sí hay que aplicar `exif_transpose` antes,
o las verticales salen acostadas.

## 24. Cuatro correcciones del inicio (2026-09-09)

**El rombo de la cinta naranja no estaba en medio.** Byron lo notó a ojo y
tenía razón: el espacio lo ponían dos cosas distintas. Por la izquierda, el
`gap` del `inline-flex` (.8rem). Por la derecha, el `padding` derecho del
`span` más el `padding` izquierdo del siguiente (1.6 + 1.6 = 3.2rem). El
rombo quedaba pegado al texto que terminaba.

Corregido pasando **todo el espacio al separador**: el `span` pierde el
padding horizontal y el `::after` lleva `margin: 0 1.6rem`. Medido en el
navegador: el centro del rombo cae a 0,2px del punto medio entre los dos
textos. Se le sumó `top: -.05em` porque el glifo ◆ no llena su caja y se
apoyaba un pelo abajo.

**«De una casa de familia a una planta industrial».** Eran nueve oficios en
una sola tirada separados por puntos naranja, debajo de un titular y un
párrafo. Byron: *"parecen tres textos puestos nada más por ahí"*. Y sí: el
tercer elemento no tenía estructura, era un párrafo disfrazado de lista.

Ahora son **tres franjas ordenadas de menor a mayor** —Casas, Comercios,
Industria—, con el mismo `.data franjas` que ya usan los datos de contacto y
la cobertura. Cero CSS nuevo.

La decisión es rastreable a dos cosas del spec: §7, que manda separar listas
con franjas alternas en vez de líneas; y §5, que declara la **escala** como el
único sistema de énfasis del sitio. Acá el contenido ya traía una escala —lo
dice el propio titular— y no se estaba viendo. Ordenarla es hacerle caso al
titular.

Se descartaron las dos salidas automáticas: la rejilla de chips con borde
(tic 4) y las tres tarjetas con icono (tic 7). El catálogo pide exactamente
lo contrario para este caso: *"una lista de verdad, con tipografía grande"*.

**Fuera la sección «No subcontratamos».** Decidido por Byron. Se quitó del
inicio; en Nosotros sigue, con otro contenido.

**La barra de arriba** pasa a decir «Cobertura en todo el país», sin el
detalle del GAM. Ese detalle vive en la sección de cobertura, que es donde
alguien lo busca; en una barra que aparece en todas las páginas era ruido.

## 25. Tres desalineaciones que Byron cazó a ojo

Las tres eran reales y las tres se midieron antes de tocar nada. Vale la
pena anotar el patrón: **el ojo de Byron detecta diferencias de espaciado
que en el CSS no se ven, porque el espacio lo estaban poniendo dos
propiedades distintas sin que nadie las sumara.**

**El punto como separador de lista, otra vez.** En «Casas / Comercios /
Industria» los oficios iban separados por `·`. Byron: *"sigue siendo un
punto, el cual hace notar que es de inteligencia artificial"*. Y tiene
razón: nadie escribe así fuera de una interfaz. Ahora van con comas y una
`y` final, como los escribiría una persona — que además es lo que ya
hacía la lista de cantones de la cobertura, así que también se ganó
coherencia.

**Queda una excepción declarada:** `2440-1110 · 2265-4150`, en la cinta y
en los datos de contacto. Ahí el punto separa **dos números de teléfono**,
no ítems de una lista; una coma entre dos números se lee como parte del
número.

**`.hq`: el rótulo de ancho libre no alinea.** `.hq b` tenía
`min-width: 7rem` (112px) y «Gran Área Metropolitana» mide 214px: el
rótulo se partía en dos líneas, la caja crecía, y su texto arrancaba
**44,9px más a la derecha** que el de «Resto del país». Medido en el
navegador.

Corregido cambiando el `flex` por una **rejilla de dos columnas**
(`14rem 1fr`). Con una rejilla las dos filas arrancan en el mismo sitio
pase lo que pase con el largo del rótulo, que es la garantía que un
`min-width` no da. En celular se apila.

**Regla que sale de acá:** en una lista de rótulo + texto, la columna del
rótulo se define con rejilla, no con `min-width`. `.data` ya lo hacía bien
por casualidad —sus rótulos son cortos—, pero es la misma trampa esperando.

**El pie: una columna con otro ritmo.** Las columnas Servicios y Empresa
tenían los ítems a 8px uno de otro. La de Contacto iba 8, 8, 8, 8 y de
repente **14,4**, dos veces: dos `<span>` con un `margin-top: .4rem`
puesto a mano en el atributo `style`, que se sumaba al `gap` del flex.

Se fundieron los dos en un solo bloque y se quitó el margen suelto. Las
tres columnas quedan en 8px parejos. De paso salió que esa columna todavía
anunciaba «Alajuela · Heredia · San José», que era lo que quedaba de las
sedes.

## 26. La sección de salida inmediata

Cuatro zonas donde el camión sale el mismo día: San Joaquín de Flores,
Santa Bárbara, Santo Domingo y Tibás. Va en el inicio, entre «a quiénes
atendemos» y la cobertura general — el orden cuenta una progresión: qué
tipo de cliente, dónde llegamos hoy, hasta dónde llegamos.

**Los cuatro nombres van solos, sin una frase de apoyo cada uno.** Es a
propósito: todavía no hay nada distinto que decir de cada zona, y rellenar
cuatro filas con la misma frase cambiando el nombre del cantón es
literalmente lo que hacía el sitio viejo de Wix. Cuando llegue el material
por zona (ZONAS-Y-SEO-LOCAL.md §8) cada una tendrá su página, y ahí sí hay
algo que contar.

Reusa `.data franjas` con un modificador de una línea, `.zonas span`, que
sube el nombre a tamaño de titular chico. Los rótulos llevan la provincia,
que se repite tres veces a propósito: no es ruido, es el dato que ubica
cada nombre.

La escala es lo único que separa esta lista de la de cobertura, y es
coherente con §5: acá los nombres **son** el contenido de la sección; en la
cobertura son un dato de apoyo bajo un titular que ya lo dijo todo.

## 27. Correcciones finales (2026-09-10)

Byron mandó un documento con dieciséis correcciones. Las que dejan regla:

**La raya larga (—) fuera de todo el sitio.** Cincuenta apariciones. Es una
de las firmas más claras de texto generado por máquina: nadie escribe así
a mano en español. Se cambiaron por la puntuación que usaría una persona
—coma, dos puntos, punto o paréntesis— según el caso. Frank también lleva
ahora la instrucción de no usarla, porque él escribe solo.

**Dos secciones seguidas del mismo tono son un hueco, no un respiro.** El
sitio no lleva líneas divisorias (§7), así que lo único que separa una
sección de otra es el cambio de fondo. Cuando el fondo se repite, lo que
queda es el respiro de abajo de una más el de arriba de la siguiente:
unos 224px de nada. Regla nueva: **cuando el tono se repite, la segunda
sección no vuelve a abrir espacio.** Tres selectores en el CSS, ningún
cambio de color.

**Los botones del cotizador eran el tic 4.** Una rejilla de recuadros con
borde de 1px y radio pequeño: "una lista disfrazada de interfaz", dice el
catálogo. Byron lo dijo con otras palabras: *"esos cuadros se ven full
creados por IA"*. Pasan a ser franjas alternas con el nombre en tipografía
de titular, que es como el sitio separa listas desde el 2026-09-01. Y
pierden el subtexto ("Precio directo, sin más preguntas"), que no ayudaba
a escoger y era puro relleno de interfaz.

**El chat de Frank.** Esquinas redondeadas (18px), botón de enviar
circular para que combine con el campo, que ya era una píldora, y las dos
acciones —cotizar y WhatsApp— compartiendo una sola fila en vez de dos
bandas apiladas. Se recuperan unos 45px de alto en un panel que no llega
a 500.

**Se elimina el tic 2 donde quedaba.** `.pull em` pintaba de naranja un
trozo del titular en Nosotros y en Servicios. Estaba declarado como
prohibido en la tabla de tics desde el principio y se había quedado.

**Lo que se corrigió del contenido, no del diseño:** el alquiler es de
tanques de **agua potable**, no de aguas residuales (el título decía una
cosa y el texto otra); Cartago sale del GAM; Alajuela y San José se
recortan a los cantones cercanos al centro; y el discurso de Nosotros deja
de hablar de intermediarios ajenos para hablar de lo propio.

**El mapa de la barra.** Byron mandó la silueta de Costa Rica en blanco
sobre negro sólido. Puesta tal cual sobre la pizarra de la barra habría
sido un recuadro negro, así que se le pasó la **luminosidad al canal
alfa**: el blanco queda opaco, el negro transparente y el borde suavizado.
Sirve sobre cualquier fondo y pesa 0,8 KB.

Va a 22px de alto (1,75em sobre los 12,8px de la barra), con el archivo a
44px para que no se vea borrosa en retina. Más chica deja de leerse como
Costa Rica; se probaron 19, 22 y 26. En celular desaparece con el resto de
esa línea, que ya estaba oculta.

**Corrección de la corrección (2026-09-10).** El alquiler **sí es para
recolección de aguas residuales**; lo de agua potable fue un malentendido
y se devolvió todo. Lo que queda de eso es una regla de trabajo: el
propietario dio tres líneas sobre ese servicio y nada más, así que la
página dice esas tres líneas y lo que se deduce directamente de ellas. Se
quitaron los usos que yo había inventado para llenar la página (ferias del
agricultor, cortes de agua, emergencias en comunidades, baños portátiles).
Una página corta y cierta vale más que una larga a medias, y Frank lleva
ahora la instrucción explícita de no inventar usos ni capacidades de este
servicio.

## 28. El panel se vuelve aplicación (tanda 1, 2026-09-10)

El panel se usa de pie, en un portón, con una mano ocupada y a veces con
mala señal. Estaba dibujado para eso desde hace rato —barra abajo, fichas
en vez de tabla, `env(safe-area-inset-bottom)`— pero seguía siendo una
pestaña del navegador. Esta tanda le pone el envoltorio, sin rehacer nada.

**Instalable, no nativa.** `manifest.webmanifest` + `sw.js`. No hay tienda,
ni cuenta de desarrollador, ni cuota anual, ni esperar aprobación para
corregir una línea. Es el mismo archivo que ya se despliega con cada push,
con su etiqueta puesta.

**El icono.** El camión con el chofer saludando, a 64% del ancho, centrado
sobre la pizarra `#1f2c33`. El 64% no es capricho: los iconos maskable de
Android se recortan a un círculo del 80%, y a 72% la esquina del tanque
quedaba justo por fuera. A 60px en la pantalla de inicio no se distinguen
las manos del chofer, pero sí "camión naranja sobre oscuro", que es lo que
tiene que pasar. Se descartó un monograma: la empresa ya tiene una marca
dibujada y no hacía falta inventarle otra.

**`viewport-fit=cover`.** Estaba faltando. Sin él, `env(safe-area-inset-*)`
devuelve cero y la barra de abajo se le metía debajo de la rayita del
iPhone. La barra ya pedía el inset desde antes; nunca se lo estaban dando.

**Los datos no se guardan nunca.** El service worker cachea la concha
—pantalla, css, iconos— y deja `/api/*` pasar de largo. Sin señal el panel
abre completo y dice que no pudo traer la información, en vez de mostrar
montos de ayer con cara de hoy. Es la decisión de diseño más importante de
esta tanda y es una resta, no una suma.

**La sesión se queda.** `localStorage` en vez de `sessionStorage`.
Instalada como app, iOS descarga la vista de memoria a cada rato y el panel
pedía la contraseña varias veces al día. Salir sigue estando y borra las
dos.

**Hoy, la pantalla nueva.** El Resumen mezclaba dos preguntas: "cómo va el
negocio" (cifras, gráfica, aro de cierre, rangos de fecha) y "qué hago
ahora" (lo urgente, quién espera respuesta, qué mantenimiento viene). En
una pantalla de 375px la segunda perdía siempre, porque llegaba después de
cuatro tarjetas de cifras y un selector de fechas.

Se partieron. **Hoy** se queda con las tres tarjetas de trabajo y no lleva
un solo control de fecha —nadie saca el celular en la calle para escoger un
rango—. **Resumen** se queda con los números. Las dos comen de la misma
consulta, así que separarlas no costó una llamada más al servidor, y el
marcador de "ya está cargado" es compartido: pasar de una a otra no pide
nada.

Las tres tarjetas se leen como una jornada: **lo urgente · a quién le debo
respuesta · qué viene después**. No es una lista de módulos, es el orden en
que se trabaja el día.

**En la mano.** Dentro de Hoy y en angosto: la ficha de un pendiente se
apila en tres renglones (quién · cuánto lleva esperando · qué hacer), los
botones van a 42px de alto y a mitad de ancho cada uno, y **"Ya la atendí"
baja sola a su renglón**: es la única de las tres que cambia el estado de
algo y no se puede tocar por error queriendo llamar. Se le quitó el
`overflow-y` a la lista de pendientes: una lista que rueda por dentro de
otra que rueda es la forma más segura de que alguien no llegue nunca al
último. Y el saludo de cartel baja a 24px, porque a 375px se comía media
pantalla y lo que hay que ver primero son los pendientes.

**Lo que no se hizo, a propósito.** Ni chat propio (WhatsApp ya está donde
el cliente está), ni notificaciones todavía —eso es la tanda 3, y antes de
eso hay que separar usuarios: hoy la seguridad es una sola clave compartida
y cualquiera que la tenga ve todos los precios y todos los clientes.
