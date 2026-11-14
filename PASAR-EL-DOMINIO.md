# Pasar el sitio a sanitariosticos.com

Paso a paso. Comprobado contra el DNS en vivo el 13 de noviembre de 2026.

## Lo primero: NO transferir el dominio

Si está en la ventana de Wix que dice «Transferir tu dominio fuera de
Wix», **déle a Cancelar**. Ese no es el camino.

El propio Wix se lo dice en el recuadro amarillo: *«¿Quieres apuntar tu
dominio a otro lugar? Actualiza tus servidores de nombres en lugar de
transferir tu dominio.»* Ese enlace es el que sirve.

Son dos cosas distintas y hoy sólo hace falta una:

| | Transferir el dominio | Cambiar los nameservers |
|---|---|---|
| Qué cambia | Quién le cobra el dominio | Quién contesta el DNS |
| Cuánto tarda | 5 a 7 días | minutos a una hora |
| Se devuelve | No, hay que transferirlo de vuelta | Sí, pegando los de Wix otra vez |
| El correo | **Deja de funcionar** (lo dice el diálogo) | Sigue, si los MX están copiados |
| La renovación automática | **Se desactiva** (lo dice el diálogo) | No la toca |
| Pone el sitio nuevo | No, por sí sola no | **Sí** |

El dominio está pagado hasta **julio de 2028**. No hay prisa por mover el
registrador, y hacerlo el mismo día le quita la puerta de atrás. Déjelo
en Wix por ahora; si después lo quiere mover, se hace con calma.

---

## Antes de tocar nada

### 1 · Copie los registros que hay hoy

Entre al panel de DNS de Wix y guarde una captura de **todos** los
registros. Esto es lo que se ve desde afuera — úselo para comparar, pero
puede haber más que no se publica:

| Tipo | Nombre | Valor | Prioridad |
|---|---|---|---|
| A | @ | `185.230.63.107` | |
| A | @ | `185.230.63.186` | |
| A | @ | `185.230.63.171` | |
| CNAME | www | `cdn3.wixdns.net` | |
| **MX** | **@** | **`aspmx.l.google.com`** | **10** |
| **MX** | **@** | **`alt1.aspmx.l.google.com`** | **20** |
| **MX** | **@** | **`alt2.aspmx.l.google.com`** | **30** |
| **MX** | **@** | **`alt3.aspmx.l.google.com`** | **40** |
| **MX** | **@** | **`alt4.aspmx.l.google.com`** | **50** |
| **TXT** | **@** | **`v=spf1 include:_spf.google.com ~all`** | |
| CNAME | _dmarc | `_dmarc.wixemails.com` | |

**Los cinco MX y el TXT van en negrita porque de ellos vive
`info@sanitariosticos.com`.** Si llegan mal al otro lado, el correo de la
empresa deja de entrar y no rebota con un error claro: se cae callado.

Los tres A y el CNAME de `www` apuntan a Wix. **Ésos se botan**, los
reemplaza Cloudflare Pages en el paso 4.

El DMARC apunta al servicio de Wix. Cuando el sitio ya no esté en Wix eso
deja de tener sentido; cámbielo por uno propio:
`v=DMARC1; p=none; rua=mailto:info@sanitariosticos.com`

### 2 · Busque el DKIM de Google

En `google._domainkey` no hay nada, así que o no está configurado o usa
otro selector. Mírelo en **Google Admin → Aplicaciones → Google Workspace
→ Gmail → Autenticar correo**. Si existe, anote el selector y el valor:
es otro TXT que hay que copiar. Si no existe, no pasa nada.

---

## El cambio

### 3 · Agregue el dominio en Cloudflare

Cloudflare → **Add a site** → `sanitariosticos.com` → plan Free.

Cloudflare escanea el DNS de Wix y copia lo que encuentra. Al final le
muestra **dos nameservers** (algo como `xxx.ns.cloudflare.com`).
Anótelos, pero **no los ponga todavía en Wix**.

### 4 · Revise los registros, uno por uno

Ésta es la parte que no se puede saltar. Contra la tabla de arriba:

- [ ] Están los **cinco MX** de Google, con sus prioridades 10/20/30/40/50.
- [ ] Está el **TXT del SPF**: `v=spf1 include:_spf.google.com ~all`.
- [ ] Está el **DKIM**, si lo encontró en el paso 2.
- [ ] **Borre** los tres registros A que apuntan a `185.230.63.x`.
- [ ] **Borre** el CNAME de `www` que apunta a `cdn3.wixdns.net`.

Los MX van con la nube **gris** (DNS only), no naranja. El correo no pasa
por el proxy de Cloudflare.

### 5 · Conecte el sitio

Cloudflare → **Workers & Pages** → proyecto `sanitarios-ticos` → pestaña
**Custom domains** → agregue:

- `sanitariosticos.com`
- `www.sanitariosticos.com`

Cloudflare crea los registros que hacen falta. Va a decir que el dominio
está pendiente porque los nameservers todavía no apuntan acá: es normal,
siga.

### 6 · Ahora sí, cambie los nameservers en Wix

Wix → Dominios → `sanitariosticos.com` → **Actualizar servidores de
nombres** (el enlace del recuadro amarillo) → **Usar servidores
personalizados** → pegue los dos de Cloudflare → guardar.

Éste es el único paso que cambia algo de verdad, y es el reversible.

### 7 · Compruebe

Suele tardar menos de una hora. Avíseme y lo compruebo yo, o hágalo
usted en la terminal:

```bash
dig +short NS sanitariosticos.com && dig +short MX sanitariosticos.com
```

- [ ] Los NS dicen `cloudflare.com`.
- [ ] Los MX siguen diciendo `aspmx.l.google.com`. **Si acá salen vacíos,
      devuelva los nameservers a `ns4.wixdns.net` y `ns5.wixdns.net`
      ahora mismo** y revise el paso 4.
- [ ] **Mándese un correo a `info@sanitariosticos.com` desde otra cuenta
      y confirme que llega.** No lo dé por hecho.
- [ ] `https://sanitariosticos.com` abre el sitio nuevo, con candado.

---

## Después, con el sitio ya arriba

### 8 · Cloudflare Access

La política que protege `/panel` está amarrada a `sanitariosticoscr.com`.
Agréguele el dominio nuevo. **Compruébelo entrando usted mismo**: si
queda mal, o el panel no abre, o abre sin pedir correo — y eso segundo es
peor.

### 9 · El 301 del dominio viejo

`sanitariosticoscr.com` es el que Google tiene indexado. No lo apague:
tiene que redirigir, o se pierde el posicionamiento ganado.

Cloudflare → `sanitariosticoscr.com` → **Rules → Redirect Rules**:

- Si el nombre de host es `sanitariosticoscr.com` o `www.sanitariosticoscr.com`
- Redirigir a: `https://sanitariosticos.com` + la ruta y la consulta
- Código **301**, preservando la ruta

Que `/cotizar` caiga en `/cotizar`, no en la portada.

### 10 · Resend

Los correos salen de `avisos@sanitariosticoscr.com` (tres líneas de
`worker.js`). Mientras el dominio viejo siga verificado en Resend
funcionan igual, así que esto no corre prisa.

Cuando lo quiera mover: verifique `sanitariosticos.com` en Resend y
agregue lo que pida. **Ojo con el SPF:** un dominio sólo puede tener
**un** registro SPF. El de Resend hay que **sumarlo** al de Google en la
misma línea, no agregarlo aparte:

```
v=spf1 include:_spf.google.com include:amazonses.com ~all
```

Avíseme y cambio las tres líneas del worker.

### 11 · Los 119 enlaces del código

El dominio viejo está escrito 119 veces en 18 archivos: los `canonical`,
los `og:url`, el `sitemap.xml`, el `robots.txt` y los datos
estructurados. Eso lo cambio yo de un golpe.

**Va de último, después del paso 7.** Si se cambian antes de que el
dominio nuevo responda, los canonical apuntan a un sitio que todavía no
existe y Google se confunde.

### 12 · Google Search Console

Agregue la propiedad nueva, mande el sitemap nuevo y use **Cambio de
dirección** desde la vieja. Eso es lo que le dice a Google que es una
mudanza y no un sitio nuevo.

---

## Si algo sale mal

Mientras el registrador siga siendo Wix, **devolver los nameservers a
`ns4.wixdns.net` y `ns5.wixdns.net` deja todo como estaba.** Ésa es la
razón de no transferir el dominio el mismo día.

## Qué hago yo

**Puedo:** comprobarle desde afuera que cada paso quedó (`dig`, abrir el
sitio), cambiar los 119 enlaces, el `sitemap.xml`, el `robots.txt` y el
remitente del worker.

**No puedo:** entrar a Cloudflare, Wix, Google Workspace ni Resend. No
tengo credenciales de ninguno. Los pasos 1 a 10 los hace usted.
