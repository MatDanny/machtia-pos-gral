// Simulación 2: la búsqueda en internet al escanear.
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
  const escribir = async (ph, val) => {
    const c = todos().filter((n) => n.props && n.props.placeholder === ph && n.props.onChange);
    if (!c[0]) throw new Error(`no encontré campo "${ph}"`);
    await act(async () => { c[0].props.onChange({ target: { value: val } }); });
  };
  const esperar = async (ms) => { await act(async () => { await new Promise((res) => setTimeout(res, ms)); }); };
  const pantalla = () => txt(r.toJSON());
  const imgs = () => todos().filter((n) => n.type === "img").map((n) => n.props.src);
  const escanear = async (cod) => {
    await tocar("Agregar productos"); await tocar("Escanear el código");
    await escribir("o teclea el código", cod); await tocar("Buscar");
    // en ráfaga hay que rematar con el botón; sin ráfaga pasa solo tras un momento
    if (porTexto("Ponerles precio").length) await tocar("Ponerles precio");
    else await esperar(400);
  };

  console.log("\n=== 12. Escaneo en 3.3: la búsqueda sale sola ===");
  await tocar("Inventario");
  await escanear("7501000670017");
  ok(pantalla().includes("Ponles precio"), "pasa a la cinta");
  ok(pantalla().includes("Te quedan"), "muestra el cupo de búsquedas");
  await esperar(1400);
  const h = pantalla();
  ok(h.includes("Encontré esto"), "abrió sola la ficha del hallazgo");
  ok(h.includes("Sabritas sabor original 45 g"), "trajo el nombre completo de internet");
  ok(h.includes("Papas fritas sabor original"), "trajo la descripción");
  ok(h.includes("3 fotos"), "trajo tres fotos");
  ok(h.includes("100/100"), "la mejor foto sale primero, con su calificación");
  ok(h.includes("Walmart") && h.includes("Bodega Aurrera"), "nombra las tiendas que traen el código");
  ok(!h.includes("Soriana"), "descarta la tienda que no trae el código exacto");
  ok(imgs().length > 0, "hay foto de verdad en pantalla, no sólo emoji");

  console.log("\n=== 13. Escoger otra foto avisa si se ve pobre ===");
  const miniaturas = todos().filter((n) => n.props && n.props.onClick && n.props.style
    && n.props.style.borderRadius === 13);
  ok(miniaturas.length === 3, "hay tres miniaturas para escoger");
  await act(async () => { miniaturas[1].props.onClick({ stopPropagation() {} }); });
  ok(pantalla().includes("Esta foto se ve pobre"), "avisa que la segunda foto es de baja calidad");
  ok(pantalla().includes("320px"), "dice el tamaño real que la hace pobre");
  await act(async () => { miniaturas[0].props.onClick({ stopPropagation() {} }); });
  ok(!pantalla().includes("Esta foto se ve pobre"), "al volver a la buena quita el aviso");

  console.log("\n=== 14. Aceptar el hallazgo llena la fila ===");
  await tocar("Sí, es este");
  const c = pantalla();
  ok(!c.includes("Encontré esto"), "cerró la ficha");
  ok(c.includes("Sabritas sabor original 45 g"), "el nombre quedó en la fila");
  ok(c.includes("De internet · Walmart, Bodega Aurrera"), "la fila dice de dónde salió");
  ok(c.includes("Papas fritas sabor original"), "la descripción quedó en la fila");
  ok(pantalla().includes("Te quedan 9998"), "gastó exactamente una búsqueda");

  console.log("\n=== 15. El producto guardado conserva su foto ===");
  await escribir("0.00", "22");
  await tocar("Guardar 1 producto");
  ok(imgs().length > 0, "la foto aparece en la lista de inventario");

  console.log("\n=== 16. Código que nadie trae: dice la verdad, no inventa ===");
  await escanear("7501999888777");
  await esperar(1400);
  const nf = pantalla();
  ok(nf.includes("No encontré este producto"), "avisa que no lo encontró");
  ok(nf.includes("Ninguna tienda trae este código"), "explica por qué");
  ok(!nf.includes("Encontré esto"), "no muestra ficha inventada");
  await tocar("Lo escribo yo");
  ok(pantalla().includes("Sin apodo todavía"), "deja la fila vacía para escribirla");

  console.log("\n=== 17. En plan 1.2 la búsqueda está cerrada ===");
  await tocar("Plan"); await tocar("Local"); await tocar("Puesto+ nivel 1.2");
  await tocar("Inventario");
  await escanear("7501030485025");
  await esperar(1200);
  const p12 = pantalla();
  ok(!p12.includes("Encontré esto"), "no busca sola");
  ok(!p12.includes("Te quedan"), "no muestra cupo porque no tiene");
  ok(p12.includes("Buscar foto y datos"), "el botón está a la vista");
  await tocar("Buscar foto y datos");
  ok(pantalla().includes("Buscar foto y descripción en internet"), "el candado explica la función");
  ok(pantalla().includes("Tiendita"), "dice que viene desde el plan Tiendita");

  console.log("\n=== 18. En plan 1.3 sí busca y descuenta del cupo de 50 ===");
  await tocar("Ver planes"); await tocar("Tiendita nivel 1.3");
  await tocar("Inventario");
  await escanear("7501030485025");
  await esperar(1400);
  ok(pantalla().includes("Gansito Marinela 50 g"), "encontró el producto");
  await tocar("Sí, es este");
  ok(pantalla().includes("Te quedan 47"), "descontó del cupo de 50 las 3 búsquedas ya hechas");

  console.log("\n=== 19. Buscar otra vez no se dispara sola dos veces ===");
  await esperar(1400);
  ok(pantalla().includes("Te quedan 47"), "no volvió a gastar por su cuenta");
  ok(pantalla().includes("Buscar otra vez"), "el botón ahora ofrece repetir a mano");

  console.log("\n=== 19b. Cada fila ofrece tomarle foto ===");
  // La búsqueda ya le trajo foto a esta fila, así que ofrece cambiarla.
  ok(pantalla().includes("Cambiar la foto"), "con foto de internet ofrece cambiarla");
  ok(porTexto("Cambiar la foto").length > 0, "y es un botón, no un letrero");

  console.log("\n=== 20. Nada en mayúsculas sostenidas ===");
  const caps = (pantalla().match(/\b[A-ZÁÉÍÓÚÑ]{4,}\b/g) || []).filter((w) => w !== "CFDI");
  ok(caps.length === 0, "sin mayúsculas sostenidas" + (caps.length ? ` (${caps.join(", ")})` : ""));

  console.log(`\n${fallos === 0 ? "TODO PASÓ" : fallos + " FALLAS"}\n`);
  process.exit(fallos ? 1 : 0);
}

correr().catch((e) => { console.error("\nREVENTÓ:", e.message, "\n", e.stack); process.exit(1); });
