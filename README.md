# Japan Digital Weekly

A single-page app for running the Japan Digital team's recurring weekly
meeting, hosted on GitHub Pages. No build step, no backend — just static
HTML/CSS/JS.

## Sections

The page follows the agenda in [`Agenda.md`](Agenda.md):

- **Ground Rules** — static reminders for the meeting.
- **Purposeful Moment** — a circular chain graph of the presenter rotation.
  Click a node or a row in "Week dates" to see it highlighted; assign a
  presenter per week directly from the dropdown in each row, and set each
  week's date. Changes save automatically in your browser.
- **Utilisation Forecast Update** — a link out to the team's Power BI
  dashboard.
- **Commission Excellence Audit** — a two-step random picker (audit item,
  then commission) for the Service Delivery Excellence model spot-check.
- **We WHEEL Together** — the original name picker + spinning question
  wheel.

The page also has a print-friendly stylesheet — the "Export as PDF" button
(in ⚙️ Settings) opens the browser's print dialog for a clean handout.

## Data: nothing real is committed to this repo

Real team data (names, wheel questions, audit items, commissions, the
Power BI link, and the presenter schedule) is **not** stored in source —
`data.js` ships empty. Instead, everything lives in your browser's
`localStorage`, managed through the ⚙️ **Settings** panel:

- **Edit fields directly** — names, questions, audit items, commissions,
  and the Power BI URL are plain text fields (one item per line) you can
  edit and save in place.
- **Export / Import a master CSV** — for bulk editing in Excel. The CSV
  covers everything above plus the presenter schedule (`type,value1,
  value2,value3` format). Re-importing reloads the page to apply it.
  Excel's locale-specific date reformatting is handled automatically on
  import.

Because nothing is checked in, a fresh clone (or someone else's browser)
starts empty until data is imported or entered via Settings. `*.csv` files
are gitignored so an exported data file sitting in this folder is never
accidentally committed.

## Local development

```bash
npm install
npm start
```

Then open `http://localhost:3000` (or the port set via the `PORT` env
var). `server.js` is a plain Express static file server — it has no role
beyond local dev; GitHub Pages serves the same files directly.

## Deployment

GitHub Pages serves this repo's `main` branch from the root, so
`index.html` must stay at the top level. Pushing to `main` is enough —
no build or deploy step is required.

## File overview

| File | Purpose |
| --- | --- |
| `index.html` | Page structure for all sections |
| `style.css` | All styling, including print styles |
| `data.js` | Empty data placeholders + localStorage override loader |
| `app.js` | Name picker, question wheel, audit/commission pickers, PDF export |
| `chain.js` | Purposeful Moment presenter chain graph |
| `site-data.js` | Master CSV export/import |
| `settings.js` | Settings dialog (⚙️) wiring and inline field editing |
| `server.js` | Local-only static file server |
