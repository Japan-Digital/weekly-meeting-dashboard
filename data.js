// This file intentionally ships with no real data checked into git.
// Everything below is populated at load time from data imported via the
// "Import Data (CSV)" button (see site-data.js), persisted in this
// browser's localStorage. Until something is imported, these stay empty
// and the rest of the app shows a "no data loaded" state.

let NAMES = [];
let QUESTIONS = [];
let POWERBI_DASHBOARD_URL = "";
let AUDIT_ITEMS = [];
let COMMISSIONS = [];

// Apply any data imported earlier via "Import Data (CSV)" (see site-data.js).
// Runs synchronously here, before chain.js/app.js read these globals.
(function () {
  try {
    var raw = window.localStorage.getItem("siteDataOverrides");
    if (!raw) return;
    var saved = JSON.parse(raw);
    if (Array.isArray(saved.names) && saved.names.length) NAMES = saved.names;
    if (Array.isArray(saved.questions) && saved.questions.length) QUESTIONS = saved.questions;
    if (typeof saved.powerbiUrl === "string" && saved.powerbiUrl) {
      POWERBI_DASHBOARD_URL = saved.powerbiUrl;
    }
    if (Array.isArray(saved.auditItems) && saved.auditItems.length) AUDIT_ITEMS = saved.auditItems;
    if (Array.isArray(saved.commissions) && saved.commissions.length) COMMISSIONS = saved.commissions;
  } catch (err) {
    // Ignore corrupt/unreadable storage — fall back to the empty defaults above.
  }
})();
