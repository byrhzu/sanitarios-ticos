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

  /* ---------- Formatos costarricenses ----------
     Mismas reglas que lib/datos-cr.js, que es el que manda: esto sirve
     para avisar de una vez, sin esperar al servidor. Si algo se cuela,
     el servidor lo vuelve a revisar y lo rechaza igual.

     Ver ese archivo para el porqué de cada formato. En resumen: los
     teléfonos son 8 dígitos y empiezan con 2, 4, 6, 7 u 8; la cédula
     de persona lleva 9 dígitos, la jurídica 10 empezando con 3, y el
     DIMEX 11 o 12. */
  var CR = {
    /* Cuántos días de alquiler. La gente contesta "unos 15" o "15 días",
       así que se saca el número de la frase igual que el teléfono. */
    dias: function (entrada) {
      var d = String(entrada == null ? "" : entrada).match(/\d+/);
      var n = d ? parseInt(d[0], 10) : NaN;
      if (!n) return { ok: false, error: "No entendí cuántos días." };
      if (n > 365) return { ok: false, error: "Para más de un año mejor lo hablamos por teléfono." };
      return { ok: true, valor: String(n) };
    },

    telefono: function (entrada) {
      var texto = String(entrada == null ? "" : entrada);
      var rx = /(?:\+?506[\s.-]*)?(\d[\d\s.-]{6,}\d)/g, m, d;
      while ((m = rx.exec(texto)) !== null) {
        d = m[0].replace(/\D/g, "");
        if (d.length === 11 && d.indexOf("506") === 0) d = d.slice(3);
        if (d.length === 8 && /^[24-8]/.test(d)) {
          return { ok: true, valor: d.slice(0, 4) + "-" + d.slice(4) };
        }
      }
      var solo = texto.replace(/\D/g, "");
      if (!solo) return { ok: false, error: "No encontré un número de teléfono." };
      if (solo.length < 8) return { ok: false, error: "Los teléfonos de Costa Rica llevan 8 dígitos." };
      return { ok: false, error: "Ese número no parece de Costa Rica. Son 8 dígitos y empiezan con 2, 4, 6, 7 u 8." };
    },

    cedula: function (entrada) {
      var d = String(entrada == null ? "" : entrada).replace(/\D/g, "");
      if (!d) return { ok: false, error: "No encontré un número de cédula." };
      if (d.length === 9) return { ok: true, valor: d[0] + "-" + d.slice(1, 5) + "-" + d.slice(5) };
      if (d.length === 10 && d[0] === "3") return { ok: true, valor: "3-" + d.slice(1, 4) + "-" + d.slice(4) };
      if (d.length === 10 || d.length === 11 || d.length === 12) return { ok: true, valor: d };
      return { ok: false, error: d.length < 9
        ? "Esa cédula queda corta. La de persona lleva 9 dígitos y la jurídica 10."
        : "Esa cédula queda larga. La de persona lleva 9 dígitos, la jurídica 10 y el DIMEX 11 o 12." };
    },

    correo: function (entrada) {
      var m = String(entrada == null ? "" : entrada).trim()
        .match(/[^\s@,;<>()]+@[^\s@,;<>()]+\.[A-Za-z]{2,}/);
      if (!m) return { ok: false, error: "Eso no parece un correo. Debería llevar arroba y un punto." };
      return { ok: true, valor: m[0].toLowerCase().replace(/[.,;]+$/, "") };
    },

    nombre: function (entrada) {
      var t = String(entrada == null ? "" : entrada).replace(/\s+/g, " ").trim()
        .replace(/^(?:soy|me llamo|mi nombre es|es|para|a nombre de)\s+/i, "")
        .replace(/[.,;:]+$/, "").trim();
      if (t.length < 2 || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(t)) {
        return { ok: false, error: "No entendí el nombre." };
      }
      return { ok: true, valor: t.slice(0, 120) };
    }
  };

  function initForm() {
    var form = $("[data-form]");
    if (!form) return;

    var msg = $("[data-form-msg]", form);
    var mailLink = $("[data-mail-fallback]", form);
    var waNumber = (data.contact && data.contact.whatsappNumber) || "50683417547";
    var email = (data.contact && data.contact.email) || "info@sanitariosticos.com";

    function readValues() {
      var provincia = form.provincia ? form.provincia.value || "" : "";
      var canton = form.canton ? form.canton.value || "" : "";
      var distrito = form.distrito ? (form.distrito.value || "").trim() : "";

      return {
        nombre: (form.nombre.value || "").trim(),
        telefono: (form.telefono.value || "").trim(),
        servicio: form.servicio.value || "",
        // El texto que se guarda en la solicitud y el código que
        // entiende el motor son cosas distintas: "Limpieza y destaqueo
        // de tuberías" es lo que lee una persona, "destaqueo" es lo que
        // busca la tabla de tarifas. Confundirlos hacía que Frank se
        // saltara la pregunta con un servicio que no existía.
        servicioCotiza: (form.servicio.selectedOptions &&
                         form.servicio.selectedOptions[0] &&
                         form.servicio.selectedOptions[0].dataset.cotiza) || "",
        cedula: form.cedula ? (form.cedula.value || "").trim() : "",
        correo: form.correo ? (form.correo.value || "").trim() : "",
        provincia: provincia,
        canton: canton,
        distrito: distrito,
        // De lo fino a lo ancho, como se escribe una dirección acá.
        zona: [distrito, canton, provincia].filter(Boolean).join(", "),
        detalle: (form.detalle.value || "").trim()
      };
    }

    /* Provincia, cantón y distrito se escogen; no se escriben. Es lo que
       evita que la misma zona llegue como "Belén", "Belen" y "belen", y
       que el cantón —que decide el cobro de ruta— sea uno inventado.

       Si la lista no carga, los tres campos pasan a texto libre: un
       formulario que no se puede enviar es peor que una zona sin
       validar. */
    function cargarTerritorio() {
      var selP = form.provincia, selC = form.canton, selD = form.distrito;
      if (!selP || !selC || !selD) return;

      var aTexto = function () {
        var ejemplos = { provincia: "Ej. Heredia", canton: "Ej. Belén", distrito: "Ej. San Antonio" };
        [selP, selC, selD].forEach(function (sel) {
          var libre = document.createElement("input");
          libre.type = "text";
          libre.name = sel.name;
          libre.id = sel.id;
          libre.required = sel.name !== "distrito";
          libre.placeholder = ejemplos[sel.name] || "";
          sel.parentNode.replaceChild(libre, sel);
        });
      };

      var llenar = function (sel, lista, vacio) {
        sel.innerHTML = "";
        var v = document.createElement("option");
        v.value = "";
        v.textContent = lista.length ? "Seleccione…" : vacio;
        sel.appendChild(v);
        lista.forEach(function (t) {
          var o = document.createElement("option");
          o.value = t; o.textContent = t;
          sel.appendChild(o);
        });
        sel.disabled = !lista.length;
      };

      fetch("/api/geografia")
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d || !d.ok || !d.geografia) throw new Error("sin geografía");
          var g = d.geografia;

          llenar(selP, Object.keys(g), "");
          selP.disabled = false;

          selP.addEventListener("change", function () {
            llenar(selC, Object.keys(g[selP.value] || {}), "Primero la provincia");
            llenar(selD, [], "Primero el cantón");
          });
          selC.addEventListener("change", function () {
            var cantones = g[selP.value] || {};
            llenar(selD, cantones[selC.value] || [], "Primero el cantón");
          });
        })
        .catch(aTexto);
    }
    cargarTerritorio();

    var errorDeFormato = "";

    function markErrors() {
      var ok = true;
      errorDeFormato = "";

      ["nombre", "telefono", "servicio", "provincia", "canton", "distrito"].forEach(function (name) {
        if (!form[name]) return;
        var input = form[name];
        var field = input.closest(".f");
        var empty = !String(input.value || "").trim();
        if (field) field.classList.toggle("is-error", empty);
        if (empty && ok) { input.focus(); ok = false; }
      });

      /* Formato de lo que sí escribieron. Al validar se reescribe el
         campo con el dato ya en formato: así la persona ve qué se va a
         guardar antes de mandarlo, en vez de descubrirlo en la
         cotización. Un campo opcional vacío se salta; uno mal escrito
         no, porque terminaría impreso. */
      [["nombre", true], ["telefono", true], ["cedula", false], ["correo", false]]
        .forEach(function (par) {
          var campo = form[par[0]];
          if (!campo) return;
          var crudo = String(campo.value || "").trim();
          if (!crudo && !par[1]) return;
          if (!crudo) return;   // el vacío obligatorio ya se marcó arriba

          var r = CR[par[0]](crudo);
          var caja = campo.closest(".f");
          if (r.ok) {
            campo.value = r.valor;
            if (caja) caja.classList.remove("is-error");
          } else {
            if (caja) caja.classList.add("is-error");
            if (ok) { campo.focus(); ok = false; errorDeFormato = r.error; }
          }
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
            zona: v.zona, detalle: v.detalle, pagina: location.pathname,
            cedula: v.cedula, correo: v.correo,
            provincia: v.provincia, canton: v.canton, distrito: v.distrito
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
          msg.textContent = errorDeFormato ||
            "Complete los campos marcados para poder cotizarle.";
          msg.classList.add("is-error");
        }
        return;
      }

      var v = readValues();
      guardarSolicitud(v);

      var url = "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(buildMessage(v));
      window.open(url, "_blank", "noopener");
      if (msg) msg.textContent = "Abrimos WhatsApp con su mensaje listo. Sólo debe pulsar enviar.";
      ofrecerCotizacion(v);
    });

    /* La solicitud ya quedó guardada; esto es el paso de más que la
       convierte en cotización con número. Se ofrece, no se impone: la
       persona ya hizo lo que vino a hacer y puede irse tranquila. */
    function ofrecerCotizacion(v) {
      if ($("[data-form-seguir]", form)) return;

      var caja = document.createElement("p");
      caja.className = "form-seguir";
      caja.setAttribute("data-form-seguir", "");

      var texto = document.createElement("span");
      texto.textContent = "¿Quiere el estimado de una vez? Son tres preguntas más y le queda la cotización con su número.";

      var boton = document.createElement("button");
      boton.type = "button";
      boton.className = "btn btn-line";
      boton.textContent = "Seguir con Frank";
      boton.addEventListener("click", function () {
        document.dispatchEvent(new CustomEvent("cotizar-con-datos", {
          detail: {
            servicio: v.servicioCotiza,
            nombre: v.nombre, cedula: v.cedula, telefono: v.telefono, correo: v.correo,
            provincia: v.provincia, canton: v.canton, distrito: v.distrito
          }
        }));
      });

      caja.appendChild(texto);
      caja.appendChild(boton);
      form.appendChild(caja);
    }

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

    // Convierte lo que Frank escribe en los mismos enlaces que ya
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
      agregarMensaje("¡Pura vida! Soy Frank, el asistente virtual de Sanitarios Ticos. Con toda la pata le ayudo con dudas sobre nuestros servicios, cobertura y cómo pedir una cotización.", false);
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

      // Si el cotizador está esperando un dato escrito, lo que la
      // persona teclea es la respuesta a esa pregunta, no una consulta
      // nueva para Frank.
      if (esperando) {
        agregarMensaje(pregunta, true);
        input.value = "";
        var recibir = esperando;
        esperando = null;
        recibir(pregunta);
        return;
      }

      agregarMensaje(pregunta, true);
      if (sugeridas) sugeridas.hidden = true;
      input.value = "";

      // Se ofrece el traspaso apenas escribe, sin esperar la respuesta:
      // si Frank falla o tarda, el camino a una persona ya está ahí.
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

          // Cuando alguien pide una cotización conversando, Frank cierra
          // su respuesta con esta marca. Se quita del texto y se arranca
          // el mismo cuestionario del botón: da igual por dónde entró,
          // termina en una cotización de verdad.
          var quiereCotizar = respuesta.indexOf("[[COTIZAR]]") !== -1;
          respuesta = respuesta.replace(/\s*\[\[COTIZAR\]\]\s*/g, " ").trim();

          agregarMensaje(respuesta, false);
          historial.push({ role: "user", text: pregunta });
          historial.push({ role: "model", text: respuesta });

          if (quiereCotizar && !cotizando) arrancarCotizador(true);
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
       Frank conversa, pero el precio NO lo inventa él: estas preguntas
       recogen los datos y el servidor hace la cuenta. Un modelo de
       lenguaje haciendo aritmética se equivoca tarde o temprano, y una
       cotización equivocada la paga la empresa.

       Tampoco se pregunta el tamaño del tanque, que casi nadie sabe: se
       pregunta cuánta gente vive ahí y hace cuánto lo limpiaron, que
       predice el volumen igual de bien.

       Hay tres formas de llegar acá —el botón, una conversación con
       Frank, o el formulario de contacto— y las tres terminan en la
       misma cotización guardada. */

    var opciones = null;      // tarifas y preguntas, del servidor
    var geografia = null;     // provincias, cantones y distritos
    var respuestas = {};      // lo que va contestando la persona
    var pasoActual = 0;
    var cotizando = false;
    var esperando = null;     // función que espera un dato escrito

    /* El orden no es casual: primero lo que se contesta tocando un
       botón, y de último lo que hay que escribir. Quien abandona a
       mitad, abandona en la parte aburrida, no en la primera pregunta. */
    /* Las preguntas del trabajo dependen del servicio: un tanque séptico
       necesita saber su forma y su medida, un alquiler cuántos días, y
       un destaqueo nada — el precio ya está en tabla. Por eso la lista
       no es fija: se arma cuando la persona escoge el servicio. */
    function pasosDelTrabajo() {
      var svc = opciones.servicios[respuestas.servicio];
      if (!svc) return [];
      if (svc.tipo === "tanque") {
        return [
          { clave: "forma", tipo: "ops",
            pregunta: "¿Qué forma tiene el tanque? Si no está seguro, asómese al patio: con verlo basta." },
          { clave: "medida", tipo: "ops", pregunta: "¿Y de qué medida es?" },
          { clave: "antiguedad", tipo: "ops",
            pregunta: "¿Hace cuánto se le hizo la última limpieza?" }
        ];
      }
      if (svc.tipo === "alquiler") {
        return [{ clave: "dias", tipo: "texto", formato: "dias",
          pregunta: "¿Por cuántos días lo necesita? El mínimo son " + (svc.diasMinimo || 8) + "." }];
      }
      return [];
    }

    function armarPasos() {
      return [{ clave: "servicio", tipo: "ops", pregunta: "¿Qué servicio necesita?" }]
        .concat(pasosDelTrabajo(), PASOS_FIJOS);
    }

    var PASOS_FIJOS = [
      { clave: "provincia", tipo: "ops",  pregunta: "¿En qué provincia queda?" },
      { clave: "canton",    tipo: "ops",  pregunta: "¿Y en qué cantón?" },
      { clave: "distrito",  tipo: "ops",   pregunta: "¿Y el distrito?" },
      { clave: "nombre",    tipo: "texto", formato: "nombre",
        pregunta: "Listo con la dirección. Ahora, ¿a nombre de quién emito la cotización?" },
      { clave: "cedula",    tipo: "texto", formato: "cedula", opcional: true,
        pregunta: "¿Su cédula? Va en el documento, como en cualquier cotización formal. Sirve la de persona o la jurídica si es a nombre de una empresa. Si prefiere no darla, escriba «después»." },
      { clave: "telefono",  tipo: "texto", formato: "telefono",
        pregunta: "¿A qué número la contactamos?" },
      { clave: "correo",    tipo: "texto", formato: "correo", opcional: true,
        pregunta: "¿Y su correo? Si no usa, escriba «no tengo»." }
    ];

    var PASOS = armarPasos();

    // Lo que la persona escribe para decir "ese dato no se lo doy".
    var SIN_DATO = /^(no|no tengo|ninguno|ninguna|despu[eé]s|luego|paso|omitir|nada|-)$/i;

    function opcionesDelPaso(clave) {
      if (clave === "servicio") {
        return Object.keys(opciones.servicios).map(function (id) {
          return { id: id, etiqueta: opciones.servicios[id].nombre };
        });
      }
      // La dirección se escoge de la lista oficial, nunca se escribe:
      // así el cantón que decide el cobro de ruta siempre existe.
      var comoOpciones = function (lista) {
        return lista.map(function (t) { return { id: t, etiqueta: t }; });
      };
      if (clave === "provincia") return comoOpciones(Object.keys(geografia));
      if (clave === "canton") return comoOpciones(Object.keys(geografia[respuestas.provincia] || {}));
      if (clave === "distrito") {
        var cantones = geografia[respuestas.provincia] || {};
        return comoOpciones(cantones[respuestas.canton] || []);
      }
      var svc = opciones.servicios[respuestas.servicio];
      if (!svc) return [];
      if (clave === "forma") {
        return (svc.formas || []).map(function (f) {
          return { id: f.id, etiqueta: f.etiqueta };
        });
      }
      if (clave === "medida") {
        // Las medidas viven dentro de la forma que ya se escogió.
        var f = (svc.formas || []).filter(function (x) { return x.id === respuestas.forma; })[0];
        return f ? f.medidas : [];
      }
      if (clave === "antiguedad") return svc.antiguedad || [];
      return svc[clave] || [];
    }

    /* Fila de botones dentro del hilo. Al elegir, la fila se reemplaza
       por la respuesta como burbuja, para que quede el rastro. */
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
      // Lo que ya se sabe no se vuelve a preguntar. Es lo que permite
      // que el formulario de contacto entregue el nombre, el teléfono y
      // la dirección, y Frank sólo pida lo que falta para el precio.
      while (pasoActual < PASOS.length && respuestas[PASOS[pasoActual].clave]) {
        var p = PASOS[pasoActual];
        // Un dato heredado que no esté en la lista no sirve: mejor
        // volver a preguntarlo que mandar una dirección que no existe.
        if (p.tipo === "ops" && !opcionesDelPaso(p.clave).some(function (o) {
          return o.id === respuestas[p.clave];
        })) { delete respuestas[p.clave]; break; }
        pasoActual++;
      }
      if (pasoActual >= PASOS.length) return confirmar();

      var paso = PASOS[pasoActual];
      agregarMensaje(paso.pregunta, false, true);

      if (paso.tipo === "texto") {
        // Se contesta escribiendo en la misma caja de siempre, que es
        // lo que hace que esto se sienta una conversación y no un
        // formulario disfrazado de chat.
        input.focus();
        // Nombrada para poder volver a ponerse en espera cuando el dato
        // viene mal: `arguments.callee` no existe en modo estricto.
        esperando = function recibir(valor) {
          valor = valor.trim();

          // "no tengo", "después": el campo opcional se salta.
          if (paso.opcional && SIN_DATO.test(valor)) {
            pasoActual++;
            return siguientePaso();
          }

          /* La gente contesta con frases —"escríbame al 8888-8888"— y
             guardar la frase entera la mete en un documento formal. Se
             saca el dato; si no se puede, Frank lo dice y pregunta otra
             vez, que es lo que haría alguien al teléfono. */
          if (paso.formato) {
            var r = CR[paso.formato](valor);
            if (!r.ok) {
              agregarMensaje(r.error + " ¿Me lo repite?", false, true);
              input.focus();
              esperando = recibir;
              return;
            }
            valor = r.valor;
          }

          respuestas[paso.clave] = valor;
          pasoActual++;
          siguientePaso();
        };
        return;
      }

      var lista = opcionesDelPaso(paso.clave);
      if (!lista.length) {
        // No debería pasar, pero si pasa la conversación queda trabada
        // en una pregunta sin respuestas posibles. Mejor decirlo.
        agregarMensaje(
          "Uy, se me enredó el cotizador. Llame al 2440-1110 y se lo cotizamos de una vez.",
          false
        );
        return terminar();
      }
      pintarOpciones(lista, function (op) {
        respuestas[paso.clave] = op.id;
        // Escoger el servicio cambia qué se pregunta después; escoger
        // la forma cambia qué medidas hay. En los dos casos hay que
        // rearmar la lista antes de seguir.
        if (paso.clave === "servicio") {
          delete respuestas.forma; delete respuestas.medida;
          delete respuestas.antiguedad; delete respuestas.dias;
          PASOS = armarPasos();
        }
        pasoActual++;
        siguientePaso();
      });
    }

    /* Antes de mandar nada, Frank repite lo que entendió. Es el paso que
       convierte esto en una conversación con alguien y no en un envío a
       ciegas — y de paso atrapa el dedo gordo en el teléfono. */
    function confirmar() {
      var svc = opciones.servicios[respuestas.servicio];
      var lineas = [
        "Perfecto. Déjeme repetirle lo que anoté:",
        "",
        "Servicio: " + (svc ? svc.nombre : respuestas.servicio)
      ];
      // Lo del trabajo sólo si el servicio lo pidió.
      if (respuestas.forma) {
        var lf = opcionesDelPaso("forma").filter(function (o) { return o.id === respuestas.forma; })[0];
        var lm = opcionesDelPaso("medida").filter(function (o) { return o.id === respuestas.medida; })[0];
        lineas.push("Tanque: " + [lf && lf.etiqueta, lm && lm.etiqueta].filter(Boolean).join(", "));
      }
      if (respuestas.antiguedad) {
        var la = opcionesDelPaso("antiguedad").filter(function (o) { return o.id === respuestas.antiguedad; })[0];
        if (la) lineas.push("Última limpieza: " + la.etiqueta);
      }
      if (respuestas.dias) lineas.push("Días de alquiler: " + respuestas.dias);
      lineas = lineas.concat([
        "Dirección: " + [respuestas.distrito, respuestas.canton, respuestas.provincia]
          .filter(Boolean).join(", "),
        "A nombre de: " + (respuestas.nombre || "—"),
        "Teléfono: " + (respuestas.telefono || "—")
      ]);
      if (respuestas.cedula) lineas.push("Cédula: " + respuestas.cedula);
      if (respuestas.correo) lineas.push("Correo: " + respuestas.correo);
      lineas.push("", "¿Está todo bien?");

      agregarMensaje(lineas.join("\n"), false, true);

      pintarOpciones(
        [{ id: "si", etiqueta: "Sí, está bien" },
         { id: "no", etiqueta: "Hay algo que corregir" }],
        function (op) {
          if (op.id === "si") return pedirPrecio();
          agregarMensaje(
            "Con gusto, empecemos de nuevo — es más rápido que andar buscando cuál fue.",
            false, true
          );
          arrancarCotizador(true);
        }
      );
    }

    function pedirPrecio() {
      var cargando = agregarEscribiendo();
      fetch("/api/cotizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.assign({ origen: "beto" }, respuestas))
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          cargando.remove();
          if (!res.ok || !res.d.ok) throw new Error((res.d && res.d.error) || "sin cotización");
          mostrarCotizacion(res.d);
        })
        .catch(function (err) {
          cargando.remove();
          agregarMensaje(
            (err && err.message ? err.message + ". " : "") +
            "No me salió el cálculo. Mejor llame al 2440-1110 y se lo cotizamos de una vez.",
            false
          );
          terminar();
        });
    }

    function colones(n) {
      return "₡" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    function mostrarCotizacion(d) {
      /* Cuando el mínimo y el máximo son iguales no es un rango de cero
         de ancho: es un piso. Se dice "desde", que es lo que significa. */
      var esDesde = d.desde || d.min === d.max;
      var partes = [
        (esDesde
          ? "Le sale desde " + colones(d.min)
          : "Le sale entre " + colones(d.min) + " y " + colones(d.max)) +
        " por el servicio de " + d.servicioNombre.toLowerCase() + "."
      ];

      // Mientras las tarifas sean las provisionales, se dice. Callarlo
      // sería dar por firme un número que la empresa no confirmó.
      if (d.provisional) {
        partes.push(
          "Ojo: es un estimado con tarifas todavía en revisión. El precio en firme se lo " +
          "damos por teléfono, siempre antes de salir y sin costo."
        );
      } else {
        /* No es un "por ahora": el precio oficial SIEMPRE lo da el
           encargado. Decirlo como si fuera provisional haría creer que
           algún día el número automático va a ser el definitivo. */
        partes.push(
          (esDesde ? "Es un estimado automático." : "Es un rango estimado automáticamente.") +
          " El precio oficial se lo da el encargado antes de empezar, sin costo."
        );
      }
      if (d.numero) partes.push("Su cotización quedó con el número " + d.numero + ".");

      agregarMensaje(partes.join(" "), false, true);

      // El documento va como enlace y no como archivo: se abre en el
      // teléfono sin instalar nada, se guarda en PDF desde ahí, y se
      // puede reenviar por WhatsApp sin que se pierda.
      if (d.enlace) {
        var caja = document.createElement("div");
        caja.className = "asistente-doc";
        var a = document.createElement("a");
        a.href = d.enlace;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "Ver su cotización " + (d.numero || "");
        caja.appendChild(a);
        hilo.appendChild(caja);
        hilo.scrollTop = hilo.scrollHeight;
        mensajesMios.push("Documento: " + d.enlace);
      }

      mensajesMios.push(
        "Cotización " + (d.numero || "") + ": " + d.servicioNombre +
        (esDesde ? ", desde " + colones(d.min)
                 : ", entre " + colones(d.min) + " y " + colones(d.max))
      );
      refrescarPase();
      terminar();
    }

    function terminar() {
      cotizando = false;
      esperando = null;
      if (cajaCotiza) cajaCotiza.hidden = false;
    }

    /* `desdeChat` es cuando la persona lo pidió conversando: ahí Frank ya
       dijo lo suyo en su respuesta y repetir la presentación sonaría a
       máquina contestando dos veces. */
    function arrancarCotizador(desdeChat, previos) {
      if (cajaCotiza) cajaCotiza.hidden = true;
      if (sugeridas) sugeridas.hidden = true;
      respuestas = {};
      if (previos) {
        Object.keys(previos).forEach(function (k) {
          if (previos[k]) respuestas[k] = previos[k];
        });
      }
      pasoActual = 0;
      cotizando = true;
      esperando = null;

      if (previos && previos.nombre) {
        agregarMensaje(
          "¡Pura vida, " + String(previos.nombre).split(" ")[0] + "! Ya tengo sus datos del " +
          "formulario, así que sólo me faltan unas cositas de la propiedad para armarle " +
          "la cotización formal.",
          false, true
        );
      } else if (!desdeChat) {
        agregarMensaje(
          "Con gusto. Le hago unas preguntas y le armo la cotización formal, con su " +
          "número y todo. No necesito que sepa el tamaño del tanque.",
          false, true
        );
      }

      if (opciones && geografia) return siguientePaso();

      var cargando = agregarEscribiendo();
      // Las tarifas y la lista de lugares viajan por separado: la
      // segunda no cambia nunca y el navegador la guarda un día.
      Promise.all([
        fetch("/api/cotizar/opciones").then(function (r) { return r.json(); }),
        fetch("/api/geografia").then(function (r) { return r.json(); })
      ])
        .then(function (par) {
          cargando.remove();
          var d = par[0], g = par[1];
          if (!d || !d.ok || !g || !g.ok || !g.geografia) throw new Error("sin opciones");
          opciones = d;
          geografia = g.geografia;
          siguientePaso();
        })
        .catch(function () {
          cargando.remove();
          agregarMensaje(
            "No pude cargar el cotizador ahora mismo. Llame al 2440-1110 y se lo cotizamos de una vez.",
            false
          );
          terminar();
        });
    }

    if (botonCotizar) {
      botonCotizar.addEventListener("click", function () {
        if (!abierto) abrirPanel();
        arrancarCotizador(false);
      });
    }

    /* Tercera puerta de entrada: el formulario de contacto. Manda lo que
       ya recogió y Frank continúa desde ahí. Va por evento y no por
       llamada directa porque el formulario vive en su propio ámbito y
       sólo existe en una de las seis páginas. */
    document.addEventListener("cotizar-con-datos", function (e) {
      if (!abierto) abrirPanel();
      arrancarCotizador(true, e.detail || {});
    });
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
