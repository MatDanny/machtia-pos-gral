// ============================================================
// nucleo/actualizacion.jsx — las versiones nuevas NO entran solas.
//
// Antes, el trabajador de internet se instalaba y tomaba el control de
// inmediato (skipWaiting). Eso significa que si publicas una version
// nueva mientras alguien esta cobrando, la pagina le cambia debajo de
// las manos. Inaceptable en una caja.
//
// Ahora la version nueva se descarga y se queda ESPERANDO. La app avisa
// con un boton, y hasta que el vendedor lo toca —cuando no esta cobrando—
// se aplica y recarga. El que decide es el, no el servidor.
// ============================================================

import { bitacora } from "./bitacora.jsx";

let enEspera = null;          // el trabajador nuevo, listo pero detenido
const oyentes = new Set();
const avisar = () => oyentes.forEach((f) => { try { f(!!enEspera); } catch (e) {} });

export const hayVersionNueva = () => !!enEspera;
export function escucharVersion(f) { oyentes.add(f); f(!!enEspera); return () => oyentes.delete(f); }

// Aplica la version nueva. Solo se llama cuando el vendedor lo pide.
export function aplicarVersion() {
  if (!enEspera) return;
  bitacora.paso("actualizacion", "el vendedor aplico la version nueva");
  enEspera.postMessage({ tipo: "tomar-el-control" });
  // cuando el nuevo tome el control, recargamos una sola vez
}

export function prepararActualizaciones() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  let recargando = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (recargando) return;
    recargando = true;
    window.location.reload();
  });

  navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" })
    .then((reg) => {
      bitacora.paso("actualizacion", "listo para trabajar sin internet");

      const revisar = () => {
        if (reg.waiting) { enEspera = reg.waiting; avisar();
          bitacora.aviso("actualizacion", "hay una version nueva esperando"); }
      };
      revisar();

      reg.addEventListener("updatefound", () => {
        const nuevo = reg.installing;
        if (!nuevo) return;
        nuevo.addEventListener("statechange", () => {
          // installed + ya habia uno controlando = es una actualizacion, no la primera vez
          if (nuevo.state === "installed" && navigator.serviceWorker.controller) revisar();
        });
      });

      // Buscar version nueva al abrir y cada media hora. Solo DESCARGA;
      // no aplica nada hasta que el vendedor diga.
      const buscar = () => reg.update().catch(() => {});
      buscar();
      setInterval(buscar, 30 * 60 * 1000);
    })
    .catch((e) => bitacora.aviso("actualizacion", "no se pudo preparar el modo sin internet", String(e)));
}
