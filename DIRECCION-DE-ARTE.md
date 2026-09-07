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
