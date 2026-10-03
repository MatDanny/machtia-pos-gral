// Punto de arranque. Monta el orquestador y prepara el modo sin internet.
// Las versiones nuevas NO se aplican solas: ver actualizacion.jsx.
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { prepararActualizaciones } from "./actualizacion.jsx";

createRoot(document.getElementById("raiz")).render(<App />);

window.addEventListener("load", prepararActualizaciones);
