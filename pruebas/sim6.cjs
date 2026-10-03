// Simulación 6: el núcleo — registro, pruebas propias y bitácora.
const React = require("react");
const TR = require("react-test-renderer");
const { act } = TR;

global.IS_REACT_ACT_ENVIRONMENT = true;
global.window = global;
global.navigator = { mediaDevices: { getUserMedia: async () => { throw new Error("sin camara"); } },
  clipboard: { writeText: async () => {} } };
global.fetch = async () => { throw new Error("sin red"); };

const T = require("./todo.build.cjs");
const App = T.App;
const { bitacora, registrar, listar, quitar, revisar, inventario, nuevo, validar, stockDe, comoSeLlama } = T;

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
  const pan = () => txt(r.toJSON());

  console.log("\n=== 1. Las pestañas salen del registro ===");
  const pestanas = listar("pestaña");
  ok(pestanas.length === 8, `hay 8 pestañas registradas (hay ${pestanas.length})`);
  ok(pestanas.map((p) => p.id).join(",") === "vender,inventario,surtir,cuentas,reportes,caja,planes,bitacora",
    "y en el orden que declararon");
  ok(pan().includes("Bitácora"), "la pestaña nueva aparece sin tocar App");

  console.log("\n=== 2. Todos los módulos pasan su propia prueba ===");
  const salud = revisar();
  const malos = salud.filter((s) => s.estado !== "bien");
  ok(malos.length === 0, "ninguno en falla" + (malos.length ? `: ${malos.map((m) => m.id).join(", ")}` : ""));
  ok(salud.every((s) => s.tipo === "servicio" || s.pruebas.length > 0 || s.id === "reportes"),
    "casi todos traen prueba propia");

  console.log("\n=== 3. El registro no deja quitar algo de lo que otros dependen ===");
  const antes = bitacora.cuantosErrores();
  const pudo = quitar("catalogo");
  ok(pudo === false, "se negó a quitar el catálogo");
  ok(bitacora.cuantosErrores() === antes + 1, "y lo apuntó como error en la bitácora");
  ok(bitacora.ultimoError().detalle.usan.includes("vender"), "diciendo quién lo usa");

  console.log("\n=== 4. Una prueba que falla se ve, no se esconde ===");
  registrar({ id: "demo-roto", nombre: "Módulo de prueba roto", tipo: "servicio",
    probar: () => "aquí falló algo a propósito" });
  const s2 = revisar();
  const roto = s2.find((s) => s.id === "demo-roto");
  ok(roto && roto.estado === "falla", "el módulo roto queda marcado en falla");
  ok(roto.pruebas[0].detalle === "aquí falló algo a propósito", "con el motivo que devolvió la prueba");

  console.log("\n=== 5. La pantalla de bitácora lo muestra sin abrir consola ===");
  await tocar("Bitácora");
  const b = pan();
  ok(b.includes("con falla"), "el encabezado avisa que hay fallas");
  ok(b.includes("Módulo de prueba roto"), "y nombra el módulo roto");
  ok(b.includes("aquí falló algo a propósito"), "con el motivo a la vista");
  ok(b.includes("Copiar todo para el agente"), "y ofrece el volcado para el agente");
  quitar("demo-roto");

  console.log("\n=== 6. Lo que se exporta sirve para un agente ===");
  const vol = bitacora.exportar(revisar());
  ok(vol.app === "pos-informal" && vol.cuando, "trae identificación y fecha");
  ok(typeof vol.resumen.errores === "number", "cuenta los errores");
  ok(Array.isArray(vol.salud) && vol.salud.length >= 8, "incluye la salud de cada módulo");
  ok(Array.isArray(vol.eventos) && vol.eventos.length > 0, "y los últimos eventos");
  ok(vol.eventos.every((e) => e.modulo && e.que && e.t), "cada evento dice módulo, qué y cuándo");

  console.log("\n=== 7. Un error de verdad queda apuntado con su módulo ===");
  bitacora.error("prueba", "algo truena", new Error("se cayó la red"), { donde: "simulación" });
  const ult = bitacora.ultimoError();
  ok(ult.modulo === "prueba", "guarda el módulo culpable");
  ok(ult.error.mensaje === "se cayó la red", "y el mensaje del error");
  ok(typeof ult.error.pila === "string" && ult.error.pila.length > 0, "con unas líneas de pila, no el volcado entero");

  console.log("\n=== 8. El contrato es la única definición de los campos ===");
  const p = nuevo("producto", { apodo: "base saniye", precio: 89 });
  ok(p.cat === "maq" && p.emoji === "📦", "los campos que no mandas salen con su valor por omisión");
  ok(validar("producto", { apodo: "", precio: 10 }).some((m) => m.includes("¿Cómo le dices?")),
    "validar reclama el apodo con el nombre que ve el usuario");
  ok(validar("producto", { id: 1, apodo: "x", precio: -5 }).some((m) => m.includes("no puede ser menor")),
    "y reclama un precio negativo");
  ok(validar("producto", { id: 1, apodo: "x", precio: 10 }).length === 0, "un producto bueno no genera quejas");
  ok(stockDe({ variantes: [{ stock: 3 }, { stock: 4 }] }) === 7, "stockDe suma variantes");
  ok(comoSeLlama({ nombre: "SANIYE base" }) === "SANIYE base", "comoSeLlama cae al nombre si no hay apodo");
  // El teléfono del cliente se llamaba "telefono" en un lado y "tel" en otro,
  // y por eso el ticket salía sin número. Ahora el nombre vive en el contrato.
  const cli = nuevo("cliente", { nombre: "Chuy", tel: "5512345678" });
  ok(cli.tel === "5512345678" && cli.saldo === 0, "el cliente sale del contrato con su teléfono y saldo");
  ok(validar("cliente", { id: 1, nombre: "" }).some((m) => m.includes("Nombre o apodo")),
    "validar reclama el nombre del cliente");

  console.log("\n=== 9. Una pantalla que truena no tumba la app ===");
  registrar({ id: "demo-truena", nombre: "Pantalla que truena", tipo: "pestaña", orden: 99,
    icono: () => null, pantalla: () => { throw new Error("tronó al pintar"); } });
  await act(async () => { r.unmount(); });
  await act(async () => { r = TR.create(React.createElement(App)); });
  await tocar("Pantalla que truena");
  ok(pan().includes("Esta parte se cayó"), "muestra el aviso en vez de pantalla en blanco");
  ok(pan().includes("Vender"), "y la barra de pestañas sigue viva");
  ok(bitacora.errores().some((e) => e.modulo === "demo-truena"), "el error quedó apuntado con su módulo");
  quitar("demo-truena");

  console.log(`\n${fallos === 0 ? "TODO PASÓ" : fallos + " FALLAS"}\n`);
  process.exit(fallos ? 1 : 0);
}

correr().catch((e) => { console.error("\nREVENTÓ:", e.message, "\n", e.stack); process.exit(1); });
