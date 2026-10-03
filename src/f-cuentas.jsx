// ============================================================
// funcionalidades/f-cuentas.jsx — lo que la gente debe.
//
// Dos cosas distintas que el comercio informal usa todos los días y que
// NO se pueden mezclar:
//
//   FIADO     se llevó la mercancía hoy y paga después.
//             El inventario ya bajó. Si no paga, perdiste el producto.
//
//   APARTADO  paga en abonos y se la lleva cuando termine.
//             La mercancía sigue en tu poder pero RESERVADA: no se le
//             puede vender a nadie más. Sale del inventario al entregar.
//
// Por eso existe "disponible" aparte de "existencia" en el contrato.
// ============================================================

import React, { useState } from "react";
import { Users, HandCoins, PackageCheck, Plus, Check, Phone, Archive } from "lucide-react";
import { COL, tarjeta, inputStyle, labelStyle } from "./tema.jsx";
import { money, pagadoDe, restaDe, estaLiquidada, sePuedeEntregar } from "./contrato.jsx";
import { bitacora } from "./bitacora.jsx";

const hoy = () => new Date().toISOString().slice(0, 10);
const dias = (f) => { try { return Math.floor((Date.now() - new Date(f)) / 86400000); } catch (e) { return 0; } };

export default function Cuentas({ cuentas, abonar, entregar, clientes }) {
  const [filtro, setFiltro] = useState("todo");   // todo | fiado | apartado | liquidadas
  const [abonando, setAbonando] = useState(null);

  const abiertas = (cuentas || []).filter((c) => !c.entregado && (!estaLiquidada(c) || c.tipo === "apartado"));
  const deben = (cuentas || []).filter((c) => c.tipo === "fiado" && !estaLiquidada(c))
    .reduce((s, c) => s + restaDe(c), 0);
  const apartado = (cuentas || []).filter((c) => c.tipo === "apartado" && !c.entregado)
    .reduce((s, c) => s + restaDe(c), 0);
  const listosParaEntregar = (cuentas || []).filter(sePuedeEntregar);

  const lista = (cuentas || []).filter((c) => {
    if (filtro === "fiado") return c.tipo === "fiado" && !estaLiquidada(c);
    if (filtro === "apartado") return c.tipo === "apartado" && !c.entregado;
    if (filtro === "liquidadas") return estaLiquidada(c) && (c.tipo === "fiado" || c.entregado);
    return !c.entregado && !(c.tipo === "fiado" && estaLiquidada(c));
  });

  return (
    <div style={{ padding: "12px 14px 20px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Cuentas</div>

      <div style={{ display: "flex", gap: 9, marginBottom: 12 }}>
        <div style={{ ...tarjeta, flex: 1, padding: 13 }}>
          <div style={{ fontSize: 11.5, color: COL.kraft, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
            <HandCoins size={14} /> Te deben
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: deben > 0 ? COL.chile : COL.tinta }}>{money(deben)}</div>
          <div style={{ fontSize: 10.5, color: COL.kraft, fontWeight: 600 }}>ya se lo llevaron</div>
        </div>
        <div style={{ ...tarjeta, flex: 1, padding: 13 }}>
          <div style={{ fontSize: 11.5, color: COL.kraft, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
            <Archive size={14} /> Apartado
          </div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{money(apartado)}</div>
          <div style={{ fontSize: 10.5, color: COL.kraft, fontWeight: 600 }}>falta por cobrar</div>
        </div>
      </div>

      {listosParaEntregar.length > 0 && (
        <div style={{ background: "#E4F0E8", border: `1.5px solid ${COL.billete}`, borderRadius: 14,
          padding: 12, marginBottom: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <PackageCheck size={18} color={COL.billete} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.4 }}>
            {listosParaEntregar.length === 1
              ? "Hay un apartado ya pagado, listo para entregar."
              : `Hay ${listosParaEntregar.length} apartados ya pagados, listos para entregar.`}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 11, flexWrap: "wrap" }}>
        {[{ id: "todo", t: "Todo" }, { id: "fiado", t: "Fiado" },
          { id: "apartado", t: "Apartados" }, { id: "liquidadas", t: "Ya pagadas" }].map((x) => (
          <button key={x.id} onClick={() => setFiltro(x.id)}
            style={{ padding: "8px 13px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit",
              fontSize: 12.5, fontWeight: 800,
              border: `1.5px solid ${filtro === x.id ? COL.tinta : COL.kraft}`,
              background: filtro === x.id ? COL.tinta : "transparent",
              color: filtro === x.id ? COL.papel : COL.tinta }}>{x.t}</button>
        ))}
      </div>

      {lista.length === 0
        ? <div style={{ textAlign: "center", padding: "40px 20px", color: COL.kraft }}>
            <Users size={34} />
            <div style={{ fontSize: 15, fontWeight: 700, color: COL.tinta, marginTop: 10 }}>No hay nada aquí</div>
            <div style={{ fontSize: 12.5, marginTop: 4, lineHeight: 1.4 }}>
              Las cuentas se abren al cobrar: escoge Fiado o Apartado en vez de efectivo.
            </div>
          </div>
        : lista.map((c) => {
            const resta = restaDe(c);
            const pagado = pagadoDe(c);
            const avance = c.total > 0 ? Math.min(100, (pagado / c.total) * 100) : 0;
            const puedeEntregar = sePuedeEntregar(c);
            const viejo = c.tipo === "fiado" && dias(c.fecha) > 30;
            return (
              <div key={c.id} style={{ ...tarjeta, padding: 13, marginBottom: 9,
                borderLeft: `4px solid ${puedeEntregar ? COL.billete : viejo ? COL.chile : COL.kraft}` }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{c.cliente}</div>
                    <div style={{ fontSize: 11, color: COL.kraft, fontWeight: 700 }}>
                      {c.tipo === "fiado" ? "Fiado" : "Apartado"} · hace {dias(c.fecha)} {dias(c.fecha) === 1 ? "día" : "días"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: resta > 0 ? COL.chile : COL.billete }}>
                      {resta > 0 ? money(resta) : "Pagado"}
                    </div>
                    {resta > 0 && <div style={{ fontSize: 10, color: COL.kraft, fontWeight: 700 }}>de {money(c.total)}</div>}
                  </div>
                </div>

                {(c.lineas || []).length > 0 && (
                  <div style={{ fontSize: 11.5, color: COL.kraft, fontWeight: 600, marginTop: 5, lineHeight: 1.35 }}>
                    {c.lineas.map((l) => `${l.cant} ${l.nombre}`).join(" · ")}
                  </div>
                )}

                <div style={{ height: 6, borderRadius: 3, background: COL.papel, overflow: "hidden", margin: "9px 0 4px" }}>
                  <div style={{ height: "100%", width: `${avance}%`, background: resta > 0 ? COL.oro : COL.billete }} />
                </div>
                <div style={{ fontSize: 10.5, color: COL.kraft, fontWeight: 700 }}>
                  {`Lleva pagado ${money(pagado)} de ${money(c.total)}`}
                </div>

                <div style={{ display: "flex", gap: 7, marginTop: 11 }}>
                  {resta > 0 && (
                    <button onClick={() => setAbonando(c)}
                      style={{ flex: 1, padding: 11, borderRadius: 11, cursor: "pointer", fontFamily: "inherit",
                        border: "none", background: COL.billete, color: "#fff", fontSize: 13.5, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Plus size={16} /> Abonar
                    </button>
                  )}
                  {puedeEntregar && (
                    <button onClick={() => entregar(c.id)}
                      style={{ flex: 1, padding: 11, borderRadius: 11, cursor: "pointer", fontFamily: "inherit",
                        border: "none", background: COL.tinta, color: COL.papel, fontSize: 13.5, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <PackageCheck size={16} /> Entregar
                    </button>
                  )}
                </div>
              </div>
            );
          })}

      {abonando && <ModalAbono cuenta={abonando} onCancel={() => setAbonando(null)}
        onOk={(monto) => { abonar(abonando.id, monto); setAbonando(null); }} />}
    </div>
  );
}

function ModalAbono({ cuenta, onCancel, onOk }) {
  const resta = restaDe(cuenta);
  const [val, setVal] = useState("");
  const monto = parseFloat(val || "0");
  const tecla = (t) => {
    if (t === "←") return setVal((v) => v.slice(0, -1));
    if (t === "." && val.includes(".")) return;
    setVal((v) => (v + t).slice(0, 8));
  };
  const queda = Math.max(0, resta - monto);

  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(32,20,10,0.5)", zIndex: 40,
      display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: COL.crema, width: "100%", maxWidth: 560,
        borderRadius: "24px 24px 0 0", padding: "20px 18px calc(20px + env(safe-area-inset-bottom))",
        maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, background: COL.kraft, borderRadius: 4, margin: "0 auto 16px", opacity: 0.5 }} />

        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 19, fontWeight: 800 }}>{cuenta.cliente}</div>
          <div style={{ fontSize: 12.5, color: COL.kraft, fontWeight: 700 }}>{`Debe ${money(resta)}`}</div>
        </div>

        <div style={{ background: COL.papel, borderRadius: 14, padding: "16px 14px", textAlign: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1 }}>{money(monto)}</div>
          {monto > 0 && (
            <div style={{ fontSize: 12.5, fontWeight: 700, color: queda > 0 ? COL.kraft : COL.billete, marginTop: 2 }}>
              {queda > 0 ? `Le quedarían ${money(queda)}` : "Queda liquidada"}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <button onClick={() => setVal(String(resta))}
            style={{ flex: 1, padding: 11, fontSize: 13, fontWeight: 800, background: "#E4F0E8",
              border: `1.5px solid ${COL.billete}`, borderRadius: 11, cursor: "pointer",
              color: COL.billete, fontFamily: "inherit" }}>{`Todo (${money(resta)})`}</button>
          {[50, 100, 200].map((v) => (
            <button key={v} onClick={() => setVal(String(v))}
              style={{ flex: 1, padding: 11, fontSize: 13, fontWeight: 800, background: COL.papel,
                border: `1.5px solid ${COL.kraft}`, borderRadius: 11, cursor: "pointer",
                color: COL.tinta, fontFamily: "inherit" }}>{money(v)}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {["1","2","3","4","5","6","7","8","9",".","0","←"].map((t) => (
            <button key={t} onClick={() => tecla(t)} style={{ padding: "15px 0", fontSize: 22, fontWeight: 800,
              background: COL.papel, border: `1.5px solid ${COL.kraft}`, borderRadius: 12, cursor: "pointer",
              color: COL.tinta, fontFamily: "inherit" }}>{t}</button>
          ))}
        </div>

        <button onClick={() => monto > 0 && onOk(monto)} disabled={monto <= 0}
          style={{ width: "100%", marginTop: 12, padding: 16, fontSize: 17, fontWeight: 800,
            background: monto > 0 ? COL.billete : COL.kraft, color: "#fff", border: "none", borderRadius: 14,
            cursor: monto > 0 ? "pointer" : "default", fontFamily: "inherit", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Check size={19} /> Apuntar el abono
        </button>
      </div>
    </div>
  );
}

export const moduloCuentas = {
  id: "cuentas", nombre: "Cuentas", version: "1.0", tipo: "pestaña", orden: 35,
  icono: Users, nivelMin: "1.3", requiere: [],
  pantalla: ({ ctx }) => <Cuentas {...ctx} />,
  probar: () => {
    const c = { tipo: "apartado", total: 300, abonos: [{ monto: 100 }, { monto: 200 }], entregado: false };
    if (pagadoDe(c) !== 300) return "pagadoDe no suma los abonos";
    if (restaDe(c) !== 0) return "restaDe no llega a cero";
    if (!sePuedeEntregar(c)) return "un apartado pagado debería poder entregarse";
    const f = { tipo: "fiado", total: 100, abonos: [], entregado: false };
    if (sePuedeEntregar(f)) return "un fiado no se entrega: ya se lo llevaron";
    if (restaDe({ total: 50, abonos: [{ monto: 80 }] }) !== 0) return "restaDe no debería dar negativo";
    return true;
  },
};
