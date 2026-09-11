const fs=require('fs');
const path=require('path');
// Usage: node tools/build-question-bank.js  ->  docs/question-bank.html (open it and print to PDF)
eval(fs.readFileSync(path.join(__dirname,'..','js','bank.js'),'utf8')+';global.BANK=BANK;global.TOPICS=TOPICS;global.drawImg=drawImg;');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const TL={mc:"Multiple choice",scn:"Analyze the case",tf:"True or false",multi:"Select all"};
let total=0, body='';
for (const [tk,tn] of Object.entries(TOPICS)) {
  const cs=BANK.filter(c=>c.t===tk);
  body+=`<section><h2>${esc(tn)} <span class="cnt">${cs.length} topics</span></h2>`;
  for (const c of cs) {
    body+=`<article><h3>${esc(c.name)}</h3><ol>`;
    for (const v of c.v) {
      total++;
      let ans;
      if (v.t==='tf') ans = v.a ? 'True' : 'False';
      body+=`<li><span class="chip">${TL[v.t]}</span>${v.img?`<div class="fig">${drawImg(v.img)}</div>`:''}<p class="q">${esc(v.q)}</p>`;
      if (v.t==='tf') body+=`<p class="ans">Answer: <b>${ans}</b></p>`;
      else {
        const correct = v.t==='multi'? v.a : [0];
        body+=`<ul class="opts">`+v.o.map((o,i)=>`<li class="${correct.includes(i)?'ok':''}">${correct.includes(i)?'<span class="tick">✓</span>':'<span class="tick"></span>'}${esc(o)}</li>`).join('')+`</ul>`;
      }
      body+=`</li>`;
    }
    body+=`</ol><p class="ex"><b>Explanation shown if missed:</b> ${esc(c.ex)}</p></article>`;
  }
  body+=`</section>`;
}
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Question Bank · A&amp;P Chapter 1</title>
<style>
:root{--ground:#EDF1F5;--surface:#fff;--ink:#141D2B;--muted:#586477;--line:#D3DAE3;--blue:#2A5BB5;--ok:#1C7A52;--ok-tint:#E1F2E9;--violet:#7A3F97;--violet-tint:#F2E9F7}
@media (prefers-color-scheme: dark){:root{--ground:#0D1219;--surface:#151C26;--ink:#E3E8F0;--muted:#97A3B5;--line:#293343;--blue:#82A6EE;--ok:#5EC592;--ok-tint:#133021;--violet:#C89EDD;--violet-tint:#2A1F34}}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font:18px/1.5 "Atkinson Hyperlegible","Segoe UI",system-ui,sans-serif}
.wrap{max-width:720px;margin:0 auto;padding:24px 16px 64px}
.eyebrow{font:13px ui-monospace,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.top{text-align:center;margin-bottom:14px}
h1{font-size:clamp(56px,17vw,76px);line-height:1;margin:4px 0 0;letter-spacing:-.03em;color:var(--blue)}
.lead{color:var(--muted);margin:0 0 8px}
.note{background:var(--violet-tint);color:var(--ink);border-radius:12px;padding:12px 14px;font-size:16px;margin:14px 0 0}
h2{font-size:26px;margin:36px 0 12px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.cnt{font:14px ui-monospace,Menlo,monospace;color:var(--muted);font-weight:400}
article{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:18px 16px;margin:0 0 14px}
h3{font-size:20px;margin:0 0 8px;color:var(--blue)}
ol{margin:0;padding-left:22px;display:grid;gap:14px}
ol>li::marker{color:var(--muted);font-family:ui-monospace,Menlo,monospace;font-size:15px}
.chip{display:inline-block;font:11.5px ui-monospace,Menlo,monospace;letter-spacing:.05em;text-transform:uppercase;border:1px solid var(--line);border-radius:5px;padding:2px 7px;color:var(--muted)}
.q{margin:6px 0 6px;font-weight:700}
.opts{list-style:none;margin:0;padding:0;display:grid;gap:4px;font-size:16.5px}
.opts li{display:flex;gap:8px;padding:5px 8px;border-radius:8px}
.opts li.ok{background:var(--ok-tint);font-weight:700}
.tick{width:16px;flex:none;color:var(--ok)}
.ans{margin:0;font-size:16.5px}.ans b{color:var(--ok)}
.fig{margin:6px 0;max-width:200px}.fig svg{width:100%;height:auto}.dia-body{fill:#e3e8ef;stroke:#586477;stroke-width:1.5}.dia-hi{fill:#2A5BB5;opacity:.85}.dia-line{stroke:#141D2B;stroke-width:2}.dia-cut{stroke:#B53A32;stroke-width:3;stroke-dasharray:8 6}.dia-navel{fill:#141D2B}.dia-lbl{font:500 16px ui-monospace,monospace;text-anchor:middle;fill:#141D2B}.dia-lbl2,.dia-cap{font:11px ui-monospace,monospace;text-anchor:middle;fill:#586477}
.ex{margin:14px 0 0;padding-top:12px;border-top:1px solid var(--line);font-size:16.5px}
@media print{body{background:#fff;font-size:14px}.wrap{max-width:none;padding:0}article{border-color:#ccc}ol{display:block}ol>li{margin-bottom:8px;break-inside:avoid}.opts{gap:0;font-size:13px}.opts li{padding:1px 6px}.q{margin:2px 0}.ans,.ex{font-size:13px}.ex{margin-top:8px;padding-top:8px}article{padding:12px 14px;margin-bottom:10px}h3{font-size:16px;margin-bottom:4px}h2{font-size:20px;margin:18px 0 8px}h1{font-size:56px}}
</style></head><body><div class="wrap">
<header class="top"><div class="eyebrow">Question Bank · A&amp;P Chapter 1</div>
<h1>Koran</h1></header>
<p class="lead">${BANK.length} topics · ${total} questions. Each day 10 are picked at random. True/false has one try; other questions have two. Any topic missed comes back the next day with a different question. Correct answers are in green (the dashboard shuffles the answer order).</p>
${body}
</div></body></html>`;
fs.writeFileSync(path.join(__dirname,'..','docs','question-bank.html'),html);
console.log(BANK.length,total);
