/* =============================================================
   Recargo por ubicación

   Lo llenó el encargado, distrito por distrito, sobre la lista de
   Alajuela, Heredia y San José. Cada número es lo que se le suma al
   precio base por llegar hasta ahí; cero quiere decir que ese distrito
   va al precio base.

   Lo que NO está acá no se cotiza solo. Son dos casos y los dos
   significan lo mismo —"eso lo tiene que ver el encargado"—:

     · los distritos que el encargado marcó "No aplica": quedan lejos,
       el precio se sale de la tabla y hay que hablarlo;
     · las provincias que no aparecen (Cartago, Guanacaste, Limón y
       Puntarenas): más lejos todavía.

   En esos casos la página no inventa un precio: dice que esa zona se
   cotiza directo con el encargado y ofrece el WhatsApp y la solicitud.
   El trabajo igual se puede hacer —y la solicitud entra desde donde
   sea—, pero el precio lo pone una persona, no la tabla.

   Generado de "Precios y recargos - Sanitarios Ticos.xlsx".
   Para cambiar un recargo: se cambia el número de acá.
   ============================================================= */

export const RECARGOS = {
  "Alajuela": {
    "Alajuela": { "Alajuela": 0, "San José": 0, "Carrizal": 5000, "San Antonio": 0, "Guácima": 0, "San Isidro": 0, "Sabanilla": 5000, "San Rafael": 0, "Río Segundo": 0, "Desamparados": 0, "Turrucares": 0, "Tambor": 0, "La Garita": 0, "Sarapiquí": 10000 },
    "Grecia": { "Grecia": 15000, "San Isidro": 15000, "San José": 15000, "San Roque": 15000, "Tacares": 15000, "Puente Piedra": 15000, "Bolívar": 15000 },
    "San Mateo": { "San Mateo": 20000, "Desmonte": 20000, "Jesús María": 20000, "Labrador": 20000 },
    "Atenas": { "Atenas": 20000, "Jesús": 20000, "Mercedes": 20000, "San Isidro": 20000, "Concepción": 20000, "San José": 20000, "Santa Eulalia": 20000, "Escobal": 20000 },
    "Poás": { "San Pedro": 5000, "San Juan": 5000, "San Rafael": 5000, "Carrillos": 5000, "Sabana Redonda": 5000 }
  },
  "Heredia": {
    "Heredia": { "Heredia": 0, "Mercedes": 0, "San Francisco": 0, "Ulloa": 0, "Varablanca": 10000 },
    "Barva": { "Barva": 0, "San Pedro": 0, "San Pablo": 0, "San Roque": 0, "Santa Lucía": 0, "San José de la Montaña": 5000 },
    "Santo Domingo": { "Santo Domingo": 5000, "San Vicente": 5000, "San Miguel": 5000, "Paracito": 10000, "Santo Tomás": 10000, "Santa Rosa": 10000, "Tures": 10000, "Pará": 10000 },
    "Santa Bárbara": { "Santa Bárbara": 0, "San Pedro": 0, "San Juan": 0, "Jesús": 0, "Santo Domingo del Roble": 0, "Puraba": 10000 },
    "San Rafael": { "San Rafael": 0, "San Josecito": 0, "Santiago": 0, "Angeles": 0, "Concepción": 0 },
    "San Isidro": { "San Isidro": 10000, "San José": 10000, "Concepción": 10000, "San Francisco": 10000 },
    "Belén": { "San Antonio": 0, "La Ribera": 0, "Asunción": 0 },
    "Flores": { "San Joaquín": 0, "Barrantes": 0, "Llorente": 0 },
    "San Pablo": { "San Pablo": 0, "Rincón de Sabanilla": 0 }
  },
  "San José": {
    "San José": { "Carmen": 5000, "Merced": 5000, "Hospital": 5000, "Catedral": 5000, "Zapote": 10000, "San Fco. de Dos Ríos": 15000, "Uruca": 10000, "Mata Redonda": 10000, "Pavas": 10000, "Hatillo": 15000, "San Sebastián": 15000 },
    "Escazú": { "Escazú": 10000, "San Antonio": 10000, "San Rafael": 10000 },
    "Desamparados": { "Desamparados": 15000, "San Miguel": 15000, "San Juan de Dios": 15000, "San Rafael Arriba": 15000, "San Antonio": 15000, "Frailes": 15000, "Patarrá": 15000, "San Cristóbal": 15000, "Rosario": 15000, "Damas": 15000, "San Rafael Abajo": 15000, "Gravilias": 15000, "Los Guido": 15000 },
    "Mora": { "Colón": 10000, "Guayabo": 1000, "Tabarcia": 15000, "Piedras Negras": 15000, "Picagres": 30000, "Caris": 30000, "Quitirrisí": 30000 },
    "Goicoechea": { "Guadalupe": 20000, "San Francisco": 20000, "Calle Blancos": 20000, "Mata de Plátano": 20000, "Ipís": 20000, "Rancho Redondo": 20000, "Purral": 20000 },
    "Santa Ana": { "Santa Ana": 5000, "Salitral": 10000, "Pozos": 5000, "Uruca": 10000, "Piedades": 5000, "Brasil": 10000 },
    "Alajuelita": { "Alajuelita": 20000, "San Josecito": 20000, "San Antonio": 20000, "Concepción": 20000, "San Felipe": 20000 },
    "Coronado": { "San Isidro": 20000, "San Rafael": 20000, "Dulce Nombre de Jesús": 20000, "Patalillo": 20000, "Cascajal": 20000 },
    "Tibás": { "San Juan": 10000, "Cinco Esquinas": 10000, "Anselmo Llorente": 10000, "León XIII": 20000, "Colima": 10000 },
    "Moravia": { "San Vicente": 15000, "San Jerónimo": 15000, "Trinidad": 15000 },
    "Montes de Oca": { "San Pedro": 20000, "Sabanilla": 20000, "Mercedes": 20000, "San Rafael": 20000 },
    "Curridabat": { "Curridabat": 20000, "Granadilla": 20000, "Sánchez": 20000, "Tirrases": 20000 }
  }
};
