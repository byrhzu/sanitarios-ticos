# Pasar sanitariosticos.com de Wix a la página nueva

Guía para hacerlo sin romper nada. Léala completa una vez antes de tocar
el primer botón: hay un paso que, si se salta, deja a la empresa sin
correo.

---

## Lo que hay hoy (revisado el 9 de setiembre de 2026)

Esto no es suposición: se consultó el DNS público del dominio.

| Cosa | Cómo está |
|---|---|
| Registrador | **Wix.com Ltd.** El dominio se compró ahí |
| Registrado desde | 20 de julio de 2017 |
| Estado | `ok` — está **desbloqueado**, se puede transferir |
| Nameservers | `ns4.wixdns.net` y `ns5.wixdns.net` |
| La página | Apunta a los servidores de Wix (185.230.63.x) |
| **El correo** | **Google Workspace** (`aspmx.l.google.com` y cuatro más) |
| SPF | `v=spf1 include:_spf.google.com ~all` |
| DMARC | `_dmarc` es un CNAME hacia `_dmarc.wixemails.com` |

**Lo importante de esa tabla:** el correo `info@sanitariosticos.com` es una
cuenta de Google, no de Wix. Vive en registros DNS que hoy administra Wix.
Si el dominio cambia de nameservers y esos registros no se copiaron antes,
**la empresa deja de recibir correos**. No hay aviso, no hay rebote visible
para quien escribe: simplemente dejan de llegar.

---

## El problema grande: las páginas de zona

El sitio de Wix tiene **quince páginas** publicadas, y Google las tiene
indexadas. Diez de ellas son páginas de zona:

```
/limpieza-de-tanques-septicos-heredi
/limpieza-de-tanques-septicos-alajue
/limpieza-de-tanques-septicos-san-jo
/tanques-septicos-y-drenajes-san-joa
/limpieza-de-tuberias-san-joaquin-de
/destaqueo-de-tuberias-san-joaquin-f
/limpieza-de-trampas-de-grasa-san-jo
/construccion-de-drenajes-san-joaqui
/construccion-de-plantas-de-tratamie
/construccion-de-tanques-septicos-sa
```

(Las direcciones vienen cortadas así, a 34 caracteres. No es error de
copia: Wix las generaba de esa forma.)

Esas páginas son, con toda probabilidad, **por las que la empresa aparece
en Google** cuando alguien busca "limpieza de tanques sépticos Heredia".
La página nueva no las tiene.

**Lo que ya quedó resuelto en el código:** `worker.js` contesta esas doce
direcciones viejas con un **301** hacia la página nueva que corresponde.
Un 301 le dice a Google "esto se mudó aquí" y le pasa parte del valor.

**Lo que NO resuelve:** *parte*, no todo. Mandar diez páginas de zona a
una sola página de servicios pierde justo lo que las hacía rankear — que
cada una hablaba de una zona. La solución de verdad es rehacer las
páginas de zona en el sitio nuevo. Es el "perímetro" que quedó pendiente.

**Recomendación:** el 301 evita el 404, que es lo peor. Pero conviene
hacer el perímetro pronto, no dentro de seis meses.

---

## Los pasos, en orden

### 1 · Meter el dominio en Cloudflare

En el panel de Cloudflare: **Add a site** → escriba `sanitariosticos.com`
→ plan **Free**.

Cloudflare escanea el DNS actual y copia lo que encuentra. **No confíe en
que copió todo.**

### 2 · Revisar los registros ANTES de tocar nada

Este es el paso que no se salta. En **DNS → Records** del dominio recién
agregado, confirme que estén los cinco de correo:

| Tipo | Nombre | Contenido | Prioridad |
|---|---|---|---|
| MX | `sanitariosticos.com` | `aspmx.l.google.com` | 10 |
| MX | `sanitariosticos.com` | `alt1.aspmx.l.google.com` | 20 |
| MX | `sanitariosticos.com` | `alt2.aspmx.l.google.com` | 30 |
| MX | `sanitariosticos.com` | `alt3.aspmx.l.google.com` | 40 |
| MX | `sanitariosticos.com` | `alt4.aspmx.l.google.com` | 50 |

Y estos dos:

| Tipo | Nombre | Contenido |
|---|---|---|
| TXT | `sanitariosticos.com` | `v=spf1 include:_spf.google.com ~all` |
| CNAME | `_dmarc` | `_dmarc.wixemails.com` |

Los que falten, agréguelos a mano. **Los MX y el SPF van en gris (DNS
only), no en naranja** — el naranja es para tráfico web, y a un registro
de correo lo rompe.

Deje por ahora los registros que apuntan a Wix (el A de la raíz y el
CNAME de `www`). Mientras los nameservers no cambien, no molestan.

### 3 · Cambiar los nameservers en Wix

Cloudflare le va a dar dos nombres, del tipo `xxx.ns.cloudflare.com`.
Cópielos exactos.

En Wix: **Dominios → sanitariosticos.com → Avanzado → Nameservers** →
cambiar a nameservers externos y pegar los dos de Cloudflare.

Desde este momento el sitio de Wix deja de responder en el dominio. Es
lo esperado. Todavía **no** hay nada nuevo respondiendo: va a haber un
rato en que el dominio no muestre la página. Por eso conviene hacerlo un
día de poco movimiento, no un lunes a las 9 de la mañana.

### 4 · Esperar a que Cloudflare diga "Active"

Suele tardar de minutos a un par de horas; el máximo formal son 24. Va a
llegar un correo de Cloudflare.

### 5 · Probar el correo antes de seguir

En cuanto diga "Active": mande un correo **desde afuera** (por ejemplo
desde Gmail personal) a `info@sanitariosticos.com` y confirme que llega.
Y conteste desde ahí, para probar la salida.

Si no llega, pare acá y revise los MX. No siga al paso 6.

### 6 · Conectar el dominio a la página

En Cloudflare: **Workers & Pages → sanitarios-ticos → Settings → Domains
& Routes → Add → Custom domain**. Agregue los dos, uno por uno:

- `sanitariosticos.com`
- `www.sanitariosticos.com`

Cloudflare le va a avisar que ya existe un registro para esa dirección
(el que apuntaba a Wix) y le va a ofrecer reemplazarlo. Acepte: **ese** sí
se reemplaza. Los MX no se tocan.

El certificado de seguridad (el candado) se emite solo, en un minuto o
dos. No hay que comprarlo ni configurarlo.

### 7 · Que la raíz mande a www

Las páginas del sitio se declaran como `www.sanitariosticos.com`. Para
que `sanitariosticos.com` a secas no quede como una copia:

**Rules → Redirect Rules → Create rule**

- Nombre: `raíz a www`
- Si: `Hostname` `equals` `sanitariosticos.com`
- Entonces: **Dynamic redirect**, `concat("https://www.sanitariosticos.com", http.request.uri.path)`, tipo **301**, preservar query string.

### 8 · Abrir el sitio a Google

Hasta ahora el sitio le pide a Google que **no** lo indexe, porque vivía
en una dirección temporal. Ya con el dominio puesto:

```bash
python3 tools/modo-publicacion.py produccion
```

Eso quita la marca `noindex` de las seis páginas públicas y abre el
`robots.txt`. Después:

```bash
git add -A && git commit -m "Abrir el sitio a Google" && git push
```

### 9 · Avisarle a Google

En **Google Search Console**: agregar la propiedad `sanitariosticos.com`,
verificarla (con Cloudflare ya se hace con un clic), y mandar el sitemap:
`https://www.sanitariosticos.com/sitemap.xml`

Revise ahí, durante las semanas siguientes, el informe de **Cobertura**:
ahí van a aparecer las páginas viejas marcadas como redirigidas. Eso es lo
esperado.

---

## Lo que se destraba cuando el dominio esté puesto

| Cosa | Qué hay que hacer |
|---|---|
| **Correo al cliente** | Hoy los avisos salen desde `onboarding@resend.dev` y sólo pueden llegar a `byrhu36@gmail.com`. Con el dominio en Cloudflare se verifica `sanitariosticos.com` en Resend (pega tres registros DNS), se cambia el `from:` en `worker.js` a algo como `avisos@sanitariosticos.com`, y `CORREO_AVISO` al correo del encargado |
| **WhatsApp automático** | La API de WhatsApp de Meta exige dominio verificado. Con esto se puede empezar el trámite, y de ahí salen los recordatorios de los 24 meses |
| **Las páginas de zona** | El perímetro de Google que quedó pendiente |

---

## Si algo sale mal

Volver atrás es cambiar los nameservers en Wix de vuelta a
`ns4.wixdns.net` y `ns5.wixdns.net`. Tarda lo mismo en propagar.

Por eso: **no cancele el plan de Wix el mismo día.** Déjelo vivo una o
dos semanas, hasta estar seguro.

---

## Anexo · Transferir el registro a Cloudflare (opcional, después)

Esto es aparte y no corre prisa. Cambiar los nameservers (pasos 1 a 6) ya
le da todo lo que necesita; el dominio simplemente sigue *comprado* en
Wix y se renueva ahí.

Si después quiere pasarlo del todo, el dominio ya está desbloqueado
(estado `ok`) y tiene más de sesenta días, que son los dos requisitos.
En Wix se pide el código de autorización, en Cloudflare se pega en
**Domain Registration → Transfer Domains**, y tarda de cinco a siete días.
Cloudflare cobra el precio de costo, sin recargo.

Hágalo *después* de que el sitio esté funcionando, no al mismo tiempo.
