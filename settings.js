(function () {
  var STORAGE_KEY = "siteDataOverrides";

  var settingsBtn = document.getElementById("settings-btn");
  var settingsDialog = document.getElementById("settings-dialog");
  var namesField = document.getElementById("settings-names");
  var questionsField = document.getElementById("settings-questions");
  var powerbiField = document.getElementById("settings-powerbi");
  var auditField = document.getElementById("settings-audit");
  var commissionsField = document.getElementById("settings-commissions");
  var saveBtn = document.getElementById("settings-save-btn");

  function populateFields() {
    namesField.value = NAMES.join("\n");
    questionsField.value = QUESTIONS.join("\n");
    powerbiField.value = POWERBI_DASHBOARD_URL;
    auditField.value = AUDIT_ITEMS.join("\n");
    commissionsField.value = COMMISSIONS.join("\n");
  }

  function linesToList(value) {
    return value
      .split("\n")
      .map(function (s) {
        return s.trim();
      })
      .filter(function (s) {
        return s.length > 0;
      });
  }

  function saveFields() {
    var names = linesToList(namesField.value);
    var questions = linesToList(questionsField.value);
    var auditItems = linesToList(auditField.value);
    var commissions = linesToList(commissionsField.value);
    var powerbiUrl = powerbiField.value.trim();

    if (!names.length) {
      window.alert("Add at least one name before saving.");
      return;
    }
    if (!questions.length) {
      window.alert("Add at least one wheel question before saving.");
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        names: names,
        questions: questions,
        powerbiUrl: powerbiUrl,
        auditItems: auditItems,
        commissions: commissions,
      })
    );
    window.location.reload();
  }

  settingsBtn.addEventListener("click", function () {
    populateFields();
    settingsDialog.showModal();
  });
  saveBtn.addEventListener("click", saveFields);
})();
