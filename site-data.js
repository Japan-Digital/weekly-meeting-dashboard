(function () {
  var SITE_STORAGE_KEY = "siteDataOverrides";
  var CHAIN_STORAGE_KEY = "purposefulMomentRotation";

  var exportBtn = document.getElementById("export-data-btn");
  var importBtn = document.getElementById("import-data-btn");
  var importInput = document.getElementById("import-data-input");

  function csvEscape(value) {
    var str = String(value == null ? "" : value);
    if (str.indexOf(",") !== -1 || str.indexOf('"') !== -1 || str.indexOf("\n") !== -1) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function row(type, v1, v2, v3) {
    return [type, csvEscape(v1), csvEscape(v2 || ""), csvEscape(v3 || "")].join(",");
  }

  function exportData() {
    var lines = ["type,value1,value2,value3"];
    NAMES.forEach(function (v) {
      lines.push(row("name", v));
    });
    QUESTIONS.forEach(function (v) {
      lines.push(row("question", v));
    });
    lines.push(row("powerbi_url", POWERBI_DASHBOARD_URL));
    AUDIT_ITEMS.forEach(function (v) {
      lines.push(row("audit_item", v));
    });
    COMMISSIONS.forEach(function (v) {
      lines.push(row("commission", v));
    });

    var chain = window.PurposefulMoment ? window.PurposefulMoment.getState() : null;
    if (chain) {
      chain.assignments.forEach(function (name, i) {
        lines.push(row("week", i + 1, name, chain.dates[i]));
      });
    }

    var blob = new Blob([lines.join("\n")], { type: "text/csv" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "japan-digital-weekly-data.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function parseCsvLine(line) {
    // Lightweight parser: handles simple comma-separated values and
    // quoted fields (for text that might contain a comma).
    var cols = [];
    var current = "";
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (c === '"') {
          inQuotes = false;
        } else {
          current += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        cols.push(current);
        current = "";
      } else {
        current += c;
      }
    }
    cols.push(current);
    return cols;
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function normalizeDateString(v) {
    // Excel often "helpfully" reformats an ISO date string (2026-09-14) into
    // its own locale format (9/14/2026, 14/09/2026, an Excel serial number…)
    // when a CSV is edited and re-saved. <input type="date"> only accepts
    // strict YYYY-MM-DD, so normalize whatever comes back on import.
    if (!v) return "";
    v = v.trim();

    var iso = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso) return iso[1] + "-" + pad2(+iso[2]) + "-" + pad2(+iso[3]);

    var slash = v.match(/^(\d{1,4})[/.](\d{1,2})[/.](\d{1,4})$/);
    if (slash) {
      var a = +slash[1],
        b = +slash[2],
        c = +slash[3];
      if (String(a).length === 4) return a + "-" + pad2(b) + "-" + pad2(c); // YYYY/M/D
      if (String(c).length === 4) {
        // Ambiguous M/D/YYYY vs D/M/YYYY — assume US M/D/YYYY unless the
        // first number can't be a month, in which case it must be the day.
        return a > 12 ? c + "-" + pad2(b) + "-" + pad2(a) : c + "-" + pad2(a) + "-" + pad2(b);
      }
    }

    // Excel serial date (days since 1899-12-30).
    if (/^\d{4,6}$/.test(v)) {
      var d = new Date(Date.UTC(1899, 11, 30) + Number(v) * 86400000);
      if (!isNaN(d.getTime())) {
        return d.getUTCFullYear() + "-" + pad2(d.getUTCMonth() + 1) + "-" + pad2(d.getUTCDate());
      }
    }

    var parsed = new Date(v);
    if (!isNaN(parsed.getTime())) {
      return parsed.getFullYear() + "-" + pad2(parsed.getMonth() + 1) + "-" + pad2(parsed.getDate());
    }

    return ""; // Give up rather than store something that won't render.
  }

  function parseData(text) {
    var lines = text.split(/\r\n|\n|\r/).filter(function (l) {
      return l.trim().length > 0;
    });
    if (lines.length < 2) throw new Error("empty");

    var names = [];
    var questions = [];
    var auditItems = [];
    var commissions = [];
    var powerbiUrl = "";
    var weekRows = [];

    for (var i = 1; i < lines.length; i++) {
      var cols = parseCsvLine(lines[i]);
      var type = (cols[0] || "").trim().toLowerCase();
      var v1 = (cols[1] || "").trim();
      var v2 = (cols[2] || "").trim();
      var v3 = (cols[3] || "").trim();

      if (type === "name" && v1) names.push(v1);
      else if (type === "question" && v1) questions.push(v1);
      else if (type === "powerbi_url" && v1) powerbiUrl = v1;
      else if (type === "audit_item" && v1) auditItems.push(v1);
      else if (type === "commission" && v1) commissions.push(v1);
      else if (type === "week") {
        var week = parseInt(v1, 10);
        if (week) weekRows.push({ week: week, name: v2, date: normalizeDateString(v3) });
      }
    }

    if (!names.length) throw new Error("no names");
    if (!questions.length) throw new Error("no questions");

    return {
      site: {
        names: names,
        questions: questions,
        powerbiUrl: powerbiUrl || POWERBI_DASHBOARD_URL,
        auditItems: auditItems.length ? auditItems : AUDIT_ITEMS,
        commissions: commissions.length ? commissions : COMMISSIONS,
      },
      weekRows: weekRows,
      weekCount: names.length,
    };
  }

  function buildChainStorage(weekRows, count) {
    var assignments = new Array(count).fill("");
    // null (not a string) leaves chain.js's own sensible date default in
    // place for any week this CSV doesn't mention.
    var dates = new Array(count).fill(null);
    weekRows.forEach(function (r) {
      var idx = r.week - 1;
      if (idx >= 0 && idx < count) {
        assignments[idx] = r.name || "";
        if (r.date) dates[idx] = r.date;
      }
    });
    return { assignments: assignments, dates: dates };
  }

  function onImportFileChosen(evt) {
    var file = evt.target.files && evt.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = parseData(reader.result);
        window.localStorage.setItem(SITE_STORAGE_KEY, JSON.stringify(parsed.site));
        if (parsed.weekRows.length) {
          var chainStorage = buildChainStorage(parsed.weekRows, parsed.weekCount);
          window.localStorage.setItem(CHAIN_STORAGE_KEY, JSON.stringify(chainStorage));
        }
        window.alert("Data imported. The page will now reload to apply it.");
        window.location.reload();
      } catch (err) {
        window.alert(
          "Could not import file: expected a CSV with a type,value1,value2,value3 header and at least one name and one question row."
        );
      }
    };
    reader.onerror = function () {
      window.alert("Could not read the selected file.");
    };
    reader.readAsText(file);
    evt.target.value = "";
  }

  exportBtn.addEventListener("click", exportData);
  importBtn.addEventListener("click", function () {
    importInput.click();
  });
  importInput.addEventListener("change", onImportFileChosen);
})();
