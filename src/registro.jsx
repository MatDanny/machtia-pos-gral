// ============================================================
// nucleo/registro.jsx — el registro de funcionalidades.
//
// Cada funcionalidad se da de alta aquí con su id, de qué depende, y una
// PRUEBA PROPIA. El orquestador no sabe qué pantallas existen: las lee de
// este registro. Así una funcionalidad se agrega, cambia o se quita en un
// solo lugar.
//
// El seguro contra borrar de más: al arrancar se revisa que cada módulo
// tenga sus dependencias y se corre su prueba. Si alguien quita algo que
// otro usa, o si un cambio rompe una funcionalidad, sale en la bitácora
// ANTES de que el usuario lo encuentre vendiendo.
// ============================================================

import { bitacora } from "./bitacora.jsx";

const modulos = new Map();

export function registrar(m) {
  if (!m || !m.id) { bitacora.error("registro", "módulo sin id", null, m); return; }
  if (modulos.has(m.id)) {
    bitacora.aviso("registro", "módulo repetido, se queda el último", { id: m.id });
  }
  modulos.set(m.id, {
    id: m.id,
    nombre: m.nombre || m.id,
    version: m.version || "1.0",
    tipo: m.tipo || "funcionalidad",   // funcionalidad | pestaña | servicio
    requiere: m.requiere || [],        // ids de los que necesita para servir
    nivelMin: m.nivelMin || null,      // plan mínimo, si aplica
    orden: m.orden ?? 100,
    icono: m.icono || null,
    pantalla: m.pantalla || null,      // componente, si pinta algo
    probar: m.probar || null,          // () => true | string con la falla
    apagado: !!m.apagado,
  });
  bitacora.paso("registro", "módulo dado de alta", { id: m.id, version: m.version || "1.0" });
}

export function quitar(id) {
  const usan = [...modulos.values()].filter((m) => m.requiere.includes(id)).map((m) => m.id);
  if (usan.length) {
    bitacora.error("registro", "no se puede quitar: otros lo usan", null, { id, usan });
    return false;
  }
  modulos.delete(id);
  bitacora.paso("registro", "módulo dado de baja", { id });
  return true;
}

export const obtener = (id) => modulos.get(id) || null;
export const listar = (tipo) => [...modulos.values()]
  .filter((m) => !m.apagado && (!tipo || m.tipo === tipo))
  .sort((a, b) => a.orden - b.orden);

// Revisa dependencias y corre las pruebas de cada módulo.
// Se llama al arrancar y desde la pantalla de Bitácora cuando quieras.
export function revisar() {
  const salud = [];
  for (const m of modulos.values()) {
    const faltan = m.requiere.filter((r) => !modulos.has(r));
    let pruebas = [];
    if (faltan.length) {
      bitacora.error("registro", "le faltan dependencias", null, { id: m.id, faltan });
    }
    if (m.probar) {
      const r = bitacora.intentar(m.id, "prueba propia", m.probar);
      // la prueba devuelve true si pasó, o un texto diciendo qué falló
      const paso = r === true;
      pruebas.push({ nombre: "prueba propia", paso, detalle: paso ? null : (r || "no devolvió true") });
      if (!paso) bitacora.error(m.id, "la prueba propia no pasó", null, { detalle: r });
    }
    const estado = m.apagado ? "apagado"
      : (faltan.length || pruebas.some((p) => !p.paso)) ? "falla" : "bien";
    salud.push({ id: m.id, nombre: m.nombre, version: m.version, tipo: m.tipo, estado, faltan, pruebas });
  }
  const malos = salud.filter((s) => s.estado === "falla").length;
  bitacora[malos ? "aviso" : "paso"]("registro", "revisión terminada",
    { modulos: salud.length, conFalla: malos });
  return salud;
}

// Para que un agente sepa qué hay sin leer el código.
export function inventario() {
  return [...modulos.values()].map((m) => ({
    id: m.id, nombre: m.nombre, version: m.version, tipo: m.tipo,
    requiere: m.requiere, nivelMin: m.nivelMin, apagado: m.apagado,
    pinta: !!m.pantalla, tienePrueba: !!m.probar,
  }));
}
