(function () {
  "use strict";

  /* =============================================================
     SANITARIOS TICOS — main.js
     Script clásico (sin módulos) envuelto en IIFE. Funciona en
     file://, hosting compartido y CDN. El HTML ya trae todo el
     contenido: este archivo sólo lo enriquece.
     ============================================================= */

  var data = window.__BRAND__ || {};

  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $$(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Cabecera: sombra al hacer scroll + menú móvil ---------- */
  function initHead() {
    var head = $("[data-head]");
    if (!head) return;

    var onScroll = function () { head.classList.toggle("is-stuck", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var burger = $("[data-burger]", head);
    if (burger) {
      burger.addEventListener("click", function () {
        var open = head.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      });
    }

    $$(".menu a", head).forEach(function (a) {
      a.addEventListener("click", function () {
        head.classList.remove("is-open");
        if (burger) burger.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && head.classList.contains("is-open")) {
        head.classList.remove("is-open");
        if (burger) { burger.setAttribute("aria-expanded", "false"); burger.focus(); }
      }
    });
  }

  /* ---------- Enlaces internos con compensación de la cabecera ---------- */
  function initAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 92,
        behavior: reduced ? "auto" : "smooth"
      });
      if (history.replaceState) history.replaceState(null, "", id);
    });

    // Llegada desde otra página con ancla (#tanques-septicos): corrige el offset
    if (location.hash) {
      var target = document.querySelector(location.hash);
      if (target) {
        setTimeout(function () {
          window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 92, behavior: "auto" });
        }, 60);
      }
    }
  }

  /* ---------- Aparición al hacer scroll ---------- */
  function initReveals() {
    var items = $$(".rv");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("on"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        setTimeout(function () { el.classList.add("on"); }, Math.min(sibs, 5) * 65);
        io.unobserve(el);
      });
    }, { threshold: 0.02, rootMargin: "0px 0px -3% 0px" });

    items.forEach(function (el) { io.observe(el); });

    // Red de seguridad: nada se queda invisible
    setTimeout(function () {
      $$(".rv:not(.on)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight * 1.3) el.classList.add("on");
      });
    }, 6000);
  }

  /* ---------- Una sola pregunta abierta a la vez ---------- */
  function initFaq() {
    var items = $$(".qa details");
    items.forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (!d.open) return;
        items.forEach(function (other) { if (other !== d) other.open = false; });
      });
    });
  }

  /* ---------- Selector de sede: la tarjeta cambia el mapa ---------- */
  function initMapa() {
    var wrap = $("[data-mapa]");
    if (!wrap) return;

    var frame = $("[data-mapa-frame]", wrap);
    var sedes = $$(".sede[data-sede]", wrap);
    if (!frame || sedes.length < 2) return;

    var elSede = $("[data-mapa-sede]", wrap);
    var elDir  = $("[data-mapa-dir]", wrap);
    var elRef  = $("[data-mapa-ref]", wrap);
    var elRuta = $("[data-mapa-ruta]", wrap);

    // Marca el contenedor para que el CSS active el cursor sobre la tarjeta
    var lista = sedes[0].parentElement;
    if (lista) lista.setAttribute("data-js", "1");

    function elegir(sede) {
      if (sede.classList.contains("is-active")) return;

      sedes.forEach(function (s) {
        var activa = s === sede;
        s.classList.toggle("is-active", activa);
        var btn = $("[data-sede-pick]", s);
        if (btn) {
          btn.setAttribute("aria-pressed", activa ? "true" : "false");
          btn.textContent = activa ? "Viendo en el mapa" : "Ver en el mapa";
        }
      });

      var nombre = sede.getAttribute("data-nombre");

      // El mapa tarda en recargar y mientras tanto parpadeaba en gris,
      // que se lee como un fallo. Se funde a la salida y se vuelve a
      // mostrar cuando el nuevo mapa terminó de cargar. El temporizador
      // es la red de seguridad: si el "load" no llega (sin internet, o
      // Google tardando), el mapa reaparece igual y no queda en blanco.
      var caja = frame.parentElement;
      if (caja) {
        caja.classList.add("cargando");
        var mostrar = function () {
          caja.classList.remove("cargando");
          frame.removeEventListener("load", mostrar);
        };
        frame.addEventListener("load", mostrar);
        setTimeout(mostrar, 2500);
      }

      frame.setAttribute("src", sede.getAttribute("data-embed"));
      frame.setAttribute("title", "Ubicación de Sanitarios Ticos en " + nombre);
      if (elSede) elSede.textContent = "Sede " + nombre;
      if (elDir)  elDir.textContent  = sede.getAttribute("data-dir");
      if (elRef)  elRef.textContent  = sede.getAttribute("data-ref") || "";
      if (elRuta) elRuta.href        = sede.getAttribute("data-ruta");
    }

    sedes.forEach(function (s) {
      var btn = $("[data-sede-pick]", s);
      if (btn) {
        btn.setAttribute("aria-pressed", s.classList.contains("is-active") ? "true" : "false");
        if (s.classList.contains("is-active")) btn.textContent = "Viendo en el mapa";
      }
      // El botón ya funciona con teclado; el clic en la tarjeta es un extra
      s.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;   // los enlaces siguen su camino
        elegir(s);
      });
    });
  }

  /* ---------- Parallax discreto de la foto de portada ----------
     Antes esto necesitaba GSAP + ScrollTrigger (44 KB comprimidos)
     para un desplazamiento del 6 %. Ahora son unas pocas líneas:
     un solo rAF, que además se apaga cuando la portada sale de pantalla. */
  function initCoverParallax() {
    if (reduced) return;
    var cover = $(".cover");
    var media = $(".cover-media img");
    if (!cover || !media) return;

    var visible = true;
    var pendiente = false;
    var ultimo = null;

    function pintar() {
      pendiente = false;
      var alto = cover.offsetHeight || 1;
      var avance = Math.min(Math.max(window.scrollY / alto, 0), 1);
      var y = Math.round(avance * 60);          // 60 px como máximo
      if (y === ultimo) return;
      ultimo = y;
      media.style.transform = "translate3d(0," + y + "px,0)";
    }

    function alHacerScroll() {
      if (pendiente || !visible) return;
      pendiente = true;
      requestAnimationFrame(pintar);
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entradas) {
        visible = entradas[0].isIntersecting;
        if (visible) alHacerScroll();
      }, { threshold: 0 }).observe(cover);
    }

    window.addEventListener("scroll", alHacerScroll, { passive: true });
    window.addEventListener("resize", function () { ultimo = null; alHacerScroll(); }, { passive: true });
    pintar();
  }

  /* =============================================================
     Formulario → WhatsApp (y correo como alternativa)
     El sitio es estático: no hay servidor que reciba el envío,
     así que el formulario compone el mensaje y abre WhatsApp.
     ============================================================= */
  function buildMessage(v) {
    var lines = [
      "Hola Sanitarios Ticos, quiero una cotización.",
      "",
      "Nombre: " + v.nombre,
      "Teléfono: " + v.telefono,
      "Servicio: " + v.servicio,
      "Zona: " + v.zona
    ];
    if (v.detalle) lines.push("Detalle: " + v.detalle);
    return lines.join("\n");
  }

  function initForm() {
    var form = $("[data-form]");
    if (!form) return;

    var msg = $("[data-form-msg]", form);
    var mailLink = $("[data-mail-fallback]", form);
    var waNumber = (data.contact && data.contact.whatsappNumber) || "50683417547";
    var email = (data.contact && data.contact.email) || "info@sanitariosticos.com";

    function readValues() {
      return {
        nombre: (form.nombre.value || "").trim(),
        telefono: (form.telefono.value || "").trim(),
        servicio: form.servicio.value || "",
        zona: (form.zona.value || "").trim(),
        detalle: (form.detalle.value || "").trim()
      };
    }

    function markErrors() {
      var ok = true;
      ["nombre", "telefono", "servicio", "zona"].forEach(function (name) {
        var input = form[name];
        var field = input.closest(".f");
        var empty = !String(input.value || "").trim();
        if (field) field.classList.toggle("is-error", empty);
        if (empty && ok) { input.focus(); ok = false; }
      });

      // La casilla de privacidad es obligatoria por ley: sin ella no
      // se guarda ni se abre WhatsApp.
      if (form.consiente) {
        var sinMarcar = !form.consiente.checked;
        var etiqueta = form.consiente.closest(".f-consiente");
        if (etiqueta) etiqueta.classList.toggle("is-error", sinMarcar);
        if (sinMarcar && ok) { form.consiente.focus(); ok = false; }
      }

      return ok;
    }

    form.addEventListener("input", function (e) {
      var field = e.target.closest && e.target.closest(".f, .f-consiente");
      if (field) field.classList.remove("is-error");
    });

    // Guarda la solicitud en el servidor ANTES de abrir WhatsApp, así el
    // dato queda aunque la persona no llegue a pulsar "enviar" allá.
    // keepalive: true es necesario porque abrir WhatsApp saca de la
    // página, y sin esto el navegador cancelaría el envío a mitad de
    // camino. Nunca bloquea ni retrasa la apertura de WhatsApp: si el
    // guardado falla (sin internet, servidor caído), igual se continúa,
    // porque la prioridad es que el cliente pueda escribir siempre.
    function guardarSolicitud(v) {
      try {
        fetch("/api/solicitud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: v.nombre, telefono: v.telefono, servicio: v.servicio,
            zona: v.zona, detalle: v.detalle, pagina: location.pathname
          }),
          keepalive: true
        }).catch(function () {});
      } catch (e) {}
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (msg) { msg.textContent = ""; msg.classList.remove("is-error"); }

      if (!markErrors()) {
        if (msg) {
          msg.textContent = "Complete los campos marcados para poder cotizarle.";
          msg.classList.add("is-error");
        }
        return;
      }

      var v = readValues();
      guardarSolicitud(v);

      var url = "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(buildMessage(v));
      window.open(url, "_blank", "noopener");
      if (msg) msg.textContent = "Abrimos WhatsApp con su mensaje listo. Sólo debe pulsar enviar.";
    });

    if (mailLink) {
      mailLink.addEventListener("click", function () {
        var v = readValues();
        var subject = "Solicitud de cotización" + (v.servicio ? " — " + v.servicio : "");
        mailLink.href = "mailto:" + email +
          "?subject=" + encodeURIComponent(subject) +
          "&body=" + encodeURIComponent(buildMessage(v));
      });
    }
  }

  /* ---------- Asistente de preguntas ---------- */
  function initAsistente() {
    var raiz = $("[data-asistente]");
    if (!raiz) return;

    var boton = $("[data-asistente-abrir]", raiz);
    var panel = $("[data-asistente-panel]", raiz);
    var hilo = $("[data-asistente-hilo]", raiz);
    var sugeridas = $("[data-asistente-sugeridas]", raiz);
    var form = $("[data-asistente-form]", raiz);
    var input = $("[data-asistente-input]", raiz);
    var pase = $("[data-asistente-pase]", raiz);
    var enlacePase = $("[data-asistente-wa]", raiz);
    var cajaCotiza = $("[data-asistente-cotiza]", raiz);
    var botonCotizar = $("[data-asistente-cotizar]", raiz);

    var historial = [];  // { role: "user"|"model", text: "..." }
    var mensajesMios = [];  // sólo lo que escribió la persona, para el traspaso
    var abierto = false;
    var yaSaludo = false;

    // Traspaso a WhatsApp sin repetir la historia.
    //
    // Se arma con lo que la persona escribió, NO con un resumen de la
    // IA: es más fiel, no gasta una llamada del cupo diario y no puede
    // inventarse nada. El mensaje queda como borrador en WhatsApp, así
    // que ella lo lee y lo puede corregir antes de mandarlo.
    var TOPE_LINEA = 140;   // por mensaje
    var TOPE_TOTAL = 420;   // en total, para no reventar el enlace

    function refrescarPase() {
      if (!pase || !enlacePase) return;
      if (!mensajesMios.length) { pase.hidden = true; return; }

      var lineas = [];
      var largo = 0;
      for (var i = 0; i < mensajesMios.length; i++) {
        var t = mensajesMios[i];
        if (t.length > TOPE_LINEA) t = t.slice(0, TOPE_LINEA - 1) + "…";
        if (largo + t.length > TOPE_TOTAL) break;
        lineas.push("· " + t);
        largo += t.length;
      }

      var texto = "Hola, vengo del chat de la página. Esto es lo que ya conté:\n"
        + lineas.join("\n")
        + "\n\nMe gustaría seguir con una persona.";

      var numero = (data.contact && data.contact.whatsappNumber) || "50683417547";
      enlacePase.href = "https://wa.me/" + numero + "?text=" + encodeURIComponent(texto);
      pase.hidden = false;
    }

    // Convierte lo que Beto escribe en los mismos enlaces que ya
    // existen como botones en el sitio: los teléfonos abren para
    // llamar y "cotización"/"WhatsApp" abren WhatsApp con el mensaje
    // ya armado — así no hay que copiar el número a mano.
    function enlazarMensaje(texto) {
      var contenedor = document.createElement("div");
      contenedor.textContent = texto;
      var html = contenedor.innerHTML;

      var contacto = data.contact || {};
      [
        [contacto.phone1, contacto.phone1Tel],
        [contacto.phone2, contacto.phone2Tel]
      ].forEach(function (par) {
        var numero = par[0], tel = par[1];
        if (!numero || !tel) return;
        var re = new RegExp(numero.replace(/[-./]/g, "\\$&"), "g");
        html = html.replace(re, '<a href="tel:' + tel + '">' + numero + "</a>");
      });

      if (contacto.whatsappNumber) {
        var urlWa = "https://wa.me/" + contacto.whatsappNumber
          + "?text=" + encodeURIComponent("Hola, necesito una cotización.");
        var abrirWa = function (texto) {
          return '<a href="' + urlWa + '" target="_blank" rel="noopener">' + texto + "</a>";
        };
        html = html.replace(/WhatsApp/g, abrirWa("WhatsApp"));
        html = html.replace(/cotizaci[oó]n(es)?/gi, abrirWa);
      }

      return html;
    }

    // `sinEnlaces` es para los mensajes del cotizador: ahí la palabra
    // "cotización" ya no es una invitación a pedir una por WhatsApp —
    // la persona acaba de recibir la suya — y enlazarla contradice
    // la frase que la contiene.
    function agregarMensaje(texto, esUsuario, sinEnlaces) {
      var div = document.createElement("div");
      div.className = "asistente-msg " + (esUsuario ? "es-usuario" : "es-bot");
      if (esUsuario || sinEnlaces) {
        div.textContent = texto;
      } else {
        div.innerHTML = enlazarMensaje(texto);
      }
      hilo.appendChild(div);
      hilo.scrollTop = hilo.scrollHeight;
      return div;
    }

    function agregarEscribiendo() {
      var div = document.createElement("div");
      div.className = "asistente-typing";
      div.innerHTML = "<span></span><span></span><span></span>";
      hilo.appendChild(div);
      hilo.scrollTop = hilo.scrollHeight;
      return div;
    }

    function saludarSiHaceFalta() {
      if (yaSaludo) return;
      yaSaludo = true;
      agregarMensaje("¡Pura vida! Soy Beto, el asistente virtual de Sanitarios Ticos. Con toda la pata le ayudo con dudas sobre nuestros servicios, cobertura y cómo pedir una cotización.", false);
    }

    function abrirPanel() {
      abierto = true;
      raiz.classList.add("is-open");
      panel.hidden = false;
      // Se agrega la clase un instante después de mostrarlo, para que
      // la transición de escala/opacidad sí se note (si se agregara
      // en el mismo instante que se quita "hidden", el navegador no
      // anima el cambio).
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { panel.classList.add("is-visible"); });
      });
      boton.setAttribute("aria-expanded", "true");
      saludarSiHaceFalta();
      setTimeout(function () { input.focus(); }, 200);
    }

    function cerrarPanel() {
      abierto = false;
      raiz.classList.remove("is-open");
      panel.classList.remove("is-visible");
      boton.setAttribute("aria-expanded", "false");
      setTimeout(function () { if (!abierto) panel.hidden = true; }, 220);
    }

    boton.addEventListener("click", function () {
      if (abierto) cerrarPanel(); else abrirPanel();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && abierto) { cerrarPanel(); boton.focus(); }
    });

    function mandarPregunta(pregunta) {
      pregunta = String(pregunta || "").trim();
      if (!pregunta) return;

      agregarMensaje(pregunta, true);
      if (sugeridas) sugeridas.hidden = true;
      input.value = "";

      // Se ofrece el traspaso apenas escribe, sin esperar la respuesta:
      // si Beto falla o tarda, el camino a una persona ya está ahí.
      mensajesMios.push(pregunta);
      refrescarPase();

      var cargando = agregarEscribiendo();

      fetch("/api/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: pregunta, history: historial })
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          cargando.remove();
          var respuesta = (d && d.reply) || "No pude responder justo ahora. Puede escribirnos por WhatsApp o llamar al 2440-1110.";
          agregarMensaje(respuesta, false);
          historial.push({ role: "user", text: pregunta });
          historial.push({ role: "model", text: respuesta });
        })
        .catch(function () {
          cargando.remove();
          agregarMensaje("No pude responder justo ahora. Puede escribirnos por WhatsApp o llamar al 2440-1110.", false);
        });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      mandarPregunta(input.value);
    });

    if (sugeridas) {
      $$("button", sugeridas).forEach(function (b) {
        b.addEventListener("click", function () { mandarPregunta(b.textContent); });
      });
    }

    /* -------- Cotizador ---------------------------------------------
       Beto conversa, pero el precio NO lo inventa él: estos botones
       recogen los datos y el servidor hace la cuenta. Un modelo de
       lenguaje haciendo aritmética se equivoca tarde o temprano, y una
       cotización equivocada la paga la empresa.

       Tampoco se pregunta el tamaño del tanque, que casi nadie sabe: se
       pregunta cuánta gente vive ahí y hace cuánto lo limpiaron, que
       predice el volumen igual de bien. */

    var opciones = null;      // catálogo que manda el servidor
    var respuestas = {};      // lo que va contestando la persona
    var pasoActual = 0;

    // El orden importa: el servicio primero, porque de él dependen las
    // opciones de los tres pasos siguientes.
    var PASOS = [
      { clave: "servicio", pregunta: "¿Qué servicio necesita?" },
      { clave: "perfil",   pregunta: "¿Para qué tipo de propiedad?" },
      { clave: "ultimo",   pregunta: "¿Hace cuánto se le hizo el servicio por última vez?" },
      { clave: "acceso",   pregunta: "¿Qué tan cerca puede parquear el camión?" },
      { clave: "zona",     pregunta: "¿Dónde queda?" }
    ];

    function opcionesDelPaso(clave) {
      if (clave === "servicio") {
        return Object.keys(opciones.servicios).map(function (id) {
          return { id: id, etiqueta: opciones.servicios[id].nombre };
        });
      }
      if (clave === "zona") return opciones.zona;
      var svc = opciones.servicios[respuestas.servicio];
      return svc ? svc[clave] : [];
    }

    // Fila de botones dentro del hilo. Al elegir, la fila se reemplaza
    // por la respuesta como burbuja, para que quede el rastro de lo que
    // se contestó.
    function pintarOpciones(lista, alElegir) {
      var caja = document.createElement("div");
      caja.className = "asistente-ops";
      lista.forEach(function (op) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = op.etiqueta;
        b.addEventListener("click", function () {
          caja.remove();
          agregarMensaje(op.etiqueta, true);
          alElegir(op);
        });
        caja.appendChild(b);
      });
      hilo.appendChild(caja);
      hilo.scrollTop = hilo.scrollHeight;
    }

    function siguientePaso() {
      if (pasoActual >= PASOS.length) return pedirPrecio();
      var paso = PASOS[pasoActual];
      agregarMensaje(paso.pregunta, false, true);
      pintarOpciones(opcionesDelPaso(paso.clave), function (op) {
        respuestas[paso.clave] = op.id;
        pasoActual++;
        siguientePaso();
      });
    }

    function pedirPrecio() {
      var cargando = agregarEscribiendo();
      fetch("/api/cotizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(respuestas)
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          cargando.remove();
          if (!d || !d.ok) throw new Error("sin cotización");
          mostrarCotizacion(d);
        })
        .catch(function () {
          cargando.remove();
          agregarMensaje(
            "Uy, no me salió el cálculo. Mejor llame al 2440-1110 y se lo cotizamos de una vez.",
            false
          );
          if (cajaCotiza) cajaCotiza.hidden = false;
        });
    }

    function colones(n) {
      return "₡" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    function mostrarCotizacion(d) {
      var partes = [
        "Le sale entre " + colones(d.min) + " y " + colones(d.max) + " por el servicio de " +
        d.servicioNombre.toLowerCase() + "."
      ];

      // Mientras las tarifas sean las provisionales, se dice. Callarlo
      // sería dar por firme un número que la empresa no confirmó.
      if (d.provisional) {
        partes.push(
          "Ojo: es un estimado con tarifas todavía en revisión. El precio en firme se lo " +
          "damos por teléfono, siempre antes de salir y sin costo."
        );
      } else {
        partes.push(
          "Es un rango orientativo. El precio exacto se lo confirmamos antes de salir, sin costo."
        );
      }
      if (d.numero) partes.push("Su número de cotización es " + d.numero + ".");

      agregarMensaje(partes.join(" "), false, true);

      // Con el número en mano, el traspaso a WhatsApp lleva la cotización.
      mensajesMios.push(
        "Cotización " + (d.numero || "") + ": " + d.servicioNombre +
        ", entre " + colones(d.min) + " y " + colones(d.max)
      );
      refrescarPase();

      // Se vuelve a ofrecer el botón: mucha gente cotiza dos servicios
      // en la misma visita (el tanque y la trampa de grasa, por ejemplo).
      if (cajaCotiza) cajaCotiza.hidden = false;
    }

    function arrancarCotizador() {
      if (cajaCotiza) cajaCotiza.hidden = true;
      if (sugeridas) sugeridas.hidden = true;
      respuestas = {};
      pasoActual = 0;

      agregarMensaje(
        "Con gusto. Son cinco preguntas rápidas y le doy un estimado. " +
        "No necesito que sepa el tamaño del tanque.",
        false, true
      );

      if (opciones) return siguientePaso();

      var cargando = agregarEscribiendo();
      fetch("/api/cotizar/opciones")
        .then(function (r) { return r.json(); })
        .then(function (d) {
          cargando.remove();
          if (!d || !d.ok) throw new Error("sin opciones");
          opciones = d;
          siguientePaso();
        })
        .catch(function () {
          cargando.remove();
          agregarMensaje(
            "No pude cargar el cotizador ahora mismo. Llame al 2440-1110 y se lo cotizamos de una vez.",
            false
          );
          if (cajaCotiza) cajaCotiza.hidden = false;
        });
    }

    if (botonCotizar) {
      botonCotizar.addEventListener("click", function () {
        if (!abierto) abrirPanel();
        arrancarCotizador();
      });
    }
  }

  function initYear() {
    var el = $("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  // Los botones flotantes se apartan mientras se baja y vuelven apenas
  // se sube, para no tapar el texto en pantallas pequeñas. Antes se les
  // reservaba un hueco fijo en cada lista, que le quitaba ancho a todo.
  function initFabsAlBajar() {
    var wa = $(".wa-fab");
    var chat = $("[data-asistente]");
    if (!wa && !chat) return;

    var ultimo = window.scrollY;
    var pendiente = false;

    function revisar() {
      pendiente = false;
      var y = window.scrollY;
      var fin = document.documentElement.scrollHeight - window.innerHeight - 80;

      // Con el chat abierto no se mueve nada.
      if (chat && chat.classList.contains("is-open")) {
        document.body.classList.remove("fabs-fuera");
        ultimo = y;
        return;
      }

      // Cerca del inicio o del final siempre se ven: ahí es donde la
      // persona busca cómo contactar.
      var esconder = y > 260 && y > ultimo + 6 && y < fin;
      var mostrar = y < ultimo - 6 || y <= 260 || y >= fin;

      if (esconder) document.body.classList.add("fabs-fuera");
      else if (mostrar) document.body.classList.remove("fabs-fuera");

      ultimo = y;
    }

    window.addEventListener("scroll", function () {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(revisar);
    }, { passive: true });
  }

  function boot() {
    safe(initHead, "initHead");
    safe(initAnchors, "initAnchors");
    safe(initReveals, "initReveals");
    safe(initFaq, "initFaq");
    safe(initAsistente, "initAsistente");
    safe(initMapa, "initMapa");
    safe(initForm, "initForm");
    safe(initYear, "initYear");
    safe(initFabsAlBajar, "initFabsAlBajar");

    safe(initCoverParallax, "initCoverParallax");

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
