// Simulación de punta a punta: recorre los flujos como si fuera el usuario.
const React = require("react");
const TR = require("react-test-renderer");
const { act } = TR;

global.IS_REACT_ACT_ENVIRONMENT = true;
global.window = global;
global.navigator = { mediaDevices: { getUserMedia: async () => { throw new Error("sin camara"); } } };
global.fetch = async () => { throw new Error("sin red"); };
global.setTimeout = setTimeout;

const App = require("./todo.build.cjs").App;

const flat = (n) => { const o = []; const w = (x) => { if (!x) return; if (Array.isArray(x)) return x.forEach(w);
  if (typeof x === "object") { o.push(x); w(x.children); } }; w(n); return o; };
const txt = (n) => { let s = ""; const w = (x) => { if (x == null) return; if (typeof x === "string" || typeof x === "number") { s += x + " "; return; }
  if (Array.isArray(x)) return x.forEach(w); if (typeof x === "object") w(x.children); }; w(n); return s.replace(/\s+/g, " "); };

let fallos = 0;
const ok = (cond, msg) => { console.log((cond ? "  ok   " : "  FALLA") + "  " + msg); if (!cond) fallos++; };

async function correr() {
  let r;
  await act(async () => { r = TR.create(React.createElement(App)); });
  const json = () => r.toJSON();
  const todos = () => flat(json());
  // el más específico = el de texto más corto que contiene la frase (evita pegarle al fondo del modal)
  const porTexto = (t) => todos().filter((n) => n.props && n.props.onClick && txt(n).includes(t))
    .sort((a, b) => txt(a).length - txt(b).length);
  const tocar = async (t, i = 0) => {
    const c = porTexto(t);
    if (!c[i]) throw new Error(`no encontré botón con "${t}" (hay ${c.length})`);
    await act(async () => { c[i].props.onClick({ stopPropagation() {} }); });
  };
  const escribir = async (ph, val) => {
    const c = todos().filter((n) => n.props && n.props.placeholder === ph && n.props.onChange);
    if (!c[0]) throw new Error(`no encontré campo "${ph}"`);
    await act(async () => { c[0].props.onChange({ target: { value: val } }); });
  };
  const pantalla = () => txt(json());

  console.log("\n=== 1. Arranca en nivel 3.3, pestaña Vender ===");
  ok(pantalla().includes("Vender"), "abre en Vender");
  ok(pantalla().includes("Negocio"), "muestra el plan Negocio");

  console.log("\n=== 2. Inventario -> menú de alta (nivel máximo: todo abierto) ===");
  await tocar("Inventario");
  ok(pantalla().includes("Agregar productos"), "botón Agregar productos");
  await tocar("Agregar productos");
  const menu = pantalla();
  ["Escanear el código", "Un producto", "Un grupo con colores", "El mostrador completo", "A mano"]
    .forEach((c) => ok(menu.includes(c), `camino visible: ${c}`));
  ok(!menu.includes("Desde el plan"), "en 3.3 ningún camino sale bloqueado");

  console.log("\n=== 3. Camino a mano -> cinta -> guardar ===");
  await tocar("A mano");
  ok(pantalla().includes("Ponles precio"), "llega a la cinta");
  ok(pantalla().includes("Sin apodo todavía"), "trae una fila vacía");
  await escribir("base saniye", "chicles");
  await escribir("0.00", "15");
  ok(pantalla().includes("$15.00"), "el precio se refleja en el renglón");
  await tocar("Guardar 1 producto");
  ok(pantalla().includes("chicles"), "el producto quedó en el inventario");
  ok(pantalla().includes("13 /"), "el contador subió de 12 a 13");

  console.log("\n=== 4. Escáner sin cámara ni BarcodeDetector: no debe romper ===");
  await tocar("Agregar productos");
  await tocar("Escanear el código");
  ok(pantalla().includes("No pude abrir la cámara"), "avisa que no hay cámara, sin tronar");
  ok(pantalla().includes("o teclea el código"), "ofrece teclear el código");
  await escribir("o teclea el código", "6942356709876");
  await tocar("Buscar");
  ok(pantalla().includes("sombras 18"), "el código trajo el apodo del catálogo compartido");
  await tocar("Ponerles precio");
  ok(pantalla().includes("Ponles precio"), "pasa a la cinta con lo escaneado");
  ok(pantalla().includes("6942356709876"), "la cinta conserva el código");

  console.log("\n=== 5. Código de un producto que ya tengo: suma existencia, no duplica ===");
  await escribir("0.00", "18");
  await tocar("Guardar 1 producto");
  ok(pantalla().includes("sombras 18"), "quedó dado de alta");
  await tocar("Agregar productos");
  await tocar("Escanear el código");
  await escribir("o teclea el código", "6942356701234");
  await tocar("Buscar");
  ok(pantalla().includes("Ya lo tienes"), "reconoce la base que ya estaba en inventario");

  console.log("\n=== 6. Foto del anaquel: varios candidatos de un jalón ===");
  await act(async () => { r.unmount(); });
  await act(async () => { r = TR.create(React.createElement(App)); });
  await tocar("Inventario");
  await tocar("Agregar productos");
  await tocar("El mostrador completo");
  ok(pantalla().includes("El mostrador completo"), "abre la cámara del mostrador");
  await tocar("Tomar la foto");
  await act(async () => { await new Promise((res) => setTimeout(res, 3000)); });
  const cinta = pantalla();
  ok(cinta.includes("Ponles precio"), "la foto desemboca en la misma cinta");
  ok(cinta.includes("sombras 18") && cinta.includes("rubor rosie"), "detectó varios productos");
  ok(cinta.includes("$40.00"), "rescató el precio que sí se leía");
  ok(cinta.includes("no alcancé a identificar"), "admite todo lo que no pudo ver");

  console.log("\n=== 7. Baja a nivel 1.1: la alta se debe cerrar sola ===");
  await tocar("Plan");
  await tocar("Local");
  await tocar("Puesto nivel 1.1");
  ok(pantalla().includes("nivel 1.1"), "quedó en el plan gratis");
  await tocar("Inventario");
  await tocar("Agregar productos");
  const m11 = pantalla();
  ok(m11.includes("Escanear el código"), "escanear sigue disponible gratis");
  ok(m11.includes("Desde el plan Control"), "la foto del producto pide plan Control");
  ok(m11.includes("Desde el plan Nube"), "la foto de anaquel pide plan Nube");
  ok(m11.includes("Desde el plan Nube"), "la foto del montón pide plan Nube");

  console.log("\n=== 8. Candado: tocar una función bloqueada explica el plan ===");
  await tocar("El mostrador completo");
  ok(pantalla().includes("Foto del mostrador completo"), "abre el modal del candado");
  ok(pantalla().includes("$349.00 al mes"), "dice el precio del plan que la abre");
  await tocar("Ver planes");
  ok(pantalla().includes("Tu plan"), "el botón lleva a la pantalla de planes");

  console.log("\n=== 9. Tope de productos del plan gratis ===");
  await tocar("Inventario");
  ok(pantalla().includes("12 / 30"), "el tope de 30 del plan Puesto se muestra");

  console.log("\n=== 10. Venta completa en nivel 1.1 (efectivo) ===");
  await tocar("Vender");
  await tocar("Accesorios");
  await tocar("pestañas");
  ok(pantalla().includes("Cobrar"), "el carrito aparece con botón Cobrar");
  await tocar("Cobrar");
  ok(pantalla().includes("A cobrar"), "abre el modal de cobro");
  await escribir("0.00", "20");
  ok(pantalla().includes("Cambio"), "calcula el cambio");
  await tocar("Listo, vendido");
  ok(pantalla().includes("¡Vendido!"), "confirma la venta");

  console.log("\n=== 11. Sin mayúsculas sostenidas en pantalla ===");
  await act(async () => { await new Promise((res) => setTimeout(res, 1900)); });
  await tocar("Reportes");
  const caps = (pantalla().match(/\b[A-ZÁÉÍÓÚÑ]{4,}\b/g) || []).filter((w) => w !== "CFDI");
  ok(caps.length === 0, "ningún texto en mayúsculas sostenidas" + (caps.length ? ` (${caps.join(", ")})` : ""));

  console.log(`\n${fallos === 0 ? "TODO PASÓ" : fallos + " FALLAS"}\n`);
  process.exit(fallos ? 1 : 0);
}

correr().catch((e) => { console.error("\nREVENTÓ:", e.message, "\n", e.stack); process.exit(1); });
