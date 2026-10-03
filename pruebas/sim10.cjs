// Prueba el motor que le quita el fondo a la foto del producto.
//
// recorta() es función pura sobre píxeles: no necesita cámara, ni canvas,
// ni navegador. Así se puede probar de verdad y no "a ver si se ve bien".
const { recorta, moduloFoto } = require("./todo.build.cjs");

let f = 0;
const ok = (c, m) => { console.log((c ? "  ok   " : "  FALLA") + "  " + m); if (!c) f++; };

// Arma un cuadro de píxeles. pinta(x,y) devuelve el gris de ese punto.
const cuadro = (w, h, pinta) => {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const x = i % w, y = (i - x) / w, v = pinta(x, y);
    d[i * 4] = v; d[i * 4 + 1] = v; d[i * 4 + 2] = v; d[i * 4 + 3] = 255;
  }
  return d;
};
const caja = (c) => `${c.x0},${c.y0}-${c.x1},${c.y1}`;

console.log("\n=== Encuentra el producto y tira lo demás ===");
{
  const w = 9, h = 9;
  const d = cuadro(w, h, (x, y) => (x >= 3 && x <= 5 && y >= 3 && y <= 5 ? 20 : 240));
  const r = recorta(d, w, h, 40);
  ok(r.hayProducto, "ve que hay un producto en medio de la hoja");
  ok(caja(r.caja) === "3,3-5,5", `el recuadro queda justo en el producto (salió ${caja(r.caja)})`);
  ok(r.quitado > 0.85, `tira casi toda la hoja (tiró ${Math.round(r.quitado * 100)}%)`);
}

console.log("\n=== Funciona igual con producto claro sobre fondo oscuro ===");
{
  const w = 9, h = 9;
  const d = cuadro(w, h, (x, y) => (x >= 3 && x <= 5 && y >= 3 && y <= 5 ? 230 : 25));
  const r = recorta(d, w, h, 40);
  ok(r.hayProducto, "no da por hecho que el fondo es blanco");
  ok(caja(r.caja) === "3,3-5,5", `lo encuentra igual (salió ${caja(r.caja)})`);
}

console.log("\n=== No recorta de más: lo que está encerrado se queda ===");
{
  // Un producto con hueco en medio (un arillo, una liga, una taza de perfil).
  // El hueco es del color del fondo PERO no está pegado a la orilla, así que
  // no se debe borrar: si se borra, el producto sale agujereado.
  const w = 11, h = 11;
  const anillo = (x, y) => (x >= 2 && x <= 8 && y >= 2 && y <= 8) && !(x >= 4 && x <= 6 && y >= 4 && y <= 6);
  const d = cuadro(w, h, (x, y) => (anillo(x, y) ? 30 : 240));
  const r = recorta(d, w, h, 40);
  const centro = 5 * w + 5;
  ok(r.fondo[centro] === 0, "el hueco de en medio NO se borra (el producto no sale agujereado)");
  ok(caja(r.caja) === "2,2-8,8", `el recuadro toma el producto completo (salió ${caja(r.caja)})`);
}

console.log("\n=== Fondo parejo sin nada encima ===");
{
  const w = 8, h = 8;
  const r = recorta(cuadro(w, h, () => 200), w, h, 30);
  ok(!r.hayProducto, "si solo hay mesa, dice que no encontró producto");
  ok(r.quitado > 0.99, "y no deja basura");
  ok(caja(r.caja) === "0,0-7,7", "se queda con la foto entera en vez de devolver un recuadro vacío");
}

console.log("\n=== Cuando no puede distinguir, deja la foto en paz ===");
{
  // Producto oscuro pegado a la orilla izquierda: las orillas quedan
  // mitad producto y mitad mesa, así que el color de fondo no es confiable.
  // Lo correcto es NO recortar, no arruinar la foto.
  const w = 12, h = 12;
  const d = cuadro(w, h, (x) => (x <= 3 ? 20 : 240));
  const r = recorta(d, w, h, 42);
  ok(r.quitado === 0, "no quita nada cuando el producto toca la orilla");
  ok(caja(r.caja) === "0,0-11,11", "devuelve la foto completa, sin mutilarla");
}

console.log("\n=== El ajuste del vendedor sí hace algo ===");
{
  // Mesa con manchas y sombras, que es la mesa real.
  const w = 14, h = 14;
  const mesa = (x, y) => 240 + (((x * 7 + y * 13) % 31) - 15);
  const d = cuadro(w, h, (x, y) => (x >= 5 && x <= 8 && y >= 5 && y <= 8 ? 30 : mesa(x, y)));
  const flojo = recorta(d, w, h, 8);
  const fuerte = recorta(d, w, h, 60);
  ok(fuerte.quitado >= flojo.quitado, "subir el ajuste quita más fondo, nunca menos");
  ok(fuerte.quitado > 0.6, `con el ajuste arriba limpia la mesa manchada (${Math.round(fuerte.quitado * 100)}%)`);
  ok(fuerte.hayProducto && caja(fuerte.caja) === "5,5-8,8",
    `y aun así encuentra el producto (salió ${caja(fuerte.caja)})`);
}

console.log("\n=== No se cae con fotos absurdas ===");
{
  let revento = false;
  try {
    recorta(cuadro(1, 1, () => 100), 1, 1, 40);
    recorta(cuadro(3, 1, () => 100), 3, 1, 40);
    recorta(cuadro(1, 3, () => 100), 1, 3, 40);
  } catch (e) { revento = true; }
  ok(!revento, "aguanta una foto de un píxel o de una sola línea");
}

console.log("\n=== El módulo se revisa solo ===");
{
  ok(moduloFoto.id === "foto", "el módulo se llama foto");
  ok(moduloFoto.tipo === "servicio", "es un servicio, no una pestaña: no ocupa lugar abajo");
  ok(moduloFoto.probar() === true, "su autoprueba pasa");
}

console.log(`\n${f === 0 ? "TODO PASÓ" : f + " FALLAS"}\n`);
process.exit(f ? 1 : 0);
