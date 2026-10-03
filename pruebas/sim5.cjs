// Simulación 5: el agente que mira la foto — cuatro campos y sus dudas.
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
  const pan = () => txt(r.toJSON());
  const reiniciar = async () => { await act(async () => { r.unmount(); }); await act(async () => { r = TR.create(React.createElement(App)); }); };
  const foto = async (cual) => { await tocar("Inventario"); await tocar("Agregar productos");
    await tocar(cual); await tocar("Tomar la foto"); await esperar(2800); };

  console.log("\n=== 1. El menú ya no ofrece cuatro cámaras sino tres encuadres ===");
  await tocar("Inventario"); await tocar("Agregar productos");
  const menu = pan();
  ok(menu.includes("Un producto") && menu.includes("Un grupo con colores") && menu.includes("El mostrador completo"),
    "tres encuadres de la misma idea");
  ok(!menu.includes("Video"), "el video se fue hasta que haya con qué probarlo");
  ok(menu.includes("Escanear el código"), "el escáner queda como atajo");

  console.log("\n=== 2. Foto de un producto solo: el caso bueno ===");
  await reiniciar(); await foto("Un producto");
  const uno = pan();
  ok(uno.includes("base saniye"), "sacó el apodo");
  ok(uno.includes("SANIYE Make Up Professional"), "y el nombre completo del empaque");
  ok(uno.includes("falta precio"), "admite que no hubo precio porque el tubo no traía etiqueta");
  ok(uno.includes("No vi etiqueta de precio"), "y explica por qué");
  ok(uno.includes("Revisa:") && uno.includes("precio"), "marca sólo el precio para revisar");
  ok(!uno.includes("Te quiero preguntar algo"), "no pregunta nada porque pudo contar");

  console.log("\n=== 3. Grupo con colores: cuenta mal y lo dice ===");
  await reiniciar(); await foto("Un grupo con colores");
  const ex = pan();
  ok(ex.includes("pupilentes halloween"), "reconoció el producto");
  ok(ex.includes("Te quiero preguntar algo"), "el renglón avisa que hay pregunta");
  ok(ex.includes("¿Cuántas cajas hay de cada uno?"), "pregunta el conteo en vez de inventarlo");
  ok(ex.includes('No sé si son $50 o 50% de descuento'), "detecta que la etiqueta 50 % es ambigua");
  ok(ex.includes("saca las cajas del exhibidor"), "dice cómo retomar la foto para poder contar");

  console.log("\n=== 4. Contestar la pregunta la quita ===");
  await tocar("Ya quedó");
  ok(!pan().includes("¿Cuántas cajas hay de cada uno?"), "la pregunta desaparece al contestarla");
  ok(pan().includes("3 colores"), "y entonces el renglón ya muestra los tres diseños");

  console.log("\n=== 5. Foto del montón: admite que no sirve ===");
  await reiniciar(); await foto("El mostrador completo");
  const mo = pan();
  ok(mo.includes("no alcancé a identificar"), "dice cuántas cosas no pudo ver");
  ok(mo.includes("290"), "y cuántas son: casi todo el mostrador");
  ok(mo.includes("Tómale foto a un grupo a la vez"), "manda a la toma que sí sirve");
  ok(mo.includes("sombras 18") && mo.includes("$40.00"), "aun así rescata lo poco que sí leyó");
  ok(mo.includes("Te quiero preguntar algo"), "y pregunta por lo que no pudo contar");

  console.log("\n=== 6. Los colores del agente no se ensucian con un 'Original' ===");
  await reiniciar(); await foto("Un grupo con colores");
  await escribir("0.00", "50");
  await tocar("Guardar 1 producto");
  await tocar("pupilentes halloween");
  const guardado = pan();
  ok(guardado.includes("Lente negro") && guardado.includes("Lente rojo"), "guardó los colores con su nombre");
  ok(!guardado.includes("Original"), "no inventó un color extra");
  await tocar("Guardar cambios");

  console.log("\n=== 7. Lo guardado se puede vender por color ===");
  await tocar("Vender"); await tocar("Temporada");
  await tocar("pupilentes halloween");
  ok(pan().includes("¿Cuál se lleva?"), "al vender pregunta cuál diseño");
  ok(pan().includes("Lente verde"), "y los ofrece por foto");

  console.log("\n=== 8. Nada en mayúsculas sostenidas ===");
  const caps = (pan().match(/\b[A-ZÁÉÍÓÚÑ]{4,}\b/g) || []).filter((w) => !["CFDI", "SANIYE", "ONE", "MAX"].includes(w));
  ok(caps.length === 0, "sin mayúsculas sostenidas" + (caps.length ? ` (${caps.join(", ")})` : ""));

  console.log(`\n${fallos === 0 ? "TODO PASÓ" : fallos + " FALLAS"}\n`);
  process.exit(fallos ? 1 : 0);
}

correr().catch((e) => { console.error("\nREVENTÓ:", e.message, "\n", e.stack); process.exit(1); });
