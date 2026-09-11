(() => {
"use strict";

const CFG = window.APP_CONFIG || {};
const STUDENT = CFG.STUDENT || "Koran";
const CHAPTER = CFG.CHAPTER || "A&P Chapter 1";
const SHEETS_URL = CFG.SHEETS_URL || "";
const KEY_PREFIX = CFG.STORAGE_KEY || "ap-ch1-koran";
const PER_DAY = 10;
const Q_SECONDS = Number(CFG.Q_SECONDS) > 0 ? Number(CFG.Q_SECONDS) : 120;
const RETAKE_WAIT_MS = (Number(CFG.RETAKE_WAIT_MIN) >= 0 ? Number(CFG.RETAKE_WAIT_MIN) : 0) * 60000;
const MAX_ATTEMPTS = Number(CFG.MAX_ATTEMPTS) > 0 ? Number(CFG.MAX_ATTEMPTS) : 20;
const ordinal = n => n + (["th", "st", "nd", "rd"][(n % 100 - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");
const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
const TYPE_LABEL = { mc: "Multiple choice", scn: "Analyze the case", tf: "True or false", multi: "Select all" };
const byId = Object.fromEntries(BANK.map(c => [c.id, c]));
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const pts = n => (Math.round(n * 2) / 2).toString();

/* ───────── dates ───────── */
function dayKey(d = new Date()) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function keyToDate(k) { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); }
function fmt(k, opts) { return keyToDate(k).toLocaleDateString("en-US", opts || { weekday: "long", day: "numeric", month: "long" }); }
function addDays(k, n) { const d = keyToDate(k); d.setDate(d.getDate() + n); return dayKey(d); }

/* ───────── seeded shuffle (stable option order per day) ───────── */
function rng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
function shuffle(arr, r) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* ───────── storage: shared db when available, this device otherwise ───────── */
const clone = o => JSON.parse(JSON.stringify(o));
function localStore() {
  const KEY = KEY_PREFIX + ":days";
  let mem = {};
  try { mem = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { mem = {}; }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* memory only */ } };
  return {
    mode: "local",
    async list() { return Object.values(clone(mem)); },
    async get(k) { return mem[k] ? clone(mem[k]) : null; },
    async set(k, v) { mem[k] = clone(v); persist(); },
    async patch(k, p) {
      const cur = mem[k] || {};
      mem[k] = { ...cur, ...clone(p), answers: { ...(cur.answers || {}), ...clone(p.answers || {}) } };
      persist();
    },
    watch() {}
  };
}
function dbStore(db) {
  const col = db.collection("days");
  return {
    mode: "db",
    async list() { const s = await col.get(); return s.docs.map(d => clone(d.data())); },
    async get(k) { const s = await col.doc(k).get(); return s.exists ? clone(s.data()) : null; },
    async set(k, v) { await col.doc(k).set(v); },
    async patch(k, p) { await col.doc(k).update(p); },
    watch(fn) { try { col.onSnapshot(s => fn(s.docs.map(d => clone(d.data()))), () => {}); } catch (e) { /* no live updates */ } }
  };
}

/* Google Sheets (Apps Script web app) — answers sync online; this device keeps a cache */
function sheetsStore(url) {
  const cache = localStore();
  const dirty = new Set();
  const getJSON = async params => {
    const r = await fetch(url + (url.includes("?") ? "&" : "?") + new URLSearchParams(params), { redirect: "follow" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  };
  const post = async body => {
    const r = await fetch(url, { method: "POST", redirect: "follow", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    if (!j || !j.ok) throw new Error((j && j.error) || "save failed");
    return j;
  };
  const flush = async () => {
    for (const k of [...dirty]) {
      const d = await cache.get(k);
      if (d) await post({ op: "set", date: k, student: STUDENT, day: d, readable: readableOf(d) });
      dirty.delete(k);
    }
  };
  return {
    mode: "sheets",
    async list() {
      let days;
      try { days = await getJSON({ op: "list", student: STUDENT }); } catch (e) { return cache.list(); }
      for (const d of days) { const local = await cache.get(d.date); if (!local || Object.keys(d.answers || {}).length >= Object.keys(local.answers || {}).length) await cache.set(d.date, d); }
      return cache.list();
    },
    async get(k) {
      let remote;
      try { remote = await getJSON({ op: "get", date: k, student: STUDENT }); } catch (e) { return cache.get(k); }
      const local = await cache.get(k);
      // how much work a copy holds, retakes included
      const rich = d => Object.keys(d.answers || {}).length +
        (d.retakes || []).reduce((s, r) => s + Object.keys(r.answers || {}).length, 0);
      if (local && (!remote || rich(local) > rich(remote))) {
        dirty.add(k);
        // push it now: a day answered before the sheet was connected — or while it was down —
        // would otherwise wait for the next answer, and a finished day has none left to give
        flush().catch(() => {});
        return local;
      }
      if (remote) await cache.set(k, remote);
      return remote;
    },
    async set(k, v) {
      await cache.set(k, v);
      try { await flush(); await post({ op: "set", date: k, student: STUDENT, day: v, readable: readableOf(v) }); }
      catch (e) { dirty.add(k); }
    },
    async patch(k, p) {
      await cache.patch(k, p);
      const full = await cache.get(k);
      try { await flush(); await post({ op: "set", date: k, student: STUDENT, day: full, readable: readableOf(full) }); }
      catch (e) { dirty.add(k); throw e; }
    },
    watch() {}
  };
}

/* one readable row per question, for the Google Sheet */
function rowsOf(a0, label) {
  return (a0.items || []).map((it, i) => {
    const vw = viewOf(a0, i), a = (a0.answers || {})[i];
    if (!vw) return null;
    const txt = arr => (arr || []).map(x => optText(vw, x)).join(" · ");
    const fin = isFinal(a);
    return {
      attempt: label,
      n: i + 1, topic: TOPICS[vw.c.t], concept: vw.c.name, type: TYPE_LABEL[vw.type], question: vw.v.q,
      first: a ? (a.timeout && a.tries === 1 ? "—" : txt(a.first)) : "",
      second: a && a.tries === 2 ? (a.timeout ? "—" : txt(a.pick)) : "",
      correct: txt(vw.correct),
      result: !fin ? (a ? "in progress" : "") : a.timeout ? "time's up" : a.ok ? (a.tries === 2 ? "correct (2nd try)" : "correct") : "incorrect",
      points: fin ? (a.pts !== undefined ? a.pts : (a.ok ? 1 : 0)) : "", review: !!it.review
    };
  }).filter(Boolean);
}

function readableOf(d) {
  // every round of the day, in order, told apart by the attempt column
  let rows = rowsOf(d, "attempt 1");
  (d.retakes || []).forEach((r, n) => { rows = rows.concat(rowsOf({ ...r, date: d.date }, "attempt " + (n + 2))); });
  const practice = (d.retakes || []).map((r, n) => ({ n: n + 2, score: scoreOf(r), done: !!r.done }));
  return {
    student: STUDENT, chapter: CHAPTER, date: d.date,
    score: scoreOf(d), answered: finalCount(d), total: (d.items || []).length, done: !!d.done,
    practice, rows
  };
}

let store = null;
let allDays = [];
let today = null;       // today's day document (the OFFICIAL attempt — never overwritten by a retake)
let todayK = dayKey();
const picks = {};       // idx -> picked option indices not yet checked

/* ───────── attempts ─────────
   today            = the official attempt. Its score is the one that counts, always.
   today.retakes[]  = extra practice rounds, each with its own items/answers/score.
   att()            = the attempt on screen right now (the last retake, or the official one). */
const att = () => (today && today.retakes && today.retakes.length) ? today.retakes[today.retakes.length - 1] : today;
const attNo = () => (today && today.retakes) ? today.retakes.length : 0;

/* ───────── answers ─────────
   answers[idx] = { first:[..], firstOk, pick:[..], ok, tries:1|2, final, pts, at } */
const isFinal = a => !!a && (a.final !== false);
const firstOk = a => a.firstOk !== undefined ? a.firstOk : a.ok;
const finalCount = d => Object.values(d.answers || {}).filter(isFinal).length;
const scoreOf = d => Object.values(d.answers || {}).filter(isFinal).reduce((s, a) => s + (a.pts !== undefined ? a.pts : (a.ok ? 1 : 0)), 0);

/* ───────── building a day ───────── */
function history(days, beforeKey) {
  const hist = {};
  days.filter(d => d && d.date && (!beforeKey || d.date < beforeKey))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .forEach(d => (d.items || []).forEach((it, i) => {
      const ans = d.answers && d.answers[i];
      if (!ans || !isFinal(ans) || !byId[it.c]) return;
      const h = hist[it.c] || (hist[it.c] = { used: new Set() });
      h.used.add(it.v);
      h.last = { ok: firstOk(ans), v: it.v, date: d.date };
    }));
  return hist;
}
function pickVariant(c, h) {
  const all = c.v.map((_, i) => i);
  let cand = all.filter(i => !h.used.has(i));
  if (!cand.length) cand = all.filter(i => i !== h.last.v);
  if (!cand.length) cand = all;
  const lastType = c.v[h.last.v] && c.v[h.last.v].t;
  const other = cand.filter(i => c.v[i].t !== lastType);
  const pool = other.length ? other : cand;
  return pool[Math.floor(Math.random() * pool.length)];
}
function buildDay(k, days) {
  const hist = history(days, k);
  const items = [], taken = new Set();
  // 1) concepts missed (on the first try) come back, in a different form
  Object.entries(hist).filter(([, h]) => !h.last.ok)
    .sort((a, b) => (a[1].last.date < b[1].last.date ? -1 : 1))
    .forEach(([id, h]) => { if (items.length < PER_DAY) { items.push({ c: id, v: pickVariant(byId[id], h), review: true }); taken.add(id); } });
  // 2) new concepts
  shuffle(BANK.filter(c => !hist[c.id]), Math.random).forEach(c => {
    if (items.length < PER_DAY) { items.push({ c: c.id, v: Math.floor(Math.random() * c.v.length), review: false }); taken.add(c.id); }
  });
  // 3) all seen: oldest first, new form
  BANK.filter(c => hist[c.id] && !taken.has(c.id))
    .sort((a, b) => (hist[a.id].last.date < hist[b.id].last.date ? -1 : 1))
    .forEach(c => { if (items.length < PER_DAY) { items.push({ c: c.id, v: pickVariant(c, hist[c.id]), review: false }); taken.add(c.id); } });
  return { date: k, student: STUDENT, items: shuffle(items, Math.random), answers: {}, score: 0, done: false, createdAt: new Date().toISOString() };
}

/* ───────── question view model ───────── */
function viewOf(day, idx) {
  const it = day.items[idx], c = byId[it.c], v = c && c.v[it.v];
  if (!v) return null;
  if (v.t === "tf") return { c, v, it, type: "tf", opts: [{ i: 0, text: "True" }, { i: 1, text: "False" }], correct: [v.a ? 0 : 1] };
  const opts = shuffle(v.o.map((text, i) => ({ i, text })), rng((day.seed || day.date) + ":" + idx + ":" + it.c));
  return { c, v, it, type: v.t, opts, correct: v.t === "multi" ? v.a.slice() : [0] };
}
const optText = (vw, i) => vw.type === "tf" ? (i === 0 ? "True" : "False") : vw.v.o[i];
const same = (a, b) => a.length === b.length && a.every(x => b.includes(x));

/* ───────── the 2-minute clock ─────────
   One clock per question, covering BOTH tries. It pauses when the app is closed or hidden and
   picks up where it left off, on the same question. Elapsed time lives in localStorage, not in
   the day document: pausing must be instant and must not depend on the network. */
const timer = { idx: -1, startedAt: 0, iv: null };
const timerKey = idx => `${KEY_PREFIX}:t:${todayK}:${attNo()}:${idx}`;
function timerElapsed(idx) {
  try { return Math.max(0, Number(localStorage.getItem(timerKey(idx))) || 0); } catch (e) { return 0; }
}
function timerSave() {
  if (timer.idx < 0) return;
  try { localStorage.setItem(timerKey(timer.idx), String(Date.now() - timer.startedAt)); } catch (e) {}
}
function timerClear(idx) { try { localStorage.removeItem(timerKey(idx)); } catch (e) {} }
function timerPause() {
  timerSave();
  if (timer.iv) { clearInterval(timer.iv); timer.iv = null; }
}
function timerStop() { timerPause(); timer.idx = -1; }

/* the question he is on: the first one not finished yet */
function activeIdx() {
  const a = att();
  if (!a || a.done) return -1;
  return a.items.findIndex((_, i) => !isFinal(a.answers[i]));
}

function timerSync() {
  const idx = activeIdx();
  if (idx < 0) { timerStop(); return; }
  if (timer.idx === idx && timer.iv) return;      // already ticking on this question
  timerPause();
  timer.idx = idx;
  timer.startedAt = Date.now() - timerElapsed(idx);
  timer.iv = setInterval(timerTick, 250);
  timerTick();
}

function timerTick() {
  if (timer.idx < 0) return;
  const left = Q_SECONDS * 1000 - (Date.now() - timer.startedAt);
  const el = document.getElementById(`q${timer.idx}-timer`);
  if (el) {
    el.textContent = mmss(left);
    el.parentElement.classList.toggle("low", left <= 30000);
  }
  if (left <= 0) { const i = timer.idx; timerPause(); timer.idx = -1; onTimeout(i); }
}

/* time ran out: the question closes as incorrect, with the answer and the explanation shown */
function onTimeout(idx) {
  const a = att();
  if (!a || isFinal(a.answers[idx])) return;
  const prev = a.answers[idx];
  delete picks[idx];
  finalize(idx, {
    first: prev ? prev.first : [], firstOk: false, pick: [], ok: false,
    tries: prev ? 2 : 1, final: true, pts: 0, timeout: true, at: new Date().toISOString()
  });
}

/* ───────── axon progress ───────── */
function renderAxon() {
  const box = $("#segs");
  const a0 = att();
  const firstOpen = activeIdx();
  let s = "";
  for (let i = 0; i < PER_DAY; i++) {
    const a = a0 && a0.answers[i];
    const fin = isFinal(a);
    const cls = fin ? (a.pts === 0.5 ? "half" : a.ok ? "ok" : "bad") : (i === firstOpen ? "now" : "");
    s += `<span class="seg ${cls}">${i + 1}</span>`;
  }
  box.innerHTML = s;
  const n = attNo() + 1;                    // 1 = the attempt that counts
  $("#score").innerHTML = `${pts(a0 ? scoreOf(a0) : 0)}<small>/${PER_DAY}</small>`;
  $("#status").innerHTML = !a0 ? "Getting your questions ready…"
    : a0.done ? (n > 1 ? `<b>Round ${n} finished</b> · you can go again` : `<b>All ${PER_DAY} answered</b>`)
    : `<b>${finalCount(a0)} of ${PER_DAY}</b> answered${n > 1 ? ` · round ${n}` : ""}`;
  $("#score-label").textContent = !a0 ? "Score" : n > 1 ? ordinal(n) + " round" : a0.done ? "Final score" : "Score";
  $("#axon-card").classList.toggle("final", !!(a0 && a0.done));
}

/* ───────── question cards ───────── */
function cardHTML(idx) {
  const a0 = att();
  const vw = viewOf(a0, idx);
  if (!vw) return "";
  const ans = a0.answers[idx];
  const fin = isFinal(ans);
  const active = activeIdx();
  // one question at a time: everything after the current one stays shut
  if (!fin && active >= 0 && idx !== active) {
    return `<article class="q locked" id="q${idx}"><div class="q-head"><span class="q-num">Question ${idx + 1} of ${PER_DAY}</span>`
      + `<span class="chip lock">Locked</span></div>`
      + `<p class="lock-note">Answer question ${active + 1} first.</p></article>`;
  }
  const retry = ans && !fin;                 // first try was wrong, second try pending
  const multi = vw.type === "multi";
  const pick = fin ? ans.pick : (picks[idx] || []);
  const struck = retry && !multi ? ans.first : [];   // wrong single-choice picks get crossed out
  const letters = "ABCDEF";
  let h = `<article class="q" id="q${idx}" data-idx="${idx}">`;
  h += `<div class="q-head"><span class="q-num">Question ${idx + 1} of ${PER_DAY}</span>`;
  if (vw.it.review) h += `<span class="chip review">Review</span>`;
  h += `<span class="chip">${TYPE_LABEL[vw.type]}</span></div>`;
  if (!fin) h += `<div class="timer"><span class="t-label">Time left</span>`
    + `<span class="t-val" id="q${idx}-timer">${mmss(Q_SECONDS * 1000 - timerElapsed(idx))}</span></div>`;
  h += `<div class="q-topic">${esc(TOPICS[vw.c.t])}</div>`;
  if (vw.v.img) h += `<div class="figure">${drawImg(vw.v.img)}</div>`;
  h += `<p class="q-text">${esc(vw.v.q)}</p>`;
  if (multi && !fin) h += `<p class="hint">There may be more than one correct answer.</p>`;
  h += `<div class="opts ${vw.type === "tf" ? "tf" : ""}" role="group" aria-label="Options">`;
  vw.opts.forEach((o, k) => {
    const on = pick.includes(o.i);
    const x = struck.includes(o.i);
    let cls = "opt" + (multi ? " multi" : "");
    if (fin) {
      if (vw.correct.includes(o.i)) cls += " is-correct";
      else if (on || (ans.first || []).includes(o.i) && !multi) cls += " is-wrong";
      else cls += " is-dim";
    } else if (x) cls += " is-struck";
    const key = vw.type === "tf" ? (o.i === 0 ? "T" : "F") : letters[k];
    h += `<button type="button" class="${cls}" id="q${idx}-o${o.i}" data-i="${o.i}" aria-pressed="${on}" ${fin || x ? "disabled" : ""}><span class="key">${key}</span><span>${esc(o.text)}</span></button>`;
  });
  h += `</div>`;

  if (!fin) {
    if (retry) {
      h += `<div class="fb try"><div class="fb-title"><span class="mark" aria-hidden="true">!</span>Incorrect, one more try</div>`;
      h += `<p>${multi ? "Check your picks: one is missing or one doesn't belong." : "Pick another answer and tap “Check again”."} Getting it right now is worth ½ point.</p></div>`;
    }
    h += `<button type="button" class="check" id="q${idx}-check" ${pick.length ? "" : "disabled"}>${retry ? "Check again" : "Check"}</button>`;
  } else if (ans.ok && ans.tries === 2) {
    h += `<div class="fb ok"><div class="fb-title"><span class="mark" aria-hidden="true">✓</span>Correct on the 2nd try! +½ point</div>`;
    h += `<p class="why">${esc(vw.c.ex)}</p><p class="later">This topic comes back tomorrow in a different way, for extra practice.</p></div>`;
  } else if (ans.ok) {
    h += `<div class="fb ok"><div class="fb-title"><span class="mark" aria-hidden="true">✓</span>Correct! +1 point</div>`;
    h += `<details><summary>See explanation</summary><p>${esc(vw.c.ex)}</p></details></div>`;
  } else {
    const late = ans.timeout;
    h += `<div class="fb bad"><div class="fb-title"><span class="mark" aria-hidden="true">${late ? "⏱" : "✕"}</span>`;
    h += late ? `Time's up · 0 points</div><p>The ${Math.round(Q_SECONDS / 60)} minutes ran out, so this one closed.</p>`
              : `Incorrect${ans.tries === 1 ? "" : " · 0 points"}</div>`;
    h += `<p class="answer">Correct answer: <b>${esc(vw.correct.map(i => optText(vw, i)).join(" · "))}</b></p>`;
    h += `<p class="why">${esc(vw.c.ex)}</p>`;
    h += `<p class="later">This question comes back tomorrow in a different way.</p></div>`;
  }
  return h + `</article>`;
}

function renderToday() {
  $("#dateline").textContent = fmt(todayK);
  renderAxon();
  if (!today) { timerStop(); return; }
  const a0 = att();
  $("#questions").innerHTML = a0.items.map((_, i) => cardHTML(i)).join("");
  renderSummary();
  timerSync();
}

function reportText(d) {
  let t = `Daily A&P Review · ${CHAPTER} · ${STUDENT}\n${fmt(d.date, { weekday: "short", day: "numeric", month: "short" })} · Score: ${pts(scoreOf(d))}/${PER_DAY}\n`;
  d.items.forEach((it, i) => {
    const vw = viewOf(d, i), a = d.answers[i];
    if (!vw || !isFinal(a)) return;
    if (a.ok && a.tries !== 2) t += `\n${i + 1}. ✔ ${vw.c.name}`;
    else if (a.ok) t += `\n${i + 1}. ½ ${vw.c.name} (2nd try; 1st: ${(a.first || []).map(x => optText(vw, x)).join(" · ")})`;
    else t += `\n${i + 1}. ✘ ${vw.c.name}; ${a.timeout ? "time's up" : "answered " + (a.pick || []).map(x => optText(vw, x)).join(" · ")}; correct: ${vw.correct.map(x => optText(vw, x)).join(" · ")}`;
  });
  return t;
}

let retakeIv = null;
const retakeAt = a => (a && a.doneAt ? Date.parse(a.doneAt) : 0) + RETAKE_WAIT_MS;

function renderSummary() {
  const box = $("#summary");
  const cur = att();
  if (!cur || !cur.done) { box.innerHTML = ""; if (retakeIv) { clearInterval(retakeIv); retakeIv = null; } return; }
  const s = scoreOf(cur);
  const n = attNo() + 1;            // 1 = the attempt that counts
  const head = s === PER_DAY ? "Perfect! Every answer right." : s >= 8 ? "Great job!" : s >= 6 ? "Good work!" : "Nice effort. We'll review these tomorrow.";
  // concepts he did not get right on the first try — these are the ones to study
  const missedC = cur.items.filter((_, i) => !firstOk(cur.answers[i])).map(it => byId[it.c]);
  const text = reportText(today);

  let h = `<div class="summary"><p class="label">${n === 1 ? "Final score" : ordinal(n) + " round"}</p>`;
  h += `<h2>${pts(s)}<small> / ${PER_DAY}</small></h2><p class="msg">${esc(head)}</p>`;
  if (n > 1) h += `<p class="small">Round ${n} today. The score that counts is the first one: <b>${pts(scoreOf(today))}/${PER_DAY}</b>. Every round is saved.</p>`;

  if (missedC.length) {
    h += `<div class="study"><p class="study-h">Review these before you go again</p><ul class="study-list">`;
    missedC.forEach(c => { h += `<li><b>${esc(c.name)}</b><span>${esc(c.ex)}</span></li>`; });
    h += `</ul></div>`;
  } else {
    h += `<p>Everything right on the first try. Tomorrow brings new topics.</p>`;
  }

  // he can go again as often as he likes, up to the safety cap
  const left = retakeAt(cur) - Date.now();
  const canRetake = n < MAX_ATTEMPTS;
  h += `<div class="retake">`;
  if (!canRetake) {
    h += `<p class="small">That's ${MAX_ATTEMPTS} rounds today — more than enough. Come back tomorrow for new questions.</p>`;
  } else if (left > 0) {
    h += `<button type="button" class="btn solid" id="retake" disabled>Go again in <span id="retake-left">${mmss(left)}</span></button>`;
    h += `<p class="small">Study the concepts above while you wait.</p>`;
  } else {
    h += `<button type="button" class="btn solid" id="retake">Take the test again</button>`;
    h += `<p class="small">You get different questions. Take it as many times as you like — every round is saved, and the first one is the one that counts.</p>`;
  }
  h += `</div>`;

  h += `<div class="share">`;
  h += `<a class="btn solid" id="share-wa" href="https://wa.me/?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">Send results on WhatsApp</a>`;
  h += `<a class="btn" id="share-sms" href="sms:?&body=${encodeURIComponent(text)}" target="_blank" rel="noopener">Send results by text message</a>`;
  h += `</div></div>`;
  box.innerHTML = h;

  // keep the "Retake in mm:ss" ticking, and flip the button on by itself when the wait is over
  if (retakeIv) { clearInterval(retakeIv); retakeIv = null; }
  if (canRetake && retakeAt(cur) > Date.now()) {
    retakeIv = setInterval(() => {
      const el = document.getElementById("retake-left");
      const ms = retakeAt(att()) - Date.now();
      if (ms <= 0) { clearInterval(retakeIv); retakeIv = null; renderSummary(); }
      else if (el) el.textContent = mmss(ms);
      else { clearInterval(retakeIv); retakeIv = null; }
    }, 1000);
  }
}

/* a fresh practice round: different questions, built as if it were tomorrow so today's
   misses come back as Review. The official attempt is never touched. */
async function startRetake() {
  const cur = att();
  if (!cur || !cur.done || retakeAt(cur) > Date.now() || attNo() + 1 >= MAX_ATTEMPTS) return;
  // force the in-memory copy of today in: a stale one from store.list() would hide today's
  // misses, and the retake would come back with fresh concepts instead of Review variants
  const days = allDays.some(d => d.date === todayK) ? allDays.map(d => d.date === todayK ? today : d) : allDays.concat([today]);
  const d = buildDay(addDays(todayK, 1), days);
  const n = attNo() + 1;
  const r = { items: d.items, answers: {}, score: 0, done: false, seed: todayK + "#r" + n, date: todayK, startedAt: new Date().toISOString() };
  today.retakes = (today.retakes || []).concat([r]);
  Object.keys(picks).forEach(k => delete picks[k]);
  renderToday();
  window.scrollTo({ top: 0, behavior: "smooth" });
  try { await store.patch(todayK, { retakes: today.retakes }); }
  catch (err) { toast("Saved on this phone. It will sync online with your next answer."); }
}

/* ───────── interactions ───────── */
/* records an answer (or a time-out), redraws, unlocks the next question and saves */
async function finalize(idx, ans) {
  const a0 = att();
  const retake = attNo() > 0;
  a0.answers[idx] = ans;
  a0.score = scoreOf(a0);
  if (ans.final) timerClear(idx);
  const justDone = finalCount(a0) === a0.items.length;
  if (justDone) { a0.done = true; a0.doneAt = ans.at; }

  const card = document.getElementById(`q${idx}`);
  if (card) card.outerHTML = cardHTML(idx);
  const nxt = activeIdx();
  if (nxt >= 0 && nxt !== idx) {
    const nc = document.getElementById(`q${nxt}`);
    if (nc) nc.outerHTML = cardHTML(nxt);
  }
  renderAxon();
  renderSummary();
  timerSync();
  upsertLocalDay(today);

  const fb = document.querySelector(`#q${idx} .fb`);
  if (fb) fb.scrollIntoView({ block: "nearest", behavior: "smooth" });
  if (a0.done) setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 900);

  const patch = retake
    ? { retakes: today.retakes }
    : Object.assign({ answers: { [idx]: ans }, score: today.score }, justDone ? { done: true, doneAt: today.doneAt } : {});
  try { await store.patch(todayK, patch); }
  catch (err) { toast("Saved on this phone. It will sync online with your next answer."); }
}

$("#summary").addEventListener("click", e => {
  if (e.target.closest("#retake")) startRetake();
});

$("#questions").addEventListener("click", async e => {
  const card = e.target.closest(".q");
  if (!card || !today) return;
  const a0 = att();
  const idx = Number(card.dataset.idx);
  if (!Number.isInteger(idx) || idx !== activeIdx()) return;   // only the question he is on
  const prev = a0.answers[idx];
  if (isFinal(prev)) return;
  const vw = viewOf(a0, idx);

  const opt = e.target.closest(".opt");
  if (opt && !opt.disabled) {
    const i = Number(opt.dataset.i);
    let p = picks[idx] || [];
    if (vw.type === "multi") p = p.includes(i) ? p.filter(x => x !== i) : [...p, i];
    else p = [i];
    picks[idx] = p;
    card.querySelectorAll(".opt").forEach(b => b.setAttribute("aria-pressed", String(p.includes(Number(b.dataset.i)))));
    card.querySelector(".check").disabled = !p.length;
    return;
  }
  if (!e.target.closest(".check")) return;
  const p = (picks[idx] || []).slice().sort((a, b) => a - b);
  if (!p.length) return;
  const ok = same(p, vw.correct);
  const at = new Date().toISOString();
  let ans;
  if (!prev) {
    if (ok) ans = { first: p, firstOk: true, pick: p, ok: true, tries: 1, final: true, pts: 1, at };
    else if (vw.type === "tf") ans = { first: p, firstOk: false, pick: p, ok: false, tries: 1, final: true, pts: 0, at }; // true/false: one try only
    else ans = { first: p, firstOk: false, tries: 1, final: false, at };
  } else {
    if (vw.type === "multi" && same(p, prev.first)) { toast("Change at least one pick before checking again."); return; }
    ans = { first: prev.first, firstOk: false, pick: p, ok, tries: 2, final: true, pts: ok ? 0.5 : 0, at };
  }
  if (vw.type === "multi" && !ans.final) picks[idx] = p; else delete picks[idx];
  await finalize(idx, ans);
});

function upsertLocalDay(d) {
  const i = allDays.findIndex(x => x.date === d.date);
  if (i >= 0) allDays[i] = d; else allDays.push(d);
  if (!$("#view-results").hidden) renderResults();
}

let toastTimer;
function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 5000);
}

/* ───────── results ───────── */
function renderResults() {
  const days = allDays.filter(d => d && d.date && d.items).sort((a, b) => (a.date < b.date ? 1 : -1));
  const done = days.filter(d => d.done);
  const avg = done.length ? (done.reduce((s, d) => s + scoreOf(d), 0) / done.length) : 0;
  let streak = 0, k = todayK;
  const doneSet = new Set(done.map(d => d.date));
  if (!doneSet.has(k)) k = addDays(k, -1);
  while (doneSet.has(k)) { streak++; k = addDays(k, -1); }

  const hist = history(days, null);
  const review = BANK.filter(c => hist[c.id] && !hist[c.id].last.ok);

  let h = `<div class="panel"><h2>${STUDENT}'s progress</h2><div class="stats">`;
  h += `<div class="stat"><span class="n">${done.length}</span><span class="l">days completed</span></div>`;
  h += `<div class="stat"><span class="n">${done.length ? avg.toFixed(1) : "—"}<small>/${PER_DAY}</small></span><span class="l">average</span></div>`;
  h += `<div class="stat"><span class="n">${streak}</span><span class="l">days in a row</span></div>`;
  h += `</div>`;

  h += `<div class="strip" role="img" aria-label="Scores for the last 14 days">`;
  for (let i = 13; i >= 0; i--) {
    const dk = addDays(todayK, -i);
    const d = days.find(x => x.date === dk);
    const answered = d ? finalCount(d) : 0;
    let cls = "box", label = "·";
    if (d && answered) { const sc = scoreOf(d); cls += " s" + Math.min(5, Math.floor(sc / PER_DAY * 5)); label = pts(sc); if (!d.done) cls += " part"; }
    if (dk === todayK) cls += " today";
    h += `<div class="cell"><div class="${cls}" title="${esc(fmt(dk))}">${label}</div><span class="d">${keyToDate(dk).getDate()}</span></div>`;
  }
  h += `</div><div class="legend"><span>Points per day (0–${PER_DAY}), last 14 days</span><span><i style="outline:1.5px dashed var(--muted);outline-offset:-1.5px"></i>not finished</span></div></div>`;

  h += `<div class="panel"><h2>Mastery by topic</h2><div class="topics">`;
  Object.entries(TOPICS).forEach(([tk, tn]) => {
    const cs = BANK.filter(c => c.t === tk);
    const m = cs.filter(c => hist[c.id] && hist[c.id].last.ok).length;
    const r = cs.filter(c => hist[c.id] && !hist[c.id].last.ok).length;
    h += `<div class="trow"><div class="tl"><span>${esc(tn)}</span><span>${m}/${cs.length} mastered</span></div>`;
    h += `<div class="bar"><i class="m" style="width:${(m / cs.length) * 100}%"></i><i class="r" style="width:${(r / cs.length) * 100}%"></i></div></div>`;
  });
  h += `</div><div class="legend"><span><i style="background:var(--blue)"></i>right on first try</span><span><i style="background:var(--bad)"></i>needs review</span><span><i style="background:var(--seg-empty)"></i>not seen yet</span></div></div>`;

  h += `<div class="panel"><h2>Needs review</h2>`;
  h += review.length ? `<div class="pills">${review.map(c => `<span class="pill">${esc(c.name)}</span>`).join("")}</div><p class="small">They come back in the next day's questions, asked a different way.</p>`
    : `<p class="empty">Nothing to review.</p>`;
  h += `</div>`;

  h += `<div class="panel"><h2>Answers</h2><div class="history">`;
  const shown = days.filter(d => finalCount(d));
  if (!shown.length) h += `<p class="empty">No answers yet. They show up here as soon as ${STUDENT} answers the first question.</p>`;
  shown.forEach(d => {
    const badge = d.done ? `<span class="badge ${scoreOf(d) <= PER_DAY / 2 ? "low" : ""}">${pts(scoreOf(d))}/${PER_DAY}</span>` : `<span class="badge inc">${finalCount(d)}/${PER_DAY} answered</span>`;
    h += `<details class="day"><summary><span class="dd">${esc(fmt(d.date))}</span>${badge}</summary><div class="rows">`;
    if ((d.retakes || []).length) {
      h += `<p class="small">Rounds this day: <b>#1 ${pts(scoreOf(d))}/${PER_DAY} (counts)</b> · `
        + d.retakes.map((r, n) => `#${n + 2} ${pts(scoreOf(r))}/${PER_DAY}`).join(" · ")
        + `. The questions below are round 1.</p>`;
    }
    d.items.forEach((it, i) => {
      const vw = viewOf(d, i), a = d.answers[i];
      if (!vw) return;
      const f = isFinal(a);
      const mark = !f ? `<span class="ic">–</span>` : a.timeout ? `<span class="ic n">⏱</span>`
        : (a.ok && a.tries !== 2) ? `<span class="ic y">✓</span>` : a.ok ? `<span class="ic h">½</span>` : `<span class="ic n">✕</span>`;
      h += `<div class="drow">${mark}<div><div class="nm">${esc(vw.c.name)}${it.review ? ` <span class="chip review">Review</span>` : ""}</div><div class="qq">${esc(vw.v.q)}</div>`;
      if (f && a.timeout) h += `<div>Ran out of time · Correct: <b>${esc(vw.correct.map(x => optText(vw, x)).join(" · "))}</b></div>`;
      else if (f && a.tries === 2) h += `<div>1st try: ${esc((a.first || []).map(x => optText(vw, x)).join(" · "))}<br>2nd try: ${esc((a.pick || []).map(x => optText(vw, x)).join(" · "))}${a.ok ? "" : `<br>Correct: <b>${esc(vw.correct.map(x => optText(vw, x)).join(" · "))}</b>`}</div>`;
      h += `</div></div>`;
    });
    h += `</div></details>`;
  });
  h += `</div></div>`;
  $("#results").innerHTML = h;
}

/* ───────── tabs ───────── */
function showTab(name) {
  const res = name === "results";
  $("#tab-today").setAttribute("aria-selected", String(!res));
  $("#tab-results").setAttribute("aria-selected", String(res));
  $("#view-today").hidden = res;
  $("#view-results").hidden = !res;
  if (res) renderResults();
  try { localStorage.setItem(KEY_PREFIX + ":tab", name); } catch (e) {}
}
$("#tab-today").addEventListener("click", () => showTab("today"));
$("#tab-results").addEventListener("click", () => showTab("results"));

/* ───────── boot ───────── */
async function loadToday() {
  todayK = dayKey();
  let d = await store.get(todayK);
  if (!d || !Array.isArray(d.items) || !d.items.length) {
    allDays = await store.list();
    d = buildDay(todayK, allDays);
    const again = await store.get(todayK); // another device may have created it meanwhile
    if (again && Array.isArray(again.items) && again.items.length) d = again;
    else await store.set(todayK, d);
  }
  d.answers = d.answers || {};
  d.retakes = (Array.isArray(d.retakes) ? d.retakes : []).filter(r => r && Array.isArray(r.items) && r.items.length);
  today = d;
  upsertLocalDay(today);
  renderToday();
}

async function start() {
  const nj = document.getElementById("nojs"); if (nj) nj.remove();
  $("#dateline").textContent = fmt(todayK);
  renderAxon();
  let db = null;
  if (window.claude && typeof window.claude.use === "function") {
    try { db = await window.claude.use("db"); } catch (e) { db = null; }
  }
  store = SHEETS_URL ? sheetsStore(SHEETS_URL) : db ? dbStore(db) : localStore();
  try {
    allDays = await store.list();
    await loadToday();
  } catch (e) {
    store = localStore();
    allDays = await store.list();
    await loadToday();
  }
  $("#storeNote").textContent = store.mode !== "local"
    ? "Results are saved online and show up in the Results tab."
    : "Results are saved on this phone. When you finish, tap “Send results on WhatsApp”.";
  store.watch(list => {
    allDays = list;
    const remote = list.find(x => x.date === todayK);
    if (remote && today && JSON.stringify(remote.answers || {}) !== JSON.stringify(today.answers) &&
        Object.keys(remote.answers || {}).length >= Object.keys(today.answers).length) {
      today = { ...remote, answers: remote.answers || {} };
      renderToday();
    } else if (today) upsertLocalDay(today);
    if (!$("#view-results").hidden) renderResults();
  });
  let saved = "today";
  try { saved = localStorage.getItem(KEY_PREFIX + ":tab") || "today"; } catch (e) {}
  if (saved === "results") showTab("results");
}

/* closing or hiding the app freezes the clock; coming back resumes the same question */
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { timerPause(); return; }
  if (store && dayKey() !== todayK) { timerStop(); today = null; renderAxon(); loadToday(); return; }
  timerSync();
});
window.addEventListener("pagehide", timerPause);

start();
})();
