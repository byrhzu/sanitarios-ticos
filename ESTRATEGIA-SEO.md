# Estrategia de posicionamiento

Escrita el 9 de setiembre de 2026, a partir de los datos reales de
Google Search Console del sitio de Wix (últimos 365 días).

---

## Lo que dicen los datos

**17.586 impresiones · 172 clics · 1% de clics · posición media 7,7**

Las consultas con más peso:

| Consulta | Impresiones | Clics | Clics % | Posición |
|---|---:|---:|---:|---:|
| limpieza de tanques septicos | 7.085 | 68 | 1,0% | 5,7 |
| limpieza de tanque septico | 1.951 | 24 | 1,2% | 11,6 |
| limpieza de tanques sépticos | 1.486 | 6 | 0,4% | 6,5 |
| limpieza tanques septicos | 1.114 | 18 | 1,6% | 5,4 |
| **precio** limpieza tanque séptico costa rica | 986 | 9 | 0,9% | 6,8 |
| limpieza de tanques sépticos **heredia** | 432 | 9 | 2,1% | 6,4 |
| limpieza tanque septico | 512 | 5 | 1,0% | 5,9 |
| limpieza de tanques sépticos **alajuela** | 197 | 4 | 2,0% | 8,8 |
| limpieza tanque septico **heredia** | 129 | 3 | 2,3% | 6,5 |
| limpieza de tanques septicos **heredia** | 115 | 3 | 2,6% | 8,7 |
| limpieza de tanques sépticos **costa rica** | 95 | 4 | 4,2% | 4,9 |
| limpieza tanque septico **costa rica** | 72 | 3 | 4,2% | 3,3 |

De ahí salen cuatro conclusiones, y las cuatro cambian qué hay que hacer.

### 1. El negocio, en buscadores, es el tanque séptico

Las variantes de «limpieza de tanques sépticos» son cerca del **77% de
todas las impresiones**. Ni destaqueo, ni trampas de grasa, ni alquiler,
ni construcción aparecen en las consultas de arriba. No es que sean malos
servicios: es que en buscadores casi no se piden.

**Consecuencia:** el esfuerzo se concentra en tanques sépticos. Los otros
cuatro llevan su página porque cuestan poco y hoy no hay nada compitiendo
por ellos, pero no son la prioridad.

### 2. El problema no es la posición, es el clic

Posición media **7,7** con **1% de clics**. En posición 5-7 lo esperable
son 3-6%. El sitio ya está saliendo — la gente no está entrando.

Eso no se arregla posicionando mejor: se arregla con el **título y la
descripción**, que es lo único que la persona ve antes de decidir. Es la
ganancia más rápida que hay: sobre 17.586 impresiones que ya existen,
pasar de 1% a 3% son unos 350 clics más al año, sin ganar una sola
posición.

### 3. Nombrar el lugar triplica el clic

Las consultas genéricas convierten al **1%**. Las que llevan «costa rica»,
al **4,2%**. Las que llevan «heredia», entre **2,1% y 2,6%**.

La misma persona hace clic tres veces más cuando el resultado le confirma
que la empresa está donde ella está. Por eso los títulos nuevos llevan el
lugar, y por eso las páginas de zona valen la pena.

### 4. La gente busca el precio, y hay que contestarle sin publicarlo

«precio limpieza tanque séptico costa rica»: **986 impresiones al año,
0,9% de clics, posición 6,8**. Sale, y casi nadie entra.

**Las tarifas no se publican.** Es decisión del propietario: el precio se
da por cotización, no en abierto. Se llegó a montar la tabla completa y se
quitó.

Eso no significa renunciar a la consulta. La página madre se llama
«¿Cuánto cuesta limpiar un tanque séptico?» y la contesta de verdad:
explica que el monto sale del tamaño y de la antigüedad, aclara lo que
**no** lo cambia —la distancia dentro del GAM, el acceso, la hora— y manda
al cotizador, que da el monto exacto en un minuto.

Se pierde algo de clic, porque un número en la descripción es más
llamativo que una promesa. Se gana el dato del cliente, que es de lo que
vive el negocio: quien cotiza deja nombre y teléfono y queda en el panel.

**Nota aparte:** las tarifas viven en `worker.js`, dentro de la constante
`TARIFAS`, y el repositorio de GitHub es **público**. Cualquiera que abra
`worker.js` las ve. Si de verdad no deben estar a la vista, hay que poner
el repositorio en privado — Cloudflare despliega igual desde un repo
privado.

---

## Lo que se construyó

### Arquitectura: una madre y sus zonas

```
/limpieza-de-tanques-septicos          ← la madre, «¿cuánto cuesta?»
    /limpieza-de-tanques-septicos-heredia
    /limpieza-de-tanques-septicos-alajuela
    /limpieza-de-tanques-septicos-san-jose
/destaqueo-de-tuberias
/limpieza-de-trampas-de-grasa
/construccion-de-tanques-septicos-y-drenajes
/alquiler-de-tanques-plasticos
/servicios                             ← el índice, que enlaza a las cinco
```

**Las de zona no repiten a la madre.** Llevan lo suyo —los cantones, el
tiempo de llegada, cómo es el trabajo ahí, sus propias preguntas— y
enlazan hacia arriba. Así no son tres copias con el nombre cambiado, que
es lo que Google trata como relleno y lo que hacía el sitio de Wix.

### Cada página lleva

- Un solo `h1`, con la consulta en el encabezado.
- Título de menos de 68 caracteres, con el lugar y la velocidad.
- Descripción de 140-160 caracteres que da una razón concreta para entrar.
- `Service`, `FAQPage` y `BreadcrumbList` en datos estructurados. El
  `FAQPage` puede hacer que las preguntas salgan desplegadas en Google.
- Preguntas frecuentes escritas como las hace la gente.
- Enlaces internos hacia arriba (a la madre) y a los lados (entre zonas).

### Las direcciones viejas de Wix

Los 301 ahora caen **en la página nueva de la misma zona**, no en una
página genérica. `/limpieza-de-tanques-septicos-heredi` va a
`/limpieza-de-tanques-septicos-heredia`. Eso es lo que hace que Google
traslade el valor en vez de perderlo.

---

## Lo que sigue

1. **Mover el dominio.** Nada de esto existe para Google hasta que
   `sanitariosticos.com` apunte acá. Ver `PASAR-EL-DOMINIO.md`.
2. **Search Console en el dominio nuevo**, y mandar el sitemap.
3. **Vigilar los clics, no la posición.** Si el 1% no sube, los títulos
   siguen sin funcionar y se prueban otros. Eso se mide en cuatro semanas.
4. **Reseñas en el perfil de Google.** Es el factor de importancia más
   al alcance de la mano, y no depende del sitio.
5. **Volver a mirar los datos a los tres meses.** Ahí van a aparecer
   consultas nuevas —las de las páginas nuevas— y con eso se decide si
   alguna combinación servicio + zona merece su propia página. Antes de
   eso, no.

## Lo que se decidió NO hacer

- **Una página por cada servicio en cada zona** (5 × 3 = 15). Serían
  quince páginas casi iguales. Google las trata como relleno y es
  exactamente lo que hacía Wix con sus diez.
- **Secciones nuevas en el inicio para "hacer SEO".** Google posiciona
  páginas, no secciones. Una sección sin URL propia no compite por nada.
