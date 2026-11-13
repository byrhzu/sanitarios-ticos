# Pasar el sitio a sanitariosticos.com

Estado al 13 de noviembre de 2026, leído del DNS público.

## Lo que hay hoy

| | |
|---|---|
| Registrador | **Wix.com Ltd.** |
| Registrado | 20 jul 2017 · vence **20 jul 2028** (pagado, no corre prisa) |
| Nameservers | `ns4.wixdns.net`, `ns5.wixdns.net` |
| El sitio | apunta a Wix (`185.230.63.x`) |
| **El correo** | **Google Workspace** (`aspmx.l.google.com`) |
| SPF | `v=spf1 include:_spf.google.com ~all` |
| DMARC | CNAME a `_dmarc.wixemails.com` |
| `www` | CNAME a `cdn3.wixdns.net` |
| Candados | `clientTransferProhibited` y `clientUpdateProhibited` |

**Lo más importante de esa tabla es el correo.** `info@sanitariosticos.com`
es Google Workspace y vive de los registros MX. Si los nameservers cambian
sin que los MX estén copiados del otro lado, **el correo de la empresa deja
de entrar** — y no rebota con un error claro, simplemente se cae. Es el
único paso de todo esto que no se arregla con un «control Z».

## La decisión que conviene tomar

Usted dijo «sacaré el dominio de Wix (no sé a dónde trasladarlo)». Son dos
cosas distintas y sólo hace falta una hoy:

1. **Quién cobra el dominio** (el registrador). Hoy Wix.
2. **Quién contesta las preguntas de DNS** (los nameservers). Hoy Wix.

**Para que el sitio funcione sólo hace falta cambiar la 2.** Cloudflare no
necesita ser el registrador: basta con que Wix apunte los nameservers a
Cloudflare. Eso es un cambio de una pantalla, tarda entre minutos y unas
horas en propagarse, y se devuelve igual de rápido si algo sale mal.

Mover el registrador es otra cosa: los dos candados están puestos, hay que
pedirle a Wix el código de autorización, y el traslado se tarda de 5 a 7
días. **No lo haga hoy.** Hágalo dentro de unas semanas, con el sitio ya
estable, cuando no importe si se atrasa.

Si después lo quiere mover, Cloudflare Registrar cobra el precio de costo,
sin recargo, y le suma un año al vencimiento. Pero eso es para otro día.

## El orden, que es lo que importa

### Antes de tocar nada

- [ ] **Anote los registros actuales.** Entre al panel de DNS de Wix y
      guarde una captura de **todos** los registros: MX, TXT, CNAME,
      subdominios. Lo de arriba es lo que se ve desde afuera; puede haber
      más que no se publica.
- [ ] **Busque el DKIM de Google.** En `google._domainkey` no hay nada, así
      que o no está configurado o usa otro selector. Mírelo en el panel de
      Google Workspace (Aplicaciones → Gmail → Autenticar correo). Si
      existe, ese TXT también hay que copiarlo.
- [ ] **Decida qué pasa con el dominio viejo.** `sanitariosticoscr.com` es
      el que Google tiene indexado hoy. No lo deje morir: tiene que quedar
      redirigiendo con 301 al nuevo, o se pierde el posicionamiento que ya
      ganó. Un 301 le pasa el valor al nuevo dominio; un dominio apagado
      no le pasa nada a nadie.

### El cambio

- [ ] **1 · Agregue el dominio en Cloudflare.** «Add a site» →
      `sanitariosticos.com`. Cloudflare escanea el DNS actual y copia lo
      que encuentra.
- [ ] **2 · Revise registro por registro contra su captura.** El escaneo
      es bueno pero no es perfecto, y lo que se le escape se pierde. Que
      estén los cinco MX de Google, el SPF, el DMARC y el DKIM si lo hay.
      **No pase del paso 2 hasta que esto esté revisado.**
- [ ] **3 · Ponga el sitio.** En Cloudflare Pages, el proyecto
      `sanitarios-ticos`, agregue `sanitariosticos.com` y
      `www.sanitariosticos.com` como dominios personalizados. Cloudflare
      crea los registros solo.
- [ ] **4 · Ahora sí, cambie los nameservers en Wix.** Dominios → su
      dominio → Nameservers → personalizados → los dos que le dio
      Cloudflare.
- [ ] **5 · Espere y compruebe.** Suele tardar menos de una hora.
      - `dig NS sanitariosticos.com` tiene que decir Cloudflare.
      - `dig MX sanitariosticos.com` tiene que seguir diciendo Google.
      - **Mándese un correo a `info@sanitariosticos.com` desde afuera y
        confirme que llega.** No lo dé por hecho.
      - El sitio abre en `https://sanitariosticos.com` con candado.

### Después, ya con el sitio arriba

- [ ] **6 · Cloudflare Access.** La política que protege `/panel` está
      amarrada a `sanitariosticoscr.com`. Hay que agregarle el dominio
      nuevo, o el panel queda abierto o queda inalcanzable. **Compruébelo
      entrando usted mismo**, no lo dé por hecho.
- [ ] **7 · Resend.** Los correos salen de
      `avisos@sanitariosticoscr.com` (está en tres lugares de
      `worker.js`). Dos caminos:
      - *Lo fácil:* no tocar nada. Siguen saliendo del dominio viejo y
        funcionan igual, mientras ese dominio siga verificado en Resend.
      - *Lo correcto:* verificar `sanitariosticos.com` en Resend, agregar
        los registros que pida, y cambiar las tres líneas. Ojo: el SPF
        nuevo tiene que **sumarse** al de Google, no reemplazarlo. Un
        dominio sólo puede tener un registro SPF.
- [ ] **8 · Los 119 enlaces del código.** El dominio viejo está escrito
      119 veces en 18 archivos: los `canonical`, los `og:url`, el
      `sitemap.xml`, el `robots.txt` y los datos estructurados de Google.
      Eso lo cambio yo de un solo golpe cuando me diga, pero **va de
      último**: si se cambian antes de que el dominio nuevo responda, los
      canonical apuntan a un sitio que todavía no existe y Google se
      confunde.
- [ ] **9 · El 301 del dominio viejo.** Una regla de redirección en
      Cloudflare: todo `sanitariosticoscr.com/*` → `sanitariosticos.com/$1`,
      con código 301, conservando la ruta. Que `/cotizar` caiga en
      `/cotizar`, no en la portada.
- [ ] **10 · Google Search Console.** Agregue la propiedad nueva, mande el
      sitemap nuevo, y use «Cambio de dirección» desde la vieja. Eso es lo
      que le dice a Google que es una mudanza y no un sitio nuevo.

## Lo que puedo hacer yo y lo que no

**Yo puedo:** cambiar los 119 enlaces del código, ajustar el `sitemap.xml`
y el `robots.txt`, cambiar el remitente en `worker.js`, y comprobar desde
afuera que el DNS quedó bien (`dig`, y abrir el sitio).

**Yo no puedo:** entrar a Cloudflare, a Wix, a Google Workspace ni a
Resend. No tengo credenciales de ninguno. Todo lo de los pasos 1 a 7 lo
hace usted; yo le voy comprobando desde afuera que cada paso quedó.

## Si algo sale mal

Mientras el registrador siga siendo Wix, **devolver los nameservers a
`ns4.wixdns.net` y `ns5.wixdns.net` deja todo como estaba.** Esa es la
razón de no mover el registrador el mismo día: deja la puerta de atrás
abierta.
