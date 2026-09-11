(function () {
  // Kept in sync manually with WHEEL_COLORS in app.js — no shared module
  // system in this app, and app.js's copy is scoped inside its own IIFE.
  var CHAIN_COLORS = [
    "#1e4479",
    "#4b6994",
    "#788faf",
    "#a5b4c9",
    "#80c8ee",
    "#cce9f8",
    "#d2dae4",
    "#e9ecf2",
  ];

  var chainSvg = document.getElementById("chain-svg");
  var chainSelect = document.getElementById("chain-name-select");
  var dateListEl = document.getElementById("chain-date-list");

  var SVG_NS = "http://www.w3.org/2000/svg";
  var N = NAMES.length;
  var cx = 190;
  var cy = 190;
  var ringRadius = 120;
  var nodeRadius = 20;
  var labelOffset = ringRadius + 34;

  var STORAGE_KEY = "purposefulMomentRotation";

  function buildDefaultAssignments() {
    // No name is baked in — the schedule comes entirely from imported data.
    return new Array(N).fill("");
  }

  function loadFromStorage() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!Array.isArray(data.assignments) || !Array.isArray(data.dates)) return null;
      var assignments = buildDefaultAssignments();
      var dates = buildDefaultDates();
      for (var i = 0; i < N; i++) {
        if (typeof data.assignments[i] === "string") assignments[i] = data.assignments[i];
        if (typeof data.dates[i] === "string") dates[i] = data.dates[i];
      }
      return { assignments: assignments, dates: dates };
    } catch (err) {
      return null;
    }
  }

  function saveToStorage() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ assignments: chainState, dates: chainDates })
      );
    } catch (err) {
      // Private browsing / storage disabled — silently skip persistence.
    }
  }

  var stored = loadFromStorage();
  var chainState = stored ? stored.assignments : buildDefaultAssignments();
  var chainDates = stored ? stored.dates : buildDefaultDates();
  var selectedIndex = -1;

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatDateInput(d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function buildDefaultDates() {
    // Week 1 defaults to the next upcoming Monday (or today, if today is Monday),
    // then each subsequent week is +7 days, so the chain reads as a real schedule.
    var base = new Date();
    base.setHours(0, 0, 0, 0);
    var diffToMonday = (8 - base.getDay()) % 7;
    base.setDate(base.getDate() + diffToMonday);

    var dates = [];
    for (var i = 0; i < N; i++) {
      var d = new Date(base);
      d.setDate(d.getDate() + i * 7);
      dates.push(formatDateInput(d));
    }
    return dates;
  }

  function nodeCenter(i) {
    var angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    return {
      angle: angle,
      nx: cx + ringRadius * Math.cos(angle),
      ny: cy + ringRadius * Math.sin(angle),
      lx: cx + labelOffset * Math.cos(angle),
      ly: cy + labelOffset * Math.sin(angle) + 4,
    };
  }

  function textAnchorFor(angle) {
    var c = Math.cos(angle);
    if (c > 0.15) return "start";
    if (c < -0.15) return "end";
    return "middle";
  }

  function populateSelectOptions() {
    while (chainSelect.options.length > 1) {
      chainSelect.remove(1);
    }
    NAMES.forEach(function (name) {
      var option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      chainSelect.appendChild(option);
    });
  }

  function selectIndex(i) {
    selectedIndex = i;
    chainSelect.disabled = false;
    chainSelect.value = chainState[selectedIndex] || "";
    render();
  }

  function renderChain() {
    while (chainSvg.firstChild) {
      chainSvg.removeChild(chainSvg.firstChild);
    }

    if (!N) {
      var placeholder = document.createElementNS(SVG_NS, "text");
      placeholder.setAttribute("x", cx);
      placeholder.setAttribute("y", cy);
      placeholder.setAttribute("text-anchor", "middle");
      placeholder.setAttribute("fill", "#4b6994");
      placeholder.setAttribute("font-size", "14");
      placeholder.textContent = "Import data to build the schedule";
      chainSvg.appendChild(placeholder);
      return;
    }

    for (var i = 0; i < N; i++) {
      var a = nodeCenter(i);
      var b = nodeCenter((i + 1) % N);
      var line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("class", "chain-edge");
      line.setAttribute("x1", a.nx);
      line.setAttribute("y1", a.ny);
      line.setAttribute("x2", b.nx);
      line.setAttribute("y2", b.ny);
      chainSvg.appendChild(line);
    }

    for (var j = 0; j < N; j++) {
      var pos = nodeCenter(j);
      var g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("class", "chain-node" + (j === selectedIndex ? " selected" : ""));
      g.setAttribute("data-index", String(j));

      var title = document.createElementNS(SVG_NS, "title");
      title.textContent =
        "Week " + (j + 1) + " • " + (chainState[j] || "Unassigned") + " • " + chainDates[j];
      g.appendChild(title);

      var circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("cx", pos.nx);
      circle.setAttribute("cy", pos.ny);
      circle.setAttribute("r", nodeRadius);
      circle.setAttribute("fill", CHAIN_COLORS[j % CHAIN_COLORS.length]);
      g.appendChild(circle);

      var indexText = document.createElementNS(SVG_NS, "text");
      indexText.setAttribute("class", "chain-index");
      indexText.setAttribute("x", pos.nx);
      indexText.setAttribute("y", pos.ny);
      indexText.textContent = String(j + 1);
      g.appendChild(indexText);

      var labelText = document.createElementNS(SVG_NS, "text");
      labelText.setAttribute("class", "chain-label");
      labelText.setAttribute("x", pos.lx);
      labelText.setAttribute("y", pos.ly);
      labelText.setAttribute("text-anchor", textAnchorFor(pos.angle));
      labelText.textContent = chainState[j] || "—";
      g.appendChild(labelText);

      chainSvg.appendChild(g);
    }
  }

  function renderDateList() {
    while (dateListEl.firstChild) {
      dateListEl.removeChild(dateListEl.firstChild);
    }

    if (!N) {
      var empty = document.createElement("li");
      empty.className = "chain-date-empty";
      empty.textContent = "No data imported yet.";
      dateListEl.appendChild(empty);
      return;
    }

    for (var i = 0; i < N; i++) {
      var li = document.createElement("li");
      li.className = "chain-date-row" + (i === selectedIndex ? " selected" : "");
      li.setAttribute("data-index", String(i));

      var weekSpan = document.createElement("span");
      weekSpan.className = "chain-date-week";
      weekSpan.textContent = "Wk " + (i + 1);

      var nameSpan = document.createElement("span");
      nameSpan.className = "chain-date-name";
      nameSpan.textContent = chainState[i] || "—";

      var dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.className = "chain-date-input";
      dateInput.setAttribute("data-index", String(i));
      dateInput.value = chainDates[i];

      li.appendChild(weekSpan);
      li.appendChild(nameSpan);
      li.appendChild(dateInput);
      dateListEl.appendChild(li);
    }
  }

  function render() {
    renderChain();
    renderDateList();
  }

  function onChainClick(evt) {
    var g = evt.target.closest("[data-index]");
    if (!g) return;
    selectIndex(Number(g.getAttribute("data-index")));
  }

  function onSelectChange() {
    if (selectedIndex < 0) return;
    chainState[selectedIndex] = chainSelect.value;
    saveToStorage();
    render();
  }

  function onDateListClick(evt) {
    if (evt.target.closest(".chain-date-input")) return;
    var row = evt.target.closest("[data-index]");
    if (!row) return;
    selectIndex(Number(row.getAttribute("data-index")));
  }

  function onDateInputChange(evt) {
    var input = evt.target.closest(".chain-date-input");
    if (!input) return;
    var idx = Number(input.getAttribute("data-index"));
    chainDates[idx] = input.value;
    saveToStorage();
    renderChain(); // refresh SVG tooltips with the new date
  }

  chainSvg.addEventListener("click", onChainClick);
  chainSelect.addEventListener("change", onSelectChange);
  dateListEl.addEventListener("click", onDateListClick);
  dateListEl.addEventListener("change", onDateInputChange);

  // Read by site-data.js so the master CSV export can include the current
  // presenter schedule alongside names/questions/audit items/commissions.
  window.PurposefulMoment = {
    getState: function () {
      return { assignments: chainState.slice(), dates: chainDates.slice() };
    },
  };

  populateSelectOptions();
  render();
})();
