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

- Por defecto casi nada. Transiciones de 150–250 ms en estados reales.
- **La única animación de entrada:** ninguna nueva. Se conserva el `rv` existente, que ya
  tiene red de rescate a los 3 s.
- `prefers-reduced-motion` respetado (ya lo está).

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
