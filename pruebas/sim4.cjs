// Verifica los tres finales distintos del escaneo en la maqueta.
const React=require("react"),TR=require("react-test-renderer"),{act}=TR;
global.IS_REACT_ACT_ENVIRONMENT=true;global.window=global;
global.navigator={mediaDevices:{getUserMedia:async()=>{throw new Error("x")}}};global.fetch=async()=>{throw new Error("x")};
const App=require("./todo.build.cjs").App;
const flat=(n)=>{const o=[];const w=(x)=>{if(!x)return;if(Array.isArray(x))return x.forEach(w);if(typeof x==="object"){o.push(x);w(x.children);}};w(n);return o;};
const txt=(n)=>{let s="";const w=(x)=>{if(x==null)return;if(typeof x==="string"||typeof x==="number"){s+=x+" ";return;}if(Array.isArray(x))return x.forEach(w);if(typeof x==="object")w(x.children);};w(n);return s.replace(/\s+/g," ");};
let f=0; const ok=(c,m)=>{console.log((c?"  ok   ":"  FALLA")+"  "+m);if(!c)f++;};
(async()=>{
 let r; await act(async()=>{r=TR.create(React.createElement(App))});
 const todos=()=>flat(r.toJSON());
 const pt=(t)=>todos().filter(n=>n.props&&n.props.onClick&&txt(n).includes(t)).sort((a,b)=>txt(a).length-txt(b).length);
 const clic=async(t,i=0)=>{const c=pt(t);if(!c[i])throw new Error("no hay boton "+t);await act(async()=>{c[i].props.onClick({stopPropagation(){}})});};
 const esp=async(ms)=>{await act(async()=>{await new Promise(x=>setTimeout(x,ms))})};
 const pan=()=>txt(r.toJSON());
 const abrir=async()=>{await clic("Inventario");await clic("Agregar productos");await clic("Escanear el código");};

 console.log("\n=== Los tres botones de prueba dan tres finales distintos ===");
 await abrir();
 ok(pan().includes("Para probar sin producto"),"los botones de prueba se ven aunque el equipo sí lea códigos");

 await clic("Ya lo tengo");
 ok(pan().includes("Ya lo tienes"),"caso 1: reconoce el que ya está en inventario");

 await act(async()=>{r.unmount()}); await act(async()=>{r=TR.create(React.createElement(App))});
 await abrir(); await clic("Otro lo nombró");
 ok(pan().includes("rímel"),"caso 2: el catálogo compartido trae el apodo");
 ok(pan().includes("Lo nombraron 134 vendedores"),"caso 2: dice cuántos lo confirmaron");

 await act(async()=>{r.unmount()}); await act(async()=>{r=TR.create(React.createElement(App))});
 await abrir(); await clic("Nadie lo conoce");
 ok(pan().includes("Sin datos"),"caso 3: admite que no sabe nada de ese código");
 await clic("Ponerles precio"); await esp(1400);
 ok(pan().includes("No encontré este producto"),"caso 3: internet tampoco lo encuentra y lo dice");

 console.log(`\n${f===0?"TODO PASÓ":f+" FALLAS"}\n`); process.exit(f?1:0);
})().catch(e=>{console.error("REVENTÓ:",e.message);process.exit(1)});
