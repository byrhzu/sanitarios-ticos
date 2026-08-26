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
      return ok;
    }

    form.addEventListener("input", function (e) {
      var field = e.target.closest && e.target.closest(".f");
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

  /* ---------- Calculadora rápida (sin IA: son reglas fijas) ---------- */
  function formatoColones(n) {
    // toLocaleString("es-CR") separa los miles con espacio; en Costa Rica
    // se usa punto (₡25.000), así que se arma el separador a mano.
    var entero = String(Math.round(n));
    var conPuntos = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return "₡" + conPuntos;
  }

  function initCotizador() {
    var raiz = $("[data-calc]");
    if (!raiz) return;
    var tarifas = data.tarifas;
    if (!tarifas || !tarifas.servicios || !tarifas.servicios.length) return;

    var selServicio = $("[data-calc-servicio]", raiz);
    var campoOpcion = $("[data-calc-campo-opcion]", raiz);
    var etiquetaOpcion = $("[data-calc-etiqueta-opcion]", raiz);
    var selOpcion = $("[data-calc-opcion]", raiz);
    var selZona = $("[data-calc-zona]", raiz);
    var resultado = $("[data-calc-resultado]", raiz);
    var elMonto = $("[data-calc-monto]", raiz);

    tarifas.servicios.forEach(function (s) {
      var op = document.createElement("option");
      op.value = s.id;
      op.textContent = s.nombre;
      selServicio.appendChild(op);
    });

    function servicioActual() {
      var id = selServicio.value;
      return tarifas.servicios.filter(function (s) { return s.id === id; })[0] || null;
    }

    function pintarOpciones() {
      var s = servicioActual();
      selOpcion.innerHTML = "";
      if (!s) { campoOpcion.hidden = true; calcular(); return; }
      etiquetaOpcion.textContent = s.pregunta;
      s.opciones.forEach(function (o, i) {
        var op = document.createElement("option");
        op.value = String(i);
        op.textContent = o.etiqueta;
        selOpcion.appendChild(op);
      });
      campoOpcion.hidden = false;
      calcular();
    }

    function calcular() {
      var s = servicioActual();
      if (!s) { resultado.hidden = true; return; }
      var opcion = s.opciones[Number(selOpcion.value) || 0];
      if (!opcion) { resultado.hidden = true; return; }

      var factor = selZona.value === "resto" ? 1 + (tarifas.recargoFueraValle || 0) : 1;
      var min = opcion.rango[0] * factor;
      var max = opcion.rango[1] * factor;

      elMonto.textContent = formatoColones(min) + " – " + formatoColones(max);
      resultado.hidden = false;

      // Deja el servicio ya elegido en el formulario real, más abajo.
      var selFormulario = document.getElementById("f-servicio");
      if (selFormulario) {
        Array.prototype.forEach.call(selFormulario.options, function (op) {
          if (op.textContent === s.nombre) selFormulario.value = op.value;
        });
      }
    }

    selServicio.addEventListener("change", pintarOpciones);
    selOpcion.addEventListener("change", calcular);
    selZona.addEventListener("change", calcular);
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

    var historial = [];  // { role: "user"|"model", text: "..." }
    var abierto = false;
    var yaSaludo = false;

    function agregarMensaje(texto, esUsuario) {
      var div = document.createElement("div");
      div.className = "asistente-msg " + (esUsuario ? "es-usuario" : "es-bot");
      div.textContent = texto;
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
      agregarMensaje("¡Hola! Soy el asistente virtual de Sanitarios Ticos. Puedo ayudarle con dudas sobre nuestros servicios, cobertura y cómo pedir una cotización.", false);
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
  }

  function initYear() {
    var el = $("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function boot() {
    safe(initHead, "initHead");
    safe(initAnchors, "initAnchors");
    safe(initReveals, "initReveals");
    safe(initFaq, "initFaq");
    safe(initCotizador, "initCotizador");
    safe(initAsistente, "initAsistente");
    safe(initMapa, "initMapa");
    safe(initForm, "initForm");
    safe(initYear, "initYear");

    safe(initCoverParallax, "initCoverParallax");

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
