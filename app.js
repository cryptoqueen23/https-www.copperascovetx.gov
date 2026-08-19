let records = [...(window.COVE_RECORDS || [])];
const sources = window.COVE_SOURCES || [];

const grid = document.querySelector('#recordGrid');
const search = document.querySelector('#search');
const chips = document.querySelector('#chips');
const count = document.querySelector('#resultCount');
const active = document.querySelector('#activeFilter');

let filter = 'All';
let yearFilter = 'All';

const YEARS = Array.from(
  { length: 20 },
  (_, i) => String(2007 + i)
);

const yearGrid = document.querySelector('#yearGrid');
const clearYear = document.querySelector('#clearYear');

const wayback = url =>
  `https://web.archive.org/web/*/${url}`;

function esc(s = '') {
  return String(s).replace(
    /[&<>"']/g,
    m =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[m]
  );
}

function recordMatchesYear(r, y) {
  if (y === 'All') return true;

  const nums =
    String(r.year || '').match(/20\d{2}/g) || [];

  if (nums.includes(y)) return true;

  if (nums.length >= 2) {
    const a = +nums[0];
    const b = +nums[1];

    return +y >= a && +y <= b;
  }

  return false;
}

/* =====================================================
   CSV PARSER
===================================================== */

function parseCSV(text) {
  text = String(text || '').replace(/^\uFEFF/, '');

  const rows = [];

  let row = [];
  let field = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (insideQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = '';
      } else if (char === '\n') {
        row.push(field);

        if (
          row.some(
            value => value.trim() !== ''
          )
        ) {
          rows.push(row);
        }

        row = [];
        field = '';
      } else if (char !== '\r') {
        field += char;
      }
    }
  }

  if (field.length || row.length) {
    row.push(field);

    if (
      row.some(
        value => value.trim() !== ''
      )
    ) {
      rows.push(row);
    }
  }

  if (!rows.length) return [];

  const headers =
    rows[0].map(h => h.trim());

  return rows
    .slice(1)
    .map(values => {
      const obj = {};

      headers.forEach(
        (header, index) => {
          obj[header] =
            String(
              values[index] ?? ''
            ).trim();
        }
      );

      return obj;
    });
}

/* =====================================================
   INVESTIGATION CSV
===================================================== */

function convertInvestigationRow(row) {
  const original =
    row.original ||
    row.source ||
    row.url ||
    row.archive_exact ||
    row.archive_history ||
    '';

  const archiveExact =
    row.archive_exact || '';

  const archiveHistory =
    row.archive_history || '';

  const system =
    row.system ||
    row.category ||
    'Water Investigation';

  const year =
    row.year ||
    'Historic';

  const title =
    row.project_document ||
    row.title ||
    row.document ||
    row.name ||
    'Investigation Record';

  const summaryParts = [];

  if (row.why_it_matters) {
    summaryParts.push(
      row.why_it_matters
    );
  }

  if (row.mime_type) {
    summaryParts.push(
      `Archived type: ${row.mime_type}`
    );
  }

  if (archiveExact) {
    summaryParts.push(
      'Exact archived capture available'
    );
  }

  if (archiveHistory) {
    summaryParts.push(
      'Wayback history available'
    );
  }

  const statusParts = [];

  if (row.priority) {
    statusParts.push(
      `${row.priority} priority`
    );
  } else {
    statusParts.push(
      'Investigation'
    );
  }

  if (row.score) {
    statusParts.push(
      `Score ${row.score}`
    );
  }

  if (row.captures) {
    statusParts.push(
      `${row.captures} captures`
    );
  }

  if (row.unique_versions) {
    statusParts.push(
      `${row.unique_versions} versions`
    );
  }

  return {
    category: system,
    year,
    title,

    summary:
      summaryParts.join(' · ') ||
      'Archived record identified during the Copperas Cove investigation.',

    source: original,

    status:
      statusParts.join(' · ')
  };
}

async function loadInvestigationRecords() {
  const csvPath =
    'data/investigation/water/copperas-cove-phase2-HIGH-priority.csv';

  try {
    const response =
      await fetch(csvPath, {
        cache: 'no-store'
      });

    if (!response.ok) {
      throw new Error(
        `Investigation CSV returned HTTP ${response.status}`
      );
    }

    const csvText =
      await response.text();

    const csvRows =
      parseCSV(csvText);

    const investigationRecords =
      csvRows
        .map(
          convertInvestigationRow
        )
        .filter(r => r.title);

    const existing =
      new Set(
        records.map(
          r =>
            `${String(
              r.title || ''
            ).trim()}|${String(
              r.source || ''
            ).trim()}`
        )
      );

    for (
      const record
      of investigationRecords
    ) {
      const key =
        `${String(
          record.title || ''
        ).trim()}|` +
        `${String(
          record.source || ''
        ).trim()}`;

      if (!existing.has(key)) {
        records.push(record);
        existing.add(key);
      }
    }

    console.log(
      `Loaded ${investigationRecords.length} investigation records.`
    );
  } catch (error) {
    console.error(
      'Could not load investigation CSV:',
      error
    );
  }
}

/* =====================================================
   CATEGORIES
===================================================== */

function getCategories() {
  return [
    'All',
    ...new Set(
      records
        .map(
          r =>
            String(
              r.category || ''
            ).trim()
        )
        .filter(Boolean)
    )
  ];
}

/* =====================================================
   YEARS
===================================================== */

function renderYears() {
  if (!yearGrid) return;

  yearGrid.innerHTML =
    YEARS.map(y => {
      const n =
        records.filter(
          r =>
            recordMatchesYear(
              r,
              y
            )
        ).length;

      return `
        <button
          type="button"
          class="year-btn ${
            y === yearFilter
              ? 'active'
              : ''
          }"
          data-year="${y}"
          aria-pressed="${
            y === yearFilter
          }"
        >
          <strong>${y}</strong>
          <span>
            ${n} doc${
              n === 1 ? '' : 's'
            }
          </span>
        </button>
      `;
    }).join('');

  if (clearYear) {
    clearYear.hidden =
      yearFilter === 'All';
  }
}

/* =====================================================
   CATEGORY CHIPS
===================================================== */

function renderChips() {
  if (!chips) return;

  const cats =
    getCategories();

  chips.innerHTML =
    cats
      .map(
        c => `
          <button
            type="button"
            class="chip ${
              c === filter
                ? 'active'
                : ''
            }"
            data-cat="${esc(c)}"
            aria-pressed="${
              c === filter
            }"
          >
            ${esc(c)}
          </button>
        `
      )
      .join('');
}

/* =====================================================
   RECORD CARDS
===================================================== */

function recordCard(r) {
  const sourceLink =
    r.source
      ? `
        <a
          href="${esc(r.source)}"
          target="_blank"
          rel="noopener"
        >
          City/source
          <span class="sr-only">
            for ${esc(r.title)}
          </span>
          ↗
        </a>

        <a
          href="${esc(
            wayback(r.source)
          )}"
          target="_blank"
          rel="noopener"
        >
          Wayback history
          <span class="sr-only">
            for ${esc(r.title)}
          </span>
          ↗
        </a>
      `
      : '';

  return `
    <article class="record">

      <span class="tag">
        ${esc(r.category)}
        ·
        ${esc(r.year)}
      </span>

      <h3>
        ${esc(r.title)}
      </h3>

      <p>
        ${esc(r.summary)}
      </p>

      <footer>

        <span>
          ${esc(r.status)}
        </span>

        <div class="record-links">
          ${sourceLink}
        </div>

      </footer>

    </article>
  `;
}

/* =====================================================
   MAIN RENDER
===================================================== */

function render() {
  if (!grid || !search) return;

  const q =
    search.value
      .trim()
      .toLowerCase();

  const rows =
    records.filter(r => {
      const matchesYear =
        recordMatchesYear(
          r,
          yearFilter
        );

      const matchesCategory =
        filter === 'All' ||
        String(
          r.category || ''
        ).toLowerCase() ===
          filter.toLowerCase();

      const matchesSearch =
        !q ||
        Object.values(r)
          .join(' ')
          .toLowerCase()
          .includes(q);

      return (
        matchesYear &&
        matchesCategory &&
        matchesSearch
      );
    });

  grid.innerHTML =
    rows.length
      ? rows
          .map(recordCard)
          .join('')
      : `
        <p class="empty-state">
          No matching records.
          Try another keyword
          or choose All.
        </p>
      `;

  if (count) {
    count.textContent =
      `${rows.length} record${
        rows.length === 1
          ? ''
          : 's'
      }`;
  }

  if (active) {
    const pieces = [];

    pieces.push(
      yearFilter === 'All'
        ? 'All years'
        : yearFilter
    );

    pieces.push(
      filter === 'All'
        ? 'All categories'
        : filter
    );

    if (q) {
      pieces.push(
        `Search: "${search.value.trim()}"`
      );
    }

    active.textContent =
      pieces.join(' · ');
  }

  renderChips();
  renderYears();
}

/* =====================================================
   SCROLL TO EXPLORER
===================================================== */

function scrollToExplorer() {
  document
    .querySelector('#explorer')
    ?.scrollIntoView({
      behavior:
        matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches
          ? 'auto'
          : 'smooth',
      block: 'start'
    });
}

/* =====================================================
   YEAR CONTROLS
===================================================== */

yearGrid?.addEventListener(
  'click',
  e => {
    const b =
      e.target.closest(
        '[data-year]'
      );

    if (!b) return;

    yearFilter =
      b.dataset.year;

    /*
      Important:
      when choosing a year,
      reset the category.

      This prevents situations like
      "2007 + Budget = 0"
      when there are actually
      records in 2007.
    */

    filter = 'All';

    render();

    document
      .querySelector(
        '#recordGrid'
      )
      ?.scrollIntoView({
        behavior:
          matchMedia(
            '(prefers-reduced-motion: reduce)'
          ).matches
            ? 'auto'
            : 'smooth',

        block: 'start'
      });
  }
);

clearYear?.addEventListener(
  'click',
  () => {
    yearFilter = 'All';
    render();
  }
);

/* =====================================================
   CATEGORY CONTROLS
===================================================== */

chips?.addEventListener(
  'click',
  e => {
    const b =
      e.target.closest(
        '[data-cat]'
      );

    if (!b) return;

    filter =
      b.dataset.cat;

    render();
  }
);

/* =====================================================
   SEARCH
===================================================== */

search?.addEventListener(
  'input',
  render
);

document
  .querySelector('#clearSearch')
  ?.addEventListener(
    'click',
    () => {
      search.value = '';

      filter = 'All';
      yearFilter = 'All';

      render();

      search.focus();
    }
  );

/* =====================================================
   CATEGORY FEATURE BUTTONS
===================================================== */

document
  .querySelectorAll(
    '[data-filter]'
  )
  .forEach(btn =>
    btn.addEventListener(
      'click',
      () => {
        const wanted =
          String(
            btn.dataset.filter ||
            ''
          ).toLowerCase();

        const cats =
          getCategories();

        const found =
          cats.find(
            c =>
              c.toLowerCase() ===
              wanted
          ) ||
          cats.find(
            c =>
              c
                .toLowerCase()
                .includes(wanted)
          ) ||
          cats.find(
            c =>
              wanted.includes(
                c.toLowerCase()
              )
          );

        filter =
          found || 'All';

        yearFilter = 'All';
        search.value = '';

        /*
          If a dedicated category
          does not exist yet,
          use the requested phrase
          as a search instead.

          This makes City Manager
          and Council Votes useful
          even before every record
          is categorized.
        */

        if (
          !found &&
          wanted
        ) {
          filter = 'All';

          search.value =
            btn.dataset.filter;
        }

        render();

        scrollToExplorer();
      }
    )
  );

/* =====================================================
   DIRECT SEARCH BUTTONS
   Used by Charter Search
===================================================== */

document
  .querySelectorAll(
    '[data-query]'
  )
  .forEach(btn =>
    btn.addEventListener(
      'click',
      () => {
        const query =
          String(
            btn.dataset.query ||
            ''
          ).trim();

        filter = 'All';
        yearFilter = 'All';

        search.value =
          query;

        render();

        scrollToExplorer();

        search.focus();
      }
    )
  );

/* =====================================================
   TIMELINE
===================================================== */

const tl =
  document.querySelector(
    '#timelineList'
  );

if (tl) {
  tl.innerHTML =
    (
      window.COVE_TIMELINE ||
      []
    )
      .map(
        x => `
          <article class="timeline-item">

            <time>
              ${esc(x.year)}
            </time>

            <h3>
              ${esc(x.title)}
            </h3>

            <p>
              ${esc(x.text)}
            </p>

            ${
              x.source
                ? `
                  <div class="record-links">

                    <a
                      href="${esc(
                        x.source
                      )}"
                      target="_blank"
                      rel="noopener"
                    >
                      Source ↗
                    </a>

                    <a
                      href="${esc(
                        wayback(
                          x.source
                        )
                      )}"
                      target="_blank"
                      rel="noopener"
                    >
                      Wayback history ↗
                    </a>

                  </div>
                `
                : ''
            }

          </article>
        `
      )
      .join('');
}

/* =====================================================
   MOBILE MENU
===================================================== */

const menu =
  document.querySelector(
    '.menu-btn'
  );

const nav =
  document.querySelector(
    '#nav'
  );

menu?.addEventListener(
  'click',
  () => {
    const open =
      nav?.classList.toggle(
        'open'
      );

    menu.setAttribute(
      'aria-expanded',
      String(Boolean(open))
    );

    menu.setAttribute(
      'aria-label',

      open
        ? 'Close navigation menu'
        : 'Open navigation menu'
    );
  }
);

nav?.addEventListener(
  'click',
  e => {
    if (
      e.target.matches('a')
    ) {
      nav.classList.remove(
        'open'
      );

      menu?.setAttribute(
        'aria-expanded',
        'false'
      );

      menu?.setAttribute(
        'aria-label',
        'Open navigation menu'
      );
    }
  }
);

document.addEventListener(
  'keydown',
  e => {
    if (
      e.key === 'Escape' &&
      nav?.classList.contains(
        'open'
      )
    ) {
      nav.classList.remove(
        'open'
      );

      menu?.setAttribute(
        'aria-expanded',
        'false'
      );

      menu?.focus();
    }
  }
);

/* =====================================================
   SOURCE VAULT
===================================================== */

const sourceSearch =
  document.querySelector(
    '#sourceSearch'
  );

const sourceList =
  document.querySelector(
    '#sourceList'
  );

const sourceCount =
  document.querySelector(
    '#sourceCount'
  );

function renderSources() {
  if (
    !sourceList ||
    !sourceCount
  ) {
    return;
  }

  const q =
    (
      sourceSearch?.value ||
      ''
    )
      .trim()
      .toLowerCase();

  const rows =
    sources.filter(
      s =>
        !q ||
        Object.values(s)
          .join(' ')
          .toLowerCase()
          .includes(q)
    );

  sourceCount.textContent =
    `${rows.length} source${
      rows.length === 1
        ? ''
        : 's'
    } indexed`;

  sourceList.innerHTML =
    rows
      .map(
        s => `
          <article class="source-row">

            <div>

              <span class="tag">
                ${esc(s.category)}
                ·
                ${esc(s.year)}
              </span>

              <h3>
                ${esc(s.title)}
              </h3>

              <small>
                ${esc(s.type)}
              </small>

            </div>

            <div class="source-actions">

              <a
                class="btn mini"
                href="${esc(s.url)}"
                target="_blank"
                rel="noopener"
              >
                Open source ↗
              </a>

              <a
                class="btn mini ghost-dark"
                href="${esc(
                  s.wayback ||
                  wayback(s.url)
                )}"
                target="_blank"
                rel="noopener"
              >
                Wayback captures ↗
              </a>

            </div>

          </article>
        `
      )
      .join('') ||
    `
      <p class="empty-state">
        No matching sources.
      </p>
    `;
}

sourceSearch?.addEventListener(
  'input',
  renderSources
);

/* =====================================================
   START APPLICATION
===================================================== */

async function startApp() {
  /*
    Render everything already
    provided by data.js first.
  */

  render();
  renderSources();

  /*
    Load the high-priority
    investigation CSV.
  */

  await loadInvestigationRecords();

  /*
    Re-render after the CSV
    records are available.
  */

  render();
}

startApp();
