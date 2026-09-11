/**
 * Daily A&P Review — Google Sheets backend (Google Apps Script web app)
 *
 * Sheets created automatically:
 *   Days           raw JSON per day (used by the dashboard — don't edit by hand)
 *   Answers        one row per question: date, question, 1st try, 2nd try, correct answer, points
 *   Daily summary  one row per day: date, score, answered, completed
 *   Totals         cumulative: days completed, average score, best score, last day
 *
 * Setup: see README.md (step 3). Deploy > New deployment > Web app,
 *   Execute as: Me · Who has access: Anyone. Copy the /exec URL into js/config.js (SHEETS_URL).
 */

const CONFIG = {
  STUDENT: 'Koran',
  PARENT_EMAIL: '',     // Irene's email for the daily results summary (leave '' to skip)
  STUDENT_EMAIL: '',    // Koran's email for the daily reminder with the link (leave '' to skip)
  DASHBOARD_URL: '',    // GitHub Pages link to the dashboard
  REMINDER_HOUR: 7,     // 7 AM reminder to the student
  SUMMARY_HOUR: 20      // 8 PM summary to the parent
};

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
  const ans = sheet_(ANSWERS, ['date', '#', 'topic', 'concept', 'type', 'question', '1st try', '2nd try', 'correct answer', 'result', 'points', 'review?']);
  // remove this date's old rows, then write the current ones
  const last = ans.getLastRow();
  if (last >= 2) {
    const dates = ans.getRange(2, 1, last - 1, 1).getDisplayValues();
    for (let i = dates.length - 1; i >= 0; i--) if (dates[i][0] === r.date) ans.deleteRow(i + 2);
  }
  const rows = (r.rows || []).map(x => [r.date, x.n, x.topic, x.concept, x.type, x.question, x.first, x.second, x.correct, x.result, x.points, x.review ? 'yes' : '']);
  if (rows.length) ans.getRange(ans.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);

  const sum = sheet_(SUMMARY, ['date', 'student', 'chapter', 'score', 'out of', 'answered', 'completed', 'updated']);
  const vals = [r.date, r.student, r.chapter, r.score, r.total, r.answered, r.done ? 'yes' : 'no', new Date()];
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

/* ───────── daily emails (free, no tokens) ───────── */
function todayKey_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function sendDailyReminder() {
  if (!CONFIG.STUDENT_EMAIL || !CONFIG.DASHBOARD_URL) return;
  MailApp.sendEmail({
    to: CONFIG.STUDENT_EMAIL,
    subject: 'Your 10 questions for today are ready',
    htmlBody: 'Hi ' + CONFIG.STUDENT + '! Your daily A&P review is ready.<br><br>' +
      '<a href="' + CONFIG.DASHBOARD_URL + '" style="font-size:18px">Open today\'s questions</a>'
  });
}

function sendDailySummary() {
  if (!CONFIG.PARENT_EMAIL) return;
  const day = getDay_(todayKey_());
  let body;
  if (!day || !Object.keys(day.answers || {}).length) {
    body = CONFIG.STUDENT + ' no ha contestado las preguntas de hoy.';
  } else {
    const total = (day.items || []).length;
    const answered = Object.values(day.answers).filter(a => a.final !== false).length;
    body = CONFIG.STUDENT + ' — resultado de hoy: ' + (day.score || 0) + ' / ' + total +
      ' (' + answered + ' de ' + total + ' contestadas' + (day.done ? ', completado' : ', sin terminar') + ').' +
      '<br><br>Detalle en la hoja "Answers" y acumulado en "Totals".' +
      (CONFIG.DASHBOARD_URL ? '<br><a href="' + CONFIG.DASHBOARD_URL + '">Abrir dashboard (pestaña Results)</a>' : '');
  }
  MailApp.sendEmail({ to: CONFIG.PARENT_EMAIL, subject: 'Resultado diario de ' + CONFIG.STUDENT, htmlBody: body });
}

/** Run once from the editor to install the daily emails. */
function setupDailyTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sendDailyReminder').timeBased().everyDays(1).atHour(CONFIG.REMINDER_HOUR).create();
  ScriptApp.newTrigger('sendDailySummary').timeBased().everyDays(1).atHour(CONFIG.SUMMARY_HOUR).create();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
