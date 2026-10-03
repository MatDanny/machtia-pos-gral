// ============================================================
// vision.jsx — el agente que mira la foto y propone el alta.
//
// Cuatro campos que hoy se capturan a mano: código, nombre, precio y
// existencias. El agente intenta los cuatro desde UNA foto y, lo más
// importante, DICE QUÉ TAN SEGURO ESTÁ DE CADA UNO por separado:
// puede leer perfecto el nombre y no poder contar el montón.
//
// Cuando no puede contar, PREGUNTA en vez de inventar. Ésa es la
// diferencia entre un agente que ayuda y un lector que ensucia el
// inventario.
//
// Los ejemplos de aquí abajo NO son inventados: salieron de pasar las
// tres fotos reales del mostrador por un modelo de visión. Incluyen
// los fallos tal como ocurrieron.
// ============================================================

// Foto cuadrada de relleno para el prototipo. En la app es la foto tomada.
export const fotoDemo = (bg, emoji) => "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="${bg}"/>` +
  `<text x="200" y="265" font-size="190" text-anchor="middle">${emoji}</text></svg>`);

// Umbral: debajo de esto el campo se marca para que lo revises.
export const REVISAR = 0.75;

// ------------------------------------------------------------
// Contrato de /alta/vision. Una respuesta trae:
//   tomaOk    si la foto sirvió
//   consejo   cómo volver a tomarla si no
//   productos cada uno con confianza POR CAMPO y, si hace falta, una pregunta
//   sinLeer   cuántos bultos vio pero no pudo identificar
// ------------------------------------------------------------

// --- Caso medido 1: foto de un producto solo (el tubo SANIYE) ---
// Resultado: nombre perfecto, conteo perfecto, SIN precio (no traía etiqueta).
const UNO = {
  tomaOk: true,
  consejo: null,
  sinLeer: 0,
  productos: [{
    apodo: "base saniye", nombre: "SANIYE Make Up Professional · base líquida mate con minerales · 40 ml",
    cat: "maq", emoji: "🧴", foto: fotoDemo("#E8E0DC", "🧴"),
    nombreConf: 0.95,
    precio: 0, precioConf: 0, precioNota: "No vi etiqueta de precio en el tubo",
    cantidad: 1, cantidadConf: 0.97,
    pregunta: null,
  }],
};

// --- Caso medido 2: exhibidor de pupilentes ---
// Resultado: marca y línea perfectas, tres diseños distintos bien separados,
// PERO el exhibidor tiene fondo (no se puede contar) y la etiqueta "50 %"
// es ambigua entre cincuenta pesos y cincuenta por ciento de descuento.
const EXHIBIDOR = {
  tomaOk: true,
  consejo: "Para contar, saca las cajas del exhibidor y acomódalas en una fila.",
  sinLeer: 2,
  productos: [{
    apodo: "pupilentes halloween", nombre: "MAX ONE soft contact lens · Soft 3 Tone · edición Halloween",
    cat: "temp", emoji: "👁️", foto: fotoDemo("#E4DCF0", "👁️"),
    nombreConf: 0.92,
    precio: 50, precioConf: 0.35,
    precioNota: 'La etiqueta dice "50 %". No sé si son $50 o 50% de descuento.',
    variantes: [
      { etiqueta: "Lente negro", cantidad: 1, cantidadConf: 0.45, foto: fotoDemo("#F0ECE4", "⚫") },
      { etiqueta: "Lente verde", cantidad: 1, cantidadConf: 0.45, foto: fotoDemo("#1C1C1C", "🟢") },
      { etiqueta: "Lente rojo",  cantidad: 1, cantidadConf: 0.45, foto: fotoDemo("#F0F0F2", "🔴") },
    ],
    pregunta: "Vi 3 diseños pero el exhibidor tiene fondo. ¿Cuántas cajas hay de cada uno?",
  }],
};

// --- Caso medido 3: la foto del mostrador completo ---
// Resultado honesto: de unos 300 artículos reconocí 5 con nombre, 4 con precio
// y NINGUNO con existencia confiable. Esta toma no sirve para dar de alta.
const MONTON = {
  tomaOk: false,
  consejo: "Están encimados y de canto. Tómale foto a un grupo a la vez, con su etiqueta de precio a la vista.",
  sinLeer: 290,
  productos: [
    { apodo: "sombras 18", nombre: "SANIYE 18 color eyeshadow kit", cat: "maq", emoji: "🎨",
      foto: fotoDemo("#D8DCEF", "🎨"), nombreConf: 0.93,
      precio: 40, precioConf: 0.88, precioNota: null,
      cantidad: 1, cantidadConf: 0.3,
      pregunta: "Leí el precio en la etiqueta naranja. ¿Cuántas cajas tienes?" },
    { apodo: "polvo compacto", nombre: "Mocallure 24 PCS", cat: "maq", emoji: "⚪",
      foto: fotoDemo("#F0EAE2", "⚪"), nombreConf: 0.84,
      precio: 0, precioConf: 0, precioNota: "La etiqueta queda de canto, no se lee",
      cantidad: 24, cantidadConf: 0.8,
      pregunta: "La charola dice 24 piezas. ¿Están completas?" },
    { apodo: "delineador", nombre: "Lápiz delineador de ojos", cat: "maq", emoji: "✏️",
      foto: fotoDemo("#EFEAE2", "✏️"), nombreConf: 0.79,
      precio: 0, precioConf: 0, precioNota: "La etiqueta verde no se alcanza a leer",
      cantidad: 45, cantidadConf: 0.25,
      pregunta: "Son muchos en el vaso, conté como 45 y puedo estar lejos. ¿Cuántos son?" },
    { apodo: "frasco chico", nombre: "Frasco pequeño tipo perfume o aceite", cat: "perf", emoji: "🧴",
      foto: fotoDemo("#F0E8DC", "🧴"), nombreConf: 0.44,
      precio: 22, precioConf: 0.7, precioNota: null,
      cantidad: 30, cantidadConf: 0.2,
      pregunta: "No distingo qué son exactamente. ¿Cómo les dices?" },
    { apodo: "rubor rosie", nombre: "Rubor compacto Rosie", cat: "maq", emoji: "🌷",
      foto: fotoDemo("#F5DEE4", "🌷"), nombreConf: 0.72,
      precio: 32, precioConf: 0.66, precioNota: null,
      cantidad: 4, cantidadConf: 0.35,
      pregunta: "¿Cuántos rubores tienes?" },
  ],
};

// Lo que el agente contesta según el tipo de toma.
// En producción: POST /alta/vision con la imagen; esto es el mismo contrato.
export async function analizarFoto(modo) {
  await new Promise((r) => setTimeout(r, modo === "monton" ? 2400 : 1500));
  if (modo === "uno") return UNO;
  if (modo === "exhibidor") return EXHIBIDOR;
  return MONTON;
}

// Las tomas que ofrece la pantalla, con el consejo de cómo pararse.
// Una sola idea: una foto por grupo de producto. El resto son variaciones.
export const TOMAS = [
  { id: "uno", titulo: "Un producto", sub: "El más confiable. Nombre, precio y cuántos hay.",
    guia: "Que se vea el empaque completo y la etiqueta del precio.", emoji: "📦" },
  { id: "exhibidor", titulo: "Un grupo con colores", sub: "Mismo producto en varios tonos o diseños.",
    guia: "Acomódalos en fila, sin encimar, para poder contarlos.", emoji: "🎨" },
  { id: "monton", titulo: "El mostrador completo", sub: "Para ver qué tienes. No sirve para contar.",
    guia: "Vas a tener que corregir mucho. Mejor usa las otras dos.", emoji: "🛍️" },
];

// Qué tan buena salió la lectura de un producto, para pintarlo en pantalla.
export function revisarQue(p) {
  const faltas = [];
  if ((p.nombreConf || 0) < REVISAR) faltas.push("nombre");
  if ((p.precioConf || 0) < REVISAR) faltas.push("precio");
  const cc = p.variantes?.length
    ? Math.min(...p.variantes.map((v) => v.cantidadConf || 0))
    : (p.cantidadConf || 0);
  if (cc < REVISAR) faltas.push("cuántos");
  return faltas;
}
