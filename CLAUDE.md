# Sanitarios Ticos

Sitio público, cotizador y panel de operaciones.
Cloudflare Pages + `worker.js` con D1.

## El panel se edita acá

`panel.html` **se edita en esta carpeta**, como cualquier otro archivo del
sitio.

Salió de la plantilla «operaciones» de baizzen el 27 de octubre de 2026, pero
desde esa fecha va por su cuenta: **ya no se regenera y nada de lo que se le
cambie acá se pierde.**

Si quiere ver de dónde vino, la plantilla está en
`../baizzen/sistemas/operaciones/` y los valores con los que se armó quedaron
en `../baizzen/sistemas/desprendidos/sanitarios-ticos.json`. Son referencia,
no fuente.

**No corra `armar.py` esperando que toque este panel.** Ya no lo toca.

## El cotizador todavía NO es generado

`cotizar.html` y `cotizador.js` se editan acá, normal.

El sistema existe (`../baizzen/sistemas/cotizador/`) y el demo de labs sale
de él, pero este cliente todavía no es un destino. Al volverlo genérico, las
preguntas de cada servicio pasaron a ser datos, y con eso cambió lo que se
le manda al servidor: de `{forma, medida, antiguedad, dias}` a
`{trabajo: {…}}`. `worker.js` espera lo viejo.

Migrarlo es un cambio de servidor además de panel, y toca el cotizador
público, que es por donde entran los clientes. Se hace aparte.

## Comprobar que lo publicado es lo nuevo

**Se publica con un push a `main`.** Comprobado el 23 de octubre de 2026
comparando `https://sanitariosticoscr.com/` contra `index.html`: salen
idénticos byte por byte.

El panel está detrás de Cloudflare Access, así que desde afuera sólo se ve
el ingreso de Google — hay que entrar para verlo. Ya adentro, la señal más
rápida de que está corriendo el panel generado y no una copia vieja:

- En **Pendientes**, la lista de solicitudes: los teléfonos ahora salen
  partidos, `2954-9200` en vez de `29549200`. Lo mismo en el repaso de la
  cotización. Eran los dos únicos lugares del panel donde salían de
  corrido.

Y si se quiere algo tajante, en la consola:

```js
typeof PUERTA === 'object' ? 'panel nuevo' : 'todavia el viejo'
```

**El service worker no estorba acá, aunque lo parezca.** En `sw.js` las
navegaciones van primero a la red y la copia guardada sólo se usa si el
`fetch` falla (regla 2, `pedido.mode === "navigate"`). Como el panel es un
solo archivo con todo adentro, llega fresco y no hace falta recarga dura.
Lo que sí es cache-first son los archivos estáticos del sitio, que el
panel no usa para su apariencia.

## El resto

- `worker.js` — el servidor. No es generado.
- `styles.css` — el sitio público. El panel no cuelga de él para su
  apariencia, pero sí lo carga.
- `lib/geografia-cr.js` — el del sitio. Tiene nueve líneas más que el de
  `../baizzen/sistemas/comun/`; vale juntarlos algún día.
- `tools/*.sql` — las migraciones de D1, en orden de fecha.
- Los `.md` de la raíz (`MAPA-DEL-PANEL`, `DIRECCION-DE-ARTE`,
  `ESTRATEGIA-SEO`…) son de este proyecto y valen la pena.

## El idioma

Todo en español: archivos, variables, comentarios y commits.
