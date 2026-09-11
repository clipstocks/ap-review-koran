// Settings for this dashboard. Change these, not app.js.
window.APP_CONFIG = {
  STUDENT: "Koran",
  CHAPTER: "A&P Chapter 1",
  // Paste the Google Apps Script web app URL (ends in /exec). Empty = results stay on the phone only.
  SHEETS_URL: "https://script.google.com/macros/s/AKfycbz4DjMNMn549UCWBD6j9agqS8VT3VmtvAUHFiv8xDmG_z7W_0FoSo1dZ4M6tkOtUWAu/exec",
  // Change this when starting a new chapter so each chapter keeps its own history on the phone.
  STORAGE_KEY: "ap-ch1-koran",

  // ── Irene's rules. Change the numbers here, nothing else. ──
  // Seconds allowed per question. The clock covers BOTH tries and pauses if the app is closed.
  Q_SECONDS: 120,
  // Minutes to wait before he can take it again. 0 = straight away.
  RETAKE_WAIT_MIN: 0,
  // Safety cap on attempts per day. Every attempt is stored in one Google Sheets cell, and a
  // cell holds 50,000 characters — about 30 attempts. 20 keeps a wide margin.
  MAX_ATTEMPTS: 20
};
