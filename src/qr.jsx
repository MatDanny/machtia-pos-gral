// ============================================================
// nucleo/qr.jsx — un código QR en pantalla, sin servidor ni internet.
//
// Se genera aquí mismo en el teléfono. Lo que va adentro es TEXTO, así
// que cualquier lector lo muestra: no hace falta que el cliente tenga
// la app ni que exista una página.
// ============================================================

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { COL } from "./tema.jsx";
import { bitacora } from "./bitacora.jsx";

export default function QR({ texto, tam = 220 }) {
  const [img, setImg] = useState(null);
  const [falla, setFalla] = useState(false);

  useEffect(() => {
    let vivo = true;
    if (!texto) return;
    QRCode.toDataURL(texto, { margin: 1, width: tam * 2, errorCorrectionLevel: "M",
      color: { dark: "#20140A", light: "#FFFFFF" } })
      .then((d) => { if (vivo) { setImg(d); setFalla(false); } })
      .catch((e) => { if (vivo) { setFalla(true); bitacora.error("qr", "no se pudo dibujar", e); } });
    return () => { vivo = false; };
  }, [texto, tam]);

  if (falla) {
    return (
      <div style={{ width: tam, height: tam, borderRadius: 14, background: COL.papel, display: "flex",
        alignItems: "center", justifyContent: "center", textAlign: "center", padding: 16,
        fontSize: 12, fontWeight: 700, color: COL.chile, lineHeight: 1.4 }}>
        No alcancé a dibujar el código. Está apuntado en la bitácora.
      </div>
    );
  }
  if (!img) {
    return <div style={{ width: tam, height: tam, borderRadius: 14, background: COL.papel }} />;
  }
  return <img src={img} alt="" width={tam} height={tam}
    style={{ borderRadius: 14, display: "block", background: "#fff" }} />;
}

// Arma el texto del ticket. Legible tal cual al escanearlo, sin página de por medio.
export function textoTicket(venta, negocio = "Mi negocio") {
  const l = (venta.lineas || []).map((x) =>
    `${x.cant} x ${x.nombre}${x.varTxt ? " (" + x.varTxt + ")" : ""}  $${(x.importe || 0).toFixed(2)}`);
  return [
    negocio,
    `${venta.fecha || ""} ${venta.hora || ""}`.trim(),
    "-".repeat(28),
    ...l,
    "-".repeat(28),
    `Total  $${(venta.total || 0).toFixed(2)}`,
    venta.forma && venta.forma !== "efectivo" ? `Pago: ${venta.forma}` : null,
  ].filter(Boolean).join("\n");
}

// Para que le depositen: datos en texto plano, que es lo que la gente copia.
export function textoCobro(cobro) {
  return [
    cobro.titular ? `A nombre de: ${cobro.titular}` : null,
    cobro.banco ? `Banco: ${cobro.banco}` : null,
    cobro.clabe ? `CLABE: ${cobro.clabe}` : null,
  ].filter(Boolean).join("\n");
}

// ------------------------------------------------------------
// El teléfono. WhatsApp necesita el número con lada de país y sin
// espacios ni guiones; si se lo mandas mal, abre el chat equivocado o
// no abre nada. Aquí se arregla una sola vez, en función pura, para
// poder probarla sin navegador.
//
// En México la gente teclea 10 dígitos. El 52 se lo ponemos nosotros.
// El viejo "1" después del 52 (521...) ya no se usa: hay que quitarlo.
// ------------------------------------------------------------
export function normalizaTel(tel) {
  const d = String(tel || "").replace(/\D/g, "");
  if (d.length === 10) return "52" + d;                       // como lo teclea la gente
  if (d.length === 13 && d.startsWith("521")) return "52" + d.slice(3);
  if (d.length === 12 && d.startsWith("52")) return d;        // ya traía lada de país
  if (d.length >= 11 && d.length <= 15) return d;             // otro país, ya completo
  return null;                                                // incompleto: no sirve
}

// Como se le enseña al vendedor: 55 1234 5678.
export function telBonito(tel) {
  const d = String(tel || "").replace(/\D/g, "");
  if (d.length !== 10) return d;
  return `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}`;
}

// Abre WhatsApp con el texto listo para mandar. Con número, abre el chat
// de ese cliente; sin número, WhatsApp pregunta a quién.
export function mandarPorWhatsApp(texto, tel) {
  const n = normalizaTel(tel);
  try {
    window.open("https://wa.me/" + (n || "") + "?text=" + encodeURIComponent(texto), "_blank");
    bitacora.paso("ticket", n ? "ticket mandado por whatsapp" : "whatsapp abierto para escoger contacto",
      n ? { tel: n } : undefined);
  } catch (e) {
    bitacora.error("ticket", "no se pudo abrir whatsapp", e);
  }
}

// ------------------------------------------------------------
// Pedir el teléfono ANTES de abrir WhatsApp. Si ya se lo sabe
// (cliente de fiado o apartado), viene puesto y solo se confirma.
// ------------------------------------------------------------
export function MandarWhatsApp({ texto, tel = "", onTel }) {
  const [t, setT] = useState(String(tel || "").replace(/\D/g, "").slice(-10));
  const listo = t.length === 10;

  const mandar = () => { if (onTel) onTel(t); mandarPorWhatsApp(texto, t); };

  return (
    <div style={{ marginTop: 12, textAlign: "left" }}>
      <label style={{ fontSize: 11, fontWeight: 800, color: COL.kraft, letterSpacing: 0.2 }}>
        Teléfono del cliente
      </label>
      <input inputMode="tel" value={t} placeholder="10 dígitos"
        onChange={(e) => setT(e.target.value.replace(/\D/g, "").slice(0, 10))}
        style={{ width: "100%", boxSizing: "border-box", marginTop: 5, padding: 13, borderRadius: 12,
          fontFamily: "inherit", fontSize: 19, fontWeight: 800, letterSpacing: 1.5, textAlign: "center",
          background: COL.papel, color: COL.tinta,
          border: `2px solid ${listo ? COL.billete : COL.kraft}`, outline: "none" }} />
      {listo && (
        <div style={{ fontSize: 11.5, fontWeight: 700, color: COL.billete, marginTop: 5, textAlign: "center" }}>
          {`Se lo mando al ${telBonito(t)}`}
        </div>
      )}

      <button onClick={() => listo && mandar()} disabled={!listo}
        style={{ width: "100%", marginTop: 10, padding: 14, borderRadius: 13,
          cursor: listo ? "pointer" : "default", fontFamily: "inherit", border: "none",
          background: listo ? COL.billete : COL.kraft, color: "#fff", fontSize: 14.5, fontWeight: 800 }}>
        Mandarlo por WhatsApp
      </button>

      <button onClick={() => mandarPorWhatsApp(texto)}
        style={{ width: "100%", marginTop: 7, padding: 10, borderRadius: 11, cursor: "pointer",
          fontFamily: "inherit", border: "none", background: "transparent", color: COL.kraft,
          fontSize: 12, fontWeight: 800 }}>
        No me sé su número, lo escojo en WhatsApp
      </button>
    </div>
  );
}

export const moduloTicket = {
  id: "ticket", nombre: "Ticket con QR y envío por WhatsApp", version: "1.1", tipo: "servicio",
  requiere: [],
  probar: () => {
    if (normalizaTel("55 1234 5678") !== "5255 1234 5678".replace(/\D/g, "")) return "no arma el número de 10 dígitos";
    if (normalizaTel("5215512345678") !== "525512345678") return "no quita el 1 viejo del 521";
    if (normalizaTel("525512345678") !== "525512345678") return "cambia un número que ya venía bien";
    if (normalizaTel("5512") !== null) return "acepta un número incompleto";
    if (normalizaTel("") !== null) return "acepta el teléfono vacío";
    if (telBonito("5512345678") !== "55 1234 5678") return "no separa el teléfono para leerlo";
    const t = textoTicket({ lineas: [{ cant: 2, nombre: "base", importe: 178 }], total: 178, fecha: "2026-10-02" });
    if (!t.includes("2 x base")) return "el ticket no trae las líneas";
    if (!t.includes("Total")) return "el ticket no trae el total";
    return true;
  },
};
