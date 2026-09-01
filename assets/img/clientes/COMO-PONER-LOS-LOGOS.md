# Logos de empresas clientes

Van en la portada, en la sección **"Quiénes nos contratan"**.

## Antes que nada

Ponga únicamente logos de empresas que **de verdad** hayan sido clientes,
y con su permiso por escrito. Un logo en esa tira le dice al visitante
"esta empresa nos contrató". Si no es cierto:

- Es publicidad engañosa.
- Es uso de una marca registrada ajena para insinuar una relación que no
  existe. Marcas grandes tienen departamentos que vigilan justamente eso.
- Y si un cliente lo descubre, se cae la credibilidad de todo lo demás
  que dice el sitio.

No vale "es solo de ejemplo mientras tanto": si está publicado, está
afirmando algo. Mejor dejar la tira vacía hasta tener los logos reales.

## 1. Prepare los archivos

Guarde cada logo en esta misma carpeta, en formato `.webp`:

    cliente-1.webp
    cliente-2.webp
    ...

Requisitos:

- **Fondo transparente.** Es lo más importante. Un logo con fondo blanco
  o de color se ve como un bloque pegado entre los demás y rompe la tira.
  Si el logo original viene sobre un color (por ejemplo letras blancas
  sobre azul), pida o busque la versión "para fondo claro".
- Alto de unos 120 px basta; en la web se muestran a 42 px.
- Sin el nombre de la empresa repetido abajo si el logo ya lo trae.

## 2. Péguelo en index.html

Busque en `index.html` el comentario `LOGOS DE EMPRESAS CLIENTES` y pegue
este bloque justo debajo, cambiando nombres de archivo y `alt`:

```html
<p class="clientes-t rv">Algunas empresas que nos han contratado</p>
<ul class="logos rv">
  <li><img src="assets/img/clientes/cliente-1.webp" alt="NOMBRE DE LA EMPRESA" width="240" height="120" loading="lazy" decoding="async"></li>
  <li><img src="assets/img/clientes/cliente-2.webp" alt="NOMBRE DE LA EMPRESA" width="240" height="120" loading="lazy" decoding="async"></li>
  <li><img src="assets/img/clientes/cliente-3.webp" alt="NOMBRE DE LA EMPRESA" width="240" height="120" loading="lazy" decoding="async"></li>
</ul>
```

El `alt` es el nombre de la empresa, no la palabra "logo": es lo que lee
alguien con lector de pantalla y lo que entiende Google.

## 3. Emparejar los tamaños

Todas las casillas miden lo mismo y el logo se centra adentro, así que la
retícula nunca se deforma. Pero **dos logos con la misma altura en
píxeles no se ven del mismo tamaño**: uno muy ancho y bajo se ve
chiquito, y uno alto y compacto se ve enorme.

Para eso hay dos clases. Mire la tira ya publicada y corrija a ojo:

```html
<!-- logo ancho y bajo (una palabra larga, tipo "PEQUEÑO MUNDO") -->
<img class="es-ancho" src="..." alt="...">

<!-- logo alto y compacto (un escudo, un cuadro vertical) -->
<img class="es-alto" src="..." alt="...">

<!-- logo de proporción normal: sin clase -->
<img src="..." alt="...">
```

Es normal tener que probar. El ojo manda, no el número.
