/* =====================================================================
   Cotizador público — /cotizar
   ---------------------------------------------------------------------
   La misma cotización que hace Frank en el chat, pero para quien
   prefiere botones a conversación. Usa los mismos tres endpoints
   (/api/cotizar/opciones, /api/geografia, /api/cotizar) y manda
   origen "formulario", que el servidor acepta sin clave del panel.

   Regla que no se negocia: acá NO se calcula ningún precio. El monto
   viene del servidor y el precio oficial lo da el encargado.
   Ver DIRECCION-DE-ARTE.md §22 y README, sección "Cotizaciones".
   ===================================================================== */
(function () {
  "use strict";

  var caja = document.querySelector("[data-cot]");
  if (!caja) return;

  function $(sel) { return caja.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(caja.querySelectorAll(sel)); }

  var WA = "50683417547";

  var opciones = null;      // tarifas y preguntas, del servidor
  var geografia = null;     // provincias → cantones → distritos
  var respuestas = {};      // lo que la persona lleva contestado
  var historial = [];       // pasos ya vistos, para el botón "Volver"
  var pasoActual = null;
  var enviando = false;

  var rail = $("[data-cot-rail]");
  var msg = $("[data-cot-msg]");

  /* ---------- utilidades ---------- */

  function colones(n) {
    return "₡" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function avisar(texto, esError) {
    if (!msg) return;
    msg.textContent = texto || "";
    msg.classList.toggle("is-error", !!esError);
  }

  /* Los pasos que de verdad aplican a este servicio. El del trabajo se
     salta solo cuando el precio es de tabla y no hay nada que preguntar. */
  function secuencia() {
    var svc = respuestas.servicio && opciones.servicios[respuestas.servicio];
    var pasos = ["servicio"];
    /* Antes de escoger servicio se cuenta el paso del trabajo: casi
       todos lo llevan, y así el riel no cambia de largo bajo los pies. */
    if (!svc || svc.tipo !== "fijo") pasos.push("trabajo");
    return pasos.concat(["lugar", "datos"]);
  }

  function mostrar(clave) {
    $$("[data-cot-paso]").forEach(function (p) {
      p.hidden = p.getAttribute("data-cot-paso") !== clave;
    });
    pasoActual = clave;
    avisar("");
    pintarRail();

    // Al cambiar de paso, el foco va al encabezado: quien navega con
    // teclado o lector de pantalla se entera de que la pregunta cambió.
    var vivo = $('[data-cot-paso="' + clave + '"]');
    var h = vivo && vivo.querySelector(".cot-pregunta");
    if (h) {
      h.setAttribute("tabindex", "-1");
      h.focus({ preventScroll: true });
    }
    if (historial.length) {
      var arriba = caja.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: arriba, behavior: "smooth" });
    }
  }

  function pintarRail() {
    var pasos = secuencia();
    var visto = pasos.indexOf(pasoActual);
    var etiquetas = { servicio: "Servicio", trabajo: "El trabajo", lugar: "Dónde queda", datos: "Sus datos" };
    var svc = respuestas.servicio && opciones && opciones.servicios[respuestas.servicio];
    if (svc) etiquetas.trabajo = svc.tipo === "alquiler" ? "El alquiler" : "Su tanque";

    var lis = rail.children;
    for (var i = 0; i < lis.length; i++) {
      var li = lis[i];
      var clave = pasos[i];
      li.hidden = !clave;
      if (!clave) continue;
      li.setAttribute("data-n", String(i + 1));
      li.textContent = etiquetas[clave];
      li.className = "";
      // En el resultado ya no hay paso vivo: todos quedan hechos.
      if (pasoActual === "resultado" || (visto !== -1 && i < visto)) li.className = "is-hecho";
      else if (i === visto) li.className = "is-ahora";
    }
  }

  function avanzar() {
    var pasos = secuencia();
    var i = pasos.indexOf(pasoActual);
    historial.push(pasoActual);
    if (i === -1 || i === pasos.length - 1) return cotizar();
    mostrar(pasos[i + 1]);
  }

  function volver() {
    var previo = historial.pop();
    if (previo) mostrar(previo);
  }

  /* ---------- botones de opción ---------- */

  function pintarOps(contenedor, lista, elegido, alElegir) {
    contenedor.textContent = "";
    lista.forEach(function (op) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cot-op" + (op.id === elegido ? " is-elegido" : "");
      var t = document.createElement("b");
      t.textContent = op.etiqueta;
      b.appendChild(t);
      b.addEventListener("click", function () { alElegir(op); });
      contenedor.appendChild(b);
    });
  }

  /* ---------- paso 1: servicio ---------- */

  function pintarServicios() {
    /* Sólo el nombre del servicio. El subtexto que llevaba antes
       —"precio directo, sin más preguntas"— no ayudaba a escoger y
       hacía que la lista pareciera una interfaz generada. */
    var lista = Object.keys(opciones.servicios).map(function (id) {
      return { id: id, etiqueta: opciones.servicios[id].nombre };
    });
    pintarOps($("[data-cot-servicios]"), lista, respuestas.servicio, function (op) {
      // Cambiar de servicio invalida lo que se había contestado del
      // trabajo anterior: mandar una forma de otro servicio daría un
      // precio equivocado sin que nadie se diera cuenta.
      if (respuestas.servicio !== op.id) {
        respuestas.forma = respuestas.medida = respuestas.antiguedad = null;
        respuestas.dias = null;
      }
      respuestas.servicio = op.id;
      pintarServicios();
      prepararTrabajo();
      avanzar();
    });
  }

  /* ---------- paso 2: el trabajo ---------- */

  function prepararTrabajo() {
    var svc = opciones.servicios[respuestas.servicio];
    var gForma = $("[data-cot-g-forma]"), gMedida = $("[data-cot-g-medida]"),
        gAnt = $("[data-cot-g-antiguedad]"), gDias = $("[data-cot-g-dias]");

    gForma.hidden = gMedida.hidden = gAnt.hidden = gDias.hidden = true;
    if (!svc || svc.tipo === "fijo") return;

    if (svc.tipo === "alquiler") {
      $("[data-cot-titulo-trabajo]").textContent = "¿Por cuánto tiempo lo ocupa?";
      $("[data-cot-ayuda-trabajo]").textContent =
        "El alquiler se cobra por día. Si lo devuelve antes, se cobra el mínimo.";
      $("[data-cot-minimo]").textContent =
        "Mínimo " + svc.diasMinimo + " días, a " + colones(svc.porDia) + " por día.";
      var campo = document.getElementById("cot-dias");
      campo.min = String(svc.diasMinimo);
      if (!respuestas.dias) campo.value = String(svc.diasMinimo);
      gDias.hidden = false;
      return;
    }

    $("[data-cot-titulo-trabajo]").textContent = "Cuénteme de su tanque";
    $("[data-cot-ayuda-trabajo]").textContent =
      "No hace falta que sepa los litros: con verlo desde el patio alcanza.";
    gForma.hidden = false;
    pintarOps($("[data-cot-formas]"), svc.formas, respuestas.forma, function (op) {
      if (respuestas.forma !== op.id) respuestas.medida = null;
      respuestas.forma = op.id;
      prepararTrabajo();
    });

    if (!respuestas.forma) return;
    var forma = svc.formas.filter(function (f) { return f.id === respuestas.forma; })[0];
    gMedida.hidden = false;
    pintarOps($("[data-cot-medidas]"), forma.medidas, respuestas.medida, function (op) {
      respuestas.medida = op.id;
      prepararTrabajo();
    });

    if (!respuestas.medida) return;
    gAnt.hidden = false;
    pintarOps($("[data-cot-antiguedad]"), svc.antiguedad, respuestas.antiguedad, function (op) {
      respuestas.antiguedad = op.id;
      prepararTrabajo();
    });
  }

  function trabajoCompleto() {
    var svc = opciones.servicios[respuestas.servicio];
    if (svc.tipo === "alquiler") {
      var d = parseInt(document.getElementById("cot-dias").value, 10);
      if (!isFinite(d) || d < 1) return "Escriba cuántos días lo ocupa.";
      respuestas.dias = d;
      return null;
    }
    if (!respuestas.forma) return "Escoja cómo es el tanque.";
    if (!respuestas.medida) return "Escoja el tamaño aproximado.";
    if (!respuestas.antiguedad) return "Díganos cuándo fue la última limpieza.";
    return null;
  }

  /* ---------- paso 3: dónde queda ---------- */

  var selP = document.getElementById("cot-provincia"),
      selC = document.getElementById("cot-canton"),
      selD = document.getElementById("cot-distrito");

  function llenar(sel, lista, vacio) {
    sel.textContent = "";
    var cero = document.createElement("option");
    cero.value = "";
    cero.textContent = lista.length ? "Seleccione…" : vacio;
    sel.appendChild(cero);
    lista.forEach(function (t) {
      var o = document.createElement("option");
      o.value = t;
      o.textContent = t;
      sel.appendChild(o);
    });
    sel.disabled = !lista.length;
  }

  function prepararLugar() {
    llenar(selP, Object.keys(geografia), "");
    selP.addEventListener("change", function () {
      llenar(selC, Object.keys(geografia[selP.value] || {}), "Primero la provincia");
      llenar(selD, [], "Primero el cantón");
    });
    selC.addEventListener("change", function () {
      llenar(selD, (geografia[selP.value] || {})[selC.value] || [], "Primero el cantón");
    });
  }

  /* ---------- paso 4: sus datos ---------- */

  // Chequeo suave, sólo para no hacer viajar al servidor por gusto. El
  // que manda es el servidor: acá no se normaliza nada.
  function datosCompletos() {
    var nombre = document.getElementById("cot-nombre").value.trim();
    var tel = document.getElementById("cot-tel").value.replace(/\D/g, "");
    if (nombre.length < 2) return "Escriba su nombre.";
    if (!/^[2456789]\d{7}$/.test(tel.replace(/^506/, ""))) {
      return "Ese teléfono no parece de Costa Rica: son 8 dígitos.";
    }
    if (!document.getElementById("cot-consiente").checked) {
      return "Marque la casilla para poder emitirle la cotización.";
    }
    return null;
  }

  /* ---------- el envío ---------- */

  function cotizar() {
    if (enviando) return;
    enviando = true;
    caja.setAttribute("aria-busy", "true");
    avisar("Calculando su precio…");

    var cuerpo = {
      origen: "formulario",
      servicio: respuestas.servicio,
      forma: respuestas.forma || "",
      medida: respuestas.medida || "",
      antiguedad: respuestas.antiguedad || "",
      dias: respuestas.dias || null,
      provincia: selP.value,
      canton: selC.value,
      distrito: selD.value,
      nombre: document.getElementById("cot-nombre").value,
      telefono: document.getElementById("cot-tel").value,
      cedula: document.getElementById("cot-cedula").value,
      correo: document.getElementById("cot-correo").value
    };

    fetch("/api/cotizar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo)
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok || !res.d || !res.d.ok) {
          throw new Error((res.d && res.d.error) || "No se pudo cotizar");
        }
        mostrarResultado(res.d);
      })
      .catch(function (e) {
        historial.pop();
        avisar(
          (e && e.message ? e.message + ". " : "") +
          "Si sigue igual, llámenos al 2440-1110 y se la hacemos por teléfono.",
          true
        );
      })
      .then(function () {
        enviando = false;
        caja.setAttribute("aria-busy", "false");
      });
  }

  function mostrarResultado(d) {
    /* min igual a max no es un rango de cero de ancho: es un piso. Se
       dice "desde", que es lo que significa. */
    var esDesde = d.desde || d.min === d.max;

    $("[data-cot-servicio-nombre]").textContent = d.servicioNombre;
    var monto = $("[data-cot-monto]");
    monto.textContent = "";
    var et = document.createElement("small");
    et.textContent = esDesde ? "Precio estimado" : "Rango estimado";
    monto.appendChild(et);
    monto.appendChild(document.createTextNode(
      esDesde ? "Desde " + colones(d.min) : colones(d.min) + " – " + colones(d.max)
    ));

    var cuerpo = $("[data-cot-desglose]");
    cuerpo.textContent = "";
    (d.desglose || []).forEach(function (fila) {
      var tr = document.createElement("tr");
      var td1 = document.createElement("td");
      td1.textContent = fila.concepto;
      var td2 = document.createElement("td");
      td2.textContent = fila.monto == null ? "—" : colones(fila.monto);
      tr.appendChild(td1);
      tr.appendChild(td2);
      cuerpo.appendChild(tr);
    });
    var tr = document.createElement("tr");
    var td1 = document.createElement("td");
    td1.textContent = d.ivaIncluido ? "IVA incluido" : "IVA no incluido";
    var td2 = document.createElement("td");
    td2.textContent = "Vigencia: " + (d.vigenciaDias || 15) + " días";
    tr.appendChild(td1);
    tr.appendChild(td2);
    cuerpo.appendChild(tr);

    var num = $("[data-cot-numero]");
    var doc = $("[data-cot-doc]");
    if (d.numero) {
      num.textContent = "";
      num.appendChild(document.createTextNode("Su cotización quedó con el número "));
      var b = document.createElement("b");
      b.textContent = d.numero;
      num.appendChild(b);
      num.appendChild(document.createTextNode("."));
    } else {
      num.textContent = "";
    }
    /* .btn es inline-flex, y [hidden] pierde contra un display
       explícito: hay que apagarlo a mano. */
    doc.style.display = d.enlace ? "" : "none";
    if (d.enlace) doc.href = d.enlace;

    var texto = "Hola, hice una cotización en la página." +
      (d.numero ? " Es la número " + d.numero + "." : "") +
      " Es para " + d.servicioNombre.toLowerCase() + " en " +
      selD.value + ", " + selC.value + ", " + selP.value + "." +
      (esDesde ? " Me salió desde " + colones(d.min) + "."
               : " Me salió entre " + colones(d.min) + " y " + colones(d.max) + ".") +
      (d.enlace ? " Acá está el documento: " + d.enlace : "");
    $("[data-cot-wa]").href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(texto);

    historial = [];
    mostrar("resultado");
  }

  /* ---------- cableado ---------- */

  $$("[data-cot-atras]").forEach(function (b) {
    b.addEventListener("click", volver);
  });

  $$("[data-cot-sigue]").forEach(function (b) {
    b.addEventListener("click", function () {
      var paso = b.getAttribute("data-cot-sigue");
      var error = null;
      if (paso === "trabajo") error = trabajoCompleto();
      if (paso === "lugar") {
        if (!selP.value || !selC.value || !selD.value) error = "Escoja la provincia, el cantón y el distrito.";
      }
      if (paso === "datos") error = datosCompletos();
      if (error) return avisarEn(paso, error);
      avanzar();
    });
  });

  // Cada paso tiene su propio renglón de aviso si lo lleva; si no, se
  // usa el del último paso, que es el único que trae uno en el HTML.
  function avisarEn(paso, texto) {
    var vivo = $('[data-cot-paso="' + paso + '"]');
    var propio = vivo && vivo.querySelector("[data-cot-msg]");
    if (propio) {
      propio.textContent = texto;
      propio.classList.add("is-error");
      return;
    }
    var p = document.createElement("p");
    p.className = "cot-msg is-error";
    p.setAttribute("role", "status");
    p.setAttribute("data-cot-msg", "");
    vivo.querySelector(".cot-nav").appendChild(p);
    p.textContent = texto;
  }

  var otra = $("[data-cot-otra]");
  if (otra) {
    otra.addEventListener("click", function () {
      respuestas = {};
      historial = [];
      pintarServicios();
      mostrar("servicio");
    });
  }

  /* ---------- arranque ---------- */

  Promise.all([
    fetch("/api/cotizar/opciones").then(function (r) { return r.json(); }),
    fetch("/api/geografia").then(function (r) { return r.json(); })
  ])
    .then(function (par) {
      var d = par[0], g = par[1];
      if (!d || !d.ok || !g || !g.ok || !g.geografia) throw new Error("sin opciones");
      opciones = d;
      geografia = g.geografia;
      pintarServicios();
      prepararLugar();
      mostrar("servicio");
    })
    .catch(function () {
      var zona = $("[data-cot-servicios]");
      zona.textContent = "";
      var p = document.createElement("p");
      p.className = "cot-msg is-error";
      p.textContent = "No se pudo cargar el cotizador. Llámenos al 2440-1110 o escríbanos por WhatsApp al 8341-7547 y se la hacemos de una vez.";
      zona.appendChild(p);
    });
})();
