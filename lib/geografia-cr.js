/* =============================================================
   División territorial de Costa Rica
   7 provincias · 84 cantones · 487 distritos

   Viene del archivo que entregó el propietario. Se usa en tres lugares
   —el formulario de contacto, el botón de cotizar y la conversación con
   Beto— para que la dirección se escoja y no se escriba: así "Belén" no
   llega unas veces como "Belen" y otras como "belén", y el cantón que
   decide el precio siempre es uno de la lista.

   Lo único que se tocó del archivo original fueron dos tildes de
   cantón: "Perez Zeledón" → "Pérez Zeledón" y "Poas" → "Poás". El
   cantón sale impreso en cada cotización y una tilde faltante se ve.
   Los nombres de distrito quedaron exactamente como venían.
   ============================================================= */

export const GEOGRAFIA = {
  "San José": {
    "San José": [
      "Carmen",
      "Merced",
      "Hospital",
      "Catedral",
      "Zapote",
      "San Fco. de Dos Ríos",
      "Uruca",
      "Mata Redonda",
      "Pavas",
      "Hatillo",
      "San Sebastián"
    ],
    "Escazú": [
      "Escazú",
      "San Antonio",
      "San Rafael"
    ],
    "Desamparados": [
      "Desamparados",
      "San Miguel",
      "San Juan de Dios",
      "San Rafael Arriba",
      "San Antonio",
      "Frailes",
      "Patarrá",
      "San Cristóbal",
      "Rosario",
      "Damas",
      "San Rafael Abajo",
      "Gravilias",
      "Los Guido"
    ],
    "Puriscal": [
      "Santiago",
      "Mercedes Sur",
      "Barbacoas",
      "Grifo Alto",
      "San Rafael",
      "Candelaria",
      "Desamparaditos",
      "San Antonio",
      "Chires"
    ],
    "Tarrazú": [
      "San Marcos",
      "San Lorenzo",
      "San Carlos"
    ],
    "Aserrí": [
      "Aserrí",
      "Tarbaca",
      "Vuelta de Jorco",
      "San Gabriel",
      "La Legua",
      "Monterrey",
      "Salitrillos"
    ],
    "Mora": [
      "Colón",
      "Guayabo",
      "Tabarcia",
      "Piedras Negras",
      "Picagres",
      "Caris",
      "Quitirrisí"
    ],
    "Goicoechea": [
      "Guadalupe",
      "San Francisco",
      "Calle Blancos",
      "Mata de Plátano",
      "Ipís",
      "Rancho Redondo",
      "Purral"
    ],
    "Santa Ana": [
      "Santa Ana",
      "Salitral",
      "Pozos",
      "Uruca",
      "Piedades",
      "Brasil"
    ],
    "Alajuelita": [
      "Alajuelita",
      "San Josecito",
      "San Antonio",
      "Concepción",
      "San Felipe"
    ],
    "Coronado": [
      "San Isidro",
      "San Rafael",
      "Dulce Nombre de Jesús",
      "Patalillo",
      "Cascajal"
    ],
    "Acosta": [
      "San Ignacio",
      "Guaitil",
      "Palmichal",
      "Cangrejal",
      "Sabanillas"
    ],
    "Tibás": [
      "San Juan",
      "Cinco Esquinas",
      "Anselmo Llorente",
      "León XIII",
      "Colima"
    ],
    "Moravia": [
      "San Vicente",
      "San Jerónimo",
      "Trinidad"
    ],
    "Montes de Oca": [
      "San Pedro",
      "Sabanilla",
      "Mercedes",
      "San Rafael"
    ],
    "Turrubares": [
      "San Pablo",
      "San Pedro",
      "San Juan de Mata",
      "San Luis",
      "Cárara"
    ],
    "Dota": [
      "Santa María",
      "Jardín",
      "Copey"
    ],
    "Curridabat": [
      "Curridabat",
      "Granadilla",
      "Sánchez",
      "Tirrases"
    ],
    "Pérez Zeledón": [
      "San Isidro de el General",
      "General",
      "Daniel Flores",
      "Rivas",
      "San Pedro",
      "Platanares",
      "Pejibaye",
      "Cajón",
      "Barú",
      "Río Nuevo",
      "Páramo",
      "La Amistad"
    ],
    "León Cortés": [
      "San Pablo",
      "San Andrés",
      "Llano Bonito",
      "San Isidro",
      "Santa Cruz",
      "San Antonio"
    ]
  },
  "Alajuela": {
    "Alajuela": [
      "Alajuela",
      "San José",
      "Carrizal",
      "San Antonio",
      "Guácima",
      "San Isidro",
      "Sabanilla",
      "San Rafael",
      "Río Segundo",
      "Desamparados",
      "Turrucares",
      "Tambor",
      "La Garita",
      "Sarapiquí"
    ],
    "San Ramón": [
      "San Ramón",
      "Santiago",
      "San Juan",
      "Piedades Norte",
      "Piedades Sur",
      "San Rafael",
      "San Isidro",
      "Angeles",
      "Alfaro",
      "Volio",
      "Concepción",
      "Zapotal",
      "San Isidro de Peñas Blancas",
      "San Lorenzo"
    ],
    "Grecia": [
      "Grecia",
      "San Isidro",
      "San José",
      "San Roque",
      "Tacares",
      "Puente Piedra",
      "Bolívar"
    ],
    "San Mateo": [
      "San Mateo",
      "Desmonte",
      "Jesús María",
      "Labrador"
    ],
    "Atenas": [
      "Atenas",
      "Jesús",
      "Mercedes",
      "San Isidro",
      "Concepción",
      "San José",
      "Santa Eulalia",
      "Escobal"
    ],
    "Naranjo": [
      "Naranjo",
      "San Miguel",
      "San José",
      "Cirrí Sur",
      "San Jerónimo",
      "San Juan",
      "Rosario",
      "Palmitos"
    ],
    "Palmares": [
      "Palmares",
      "Zaragoza",
      "Buenos Aires",
      "Santiago",
      "Candelaria",
      "Esquipulas",
      "La Granja"
    ],
    "Poás": [
      "San Pedro",
      "San Juan",
      "San Rafael",
      "Carrillos",
      "Sabana Redonda"
    ],
    "Orotina": [
      "Orotina",
      "Mastate",
      "Hacienda Vieja",
      "Coyolar",
      "Ceiba"
    ],
    "San Carlos": [
      "Quesada",
      "Florencia",
      "Buenavista",
      "Aguas Zarcas",
      "Venecia",
      "Pital",
      "Fortuna",
      "Tigra",
      "Palmera",
      "Venado",
      "Cutris",
      "Monterrey",
      "Pocosol"
    ],
    "Zarcero": [
      "Zarcero",
      "Laguna",
      "Tapezco",
      "Guadalupe",
      "Palmira",
      "Zapote",
      "Las Brisas"
    ],
    "Valverde Vega": [
      "Sarchí Norte",
      "Sarchí Sur",
      "Toro Amarillo",
      "San Pedro",
      "Rodríguez"
    ],
    "Upala": [
      "Upala",
      "Aguas Claras",
      "San José",
      "Bijagua",
      "Delicias",
      "Dos Ríos",
      "Yolillal",
      "Canalete"
    ],
    "Los Chiles": [
      "Los Chiles",
      "Caño Negro",
      "Amparo",
      "San Jorge"
    ],
    "Guatuso": [
      "San Rafael",
      "Buenavista",
      "Cote",
      "Katira"
    ],
    "Río Cuarto": [
      "Río Cuarto",
      "Santa Isabel",
      "Santa Rita"
    ]
  },
  "Cartago": {
    "Cartago": [
      "Oriental",
      "Occidental",
      "Carmen",
      "San Nicolás",
      "Aguacaliente",
      "Guadalupe",
      "Corralillo",
      "Tierra Blanca",
      "Dulce Nombre",
      "Llano Grande",
      "Quebradilla"
    ],
    "Paraíso": [
      "Paraíso",
      "Santiago",
      "Orosi",
      "Cachí",
      "Los Llanos de Santa Lucía"
    ],
    "La Unión": [
      "Tres Ríos",
      "San Diego",
      "San Juan",
      "San Rafael",
      "Concepción",
      "Dulce Nombre",
      "San Ramón",
      "Río Azul"
    ],
    "Jiménez": [
      "Juan Viñas",
      "Tucurrique",
      "Pejibaye"
    ],
    "Turrialba": [
      "Turrialba",
      "La Suiza",
      "Peralta",
      "Santa Cruz",
      "Santa Teresita",
      "Pavones",
      "Tuis",
      "Tayutic",
      "Santa Rosa",
      "Tres Equis",
      "La Isabel",
      "Chirripó"
    ],
    "Alvarado": [
      "Pacayas",
      "Cervantes",
      "Capellades"
    ],
    "Oreamuno": [
      "San Rafael",
      "Cot",
      "Potrero Cerrado",
      "Cipreses",
      "Santa Rosa"
    ],
    "El Guarco": [
      "El Tejar",
      "San Isidro",
      "Tobosi",
      "Patio de Agua"
    ]
  },
  "Heredia": {
    "Heredia": [
      "Heredia",
      "Mercedes",
      "San Francisco",
      "Ulloa",
      "Varablanca"
    ],
    "Barva": [
      "Barva",
      "San Pedro",
      "San Pablo",
      "San Roque",
      "Santa Lucía",
      "San José de la Montaña"
    ],
    "Santo Domingo": [
      "Santo Domingo",
      "San Vicente",
      "San Miguel",
      "Paracito",
      "Santo Tomás",
      "Santa Rosa",
      "Tures",
      "Pará"
    ],
    "Santa Bárbara": [
      "Santa Bárbara",
      "San Pedro",
      "San Juan",
      "Jesús",
      "Santo Domingo del Roble",
      "Puraba"
    ],
    "San Rafael": [
      "San Rafael",
      "San Josecito",
      "Santiago",
      "Angeles",
      "Concepción"
    ],
    "San Isidro": [
      "San Isidro",
      "San José",
      "Concepción",
      "San Francisco"
    ],
    "Belén": [
      "San Antonio",
      "La Ribera",
      "Asunción"
    ],
    "Flores": [
      "San Joaquín",
      "Barrantes",
      "Llorente"
    ],
    "San Pablo": [
      "San Pablo",
      "Rincón de Sabanilla"
    ],
    "Sarapiquí": [
      "Puerto Viejo",
      "La Virgen",
      "Horquetas",
      "Llanuras de Gaspar",
      "Cureña"
    ]
  },
  "Guanacaste": {
    "Liberia": [
      "Liberia",
      "Cañas Dulces",
      "Mayorga",
      "Nacascolo",
      "Curubande"
    ],
    "Nicoya": [
      "Nicoya",
      "Mansión",
      "San Antonio",
      "Quebrada Honda",
      "Sámara",
      "Nósara",
      "Belén de Nosarita"
    ],
    "Santa Cruz": [
      "Santa Cruz",
      "Bolsón",
      "Veintisiete de Abril",
      "Tempate",
      "Cartagena",
      "Cuajiniquil",
      "Diriá",
      "Cabo Velas",
      "Tamarindo"
    ],
    "Bagaces": [
      "Bagaces",
      "Fortuna",
      "Mogote",
      "Río Naranjo"
    ],
    "Carrillo": [
      "Filadelfia",
      "Palmira",
      "Sardinal",
      "Belén"
    ],
    "Cañas": [
      "Cañas",
      "Palmira",
      "San Miguel",
      "Bebedero",
      "Porozal"
    ],
    "Abangares": [
      "Juntas",
      "Sierra",
      "San Juan",
      "Colorado"
    ],
    "Tilarán": [
      "Tilarán",
      "Quebrada Grande",
      "Tronadora",
      "Santa Rosa",
      "Líbano",
      "Tierras Morenas",
      "Arenal"
    ],
    "Nandayure": [
      "Carmona",
      "Santa Rita",
      "Zapotal",
      "San Pablo",
      "Porvenir",
      "Bejuco"
    ],
    "La Cruz": [
      "La Cruz",
      "Santa Cecilia",
      "Garita",
      "Santa Elena"
    ],
    "Hojancha": [
      "Hojancha",
      "Monte Romo",
      "Puerto Carrillo",
      "Huacas"
    ]
  },
  "Puntarenas": {
    "Puntarenas": [
      "Puntarenas",
      "Pitahaya",
      "Chomes",
      "Lepanto",
      "Paquera",
      "Manzanillo",
      "Guacimal",
      "Barranca",
      "Monte Verde",
      "Isla del Coco",
      "Cóbano",
      "Chacarita",
      "Chira",
      "Acapulco",
      "Roble",
      "Arancibia"
    ],
    "Esparza": [
      "Espíritu Santo",
      "San Juan Grande",
      "Macacona",
      "San Rafael",
      "San Jerónimo",
      "Caldera"
    ],
    "Buenos Aires": [
      "Buenos Aires",
      "Volcán",
      "Potrero Grande",
      "Boruca",
      "Pilas",
      "Colinas",
      "Chánguena",
      "Bioley",
      "Brunka"
    ],
    "Montes de Oro": [
      "Miramar",
      "Unión",
      "San Isidro"
    ],
    "Osa": [
      "Puerto Cortés",
      "Palmar",
      "Sierpe",
      "Bahía Ballena",
      "Piedras Blancas",
      "Bahía Drake"
    ],
    "Quepos": [
      "Quepos",
      "Savegre",
      "Naranjito"
    ],
    "Golfito": [
      "Golfito",
      "Puerto Jiménez",
      "Guaycará",
      "Pavón"
    ],
    "Coto Brus": [
      "San Vito",
      "Sabalito",
      "Agua Buena",
      "Limoncito",
      "Pittier",
      "Gutiérrez Brown"
    ],
    "Parrita": [
      "Parrita"
    ],
    "Corredores": [
      "Corredores",
      "La Cuesta",
      "Paso Canoas",
      "Laurel"
    ],
    "Garabito": [
      "Jacó",
      "Tárcoles"
    ],
    "Monteverde": [
      "Monteverde"
    ],
    "Puerto Jiménez": [
      "Puerto Jiménez"
    ]
  },
  "Limón": {
    "Limón": [
      "Limón",
      "Valle La Estrella",
      "Río Blanco",
      "Matama"
    ],
    "Pococí": [
      "Guápiles",
      "Jiménez",
      "Rita",
      "Roxana",
      "Cariari",
      "Colorado",
      "La Colonia"
    ],
    "Siquirres": [
      "Siquirres",
      "Pacuarito",
      "Florida",
      "Germania",
      "Cairo",
      "Alegría"
    ],
    "Talamanca": [
      "Bratsi",
      "Sixaola",
      "Cahuita",
      "Telire"
    ],
    "Matina": [
      "Matina",
      "Batán",
      "Carrandí"
    ],
    "Guácimo": [
      "Guácimo",
      "Mercedes",
      "Pocora",
      "Río Jiménez",
      "Duacarí"
    ]
  }
};
