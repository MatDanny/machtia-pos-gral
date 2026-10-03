// ============================================================
// nucleo/bitacora.jsx — el único lugar donde se mira qué pasó.
//
// Regla: ninguna funcionalidad escribe en console.log. Todo pasa por aquí,
// y aquí se guarda con el módulo que lo produjo, para que al fallar algo
// se sepa DÓNDE sin abrir consola, red ni terminal.
//
// Está pensado para que un agente lo consuma: exportar() devuelve un objeto
// plano con la salud de cada módulo y los últimos eventos, listo para que
// otro programa decida qué arreglar.
// ============================================================

const MAX = 600;              // cuántos eventos se guardan antes de tirar los viejos
let eventos = [];
let secuencia = 0;
const oyentes = new Set();

const ahora = () => new Date().toISOString();
const avisar = () => oyentes.forEach((f) => { try { f(); } catch (e) { /* un oyente roto no tumba el log */ } });

function meter(nivel, modulo, que, detalle, extra) {
  const ev = { id: ++secuencia, t: ahora(), nivel, modulo, que,
    detalle: detalle ?? null, ...extra };
  eventos.push(ev);
  if (eventos.length > MAX) eventos = eventos.slice(-MAX);
  avisar();
  return ev;
}

// Convierte cualquier cosa lanzada en algo guardable y legible.
function deError(e) {
  if (!e) return { mensaje: "error sin detalle" };
  if (typeof e === "string") return { mensaje: e };
  return { mensaje: e.message || String(e), pila: (e.stack || "").split("\n").slice(0, 4).join(" | ") };
}

export const bitacora = {
  // --- escribir ---
  paso: (modulo, que, detalle) => meter("paso", modulo, que, detalle),
  aviso: (modulo, que, detalle) => meter("aviso", modulo, que, detalle),
  error: (modulo, que, e, detalle) => meter("error", modulo, que, detalle, { error: deError(e) }),

  // Envuelve una operación: guarda que empezó, cuánto tardó, y el error si truena.
  // Devuelve lo que devuelva fn, o null si falló — la app no se cae por un log.
  async medir(modulo, que, fn, detalle) {
    const t0 = Date.now();
    try {
      const r = await fn();
      meter("paso", modulo, que, detalle, { ms: Date.now() - t0, ok: true });
      return r;
    } catch (e) {
      meter("error", modulo, que, detalle, { ms: Date.now() - t0, ok: false, error: deError(e) });
      return null;
    }
  },

  // Igual pero para funciones que no son promesa.
  intentar(modulo, que, fn, detalle) {
    const t0 = Date.now();
    try {
      const r = fn();
      meter("paso", modulo, que, detalle, { ms: Date.now() - t0, ok: true });
      return r;
    } catch (e) {
      meter("error", modulo, que, detalle, { ms: Date.now() - t0, ok: false, error: deError(e) });
      return null;
    }
  },

  // --- leer ---
  todos: () => eventos.slice().reverse(),
  deModulo: (modulo) => eventos.filter((e) => e.modulo === modulo).reverse(),
  errores: () => eventos.filter((e) => e.nivel === "error").reverse(),
  cuantosErrores: () => eventos.filter((e) => e.nivel === "error").length,
  ultimoError: () => [...eventos].reverse().find((e) => e.nivel === "error") || null,

  limpiar() { eventos = []; secuencia = 0; avisar(); },
  escuchar(f) { oyentes.add(f); return () => oyentes.delete(f); },

  // Lo que se le entrega a un agente para que decida qué arreglar.
  exportar(salud) {
    return {
      app: "pos-informal", cuando: ahora(),
      resumen: {
        eventos: eventos.length,
        errores: eventos.filter((e) => e.nivel === "error").length,
        avisos: eventos.filter((e) => e.nivel === "aviso").length,
        modulosConError: [...new Set(eventos.filter((e) => e.nivel === "error").map((e) => e.modulo))],
      },
      salud: salud || null,
      eventos: eventos.slice(-200),
    };
  },
};

// Atrapa lo que se escape de los try/catch: errores sueltos y promesas no atendidas.
// Sin esto, un error en un manejador de evento sólo aparecería en la consola.
export function atraparGlobales() {
  if (typeof window === "undefined" || window.__bitacoraGlobales) return;
  window.__bitacoraGlobales = true;
  try {
    window.addEventListener("error", (ev) => {
      bitacora.error("suelto", "error no atrapado", ev.error || ev.message,
        { donde: `${ev.filename || "?"}:${ev.lineno || 0}` });
    });
    window.addEventListener("unhandledrejection", (ev) => {
      bitacora.error("suelto", "promesa sin atender", ev.reason);
    });
  } catch (e) { /* entorno sin window completo */ }
}
