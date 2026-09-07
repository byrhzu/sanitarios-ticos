# Cambiar un texto y subirlo

Guía para cambios de texto sencillos, sin ayuda. Cinco minutos la
primera vez, uno las siguientes.

---

## 1. Dónde vive cada texto

| Lo que quiere cambiar | Archivo |
|---|---|
| Titulares y párrafos de una página | el `.html` de esa página — `index.html`, `servicios.html`, `nosotros.html`, `contacto.html` |
| Preguntas frecuentes | `contacto.html` |
| Cómo habla Beto y qué sabe | `worker.js`, línea ~1212, el bloque `CONOCIMIENTO_ASISTENTE` |
| Las preguntas que hace Beto al cotizar | `main.js`, línea ~789, el bloque `PASOS` |
| Datos de la empresa en el documento de cotización | `worker.js`, línea ~944, el bloque `EMPRESA` |
| Precios | `worker.js`, línea ~698, el bloque `TARIFAS` |
| Teléfonos, WhatsApp y correo | **no a mano** — vea la sección "Cambiar un teléfono o el correo" del `README.md`, hay una herramienta porque aparecen en unos 30 lugares |

Para encontrar una frase sin saber en qué archivo está, desde la carpeta
del proyecto:

```bash
grep -rn "un pedazo de la frase" *.html
```

Le devuelve el archivo y el número de línea.

---

## 2. La regla de oro

En un archivo `.html`, **cambie sólo lo que está entre `>` y `<`.**

```html
<p class="cover-sub"><strong>Atendemos emergencias el mismo día.</strong> Limpieza de tanques sépticos…</p>
        ↑ esto no se toca ↑        ↑ esto sí se cambia ↑
```

Lo que va entre `<` y `>` son instrucciones para el navegador. Si borra
un `<` o un `>`, la página se rompe.

Los acentos y las eñes se escriben normal. `<strong>` pone en negrita,
`<br>` corta la línea.

**En `worker.js` y `main.js`** el texto va entre comillas. Cambie lo de
adentro y deje las comillas y la coma del final:

```js
pregunta: "¿Qué servicio necesita?"
           ↑ esto se cambia ↑
```

Si el texto lleva comillas dobles por dentro, use comillas simples
españolas (« ») o cambie la frase. Una comilla doble suelta rompe el
archivo.

---

## 3. Ver el cambio antes de subirlo

Desde la carpeta del proyecto:

```bash
python3 -m http.server 4173
```

Y abra `http://localhost:4173` en el navegador. Se ve igual que en el
servidor. Para pararlo, `Control + C` en la terminal.

Ojo: así se ve **el sitio**, no el panel ni las cotizaciones. Todo lo
que empieza con `/api/` sólo funciona ya desplegado en Cloudflare.

---

## 4. Subirlo

Tres comandos, siempre los mismos, desde la carpeta del proyecto:

```bash
git diff
```

Le muestra exactamente qué cambió: en rojo lo que quitó, en verde lo que
puso. **Léalo antes de seguir.** Si aparece algo que usted no tocó, algo
salió mal — vea el punto 6. Para salir de esa vista, la tecla `q`.

```bash
git add -A && git commit -m "Cambiar el texto del inicio"
```

Guarda el cambio con un nombre. El mensaje va en presente y dice qué
cambió, no cómo: "Cambiar el horario del footer", no "cambios varios".

```bash
git push
```

Lo sube. Cloudflare lo detecta y despliega solo en un par de minutos.

---

## 5. Si el texto cambió pero el sitio se ve igual

Es la caché del navegador. Pruebe recargando con `Cmd + Shift + R`.

Si cambió algo de `styles.css` o de `main.js`, además hay que subirle el
número de versión al final del enlace en **todas** las páginas:

```html
<link rel="stylesheet" href="styles.css?v=20260907a">
                                        ↑ suba esta letra ↑
```

Para textos de HTML esto no hace falta.

---

## 6. Si algo salió mal

**Antes de hacer `commit`** — deshacer un archivo y dejarlo como estaba:

```bash
git restore index.html
```

Deshacer todo lo que no ha guardado:

```bash
git restore .
```

**Después del `push`** — no lo arregle a la carrera. Dígame qué pasó y
lo devuelvo al estado anterior; queda registro de cada versión y no se
pierde nada.

---

## 7. Lo que conviene no tocar sin avisar

- Cualquier cosa entre `<` y `>`
- `wrangler.jsonc`
- `lib/geografia-cr.js` y `lib/datos-cr.js`
- Los precios de `TARIFAS` mientras `provisional` siga en `true`
- Las claves: **nunca** van en el código, sólo en Cloudflare →
  Settings → Variables and Secrets, y siempre como **Secret**
