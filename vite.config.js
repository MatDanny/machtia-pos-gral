import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Puerto propio, lejos del 5173 que usan casi todos los proyectos de Vite.
    // strictPort hace que si está ocupado AVISE y se detenga, en vez de brincarse
    // al siguiente en silencio y dejar el túnel apuntando al puerto equivocado.
    port: 5180,
    strictPort: true,
    // Vite 6 rechaza las peticiones cuyo nombre de dominio no conoce y responde
    // "Blocked request. This host is not allowed." Al entrar por el túnel, el
    // dominio es el de trycloudflare, no localhost, así que hay que permitirlo.
    // El punto inicial cubre el dominio y todos sus subdominios.
    // Si algún día le pones una dirección fija, agrégala a esta lista.
    allowedHosts: [".trycloudflare.com", ".machtia.mx"],
  },
  build: { outDir: "dist", sourcemap: true },
});
