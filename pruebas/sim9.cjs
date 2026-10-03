// Simulación 9: lo que el cliente ve — clientes nuevos, QR de cobro y ticket.
const React = require("react");
const TR = require("react-test-renderer");
const { act } = TR;

global.IS_REACT_ACT_ENVIRONMENT = true;
global.window = global;
global.navigator = { mediaDevices: { getUserMedia: async () => { throw new Error("x"); } },
  clipboard: { writeText: async () => {} } };
global.fetch = async () => { throw new Error("x"); };
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
let abrio = [];
global.open = (u) => { abrio.push(u); };

const T = require("./todo.build.cjs");
const App = T.App;

const flat = (n) => { const o = []; const w = (x) => { if (!x) return; if (Array.isArray(x)) return x.forEach(w);
  if (typeof x === "object") { o.push(x); w(x.children); } }; w(n); return o; };
const txt = (n) => { let s = ""; const w = (x) => { if (x == null) return; if (typeof x === "string" || typeof x === "number") { s += x + " "; return; }
  if (Array.isArray(x)) return x.forEach(w); if (typeof x === "object") w(x.children); }; w(n); return s.replace(/\s+/g, " "); };

let f = 0;
const ok = (c, m) => { console.log((c ? "  ok   " : "  FALLA") + "  " + m); if (!c) f++; };

(async () => {
  let r;
  await act(async () => { r = TR.create(React.createElement(App)); });
  const todos = () => flat(r.toJSON());
  const pt = (t) => todos().filter((n) => n.props && n.props.onClick && txt(n).includes(t))
    .sort((a, b) => txt(a).length - txt(b).length);
  const clic = async (t, i = 0) => {
    const c = pt(t); if (!c[i]) throw new Error(`no hay botón "${t}" (hay ${c.length})`);
    await act(async () => { c[i].props.onClick({ stopPropagation() {} }); });
  };
  const esc = async (ph, v, i = 0) => {
    const c = todos().filter((n) => n.props && n.props.placeholder === ph && n.props.onChange);
    if (!c[i]) throw new Error(`no hay campo "${ph}"`);
    await act(async () => { c[i].props.onChange({ target: { value: v } }); });
  };
  const esp = async (ms) => { await act(async () => { await new Promise((x) => setTimeout(x, ms)); }); };
  const pan = () => txt(r.toJSON());
  const imgs = () => todos().filter((n) => n.type === "img").length;

  console.log("\n=== 1. Transferencia sin datos capturados: lo dice y manda a Caja ===");
  await clic("Maquillaje"); await clic("rubor"); await clic("Cobrar");
  await clic("Transfer");
  ok(pan().includes("Todavía no pones a dónde te depositan"), "avisa que falta capturarlo");
  ok(pan().includes("pestaña Caja"), "y dice exactamente dónde");

  console.log("\n=== 2. Dar de alta a alguien nuevo sin salir del cobro ===");
  await clic("Fiado");
  ok(pan().includes("Alguien nuevo"), "el botón existe");
  await clic("Alguien nuevo");
  ok(pan().includes("¿Cómo se llama?"), "pide el nombre");
  await esc("Nombre o apodo", "Chuy el del puesto");
  await esc("10 dígitos, opcional", "5512345678");
  await clic("Guardar y escogerlo");
  ok(pan().includes("Chuy el del puesto"), "quedó dado de alta y escogido");
  ok(!pan().includes("¿Cómo se llama?"), "y se cierra el formulario");

  console.log("\n=== 3. El ticket con su código ===");
  await clic("Anotar en su cuenta");
  ok(pan().includes("¡Anotado!"), "confirma la venta");
  ok(pan().includes("Ver el ticket"), "ofrece el ticket sin estorbar");
  await clic("Ver el ticket");
  await esp(60);
  const t = pan();
  ok(t.includes("Que lo escanee con la cámara"), "explica para qué sirve");
  ok(t.includes("rubor"), "el ticket trae el producto");
  ok(t.includes("Total"), "y el total");
  ok(t.includes("Mandarlo por WhatsApp"), "se puede mandar por WhatsApp");
  ok(imgs() > 0, "el código QR se dibujó de verdad");

  console.log("\n=== 3b. El teléfono se pide ANTES de abrir WhatsApp ===");
  ok(t.includes("Teléfono del cliente"), "pide el teléfono en la misma pantalla");
  // Chuy quedó con teléfono al darlo de alta, así que ya viene puesto.
  ok(t.includes("Se lo mando al 55 1234 5678"), "el teléfono del cliente de fiado ya viene cargado");
  abrio = [];
  await clic("Mandarlo por WhatsApp");
  ok(abrio.length === 1, "abrió WhatsApp una sola vez");
  ok((abrio[0] || "").startsWith("https://wa.me/525512345678?text="),
    `abrió el chat de ese número con la lada 52 (abrió ${abrio[0]})`);
  ok(decodeURIComponent(abrio[0] || "").includes("rubor"), "y el mensaje ya lleva el ticket");

  console.log("\n=== 3c. Sin teléfono no manda al vacío ===");
  const campoTel = todos().filter((n) => n.props && n.props.placeholder === "10 dígitos")[0];
  await act(async () => { campoTel.props.onChange({ target: { value: "551" } }); });
  const btn = pt("Mandarlo por WhatsApp")[0];
  ok(btn.props.disabled === true, "con el número incompleto el botón no deja mandar");
  abrio = [];
  await clic("No me sé su número");
  ok((abrio[0] || "").startsWith("https://wa.me/?text="),
    "la salida de emergencia abre WhatsApp sin número, para escoger el contacto");
  await act(async () => { campoTel.props.onChange({ target: { value: "5512345678" } }); });

  console.log("\n=== 4. Abierto el ticket, ya no se cierra solo ===");
  await esp(2600);
  ok(pan().includes("Mandarlo por WhatsApp"), "sigue ahí después de los 2.2 segundos");
  await clic("Listo");
  ok(!pan().includes("Mandarlo por WhatsApp"), "se cierra cuando tú dices");

  console.log("\n=== 5. Con la clave capturada, el QR sale al cobrar ===");
  await clic("Caja");
  await esc("18 dígitos", "012180012345678901");
  await esc("Tu nombre como aparece en el banco", "Jorge Daniel González");
  await clic("Vender"); await clic("Maquillaje"); await clic("rubor"); await clic("Cobrar");
  await clic("Transfer");
  await esp(60);
  const c = pan();
  ok(c.includes("Que te deposite aquí"), "ahora sí enseña a dónde");
  ok(c.includes("012180012345678901"), "con la clave completa");
  ok(c.includes("Jorge Daniel González"), "y a nombre de quién");
  ok(imgs() > 0, "con su código para escanear");

  console.log("\n=== 6. El número se arma bien, venga como venga ===");
  ok(T.normalizaTel("55 1234 5678") === "525512345678", "10 dígitos con espacios: le pone el 52");
  ok(T.normalizaTel("(55) 1234-5678") === "525512345678", "con paréntesis y guiones también");
  ok(T.normalizaTel("5215512345678") === "525512345678", "le quita el 1 viejo de 521");
  ok(T.normalizaTel("525512345678") === "525512345678", "si ya venía bien, no lo toca");
  ok(T.normalizaTel("5512") === null, "un número incompleto no pasa");
  ok(T.normalizaTel("") === null, "vacío no pasa");
  ok(T.moduloTicket.probar() === true, "el módulo del ticket se revisa solo");

  console.log("\n=== 7. Nada en mayúsculas sostenidas ===");
  const caps = (pan().match(/\b[A-ZÁÉÍÓÚÑ]{4,}\b/g) || []).filter((w) => !["CFDI", "SANIYE", "ONE", "MAX"].includes(w));
  ok(caps.length === 0, "sin mayúsculas sostenidas" + (caps.length ? ` (${caps.join(", ")})` : ""));

  console.log(`\n${f === 0 ? "TODO PASÓ" : f + " FALLAS"}\n`);
  process.exit(f ? 1 : 0);
})().catch((e) => { console.error("\nREVENTÓ:", e.message, "\n", e.stack); process.exit(1); });
