// Entrada única para las pruebas: así la app y el núcleo comparten instancia.
export { default as App } from "../src/App.jsx";
export { bitacora } from "../src/bitacora.jsx";
export { registrar, listar, quitar, revisar, inventario } from "../src/registro.jsx";
export { nuevo, validar, stockDe, tieneVariantes, comoSeLlama } from "../src/contrato.jsx";
export { recorta, moduloFoto } from "../src/fondo.jsx";
export { normalizaTel, telBonito, textoTicket, moduloTicket } from "../src/qr.jsx";
