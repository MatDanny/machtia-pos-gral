// ============================================================
// nucleo/fondo.jsx — quitarle el fondo a la foto del producto.
//
// Por qué a mano y no con una librería: la más usada
// (@imgly/background-removal) es AGPLv3, o sea que si la sirves por
// internet quedas obligado a entregar el código de TODA la app. Y los
// modelos RMBG de BRIA son de uso no comercial. Las dos descartadas
// para un producto que se vende.
//
// Esto recorta por COLOR desde los bordes: funciona cuando la foto se
// toma sobre una superficie lisa (una hoja, la mesa, una cartulina).
// No pesa nada, no descarga nada y es instantáneo.
//
// La capa de verdad —un modelo que recorta cualquier foto— es
// U-2-Net (Apache 2.0) con transformers.js, ~5 MB que se bajan una vez.
// Va como función de nivel de pago porque el costo es la descarga.
// ============================================================

import React, { useState, useRef, useEffect } from "react";
import { Camera, Check, X, Wand2, RotateCcw, CameraOff } from "lucide-react";
import { COL } from "./tema.jsx";
import { bitacora } from "./bitacora.jsx";

// ------------------------------------------------------------
// El motor. Función pura sobre los píxeles: no toca el navegador,
// así que se puede probar sin cámara ni canvas.
//
// Marca como fondo todo lo que se parezca al color de las orillas y
// esté pegado a ellas. Lo de en medio que no se parece es el producto.
// Devuelve la máscara y el recuadro donde quedó el producto.
// ------------------------------------------------------------
export function recorta(datos, ancho, alto, tolerancia = 42) {
  const n = ancho * alto;
  const fondo = new Uint8Array(n);        // 1 = es fondo
  const visto = new Uint8Array(n);
  const pila = [];

  // El color del fondo se estima con las orillas, que es donde casi
  // nunca está el producto.
  let sr = 0, sg = 0, sb = 0, c = 0;
  const mirar = (x, y) => { const i = (y * ancho + x) * 4;
    sr += datos[i]; sg += datos[i + 1]; sb += datos[i + 2]; c++; };
  for (let x = 0; x < ancho; x++) { mirar(x, 0); mirar(x, alto - 1); }
  for (let y = 0; y < alto; y++) { mirar(0, y); mirar(ancho - 1, y); }
  const fr = sr / c, fg = sg / c, fb = sb / c;

  const seParece = (i) => {
    const d = Math.abs(datos[i * 4] - fr) + Math.abs(datos[i * 4 + 1] - fg) + Math.abs(datos[i * 4 + 2] - fb);
    return d / 3 <= tolerancia;
  };

  // Se empieza por todas las orillas y se va hacia adentro.
  for (let x = 0; x < ancho; x++) { pila.push(x); pila.push((alto - 1) * ancho + x); }
  for (let y = 0; y < alto; y++) { pila.push(y * ancho); pila.push(y * ancho + ancho - 1); }

  while (pila.length) {
    const i = pila.pop();
    if (visto[i]) continue;
    visto[i] = 1;
    if (!seParece(i)) continue;            // aquí empieza el producto: no se sigue
    fondo[i] = 1;
    const x = i % ancho, y = (i - x) / ancho;
    if (x > 0) pila.push(i - 1);
    if (x < ancho - 1) pila.push(i + 1);
    if (y > 0) pila.push(i - ancho);
    if (y < alto - 1) pila.push(i + ancho);
  }

  // Dónde quedó el producto, para recortar lo que sobra.
  let x0 = ancho, y0 = alto, x1 = -1, y1 = -1;
  for (let i = 0; i < n; i++) {
    if (fondo[i]) continue;
    const x = i % ancho, y = (i - x) / ancho;
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const hayProducto = x1 >= x0 && y1 >= y0;
  const quitado = fondo.reduce((a, v) => a + v, 0) / n;

  return { fondo, hayProducto,
    caja: hayProducto ? { x0, y0, x1, y1 } : { x0: 0, y0: 0, x1: ancho - 1, y1: alto - 1 },
    quitado };
}

// ------------------------------------------------------------
// La parte que sí usa el navegador: recibe una imagen y devuelve otra
// cuadrada, recortada al producto y con el fondo del color que pidas.
// ------------------------------------------------------------
export async function limpiarFoto(src, { tolerancia = 42, fondo = "#FFFFFF", lado = 600 } = {}) {
  const img = await new Promise((ok, mal) => {
    const im = new Image();
    im.onload = () => ok(im); im.onerror = mal; im.src = src;
  });

  // Se trabaja en chico para que un teléfono modesto no sufra.
  const esc = Math.min(1, 700 / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * esc));
  const h = Math.max(1, Math.round(img.height * esc));

  const c1 = document.createElement("canvas");
  c1.width = w; c1.height = h;
  const x1 = c1.getContext("2d", { willReadFrequently: true });
  x1.drawImage(img, 0, 0, w, h);
  const imgd = x1.getImageData(0, 0, w, h);

  const r = recorta(imgd.data, w, h, tolerancia);
  for (let i = 0; i < w * h; i++) if (r.fondo[i]) imgd.data[i * 4 + 3] = 0;
  x1.putImageData(imgd, 0, 0);

  // Cuadrada, con el producto centrado y un respiro alrededor.
  const cw = r.caja.x1 - r.caja.x0 + 1;
  const ch = r.caja.y1 - r.caja.y0 + 1;
  const ladoCaja = Math.max(cw, ch) * 1.12;

  const c2 = document.createElement("canvas");
  c2.width = lado; c2.height = lado;
  const x2 = c2.getContext("2d");
  if (fondo !== "transparente") { x2.fillStyle = fondo; x2.fillRect(0, 0, lado, lado); }
  x2.drawImage(c1,
    r.caja.x0 - (ladoCaja - cw) / 2, r.caja.y0 - (ladoCaja - ch) / 2, ladoCaja, ladoCaja,
    0, 0, lado, lado);

  return { foto: c2.toDataURL(fondo === "transparente" ? "image/png" : "image/jpeg", 0.88),
    quitado: r.quitado, hayProducto: r.hayProducto };
}

// ------------------------------------------------------------
// La pantalla: tomar la foto, verla limpia, ajustar y guardar.
// ------------------------------------------------------------
export function TomarFoto({ onCancel, onOk }) {
  const videoRef = useRef(null);
  const [camaraOk, setCamaraOk] = useState(null);
  const [cruda, setCruda] = useState(null);
  const [limpia, setLimpia] = useState(null);
  const [tol, setTol] = useState(42);
  const [fondo, setFondo] = useState("#FFFFFF");
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    let stream, vivo = true;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!vivo) return stream.getTracks().forEach((t) => t.stop());
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        setCamaraOk(true);
      } catch (e) { setCamaraOk(false); bitacora.aviso("foto", "no se pudo abrir la cámara", String(e)); }
    })();
    return () => { vivo = false; if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, []);

  // Cada vez que cambias el ajuste, se vuelve a limpiar la misma foto.
  useEffect(() => {
    if (!cruda) return;
    let vivo = true;
    setTrabajando(true);
    limpiarFoto(cruda, { tolerancia: tol, fondo })
      .then((r) => { if (!vivo) return;
        setLimpia(r.foto); setTrabajando(false);
        bitacora.paso("foto", "fondo quitado", { quitado: Math.round(r.quitado * 100) + "%" }); })
      .catch((e) => { if (!vivo) return;
        setTrabajando(false); setLimpia(cruda);
        bitacora.error("foto", "no se pudo quitar el fondo", e); });
    return () => { vivo = false; };
  }, [cruda, tol, fondo]);

  const disparar = () => {
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth || 640; c.height = v.videoHeight || 480;
    c.getContext("2d").drawImage(v, 0, 0);
    setCruda(c.toDataURL("image/jpeg", 0.92));
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 70, maxWidth: 560, margin: "0 auto",
      display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", flex: 1, overflow: "hidden", background: COL.papel }}>
        {!cruda ? (
          <>
            <video ref={videoRef} playsInline muted
              style={{ width: "100%", height: "100%", objectFit: "cover", display: camaraOk ? "block" : "none" }} />
            {camaraOk === false && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", color: COL.tinta, padding: 30,
                textAlign: "center", gap: 10 }}>
                <CameraOff size={42} color={COL.kraft} />
                <div style={{ fontSize: 16, fontWeight: 800 }}>No pude abrir la cámara</div>
                <div style={{ fontSize: 13, color: COL.kraft, fontWeight: 600 }}>Dale permiso y vuelve a entrar.</div>
              </div>
            )}
            {camaraOk && (
              <div style={{ position: "absolute", inset: "14% 10%", border: `3px solid ${COL.billete}`,
                borderRadius: 20, boxShadow: "0 0 0 2000px rgba(0,0,0,0.35)" }} />
            )}
          </>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", padding: 16 }}>
            <img src={limpia || cruda} alt=""
              style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 16,
                opacity: trabajando ? 0.5 : 1, transition: "opacity .15s" }} />
          </div>
        )}

        <button onClick={onCancel} style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,0.55)",
          border: "none", borderRadius: 12, padding: 9, cursor: "pointer" }}>
          <X size={22} color="#fff" />
        </button>
      </div>

      <div style={{ background: COL.crema, padding: "16px 18px calc(18px + env(safe-area-inset-bottom))",
        borderRadius: "20px 20px 0 0" }}>
        {!cruda ? (
          <>
            <div style={{ fontSize: 14.5, fontWeight: 800, textAlign: "center" }}>
              Ponlo sobre algo liso
            </div>
            <div style={{ fontSize: 12.5, color: COL.kraft, fontWeight: 600, textAlign: "center",
              marginTop: 3, lineHeight: 1.35 }}>
              Una hoja blanca, la mesa, una cartulina. Entre más parejo el fondo, mejor queda el recorte.
            </div>
            <button onClick={disparar} disabled={!camaraOk}
              style={{ width: "100%", marginTop: 14, padding: 17, fontSize: 17, fontWeight: 800,
                background: camaraOk ? COL.billete : COL.kraft, color: "#fff", border: "none", borderRadius: 16,
                cursor: camaraOk ? "pointer" : "default", fontFamily: "inherit", display: "flex",
                alignItems: "center", justifyContent: "center", gap: 9 }}>
              <Camera size={21} /> Tomar la foto
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, fontWeight: 800, color: COL.kraft, display: "flex",
              alignItems: "center", gap: 6, marginBottom: 7 }}>
              <Wand2 size={15} /> {trabajando ? "Quitando el fondo..." : "Ajusta hasta que se vea bien"}
            </div>
            <input type="range" min="12" max="90" value={tol}
              onChange={(e) => setTol(Number(e.target.value))}
              style={{ width: "100%", accentColor: COL.billete }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5,
              color: COL.kraft, fontWeight: 700, marginTop: -2 }}>
              <span>quita menos</span><span>quita más</span>
            </div>

            <div style={{ display: "flex", gap: 6, marginTop: 11 }}>
              {[{ v: "#FFFFFF", t: "Blanco" }, { v: "#F5EFE3", t: "Papel" }, { v: "transparente", t: "Sin fondo" }].map((o) => (
                <button key={o.v} onClick={() => setFondo(o.v)}
                  style={{ flex: 1, padding: 10, borderRadius: 11, cursor: "pointer", fontFamily: "inherit",
                    fontSize: 12.5, fontWeight: 800,
                    border: `2px solid ${fondo === o.v ? COL.billete : COL.kraft}`,
                    background: fondo === o.v ? "#E4F0E8" : "transparent",
                    color: fondo === o.v ? COL.billete : COL.tinta }}>{o.t}</button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => { setCruda(null); setLimpia(null); }}
                style={{ flex: 1, padding: 15, borderRadius: 14, cursor: "pointer", fontFamily: "inherit",
                  border: `2px solid ${COL.kraft}`, background: "transparent", color: COL.tinta,
                  fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 7 }}>
                <RotateCcw size={17} /> Otra vez
              </button>
              <button onClick={() => onOk(limpia || cruda)} disabled={trabajando}
                style={{ flex: 1.4, padding: 15, borderRadius: 14, cursor: trabajando ? "default" : "pointer",
                  fontFamily: "inherit", border: "none", background: trabajando ? COL.kraft : COL.billete,
                  color: "#fff", fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 7 }}>
                <Check size={19} /> Usar esta
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const moduloFoto = {
  id: "foto", nombre: "Foto con recorte de fondo", version: "1.0", tipo: "servicio",
  requiere: [],
  probar: () => {
    // Un cuadro de 9x9 con fondo claro y un bloque oscuro de 3x3 en medio.
    const w = 9, h = 9, d = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      const x = i % w, y = (i - x) / w;
      const dentro = x >= 3 && x <= 5 && y >= 3 && y <= 5;
      const v = dentro ? 20 : 240;
      d[i * 4] = v; d[i * 4 + 1] = v; d[i * 4 + 2] = v; d[i * 4 + 3] = 255;
    }
    const r = recorta(d, w, h, 40);
    if (!r.hayProducto) return "no encontró el producto en el cuadro de prueba";
    const c = r.caja;
    if (c.x0 !== 3 || c.y0 !== 3 || c.x1 !== 5 || c.y1 !== 5)
      return `el recuadro salió en ${c.x0},${c.y0}-${c.x1},${c.y1} en vez de 3,3-5,5`;
    if (r.quitado < 0.8) return "debería haber quitado la mayor parte del cuadro";
    // Con tolerancia muy baja no debe quitar nada: el fondo ya no "se parece".
    const r2 = recorta(d, w, h, 1);
    if (r2.quitado > 0.95) return "con tolerancia mínima no debería barrer todo";
    return true;
  },
};
