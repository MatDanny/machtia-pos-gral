import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus, Trash2, X, Check, Search, ArrowLeft, Banknote, ChevronRight, Lock,
  Package, BarChart3, Settings, TrendingUp, Cloud, CloudOff, Users, Percent,
  CreditCard, Smartphone, RefreshCw, AlertTriangle, Crown, Store, Wallet,
  Camera, ScanLine, Sparkles, Layers, Pencil, Zap, CameraOff, CheckCircle2,
  Globe, Images, Star, RotateCw, ShoppingBag, ImageIcon, HelpCircle, Archive,
  Wand2,
} from "lucide-react";
import { fotoDemo, analizarFoto, TOMAS, revisarQue, REVISAR } from "./vision.jsx";
import { COL, inputStyle, labelStyle, ANCHO_MAX } from "./tema.jsx";
import { bitacora, atraparGlobales } from "./bitacora.jsx";
import { registrar, listar, revisar as revisarModulos } from "./registro.jsx";
import { nuevo, validar, stockDe, apartadoDe, disponibleDe, tieneVariantes, comoSeLlama,
  money, sinAcento, restaDe, estaLiquidada } from "./contrato.jsx";
import Bitacora, { Guardia, moduloBitacora } from "./f-bitacora.jsx";
import { escucharVersion, aplicarVersion } from "./actualizacion.jsx";
import Caja, { moduloCaja } from "./f-caja.jsx";
import Cuentas, { moduloCuentas } from "./f-cuentas.jsx";
import QR, { textoTicket, textoCobro, MandarWhatsApp, moduloTicket } from "./qr.jsx";
import { TomarFoto, limpiarFoto, moduloFoto } from "./fondo.jsx";

const hoy = () => new Date().toISOString().slice(0, 10);

// ============================================================
// Modelo de negocio — 3 familias x 3 escalones = 9 planes.
// El código se escribe completo (nivel 3.3) y se limita por configuración.
// ============================================================
// limBusq = búsquedas en internet al mes. Cada una le cuesta dinero al negocio
// (el buscador cobra por consulta), así que va medida y a la vista del usuario.
const PLANES = [
  { id: "1.1", fam: 1, nombre: "Puesto",     precio: 0,   limProd: 30,    limUsuarios: 1,  limBusq: 0,    desc: "Vender, cobrar y escanear códigos. Todo en el teléfono." },
  { id: "1.2", fam: 1, nombre: "Puesto+",    precio: 39,  limProd: 100,   limUsuarios: 1,  limBusq: 0,    desc: "El código trae solo el nombre. Variantes y peso." },
  { id: "1.3", fam: 1, nombre: "Tiendita",   precio: 79,  limProd: 300,   limUsuarios: 1,  limBusq: 50,   desc: "Busca foto y descripción en internet. Ráfaga, fiado y corte." },
  { id: "2.1", fam: 2, nombre: "Control",    precio: 119, limProd: 500,   limUsuarios: 2,  limBusq: 200,  desc: "La foto da nombre, precio y cuántos hay. Mínimos y alertas." },
  { id: "2.2", fam: 2, nombre: "Surtido",    precio: 169, limProd: 1000,  limUsuarios: 3,  limBusq: 400,  desc: "Precio sugerido y cuánto surtir según tu venta." },
  { id: "2.3", fam: 2, nombre: "Surtido+",   precio: 249, limProd: 2000,  limUsuarios: 4,  limBusq: 800,  desc: "ABC, temporada, margen y costo del viaje." },
  { id: "3.1", fam: 3, nombre: "Nube",       precio: 349, limProd: 99999, limUsuarios: 5,  limBusq: 1500, desc: "Foto del mostrador completo. Respaldo en la nube." },
  { id: "3.2", fam: 3, nombre: "Sucursales", precio: 549, limProd: 99999, limUsuarios: 15, limBusq: 4000, desc: "Multi-sucursal, empleados y catálogo en línea." },
  { id: "3.3", fam: 3, nombre: "Negocio",    precio: 849, limProd: 99999, limUsuarios: 99, limBusq: 9999, desc: "Facturación, API e integraciones." },
];
const FAMILIAS = {
  1: { nombre: "Local", icono: Smartphone, resumen: "Vive en el teléfono. Sin internet." },
  2: { nombre: "Inteligente", icono: TrendingUp, resumen: "Además, lee etiquetas y te dice qué surtir." },
  3: { nombre: "Nube", icono: Cloud, resumen: "Además, da de alta por foto y respalda." },
};

// Cada función declara el plan mínimo que la habilita.
const FUNCIONES = {
  venta:            { min: "1.1", nombre: "Vender y cobrar en efectivo" },
  categorias:       { min: "1.1", nombre: "Categorías y búsqueda" },
  ventasDia:        { min: "1.1", nombre: "Ventas del día" },
  escanear:         { min: "1.1", nombre: "Escanear código de barras" },
  // Las variantes van desde el plan gratis a propósito: son el corazón de este
  // giro (12 tonos de base, 3 pupilentes) y no cuestan servidor. Además hacen que
  // el tope de 30 productos alcance de verdad, que es lo que engancha.
  variantes:        { min: "1.1", nombre: "Colores y tonos del mismo producto" },
  catalogoGlobal:   { min: "1.2", nombre: "El código trae el nombre solo" },
  peso:             { min: "1.2", nombre: "Venta por peso" },
  descuento:        { min: "1.2", nombre: "Descuentos en la venta" },
  busquedaWeb:      { min: "1.3", nombre: "Buscar foto y descripción en internet" },
  rafaga:           { min: "1.3", nombre: "Escaneo en ráfaga" },
  multipago:        { min: "1.3", nombre: "Tarjeta y transferencia" },
  fiado:            { min: "1.3", nombre: "Clientes y fiado" },
  apartado:         { min: "1.3", nombre: "Apartados con abonos" },
  corte:            { min: "1.3", nombre: "Corte de caja" },
  altaFoto:         { min: "2.1", nombre: "Dar de alta con la foto" },
  minimos:          { min: "2.1", nombre: "Mínimos y alertas de stock" },
  masVendidos:      { min: "2.1", nombre: "Lo más vendido" },
  precioSugerido:   { min: "2.2", nombre: "Precio sugerido por margen" },
  demanda:          { min: "2.2", nombre: "Demanda y punto de reorden" },
  sugerencia:       { min: "2.2", nombre: "Sugerencia de surtido" },
  abc:              { min: "2.3", nombre: "Clasificación ABC" },
  temporada:        { min: "2.3", nombre: "Ajuste por temporada" },
  margen:           { min: "2.3", nombre: "Margen y utilidad" },
  costoViaje:       { min: "2.3", nombre: "Costo del viaje al proveedor" },
  altaMonton:       { min: "3.1", nombre: "Foto del mostrador completo" },
  respaldo:         { min: "3.1", nombre: "Respaldo en la nube" },
  multiDispositivo: { min: "3.1", nombre: "Varios dispositivos" },
  sucursales:       { min: "3.2", nombre: "Multi-sucursal" },
  empleados:        { min: "3.2", nombre: "Empleados y permisos" },
  catalogoOnline:   { min: "3.2", nombre: "Catálogo en línea" },
  factura:          { min: "3.3", nombre: "Facturación (CFDI)" },
  api:              { min: "3.3", nombre: "API e integraciones" },
};

const orden = (id) => PLANES.findIndex((p) => p.id === id);
const plan = (id) => PLANES[orden(id)];
const puede = (nivel, fn) => orden(nivel) >= orden(FUNCIONES[fn].min);

// ============================================================
// Datos de ejemplo. En producción: SQLite/IndexedDB en el teléfono.
// ============================================================
const CATEGORIAS = [
  { id: "maq", nombre: "Maquillaje", emoji: "💄", color: "#C96B8E" },
  { id: "unas", nombre: "Uñas", emoji: "💅", color: "#D4699B" },
  { id: "broch", nombre: "Brochas", emoji: "🖌️", color: "#B08968" },
  { id: "perf", nombre: "Perfumes", emoji: "🧴", color: "#8E7BC9" },
  { id: "piel", nombre: "Cuidado de piel", emoji: "🧼", color: "#5EA88A" },
  { id: "temp", nombre: "Temporada", emoji: "🎃", color: "#E0803C" },
  { id: "acc", nombre: "Accesorios", emoji: "👛", color: "#7BA6C9" },
];

// ------------------------------------------------------------
// Modelo del producto, armado sobre el mostrador real:
//   apodo    -> como le dice el vendedor y como lo busca ("base saniye")
//   nombre   -> el del empaque, opcional, sirve para el catálogo compartido
//   variantes-> lista PLANA con foto propia. Si hay variantes, la existencia
//               vive en cada una; si no, vive en el producto.
// Se dejó plana a propósito: el puesto surte los colores que le tocaron,
// no todas las combinaciones posibles de talla por color.
// ------------------------------------------------------------
const PRODUCTOS = [
  { id: 1, cat: "maq", apodo: "base saniye", nombre: "SANIYE base líquida mate 40 ml",
    precio: 89, costo: 41, emoji: "🧴", minimo: 4, codigo: "6942356701234", foto: fotoDemo("#F2E3D8", "🧴"),
    variantes: [
      { id: 11, etiqueta: "Tono 1 claro", stock: 6, foto: fotoDemo("#F7E9DC", "🟡") },
      { id: 12, etiqueta: "Tono 2 natural", stock: 9, foto: fotoDemo("#EFD9C3", "🟠") },
      { id: 13, etiqueta: "Tono 3 medio", stock: 4, foto: fotoDemo("#DFC0A2", "🟤") },
      { id: 14, etiqueta: "Tono 4 canela", stock: 2, foto: fotoDemo("#C9A279", "🟫") },
    ] },
  { id: 2, cat: "temp", apodo: "pupilentes", nombre: "MAX ONE soft contact lens Halloween",
    precio: 50, costo: 23, emoji: "👁️", minimo: 3, codigo: "6971234500987", foto: fotoDemo("#E4DCF0", "👁️"),
    variantes: [
      { id: 21, etiqueta: "Negro sólido", stock: 5, foto: fotoDemo("#E8E4EC", "⚫") },
      { id: 22, etiqueta: "Verde bruja", stock: 3, foto: fotoDemo("#1C1C1C", "🟢") },
      { id: 23, etiqueta: "Rojo vampiro", stock: 4, foto: fotoDemo("#F0F0F2", "🔴") },
    ] },
  { id: 3, cat: "maq", apodo: "sombras 18", nombre: "SANIYE 18 color eyeshadow kit",
    precio: 40, costo: 19, emoji: "🎨", minimo: 3, stock: 7, codigo: "6942356709876", foto: fotoDemo("#D8DCEF", "🎨") },
  { id: 4, cat: "maq", apodo: "delineador", nombre: "Lápiz delineador de ojos",
    precio: 22, costo: 7, emoji: "✏️", minimo: 20, stock: 64, foto: fotoDemo("#EFEAE2", "✏️") },
  { id: 5, cat: "unas", apodo: "esmalte", nombre: "Esmalte de uñas 15 ml",
    precio: 25, costo: 9, emoji: "💅", minimo: 10, foto: fotoDemo("#F5DCE8", "💅"),
    variantes: [
      { id: 51, etiqueta: "Rojo", stock: 8, foto: fotoDemo("#F7DADA", "🔴") },
      { id: 52, etiqueta: "Rosa", stock: 11, foto: fotoDemo("#F7DAEC", "🌸") },
      { id: 53, etiqueta: "Nude", stock: 6, foto: fotoDemo("#F0E4D8", "🤎") },
      { id: 54, etiqueta: "Negro", stock: 3, foto: fotoDemo("#E2E2E4", "⚫") },
      { id: 55, etiqueta: "Glitter", stock: 5, foto: fotoDemo("#EFEADC", "✨") },
    ] },
  { id: 6, cat: "broch", apodo: "brocha base", nombre: "Brocha para base plana",
    precio: 32, costo: 12, emoji: "🖌️", minimo: 8, stock: 22, foto: fotoDemo("#EDE2D4", "🖌️") },
  { id: 7, cat: "perf", apodo: "perfume chico", nombre: "Perfume de bolsillo 30 ml",
    precio: 45, costo: 18, emoji: "🌸", minimo: 6, foto: fotoDemo("#E8DCF0", "🌸"),
    variantes: [
      { id: 71, etiqueta: "Floral", stock: 7, foto: fotoDemo("#F2DCE8", "🌺") },
      { id: 72, etiqueta: "Dulce", stock: 9, foto: fotoDemo("#F0E4D0", "🍬") },
      { id: 73, etiqueta: "Fresco", stock: 4, foto: fotoDemo("#DCECF0", "🌿") },
    ] },
  { id: 8, cat: "maq", apodo: "rubor", nombre: "Rubor compacto Rosie",
    precio: 35, costo: 14, emoji: "🌷", minimo: 5, stock: 13, foto: fotoDemo("#F5DEE4", "🌷") },
  { id: 9, cat: "piel", apodo: "collagen", nombre: "Crema facial con colágeno",
    precio: 60, costo: 27, emoji: "🫙", minimo: 4, stock: 9, foto: fotoDemo("#DCE8F2", "🫙") },
  { id: 10, cat: "maq", apodo: "corrector", nombre: "Mocallure corrector líquido",
    precio: 28, costo: 11, emoji: "🖊️", minimo: 8, stock: 24, codigo: "6953210044556", foto: fotoDemo("#F2EAE0", "🖊️") },
  { id: 11, cat: "maq", apodo: "labial", nombre: "Labial mate larga duración",
    precio: 30, costo: 11, emoji: "💄", minimo: 12, foto: fotoDemo("#F5D8DC", "💄"),
    variantes: [
      { id: 111, etiqueta: "Rojo", stock: 14, foto: fotoDemo("#F7D6D6", "❤️") },
      { id: 112, etiqueta: "Vino", stock: 8, foto: fotoDemo("#E8D2D8", "🍷") },
      { id: 113, etiqueta: "Nude", stock: 10, foto: fotoDemo("#F0E2D6", "🤎") },
      { id: 114, etiqueta: "Coral", stock: 0, foto: fotoDemo("#F7E0D2", "🧡") },
    ] },
  { id: 12, cat: "acc", apodo: "pestañas", nombre: "Pestañas postizas par",
    precio: 20, costo: 6, emoji: "👁️", minimo: 15, stock: 41, foto: fotoDemo("#E8E2EC", "👁️") },
];


// ------------------------------------------------------------
// Catálogo por código de barras.
// Orden de búsqueda: 1) tu inventario  2) tu catálogo propio
// 3) catálogo abierto en línea (Open Food Facts)  4) nada -> alta a mano.
// ------------------------------------------------------------
// EL CATÁLOGO COMPARTIDO ENTRE VENDEDORES — el activo de verdad.
// El mismo distribuidor le surte los mismos SKUs a miles de puestos: en cuanto
// UNO nombra un producto, los demás lo reciben al escanear. Cubre justo lo que
// las tiendas grandes no venden (SANIYE, MAX ONE, Mocallure), no cuesta dinero
// por consulta y crece solo. `usos` es cuánta gente ya lo confirmó.
const CATALOGO_COMPARTIDO = {
  "6942356701234": { apodo: "base saniye", nombre: "SANIYE base líquida mate 40 ml", cat: "maq", emoji: "🧴", usos: 412, foto: fotoDemo("#F2E3D8", "🧴") },
  "6942356709876": { apodo: "sombras 18", nombre: "SANIYE 18 color eyeshadow kit", cat: "maq", emoji: "🎨", usos: 297, foto: fotoDemo("#D8DCEF", "🎨") },
  "6971234500987": { apodo: "pupilentes", nombre: "MAX ONE soft contact lens Halloween", cat: "temp", emoji: "👁️", usos: 58, foto: fotoDemo("#E4DCF0", "👁️") },
  "6953210044556": { apodo: "corrector", nombre: "Mocallure corrector líquido", cat: "maq", emoji: "🖊️", usos: 186, foto: fotoDemo("#F2EAE0", "🖊️") },
  "6901234567890": { apodo: "rímel", nombre: "MAKEROOS rímel volumen 4D", cat: "maq", emoji: "👁️", usos: 134, foto: fotoDemo("#E0E0E4", "👁️") },
  "6934567801122": { apodo: "polvo compacto", nombre: "Mocallure polvo compacto 24 pz", cat: "maq", emoji: "🟤", usos: 73, foto: fotoDemo("#F0E8DC", "🟤") },
};

// Consulta el catálogo abierto. Sin llave, sin costo.
// Ojo legal: Open Food Facts es ODbL (atribución + compartir igual).
// Se consulta en vivo y se guarda en tabla aparte; no se mezcla con tu catálogo propio.
async function consultarCatalogoAbierto(codigo) {
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${codigo}.json?fields=product_name,brands,image_small_url`);
    const j = await r.json();
    if (j.status !== 1 || !j.product) return null;
    return { nombre: j.product.product_name || "", marca: j.product.brands || "", foto: j.product.image_small_url || null, fuente: "Open Food Facts" };
  } catch (e) { return null; }
}

// Cascada de búsqueda, de lo gratis a lo caro:
//   1) tu propio inventario   2) el catálogo compartido (gratis, cubre los importados)
//   3) el catálogo abierto de alimentos   4) nada -> lo escribes tú y alimentas el 2
async function buscarCodigo(codigo, productos, nivel) {
  const mio = productos.find((p) => p.codigo === codigo
    || p.variantes?.some((v) => v.codigo === codigo));
  if (mio) return { tipo: "yaLoTengo", producto: mio };

  if (puede(nivel, "catalogoGlobal")) {
    const c = CATALOGO_COMPARTIDO[codigo];
    if (c) return { tipo: "encontrado", datos: { ...c, codigo,
      fuente: `Lo nombraron ${c.usos} vendedores` } };
    const off = await consultarCatalogoAbierto(codigo);
    if (off && off.nombre) return { tipo: "encontrado", datos: { ...off, codigo, apodo: "",
      cat: "acc", emoji: "📦" } };
  }
  return { tipo: "nuevo", datos: { codigo, apodo: "", nombre: "", cat: "maq", emoji: "📦" } };
}

// ------------------------------------------------------------
// Búsqueda en internet del producto escaneado (foto + descripción).
// Mismo criterio que el POS de la clínica y por la misma razón:
//   1) El buscador cobra POR CONSULTA, no por resultado -> una sola vuelta,
//      sin segunda búsqueda dirigida, y con cupo mensual por plan.
//   2) Si NO encuentra el producto, el buscador regresa PDFs de inventarios
//      ajenos y páginas de categoría. Juntarlos inventa productos que no existen.
//      Por eso se exige que alguna tienda traiga el CÓDIGO EXACTO; si ninguna
//      lo trae, se dice "no lo encontré" en vez de adivinar.
// ------------------------------------------------------------
// Lo que regresaría el endpoint /alta/buscar-web. Foto cuadrada, siempre.
const WEB_DEMO = {
  "7501055300310": {
    nombre: "Coca-Cola sabor original 600 ml", marca: "Coca-Cola", presentacion: "Botella 600 ml",
    descripcion: "Refresco de cola sabor original en botella de plástico de 600 ml, no retornable.",
    fotos: [
      { url: fotoDemo("#E8EDF2", "🥤"), ancho: 800, bordeTonos: 1, tienda: "Walmart" },
      { url: fotoDemo("#F2E8E8", "🧃"), ancho: 320, bordeTonos: 9, tienda: "Mercado Libre" },
      { url: fotoDemo("#EAF2E8", "🍾"), ancho: 600, bordeTonos: 0, tienda: "Chedraui" },
    ],
    tiendas: [{ nombre: "Walmart", codigoExacto: true }, { nombre: "Chedraui", codigoExacto: true },
              { nombre: "Soriana", codigoExacto: false }],
  },
  "7501000670017": {
    nombre: "Sabritas sabor original 45 g", marca: "Sabritas", presentacion: "Bolsa 45 g",
    descripcion: "Papas fritas sabor original en bolsa individual de 45 gramos.",
    fotos: [
      { url: fotoDemo("#F5EFE0", "🥔"), ancho: 520, bordeTonos: 0, tienda: "Walmart" },
      { url: fotoDemo("#EFE8F5", "🍟"), ancho: 320, bordeTonos: 9, tienda: "Mercado Libre" },
      { url: fotoDemo("#E8F0F5", "🥨"), ancho: 150, bordeTonos: 22, tienda: "Facebook" },
    ],
    tiendas: [{ nombre: "Walmart", codigoExacto: true }, { nombre: "Bodega Aurrera", codigoExacto: true },
              { nombre: "Soriana", codigoExacto: false }],
  },
  "7501030485025": {
    nombre: "Gansito Marinela 50 g", marca: "Marinela", presentacion: "Pieza 50 g",
    descripcion: "Pastelito relleno de fresa y crema, cubierto de chocolate. Pieza individual.",
    fotos: [{ url: fotoDemo("#F2E4E8", "🍫"), ancho: 700, bordeTonos: 1, tienda: "Chedraui" }],
    tiendas: [{ nombre: "Chedraui", codigoExacto: true }],
  },
  // Los importados chinos SÍ traen código, pero ninguna tienda mexicana los vende
  // en línea: aquí el buscador no sirve y hay que decirlo. Estos se resuelven con
  // el catálogo compartido, no con internet.
  "6942356701234": { sinFicha: true },
  "6971234500987": { sinFicha: true },
  "7501999888777": { sinFicha: true },
};

// Calidad de la foto, con los umbrales que se midieron en la clínica:
// el tamaño manda y el borde limpio distingue la foto de catálogo de la casera.
function calidadFoto(f) {
  let p = f.ancho >= 500 ? 80 : f.ancho >= 350 ? 60 : f.ancho >= 200 ? 35 : 10;
  p += f.bordeTonos <= 1 ? 20 : f.bordeTonos <= 7 ? 8 : 0;
  return Math.min(100, p);
}
const SIRVE = 60; // debajo de esto la foto se marca como pobre

async function buscarEnInternet(codigo) {
  // En producción: GET /alta/buscar-web?codigo=... (una sola consulta al buscador).
  await new Promise((r) => setTimeout(r, 900));
  const d = WEB_DEMO[codigo];
  if (!d || d.sinFicha) return { hallado: false, codigo, motivo: "Ninguna tienda trae este código" };
  const conCodigo = d.tiendas.filter((t) => t.codigoExacto);
  if (conCodigo.length === 0) return { hallado: false, codigo, motivo: "Salieron páginas, pero ninguna con el código exacto" };
  const fotos = d.fotos.map((f) => ({ ...f, calidad: calidadFoto(f) })).sort((a, b) => b.calidad - a.calidad);
  return { hallado: true, codigo, nombre: d.nombre, marca: d.marca, presentacion: d.presentacion,
    descripcion: d.descripcion, fotos, tiendas: conCodigo };
}

// Historial simulado y determinista: 60 días de venta por producto.
function historial(id) {
  let s = id * 7919;
  const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  const base = [3.1, 5.4, 1.2, 0.9, 0.5, 1.8, 2.4, 1.1, 4.2, 1.6, 9.5, 1.3, 6.8][((id - 1) % 13)] || 1;
  return Array.from({ length: 60 }, (_, d) => {
    const finde = (d % 7 === 5 || d % 7 === 6) ? 1.6 : 1;
    return Math.max(0, Math.round(base * finde * (0.55 + rnd() * 0.95)));
  });
}

const LEAD = 3;          // días que tarda el proveedor
const CICLO = 7;         // cada cuánto vas a surtir
const COSTO_VIAJE = 380; // lo que te cuesta ir a surtir
const MARGEN_META = 0.45; // margen objetivo para el precio sugerido

function analizar(productos, nivel) {
  const conVentas = productos.map((p0) => {
    const p = { ...p0, stock: stockDe(p0) }; // las variantes suman
    const h = historial(p.id);
    const recientes = h.slice(-14);
    const demanda = recientes.reduce((a, b) => a + b, 0) / 14;
    const sd = Math.sqrt(recientes.reduce((a, b) => a + (b - demanda) ** 2, 0) / 14);
    const vendidas60 = h.reduce((a, b) => a + b, 0);
    return { ...p, demanda, sd, vendidas60, ingreso60: vendidas60 * p.precio };
  });

  const total = conVentas.reduce((a, p) => a + p.ingreso60, 0) || 1;
  const porIngreso = [...conVentas].sort((a, b) => b.ingreso60 - a.ingreso60);
  let acum = 0; const clase = {};
  porIngreso.forEach((p) => { acum += p.ingreso60 / total; clase[p.id] = acum <= 0.8 ? "A" : acum <= 0.95 ? "B" : "C"; });

  const mes = new Date().getMonth();
  const factorTemporada = (cat) => {
    if (cat === "jug" && (mes === 11 || mes === 0 || mes === 3)) return 1.6;
    if (cat === "dulc" && (mes === 9 || mes === 11)) return 1.4;
    if (cat === "ropa" && (mes === 4 || mes === 5)) return 1.2;
    return 1;
  };

  return conVentas.map((p) => {
    const cl = clase[p.id];
    const z = puede(nivel, "abc") ? (cl === "A" ? 1.65 : cl === "B" ? 1.28 : 1.04) : 1.28;
    const temp = puede(nivel, "temporada") ? factorTemporada(p.cat) : 1;
    const demandaAjustada = p.demanda * temp;
    const seguridad = Math.ceil(z * p.sd * Math.sqrt(LEAD));
    const reorden = Math.ceil(demandaAjustada * LEAD + seguridad);
    const objetivo = Math.ceil(demandaAjustada * (LEAD + CICLO) + seguridad);

    let sugerido = 0, motivo = "";
    if (!puede(nivel, "demanda")) {
      if (p.stock <= (p.minimo || 0)) { sugerido = Math.max(0, (p.minimo || 0) * 2 - p.stock); motivo = "Bajo el mínimo que fijaste"; }
    } else if (p.stock <= reorden) {
      sugerido = Math.max(0, objetivo - p.stock);
      motivo = temp > 1 ? "Punto de reorden + temporada alta" : "Llegó al punto de reorden";
    }

    const diasCobertura = demandaAjustada > 0 ? p.stock / demandaAjustada : 99;
    return { ...p, clase: cl, temp, seguridad, reorden, objetivo, sugerido, motivo, diasCobertura,
      margen: p.precio > 0 ? (p.precio - (p.costo || 0)) / p.precio : 0, inversion: sugerido * (p.costo || 0) };
  });
}

// Los datos viven en el teléfono. Si el navegador no deja guardar (ventana
// privada, permisos), la app sigue funcionando en memoria y lo apunta.
const guardar = async (k, v) => {
  try { window.localStorage.setItem(k, JSON.stringify(v)); }
  catch (e) { bitacora.aviso("datos", "no se pudo guardar en el teléfono", { clave: k }); }
};
const leer = async (k) => {
  try { const r = window.localStorage.getItem(k); return r ? JSON.parse(r) : null; }
  catch (e) { bitacora.aviso("datos", "no se pudo leer del teléfono", { clave: k }); return null; }
};

// ============================================================
// Registro de funcionalidades.
// Agregar una pestaña = registrar un módulo aquí. App no se toca.
// Cada módulo trae su PRUEBA PROPIA: si un cambio la rompe, sale en la
// bitácora al arrancar, antes de que alguien lo encuentre vendiendo.
// ============================================================
atraparGlobales();

registrar({ id: "vender", nombre: "Vender", version: "3.0", tipo: "pestaña", orden: 10,
  icono: Store, requiere: ["catalogo"],
  pantalla: ({ ctx }) => <Vender {...ctx} />,
  probar: () => {
    const p = PRODUCTOS.find((x) => tieneVariantes(x));
    if (!p) return "no hay ningún producto con variantes para probar";
    if (stockDe(p) !== p.variantes.reduce((a, v) => a + v.stock, 0)) return "stockDe no suma las variantes";
    if (comoSeLlama(p) !== p.apodo) return "comoSeLlama no está usando el apodo";
    if (money(12.5) !== "$12.50") return "money no formatea";
    return true;
  } });

registrar({ id: "inventario", nombre: "Inventario y alta", version: "3.0", tipo: "pestaña", orden: 20,
  icono: Package, requiere: ["catalogo", "vision"],
  pantalla: ({ ctx }) => <Inventario {...ctx} />,
  probar: () => {
    const f = filaNueva({ apodo: "x", precio: 10 });
    if (f.precio !== "10") return "filaNueva no normaliza el precio a texto";
    if (f.variantes.length !== 0) return "filaNueva no arranca sin variantes";
    if (apodoDe("SANIYE Perfect Matte Liquid Foundation") !== "saniye foundation")
      return "apodoDe ya no propone el apodo esperado";
    return true;
  } });

registrar({ id: "surtir", nombre: "Surtir", version: "2.0", tipo: "pestaña", orden: 30,
  icono: TrendingUp, nivelMin: "2.1", requiere: ["catalogo"],
  pantalla: ({ ctx }) => <Surtir {...ctx} />,
  probar: () => {
    const a = analizar(PRODUCTOS, "3.3");
    if (a.length !== PRODUCTOS.length) return "el análisis perdió productos";
    if (a.some((x) => Number.isNaN(x.demanda))) return "hay demanda que no es número";
    return true;
  } });

registrar({ id: "reportes", nombre: "Reportes", version: "2.0", tipo: "pestaña", orden: 40,
  icono: BarChart3, requiere: ["catalogo"],
  pantalla: ({ ctx }) => <Reportes {...ctx} /> });

registrar({ id: "planes", nombre: "Plan", version: "2.0", tipo: "pestaña", orden: 50,
  icono: Settings,
  pantalla: ({ ctx }) => <Ajustes {...ctx} />,
  probar: () => {
    if (PLANES.length !== 9) return `se esperaban 9 planes y hay ${PLANES.length}`;
    for (const [k, f] of Object.entries(FUNCIONES))
      if (!PLANES.some((p) => p.id === f.min)) return `la función ${k} apunta a un plan que no existe: ${f.min}`;
    if (puede("1.1", "factura")) return "el plan gratis está dejando pasar la facturación";
    if (!puede("3.3", "factura")) return "el plan tope no deja facturar";
    return true;
  } });

registrar({ id: "catalogo", nombre: "Catálogo y búsqueda de código", version: "2.0", tipo: "servicio",
  probar: () => {
    const codigos = Object.keys(CATALOGO_COMPARTIDO);
    if (!codigos.length) return "el catálogo compartido está vacío";
    if (codigos.some((c) => !/^\d{8,14}$/.test(c))) return "hay códigos con formato raro";
    return true;
  } });

registrar({ id: "vision", nombre: "Agente que mira la foto", version: "1.0", tipo: "servicio",
  probar: () => {
    if (!Array.isArray(TOMAS) || TOMAS.length !== 3) return "deberían ser tres encuadres";
    if (typeof analizarFoto !== "function") return "analizarFoto no está disponible";
    if (REVISAR <= 0 || REVISAR >= 1) return "el umbral de revisión quedó fuera de rango";
    return true;
  } });

registrar(moduloCuentas);
registrar(moduloCaja);
registrar(moduloFoto);
registrar(moduloTicket);
registrar(moduloBitacora);

export default function App() {
  const [nivel, setNivel] = useState("3.3");
  const [tab, setTab] = useState("vender");
  const [productos, setProductos] = useState(PRODUCTOS);
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([
    nuevo("cliente", { id: 1, nombre: "Doña Mari" }),
    nuevo("cliente", { id: 2, nombre: "Sr. Beto" })]);
  const [candado, setCandado] = useState(null);
  const [sync, setSync] = useState({ pendientes: 0, ultima: null });
  const [busq, setBusq] = useState({ usadas: 0, auto: true });
  const [gastos, setGastos] = useState([]);
  const [cobro, setCobro] = useState({ titular: "", banco: "", clabe: "" });
  const [cuentas, setCuentas] = useState([]);

  useEffect(() => { (async () => {
    const g = await leer("pos:estado");
    if (g) { setNivel(g.nivel || "3.3"); setProductos(g.productos || PRODUCTOS); setVentas(g.ventas || []);
      setClientes(g.clientes || clientes); setGastos(g.gastos || []); setCobro(g.cobro || cobro);
      setCuentas(g.cuentas || []); }
  })(); }, []);
  useEffect(() => { guardar("pos:estado", { nivel, productos, ventas, clientes, gastos, cobro, cuentas }); },
    [nivel, productos, ventas, clientes, gastos, cobro, cuentas]);

  const P = plan(nivel);
  const gate = (fn) => { if (puede(nivel, fn)) return true; setCandado(fn); return false; };
  const analisis = useMemo(() => analizar(productos, nivel), [productos, nivel]);

  // Cada búsqueda en internet cuesta. Se descuenta del cupo del plan y se ve en pantalla.
  const restanBusq = Math.max(0, P.limBusq - busq.usadas);
  const gastarBusqueda = () => {
    if (!puede(nivel, "busquedaWeb")) { setCandado("busquedaWeb"); return false; }
    if (restanBusq <= 0) return false;
    setBusq((b) => ({ ...b, usadas: b.usadas + 1 }));
    return true;
  };

  // Mueve existencia o apartado de las líneas de una venta.
  // campo: "stock" para lo físico, "apartado" para lo reservado. signo +1 o -1.
  const mover = (ps, lineas, campo, signo) => ps.map((p) => {
    const suyas = lineas.filter((x) => x.id === p.id);
    if (!suyas.length) return p;
    if (tieneVariantes(p)) {
      return { ...p, variantes: p.variantes.map((v) => {
        const l = suyas.find((x) => x.varId === v.id);
        return l ? { ...v, [campo]: Math.max(0, (Number(v[campo]) || 0) + signo * l.cant) } : v;
      }) };
    }
    const total = suyas.reduce((s, l) => s + l.cant, 0);
    return { ...p, [campo]: Math.max(0, (Number(p[campo]) || 0) + signo * total) };
  });

  const registrarVenta = (venta) => {
    const fecha = hoy();
    const hora = new Date().toTimeString().slice(0, 5);
    // Si la venta es de un cliente conocido, su teléfono viaja con la venta:
    // así el ticket por WhatsApp ya sale con el número puesto.
    const tel = clientes.find((c) => c.id === venta.clienteId)?.tel || "";
    venta = { ...venta, telCliente: venta.telCliente || tel };
    setVentas((v) => [{ ...venta, id: Date.now(), fecha, hora }, ...v]);

    // APARTADO: la mercancía NO sale, se reserva. Sale hasta que la entregues.
    // FIADO y pago normal: la mercancía sale hoy.
    setProductos((ps) => venta.forma === "apartado"
      ? mover(ps, venta.lineas, "apartado", +1)
      : mover(ps, venta.lineas, "stock", -1));

    if (venta.forma === "fiado" || venta.forma === "apartado") {
      const cli = clientes.find((c) => c.id === venta.clienteId);
      const abonos = venta.abonoInicial > 0
        ? [{ fecha, hora, monto: venta.abonoInicial }] : [];
      setCuentas((cs) => [{ id: Date.now() + Math.random(), tipo: venta.forma,
        clienteId: venta.clienteId, cliente: cli?.nombre || "Sin nombre",
        lineas: venta.lineas.map((l) => ({ id: l.id, varId: l.varId, nombre: l.nombre, cant: l.cant })),
        total: venta.total, abonos, fecha, entregado: false }, ...cs]);
      bitacora.paso("cuentas", "cuenta abierta",
        { tipo: venta.forma, cliente: cli?.nombre, total: venta.total });
    }

    setSync((s) => ({ ...s, pendientes: s.pendientes + 1 }));
  };

  // Un abono a una cuenta. Si la liquida, lo dice en la bitácora.
  const abonar = (id, monto) => {
    setCuentas((cs) => cs.map((c) => {
      if (c.id !== id) return c;
      const nueva = { ...c, abonos: [...(c.abonos || []),
        { fecha: hoy(), hora: new Date().toTimeString().slice(0, 5), monto }] };
      bitacora.paso("cuentas", estaLiquidada(nueva) ? "cuenta liquidada" : "abono apuntado",
        { cliente: c.cliente, monto, resta: restaDe(nueva) });
      return nueva;
    }));
  };

  // Entregar un apartado: ahora sí sale del inventario y se libera la reserva.
  const entregar = (id) => {
    const c = cuentas.find((x) => x.id === id);
    if (!c) return bitacora.error("cuentas", "no encontré la cuenta a entregar", null, { id });
    if (c.tipo !== "apartado" || c.entregado || !estaLiquidada(c)) {
      return bitacora.aviso("cuentas", "no se puede entregar todavía",
        { cliente: c.cliente, resta: restaDe(c) });
    }
    setProductos((ps) => mover(mover(ps, c.lineas, "apartado", -1), c.lineas, "stock", -1));
    setCuentas((cs) => cs.map((x) => x.id === id ? { ...x, entregado: true } : x));
    bitacora.paso("cuentas", "apartado entregado", { cliente: c.cliente });
  };

  // Guarda la cinta: los nuevos entran, los repetidos suman existencia.
  const guardarCinta = (filas) => {
    setProductos((ps) => {
      let out = [...ps];
      filas.forEach((f) => {
        const cant = parseInt(f.cantidad || "0", 10) || 0;
        if (f.existenteId) {
          out = out.map((p) => p.id === f.existenteId
            ? (tieneVariantes(p)
                ? { ...p, variantes: p.variantes.map((v, i) => i === 0 ? { ...v, stock: (v.stock || 0) + cant } : v) }
                : { ...p, stock: (p.stock || 0) + cant })
            : p);
        } else {
          const base = { id: Date.now() + Math.random(), apodo: f.apodo.trim(), nombre: f.nombre || "",
            precio: parseFloat(f.precio) || 0, costo: parseFloat(f.costo) || 0, minimo: f.minimo || 0,
            cat: f.cat || "maq", emoji: f.emoji || "📦", codigo: f.codigo,
            foto: f.foto || null, descripcion: f.descripcion || null };
          const vars = (f.variantes || []).filter((v) => v.etiqueta.trim());
          if (vars.length) {
            const propias = vars.map((v, i) => ({ id: base.id + 0.2 + i / 100, etiqueta: v.etiqueta.trim(),
              stock: parseInt(v.cantidad || "0", 10) || 0, foto: v.foto || f.foto || null }));
            // si los colores los puso el vendedor a mano, el producto base es el primer color;
            // si los trajo el agente ya vienen todos nombrados y no hay que inventar uno.
            base.variantes = f.deVision ? propias
              : [{ id: base.id + 0.1, etiqueta: "Original", stock: cant, foto: f.foto || null }, ...propias];
          } else base.stock = cant;
          out.push(base);
        }
      });
      return out;
    });
    setSync((s) => ({ ...s, pendientes: s.pendientes + filas.length }));
  };

  // Las pestañas salen del registro, no de un arreglo aquí.
  const TABS = listar("pestaña");

  // Al arrancar se revisan dependencias y pruebas de todos los módulos.
  useEffect(() => {
    bitacora.paso("app", "arrancando", { nivel });
    const salud = revisarModulos();
    const malos = salud.filter((s) => s.estado === "falla");
    if (malos.length) bitacora.error("app", "arrancó con módulos en falla", null,
      { cuales: malos.map((m) => m.id) });
  }, []);

  // Todo lo que una pantalla puede necesitar, en un solo objeto.
  const ctx = { productos, setProductos, ventas, clientes, setClientes, nivel, setNivel, gate, P, analisis,
    guardarCinta, registrarVenta, busq, setBusq, restanBusq, gastarBusqueda, sync, setSync,
    gastos, setGastos, cobro, setCobro, cuentas, abonar, entregar };

  return (
    <div style={{ fontFamily: "'Trebuchet MS','Segoe UI',sans-serif", background: COL.papel, color: COL.tinta,
      minHeight: "100dvh", width: "100%", maxWidth: ANCHO_MAX, margin: "0 auto", display: "flex", flexDirection: "column",
      position: "relative", backgroundImage: "radial-gradient(rgba(201,162,122,0.08) 1px, transparent 1px)",
      backgroundSize: "18px 18px" }}>

      <AvisoVersion />
      <BarraNivel plan={P} sync={sync} nivel={nivel} />

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 92 }}>
        {TABS.filter((m) => m.id === tab).map((m) => (
          <Guardia key={m.id} modulo={m.id}>
            <m.pantalla ctx={ctx} />
          </Guardia>
        ))}
      </div>

      <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%",
        maxWidth: ANCHO_MAX, background: COL.crema, borderTop: `2px solid ${COL.kraft}`, display: "flex",
        padding: "6px 4px calc(6px + env(safe-area-inset-bottom))", zIndex: 30 }}>
        {TABS.map((t) => {
          const bloqueado = t.nivelMin && orden(nivel) < orden(t.nivelMin);
          const activo = tab === t.id;
          const malo = t.id === "bitacora" && bitacora.cuantosErrores() > 0;
          return (
            <button key={t.id} onClick={() => { bitacora.paso("app", "cambió de pestaña", { a: t.id }); setTab(t.id); }}
              style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "8px 2px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative",
                color: activo ? COL.billete : bloqueado ? "#C9BBA8" : COL.kraft, fontFamily: "inherit" }}>
              <t.icono size={21} />
              <span style={{ fontSize: 10.5, fontWeight: 700 }}>{t.nombre}</span>
              {bloqueado && <Lock size={10} style={{ position: "absolute", top: 4, right: "50%", marginRight: -20 }} />}
              {malo && <span style={{ position: "absolute", top: 5, right: "50%", marginRight: -18,
                width: 8, height: 8, borderRadius: "50%", background: COL.chile }} />}
            </button>
          );
        })}
      </nav>

      {candado && <ModalCandado fn={candado} onClose={() => setCandado(null)} onSubir={() => { setCandado(null); setTab("planes"); }} />}
    </div>
  );
}

// Las versiones nuevas esperan a que el vendedor las aplique. Nunca a media venta.
function AvisoVersion() {
  const [hay, setHay] = useState(false);
  useEffect(() => escucharVersion(setHay), []);
  if (!hay) return null;
  return (
    <div style={{ background: COL.oro, color: "#fff", padding: "9px 14px", display: "flex",
      alignItems: "center", gap: 10 }}>
      <RefreshCw size={17} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: 12.5, fontWeight: 700, lineHeight: 1.3 }}>
        Hay una versión nueva. Aplícala cuando no estés cobrando.
      </div>
      <button onClick={aplicarVersion}
        style={{ background: "#fff", color: COL.oro, border: "none", borderRadius: 10,
          padding: "8px 13px", fontSize: 12.5, fontWeight: 800, cursor: "pointer",
          fontFamily: "inherit", flexShrink: 0 }}>Actualizar</button>
    </div>
  );
}

// ============================================================
function BarraNivel({ plan, sync, nivel }) {
  const Icono = FAMILIAS[plan.fam].icono;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: `2px dashed ${COL.kraft}` }}>
      <div style={{ width: 30, height: 30, borderRadius: 10, background: COL.tinta, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icono size={17} color={COL.papel} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, letterSpacing: 0.6, color: COL.kraft, fontWeight: 700 }}>Mi negocio</div>
        <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.1 }}>
          {plan.nombre} <span style={{ color: COL.oro, fontSize: 11 }}>· nivel {nivel}</span>
        </div>
      </div>
      {puede(nivel, "respaldo")
        ? <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: COL.billete }}>
            <Cloud size={15} /> {sync.pendientes > 0 ? `${sync.pendientes} por subir` : "Al día"}
          </span>
        : <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: COL.kraft }}>
            <CloudOff size={15} /> Sólo aquí
          </span>}
    </div>
  );
}

// ============================================================
// Vender
// ============================================================
function Vender({ productos, nivel, gate, registrarVenta, clientes, setClientes, cobro }) {
  const [vista, setVista] = useState({ tipo: "categorias" });
  const [busca, setBusca] = useState("");
  const [carrito, setCarrito] = useState([]);
  const [modalVar, setModalVar] = useState(null);
  const [modalPeso, setModalPeso] = useState(null);
  const [cobrando, setCobrando] = useState(false);
  const [hecho, setHecho] = useState(null);

  // Si el teléfono se teclea al mandar el ticket y es de un cliente de la
  // libreta, se queda guardado: la próxima vez ya no hay que preguntarlo.
  const guardarTel = (tel) => {
    const id = hecho?.clienteId;
    if (!id || !tel || tel.length !== 10) return;
    setClientes((cs) => cs.map((c) => (c.id === id && !c.tel ? { ...c, tel } : c)));
    bitacora.paso("clientes", "teléfono guardado desde el ticket", { clienteId: id });
  };
  const [escaneando, setEscaneando] = useState(false);
  const [rapido, setRapido] = useState(false);

  const total = carrito.reduce((s, i) => s + i.importe, 0);

  const tocar = (p) => {
    if (tieneVariantes(p)) { if (!gate("variantes")) return; return setModalVar(p); }
    if (p.porPeso) { if (!gate("peso")) return; return setModalPeso(p); }
    addLinea(p, 1, null);
  };

  const addLinea = (p, cant, variante) => setCarrito((c) => {
    const vid = variante?.id || null;
    const i = c.findIndex((l) => l.id === p.id && l.varId === vid && !p.porPeso);
    if (i >= 0) { const n = [...c]; n[i] = { ...n[i], cant: n[i].cant + cant, importe: (n[i].cant + cant) * p.precio }; return n; }
    return [...c, { key: Date.now() + Math.random(), id: p.id, nombre: comoSeLlama(p), precio: p.precio,
      emoji: p.emoji, foto: variante?.foto || p.foto, porPeso: p.porPeso,
      varId: vid, varTxt: variante?.etiqueta || null, cant, importe: cant * p.precio }];
  });

  // Busca por apodo y por nombre del empaque, sin acentos: se teclea de oído.
  const enBusqueda = busca.trim().length > 0;
  const q = sinAcento(busca);
  const resultados = productos.filter((p) =>
    sinAcento(p.apodo).includes(q) || sinAcento(p.nombre).includes(q)
    || p.variantes?.some((v) => sinAcento(v.etiqueta).includes(q)));
  const deCategoria = vista.tipo === "productos" ? productos.filter((p) => p.cat === vista.cat) : [];
  const catActual = CATEGORIAS.find((c) => c.id === vista.cat);

  return (
    <>
      <header style={{ padding: "12px 16px 4px", display: "flex", alignItems: "center", gap: 10 }}>
        {vista.tipo === "productos" && !enBusqueda && (
          <button onClick={() => setVista({ tipo: "categorias" })} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <ArrowLeft size={22} color={COL.tinta} />
          </button>
        )}
        <div style={{ flex: 1, fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>
          {enBusqueda ? "Resultados" : vista.tipo === "productos" ? catActual?.nombre : "Vender"}
        </div>
      </header>

      <div style={{ padding: "6px 14px 4px", display: "flex", gap: 8 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: COL.crema,
          border: `1.5px solid ${COL.kraft}`, borderRadius: 14, padding: "10px 14px" }}>
          <Search size={18} color={COL.kraft} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="base saniye, esmalte rojo..."
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 16, flex: 1, minWidth: 0, color: COL.tinta, fontFamily: "inherit" }} />
          {busca && <X size={18} color={COL.kraft} style={{ cursor: "pointer" }} onClick={() => setBusca("")} />}
        </div>
        <button onClick={() => gate("escanear") && setEscaneando(true)}
          style={{ background: COL.tinta, border: "none", borderRadius: 14, width: 48, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ScanLine size={22} color={COL.papel} />
        </button>
      </div>

      {/* Cobro rápido: para vender algo que no está capturado. Nadie tiene su
          catálogo completo el primer día, y sin esto la app no sirve hasta
          que lo tenga. Cae en el carrito como una línea más. */}
      <div style={{ padding: "8px 14px 0" }}>
        <button onClick={() => setRapido(true)}
          style={{ width: "100%", padding: "13px 14px", borderRadius: 14, cursor: "pointer",
            fontFamily: "inherit", border: `2px dashed ${COL.billete}`, background: "transparent",
            color: COL.billete, fontSize: 14.5, fontWeight: 800, display: "flex",
            alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Banknote size={19} /> Cobro rápido, sin producto
        </button>
      </div>

      <div style={{ padding: `8px 14px ${carrito.length ? 210 : 20}px` }}>
        {enBusqueda && (resultados.length > 0
          ? <GridProductos lista={resultados} onTap={tocar} />
          : <Vacio texto={`No hay nada con "${busca}"`} sub="Prueba otro nombre o dalo de alta en Inventario." />)}

        {!enBusqueda && vista.tipo === "categorias" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))",
            gap: 12, marginTop: 6 }}>
            {CATEGORIAS.map((c) => (
              <button key={c.id} onClick={() => setVista({ tipo: "productos", cat: c.id })}
                style={{ background: COL.crema, border: "none", borderRadius: 18, cursor: "pointer", padding: "20px 14px",
                  textAlign: "left", boxShadow: `0 2px 0 ${COL.sombra}`, borderLeft: `5px solid ${c.color}`, position: "relative" }}>
                <div style={{ fontSize: 38 }}>{c.emoji}</div>
                <div style={{ fontSize: 17, fontWeight: 800, marginTop: 6 }}>{c.nombre}</div>
                <div style={{ fontSize: 12, color: COL.kraft, fontWeight: 600 }}>
                  {(() => { const n = productos.filter((p) => p.cat === c.id).length;
                    return `${n} ${n === 1 ? "artículo" : "artículos"}`; })()}
                </div>
                <ChevronRight size={18} color={COL.kraft} style={{ position: "absolute", top: 20, right: 14 }} />
              </button>
            ))}
          </div>
        )}

        {!enBusqueda && vista.tipo === "productos" && <GridProductos lista={deCategoria} onTap={tocar} />}
      </div>

      {carrito.length > 0 && (
        <div style={{ position: "fixed", bottom: 66, left: "50%", transform: "translateX(-50%)", width: "100%",
          maxWidth: ANCHO_MAX, background: COL.crema, borderTop: `2px solid ${COL.kraft}`, borderRadius: "20px 20px 0 0",
          boxShadow: "0 -6px 20px rgba(32,20,10,0.12)", zIndex: 25 }}>
          <div style={{ maxHeight: 150, overflowY: "auto", padding: "10px 14px 0" }}>
            {carrito.map((l) => (
              <div key={l.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${COL.papel}` }}>
                <Mini foto={l.foto} emoji={l.emoji} tam={30} radio={8} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {l.nombre}{l.varTxt && <span style={{ color: COL.kraft, fontWeight: 600 }}> · {l.varTxt}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: COL.kraft }}>
                    {l.porPeso ? `${l.cant} kg` : `${l.cant} pz`} × {money(l.precio)}
                  </div>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800 }}>{money(l.importe)}</span>
                <Trash2 size={17} color={COL.chile} style={{ cursor: "pointer" }} onClick={() => setCarrito((c) => c.filter((x) => x.key !== l.key))} />
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 14px 14px", display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: COL.kraft, fontWeight: 700 }}>
                Total · {carrito.length} {carrito.length === 1 ? "cosa" : "cosas"}
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1 }}>{money(total)}</div>
            </div>
            <button onClick={() => setCobrando(true)} style={{ background: COL.billete, color: "#fff", border: "none",
              borderRadius: 16, padding: "16px 26px", fontSize: 17, fontWeight: 800, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8, boxShadow: `0 3px 0 ${COL.billeteD}`, fontFamily: "inherit" }}>
              <Banknote size={20} /> Cobrar
            </button>
          </div>
        </div>
      )}

      {rapido && <ModalRapido onCancel={() => setRapido(false)}
        onOk={(importe) => {
          setCarrito((c) => [...c, { key: Date.now() + Math.random(), id: null, nombre: "Venta rápida",
            precio: importe, emoji: "💵", foto: null, varId: null, varTxt: null, cant: 1, importe }]);
          setRapido(false);
        }} />}
      {escaneando && <Escaner modo="venta" productos={productos} nivel={nivel}
        onCerrar={() => setEscaneando(false)}
        onProducto={(p) => { setEscaneando(false); tieneVariantes(p) ? setModalVar(p) : addLinea(p, 1, null); }} />}
      {modalVar && <ModalVariante producto={modalVar} onCancel={() => setModalVar(null)}
        onOk={(v) => { addLinea(modalVar, 1, v); setModalVar(null); }} />}
      {modalPeso && <ModalPeso producto={modalPeso} onCancel={() => setModalPeso(null)}
        onOk={(kg) => { addLinea(modalPeso, kg, null); setModalPeso(null); }} />}
      {cobrando && <ModalCobrar total={total} nivel={nivel} gate={gate} clientes={clientes}
        setClientes={setClientes} cobro={cobro}
        onCancel={() => setCobrando(false)}
        onOk={(pago) => { registrarVenta({ total: pago.total, lineas: carrito, ...pago });
          setHecho({ total: pago.total, forma: pago.forma, lineas: carrito,
            clienteId: pago.clienteId, telCliente: pago.telCliente,
            fecha: hoy(), hora: new Date().toTimeString().slice(0, 5) });
          setCarrito([]); setCobrando(false); }} />}
      {hecho && <VentaHecha venta={hecho} onClose={() => setHecho(null)} onTel={guardarTel} />}
    </>
  );
}

function GridProductos({ lista, onTap }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
      gap: 10, marginTop: 6, alignContent: "start" }}>
      {lista.map((p) => {
        const cat = CATEGORIAS.find((c) => c.id === p.cat);
        const hay = disponibleDe(p);      // lo apartado ya tiene dueño: no se ofrece
        const guardado = apartadoDe(p);
        const agotado = hay === 0;
        const vars = tieneVariantes(p) ? p.variantes.length : 0;
        return (
          <button key={p.id} onClick={() => !agotado && onTap(p)}
            style={{ background: COL.crema, border: "none", borderRadius: 16, cursor: agotado ? "default" : "pointer",
              padding: 0, position: "relative", boxShadow: `0 2px 0 ${COL.sombra}`, overflow: "hidden",
              display: "flex", flexDirection: "column", borderTop: `4px solid ${cat?.color || COL.kraft}`,
              opacity: agotado ? 0.45 : 1, fontFamily: "inherit" }}>
            {/* la foto manda: es lo que el vendedor reconoce de un vistazo */}
            <div style={{ width: "100%", aspectRatio: "1 / 1", position: "relative" }}>
              <Mini foto={p.foto} emoji={p.emoji} radio={0} lleno />
              {(vars > 0 || p.porPeso) && (
                <span style={{ position: "absolute", top: 5, right: 5, fontSize: 9, background: "rgba(32,20,10,0.78)",
                  color: "#fff", padding: "2px 6px", borderRadius: 8, fontWeight: 700 }}>
                  {p.porPeso ? "kg" : `${vars} opciones`}
                </span>
              )}
            </div>
            <div style={{ padding: "6px 5px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, textAlign: "center", lineHeight: 1.15, color: COL.tinta }}>
                {comoSeLlama(p)}
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: COL.billete }}>{money(p.precio)}{p.porPeso ? "/kg" : ""}</span>
              <span style={{ fontSize: 9.5, color: agotado ? COL.chile : COL.kraft, fontWeight: 700 }}>
                {agotado ? "Agotado" : `${hay} en stock`}
              </span>
              {guardado > 0 && (
                <span style={{ fontSize: 9, color: COL.oro, fontWeight: 800 }}>{`${guardado} apartados`}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Inventario + alta
// ============================================================
function Inventario({ productos, setProductos, nivel, gate, P, analisis, guardarCinta, busq, restanBusq, gastarBusqueda }) {
  const [pantalla, setPantalla] = useState("lista"); // lista | menuAlta | escaner | camara | cinta
  const [cinta, setCinta] = useState([]);
  const [edita, setEdita] = useState(null);
  const lleno = productos.length >= P.limProd;

  const [informe, setInforme] = useState(null); // cómo salió la toma
  const abrirCinta = (filas, res) => { setCinta(filas); setInforme(res || null); setPantalla("cinta"); };

  if (pantalla === "menuAlta") return <MenuAlta nivel={nivel} gate={gate} onCerrar={() => setPantalla("lista")}
    onEscaner={() => setPantalla("escaner")} onCamara={(m) => setPantalla({ camara: m })}
    onManual={() => abrirCinta([filaNueva()])} />;

  if (pantalla === "escaner") return <Escaner modo="alta" productos={productos} nivel={nivel}
    onCerrar={() => setPantalla("menuAlta")} onCinta={abrirCinta} />;

  if (pantalla?.camara) return <CamaraVision modo={pantalla.camara} onCerrar={() => setPantalla("menuAlta")} onCinta={abrirCinta} />;

  if (pantalla === "cinta") return <Cinta filas={cinta} setFilas={setCinta} nivel={nivel} productos={productos}
    gate={gate} busq={busq} restanBusq={restanBusq} gastarBusqueda={gastarBusqueda} informe={informe}
    onCerrar={() => setPantalla("lista")}
    onGuardar={(fs) => { guardarCinta(fs); setPantalla("lista"); }} />;

  return (
    <div style={{ padding: "12px 14px 20px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 20, fontWeight: 800, flex: 1 }}>Inventario</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: lleno ? COL.chile : COL.kraft }}>
          {productos.length} / {P.limProd > 9000 ? "sin límite" : P.limProd}
        </div>
      </div>

      {lleno && (
        <div style={{ background: "#F7E4E0", border: `1.5px solid ${COL.chile}`, borderRadius: 14, padding: 12,
          display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
          <AlertTriangle size={18} color={COL.chile} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, lineHeight: 1.35 }}>
            Llegaste al tope de productos del plan {P.nombre}. Sube de nivel en la pestaña Plan para dar de alta más.
          </div>
        </div>
      )}

      <button onClick={() => !lleno && setPantalla("menuAlta")}
        style={{ width: "100%", background: lleno ? "transparent" : COL.billete, color: lleno ? "#C9BBA8" : "#fff",
          border: lleno ? `2px dashed #D9CBB8` : "none", borderRadius: 16, padding: 16, cursor: lleno ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 9, fontSize: 16, fontWeight: 800,
          fontFamily: "inherit", marginBottom: 12, boxShadow: lleno ? "none" : `0 3px 0 ${COL.billeteD}` }}>
        <Plus size={21} /> Agregar productos
      </button>

      {productos.map((p) => {
        const a = analisis.find((x) => x.id === p.id) || {};
        const hay = stockDe(p);
        const guardado = apartadoDe(p);
        const bajo = puede(nivel, "minimos") && disponibleDe(p) <= (p.minimo || 0);
        return (
          <div key={p.id} onClick={() => setEdita(p)}
            style={{ background: COL.crema, borderRadius: 14, padding: "10px 12px", marginBottom: 8, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10, boxShadow: `0 2px 0 ${COL.sombra}`,
              borderLeft: `4px solid ${bajo ? COL.chile : "transparent"}` }}>
            <Mini foto={p.foto} emoji={p.emoji} tam={42} radio={11} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700 }}>{comoSeLlama(p)}</div>
              <div style={{ fontSize: 11.5, color: COL.kraft, fontWeight: 600 }}>
                {money(p.precio)}
                {tieneVariantes(p) && <span> · {p.variantes.length} colores</span>}
                {puede(nivel, "margen") && <span> · margen {Math.round((a.margen || 0) * 100)}%</span>}
                {puede(nivel, "abc") && a.clase && <span style={{ color: COL.oro }}> · clase {a.clase}</span>}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: bajo ? COL.chile : COL.tinta }}>{hay}</div>
              {guardado > 0
                ? <div style={{ fontSize: 10, color: COL.oro, fontWeight: 800 }}>{`${guardado} apartados`}</div>
                : puede(nivel, "minimos") && <div style={{ fontSize: 10, color: COL.kraft, fontWeight: 700 }}>mín {p.minimo}</div>}
            </div>
          </div>
        );
      })}

      {edita && <ModalEdita producto={edita} nivel={nivel} onCancel={() => setEdita(null)}
        onOk={(p) => { setProductos((ps) => ps.map((x) => x.id === p.id ? p : x)); setEdita(null); }}
        onBorrar={(id) => { setProductos((ps) => ps.filter((x) => x.id !== id)); setEdita(null); }} />}
    </div>
  );
}

const filaNueva = (datos = {}) => {
  const d = { ...datos };
  if (d.precio != null && typeof d.precio !== "string") d.precio = d.precio > 0 ? String(d.precio) : "";
  return { key: Date.now() + Math.random(), apodo: "", nombre: "", precio: "", costo: "", cantidad: "1",
    cat: "maq", emoji: "📦", codigo: null, existenteId: null, fuente: null, confianza: null,
    foto: null, descripcion: null, buscado: false, precioLeido: false, variantes: [],
    nombreConf: null, precioConf: null, cantidadConf: null, precioNota: null,
    pregunta: null, revisar: [], deVision: false, ...d };
};

// Propone un apodo corto a partir del nombre del empaque: tira las palabras de
// relleno en inglés y los tamaños, y deja dos palabras en minúscula.
const RELLENO = ["de", "la", "el", "con", "para", "professional", "makeup", "make", "up",
  "perfect", "matte", "liquid", "with", "minerals", "color", "soft", "lens", "contact", "kit"];
function apodoDe(nombre) {
  if (!nombre) return "";
  return (nombre.toLowerCase().match(/[a-záéíóúñ]+/g) || [])
    .filter((w) => w.length > 2 && !RELLENO.includes(w))
    .slice(0, 2).join(" ");
}

// Miniatura cuadrada: la foto si hay, el emoji si no. Un solo componente para toda la app.
function Mini({ foto, emoji, tam = 40, radio = 10, lleno }) {
  const [rota, setRota] = useState(false);
  const caja = lleno ? { width: "100%", height: "100%" } : { width: tam, height: tam };
  if (foto && !rota) {
    return <img src={foto} alt="" onError={() => setRota(true)}
      style={{ ...caja, borderRadius: radio, objectFit: "cover", flexShrink: 0, background: COL.papel, display: "block" }} />;
  }
  return <span style={{ ...caja, borderRadius: radio, flexShrink: 0, background: COL.papel, display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: lleno ? 90 : Math.round(tam * 0.55) }}>{emoji}</span>;
}

// ------------------------------------------------------------
// Menú de alta: los cuatro caminos, ordenados de más rápido a más lento.
// ------------------------------------------------------------
function MenuAlta({ nivel, gate, onCerrar, onEscaner, onCamara, onManual }) {
  const CAMINOS = [
    { id: "uno", icono: Camera, titulo: "Un producto", sub: "Nombre, precio y cuántos hay, de una foto.",
      fn: "altaFoto", color: COL.billete, accion: () => onCamara("uno") },
    { id: "exhibidor", icono: Layers, titulo: "Un grupo con colores", sub: "El mismo producto en varios tonos.",
      fn: "altaFoto", color: "#7BA6C9", accion: () => onCamara("exhibidor") },
    { id: "monton", icono: Images, titulo: "El mostrador completo", sub: "Para ver qué tienes. Vas a corregir mucho.",
      fn: "altaMonton", color: "#C96B8E", accion: () => onCamara("monton") },
    { id: "escaner", icono: ScanLine, titulo: "Escanear el código", sub: "Atajo cuando el producto ya tiene código.",
      fn: "escanear", color: "#E0803C", accion: onEscaner },
    { id: "manual", icono: Pencil, titulo: "A mano", sub: "Apodo y precio, nada más.",
      fn: null, color: COL.kraft, accion: onManual },
  ];

  return (
    <div style={{ padding: "12px 14px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <button onClick={onCerrar} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <ArrowLeft size={22} color={COL.tinta} />
        </button>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Agregar productos</div>
      </div>
      <div style={{ fontSize: 12.5, color: COL.kraft, fontWeight: 600, marginBottom: 14 }}>
        Escoge cómo quieres darlos de alta. Todos terminan en la misma lista para que sólo pongas el precio.
      </div>

      {CAMINOS.map((c) => {
        const bloqueado = c.fn && !puede(nivel, c.fn);
        return (
          <button key={c.id} onClick={() => { if (bloqueado) return gate(c.fn); c.accion(); }}
            style={{ width: "100%", background: COL.crema, border: "none", borderRadius: 18, padding: "16px 14px",
              marginBottom: 10, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 13,
              boxShadow: `0 2px 0 ${COL.sombra}`, borderLeft: `5px solid ${bloqueado ? "#D9CBB8" : c.color}`,
              fontFamily: "inherit", opacity: bloqueado ? 0.62 : 1, position: "relative" }}>
            <div style={{ width: 46, height: 46, borderRadius: 15, flexShrink: 0, display: "flex", alignItems: "center",
              justifyContent: "center", background: bloqueado ? "#EDE3D6" : c.color }}>
              <c.icono size={24} color={bloqueado ? "#C9BBA8" : "#fff"} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: COL.tinta }}>{c.titulo}</div>
              <div style={{ fontSize: 12.5, color: COL.kraft, fontWeight: 600, marginTop: 1 }}>{c.sub}</div>
              {bloqueado && (
                <div style={{ fontSize: 11, color: COL.oro, fontWeight: 800, marginTop: 4 }}>
                  Desde el plan {plan(FUNCIONES[c.fn].min).nombre}
                </div>
              )}
            </div>
            {bloqueado ? <Lock size={18} color={COL.oro} /> : <ChevronRight size={20} color={COL.kraft} />}
          </button>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
// Escáner de código de barras.
// Usa BarcodeDetector nativo (Chrome Android, sin librerías ni costo).
// Si el equipo no lo trae, deja escribir el código o probar con ejemplos.
// ------------------------------------------------------------
function Escaner({ modo, productos, nivel, onCerrar, onCinta, onProducto }) {
  const videoRef = useRef(null);
  const [soporta, setSoporta] = useState(null);
  const [camaraOk, setCamaraOk] = useState(null);
  const [leidos, setLeidos] = useState([]);
  const [aviso, setAviso] = useState(null);
  const [manual, setManual] = useState("");
  const vistos = useRef(new Set());
  const rafaga = modo === "alta" && puede(nivel, "rafaga");

  useEffect(() => {
    let stream, detector, vivo = true;
    const hay = typeof window !== "undefined" && "BarcodeDetector" in window;
    setSoporta(hay);

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!vivo) return stream.getTracks().forEach((t) => t.stop());
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        setCamaraOk(true);
      } catch (e) { setCamaraOk(false); return; }

      if (!hay) return;
      detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"] });
      const tic = async () => {
        if (!vivo || !videoRef.current) return;
        try {
          const cods = await detector.detect(videoRef.current);
          if (cods.length) atrapar(cods[0].rawValue);
        } catch (e) { /* cuadro no legible */ }
        if (vivo) setTimeout(tic, 350);
      };
      tic();
    })();

    return () => { vivo = false; if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, []);

  const atrapar = async (codigo) => {
    if (vistos.current.has(codigo)) return;
    vistos.current.add(codigo);
    try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) { /* sin vibrador */ }

    const r = await buscarCodigo(codigo, productos, nivel);

    if (modo === "venta") {
      if (r.tipo === "yaLoTengo") return onProducto(r.producto);
      setAviso({ tipo: "noEsta", codigo });
      setTimeout(() => { vistos.current.delete(codigo); setAviso(null); }, 2200);
      return;
    }

    const fila = r.tipo === "yaLoTengo"
      ? filaNueva({ apodo: comoSeLlama(r.producto), nombre: r.producto.nombre, emoji: r.producto.emoji,
          foto: r.producto.foto, cat: r.producto.cat, codigo, precio: String(r.producto.precio),
          existenteId: r.producto.id, fuente: "Ya lo tienes" })
      : filaNueva({ ...r.datos, codigo, apodo: r.datos.apodo || apodoDe(r.datos.nombre),
          fuente: r.datos.fuente || (r.tipo === "nuevo" ? "Sin datos" : null) });

    setLeidos((l) => [fila, ...l]);
    if (!rafaga) setTimeout(() => onCinta([fila]), 250);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 60, maxWidth: ANCHO_MAX, margin: "0 auto",
      display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        <video ref={videoRef} playsInline muted
          style={{ width: "100%", height: "100%", objectFit: "cover", display: camaraOk ? "block" : "none" }} />

        {camaraOk === false && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", color: "#fff", padding: 30, textAlign: "center", gap: 10 }}>
            <CameraOff size={44} color={COL.kraft} />
            <div style={{ fontSize: 16, fontWeight: 800 }}>No pude abrir la cámara</div>
            <div style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.4 }}>
              Dale permiso de cámara a la app, o teclea el código aquí abajo.
            </div>
          </div>
        )}

        {camaraOk && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "76%", height: 150, border: `3px solid ${COL.billete}`, borderRadius: 18,
              boxShadow: "0 0 0 2000px rgba(0,0,0,0.42)", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 2, background: COL.chile, opacity: 0.85 }} />
            </div>
          </div>
        )}

        <button onClick={onCerrar} style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,0.55)",
          border: "none", borderRadius: 12, padding: 9, cursor: "pointer" }}>
          <X size={22} color="#fff" />
        </button>

        <div style={{ position: "absolute", top: 16, left: 0, right: 0, textAlign: "center", color: "#fff",
          fontSize: 14, fontWeight: 800, textShadow: "0 1px 4px rgba(0,0,0,0.8)", pointerEvents: "none" }}>
          {modo === "venta" ? "Escanea para cobrar" : rafaga ? "Escanea uno tras otro" : "Escanea el código"}
        </div>

        {soporta === false && camaraOk && (
          <div style={{ position: "absolute", bottom: 14, left: 14, right: 14, background: "rgba(196,70,46,0.92)",
            color: "#fff", borderRadius: 12, padding: "10px 12px", fontSize: 12, fontWeight: 700, lineHeight: 1.35 }}>
            Este navegador no lee códigos. En Chrome de Android sí. Mientras, teclea el código abajo.
          </div>
        )}

        {aviso?.tipo === "noEsta" && (
          <div style={{ position: "absolute", bottom: 14, left: 14, right: 14, background: COL.crema, borderRadius: 14,
            padding: 13, fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>
            El código {aviso.codigo} no está en tu inventario. Dalo de alta desde Inventario.
          </div>
        )}
      </div>

      <div style={{ background: COL.crema, padding: "12px 14px calc(12px + env(safe-area-inset-bottom))",
        borderRadius: "20px 20px 0 0", maxHeight: "48vh", overflowY: "auto" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input value={manual} onChange={(e) => setManual(e.target.value.replace(/\D/g, ""))} inputMode="numeric"
            placeholder="o teclea el código" style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
          <button onClick={() => { if (manual.length >= 6) { atrapar(manual); setManual(""); } }}
            style={{ background: COL.tinta, color: COL.papel, border: "none", borderRadius: 12, padding: "13px 16px",
              fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Buscar</button>
        </div>

        {/* Maqueta: tres códigos que llevan a los TRES finales distintos, para
            probar el flujo sin tener los productos en la mano. Se quitan al soltar. */}
        {modo === "alta" && (
          <>
            <div style={{ fontSize: 11, fontWeight: 800, color: COL.kraft, margin: "12px 0 6px" }}>
              Para probar sin producto, toca un caso:
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[{ cod: "6942356701234", t: "Ya lo tengo" },
                { cod: "6901234567890", t: "Otro lo nombró" },
                { cod: "6999999999999", t: "Nadie lo conoce" }].map((d) => (
                <button key={d.cod} onClick={() => atrapar(d.cod)}
                  style={{ flex: 1, minWidth: 96, padding: "9px 6px", fontSize: 11, fontWeight: 700,
                    background: COL.papel, border: `1.5px solid ${COL.kraft}`, borderRadius: 10,
                    cursor: "pointer", color: COL.tinta, fontFamily: "inherit" }}>{d.t}</button>
              ))}
            </div>
          </>
        )}

        {leidos.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 800, color: COL.kraft, margin: "12px 0 6px" }}>
              Llevas {leidos.length}
            </div>
            {leidos.map((f) => (
              <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0",
                borderBottom: `1px solid ${COL.papel}` }}>
                <span style={{ fontSize: 20 }}>{f.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{f.apodo || `Código ${f.codigo}`}</div>
                  <div style={{ fontSize: 11, color: f.fuente === "Sin datos" ? COL.chile : COL.kraft, fontWeight: 700 }}>{f.fuente}</div>
                </div>
                <Trash2 size={16} color={COL.chile} style={{ cursor: "pointer" }}
                  onClick={() => { vistos.current.delete(f.codigo); setLeidos((l) => l.filter((x) => x.key !== f.key)); }} />
              </div>
            ))}
            <button onClick={() => onCinta(leidos)} style={{ width: "100%", marginTop: 12, padding: 15, fontSize: 16,
              fontWeight: 800, background: COL.billete, color: "#fff", border: "none", borderRadius: 14, cursor: "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Check size={19} /> Ponerles precio ({leidos.length})
            </button>
          </>
        )}

        {modo === "alta" && !rafaga && leidos.length === 0 && (
          <div style={{ fontSize: 11.5, color: COL.kraft, fontWeight: 700, marginTop: 10, lineHeight: 1.35 }}>
            Con el plan Tiendita puedes escanear uno tras otro sin salir de aquí.
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Cámara con visión: una foto, tres encuadres. El agente contesta qué es,
// cuánto cuesta y cuántos hay, diciendo qué tan seguro está de cada cosa.
// ------------------------------------------------------------
function CamaraVision({ modo, onCerrar, onCinta }) {
  const videoRef = useRef(null);
  const [camaraOk, setCamaraOk] = useState(null);
  const [fase, setFase] = useState("apunta"); // apunta | pensando
  const toma = TOMAS.find((t) => t.id === modo) || TOMAS[0];

  useEffect(() => {
    let stream, vivo = true;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!vivo) return stream.getTracks().forEach((t) => t.stop());
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        setCamaraOk(true);
      } catch (e) { setCamaraOk(false); }
    })();
    return () => { vivo = false; if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, []);

  // El cuadro que está viendo la cámara, tal cual, como data URL.
  const cuadro = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    try {
      const c = document.createElement("canvas");
      c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext("2d").drawImage(v, 0, 0);
      return c.toDataURL("image/jpeg", 0.9);
    } catch (e) { bitacora.aviso("vision", "no pude guardar el cuadro", String(e)); return null; }
  };

  const disparar = async () => {
    setFase("pensando");
    // La foto SÍ es real: se guarda para que el producto no quede con un
    // cuadro vacío. Lo que todavía es maqueta es el agente que la lee.
    const crudo = cuadro();
    let propia = null;
    if (crudo && modo === "uno") {
      // Un solo producto sobre algo liso: ahí sí vale la pena el recorte.
      try { propia = (await limpiarFoto(crudo, { fondo: "#FFFFFF" })).foto; }
      catch (e) { propia = crudo; bitacora.aviso("vision", "no se pudo recortar, va la foto entera", String(e)); }
    }
    const res = await analizarFoto(modo);
    // En "uno" la foto real es DE ese producto, así que manda. En los
    // encuadres de grupo el cuadro es de todo el montón: solo se usa para
    // las filas que se quedarían sin nada.
    const foto = propia || crudo;
    onCinta(res.productos.map((p) =>
      filaDeVision(foto && (modo === "uno" || !p.foto) ? { ...p, foto } : p)), res);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 60, maxWidth: ANCHO_MAX, margin: "0 auto",
      display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        <video ref={videoRef} playsInline muted
          style={{ width: "100%", height: "100%", objectFit: "cover", display: camaraOk ? "block" : "none" }} />

        {camaraOk === false && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", color: "#fff", padding: 30, textAlign: "center", gap: 10 }}>
            <CameraOff size={44} color={COL.kraft} />
            <div style={{ fontSize: 16, fontWeight: 800 }}>No pude abrir la cámara</div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>Dale permiso de cámara y vuelve a entrar.</div>
          </div>
        )}

        {camaraOk && fase === "apunta" && (
          <div style={{ position: "absolute", inset: modo === "uno" ? "18% 12%" : "10% 6%",
            border: `3px ${modo === "monton" ? "dashed" : "solid"} ${COL.billete}`, borderRadius: 20,
            boxShadow: "0 0 0 2000px rgba(0,0,0,0.38)" }} />
        )}

        {fase === "pensando" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(32,20,10,0.74)", display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#fff", padding: 30 }}>
            <Sparkles size={40} color={COL.oro} />
            <div style={{ fontSize: 17, fontWeight: 800 }}>Viendo qué hay...</div>
            <div style={{ fontSize: 13, opacity: 0.8, textAlign: "center", lineHeight: 1.4 }}>
              Qué es, cuánto cuesta y cuántos tienes
            </div>
          </div>
        )}

        <button onClick={onCerrar} style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,0.55)",
          border: "none", borderRadius: 12, padding: 9, cursor: "pointer" }}>
          <X size={22} color="#fff" />
        </button>
      </div>

      <div style={{ background: COL.crema, padding: "16px 18px calc(18px + env(safe-area-inset-bottom))",
        borderRadius: "20px 20px 0 0", textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>{toma.emoji} {toma.titulo}</div>
        <div style={{ fontSize: 12.5, color: COL.kraft, fontWeight: 600, marginTop: 3, lineHeight: 1.35 }}>{toma.guia}</div>
        <button onClick={disparar} disabled={fase === "pensando"}
          style={{ width: "100%", marginTop: 14, padding: 17, fontSize: 17, fontWeight: 800,
            background: fase === "pensando" ? COL.kraft : COL.billete, color: "#fff", border: "none", borderRadius: 16,
            cursor: fase === "pensando" ? "default" : "pointer", fontFamily: "inherit", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 9, boxShadow: `0 3px 0 ${COL.billeteD}` }}>
          <Camera size={21} />
          {fase === "pensando" ? "Trabajando..." : "Tomar la foto"}
        </button>
      </div>
    </div>
  );
}

// Pasa lo que vio el agente a un renglón de la cinta, conservando qué tan
// seguro está de cada campo para que la pantalla lo pueda marcar.
function filaDeVision(p) {
  return filaNueva({
    apodo: p.apodo, nombre: p.nombre, cat: p.cat, emoji: p.emoji, foto: p.foto,
    precio: p.precio, precioLeido: (p.precioConf || 0) >= REVISAR, precioNota: p.precioNota,
    cantidad: p.cantidad != null ? String(p.cantidad) : "",
    nombreConf: p.nombreConf, precioConf: p.precioConf, cantidadConf: p.cantidadConf,
    pregunta: p.pregunta, revisar: revisarQue(p),
    deVision: true,
    variantes: (p.variantes || []).map((v) => ({ key: Date.now() + Math.random(),
      etiqueta: v.etiqueta, cantidad: String(v.cantidad ?? ""), foto: v.foto, cantidadConf: v.cantidadConf })),
    fuente: `Lo vi en la foto · ${Math.round((p.nombreConf || 0) * 100)}%`,
  });
}

// ------------------------------------------------------------
// La cinta: donde termina todo camino de alta.
// Un solo campo obligatorio, el precio. Lo demás ya viene llenado.
// ------------------------------------------------------------
function Cinta({ filas, setFilas, nivel, productos, gate, busq, restanBusq, gastarBusqueda, informe, onCerrar, onGuardar }) {
  const [abierta, setAbierta] = useState(filas[0]?.key || null);
  const [buscando, setBuscando] = useState(null);   // key de la fila en curso
  const [hallazgo, setHallazgo] = useState(null);   // { fila, res }
  const [fotoDe, setFotoDe] = useState(null);       // key de la fila a la que le estamos tomando foto
  // Para guardar basta apodo y precio. El nombre del empaque es opcional.
  const listas = filas.filter((f) => f.apodo.trim() && parseFloat(f.precio) > 0);
  const faltan = filas.length - listas.length;

  const set = (key, campo, val) => setFilas((fs) => fs.map((f) => f.key === key ? { ...f, [campo]: val } : f));
  const quitar = (key) => setFilas((fs) => fs.filter((f) => f.key !== key));
  const addVar = (key) => setFilas((fs) => fs.map((f) => f.key === key
    ? { ...f, variantes: [...f.variantes, { key: Date.now() + Math.random(), etiqueta: "", cantidad: "1", foto: f.foto }] } : f));
  const setVar = (key, vkey, campo, val) => setFilas((fs) => fs.map((f) => f.key === key
    ? { ...f, variantes: f.variantes.map((v) => v.key === vkey ? { ...v, [campo]: val } : v) } : f));
  const quitarVar = (key, vkey) => setFilas((fs) => fs.map((f) => f.key === key
    ? { ...f, variantes: f.variantes.filter((v) => v.key !== vkey) } : f));

  // Busca en internet la ficha del producto escaneado. Gasta una consulta del cupo.
  const buscarWeb = async (f, manual) => {
    if (manual && !gate("busquedaWeb")) return;
    if (!gastarBusqueda()) return;
    setBuscando(f.key);
    set(f.key, "buscado", true);
    const res = await buscarEnInternet(f.codigo);
    setBuscando(null);
    setHallazgo({ fila: f, res });
  };

  // Al escanear, la búsqueda sale sola (si el plan la trae y queda cupo).
  useEffect(() => {
    if (!busq?.auto || !puede(nivel, "busquedaWeb") || restanBusq <= 0 || buscando || hallazgo) return;
    const pendiente = filas.find((f) => f.codigo && !f.buscado && !f.existenteId && !f.foto);
    if (pendiente) buscarWeb(pendiente, false);
  }, [filas, busq, nivel, restanBusq, buscando, hallazgo]);

  const aceptarHallazgo = (fila, res, foto) => {
    if (!res.hallado) { setHallazgo(null); setAbierta(fila.key); return; } // no encontró: la fila se queda como estaba
    const tiendas = (res.tiendas || []).map((t) => t.nombre).join(", ");
    setFilas((fs) => fs.map((f) => f.key === fila.key ? { ...f,
      nombre: res.nombre || f.nombre,
      apodo: f.apodo || apodoDe(res.nombre), descripcion: res.descripcion || f.descripcion,
      foto: foto ? foto.url : f.foto,
      fuente: tiendas ? `De internet · ${tiendas}` : "De internet" } : f));
    setHallazgo(null);
    setAbierta(fila.key);
  };

  // Precio sugerido a partir del costo y el margen meta del negocio.
  const sugerir = (f) => {
    const c = parseFloat(f.costo || "0");
    if (!c) return null;
    return Math.ceil((c / (1 - MARGEN_META)) / 5) * 5;
  };

  return (
    <div style={{ padding: "12px 14px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
        <button onClick={onCerrar} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <ArrowLeft size={22} color={COL.tinta} />
        </button>
        <div style={{ fontSize: 20, fontWeight: 800, flex: 1 }}>Ponles precio</div>
        <button onClick={() => setFilas((fs) => [...fs, filaNueva()])}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <Plus size={22} color={COL.kraft} />
        </button>
      </div>
      <div style={{ fontSize: 12.5, color: COL.kraft, fontWeight: 600, marginBottom: 12 }}>
        {faltan > 0 ? `Faltan ${faltan} por completar. Sólo el precio es obligatorio.` : "Todo listo para guardar."}
        {puede(nivel, "busquedaWeb") && (
          <span style={{ color: restanBusq > 0 ? COL.kraft : COL.chile }}>
            {" · "}Te quedan {restanBusq} búsquedas este mes
          </span>
        )}
      </div>

      {informe && (informe.tomaOk === false || informe.consejo || informe.sinLeer > 0) && (
        <div style={{ background: informe.tomaOk === false ? "#F7E4E0" : "#FFF3D6", borderRadius: 14,
          padding: 12, marginBottom: 12, display: "flex", gap: 10, alignItems: "flex-start",
          border: `1.5px solid ${informe.tomaOk === false ? COL.chile : COL.oro}` }}>
          <AlertTriangle size={18} color={informe.tomaOk === false ? COL.chile : COL.oro}
            style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>
            {informe.sinLeer > 0 && (
              <div style={{ fontWeight: 800, marginBottom: 3 }}>
                {`Vi como ${informe.sinLeer} cosas más que no alcancé a identificar.`}
              </div>
            )}
            {informe.consejo}
          </div>
        </div>
      )}

      {filas.map((f) => {
        const abierto = abierta === f.key;
        const ok = f.apodo.trim() && parseFloat(f.precio) > 0;
        const sug = sugerir(f);
        const repetido = !f.existenteId && f.apodo.trim()
          && productos.find((p) => (p.apodo || "").toLowerCase() === f.apodo.trim().toLowerCase());
        return (
          <div key={f.key} style={{ background: COL.crema, borderRadius: 16, marginBottom: 9,
            boxShadow: `0 2px 0 ${COL.sombra}`, overflow: "hidden",
            borderLeft: `4px solid ${f.pregunta ? COL.oro : ok ? COL.billete : COL.kraft}` }}>

            <div onClick={() => setAbierta(abierto ? null : f.key)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 12px", cursor: "pointer" }}>
              <Mini foto={f.foto} emoji={f.emoji} tam={42} radio={11} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>{f.apodo || "Sin apodo todavía"}</div>
                <div style={{ fontSize: 11, color: f.existenteId ? COL.billete : COL.kraft, fontWeight: 700 }}>
                  {buscando === f.key
                    ? "Buscando en internet..."
                    : f.pregunta ? "Te quiero preguntar algo"
                    : f.existenteId ? `Ya lo tienes · le sumo ${f.cantidad || 0}`
                    : f.variantes.length ? `${f.variantes.length + (f.deVision ? 0 : 1)} colores`
                    : f.fuente || "A mano"}
                </div>
              </div>
              {ok
                ? <span style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: COL.billete, display: "block" }}>
                      {money(parseFloat(f.precio))}
                    </span>
                    {f.precioLeido && <span style={{ fontSize: 9, fontWeight: 800, color: COL.oro }}>de la etiqueta</span>}
                  </span>
                : <span style={{ fontSize: 11.5, fontWeight: 800, color: COL.chile }}>
                    {f.apodo.trim() ? "falta precio" : "falta apodo"}
                  </span>}
              <ChevronRight size={18} color={COL.kraft} style={{ transform: abierto ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
            </div>

            {abierto && (
              <div style={{ padding: "0 12px 14px" }}>
                {f.pregunta && (
                  <div style={{ background: COL.papel, border: `2px solid ${COL.oro}`, borderRadius: 12,
                    padding: "11px 12px", marginBottom: 11 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <HelpCircle size={17} color={COL.oro} style={{ flexShrink: 0, marginTop: 1 }} />
                      <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.4, flex: 1 }}>{f.pregunta}</div>
                    </div>
                    <button onClick={() => set(f.key, "pregunta", null)}
                      style={{ marginTop: 9, padding: "7px 12px", borderRadius: 10, cursor: "pointer",
                        fontFamily: "inherit", border: "none", background: COL.tinta, color: COL.papel,
                        fontSize: 12, fontWeight: 800 }}>Ya quedó</button>
                  </div>
                )}

                {f.revisar?.length > 0 && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 11 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: COL.kraft }}>Revisa:</span>
                    {f.revisar.map((r) => (
                      <span key={r} style={{ fontSize: 10.5, fontWeight: 800, background: "#F7E4E0",
                        color: COL.chile, borderRadius: 8, padding: "3px 7px" }}>{r}</span>
                    ))}
                  </div>
                )}

                {f.precioNota && (
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: COL.chile, marginBottom: 11,
                    lineHeight: 1.35 }}>{f.precioNota}</div>
                )}

                {f.confianza != null && f.confianza < 0.75 && (
                  <div style={{ background: "#F7E4E0", borderRadius: 10, padding: "8px 10px", fontSize: 11.5,
                    fontWeight: 700, color: COL.chile, marginBottom: 10, display: "flex", gap: 7, alignItems: "center" }}>
                    <AlertTriangle size={15} style={{ flexShrink: 0 }} /> No estoy seguro de este. Revisa el nombre.
                  </div>
                )}
                {repetido && (
                  <div style={{ background: "#FFF3D6", borderRadius: 10, padding: "8px 10px", fontSize: 11.5,
                    fontWeight: 700, color: COL.oro, marginBottom: 10 }}>
                    Ya tienes uno que se llama igual. Revisa que no lo estés duplicando.
                  </div>
                )}

                {!f.existenteId && (
                  <>
                    <label style={labelStyle}>¿Cómo le dices? (así lo vas a buscar)</label>
                    <input value={f.apodo} onChange={(e) => set(f.key, "apodo", e.target.value)}
                      placeholder="base saniye" style={{ ...inputStyle, fontSize: 18, fontWeight: 700 }} />
                    {f.nombre && (
                      <div style={{ fontSize: 11, color: COL.kraft, fontWeight: 600, marginTop: 5, lineHeight: 1.35 }}>
                        En el empaque dice: {f.nombre}
                      </div>
                    )}
                  </>
                )}

                {!f.existenteId && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                    <Mini foto={f.foto} emoji={f.emoji} tam={58} radio={13} />
                    <button onClick={() => setFotoDe(f.key)}
                      style={{ flex: 1, padding: 13, borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                        border: `2px dashed ${COL.kraft}`, background: "transparent", color: COL.tinta,
                        fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 7, lineHeight: 1.2 }}>
                      <Wand2 size={16} color={COL.billete} />
                      {f.foto ? "Cambiar la foto" : "Tomar foto y quitar fondo"}
                    </button>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 11 }}>
                  <div style={{ flex: 1.2 }}>
                    <label style={{ ...labelStyle, color: f.precioLeido ? COL.oro : COL.billete }}>
                      {f.precioLeido ? "Precio leído de la etiqueta" : "Precio de venta"}
                    </label>
                    <input inputMode="decimal" value={f.precio} onChange={(e) => { set(f.key, "precio", e.target.value.replace(/[^\d.]/g, "")); set(f.key, "precioLeido", false); }}
                      placeholder="0.00" style={{ ...inputStyle, fontSize: 22, fontWeight: 800, textAlign: "center",
                        borderColor: parseFloat(f.precio) > 0 ? (f.precioLeido ? COL.oro : COL.billete) : COL.chile }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, color: f.cantidadConf != null && f.cantidadConf < REVISAR ? COL.chile : COL.kraft }}>
                      {f.cantidadConf != null && f.cantidadConf < REVISAR ? "Cuántos hay (revisa)" : "Cuántos entran"}
                    </label>
                    <input inputMode="numeric" value={f.cantidad} onChange={(e) => { set(f.key, "cantidad", e.target.value.replace(/\D/g, "")); set(f.key, "cantidadConf", 1); }}
                      placeholder="0" style={{ ...inputStyle, fontSize: 20, fontWeight: 800, textAlign: "center",
                        borderColor: f.cantidadConf != null && f.cantidadConf < REVISAR ? COL.chile : COL.kraft }} />
                  </div>
                </div>

                {!f.existenteId && (
                  <div style={{ display: "flex", gap: 10, marginTop: 11 }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Te costó (opcional)</label>
                      <input inputMode="decimal" value={f.costo} onChange={(e) => set(f.key, "costo", e.target.value.replace(/[^\d.]/g, ""))}
                        placeholder="0.00" style={inputStyle} />
                    </div>
                    {puede(nivel, "precioSugerido") && sug && (
                      <button onClick={() => set(f.key, "precio", String(sug))}
                        style={{ flex: 1, marginTop: 22, padding: 12, borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                          border: `2px dashed ${COL.oro}`, background: "transparent", color: COL.tinta, fontSize: 12.5, fontWeight: 800,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <Zap size={15} color={COL.oro} /> Sugiero {money(sug)}
                      </button>
                    )}
                  </div>
                )}

                {!f.existenteId && (
                  <>
                    <label style={{ ...labelStyle, display: "block", marginTop: 12 }}>Categoría</label>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                      {CATEGORIAS.map((c) => (
                        <button key={c.id} onClick={() => { set(f.key, "cat", c.id); if (f.emoji === "📦") set(f.key, "emoji", c.emoji); }}
                          style={{ padding: "8px 11px", borderRadius: 10, cursor: "pointer", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit",
                            border: `2px solid ${f.cat === c.id ? COL.billete : COL.kraft}`,
                            background: f.cat === c.id ? "#E4F0E8" : COL.papel,
                            color: f.cat === c.id ? COL.billete : COL.tinta }}>{c.emoji} {c.nombre}</button>
                      ))}
                    </div>
                  </>
                )}

                {f.descripcion && (
                  <div style={{ marginTop: 11 }}>
                    <label style={labelStyle}>Descripción</label>
                    <div style={{ ...inputStyle, fontSize: 13, lineHeight: 1.4, color: COL.kraft, fontWeight: 600 }}>
                      {f.descripcion}
                    </div>
                  </div>
                )}

                {f.codigo && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 11, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11.5, color: COL.kraft, fontWeight: 700 }}>Código {f.codigo}</span>
                    <button onClick={() => buscarWeb(f, true)} disabled={buscando === f.key}
                      style={{ marginLeft: "auto", padding: "9px 12px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit",
                        border: `2px solid ${puede(nivel, "busquedaWeb") ? COL.kraft : "#D9CBB8"}`, background: "transparent",
                        color: puede(nivel, "busquedaWeb") ? COL.tinta : "#C9BBA8", fontSize: 12.5, fontWeight: 800,
                        display: "flex", alignItems: "center", gap: 6 }}>
                      {buscando === f.key ? <RotateCw size={15} /> : puede(nivel, "busquedaWeb") ? <Globe size={15} /> : <Lock size={15} color={COL.oro} />}
                      {buscando === f.key ? "Buscando..." : f.buscado ? "Buscar otra vez" : "Buscar foto y datos"}
                    </button>
                  </div>
                )}

                {!f.existenteId && (
                  <div style={{ marginTop: 13, paddingTop: 12, borderTop: `1px dashed ${COL.kraft}` }}>
                    <label style={labelStyle}>Colores o tonos de este mismo producto</label>
                    <div style={{ fontSize: 11.5, color: COL.kraft, fontWeight: 600, marginTop: 3, lineHeight: 1.35 }}>
                      Cuentan como un solo producto de tu plan. Al vender le preguntas cuál se lleva.
                    </div>
                    {f.variantes.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 9 }}>
                        {f.variantes.map((v, i) => (
                          <div key={v.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Mini foto={v.foto} emoji={f.emoji} tam={34} radio={9} />
                            <input value={v.etiqueta} placeholder={`color ${i + 2}`}
                              onChange={(e) => setVar(f.key, v.key, "etiqueta", e.target.value)}
                              style={{ ...inputStyle, marginTop: 0, flex: 1, padding: 10, fontSize: 14 }} />
                            <input inputMode="numeric" value={v.cantidad} placeholder="0"
                              onChange={(e) => setVar(f.key, v.key, "cantidad", e.target.value.replace(/\D/g, ""))}
                              style={{ ...inputStyle, marginTop: 0, width: 62, padding: 10, fontSize: 15,
                                fontWeight: 800, textAlign: "center" }} />
                            <Trash2 size={16} color={COL.chile} style={{ cursor: "pointer", flexShrink: 0 }}
                              onClick={() => quitarVar(f.key, v.key)} />
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => addVar(f.key)}
                      style={{ width: "100%", marginTop: 9, padding: 12, borderRadius: 12, cursor: "pointer",
                        fontFamily: "inherit", border: `2px dashed ${COL.kraft}`, background: "transparent",
                        color: COL.kraft, fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 7 }}>
                      <Plus size={17} /> Otro igual, de otro color
                    </button>
                  </div>
                )}

                <button onClick={() => quitar(f.key)} style={{ marginTop: 13, background: "transparent", border: "none",
                  color: COL.chile, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
                  <Trash2 size={15} /> Quitar de la lista
                </button>
              </div>
            )}
          </div>
        );
      })}

      <button onClick={() => listas.length && onGuardar(listas)} disabled={!listas.length}
        style={{ width: "100%", marginTop: 8, padding: 17, fontSize: 17, fontWeight: 800,
          background: listas.length ? COL.billete : COL.kraft, color: "#fff", border: "none", borderRadius: 16,
          cursor: listas.length ? "pointer" : "default", fontFamily: "inherit", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 9, boxShadow: listas.length ? `0 3px 0 ${COL.billeteD}` : "none" }}>
        <CheckCircle2 size={21} />
        {listas.length ? `Guardar ${listas.length} ${listas.length === 1 ? "producto" : "productos"}` : "Ponle precio a alguno"}
      </button>

      {hallazgo && <Hallazgo {...hallazgo} onCerrar={() => setHallazgo(null)}
        onAceptar={(foto) => aceptarHallazgo(hallazgo.fila, hallazgo.res, foto)} />}

      {fotoDe && <TomarFoto onCancel={() => setFotoDe(null)}
        onOk={(foto) => { set(fotoDe, "foto", foto); setFotoDe(null);
          bitacora.paso("alta", "foto tomada en la cinta"); }} />}
    </div>
  );
}

// ------------------------------------------------------------
// Ficha del hallazgo: lo que trajo internet, para que tú digas si es o no es.
// Nunca se guarda solo: un nombre equivocado ensucia el inventario para siempre.
// ------------------------------------------------------------
function Hallazgo({ fila, res, onCerrar, onAceptar }) {
  const [sel, setSel] = useState(0);

  if (!res.hallado) {
    return (
      <Overlay onCancel={onCerrar}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 58, height: 58, borderRadius: 19, background: COL.papel, display: "flex",
            alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <ImageIcon size={27} color={COL.kraft} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>No encontré este producto</div>
          <div style={{ fontSize: 13.5, color: COL.kraft, fontWeight: 600, marginTop: 8, lineHeight: 1.45 }}>
            {res.motivo}. Prefiero decírtelo a inventarte un nombre: escríbelo tú y la próxima vez que alguien
            escanee este código ya va a estar.
          </div>
        </div>
        <button onClick={() => onAceptar(null)} style={{ width: "100%", marginTop: 18, padding: 16, fontSize: 16,
          fontWeight: 800, background: COL.billete, color: "#fff", border: "none", borderRadius: 14, cursor: "pointer",
          fontFamily: "inherit" }}>
          Lo escribo yo
        </button>
      </Overlay>
    );
  }

  const foto = res.fotos[sel];
  const pobre = foto.calidad < SIRVE;

  return (
    <Overlay onCancel={onCerrar}>
      <div style={{ textAlign: "center", fontSize: 12, fontWeight: 800, color: COL.kraft, marginBottom: 10 }}>
        Encontré esto
      </div>

      <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", borderRadius: 18, overflow: "hidden",
        background: COL.papel, marginBottom: 10 }}>
        <Mini foto={foto.url} emoji={fila.emoji} radio={18} lleno />
        <span style={{ position: "absolute", top: 10, left: 10, fontSize: 11, fontWeight: 800, borderRadius: 9,
          padding: "5px 9px", color: "#fff", background: pobre ? COL.chile : COL.billete,
          display: "flex", alignItems: "center", gap: 5 }}>
          <Star size={13} /> {`${foto.calidad}/100`}
        </span>
        <span style={{ position: "absolute", top: 10, right: 10, fontSize: 11, fontWeight: 800, borderRadius: 9,
          padding: "5px 9px", color: COL.tinta, background: "rgba(251,247,239,0.9)" }}>
          {foto.tienda}
        </span>
      </div>

      {pobre && (
        <div style={{ background: "#F7E4E0", borderRadius: 10, padding: "8px 10px", fontSize: 11.5, fontWeight: 700,
          color: COL.chile, marginBottom: 10, display: "flex", gap: 7, alignItems: "center" }}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          {`Esta foto se ve pobre (${foto.ancho}px). Prueba otra o tómala tú.`}
        </div>
      )}

      {res.fotos.length > 1 && (
        <>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: COL.kraft, marginBottom: 6, display: "flex",
            alignItems: "center", gap: 6 }}>
            <Images size={14} /> {res.fotos.length} fotos · escoge la que se vea mejor
          </div>
          <div style={{ display: "flex", gap: 7, marginBottom: 12, overflowX: "auto", paddingBottom: 2 }}>
            {res.fotos.map((f, i) => (
              <button key={i} onClick={() => setSel(i)}
                style={{ padding: 0, border: `3px solid ${i === sel ? COL.billete : "transparent"}`, borderRadius: 13,
                  background: "none", cursor: "pointer", flexShrink: 0, lineHeight: 0 }}>
                <Mini foto={f.url} emoji={fila.emoji} tam={56} radio={10} />
              </button>
            ))}
          </div>
        </>
      )}

      <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.25 }}>{res.nombre}</div>
      {res.marca && <div style={{ fontSize: 12.5, color: COL.kraft, fontWeight: 700, marginTop: 2 }}>
        {res.marca}{res.presentacion ? ` · ${res.presentacion}` : ""}
      </div>}
      <div style={{ fontSize: 13, color: COL.kraft, fontWeight: 600, marginTop: 8, lineHeight: 1.45 }}>{res.descripcion}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
        <ShoppingBag size={15} color={COL.kraft} />
        <span style={{ fontSize: 11.5, color: COL.kraft, fontWeight: 700 }}>
          Traen el código {res.codigo}:
        </span>
        {res.tiendas.map((t) => (
          <span key={t.nombre} style={{ fontSize: 11, fontWeight: 800, background: COL.papel, border: `1px solid ${COL.kraft}`,
            borderRadius: 8, padding: "3px 7px" }}>{t.nombre}</span>
        ))}
      </div>

      <button onClick={() => onAceptar(foto)} style={{ width: "100%", marginTop: 16, padding: 16, fontSize: 17,
        fontWeight: 800, background: COL.billete, color: "#fff", border: "none", borderRadius: 14, cursor: "pointer",
        fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Check size={20} /> Sí, es este
      </button>
      <button onClick={onCerrar} style={{ width: "100%", marginTop: 8, padding: 13, fontSize: 14, fontWeight: 700,
        background: "transparent", color: COL.kraft, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
        No es, lo escribo yo
      </button>
    </Overlay>
  );
}

// ============================================================
// Surtir
// ============================================================
function Surtir({ analisis, nivel, gate }) {
  if (!puede(nivel, "minimos")) {
    return <Promo icono={TrendingUp} titulo="Te decimos qué surtir"
      texto="Con el nivel Control la app te avisa cuándo un producto está por acabarse. Con Surtido calcula cuánto pedir según lo que realmente vendes."
      accion={() => gate("minimos")} />;
  }

  const sugeridos = analisis.filter((a) => a.sugerido > 0).sort((a, b) => b.inversion - a.inversion);
  const inversion = sugeridos.reduce((s, a) => s + a.inversion, 0);
  const utilidad = sugeridos.reduce((s, a) => s + a.sugerido * (a.precio - (a.costo || 0)), 0);
  const vale = inversion > 0 && utilidad > COSTO_VIAJE;

  return (
    <div style={{ padding: "12px 14px 20px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Qué surtir</div>
      <div style={{ fontSize: 12.5, color: COL.kraft, fontWeight: 600, marginBottom: 12 }}>
        {puede(nivel, "demanda")
          ? `Calculado con lo que vendiste los últimos 14 días · proveedor tarda ${LEAD} días`
          : "Basado en los mínimos que fijaste en Inventario"}
      </div>

      {sugeridos.length === 0
        ? <Vacio texto="Nada urgente por hoy" sub="Cuando algún producto llegue a su punto de reorden aparece aquí." />
        : <>
            <div style={{ background: COL.crema, borderRadius: 16, padding: 14, marginBottom: 12, boxShadow: `0 2px 0 ${COL.sombra}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: COL.kraft }}>Vas a invertir</span>
                <span style={{ fontSize: 18, fontWeight: 800 }}>{money(inversion)}</span>
              </div>
              {puede(nivel, "margen") && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: COL.kraft }}>Ganancia esperada</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: COL.billete }}>{money(utilidad)}</span>
                </div>
              )}
              {puede(nivel, "costoViaje") && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${COL.kraft}`, fontSize: 12.5, lineHeight: 1.4 }}>
                  El viaje al proveedor te cuesta cerca de {money(COSTO_VIAJE)} entre tiempo y traslado.{" "}
                  <strong style={{ color: vale ? COL.billete : COL.chile }}>
                    {vale ? "Con este pedido sí se justifica ir." : "Todavía no se justifica el viaje; junta más pedido."}
                  </strong>
                </div>
              )}
            </div>

            {sugeridos.map((a) => (
              <div key={a.id} style={{ background: COL.crema, borderRadius: 14, padding: 12, marginBottom: 8, boxShadow: `0 2px 0 ${COL.sombra}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{a.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>{a.nombre}</div>
                    <div style={{ fontSize: 11.5, color: COL.kraft, fontWeight: 600 }}>{a.motivo}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: COL.billete }}>{a.sugerido}</div>
                    <div style={{ fontSize: 10, color: COL.kraft, fontWeight: 700 }}>pedir</div>
                  </div>
                </div>
                {puede(nivel, "demanda") && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${COL.papel}`, display: "flex",
                    gap: 12, flexWrap: "wrap", fontSize: 11, color: COL.kraft, fontWeight: 700 }}>
                    <span>Vendes {a.demanda.toFixed(1)}/día</span>
                    <span>Te quedan {a.stock} ({a.diasCobertura.toFixed(1)} días)</span>
                    <span>Reorden en {a.reorden}</span>
                    {puede(nivel, "abc") && <span style={{ color: COL.oro }}>Clase {a.clase}</span>}
                    {puede(nivel, "temporada") && a.temp > 1 && <span style={{ color: COL.chile }}>Temporada ×{a.temp}</span>}
                  </div>
                )}
              </div>
            ))}
          </>}

      {!puede(nivel, "demanda") && (
        <MiniPromo texto="Sube a Surtido para que calcule cuánto pedir según tu venta real, no sólo el mínimo." onClick={() => gate("demanda")} />
      )}
      {puede(nivel, "demanda") && !puede(nivel, "abc") && (
        <MiniPromo texto="Sube a Surtido+ para ajustar por temporada, clasificar por importancia y ver si el viaje se justifica." onClick={() => gate("abc")} />
      )}
    </div>
  );
}

// ============================================================
// Reportes
// ============================================================
function Reportes({ ventas, analisis, nivel, gate, clientes }) {
  const [corte, setCorte] = useState(null);
  const delDia = ventas.filter((v) => v.fecha === hoy());
  const totalDia = delDia.reduce((s, v) => s + v.total, 0);
  const porForma = delDia.reduce((acc, v) => { acc[v.forma || "efectivo"] = (acc[v.forma || "efectivo"] || 0) + v.total; return acc; }, {});
  const top = [...analisis].sort((a, b) => b.vendidas60 - a.vendidas60).slice(0, 5);
  const fiado = clientes.reduce((s, c) => s + c.saldo, 0);

  return (
    <div style={{ padding: "12px 14px 20px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Reportes</div>

      <div style={{ background: COL.tinta, color: COL.papel, borderRadius: 18, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.7 }}>Vendido hoy</div>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1 }}>{money(totalDia)}</div>
        <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 600 }}>{delDia.length} ventas</div>
      </div>

      {Object.keys(porForma).length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {Object.entries(porForma).map(([f, m]) => (
            <div key={f} style={{ flex: 1, background: COL.crema, borderRadius: 12, padding: "10px 12px", boxShadow: `0 2px 0 ${COL.sombra}` }}>
              <div style={{ fontSize: 10.5, color: COL.kraft, fontWeight: 700, textTransform: "capitalize" }}>{f}</div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{money(m)}</div>
            </div>
          ))}
        </div>
      )}

      <Seccion titulo="Corte de caja" bloqueado={!puede(nivel, "corte")} onDesbloquear={() => gate("corte")}>
        <button onClick={() => setCorte({ total: totalDia, efectivo: porForma.efectivo || 0, ventas: delDia.length })}
          style={{ width: "100%", background: COL.billete, color: "#fff", border: "none", borderRadius: 14, padding: 14,
            fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Wallet size={18} /> Cerrar el día
        </button>
      </Seccion>

      <Seccion titulo="Lo más vendido" bloqueado={!puede(nivel, "masVendidos")} onDesbloquear={() => gate("masVendidos")}>
        {top.map((p, i) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
            borderBottom: i < top.length - 1 ? `1px solid ${COL.papel}` : "none" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: COL.kraft, width: 16 }}>{i + 1}</span>
            <span style={{ fontSize: 20 }}>{p.emoji}</span>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{comoSeLlama(p)}</div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>{p.vendidas60} pz</div>
          </div>
        ))}
      </Seccion>

      <Seccion titulo="Fiado" bloqueado={!puede(nivel, "fiado")} onDesbloquear={() => gate("fiado")}>
        <div style={{ fontSize: 12.5, color: COL.kraft, fontWeight: 700, marginBottom: 8 }}>Te deben {money(fiado)}</div>
        {clientes.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
            <Users size={16} color={COL.kraft} />
            <div style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{c.nombre}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: c.saldo > 0 ? COL.chile : COL.kraft }}>{money(c.saldo)}</div>
          </div>
        ))}
      </Seccion>

      <Seccion titulo="Facturación" bloqueado={!puede(nivel, "factura")} onDesbloquear={() => gate("factura")}>
        <div style={{ fontSize: 13, color: COL.kraft, fontWeight: 600 }}>Emite CFDI de las ventas del día y descarga el XML.</div>
      </Seccion>

      {corte && <ModalCorte datos={corte} onClose={() => setCorte(null)} />}
    </div>
  );
}

// ============================================================
// Ajustes / planes
// ============================================================
function Ajustes({ nivel, setNivel, productos, sync, setSync, busq, setBusq, restanBusq, P }) {
  const [fam, setFam] = useState(plan(nivel).fam);

  return (
    <div style={{ padding: "12px 14px 20px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>Tu plan</div>
      <div style={{ fontSize: 12.5, color: COL.kraft, fontWeight: 600, marginBottom: 12 }}>
        Cambia de nivel para ver cómo se abre y se cierra la app. Así lo verá el cliente.
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[1, 2, 3].map((f) => {
          const F = FAMILIAS[f]; const activo = fam === f;
          return (
            <button key={f} onClick={() => setFam(f)}
              style={{ flex: 1, padding: "10px 6px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                border: `2px solid ${activo ? COL.tinta : COL.kraft}`, background: activo ? COL.tinta : "transparent",
                color: activo ? COL.papel : COL.tinta, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <F.icono size={17} />
              <span style={{ fontSize: 12, fontWeight: 800 }}>{F.nombre}</span>
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 12.5, color: COL.kraft, fontWeight: 600, marginBottom: 10 }}>{FAMILIAS[fam].resumen}</div>

      {PLANES.filter((p) => p.fam === fam).map((p) => {
        const activo = p.id === nivel;
        const nuevas = Object.entries(FUNCIONES).filter(([, f]) => f.min === p.id);
        return (
          <div key={p.id} onClick={() => setNivel(p.id)}
            style={{ background: activo ? "#E4F0E8" : COL.crema, border: `2px solid ${activo ? COL.billete : "transparent"}`,
              borderRadius: 16, padding: 14, marginBottom: 10, cursor: "pointer", boxShadow: `0 2px 0 ${COL.sombra}` }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 800, flex: 1 }}>
                {p.nombre} <span style={{ fontSize: 11, color: COL.oro }}>nivel {p.id}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: COL.billete }}>
                {p.precio === 0 ? "Gratis" : `${money(p.precio)}/mes`}
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: COL.kraft, fontWeight: 600, marginTop: 2 }}>{p.desc}</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 8, color: COL.tinta }}>
              Hasta {p.limProd > 9000 ? "sin límite de" : p.limProd} productos · {p.limUsuarios} {p.limUsuarios === 1 ? "usuario" : "usuarios"}
              {p.limBusq > 0 && ` · ${p.limBusq > 9000 ? "búsquedas sin límite" : `${p.limBusq} búsquedas al mes`}`}
            </div>
            {nuevas.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
                {nuevas.map(([k, f]) => (
                  <span key={k} style={{ fontSize: 10.5, fontWeight: 700, background: COL.papel, color: COL.tinta,
                    border: `1px solid ${COL.kraft}`, borderRadius: 8, padding: "3px 7px" }}>+ {f.nombre}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {puede(nivel, "busquedaWeb") && (
        <div style={{ background: COL.crema, borderRadius: 16, padding: 14, marginTop: 6, marginBottom: 12,
          boxShadow: `0 2px 0 ${COL.sombra}` }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 7 }}>
            <Globe size={17} color={COL.kraft} /> Búsqueda en internet
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: restanBusq > 0 ? COL.billete : COL.chile }}>{restanBusq}</span>
            <span style={{ fontSize: 12.5, color: COL.kraft, fontWeight: 700 }}>
              de {P.limBusq > 9000 ? "las que quieras" : P.limBusq} este mes
            </span>
          </div>
          <div style={{ height: 7, borderRadius: 4, background: COL.papel, overflow: "hidden", marginBottom: 10 }}>
            <div style={{ height: "100%", width: `${Math.min(100, (busq.usadas / Math.max(1, P.limBusq)) * 100)}%`,
              background: restanBusq > 0 ? COL.billete : COL.chile }} />
          </div>
          <button onClick={() => setBusq((b) => ({ ...b, auto: !b.auto }))}
            style={{ width: "100%", padding: 12, borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
              border: `2px solid ${busq.auto ? COL.billete : COL.kraft}`, background: busq.auto ? "#E4F0E8" : "transparent",
              color: busq.auto ? COL.billete : COL.tinta, fontSize: 13.5, fontWeight: 800, display: "flex",
              alignItems: "center", justifyContent: "center", gap: 8 }}>
            {busq.auto ? <Check size={17} /> : <X size={17} />}
            Buscar sola al escanear
          </button>
          <div style={{ fontSize: 11.5, color: COL.kraft, fontWeight: 600, marginTop: 8, lineHeight: 1.4 }}>
            Apágalo si prefieres pedir la búsqueda producto por producto. Los que ya buscaste no vuelven a gastar.
          </div>
        </div>
      )}

      <div style={{ background: COL.crema, borderRadius: 16, padding: 14, marginTop: 6, boxShadow: `0 2px 0 ${COL.sombra}` }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Tus datos</div>
        <div style={{ fontSize: 12.5, color: COL.kraft, fontWeight: 600, lineHeight: 1.4 }}>
          {productos.length} productos guardados en este teléfono.
          {puede(nivel, "respaldo")
            ? " Se respaldan en la nube cuando hay internet."
            : " Si pierdes el teléfono, pierdes la información. El nivel Nube lo respalda."}
        </div>
        {puede(nivel, "respaldo") && (
          <button onClick={() => setSync({ pendientes: 0, ultima: new Date().toTimeString().slice(0, 5) })}
            style={{ width: "100%", marginTop: 10, background: COL.tinta, color: COL.papel, border: "none",
              borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <RefreshCw size={16} /> Sincronizar ahora
            {sync.ultima && <span style={{ fontSize: 11, opacity: 0.7 }}>(última {sync.ultima})</span>}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Piezas compartidas
// ============================================================
function Seccion({ titulo, bloqueado, onDesbloquear, children }) {
  return (
    <div style={{ background: COL.crema, borderRadius: 16, padding: 14, marginBottom: 12, boxShadow: `0 2px 0 ${COL.sombra}`,
      position: "relative", overflow: "hidden" }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        {titulo} {bloqueado && <Lock size={14} color={COL.oro} />}
      </div>
      <div style={{ filter: bloqueado ? "blur(3px)" : "none", opacity: bloqueado ? 0.5 : 1, pointerEvents: bloqueado ? "none" : "auto" }}>
        {children}
      </div>
      {bloqueado && (
        <button onClick={onDesbloquear}
          style={{ position: "absolute", inset: 0, background: "rgba(251,247,239,0.55)", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>
          <span style={{ background: COL.tinta, color: COL.papel, borderRadius: 12, padding: "9px 14px", fontSize: 12.5,
            fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
            <Crown size={15} color={COL.oro} /> Desbloquear
          </span>
        </button>
      )}
    </div>
  );
}

function Promo({ icono: Icono, titulo, texto, accion }) {
  return (
    <div style={{ padding: "50px 26px", textAlign: "center" }}>
      <div style={{ width: 66, height: 66, borderRadius: 22, background: COL.tinta, display: "flex", alignItems: "center",
        justifyContent: "center", margin: "0 auto 14px" }}>
        <Icono size={32} color={COL.papel} />
      </div>
      <div style={{ fontSize: 19, fontWeight: 800 }}>{titulo}</div>
      <div style={{ fontSize: 14, color: COL.kraft, fontWeight: 600, marginTop: 8, lineHeight: 1.45 }}>{texto}</div>
      <button onClick={accion} style={{ marginTop: 18, background: COL.billete, color: "#fff", border: "none",
        borderRadius: 14, padding: "14px 26px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
        display: "inline-flex", alignItems: "center", gap: 8, boxShadow: `0 3px 0 ${COL.billeteD}` }}>
        <Crown size={18} /> Ver planes
      </button>
    </div>
  );
}

function MiniPromo({ texto, onClick }) {
  return (
    <button onClick={onClick} style={{ width: "100%", marginTop: 6, background: "transparent", border: `2px dashed ${COL.oro}`,
      borderRadius: 14, padding: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left", display: "flex",
      alignItems: "center", gap: 10, color: COL.tinta }}>
      <Crown size={18} color={COL.oro} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.35 }}>{texto}</span>
    </button>
  );
}

function Vacio({ texto, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "50px 20px", color: COL.kraft }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: COL.tinta }}>{texto}</div>
      <div style={{ fontSize: 13, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function Overlay({ children, onCancel }) {
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(32,20,10,0.5)", zIndex: 40,
      display: "flex", alignItems: "flex-end", justifyContent: "center", maxWidth: ANCHO_MAX, margin: "0 auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: COL.crema, width: "100%",
        borderRadius: "24px 24px 0 0", padding: "20px 18px calc(20px + env(safe-area-inset-bottom))",
        boxShadow: "0 -10px 40px rgba(0,0,0,0.25)", animation: "subir .22s ease-out", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, background: COL.kraft, borderRadius: 4, margin: "0 auto 16px", opacity: 0.5 }} />
        {children}
      </div>
      <style>{`@keyframes subir { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>
    </div>
  );
}


function ModalEdita({ producto, onCancel, onOk, onBorrar, nivel }) {
  const [p, setP] = useState({ ...producto });
  const [tomando, setTomando] = useState(false);
  if (tomando) return <TomarFoto onCancel={() => setTomando(false)}
    onOk={(foto) => { setP({ ...p, foto }); setTomando(false);
      bitacora.paso("inventario", "foto cambiada", { id: p.id }); }} />;
  return (
    <Overlay onCancel={onCancel}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ width: 96, height: 96, margin: "0 auto 8px" }}>
          <Mini foto={p.foto} emoji={p.emoji} radio={18} lleno />
        </div>
        <button onClick={() => setTomando(true)}
          style={{ padding: "8px 14px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit",
            border: `2px solid ${COL.kraft}`, background: "transparent", color: COL.tinta,
            fontSize: 12.5, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Wand2 size={15} color={COL.billete} /> {p.foto ? "Cambiar la foto" : "Tomarle foto"}
        </button>
        <div style={{ fontSize: 19, fontWeight: 800, marginTop: 10 }}>{comoSeLlama(p)}</div>
        {p.nombre && p.apodo && <div style={{ fontSize: 11.5, color: COL.kraft, fontWeight: 600, marginTop: 3 }}>{p.nombre}</div>}
        {p.codigo && <div style={{ fontSize: 11.5, color: COL.kraft, fontWeight: 700, marginTop: 4 }}>Código {p.codigo}</div>}
      </div>
      <label style={labelStyle}>¿Cómo le dices?</label>
      <input value={p.apodo || ""} onChange={(e) => setP({ ...p, apodo: e.target.value })}
        placeholder="base saniye" style={{ ...inputStyle, fontSize: 17, fontWeight: 700 }} />
      <div style={{ display: "flex", gap: 10, marginTop: 11 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Precio</label>
          <input inputMode="decimal" value={p.precio} onChange={(e) => setP({ ...p, precio: parseFloat(e.target.value.replace(/[^\d.]/g, "")) || 0 })} style={inputStyle} />
        </div>
        {!tieneVariantes(p) && (
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Existencia</label>
            <input inputMode="numeric" value={p.stock || 0} onChange={(e) => setP({ ...p, stock: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) })} style={inputStyle} />
          </div>
        )}
      </div>

      {tieneVariantes(p) && (
        <div style={{ marginTop: 13 }}>
          <label style={labelStyle}>Existencia por color</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 7 }}>
            {p.variantes.map((v) => (
              <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <Mini foto={v.foto} emoji={p.emoji} tam={34} radio={9} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{v.etiqueta}</span>
                <input inputMode="numeric" value={v.stock || 0}
                  onChange={(e) => setP({ ...p, variantes: p.variantes.map((x) => x.id === v.id
                    ? { ...x, stock: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) } : x) })}
                  style={{ ...inputStyle, marginTop: 0, width: 70, padding: 10, fontSize: 15, fontWeight: 800, textAlign: "center" }} />
              </div>
            ))}
          </div>
        </div>
      )}
      {puede(nivel, "minimos") && (
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Avísame cuando queden</label>
          <input inputMode="numeric" value={p.minimo || 0} onChange={(e) => setP({ ...p, minimo: parseInt(e.target.value.replace(/\D/g, "") || "0", 10) })} style={inputStyle} />
        </div>
      )}
      <button onClick={() => onOk(p)} style={{ width: "100%", marginTop: 16, padding: 16, fontSize: 17, fontWeight: 800,
        background: COL.billete, color: "#fff", border: "none", borderRadius: 14, cursor: "pointer", fontFamily: "inherit" }}>
        Guardar cambios
      </button>
      <button onClick={() => onBorrar(p.id)} style={{ width: "100%", marginTop: 8, padding: 13, fontSize: 14, fontWeight: 700,
        background: "transparent", color: COL.chile, border: `1.5px solid ${COL.chile}`, borderRadius: 12, cursor: "pointer",
        fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Trash2 size={16} /> Quitar del inventario
      </button>
    </Overlay>
  );
}

// Escoger variante SE VE, no se lee: cuál de los tres pupilentes, qué tono de base.
// Por eso es una cuadrícula de fotos y no una lista de botones con texto.
function ModalVariante({ producto, onCancel, onOk }) {
  const [sel, setSel] = useState(null);
  return (
    <Overlay onCancel={onCancel}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 19, fontWeight: 800 }}>{comoSeLlama(producto)}</div>
        <div style={{ fontSize: 13, color: COL.billete, fontWeight: 800 }}>{money(producto.precio)}</div>
        <div style={{ fontSize: 12, color: COL.kraft, fontWeight: 700, marginTop: 2 }}>¿Cuál se lleva?</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
        {producto.variantes.map((v) => {
          const agotada = (v.stock || 0) === 0;
          const activa = sel?.id === v.id;
          return (
            <button key={v.id} onClick={() => !agotada && setSel(v)}
              style={{ padding: 0, borderRadius: 14, overflow: "hidden", cursor: agotada ? "default" : "pointer",
                border: `3px solid ${activa ? COL.billete : "transparent"}`, background: COL.papel,
                opacity: agotada ? 0.4 : 1, fontFamily: "inherit", display: "flex", flexDirection: "column" }}>
              <div style={{ width: "100%", aspectRatio: "1 / 1" }}>
                <Mini foto={v.foto} emoji={producto.emoji} radio={0} lleno />
              </div>
              <div style={{ padding: "5px 3px 6px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.15, color: COL.tinta }}>{v.etiqueta}</div>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: agotada ? COL.chile : COL.kraft }}>
                  {agotada ? "Agotado" : `quedan ${v.stock}`}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button onClick={() => sel && onOk(sel)} disabled={!sel}
        style={{ width: "100%", marginTop: 14, padding: 16, fontSize: 17, fontWeight: 800,
          background: sel ? COL.billete : COL.kraft, color: "#fff", border: "none", borderRadius: 14,
          cursor: sel ? "pointer" : "default", fontFamily: "inherit", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8 }}>
        <Check size={20} /> {sel ? `Agregar ${sel.etiqueta}` : "Toca cuál es"}
      </button>
    </Overlay>
  );
}

// Mismo teclado que el de venta por peso: un solo patrón para teclear números.
function ModalRapido({ onCancel, onOk }) {
  const [val, setVal] = useState("");
  const importe = parseFloat(val || "0");
  const tecla = (t) => {
    if (t === "←") return setVal((v) => v.slice(0, -1));
    if (t === "." && val.includes(".")) return;
    setVal((v) => (v + t).slice(0, 8));
  };
  return (
    <Overlay onCancel={onCancel}>
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 19, fontWeight: 800 }}>Cobro rápido</div>
        <div style={{ fontSize: 12.5, color: COL.kraft, fontWeight: 600, marginTop: 2 }}>
          Para lo que todavía no está capturado
        </div>
      </div>
      <div style={{ background: COL.papel, borderRadius: 14, padding: "18px 14px", textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: -1 }}>{money(importe)}</div>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {[10, 20, 50, 100].map((v) => (
          <button key={v} onClick={() => setVal(String(v))}
            style={{ flex: 1, padding: 11, fontSize: 14, fontWeight: 800, background: COL.papel,
              border: `1.5px solid ${COL.kraft}`, borderRadius: 11, cursor: "pointer",
              color: COL.tinta, fontFamily: "inherit" }}>{money(v)}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {["1","2","3","4","5","6","7","8","9",".","0","←"].map((t) => (
          <button key={t} onClick={() => tecla(t)} style={{ padding: "16px 0", fontSize: 22, fontWeight: 800,
            background: COL.papel, border: `1.5px solid ${COL.kraft}`, borderRadius: 12, cursor: "pointer",
            color: COL.tinta, fontFamily: "inherit" }}>{t}</button>
        ))}
      </div>
      <button onClick={() => importe > 0 && onOk(importe)} disabled={importe <= 0}
        style={{ width: "100%", marginTop: 12, padding: 16, fontSize: 17, fontWeight: 800,
          background: importe > 0 ? COL.billete : COL.kraft, color: "#fff", border: "none", borderRadius: 14,
          cursor: importe > 0 ? "pointer" : "default", fontFamily: "inherit" }}>
        Agregar a la venta
      </button>
    </Overlay>
  );
}

function ModalPeso({ producto, onCancel, onOk }) {
  const [val, setVal] = useState("");
  const kg = parseFloat(val || "0");
  const tecla = (t) => {
    if (t === "←") return setVal((v) => v.slice(0, -1));
    if (t === "." && val.includes(".")) return;
    setVal((v) => (v + t).slice(0, 6));
  };
  return (
    <Overlay onCancel={onCancel}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 32 }}>{producto.emoji}</div>
        <div style={{ fontSize: 19, fontWeight: 800 }}>{comoSeLlama(producto)}</div>
        <div style={{ fontSize: 13, color: COL.kraft, fontWeight: 700 }}>{money(producto.precio)} por kilo</div>
      </div>
      <div style={{ background: COL.papel, borderRadius: 14, padding: 14, textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 38, fontWeight: 800 }}>{val || "0"} <span style={{ fontSize: 18, color: COL.kraft }}>kg</span></div>
        <div style={{ fontSize: 16, color: COL.billete, fontWeight: 800 }}>= {money(kg * producto.precio)}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {["1","2","3","4","5","6","7","8","9",".","0","←"].map((t) => (
          <button key={t} onClick={() => tecla(t)} style={{ padding: "15px 0", fontSize: 22, fontWeight: 800,
            background: COL.papel, border: `1.5px solid ${COL.kraft}`, borderRadius: 12, cursor: "pointer",
            color: COL.tinta, fontFamily: "inherit" }}>{t}</button>
        ))}
      </div>
      <button onClick={() => kg > 0 && onOk(kg)} disabled={kg <= 0}
        style={{ width: "100%", marginTop: 12, padding: 16, fontSize: 17, fontWeight: 800,
          background: kg > 0 ? COL.billete : COL.kraft, color: "#fff", border: "none", borderRadius: 14,
          cursor: kg > 0 ? "pointer" : "default", fontFamily: "inherit" }}>Agregar</button>
    </Overlay>
  );
}

function ModalCobrar({ total, onCancel, onOk, nivel, gate, clientes, setClientes, cobro }) {
  const [pago, setPago] = useState("");
  const [forma, setForma] = useState("efectivo");
  const [desc, setDesc] = useState(0);
  const [cliente, setCliente] = useState(null);
  const [abono, setAbono] = useState("");      // lo que deja hoy en fiado o apartado
  const [nuevoCli, setNuevoCli] = useState(false);
  const [nombreCli, setNombreCli] = useState("");
  const [telCli, setTelCli] = useState("");

  const totalFinal = total * (1 - desc / 100);
  const recibido = parseFloat(pago || "0");
  const cambio = recibido - totalFinal;
  const rapidos = [totalFinal, Math.ceil(totalFinal / 50) * 50, Math.ceil(totalFinal / 100) * 100, Math.ceil(totalFinal / 500) * 500]
    .filter((v, i, a) => a.indexOf(v) === i);

  const FORMAS = [
    { id: "efectivo", nombre: "Efectivo", icono: Banknote, fn: null },
    { id: "tarjeta", nombre: "Tarjeta", icono: CreditCard, fn: "multipago" },
    { id: "transferencia", nombre: "Transfer", icono: Smartphone, fn: "multipago" },
    { id: "fiado", nombre: "Fiado", icono: Users, fn: "fiado" },
    { id: "apartado", nombre: "Apartado", icono: Archive, fn: "apartado" },
  ];

  const aCuenta = forma === "fiado" || forma === "apartado";
  const listo = aCuenta ? !!cliente : forma !== "efectivo" || recibido >= totalFinal;

  return (
    <Overlay onCancel={onCancel}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: COL.kraft }}>A cobrar</div>
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>{money(totalFinal)}</div>
        {desc > 0 && <div style={{ fontSize: 12, color: COL.chile, fontWeight: 700 }}>{desc}% de descuento sobre {money(total)}</div>}
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
        {FORMAS.map((f) => {
          const bloqueada = f.fn && !puede(nivel, f.fn);
          const activo = forma === f.id;
          return (
            <button key={f.id} onClick={() => { if (bloqueada) return gate(f.fn); setForma(f.id); }}
              style={{ flex: 1, minWidth: 82, padding: "10px 4px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                border: `2px solid ${activo ? COL.billete : COL.kraft}`, background: activo ? "#E4F0E8" : COL.papel,
                color: bloqueada ? "#C9BBA8" : activo ? COL.billete : COL.tinta, display: "flex", flexDirection: "column",
                alignItems: "center", gap: 3, position: "relative" }}>
              <f.icono size={17} />
              <span style={{ fontSize: 10.5, fontWeight: 700 }}>{f.nombre}</span>
              {bloqueada && <Lock size={10} color={COL.oro} style={{ position: "absolute", top: 4, right: 5 }} />}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
        <Percent size={15} color={puede(nivel, "descuento") ? COL.kraft : "#D9CBB8"} />
        {[0, 5, 10, 15].map((d) => (
          <button key={d} onClick={() => { if (!puede(nivel, "descuento")) return gate("descuento"); setDesc(d); }}
            style={{ flex: 1, padding: "8px 0", fontSize: 12.5, fontWeight: 800, borderRadius: 10, cursor: "pointer",
              fontFamily: "inherit", border: `1.5px solid ${desc === d ? COL.billete : COL.kraft}`,
              background: desc === d ? "#E4F0E8" : COL.papel,
              color: !puede(nivel, "descuento") ? "#C9BBA8" : desc === d ? COL.billete : COL.tinta }}>
            {d === 0 ? "Sin desc." : `${d}%`}
          </button>
        ))}
      </div>

      {aCuenta ? (
        <div style={{ marginTop: 14 }}>
          <div style={{ background: forma === "apartado" ? "#FFF3D6" : "#F7E4E0", borderRadius: 11,
            padding: "9px 11px", fontSize: 11.5, fontWeight: 700, lineHeight: 1.4, marginBottom: 11,
            color: forma === "apartado" ? COL.oro : COL.chile }}>
            {forma === "apartado"
              ? "Se la guardas hasta que termine de pagar. La mercancía no sale del inventario, pero queda apartada."
              : "Se lleva la mercancía hoy. Sale del inventario y queda a deberte."}
          </div>

          <label style={labelStyle}>{forma === "apartado" ? "¿Para quién la apartas?" : "¿Quién se lo lleva?"}</label>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 6 }}>
            {clientes.map((c) => (
              <button key={c.id} onClick={() => setCliente(c)}
                style={{ padding: "10px 14px", borderRadius: 11, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                  border: `2px solid ${cliente?.id === c.id ? COL.billete : COL.kraft}`,
                  background: cliente?.id === c.id ? "#E4F0E8" : COL.papel,
                  color: cliente?.id === c.id ? COL.billete : COL.tinta }}>{c.nombre}</button>
            ))}
            <button onClick={() => setNuevoCli(true)}
              style={{ padding: "10px 14px", borderRadius: 11, cursor: "pointer", fontSize: 14, fontWeight: 800,
                fontFamily: "inherit", border: `2px dashed ${COL.kraft}`, background: "transparent",
                color: COL.kraft, display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={16} /> Alguien nuevo
            </button>
          </div>

          {nuevoCli && (
            <div style={{ marginTop: 11, background: COL.papel, borderRadius: 12, padding: 12 }}>
              <label style={labelStyle}>¿Cómo se llama?</label>
              <input value={nombreCli} autoFocus onChange={(e) => setNombreCli(e.target.value)}
                placeholder="Nombre o apodo" style={inputStyle} />
              <div style={{ marginTop: 9 }}>
                <label style={labelStyle}>Teléfono, por si hay que recordarle</label>
                <input inputMode="tel" value={telCli} placeholder="10 dígitos, opcional"
                  onChange={(e) => setTelCli(e.target.value.replace(/\D/g, "").slice(0, 10))} style={inputStyle} />
              </div>
              <button onClick={() => {
                  const n = nombreCli.trim(); if (!n) return;
                  const c = nuevo("cliente", { id: Date.now(), nombre: n, tel: telCli || "" });
                  setClientes((cs) => [...cs, c]); setCliente(c);
                  setNuevoCli(false); setNombreCli(""); setTelCli("");
                }}
                disabled={!nombreCli.trim()}
                style={{ width: "100%", marginTop: 11, padding: 13, borderRadius: 12, border: "none",
                  background: nombreCli.trim() ? COL.billete : COL.kraft, color: "#fff", fontSize: 14,
                  fontWeight: 800, cursor: nombreCli.trim() ? "pointer" : "default", fontFamily: "inherit" }}>
                Guardar y escogerlo
              </button>
            </div>
          )}

          <div style={{ marginTop: 13 }}>
            <label style={labelStyle}>¿Deja algo hoy?</label>
            <input inputMode="decimal" value={abono} placeholder="0.00"
              onChange={(e) => setAbono(e.target.value.replace(/[^\d.]/g, ""))}
              style={{ ...inputStyle, fontSize: 22, fontWeight: 800, textAlign: "center" }} />
            <div style={{ fontSize: 11.5, color: COL.kraft, fontWeight: 700, marginTop: 6 }}>
              {`Quedaría debiendo ${money(Math.max(0, totalFinal - (parseFloat(abono) || 0)))}`}
            </div>
          </div>
        </div>
      ) : forma === "efectivo" ? (
        <>
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>¿Con cuánto paga?</label>
            <input value={pago} onChange={(e) => setPago(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0.00" inputMode="decimal" autoFocus
              style={{ ...inputStyle, fontSize: 24, fontWeight: 800, textAlign: "center", padding: 14 }} />
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {rapidos.map((v) => (
              <button key={v} onClick={() => setPago(String(v))} style={{ flex: 1, minWidth: 70, padding: 10, fontSize: 14,
                fontWeight: 800, background: COL.papel, border: `1.5px solid ${COL.kraft}`, borderRadius: 10,
                cursor: "pointer", color: COL.tinta, fontFamily: "inherit" }}>{money(v)}</button>
            ))}
          </div>
          {recibido > 0 && (
            <div style={{ marginTop: 14, padding: 14, borderRadius: 12, textAlign: "center", background: cambio >= 0 ? "#E4F0E8" : "#F7E4E0" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: cambio >= 0 ? COL.billete : COL.chile }}>
                {cambio >= 0 ? "Cambio" : "Falta"}
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: cambio >= 0 ? COL.billete : COL.chile }}>{money(Math.abs(cambio))}</div>
            </div>
          )}
        </>
      ) : forma === "transferencia" ? (
        <div style={{ marginTop: 14 }}>
          {cobro?.clabe ? (
            <div style={{ background: COL.papel, borderRadius: 14, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: COL.kraft, marginBottom: 9 }}>
                Que te deposite aquí
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                <QR texto={textoCobro(cobro)} tam={170} />
              </div>
              {cobro.titular && <div style={{ fontSize: 14, fontWeight: 800 }}>{cobro.titular}</div>}
              {cobro.banco && <div style={{ fontSize: 12.5, color: COL.kraft, fontWeight: 700 }}>{cobro.banco}</div>}
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: 1, marginTop: 6, wordBreak: "break-all" }}>
                {cobro.clabe}
              </div>
              <button onClick={() => { try { navigator.clipboard.writeText(cobro.clabe); } catch (e) {} }}
                style={{ marginTop: 10, padding: "9px 15px", borderRadius: 11, cursor: "pointer",
                  fontFamily: "inherit", border: "none", background: COL.tinta, color: COL.papel,
                  fontSize: 12.5, fontWeight: 800 }}>Copiar la clave</button>
            </div>
          ) : (
            <div style={{ background: "#FFF3D6", border: `1.5px solid ${COL.oro}`, borderRadius: 12,
              padding: 14, fontSize: 13, fontWeight: 700, lineHeight: 1.45, color: COL.tinta }}>
              Todavía no pones a dónde te depositan. Ve a la pestaña Caja y captura tu nombre, banco y clave;
              desde entonces aparece aquí con su código para que el cliente lo escanee.
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 14, padding: 16, borderRadius: 12, background: COL.papel, textAlign: "center",
          fontSize: 13.5, color: COL.kraft, fontWeight: 700 }}>
          Cobra en la terminal y confirma aquí cuando el pago pase.
        </div>
      )}

      <button onClick={() => listo && onOk({ total: totalFinal, forma, descuento: desc,
        clienteId: cliente?.id, telCliente: cliente?.tel || "",
        abonoInicial: aCuenta ? (parseFloat(abono) || 0) : 0,
        recibido, cambio: Math.max(0, cambio) })}
        disabled={!listo}
        style={{ width: "100%", marginTop: 16, padding: 17, fontSize: 18, fontWeight: 800,
          background: listo ? COL.billete : COL.kraft, color: "#fff", border: "none", borderRadius: 14,
          cursor: listo ? "pointer" : "default", fontFamily: "inherit", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8 }}>
        <Check size={20} /> {forma === "apartado" ? "Apartar la mercancía"
          : forma === "fiado" ? "Anotar en su cuenta" : "Listo, vendido"}
      </button>
    </Overlay>
  );
}

function ModalCorte({ datos, onClose }) {
  return (
    <Overlay onCancel={onClose}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <Wallet size={30} color={COL.billete} />
        <div style={{ fontSize: 19, fontWeight: 800, marginTop: 6 }}>Corte del día</div>
      </div>
      <Fila etiqueta="Ventas" valor={datos.ventas} />
      <Fila etiqueta="Total vendido" valor={money(datos.total)} />
      <Fila etiqueta="Debe haber en caja" valor={money(datos.efectivo)} fuerte />
      <div style={{ fontSize: 12.5, color: COL.kraft, fontWeight: 600, marginTop: 12, lineHeight: 1.4 }}>
        Cuenta el efectivo y compara. Si sobra o falta, queda registrado en el turno.
      </div>
      <button onClick={onClose} style={{ width: "100%", marginTop: 16, padding: 16, fontSize: 16, fontWeight: 800,
        background: COL.billete, color: "#fff", border: "none", borderRadius: 14, cursor: "pointer", fontFamily: "inherit" }}>
        Cerrar el día
      </button>
    </Overlay>
  );
}

function Fila({ etiqueta, valor, fuerte }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "9px 0",
      borderBottom: `1px solid ${COL.papel}` }}>
      <span style={{ fontSize: 13.5, color: COL.kraft, fontWeight: 700 }}>{etiqueta}</span>
      <span style={{ fontSize: fuerte ? 22 : 15, fontWeight: 800, color: fuerte ? COL.billete : COL.tinta }}>{valor}</span>
    </div>
  );
}

function ModalCandado({ fn, onClose, onSubir }) {
  const necesario = plan(FUNCIONES[fn].min);
  return (
    <Overlay onCancel={onClose}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: 20, background: COL.tinta, display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 12px" }}>
          <Lock size={28} color={COL.oro} />
        </div>
        <div style={{ fontSize: 19, fontWeight: 800 }}>{FUNCIONES[fn].nombre}</div>
        <div style={{ fontSize: 14, color: COL.kraft, fontWeight: 600, marginTop: 8, lineHeight: 1.45 }}>
          Esta función viene desde el plan <strong style={{ color: COL.tinta }}>{necesario.nombre}</strong> (nivel {necesario.id}),
          por {necesario.precio === 0 ? "gratis" : `${money(necesario.precio)} al mes`}.
        </div>
      </div>
      <button onClick={onSubir} style={{ width: "100%", marginTop: 18, padding: 16, fontSize: 16, fontWeight: 800,
        background: COL.billete, color: "#fff", border: "none", borderRadius: 14, cursor: "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Crown size={19} /> Ver planes
      </button>
      <button onClick={onClose} style={{ width: "100%", marginTop: 8, padding: 13, fontSize: 14, fontWeight: 700,
        background: "transparent", color: COL.kraft, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
        Ahora no
      </button>
    </Overlay>
  );
}

// Lo que ve el cliente al final. Por omisión se cierra solo para no estorbar
// en una venta rápida; en cuanto tocas "Ver el ticket" se queda abierto y
// puedes enseñarle el código para que lo escanee o mandárselo por WhatsApp.
function VentaHecha({ venta, onClose, onTel }) {
  const [verTicket, setVerTicket] = useState(false);
  const texto = textoTicket(venta);

  useEffect(() => {
    if (verTicket) return;                   // si lo abrió, ya no se cierra solo
    const t = setTimeout(onClose, 2200);
    return () => clearTimeout(t);
  }, [verTicket]);

  const titulo = venta.forma === "apartado" ? "¡Apartado!"
    : venta.forma === "fiado" ? "¡Anotado!" : "¡Vendido!";

  return (
    <div onClick={() => !verTicket && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(32,20,10,0.55)", zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: COL.crema, borderRadius: 24,
        padding: "26px 22px", textAlign: "center", width: "100%", maxWidth: 360,
        maxHeight: "92vh", overflowY: "auto" }}>

        <div style={{ width: 60, height: 60, borderRadius: "50%", background: COL.billete, display: "flex",
          alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
          <Check size={36} color="#fff" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{titulo}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: COL.billete, marginTop: 2 }}>{money(venta.total)}</div>

        {!verTicket ? (
          <button onClick={() => setVerTicket(true)}
            style={{ width: "100%", marginTop: 16, padding: 13, borderRadius: 13, cursor: "pointer",
              fontFamily: "inherit", border: `2px solid ${COL.kraft}`, background: "transparent",
              color: COL.tinta, fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8 }}>
            <ScanLine size={18} /> Ver el ticket
          </button>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "center", margin: "16px 0 10px" }}>
              <QR texto={texto} tam={200} />
            </div>
            <div style={{ fontSize: 11.5, color: COL.kraft, fontWeight: 700, lineHeight: 1.4 }}>
              Que lo escanee con la cámara de su teléfono. No necesita la app ni internet.
            </div>

            <div style={{ background: COL.papel, borderRadius: 12, padding: 12, marginTop: 12,
              textAlign: "left", fontSize: 11.5, fontWeight: 600, whiteSpace: "pre-wrap",
              fontFamily: "ui-monospace, Consolas, monospace", lineHeight: 1.45 }}>
              {texto}
            </div>

            <MandarWhatsApp texto={texto} tel={venta.telCliente} onTel={onTel} />
          </>
        )}

        <button onClick={onClose}
          style={{ width: "100%", marginTop: 9, padding: 12, borderRadius: 13, cursor: "pointer",
            fontFamily: "inherit", border: "none", background: "transparent", color: COL.kraft,
            fontSize: 14, fontWeight: 800 }}>Listo</button>
      </div>
    </div>
  );
}
