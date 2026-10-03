// ============================================================
// funcionalidades/f-caja.jsx — el dinero del día, en un solo lugar.
//
// Un vendedor no quiere saber "cuánto vendí": quiere saber CUÁNTO ME QUEDÓ.
// Para eso hay que restarle lo que gastó —la cuota del tianguis, el pasaje,
// la comida— y separar lo que entró en efectivo de lo que le depositaron.
//
// También vive aquí a dónde le depositan, para enseñárselo al cliente que
// paga por transferencia sin andar buscando la tarjeta.
// ============================================================

import React, { useState } from "react";
import { Wallet, Plus, Trash2, Banknote, Smartphone, CreditCard, Users, Landmark, Copy } from "lucide-react";
import { COL, tarjeta, inputStyle, labelStyle } from "./tema.jsx";
import { money } from "./contrato.jsx";
import { bitacora } from "./bitacora.jsx";

const hoy = () => new Date().toISOString().slice(0, 10);

const ICONO_FORMA = { efectivo: Banknote, tarjeta: CreditCard, transferencia: Smartphone, fiado: Users };

export default function Caja({ ventas, gastos, setGastos, cobro, setCobro }) {
  const [abriendo, setAbriendo] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const delDia = (ventas || []).filter((v) => v.fecha === hoy());
  const gastosHoy = (gastos || []).filter((g) => g.fecha === hoy());

  const vendido = delDia.reduce((s, v) => s + v.total, 0);
  const gastado = gastosHoy.reduce((s, g) => s + Number(g.monto || 0), 0);
  const quedo = vendido - gastado;

  const porForma = delDia.reduce((a, v) => {
    const f = v.forma || "efectivo"; a[f] = (a[f] || 0) + v.total; return a;
  }, {});
  const enMano = (porForma.efectivo || 0) - gastado;

  const quitar = (id) => {
    setGastos((gs) => gs.filter((g) => g.id !== id));
    bitacora.paso("caja", "gasto borrado", { id });
  };

  const copiarClabe = async () => {
    try { await navigator.clipboard.writeText(cobro.clabe || ""); } catch (e) { /* sin portapapeles */ }
    setCopiado(true); setTimeout(() => setCopiado(false), 1600);
  };

  return (
    <div style={{ padding: "12px 14px 20px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Caja</div>

      {/* Lo único que de verdad importa */}
      <div style={{ background: COL.tinta, color: COL.papel, borderRadius: 18, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.7 }}>Te quedó hoy</div>
        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1,
          color: quedo < 0 ? "#F2A69A" : COL.papel }}>{money(quedo)}</div>
        <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 12, fontWeight: 600, opacity: 0.8 }}>
          <span>Vendiste {money(vendido)}</span>
          <span>Gastaste {money(gastado)}</span>
        </div>
      </div>

      {/* Cuánto efectivo debe haber en la bolsa */}
      <div style={{ ...tarjeta, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 8 }}>Efectivo en mano</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: enMano < 0 ? COL.chile : COL.billete }}>{money(enMano)}</div>
        <div style={{ fontSize: 11.5, color: COL.kraft, fontWeight: 600, marginTop: 3, lineHeight: 1.35 }}>
          Lo que cobraste en efectivo menos lo que gastaste. Cuenta los billetes y compara.
        </div>
        {Object.keys(porForma).length > 0 && (
          <div style={{ display: "flex", gap: 7, marginTop: 11, flexWrap: "wrap" }}>
            {Object.entries(porForma).map(([f, m]) => {
              const Ic = ICONO_FORMA[f] || Banknote;
              return (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, background: COL.papel,
                  borderRadius: 10, padding: "7px 10px" }}>
                  <Ic size={14} color={COL.kraft} />
                  <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "capitalize" }}>{f}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 800 }}>{money(m)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gastos del día */}
      <div style={{ ...tarjeta, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 9 }}>Lo que gastaste hoy</div>

        {gastosHoy.length === 0
          ? <div style={{ fontSize: 12.5, color: COL.kraft, fontWeight: 600, lineHeight: 1.4 }}>
              Nada todavía. Apunta la cuota del puesto, el pasaje, la comida — lo que salga de tu bolsa.
            </div>
          : gastosHoy.map((g) => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                borderBottom: `1px solid ${COL.papel}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{g.concepto}</div>
                  <div style={{ fontSize: 10.5, color: COL.kraft, fontWeight: 600 }}>{g.hora}</div>
                </div>
                <span style={{ fontSize: 14.5, fontWeight: 800, color: COL.chile }}>−{money(g.monto)}</span>
                <Trash2 size={16} color={COL.chile} style={{ cursor: "pointer" }} onClick={() => quitar(g.id)} />
              </div>
            ))}

        <button onClick={() => setAbriendo(true)}
          style={{ width: "100%", marginTop: 11, padding: 12, borderRadius: 12, cursor: "pointer",
            fontFamily: "inherit", border: `2px dashed ${COL.kraft}`, background: "transparent",
            color: COL.tinta, fontSize: 13.5, fontWeight: 800, display: "flex",
            alignItems: "center", justifyContent: "center", gap: 7 }}>
          <Plus size={18} color={COL.chile} /> Apuntar un gasto
        </button>
      </div>

      {/* A dónde le depositan */}
      <div style={{ ...tarjeta, padding: 14 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 4, display: "flex", alignItems: "center", gap: 7 }}>
          <Landmark size={17} color={COL.kraft} /> Para que te depositen
        </div>
        <div style={{ fontSize: 11.5, color: COL.kraft, fontWeight: 600, marginBottom: 10, lineHeight: 1.35 }}>
          Esto es lo que se le enseña al cliente cuando paga por transferencia.
        </div>

        <label style={labelStyle}>A nombre de</label>
        <input value={cobro.titular || ""} onChange={(e) => setCobro({ ...cobro, titular: e.target.value })}
          placeholder="Tu nombre como aparece en el banco" style={inputStyle} />

        <div style={{ marginTop: 11 }}>
          <label style={labelStyle}>Banco</label>
          <input value={cobro.banco || ""} onChange={(e) => setCobro({ ...cobro, banco: e.target.value })}
            placeholder="BBVA, Banorte, Nu..." style={inputStyle} />
        </div>

        <div style={{ marginTop: 11 }}>
          <label style={labelStyle}>CLABE o número de tarjeta</label>
          <input inputMode="numeric" value={cobro.clabe || ""}
            onChange={(e) => setCobro({ ...cobro, clabe: e.target.value.replace(/\D/g, "").slice(0, 18) })}
            placeholder="18 dígitos" style={{ ...inputStyle, letterSpacing: 1 }} />
        </div>

        {cobro.clabe && (
          <button onClick={copiarClabe}
            style={{ width: "100%", marginTop: 11, padding: 12, borderRadius: 12, cursor: "pointer",
              fontFamily: "inherit", border: "none", background: COL.tinta, color: COL.papel,
              fontSize: 13.5, fontWeight: 800, display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8 }}>
            <Copy size={16} /> {copiado ? "Copiada" : "Copiar la clave"}
          </button>
        )}
      </div>

      {abriendo && <ModalGasto onCancel={() => setAbriendo(false)}
        onOk={(g) => {
          setGastos((gs) => [{ ...g, id: Date.now(), fecha: hoy(),
            hora: new Date().toTimeString().slice(0, 5) }, ...gs]);
          bitacora.paso("caja", "gasto apuntado", { concepto: g.concepto, monto: g.monto });
          setAbriendo(false);
        }} />}
    </div>
  );
}

// Los gastos que más se repiten, para no teclear.
const SUGERIDOS = ["Cuota del puesto", "Pasaje", "Comida", "Gasolina", "Bolsas", "Cambio"];

function ModalGasto({ onCancel, onOk }) {
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const listo = concepto.trim() && parseFloat(monto) > 0;

  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(32,20,10,0.5)", zIndex: 40,
      display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: COL.crema, width: "100%", maxWidth: 560,
        borderRadius: "24px 24px 0 0", padding: "20px 18px calc(20px + env(safe-area-inset-bottom))",
        maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, background: COL.kraft, borderRadius: 4, margin: "0 auto 16px", opacity: 0.5 }} />

        <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 12 }}>¿En qué gastaste?</div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {SUGERIDOS.map((s) => (
            <button key={s} onClick={() => setConcepto(s)}
              style={{ padding: "9px 12px", borderRadius: 11, cursor: "pointer", fontSize: 13, fontWeight: 700,
                fontFamily: "inherit", border: `2px solid ${concepto === s ? COL.billete : COL.kraft}`,
                background: concepto === s ? "#E4F0E8" : COL.papel,
                color: concepto === s ? COL.billete : COL.tinta }}>{s}</button>
          ))}
        </div>

        <input value={concepto} onChange={(e) => setConcepto(e.target.value)}
          placeholder="O escríbelo tú" style={inputStyle} />

        <div style={{ marginTop: 12 }}>
          <label style={{ ...labelStyle, color: COL.chile }}>Cuánto</label>
          <input inputMode="decimal" value={monto} autoFocus
            onChange={(e) => setMonto(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0.00"
            style={{ ...inputStyle, fontSize: 26, fontWeight: 800, textAlign: "center", padding: 14 }} />
        </div>

        <button onClick={() => listo && onOk({ concepto: concepto.trim(), monto: parseFloat(monto) })}
          disabled={!listo}
          style={{ width: "100%", marginTop: 16, padding: 16, fontSize: 17, fontWeight: 800,
            background: listo ? COL.chile : COL.kraft, color: "#fff", border: "none", borderRadius: 14,
            cursor: listo ? "pointer" : "default", fontFamily: "inherit" }}>
          Apuntar el gasto
        </button>
      </div>
    </div>
  );
}

export const moduloCaja = {
  id: "caja", nombre: "Caja", version: "1.0", tipo: "pestaña", orden: 45,
  icono: Wallet, requiere: [],
  pantalla: ({ ctx }) => <Caja {...ctx} />,
  probar: () => {
    if (money(0) !== "$0.00") return "money no formatea el cero";
    if (!Array.isArray(SUGERIDOS) || SUGERIDOS.length < 3) return "faltan los gastos sugeridos";
    return true;
  },
};
