// Corre las seis suites de punta a punta. Un solo resultado al final.
process.chdir(__dirname);
const { execSync } = require("child_process");
const fs = require("fs");
console.log("compilando...");
execSync("npx esbuild entrada.jsx --bundle --format=cjs --platform=node --external:react --external:lucide-react --outfile=todo.build.cjs --log-level=warning", { stdio: "inherit" });
let total = 0, fallas = 0;
for (const f of fs.readdirSync(".").filter((x) => /^sim\d*\.cjs$/.test(x)).sort()) {
  let salida = "";
  try { salida = execSync(`node ${f}`, { encoding: "utf8" }); }
  catch (e) { salida = (e.stdout || "") + (e.stderr || ""); fallas++; }
  const ok = (salida.match(/^ {2}ok/gm) || []).length;
  const mal = (salida.match(/^ {2}FALLA/gm) || []).length;
  total += ok;
  console.log(`  ${f.padEnd(9)} ${String(ok).padStart(3)} bien  ${mal ? String(mal) + " MAL" : ""}`);
  if (mal) { fallas++; console.log(salida.split("\n").filter((l) => l.includes("FALLA")).join("\n")); }
}
console.log(`\n${fallas ? fallas + " suites con problema" : "TODO PASÓ"} · ${total} comprobaciones\n`);
process.exit(fallas ? 1 : 0);
