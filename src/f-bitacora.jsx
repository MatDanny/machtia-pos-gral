// ============================================================
// funcionalidades/f-bitacora.jsx — la pantalla donde se ve qué pasó.
//
// Para no andar buscando el error en la consola, la red o la terminal:
// aquí sale la salud de cada módulo y los últimos eventos, con filtro.
// El botón de copiar entrega el JSON que un agente puede leer para
// decidir qué arreglar.
// ============================================================

import React, { useState, useEffect } from "react";
import { Activity, AlertTriangle, CheckCircle2, Copy, RefreshCw, Trash2, Power } from "lucide-react";
import { COL, colorEstado, tarjeta } from "./tema.jsx";
import { bitacora } from "./bitacora.jsx";
import { revisar, inventario } from "./registro.jsx";

const hora = (t) => { try { return new Date(t).toTimeString().slice(0, 8); } catch (e) { return "--:--:--"; } };

export default function Bitacora() {
  const [, repintar] = useState(0);
  const [filtro, setFiltro] = useState("todo");   // todo | error | un módulo
  const [salud, setSalud] = useState([]);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setSalud(revisar());
    return bitacora.escuchar(() => repintar((n) => n + 1));
  }, []);

  const eventos = filtro === "todo" ? bitacora.todos()
    : filtro === "error" ? bitacora.errores()
    : bitacora.deModulo(filtro);

  const conFalla = salud.filter((s) => s.estado === "falla");
  const nErrores = bitacora.cuantosErrores();
  const modulos = [...new Set(bitacora.todos().map((e) => e.modulo))];

  const copiar = async () => {
    const texto = JSON.stringify(bitacora.exportar(salud), null, 2);
    try { await navigator.clipboard.writeText(texto); } catch (e) { /* sin portapapeles */ }
    setCopiado(true); setTimeout(() => setCopiado(false), 1800);
  };

  return (
    <div style={{ padding: "12px 14px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 20, fontWeight: 800, flex: 1 }}>Bitácora</div>
        <button onClick={() => setSalud(revisar())} title="Volver a revisar"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <RefreshCw size={19} color={COL.kraft} />
        </button>
        <button onClick={() => bitacora.limpiar()} title="Borrar eventos"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <Trash2 size={19} color={COL.kraft} />
        </button>
      </div>

      {/* Lo primero que se ve: ¿hay algo roto? */}
      <div style={{ ...tarjeta, padding: 14, marginBottom: 12,
        background: conFalla.length || nErrores ? "#F7E4E0" : "#E4F0E8" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          {conFalla.length || nErrores
            ? <AlertTriangle size={22} color={COL.chile} />
            : <CheckCircle2 size={22} color={COL.billete} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>
              {conFalla.length || nErrores
                ? `${conFalla.length} ${conFalla.length === 1 ? "módulo" : "módulos"} con falla · ${nErrores} ${nErrores === 1 ? "error" : "errores"}`
                : "Todo funcionando"}
            </div>
            <div style={{ fontSize: 12, color: COL.kraft, fontWeight: 600 }}>
              {salud.length} módulos revisados
            </div>
          </div>
        </div>
        {conFalla.length > 0 && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${COL.chile}` }}>
            {conFalla.map((s) => (
              <div key={s.id} style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>
                {s.nombre}
                {s.faltan.length > 0 && <span style={{ color: COL.chile }}> · le falta {s.faltan.join(", ")}</span>}
                {s.pruebas.filter((p) => !p.paso).map((p) => (
                  <span key={p.nombre} style={{ color: COL.chile }}> · {p.detalle}</span>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={copiar}
        style={{ width: "100%", padding: 13, borderRadius: 13, cursor: "pointer", fontFamily: "inherit",
          border: "none", background: COL.tinta, color: COL.papel, fontSize: 14, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
        <Copy size={17} /> {copiado ? "Copiado" : "Copiar todo para el agente"}
      </button>

      {/* Salud por módulo */}
      <div style={{ ...tarjeta, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 9 }}>Módulos</div>
        {salud.map((s) => (
          <div key={s.id} onClick={() => setFiltro(s.id)}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", cursor: "pointer",
              borderBottom: `1px solid ${COL.papel}` }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: colorEstado(s.estado), flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{s.nombre}</div>
              <div style={{ fontSize: 10.5, color: COL.kraft, fontWeight: 600 }}>
                {s.id} · v{s.version} · {s.tipo}
              </div>
            </div>
            {s.estado === "apagado" && <Power size={15} color={COL.kraft} />}
          </div>
        ))}
      </div>

      {/* Filtros y eventos */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {[{ id: "todo", t: "Todo" }, { id: "error", t: `Errores (${nErrores})` },
          ...modulos.map((m) => ({ id: m, t: m }))].map((f) => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            style={{ padding: "7px 11px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
              fontSize: 11.5, fontWeight: 800,
              border: `1.5px solid ${filtro === f.id ? COL.tinta : COL.kraft}`,
              background: filtro === f.id ? COL.tinta : "transparent",
              color: filtro === f.id ? COL.papel : COL.tinta }}>{f.t}</button>
        ))}
      </div>

      {eventos.length === 0
        ? <div style={{ textAlign: "center", padding: "30px 20px", color: COL.kraft, fontSize: 13, fontWeight: 600 }}>
            No hay nada que mostrar con ese filtro.
          </div>
        : eventos.slice(0, 80).map((e) => (
            <div key={e.id} style={{ ...tarjeta, padding: "10px 12px", marginBottom: 7,
              borderLeft: `4px solid ${e.nivel === "error" ? COL.chile : e.nivel === "aviso" ? COL.oro : COL.billete}` }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 10.5, color: COL.kraft, fontWeight: 700 }}>{hora(e.t)}</span>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: COL.tinta,
                  background: COL.papel, borderRadius: 7, padding: "2px 6px" }}>{e.modulo}</span>
                {e.ms != null && <span style={{ fontSize: 10, color: COL.kraft, fontWeight: 700 }}>{e.ms} ms</span>}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>{e.que}</div>
              {e.error && (
                <div style={{ fontSize: 11.5, color: COL.chile, fontWeight: 700, marginTop: 3, lineHeight: 1.35 }}>
                  {e.error.mensaje}
                </div>
              )}
              {e.detalle != null && (
                <div style={{ fontSize: 11, color: COL.kraft, fontWeight: 600, marginTop: 3,
                  wordBreak: "break-word", lineHeight: 1.35 }}>
                  {typeof e.detalle === "string" ? e.detalle : JSON.stringify(e.detalle)}
                </div>
              )}
            </div>
          ))}
    </div>
  );
}

// Atrapa lo que truene al pintar y lo manda a la bitácora con el módulo culpable,
// en vez de dejar la pantalla en blanco.
export class Guardia extends React.Component {
  constructor(p) { super(p); this.state = { muerto: null }; }
  static getDerivedStateFromError(e) { return { muerto: e }; }
  componentDidCatch(e, info) {
    bitacora.error(this.props.modulo || "pantalla", "tronó al pintar", e,
      { componente: (info?.componentStack || "").split("\n")[1]?.trim() });
  }
  render() {
    if (!this.state.muerto) return this.props.children;
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <AlertTriangle size={34} color={COL.chile} />
        <div style={{ fontSize: 16, fontWeight: 800, marginTop: 8 }}>
          Esta parte se cayó
        </div>
        <div style={{ fontSize: 13, color: COL.kraft, fontWeight: 600, marginTop: 6, lineHeight: 1.4 }}>
          Lo apunté en la bitácora. El resto de la app sigue funcionando.
        </div>
        <button onClick={() => this.setState({ muerto: null })}
          style={{ marginTop: 14, padding: "12px 22px", borderRadius: 13, cursor: "pointer",
            fontFamily: "inherit", border: "none", background: COL.billete, color: "#fff",
            fontSize: 14, fontWeight: 800 }}>
          Volver a intentar
        </button>
      </div>
    );
  }
}

export const moduloBitacora = {
  id: "bitacora", nombre: "Bitácora", version: "1.0", tipo: "pestaña",
  orden: 90, icono: Activity, pantalla: Bitacora,
  probar: () => {
    const antes = bitacora.todos().length;
    bitacora.paso("bitacora", "autoprueba");
    if (bitacora.todos().length !== antes + 1) return "no está guardando eventos";
    if (!bitacora.exportar().resumen) return "exportar no trae resumen";
    const inv = inventario();
    if (!Array.isArray(inv)) return "el inventario de módulos no es una lista";
    return true;
  },
};
