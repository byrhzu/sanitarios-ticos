# Logos de empresas clientes

Van en la portada, en la sección **"Quiénes nos contratan"**.

## 1. Prepare los archivos

Guarde cada logo en esta misma carpeta, en formato `.webp`:

    cliente-1.webp
    cliente-2.webp
    ...

Recomendaciones:

- Fondo transparente si se puede (si no, fondo blanco).
- Alto de unos 120 px es suficiente; la web los muestra a 46 px.
- En la web salen en escala de grises y recuperan su color cuando la
  persona les pasa el mouse encima. Así la tira se ve pareja aunque los
  logos vengan en colores muy distintos.

## 2. Péguelo en index.html

Busque en `index.html` el comentario que dice
`LOGOS DE EMPRESAS CLIENTES` y pegue este bloque justo debajo,
cambiando los nombres de archivo y los `alt` por los reales:

```html
<p class="clientes-t rv">Algunas empresas que nos han contratado</p>
<ul class="logos rv">
  <li><img src="assets/img/clientes/cliente-1.webp" alt="NOMBRE DE LA EMPRESA" width="240" height="120" loading="lazy" decoding="async"></li>
  <li><img src="assets/img/clientes/cliente-2.webp" alt="NOMBRE DE LA EMPRESA" width="240" height="120" loading="lazy" decoding="async"></li>
  <li><img src="assets/img/clientes/cliente-3.webp" alt="NOMBRE DE LA EMPRESA" width="240" height="120" loading="lazy" decoding="async"></li>
  <li><img src="assets/img/clientes/cliente-4.webp" alt="NOMBRE DE LA EMPRESA" width="240" height="120" loading="lazy" decoding="async"></li>
  <li><img src="assets/img/clientes/cliente-5.webp" alt="NOMBRE DE LA EMPRESA" width="240" height="120" loading="lazy" decoding="async"></li>
</ul>
```

El `alt` es importante: es lo que lee alguien que usa lector de pantalla,
y también lo que ve Google. Ponga el nombre de la empresa, no "logo".

## 3. Una advertencia

Ponga únicamente logos de empresas que **de verdad** hayan sido clientes,
y con su permiso. Mostrar el logo de alguien que no lo es afirma una
relación comercial que no existe, y eso trae problemas legales además de
quemar la credibilidad del sitio.
