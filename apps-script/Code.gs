/**
 * Daily A&P Review — Google Sheets backend (Google Apps Script web app)
 *
 * Sheets created automatically:
 *   Days           raw JSON per day (used by the dashboard — don't edit by hand)
 *   Answers        one row per question: date, question, 1st try, 2nd try, correct answer, points
 *   Daily summary  one row per day: date, score, answered, completed
 *   Totals         cumulative: days completed, average score, best score, last day
 *
 * Daily WhatsApp via CallMeBot: 7 AM link to Koran, 6 PM nudge if unfinished, 8 PM results to Irene.
 *
 * Setup: see README.md (step 3). Deploy > New deployment > Web app,
 *   Execute as: Me · Who has access: Anyone. Copy the /exec URL into js/config.js (SHEETS_URL).
 */

/*
 * Private settings go in Apps Script → Project Settings → Script properties (NOT in this file,
 * because the GitHub repo is public):
 *   DASHBOARD_URL           GitHub Pages link to the dashboard
 *   STUDENT_WHATSAPP        Koran's WhatsApp number with country code, e.g. +17875551234
 *   STUDENT_CALLMEBOT_KEY   the apikey CallMeBot sent to Koran
 *   PARENT_WHATSAPP         Irene's WhatsApp number with country code
 *   PARENT_CALLMEBOT_KEY    the apikey CallMeBot sent to Irene
 *   STUDENT_EMAIL, PARENT_EMAIL   (optional) email copies
 */
const PROPS = PropertiesService.getScriptProperties();
const CONFIG = {
  STUDENT: 'Koran',
  REMINDER_HOUR: 7,     // 7 AM: "your questions are ready" → Koran
  NUDGE_HOUR: 18,       // 6 PM: reminder only if today is not finished → Koran
  SUMMARY_HOUR: 20      // 8 PM: daily results → Irene
};
const prop_ = k => (PROPS.getProperty(k) || '').trim();

const DAYS = 'Days', ANSWERS = 'Answers', SUMMARY = 'Daily summary', TOTALS = 'Totals';

/* ───────── web app ───────── */
function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    if (p.op === 'get') return json_(getDay_(p.date));
    return json_(listDays_());
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const body = JSON.parse(e.postData.contents);
    if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) throw new Error('bad date');
    let day;
    if (body.op === 'set') {
      day = body.day;
    } else if (body.op === 'patch') {
      const cur = getDay_(body.date) || {};
      day = Object.assign({}, cur, body.patch, { answers: Object.assign({}, cur.answers || {}, (body.patch || {}).answers || {}) });
    } else {
      throw new Error('unknown op');
    }
    day.date = body.date;
    saveDay_(day);
    if (body.readable) writeReadable_(body.readable);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ───────── storage ───────── */
function sheet_(name, header) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (header) {
      sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
      sh.setFrozenRows(1);
      sh.getRange('A:A').setNumberFormat('@');
    }
  }
  return sh;
}

function listDays_() {
  const sh = sheet_(DAYS, ['date', 'json', 'score', 'done', 'updated']);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 2).getValues()
    .filter(r => r[0] && r[1])
    .map(r => JSON.parse(r[1]));
}

function findRow_(sh, date) {
  const last = sh.getLastRow();
  if (last < 2) return -1;
  const dates = sh.getRange(2, 1, last - 1, 1).getDisplayValues();
  for (let i = 0; i < dates.length; i++) if (dates[i][0] === date) return i + 2;
  return -1;
}

function getDay_(date) {
  const sh = sheet_(DAYS, ['date', 'json', 'score', 'done', 'updated']);
  const row = findRow_(sh, date);
  return row < 0 ? null : JSON.parse(sh.getRange(row, 2).getValue());
}

function saveDay_(day) {
  const sh = sheet_(DAYS, ['date', 'json', 'score', 'done', 'updated']);
  const row = findRow_(sh, day.date);
  const values = [[day.date, JSON.stringify(day), day.score || 0, !!day.done, new Date()]];
  if (row < 0) sh.appendRow(values[0]);
  else sh.getRange(row, 1, 1, 5).setValues(values);
}

/* ───────── readable sheets for Irene ───────── */
function writeReadable_(r) {
  const ans = sheet_(ANSWERS, ['date', 'attempt', '#', 'topic', 'concept', 'type', 'question', '1st try', '2nd try', 'correct answer', 'result', 'points', 'review?']);
  // remove this date's old rows, then write the current ones
  const last = ans.getLastRow();
  if (last >= 2) {
    const dates = ans.getRange(2, 1, last - 1, 1).getDisplayValues();
    for (let i = dates.length - 1; i >= 0; i--) if (dates[i][0] === r.date) ans.deleteRow(i + 2);
  }
  const rows = (r.rows || []).map(x => [r.date, x.attempt || 'official', x.n, x.topic, x.concept, x.type, x.question, x.first, x.second, x.correct, x.result, x.points, x.review ? 'yes' : '']);
  if (rows.length) ans.getRange(ans.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);

  // 'extra rounds' goes before 'updated' so the Totals formulas (columns D, F, G) keep working
  const sum = sheet_(SUMMARY, ['date', 'student', 'chapter', 'score', 'out of', 'answered', 'completed', 'extra rounds', 'updated']);
  const prac = (r.practice || []).map(p => '#' + p.n + ' ' + p.score + '/' + r.total).join(' · ');
  const vals = [r.date, r.student, r.chapter, r.score, r.total, r.answered, r.done ? 'yes' : 'no', prac, new Date()];
  const row = findRow_(sum, r.date);
  if (row < 0) sum.appendRow(vals); else sum.getRange(row, 1, 1, vals.length).setValues([vals]);

  ensureTotals_();
}

function ensureTotals_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName(TOTALS)) return;
  const sh = ss.insertSheet(TOTALS);
  const s = "'" + SUMMARY + "'";
  sh.getRange('A1:B6').setValues([
    ['Cumulative results', ''],
    ['Days completed', '=COUNTIF(' + s + '!G2:G,"yes")'],
    ['Average score (completed days)', '=IFERROR(AVERAGEIF(' + s + '!G2:G,"yes",' + s + '!D2:D),"—")'],
    ['Best score', '=IFERROR(MAXIFS(' + s + '!D2:D,' + s + '!G2:G,"yes"),"—")'],
    ['Questions answered', '=SUM(' + s + '!F2:F)'],
    ['Last day', '=IFERROR(INDEX(SORT(FILTER(' + s + '!A2:A,' + s + '!A2:A<>""),1,FALSE),1),"—")']
  ]);
  sh.getRange('A1').setFontWeight('bold').setFontSize(14);
  sh.setColumnWidth(1, 240);
}

/* ───────── daily WhatsApp (CallMeBot) + optional email — free, no tokens ───────── */
function todayKey_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function sendWhatsApp_(phone, apikey, text) {
  if (!phone || !apikey) return false;
  const url = 'https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent(phone) +
    '&text=' + encodeURIComponent(text) + '&apikey=' + encodeURIComponent(apikey);
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const ok = res.getResponseCode() === 200;
  if (!ok) console.warn('CallMeBot error ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 300));
  return ok;
}

function toStudent_(text, subject) {
  sendWhatsApp_(prop_('STUDENT_WHATSAPP'), prop_('STUDENT_CALLMEBOT_KEY'), text);
  if (prop_('STUDENT_EMAIL')) MailApp.sendEmail(prop_('STUDENT_EMAIL'), subject, text);
}

function toParent_(text, subject) {
  sendWhatsApp_(prop_('PARENT_WHATSAPP'), prop_('PARENT_CALLMEBOT_KEY'), text);
  if (prop_('PARENT_EMAIL')) MailApp.sendEmail(prop_('PARENT_EMAIL'), subject, text);
}

/* rows of today's Answers sheet → { missed: [...], half: [...] } */
function todaysTopics_(date) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ANSWERS);
  const out = { missed: [], half: [] };
  if (!sh || sh.getLastRow() < 2) return out;
  // columns: date, attempt, #, topic, concept, type, question, 1st, 2nd, correct, result, points, review?
  sh.getRange(2, 1, sh.getLastRow() - 1, 13).getDisplayValues().forEach(r => {
    if (r[0] !== date) return;
    if (r[1] !== 'attempt 1') return;           // later rounds never go in Irene's summary
    if (r[10] === 'incorrect' || r[10] === "time's up") out.missed.push(r[4]);
    if (r[10] === 'correct (2nd try)') out.half.push(r[4]);
  });
  return out;
}

function sendDailyReminder() {
  const link = prop_('DASHBOARD_URL');
  toStudent_('Hi ' + CONFIG.STUDENT + '! 📚 Your 10 A&P questions for today are ready:\n' + link,
    'Your 10 questions for today are ready');
}

function sendEveningNudge() {
  const day = getDay_(todayKey_());
  if (day && day.done) return;
  const answered = day ? Object.values(day.answers || {}).filter(a => a.final !== false).length : 0;
  toStudent_('Hi ' + CONFIG.STUDENT + '! You have ' + (10 - answered) + ' A&P questions left for today. ' +
    'It only takes a few minutes 💪\n' + prop_('DASHBOARD_URL'), 'A&P questions left for today');
}

function sendDailySummary() {
  const date = todayKey_();
  const day = getDay_(date);
  let text;
  if (!day || !Object.keys(day.answers || {}).length) {
    text = '📊 ' + CONFIG.STUDENT + ' no contestó las preguntas de hoy (' + date + ').';
  } else {
    const total = (day.items || []).length;
    const answered = Object.values(day.answers).filter(a => a.final !== false).length;
    const t = todaysTopics_(date);
    text = '📊 Resultado de ' + CONFIG.STUDENT + ' — ' + date + '\n' +
      'Puntuación: ' + (day.score || 0) + ' / ' + total + '\n' +
      'Contestadas: ' + answered + ' de ' + total + (day.done ? ' ✅' : ' (sin terminar)') +
      (t.missed.length ? '\nIncorrectas: ' + t.missed.join(', ') : '') +
      (t.half.length ? '\nCorrectas en 2do intento: ' + t.half.join(', ') : '') +
      ((day.retakes || []).length
        ? '\nLa repitió ' + day.retakes.length + (day.retakes.length === 1 ? ' vez más: ' : ' veces más: ') +
          day.retakes.map(function (r, i) {
            return '#' + (i + 2) + ' ' + Object.values(r.answers || {})
              .filter(function (a) { return a.final !== false; })
              .reduce(function (s, a) { return s + (a.pts !== undefined ? a.pts : (a.ok ? 1 : 0)); }, 0) + '/' + total;
          }).join(' · ') + '\n(la puntuación de arriba es la de la primera vuelta)'
        : '') +
      '\n' + totalsLine_() +
      (prop_('DASHBOARD_URL') ? '\nDashboard: ' + prop_('DASHBOARD_URL') : '');
  }
  toParent_(text, 'Resultado diario de ' + CONFIG.STUDENT);
}

function totalsLine_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SUMMARY);
  if (!sh || sh.getLastRow() < 2) return '';
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues().filter(r => r[6] === 'yes');
  if (!rows.length) return '';
  const avg = rows.reduce((s, r) => s + Number(r[3] || 0), 0) / rows.length;
  return 'Acumulado: ' + rows.length + ' días completados · promedio ' + avg.toFixed(1) + ' / 10';
}

/** Run once to check that both WhatsApp numbers receive messages. */
function testWhatsApp() {
  const a = sendWhatsApp_(prop_('STUDENT_WHATSAPP'), prop_('STUDENT_CALLMEBOT_KEY'), 'Test ✅ Daily A&P Review is connected to your WhatsApp.');
  const b = sendWhatsApp_(prop_('PARENT_WHATSAPP'), prop_('PARENT_CALLMEBOT_KEY'), 'Prueba ✅ Recibirás aquí el resultado diario de ' + CONFIG.STUDENT + '.');
  console.log('Koran: ' + (a ? 'sent' : 'NOT sent — check number/key') + ' · Irene: ' + (b ? 'sent' : 'NOT sent — check number/key'));
}

/** Run once from the editor to install the daily messages. */
function setupDailyTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sendDailyReminder').timeBased().everyDays(1).atHour(CONFIG.REMINDER_HOUR).create();
  ScriptApp.newTrigger('sendEveningNudge').timeBased().everyDays(1).atHour(CONFIG.NUDGE_HOUR).create();
  ScriptApp.newTrigger('sendDailySummary').timeBased().everyDays(1).atHour(CONFIG.SUMMARY_HOUR).create();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
