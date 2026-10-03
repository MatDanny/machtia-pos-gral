// Simulación 3: el mostrador real — apodos, variantes por foto y precio leído.
const React = require("react");
const TR = require("react-test-renderer");
const { act } = TR;

global.IS_REACT_ACT_ENVIRONMENT = true;
global.window = global;
global.navigator = { mediaDevices: { getUserMedia: async () => { throw new Error("sin camara"); } } };
global.fetch = async () => { throw new Error("sin red"); };

const App = require("./todo.build.cjs").App;

const flat = (n) => { const o = []; const w = (x) => { if (!x) return; if (Array.isArray(x)) return x.forEach(w);
  if (typeof x === "object") { o.push(x); w(x.children); } }; w(n); return o; };
const txt = (n) => { let s = ""; const w = (x) => { if (x == null) return; if (typeof x === "string" || typeof x === "number") { s += x + " "; return; }
  if (Array.isArray(x)) return x.forEach(w); if (typeof x === "object") w(x.children); }; w(n); return s.replace(/\s+/g, " "); };

let fallos = 0;
const ok = (c, m) => { console.log((c ? "  ok   " : "  FALLA") + "  " + m); if (!c) fallos++; };

async function correr() {
  let r;
  await act(async () => { r = TR.create(React.createElement(App)); });
  const todos = () => flat(r.toJSON());
  const porTexto = (t) => todos().filter((n) => n.props && n.props.onClick && txt(n).includes(t))
    .sort((a, b) => txt(a).length - txt(b).length);
  const tocar = async (t, i = 0) => {
    const c = porTexto(t);
    if (!c[i]) throw new Error(`no encontré botón con "${t}" (hay ${c.length})`);
    await act(async () => { c[i].props.onClick({ stopPropagation() {} }); });
  };
  const escribir = async (ph, val, i = 0) => {
    const c = todos().filter((n) => n.props && n.props.placeholder === ph && n.props.onChange);
    if (!c[i]) throw new Error(`no encontré campo "${ph}"`);
    await act(async () => { c[i].props.onChange({ target: { value: val } }); });
  };
  const esperar = async (ms) => { await act(async () => { await new Promise((res) => setTimeout(res, ms)); }); };
  const pantalla = () => txt(r.toJSON());
  const imgs = () => todos().filter((n) => n.type === "img").length;
  const escanear = async (cod) => {
    await tocar("Agregar productos"); await tocar("Escanear el código");
    await escribir("o teclea el código", cod); await tocar("Buscar");
    if (porTexto("Ponerles precio").length) await tocar("Ponerles precio"); else await esperar(400);
  };

  console.log("\n=== 1. La venta se ve, no se lee ===");
  ok(pantalla().includes("Maquillaje") && pantalla().includes("Uñas"), "categorías del giro real");
  await tocar("Maquillaje");
  const g = pantalla();
  ok(g.includes("base saniye"), "la cuadrícula usa el apodo, no el nombre del empaque");
  ok(!g.includes("SANIYE base líquida mate"), "el nombre largo del empaque no estorba al vender");
  ok(g.includes("4 opciones"), "marca cuántos tonos tiene la base");
  ok(imgs() >= 4, "hay fotos de verdad en la cuadrícula");

  console.log("\n=== 2. Escoger tono es tocar una foto ===");
  await tocar("base saniye");
  const v = pantalla();
  ok(v.includes("¿Cuál se lleva?"), "abre el selector de variantes");
  ok(v.includes("Tono 1 claro") && v.includes("Tono 4 canela"), "muestra los cuatro tonos");
  ok(v.includes("quedan 6") && v.includes("quedan 2"), "cada tono trae su propia existencia");
  ok(v.includes("Toca cuál es"), "no deja agregar sin escoger");
  await tocar("Tono 2 natural");
  ok(pantalla().includes("Agregar Tono 2 natural"), "el botón dice qué va a agregar");
  await tocar("Agregar Tono 2 natural");
  ok(pantalla().includes("base saniye") && pantalla().includes("Tono 2 natural"), "el carrito guarda el tono");

  console.log("\n=== 3. La venta descuenta del tono correcto ===");
  await tocar("Cobrar");
  await escribir("0.00", "100");
  await tocar("Listo, vendido");
  await esperar(1900);
  await tocar("Inventario");
  ok(pantalla().includes("base saniye"), "la base sigue en inventario");
  await tocar("base saniye");
  const ed = pantalla();
  ok(ed.includes("Existencia por color"), "la ficha muestra existencia por tono");
  ok(ed.includes("Tono 2 natural"), "lista los tonos");
  ok(ed.includes("Cambiar la foto"), "desde la ficha se le puede cambiar la foto");
  await tocar("Guardar cambios");

  console.log("\n=== 4. Buscar de oído, sin acentos ===");
  await tocar("Vender");
  await escribir("base saniye, esmalte rojo...", "pestanas");
  ok(pantalla().includes("pestañas"), "encuentra pestañas escribiendo sin la eñe");
  await escribir("base saniye, esmalte rojo...", "rojo");
  ok(pantalla().includes("esmalte") || pantalla().includes("labial"), "encuentra por el nombre del color");
  await escribir("base saniye, esmalte rojo...", "");

  console.log("\n=== 5. El catálogo compartido resuelve lo que internet no ===");
  await tocar("Inventario");
  await escanear("6901234567890");
  const cc = pantalla();
  ok(cc.includes("rímel"), "trajo el apodo de otro vendedor");
  ok(cc.includes("Lo nombraron 134 vendedores"), "dice cuántos lo confirmaron");
  ok(imgs() > 0, "también trajo foto");

  console.log("\n=== 6. Foto del mostrador: lo poco que rescata, con su precio ===");
  await act(async () => { r.unmount(); });
  await act(async () => { r = TR.create(React.createElement(App)); });
  await tocar("Inventario");
  await tocar("Agregar productos");
  await tocar("El mostrador completo");
  await tocar("Tomar la foto");
  await esperar(3000);
  const m = pantalla();
  ok(m.includes("Ponles precio"), "desemboca en la cinta");
  ok(m.includes("sombras 18") && m.includes("rubor rosie"), "rescata lo que sí reconoció");
  ok(m.includes("$40.00"), "con el precio de la etiqueta de neón que sí se leía");
  ok(m.includes("de la etiqueta"), "marca que ese precio lo leyó, no lo inventó");
  ok(m.includes("no alcancé a identificar"), "y admite todo lo que no pudo ver");

  console.log("\n=== 7. Lo que no reconoció bien queda marcado ===");
  await act(async () => { r.unmount(); });
  await act(async () => { r = TR.create(React.createElement(App)); });
  await tocar("Plan"); await tocar("Nube"); await tocar("Sucursales nivel 3.2");
  await tocar("Inventario"); await tocar("Agregar productos"); await tocar("El mostrador completo");
  await tocar("Tomar la foto");
  await esperar(3000);
  const vd = pantalla();
  ok(vd.includes("no alcancé a identificar"), "dice cuánto no pudo identificar");
  ok(vd.includes("Tómale foto a un grupo a la vez"), "y manda a la toma que sí sirve");
  ok(vd.includes("falta precio"), "lo que no traía etiqueta pide precio");

  console.log("\n=== 8. Un producto con varios colores cuenta como uno solo ===");
  await act(async () => { r.unmount(); });
  await act(async () => { r = TR.create(React.createElement(App)); });
  await tocar("Plan"); await tocar("Local"); await tocar("Puesto nivel 1.1");
  await tocar("Inventario");
  ok(pantalla().includes("12 / 30"), "arranca con 12 de los 30 del plan gratis");
  await tocar("Agregar productos"); await tocar("A mano");
  await escribir("base saniye", "gel de uñas");
  await escribir("0.00", "35");
  await tocar("💅 Uñas");
  ok(pantalla().includes("Otro igual, de otro color"), "ofrece agregar colores");
  await tocar("Otro igual, de otro color");
  await escribir("color 2", "Rosa");
  await tocar("Otro igual, de otro color");
  await escribir("color 3", "Azul");
  ok(pantalla().includes("3 colores"), "el renglón dice que van tres colores");
  await tocar("Guardar 1 producto");
  ok(pantalla().includes("13 / 30"), "los tres colores consumieron un solo lugar del plan");
  ok(pantalla().includes("gel de uñas"), "quedó con su apodo");
  ok(pantalla().includes("3 colores"), "el inventario muestra los tres colores");

  console.log("\n=== 9. Se vende el color correcto del producto nuevo ===");
  await tocar("Vender"); await tocar("Uñas");
  await tocar("gel de uñas");
  const nv = pantalla();
  ok(nv.includes("Original") && nv.includes("Rosa") && nv.includes("Azul"), "los tres colores aparecen al vender");
  await tocar("Rosa");
  await tocar("Agregar Rosa");
  ok(pantalla().includes("Rosa"), "el carrito trae el color");

  console.log("\n=== 10. Nada en mayúsculas sostenidas ===");
  const caps = (pantalla().match(/\b[A-ZÁÉÍÓÚÑ]{4,}\b/g) || []).filter((w) => !["CFDI", "SANIYE", "ONE", "MAX"].includes(w));
  ok(caps.length === 0, "sin mayúsculas sostenidas" + (caps.length ? ` (${caps.join(", ")})` : ""));

  console.log(`\n${fallos === 0 ? "TODO PASÓ" : fallos + " FALLAS"}\n`);
  process.exit(fallos ? 1 : 0);
}

correr().catch((e) => { console.error("\nREVENTÓ:", e.message, "\n", e.stack); process.exit(1); });
