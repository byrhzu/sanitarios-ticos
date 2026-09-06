/* =============================================================
   Formatos costarricenses: teléfono, cédula y correo
   =============================================================

   La gente no contesta con el dato pelado. A "¿a qué número la
   contactamos?" responden "escríbame al 8888-8888", "al 8888 8888 pero
   mejor por WhatsApp", "+506 8888-8888". Guardar eso tal cual mete la
   frase entera en la cotización, que es un documento formal.

   Entonces: de lo que escriban se saca el dato, se comprueba que tenga
   sentido, y se guarda en un solo formato. Si no se puede sacar nada,
   se dice — nunca se guarda a medias ni se inventa.

   El worker es el que manda: main.js repite estas reglas para avisar de
   una vez, pero lo que llega al servidor se vuelve a revisar acá,
   porque una validación en el navegador se puede saltar.
   ============================================================= */

const soloDigitos = (s) => String(s == null ? "" : s).replace(/\D/g, "");

/* ---------------------------------------------------------------
   Teléfono

   En Costa Rica son 8 dígitos. El primero dice de qué tipo es:
   2 y 4 son fijos, 5 6 7 y 8 son celulares. El 3, el 9, el 0 y el 1
   no se asignan a números de abonado, así que un "3..." es casi
   seguro una cédula jurídica escrita en la casilla equivocada.

   El +506 se acepta y se descarta: es nuestro propio código de país.
   --------------------------------------------------------------- */
const INICIO_VALIDO = /^[24-8]/;

export function normalizarTelefono(entrada) {
  const texto = String(entrada == null ? "" : entrada);

  // Se buscan candidatos de 8 dígitos dentro de la frase, con o sin
  // separadores. Así "escríbame al 8888-8888" entrega 88888888.
  const candidatos = [];
  const rx = /(?:\+?506[\s.-]*)?(\d[\d\s.-]{6,}\d)/g;
  let m;
  while ((m = rx.exec(texto)) !== null) {
    let d = soloDigitos(m[0]);
    if (d.length === 11 && d.startsWith("506")) d = d.slice(3);
    if (d.length === 8 && INICIO_VALIDO.test(d)) candidatos.push(d);
  }

  if (!candidatos.length) {
    const d = soloDigitos(texto);
    if (!d) return { ok: false, error: "No encontré un número de teléfono." };
    if (d.length < 8) return { ok: false, error: "Los teléfonos de Costa Rica llevan 8 dígitos." };
    return {
      ok: false,
      error: "Ese número no parece de Costa Rica. Son 8 dígitos y empiezan con 2, 4, 6, 7 u 8."
    };
  }

  // Si escribieron dos, se toma el primero: es el que dieron como
  // suyo, y el segundo suele ser un fijo de referencia.
  const d = candidatos[0];
  return { ok: true, valor: d.slice(0, 4) + "-" + d.slice(4) };
}

/* ---------------------------------------------------------------
   Cédula

   Cuatro cosas distintas caben en esta casilla:

   - Física: 9 dígitos, se escribe 1-2345-6789. El primero es la
     provincia de inscripción.
   - Jurídica: 10 dígitos y empieza con 3, se escribe 3-101-123456.
     Es la de las empresas — la que va a llevar la cotización cuando
     el cliente sea un restaurante o un condominio.
   - DIMEX: 11 o 12 dígitos, la de personas extranjeras residentes.
     No lleva guiones.
   - NITE: 10 dígitos que no empiezan con 3.

   Cualquiera de las cuatro es válida. Lo que no se acepta es un
   número con una cantidad de dígitos que no corresponde a ninguna,
   porque eso es un dedazo y va a terminar impreso.
   --------------------------------------------------------------- */
export function normalizarCedula(entrada) {
  const d = soloDigitos(entrada);
  if (!d) return { ok: false, error: "No encontré un número de cédula." };

  if (d.length === 9) {
    return { ok: true, tipo: "fisica", valor: d[0] + "-" + d.slice(1, 5) + "-" + d.slice(5) };
  }
  if (d.length === 10 && d[0] === "3") {
    return { ok: true, tipo: "juridica", valor: "3-" + d.slice(1, 4) + "-" + d.slice(4) };
  }
  if (d.length === 10) {
    return { ok: true, tipo: "nite", valor: d };
  }
  if (d.length === 11 || d.length === 12) {
    return { ok: true, tipo: "dimex", valor: d };
  }

  return {
    ok: false,
    error: d.length < 9
      ? "Esa cédula queda corta. La de persona lleva 9 dígitos y la jurídica 10."
      : "Esa cédula queda larga. La de persona lleva 9 dígitos, la jurídica 10 y el DIMEX 11 o 12."
  };
}

/* ---------------------------------------------------------------
   Correo

   Se saca de la frase, igual que el teléfono: a "mi correo es
   ana@correo.com" hay que quitarle las tres primeras palabras.

   La comprobación es deliberadamente floja. Los correos válidos son
   más raros de lo que uno cree y una expresión estricta rechaza
   direcciones reales; acá alcanza con que tenga la forma. Si está
   mal escrito, se descubre cuando rebote — que es peor para nosotros
   que para el cliente, y por eso el correo nunca es obligatorio.
   --------------------------------------------------------------- */
export function normalizarCorreo(entrada) {
  const texto = String(entrada == null ? "" : entrada).trim();
  const m = texto.match(/[^\s@,;<>()]+@[^\s@,;<>()]+\.[A-Za-z]{2,}/);
  if (!m) return { ok: false, error: "Eso no parece un correo. Debería llevar arroba y un punto." };
  return { ok: true, valor: m[0].toLowerCase().replace(/[.,;]+$/, "") };
}

/* ---------------------------------------------------------------
   Nombre

   A "¿a nombre de quién?" mucha gente contesta "soy Ana" o "me llamo
   Ana Ramírez". Se le quita el arranque y se deja el nombre.

   No se corrige la ortografía ni se pone en mayúsculas: el nombre de
   alguien se escribe como esa persona lo escribió.
   --------------------------------------------------------------- */
const ARRANQUES = /^(?:soy|me llamo|mi nombre es|es|para|a nombre de)\s+/i;

export function normalizarNombre(entrada) {
  let t = String(entrada == null ? "" : entrada).replace(/\s+/g, " ").trim();
  t = t.replace(ARRANQUES, "").trim();
  t = t.replace(/[.,;:]+$/, "").trim();

  if (t.length < 2 || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(t)) {
    return { ok: false, error: "No entendí el nombre." };
  }
  if (t.length > 120) t = t.slice(0, 120).trim();
  return { ok: true, valor: t };
}
