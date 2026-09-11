// Settings for this dashboard. Change these, not app.js.
window.APP_CONFIG = {
  STUDENT: "Koran",
  CHAPTER: "A&P Chapter 1",
  // Paste the Google Apps Script web app URL (ends in /exec). Empty = results stay on the phone only.
  SHEETS_URL: "",
  // Change this when starting a new chapter so each chapter keeps its own history on the phone.
  STORAGE_KEY: "ap-ch1-koran",

  // ── Irene's rules. Change the numbers here, nothing else. ──
  // Seconds allowed per question. The clock covers BOTH tries and pauses if the app is closed.
  Q_SECONDS: 120,
  // Offer to retake the test when the day's score is this or lower (out of 10).
  RETAKE_MAX_SCORE: 2,
  // Minutes he must wait — studying the concepts — before the retake unlocks.
  RETAKE_WAIT_MIN: 60
};
