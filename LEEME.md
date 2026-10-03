# Mi negocio — punto de venta para negocios pequeños

PWA en React. Vive en el teléfono, funciona sin internet, se instala desde un
link sin pasar por la tienda de aplicaciones.

---

## Lo primero que hay que saber

**La cámara y el lector de códigos de barras sólo funcionan en HTTPS.**
No sirve abrir el archivo ni entrar por `http://192.168.x.x`. Chrome bloquea
`getUserMedia` y `BarcodeDetector` fuera de un sitio seguro. Por eso todo lo
de abajo gira alrededor de tener HTTPS, incluso para probar.

La única excepción es `localhost` en la propia computadora, pero ahí no hay
cámara trasera ni lector útil.

---

## Instalar, una sola vez

```
cd C:\dev\pos-informal
npm install
```

Necesitas Node 18 o más nuevo. Ya tienes `cloudflared` y `wrangler` de la
clínica; si no, `npm i -g wrangler`.

---

## Trabajar en la computadora

```
npm run dev
```

Abre `http://localhost:5173`. Sirve para todo menos cámara y lector.

## Probar en el celular (lo que de verdad importa)

En otra terminal, con `npm run dev` corriendo:

```
npm run tunel
```

`cloudflared` te imprime una dirección tipo `https://algo-raro.trycloudflare.com`.
Ábrela en el Chrome del celular: ahí sí hay HTTPS, así que la cámara y el
lector funcionan. El túnel muere al cerrar la terminal; cada vez da una
dirección distinta.

Para instalarla como app: menú de Chrome → *Agregar a la pantalla principal*.

## Publicar

```
npm run subir
```

Compila y sube a Cloudflare Pages. La primera vez pregunta si crear el
proyecto; di que sí. Queda en `https://pos-informal.pages.dev`, con HTTPS,
gratis, y ésa es la dirección que le pasas a un vendedor para que la instale.

Si prefieres que se publique solo al hacer `git push`, conecta el repo desde
el panel de Cloudflare Pages: *Workers y Pages → Crear → Pages → Conectar a Git*.
Comando de compilación `npm run build`, carpeta de salida `dist`.

---

## Cómo está armado

```
src/
  main.jsx        arranca la app y prepara el modo sin internet
  App.jsx         el ORQUESTADOR: no sabe qué pantallas existen, las lee del registro

  bitacora.jsx    NÚCLEO · todo lo que pasa, con el módulo que lo produjo
  registro.jsx    NÚCLEO · alta, baja y revisión de funcionalidades
  contrato.jsx    NÚCLEO · los campos, definidos una sola vez
  tema.jsx        NÚCLEO · paleta y estilos

  f-bitacora.jsx  pantalla donde se ve qué pasó
  vision.jsx      el agente que mira la foto y propone el alta
public/
  sw.js           deja usar la app sin internet
  manifest.webmanifest, icono.svg
```

### Agregar una funcionalidad

No se toca `App.jsx`. Se registra un módulo:

```jsx
registrar({
  id: "mi-cosa",
  nombre: "Mi cosa",
  tipo: "pestaña",
  orden: 60,
  icono: AlgunIcono,
  requiere: ["catalogo"],
  pantalla: ({ ctx }) => <MiCosa {...ctx} />,
  probar: () => {
    // devuelve true si todo bien, o un texto diciendo qué falló
    return true;
  },
});
```

La pestaña aparece sola. Si quitas algo de lo que otro módulo depende, el
registro se niega y lo apunta.

### Cuando algo falle

No abras la consola. Entra a la pestaña **Bitácora**: arriba dice qué módulos
están en falla y por qué, abajo están los eventos filtrables por módulo. El
botón *Copiar todo para el agente* entrega un JSON con la salud de todo y los
últimos 200 eventos.

Si una pantalla truena, se aísla sola: sale "esta parte se cayó", el resto de
la app sigue viva y el error queda apuntado con su módulo.

Regla: **ninguna funcionalidad escribe en `console.log`.** Todo pasa por
`bitacora.paso`, `bitacora.aviso` o `bitacora.error`.

---

## Lo que todavía es maqueta

- **El agente de visión no mira la cámara.** `vision.jsx` devuelve tres casos
  fijos, medidos de fotos reales del mostrador. Al conectar el servidor, se
  cambia `analizarFoto` por `POST /alta/vision` y nada más se toca.
- **El catálogo compartido** son seis códigos escritos a mano.
- **La búsqueda en internet** son cinco fichas escritas a mano.
- Los datos viven sólo en este teléfono. El respaldo en la nube es del nivel 3
  y todavía no existe.

---

## Pendiente antes de que lo use alguien que no seas tú

**Aviso de privacidad.** En cuanto se activa el fiado se guardan nombres y
adeudos de clientes, y en cuanto la foto se manda a procesar entra un tercero.
Hace falta el aviso simplificado en el alta y el integral publicado. Sin eso
no se le entrega a un vendedor.
