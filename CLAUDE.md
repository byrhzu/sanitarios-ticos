# Sanitarios Ticos

Sitio público, cotizador y panel de operaciones.
Cloudflare Pages + `worker.js` con D1.

## El panel es generado

`panel.html` **no se edita acá**. Casi todo ese archivo sale de la fuente
del sistema, que vive en el repositorio de baizzen:

```
../baizzen/sistemas/operaciones/
```

Para cambiar el panel:

1. Se edita en `../baizzen/sistemas/operaciones/fuente/` (o en
   `conexion/servidor.js`, si cambia cómo habla con el servidor).
2. `cd "../baizzen" && python3 sistemas/armar.py operaciones sanitarios-ticos`
3. Se revisa el diff acá y se hace commit normal.

Lo que es de Sanitarios Ticos y no del sistema —el logo, los servicios con
su ícono y su color, el vocabulario («certificado», «tiquete», «tanque»)—
está en:

```
../baizzen/sistemas/operaciones/destinos/sanitarios-ticos.json
```

Dentro del archivo, el código generado va entre marcas:

```
/* ▼ GENERADO · logica — … */   …   /* ▲ FIN · logica */
```

Fuera de esas marcas —el `<head>`, el manifest, los iconos, el link a
`styles.css`— sí es de acá.

**Un cambio hecho a mano dentro de las marcas se pierde** la próxima vez
que alguien corra `armar.py`. Lo que vale es hacerlo en la fuente: así el
arreglo le llega también al demo de labs y a cualquier otro cliente.

Un detalle: la decoración de octubre es de acá, no del sistema. Vive en
`../baizzen/sistemas/operaciones/extras/octubre.js` y sólo la lleva este
destino.

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
