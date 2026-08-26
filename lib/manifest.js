(function () {
  "use strict";

  window.__BRAND__ = {
    name: "Sanitarios Ticos",
    legal: "Grupo Ticos Sanitarios S.A.",
    tagline: "¡Su empresa de confianza!",

    contact: {
      phone1: "2440-1110",
      phone1Tel: "+50624401110",
      phone2: "2265-4150",
      phone2Tel: "+50622654150",
      whatsapp: "8341-7547",
      whatsappTel: "+50683417547",
      whatsappNumber: "50683417547",
      email: "info@sanitariosticos.com",
      zones: "Alajuela · Heredia · San José"
    },

    social: {
      facebook: "https://www.facebook.com/SanitariosTicosCR/",
      instagram: "https://www.instagram.com/sanitariosticos_/?hl=es-la",
      twitter: "https://twitter.com/sanitariosticos?lang=es",
      youtube: "https://www.youtube.com/channel/UCqhkOBF2FPoncZ00GzKodmQ",
      linkedin: "http://www.linkedin.com/in/sanitariosticos"
    },

    // Se usan para prellenar el mensaje de WhatsApp desde el formulario
    services: [
      { id: "tanques-septicos", name: "Limpieza de tanques sépticos" },
      { id: "destaqueo", name: "Limpieza y destaqueo de tuberías" },
      { id: "trampas-grasa", name: "Limpieza de trampas de grasa y diesel" },
      { id: "construccion", name: "Construcción de tanques, drenajes y plantas" },
      { id: "alquiler", name: "Alquiler de tanques plásticos" },
      { id: "otro", name: "Otro / no estoy seguro" }
    ],

    // ⚠️ PENDIENTE — cifras de EJEMPLO para probar la calculadora.
    // Hay que reemplazarlas por las tarifas reales cuando el dueño las
    // confirme (ver README, sección "Cotizador"). Mientras eso no pase,
    // la calculadora en el sitio deja bien claro que son orientativas.
    tarifas: {
      recargoFueraValle: 0.15, // 15% de más como orientación por el viaje
      servicios: [
        {
          id: "tanques-septicos",
          nombre: "Limpieza de tanques sépticos",
          pregunta: "Tamaño aproximado del tanque",
          opciones: [
            { etiqueta: "Pequeño — casa de 1 a 4 personas", rango: [25000, 35000] },
            { etiqueta: "Mediano — casa de 5 a 8 personas o negocio pequeño", rango: [35000, 55000] },
            { etiqueta: "Grande — negocio, condominio o industria", rango: [55000, 90000] }
          ]
        },
        {
          id: "destaqueo",
          nombre: "Limpieza y destaqueo de tuberías",
          pregunta: "Tipo de tubería",
          opciones: [
            { etiqueta: "Fina — baño o cocina", rango: [20000, 35000] },
            { etiqueta: "Gruesa — colector principal", rango: [35000, 60000] }
          ]
        },
        {
          id: "trampas-grasa",
          nombre: "Trampas de grasa y diesel",
          pregunta: "Tamaño del negocio",
          opciones: [
            { etiqueta: "Pequeño — soda", rango: [18000, 28000] },
            { etiqueta: "Mediano — restaurante", rango: [28000, 45000] },
            { etiqueta: "Grande — comedor industrial", rango: [45000, 70000] }
          ]
        }
      ]
    }
  };
})();
