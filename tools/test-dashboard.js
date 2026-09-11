/* Headless check of the dashboard rules. Needs jsdom (dev only, not shipped):
 *   npm i jsdom && node tools/test-dashboard.js
 * Run it after changing js/app.js or js/bank.js. */
/* Drives the real dashboard in a headless DOM, the way Koran would use it. */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const read = p => fs.readFileSync(path.join(ROOT, p), "utf8");

const Q_SECONDS = 2;               // short clock so the time-out case is testable
const RETAKE_WAIT_MIN = 0;         // no wait, so the retake path is testable

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log("  PASS  " + msg); } else { fail++; console.log("  FAIL  " + msg); } };
const tick = (ms = 0) => new Promise(r => setTimeout(r, ms));

// the bank, loaded separately so the test knows the right answers
const bankSrc = read("js/bank.js");
const { BANK } = new Function(bankSrc + "; return {BANK};")();
const byId = Object.fromEntries(BANK.map(c => [c.id, c]));

/* which data-i values are correct for this item */
function correctOf(it) {
  const v = byId[it.c].v[it.v];
  if (v.t === "tf") return [v.a ? 0 : 1];
  if (v.t === "multi") return v.a.slice();
  return [0];                       // mc/scn: the correct option is first in the bank
}
function typeOf(it) { return byId[it.c].v[it.v].t; }

async function boot(over) {
  // same scripts, same order as index.html, inlined so they share one global scope like real <script> tags
  const inline = [
    read("js/config.js"),
    `Object.assign(window.APP_CONFIG, ${JSON.stringify(Object.assign({ Q_SECONDS, RETAKE_WAIT_MIN }, over || {}))});`,
    `Element.prototype.scrollIntoView = function(){}; window.scrollTo = function(){};`,
    // fake Apps Script endpoint: records every payload the app would send to Google Sheets
    `window.__posts = [];
     window.fetch = async function(u, o) {
       if (o && o.method === "POST") { window.__posts.push(JSON.parse(o.body)); return { ok: true, json: async () => ({ ok: true }) }; }
       if (String(u).includes("op=get")) return { ok: true, json: async () => null };
       return { ok: true, json: async () => [] };
     };`,
    bankSrc,
    read("js/app.js")
  ].map(s => `<script>\n${s}\n</script>`).join("\n");
  const html = read("index.html")
    .replace(/<link[^>]*>/g, "")
    .replace(/<script src="[^"]*"><\/script>/g, "")
    .replace("</body>", inline + "\n</body>");
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/", pretendToBeVisual: true });
  await tick(30);
  return dom.window;
}

const dayDoc = w => JSON.parse(w.localStorage.getItem("ap-ch1-koran:days"))["" + Object.keys(JSON.parse(w.localStorage.getItem("ap-ch1-koran:days")))[0]];
const card = (w, i) => w.document.getElementById("q" + i);
const isLocked = (w, i) => { const c = card(w, i); return !!c && c.classList.contains("locked"); };

async function click(w, sel) { const el = w.document.querySelector(sel); if (!el) throw new Error("missing " + sel); el.click(); await tick(10); }

/* answer question i correctly, or wrong twice */
async function answer(w, i, items, right) {
  const cs = correctOf(items[i]), t = typeOf(items[i]);
  const all = Array.from(card(w, i).querySelectorAll(".opt")).map(b => Number(b.dataset.i));
  if (right) {
    for (const c of cs) await click(w, `#q${i}-o${c}`);
    await click(w, `#q${i}-check`);
    return;
  }
  const wrongs = all.filter(x => !cs.includes(x));
  await click(w, `#q${i}-o${wrongs[0]}`);
  await click(w, `#q${i}-check`);
  if (w.document.getElementById(`q${i}-check`)) {            // second try offered
    const second = t === "multi" ? wrongs.slice(0, 2) : [wrongs[1] !== undefined ? wrongs[1] : wrongs[0]];
    if (t === "multi") { for (const x of second) await click(w, `#q${i}-o${x}`); }
    else await click(w, `#q${i}-o${second[0]}`);
    await click(w, `#q${i}-check`);
  }
}

(async () => {
  console.log("\n=== 1. Arranque: una pregunta a la vez ===");
  const w = await boot();
  const doc0 = dayDoc(w);
  const items = doc0.items;
  ok(items.length === 10, "el dia trae 10 preguntas");
  ok(!isLocked(w, 0), "la pregunta 1 esta abierta");
  ok([1,2,3,4,5,6,7,8,9].every(i => isLocked(w, i)), "las preguntas 2-10 estan bloqueadas");
  ok(!!w.document.getElementById("q0-timer"), "la pregunta 1 tiene reloj");
  ok(!w.document.getElementById("q1-timer"), "una pregunta bloqueada no tiene reloj");

  console.log("\n=== 2. Contesta bien la 1 ===");
  await answer(w, 0, items, true);
  ok(/1<small>/.test(w.document.getElementById("score").innerHTML), "score sube a 1");
  ok(!isLocked(w, 1), "la pregunta 2 se desbloquea");
  ok(!!w.document.getElementById("q1-timer"), "la pregunta 2 arranca su reloj");

  console.log("\n=== 3. Se acaba el tiempo en la 2 ===");
  await tick(Q_SECONDS * 1000 + 700);
  const c1 = card(w, 1);
  ok(/Time's up/.test(c1.textContent), "dice Time's up");
  ok(/Correct answer:/.test(c1.textContent), "ensena la contestacion correcta");
  ok(/comes back tomorrow/.test(c1.textContent), "avisa que vuelve manana");
  ok(dayDoc(w).answers["1"].pts === 0, "0 puntos");
  ok(dayDoc(w).answers["1"].timeout === true, "queda marcado como timeout");
  ok(!isLocked(w, 2), "la pregunta 3 se desbloquea sola");

  console.log("\n=== 4. Falla el resto y termina ===");
  for (let i = 2; i < 10; i++) await answer(w, i, items, false);
  const doc = dayDoc(w);
  ok(doc.done === true, "el dia queda completo");
  ok(doc.score === 1, "score final = 1 de 10 (score=" + doc.score + ")");
  ok(/Final score/.test(w.document.getElementById("summary").textContent), "muestra Final score");

  console.log("\n=== 5. Mensaje de repasar + boton de repetir ===");
  const sum = w.document.getElementById("summary");
  ok(/Review these concepts/.test(sum.textContent), "dice que repase los conceptos");
  ok(sum.querySelectorAll(".study-list li").length > 0, "lista los conceptos a repasar");
  const exAll = new Set(BANK.map(c => c.ex));
  const nameAll = new Set(BANK.map(c => c.name));
  const li = Array.from(sum.querySelectorAll(".study-list li"));
  ok(li.every(l => nameAll.has(l.querySelector("b").textContent)), "cada renglon nombra un concepto real del banco");
  ok(li.every(l => exAll.has(l.querySelector("span").textContent)), "cada concepto trae SU explicacion tal cual del banco");
  ok(li.every(l => l.querySelector("span").textContent.length > 40), "las explicaciones no vienen vacias");
  ok(!!w.document.getElementById("retake"), "aparece el boton de repetir");
  ok(!w.document.getElementById("retake").disabled, "con espera 0 el boton esta activo");

  console.log("\n=== 6. Repite: preguntas distintas, score oficial intacto ===");
  await click(w, "#retake");
  await tick(30);
  const doc2 = dayDoc(w);
  ok(Array.isArray(doc2.retakes) && doc2.retakes.length === 1, "se guarda un repaso aparte");
  ok(doc2.score === 1, "el score OFICIAL sigue en 1");
  ok(doc2.answers["0"] !== undefined, "las respuestas oficiales siguen ahi");
  const sameQ = doc2.retakes[0].items.filter((it, i) => it.c === items[i].c && it.v === items[i].v).length;
  ok(sameQ === 0, "ninguna pregunta del repaso es identica a la oficial (iguales=" + sameQ + ")");
  const reviewed = doc2.retakes[0].items.filter(it => it.review).length;
  ok(reviewed > 0, "el repaso trae los conceptos fallados marcados Review (" + reviewed + ")");
  ok(!isLocked(w, 0), "el repaso arranca en la pregunta 1");
  ok(/Practice/.test(w.document.getElementById("score-label").textContent), "la tarjeta dice Practice");

  console.log("\n=== 7. El reloj se pausa al cerrar la app ===");
  const w2 = await boot();
  await tick(900);
  Object.defineProperty(w2.document, "hidden", { value: true, configurable: true });
  w2.document.dispatchEvent(new w2.Event("visibilitychange"));
  const frozen = w2.localStorage.getItem("ap-ch1-koran:t:" + dayDoc(w2).date + ":0:0");
  await tick(1500);
  const still = w2.localStorage.getItem("ap-ch1-koran:t:" + dayDoc(w2).date + ":0:0");
  ok(frozen !== null, "guarda el tiempo transcurrido al ocultarse");
  ok(frozen === still, "el reloj NO corre mientras esta cerrada");
  ok(!w2.document.querySelector("#q0 .fb"), "la pregunta sigue viva, no se cerro sola");

  console.log("\n=== 8. Con la espera real de 60 minutos ===");
  const w3 = await boot({ RETAKE_WAIT_MIN: 60, Q_SECONDS: 600 });
  const it3 = dayDoc(w3).items;
  for (let i = 0; i < 10; i++) await answer(w3, i, it3, false);
  const s3 = w3.document.getElementById("summary");
  ok(dayDoc(w3).score === 0, "score 0 de 10");
  ok(/Review these concepts/.test(s3.textContent), "le dice que repase los conceptos");
  const btn3 = w3.document.getElementById("retake");
  ok(!!btn3 && btn3.disabled, "el boton de repetir esta BLOQUEADO");
  ok(/Retake in/.test(btn3.textContent), "el boton dice 'Retake in'");
  ok(/^(59|60):\d\d$/.test(w3.document.getElementById("retake-left").textContent), "cuenta regresiva cerca de 60:00 (" + w3.document.getElementById("retake-left").textContent + ")");
  ok(/60 minutes/.test(s3.textContent), "explica que son 60 minutos");
  const before = w3.document.getElementById("retake-left").textContent;
  await tick(1200);
  ok(w3.document.getElementById("retake-left").textContent !== before, "la cuenta regresiva corre sola");

  console.log("\n=== 9. Si saca buena nota, no se le ofrece repetir ===");
  const w4 = await boot({ Q_SECONDS: 600 });
  const it4 = dayDoc(w4).items;
  for (let i = 0; i < 10; i++) await answer(w4, i, it4, true);
  const s4 = w4.document.getElementById("summary");
  ok(dayDoc(w4).score === 10, "score 10 de 10 (score=" + dayDoc(w4).score + ")");
  ok(!w4.document.getElementById("retake"), "NO aparece boton de repetir");
  ok(!/Review these concepts/.test(s4.textContent), "no le pide repasar nada");
  ok(/Everything right on the first try/.test(s4.textContent), "lo felicita");

  console.log("\n=== 10. Lo que se le manda a Google Sheets ===");
  const w5 = await boot({ Q_SECONDS: 600, RETAKE_WAIT_MIN: 0, SHEETS_URL: "https://script.google.com/fake/exec" });
  const it5 = dayDoc(w5).items;
  ok(/saved online/i.test(w5.document.getElementById("storeNote").textContent), "la app dice que guarda en linea");
  for (let i = 0; i < 10; i++) await answer(w5, i, it5, false);
  await tick(40);
  let last = w5.__posts[w5.__posts.length - 1];
  ok(!!last && last.op === "set", "manda op=set");
  ok(last.readable && last.readable.rows.length === 10, "manda 10 filas legibles");
  ok(last.readable.rows.every(r => r.attempt === "official"), "todas marcadas 'official'");
  ok(last.readable.score === 0 && last.readable.done === true, "manda score y dia completo");
  ok(last.readable.rows.every(r => r.concept && r.question && r.correct), "cada fila trae concepto, pregunta y contestacion correcta");

  await click(w5, "#retake");
  await tick(40);
  const it5b = dayDoc(w5).retakes[0].items;
  await answer(w5, 0, it5b, true);
  await tick(40);
  last = w5.__posts[w5.__posts.length - 1];
  const prac = last.readable.rows.filter(r => r.attempt === "practice 1");
  ok(prac.length === 10, "anade las 10 filas del repaso marcadas 'practice 1'");
  ok(last.readable.rows.filter(r => r.attempt === "official").length === 10, "las oficiales siguen ahi, sin duplicar");
  ok(last.readable.score === 0, "el score del resumen sigue siendo el OFICIAL");
  ok(Array.isArray(last.readable.practice) && last.readable.practice[0].n === 1, "manda el resumen de los repasos aparte");
  ok(prac[0].result === "correct", "registra el acierto del repaso");

  console.log("\n=== 11. Una pregunta vencida en la hoja ===");
  const w6 = await boot({ Q_SECONDS: 1, SHEETS_URL: "https://script.google.com/fake/exec" });
  await tick(1800);
  const to = (w6.__posts[w6.__posts.length - 1] || {}).readable;
  ok(!!to && to.rows[0].result === "time's up", "la fila dice \"time's up\"");
  ok(to.rows[0].points === 0, "0 puntos en la hoja");
  ok(to.rows[0].first === "—", "no inventa una contestacion que no dio");

  console.log(`\n──────── ${pass} pasaron · ${fail} fallaron ────────`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("ERROR:", e); process.exit(1); });
