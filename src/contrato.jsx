// ============================================================
// nucleo/contrato.jsx — los campos, definidos UNA sola vez.
//
// Lección del POS de la clínica: el mismo dato con dos nombres
// (precio_compra / pCompra / costo_unitario) costó cuatro errores en un día.
// Aquí cada campo existe una vez, con su tipo y su valor por omisión, y
// todos los módulos arman sus objetos desde aquí. Si un campo cambia,
// cambia en un solo lugar.
//
// validar() no lanza: devuelve la lista de lo que está mal, y quien llama
// decide. Los errores se escriben en la bitácora con el módulo que los pidió.
// ============================================================

import { bitacora } from "./bitacora.jsx";

// --- Las piezas del negocio ---
export const CAMPOS = {
  producto: {
    id:          { tipo: "id",     omision: null, obligatorio: true },
    apodo:       { tipo: "texto",  omision: "",   obligatorio: true,  etiqueta: "¿Cómo le dices?" },
    nombre:      { tipo: "texto",  omision: "",   etiqueta: "Nombre del empaque" },
    cat:         { tipo: "texto",  omision: "maq", etiqueta: "Categoría" },
    emoji:       { tipo: "texto",  omision: "📦" },
    foto:        { tipo: "foto",   omision: null,  etiqueta: "Foto" },
    codigo:      { tipo: "codigo", omision: null,  etiqueta: "Código de barras" },
    precio:      { tipo: "dinero", omision: 0,     obligatorio: true, etiqueta: "Precio de venta", min: 0 },
    costo:       { tipo: "dinero", omision: 0,     etiqueta: "Te costó", min: 0 },
    stock:       { tipo: "entero", omision: 0,     etiqueta: "Existencia", min: 0 },
    minimo:      { tipo: "entero", omision: 0,     etiqueta: "Avísame cuando queden", min: 0 },
    descripcion: { tipo: "texto",  omision: null },
    porPeso:     { tipo: "si/no",  omision: false, etiqueta: "Se vende por peso" },
    variantes:   { tipo: "lista",  omision: null,  de: "variante" },
  },
  variante: {
    id:       { tipo: "id",     omision: null, obligatorio: true },
    etiqueta: { tipo: "texto",  omision: "",   obligatorio: true, etiqueta: "Color o tono" },
    stock:    { tipo: "entero", omision: 0,    etiqueta: "Cuántos hay", min: 0 },
    foto:     { tipo: "foto",   omision: null },
    codigo:   { tipo: "codigo", omision: null },
  },
  // Lo que se gasta en el día: cuota del tianguis, pasaje, comida. Sin esto,
  // "vendí $3,000" no dice si se ganó o se perdió.
  gasto: {
    id:      { tipo: "id",     omision: null, obligatorio: true },
    concepto:{ tipo: "texto",  omision: "",   obligatorio: true, etiqueta: "En qué" },
    monto:   { tipo: "dinero", omision: 0,    obligatorio: true, etiqueta: "Cuánto", min: 0 },
    fecha:   { tipo: "texto",  omision: null },
    hora:    { tipo: "texto",  omision: null },
  },
  // La libreta: a quién le fías, a quién le apartas, a quién le avisas.
  // El teléfono se llama "tel" en todo el sistema. Una sola vez, aquí.
  cliente: {
    id:     { tipo: "id",     omision: null, obligatorio: true },
    nombre: { tipo: "texto",  omision: "",   obligatorio: true, etiqueta: "Nombre o apodo" },
    tel:    { tipo: "texto",  omision: "",   etiqueta: "Teléfono" },
    saldo:  { tipo: "dinero", omision: 0 },
    nota:   { tipo: "texto",  omision: null },
  },
  // Lo que alguien debe. Dos clases que NO son lo mismo:
  //   fiado    -> ya se llevó la mercancía, el inventario bajó. El riesgo es tuyo.
  //   apartado -> paga en abonos y se la lleva al terminar. La mercancía sigue
  //               contigo pero ya tiene dueño: no se le puede vender a otro.
  cuenta: {
    id:        { tipo: "id",     omision: null, obligatorio: true },
    tipo:      { tipo: "texto",  omision: "fiado", obligatorio: true },  // fiado | apartado
    clienteId: { tipo: "id",     omision: null, obligatorio: true },
    cliente:   { tipo: "texto",  omision: "",   etiqueta: "Quién" },
    lineas:    { tipo: "lista",  omision: [] },
    total:     { tipo: "dinero", omision: 0,    obligatorio: true, min: 0 },
    abonos:    { tipo: "lista",  omision: [] },                          // {fecha, hora, monto}
    fecha:     { tipo: "texto",  omision: null },
    entregado: { tipo: "si/no",  omision: false, etiqueta: "Ya se lo llevó" },
    nota:      { tipo: "texto",  omision: null },
  },
  // A dónde le depositan cuando el cliente paga por transferencia.
  datosCobro: {
    titular: { tipo: "texto", omision: "", etiqueta: "A nombre de" },
    banco:   { tipo: "texto", omision: "", etiqueta: "Banco" },
    clabe:   { tipo: "texto", omision: "", etiqueta: "CLABE o número de tarjeta" },
  },
  // El renglón de la cinta de alta: lo que se está capturando, todavía en texto.
  filaAlta: {
    key:         { tipo: "id",     omision: null },
    apodo:       { tipo: "texto",  omision: "" },
    nombre:      { tipo: "texto",  omision: "" },
    precio:      { tipo: "texto",  omision: "" },
    costo:       { tipo: "texto",  omision: "" },
    cantidad:    { tipo: "texto",  omision: "1" },
    cat:         { tipo: "texto",  omision: "maq" },
    emoji:       { tipo: "texto",  omision: "📦" },
    foto:        { tipo: "foto",   omision: null },
    codigo:      { tipo: "codigo", omision: null },
    descripcion: { tipo: "texto",  omision: null },
    existenteId: { tipo: "id",     omision: null },
    fuente:      { tipo: "texto",  omision: null },
    variantes:   { tipo: "lista",  omision: [] },
    // lo que aportó el agente de visión
    nombreConf:  { tipo: "razon",  omision: null },
    precioConf:  { tipo: "razon",  omision: null },
    cantidadConf:{ tipo: "razon",  omision: null },
    precioNota:  { tipo: "texto",  omision: null },
    pregunta:    { tipo: "texto",  omision: null },
    revisar:     { tipo: "lista",  omision: [] },
    deVision:    { tipo: "si/no",  omision: false },
    precioLeido: { tipo: "si/no",  omision: false },
    buscado:     { tipo: "si/no",  omision: false },
    confianza:   { tipo: "razon",  omision: null },
  },
};

// Arma un objeto con todos sus campos en su valor por omisión.
export function nuevo(entidad, datos = {}) {
  const def = CAMPOS[entidad];
  if (!def) { bitacora.error("contrato", "entidad que no existe", null, { entidad }); return { ...datos }; }
  const out = {};
  for (const [k, c] of Object.entries(def)) out[k] = c.omision;
  // sólo se aceptan campos que el contrato conoce; lo demás se avisa
  for (const [k, v] of Object.entries(datos)) {
    if (k in def) out[k] = v;
    else { out[k] = v; bitacora.aviso("contrato", "campo fuera del contrato", { entidad, campo: k }); }
  }
  return out;
}

// Devuelve [] si está bien, o la lista de problemas en español.
export function validar(entidad, obj, quien = "contrato") {
  const def = CAMPOS[entidad];
  if (!def) return [`No conozco la entidad ${entidad}`];
  const malos = [];
  for (const [k, c] of Object.entries(def)) {
    const v = obj?.[k];
    const vacio = v == null || v === "" || (c.tipo === "id" && !v);
    if (c.obligatorio && vacio) { malos.push(`Falta ${c.etiqueta || k}`); continue; }
    if (vacio) continue;
    if ((c.tipo === "dinero" || c.tipo === "entero") && Number.isNaN(Number(v)))
      malos.push(`${c.etiqueta || k} no es un número`);
    if (c.min != null && Number(v) < c.min)
      malos.push(`${c.etiqueta || k} no puede ser menor que ${c.min}`);
    if (c.tipo === "entero" && v != null && !Number.isInteger(Number(v)))
      malos.push(`${c.etiqueta || k} tiene que ser entero`);
  }
  if (malos.length) bitacora.aviso(quien, "objeto que no pasa el contrato", { entidad, malos });
  return malos;
}

// --- Derivados: también una sola vez, para que no se calculen distinto en cada pantalla ---

// Existencia TOTAL: todo lo que tienes físicamente, incluido lo apartado.
export const stockDe = (p) => p?.variantes?.length
  ? p.variantes.reduce((s, v) => s + (Number(v.stock) || 0), 0)
  : (Number(p?.stock) || 0);

// Lo APARTADO: está en tu poder pero ya tiene dueño, no se puede vender a otro.
export const apartadoDe = (p) => p?.variantes?.length
  ? p.variantes.reduce((s, v) => s + (Number(v.apartado) || 0), 0)
  : (Number(p?.apartado) || 0);

// DISPONIBLE: lo que de verdad puedes vender hoy. Es lo que va en la pantalla
// de venta; el total sólo sirve para el conteo físico.
export const disponibleDe = (p) => Math.max(0, stockDe(p) - apartadoDe(p));
export const tieneVariantes = (p) => !!p?.variantes?.length;
export const comoSeLlama = (p) => p?.apodo || p?.nombre || "Sin nombre";
export const money = (n) => "$" + (Number(n) || 0).toFixed(2);

// --- Cuentas: lo pagado y lo que falta, calculado en un solo lugar ---
export const pagadoDe = (c) => (c?.abonos || []).reduce((s, a) => s + (Number(a.monto) || 0), 0);
export const restaDe = (c) => Math.max(0, (Number(c?.total) || 0) - pagadoDe(c));
export const estaLiquidada = (c) => restaDe(c) <= 0;
// Un apartado se puede entregar sólo cuando ya está pagado del todo.
export const sePuedeEntregar = (c) => c?.tipo === "apartado" && !c?.entregado && estaLiquidada(c);
export const sinAcento = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
