# A&P Daily Review (Koran) — CLAUDE.md

Daily review dashboard for **Koran** (student, has NO Claude account). Owner: **Irene** — talk to her in Spanish, English for technical terms. The dashboard itself is **all in English**.

## Goal of this repo
1. Koran opens a normal link on his phone every day and answers **10 questions**.
2. Irene sees his results **per day and cumulative** on her phone.
3. Running it must cost **zero tokens** day to day: static site on **GitHub Pages** + **Google Sheets** (Apps Script web app) for results + **WhatsApp messages via CallMeBot** sent by Apps Script triggers. Tokens are only spent when adding chapters or changing code.

## Current chapter
A&P Chapter 1: Introduction to Anatomy & Physiology (source photos in `docs/study-guide/`). Bank: 50 concepts, 139 questions in `js/bank.js`.

## Rules Irene set (do not change without asking her)
- 10 questions/day, score out of 10. Types: multiple choice (`mc`), analyze the case (`scn`), true/false (`tf`), select all (`multi`). No open questions. Diagram questions allowed (`img`: `quad:*`, `reg:*`, `plane:*`, drawn by `drawImg()` in bank.js).
- **Correct on 1st try:** 1 point.
- **True/false wrong:** "Incorrect", 0 points, no 2nd try, show correct answer + simple explanation.
- **Other types, 1st miss:** "Incorrect, one more try" — do NOT reveal the answer.
  - Correct on 2nd try: ½ point.
  - Wrong twice: 0 points, show correct answer + simple explanation.
- Every concept missed on the 1st try comes back the next day with a **different variant** (marked "Review").
- **One question at a time.** Only the current question is answerable; the ones after it render as locked stubs. He cannot skip ahead or work out of order.
- **2 minutes per question** (`Q_SECONDS` in config.js). One clock per question covering **both tries** — a wrong 1st try does not reset it. The clock **pauses** when the app is hidden or closed and resumes on the same question (elapsed ms in localStorage, key `<STORAGE_KEY>:t:<date>:<attempt>:<idx>`). Time out = "Time's up", 0 points, show correct answer + explanation, concept comes back tomorrow as Review. Recorded as `timeout:true`.
- **Retake on a bad day.** When a finished attempt scores **≤ `RETAKE_MAX_SCORE`** (2/10), the summary lists every missed concept **with its explanation** to study, and a retake unlocks **`RETAKE_WAIT_MIN` minutes later** (60) with a live countdown. The retake is built with `buildDay(tomorrow)` so the questions are **different variants** of the same concepts. It is stored in `day.retakes[]` and **never changes the official score** — the first attempt of the day is always the one that counts, in the app and in the Sheet.
- Explanations: short, simple, middle-school level.
- Design: "Koran" big at the **top center**; sticky score card at the top that says **"Final score"** when done; **always dark theme**; big text/buttons for phones; small **@clipAI** at the very bottom.

## Files
```
index.html                 page shell
css/styles.css             styles (dark tokens in :root)
js/config.js               STUDENT, CHAPTER, SHEETS_URL, STORAGE_KEY,
                           Q_SECONDS, RETAKE_MAX_SCORE, RETAKE_WAIT_MIN  ← edit this, not app.js
js/bank.js                 TOPICS, BANK, drawImg()   (mc/scn: correct option FIRST; tf: a=true/false; multi: a=[indices])
js/app.js                  day builder, 2-try logic, results tab, storage adapters (localStore, sheetsStore, dbStore)
apps-script/Code.gs        Google Apps Script backend (doGet/doPost), readable sheets, daily WhatsApp (CallMeBot) + optional email
tools/build-question-bank.js   node → docs/question-bank.html (print to PDF)
tools/test-dashboard.js        `npm i jsdom && node tools/test-dashboard.js` — drives the real page
                               headless: sequential lock, 2-min clock, time-out, retake gate,
                               official-score protection, Google Sheets payload. Run after touching app.js.
docs/                      question-bank.pdf, study-guide photos, preview-no-js.html
```

## Storage
- `SHEETS_URL` empty → results stay in the phone's localStorage.
- `SHEETS_URL` set → `sheetsStore`: GET `?op=list` / `?op=get&date=YYYY-MM-DD`; POST (Content-Type `text/plain` to avoid CORS preflight) `{op:"set", date, student, day, readable}`. localStorage is a cache; failed saves retry on the next answer.
- Day doc: `{date, student, items:[{c,v,review}], answers:{"0":{first,firstOk,pick,ok,tries,final,pts,timeout,at}}, score, done, doneAt, retakes:[{items,answers,score,done,doneAt,seed}]}`.
  - `today` = the official attempt, never overwritten. `att()` in app.js returns the attempt on screen (last retake, else official). `scoreOf(today)`, `history()` and the Sheet summary always read the official one.
  - Retake saves patch the **whole `retakes` array** (`localStore.patch` only deep-merges `answers`).
- Sheets written by Code.gs: `Days` (raw JSON), `Answers` (one row per question, with an `attempt` column: `official` / `practice N`), `Daily summary` (has a `practice rounds` column — keep it before `updated` so the `Totals` formulas on columns D/F/G keep working), `Totals` (formulas).

## Deployment checklist (do these with Irene, step by step, in Spanish)
1. `git init`, commit, create a GitHub repo (public is required for free GitHub Pages), push, enable Pages (branch `main`, root). Test the link on a phone.
2. Google Sheets: create a sheet "A&P Review – Koran" → Extensions → Apps Script → paste `apps-script/Code.gs` → set project time zone (America/Puerto_Rico or America/New_York) → Deploy → New deployment → Web app, Execute as **Me**, access **Anyone** → authorize → copy the `/exec` URL.
3. Put that URL in `js/config.js` → commit/push. Answer one question on the live site and confirm rows appear in `Answers`.
4. WhatsApp via **CallMeBot** (free, personal use; each person activates their OWN number):
   - Koran and Irene each follow https://www.callmebot.com/blog/free-api-whatsapp-messages/ : save the bot number shown there, send it "I allow callmebot to send me messages", receive an apikey.
   - In Apps Script → Project Settings → **Script properties** add: `DASHBOARD_URL`, `STUDENT_WHATSAPP`, `STUDENT_CALLMEBOT_KEY`, `PARENT_WHATSAPP`, `PARENT_CALLMEBOT_KEY` (numbers with country code, e.g. +1787…). Optional: `STUDENT_EMAIL`, `PARENT_EMAIL`. **Never put these in the repo** (it is public).
   - Run `testWhatsApp()` once (both should get a test message), then run `setupDailyTriggers()` once: 7 AM link to Koran, 6 PM nudge only if unfinished, 8 PM results to Irene (score, incorrect topics, 2nd-try topics, practice rounds, cumulative average).
   - If CallMeBot activation says the bot is full, wait and retry later; email copies still work meanwhile.
5. On Koran's phone: open the link → Share → "Add to Home Screen".

## New chapter later
Replace `js/bank.js` with the new chapter's bank (same format), update `CHAPTER` and `STORAGE_KEY` in `js/config.js`, regenerate `docs/question-bank.pdf`. Keep the same Sheet (the `chapter` column separates them) or make a new one.

## Notes
- The Apps Script URL is unguessable but public; it only stores quiz answers — no personal data beyond the first name.
- Test locally: `npx serve .` (localStorage mode) — for Sheets mode, point `SHEETS_URL` at the real /exec URL.
