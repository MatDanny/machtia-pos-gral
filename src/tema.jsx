// ============================================================
// nucleo/tema.jsx — la paleta y los estilos, definidos una sola vez.
// Mercado mexicano: papel kraft, tinta, verde billete. Dorado marca el nivel.
// ============================================================

export const COL = {
  papel: "#F5EFE3", tinta: "#20140A", kraft: "#C9A27A",
  billete: "#2F7D53", billeteD: "#245F40", chile: "#C4462E",
  crema: "#FBF7EF", sombra: "rgba(32,20,10,0.10)", oro: "#B8862B",
};

// Ancho máximo del lienzo. En celular ocupa todo; en pantalla grande se queda
// en una columna cómoda en vez de estirarse a lo ancho del monitor.
export const ANCHO_MAX = 560;

export const FUENTE = "'Trebuchet MS','Segoe UI',sans-serif";

export const inputStyle = {
  width: "100%", padding: 13, fontSize: 16, boxSizing: "border-box",
  border: `1.5px solid ${COL.kraft}`, borderRadius: 12, background: COL.papel,
  color: COL.tinta, fontFamily: "inherit", outline: "none", marginTop: 5,
};

export const labelStyle = { fontSize: 12, fontWeight: 700, color: COL.kraft };

export const tarjeta = {
  background: COL.crema, borderRadius: 16, boxShadow: `0 2px 0 ${COL.sombra}`,
};

// Color del estado de un módulo en la bitácora.
export const colorEstado = (e) =>
  e === "bien" ? COL.billete : e === "falla" ? COL.chile : COL.kraft;
