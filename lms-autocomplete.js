/*
 * BMSCE LMS Auto-Complete
 * -----------------------
 * Walks through every lesson of a course on https://lms.bmsce.in and clicks
 * "Mark Complete" until the course progress reaches the percentage you choose.
 *
 * How to use:
 *   1. Log in to https://lms.bmsce.in and open the course you want.
 *   2. Press F12 -> Console, paste this whole file, press Enter.
 *   3. A panel appears in the bottom-right corner. Enter a target % and press Start.
 *
 * Works on any course page or lesson page. Quizzes are never attempted.
 */
(() => {
  if (window.__lmsAuto) { window.__lmsAuto.show(); return; }

  // ---------- settings ----------
  const PAGE_TIMEOUT_MS = 15000; // max wait for a page / button to appear
  const DELAY_MS = 1200;         // pause between actions, keeps the load on the server low
  const MAX_STEPS = 500;         // safety cap on pages visited per run

  // ---------- helpers ----------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clean = (s) => (s || '').trim().replace(/\s+/g, ' ');
  const findBtn = (pred) => [...document.querySelectorAll('main button')].find((b) => pred(clean(b.innerText)));
  const markBtn = () => findBtn((t) => t === 'Mark Complete');
  const nextBtn = () => findBtn((t) => t.startsWith('Next'));
  const doneBtn = () => findBtn((t) => t === 'Continue');
  const title = () => clean(document.querySelector('main h1')?.innerText) || '(untitled)';
  const onLessonPage = () => /\/courses\/[^/]+\/lessons\/[^/]+/.test(location.pathname);
  const progress = () => {
    const text = document.body.innerText;
    const m = text.match(/Course Progress\s*(\d+)%/) || text.match(/(\d+)%\s*Your Progress/);
    return m ? Number(m[1]) : null;
  };

  async function waitFor(cond, timeout = PAGE_TIMEOUT_MS) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const v = cond();
      if (v) return v;
      await sleep(250);
    }
    return null;
  }

  // ---------- UI ----------
  const css = `
    #lms-auto{position:fixed;right:16px;bottom:16px;z-index:2147483647;width:340px;max-width:calc(100vw - 32px);
      font:13px/1.4 system-ui,sans-serif;color:#e6edf3;background:#161b22;border:1px solid #30363d;border-radius:10px;
      box-shadow:0 8px 30px rgba(0,0,0,.45);overflow:hidden}
    #lms-auto header{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#0d1117;font-weight:600}
    #lms-auto header button{background:none;border:0;color:#8b949e;font-size:16px;cursor:pointer}
    #lms-auto .body{padding:12px}
    #lms-auto label{display:block;margin-bottom:6px;color:#8b949e}
    #lms-auto .row{display:flex;gap:8px;align-items:center}
    #lms-auto input{width:70px;padding:6px 8px;border-radius:6px;border:1px solid #30363d;background:#0d1117;color:#e6edf3;font:inherit}
    #lms-auto .presets button{padding:4px 8px;border-radius:6px;border:1px solid #30363d;background:#21262d;color:#e6edf3;cursor:pointer}
    #lms-auto .actions{margin-top:10px}
    #lms-auto .actions button{flex:1;padding:7px;border-radius:6px;border:0;font-weight:600;cursor:pointer}
    #lms-auto .start{background:#238636;color:#fff}
    #lms-auto .stop{background:#da3633;color:#fff}
    #lms-auto .dl{background:#21262d;color:#e6edf3;border:1px solid #30363d !important}
    #lms-auto button:disabled{opacity:.45;cursor:not-allowed}
    #lms-auto .bar{height:8px;border-radius:4px;background:#30363d;margin:12px 0 4px;position:relative;overflow:hidden}
    #lms-auto .bar i{position:absolute;inset:0 auto 0 0;background:#2f81f7;width:0;transition:width .3s}
    #lms-auto .bar b{position:absolute;top:-2px;bottom:-2px;width:2px;background:#f0883e}
    #lms-auto .status{display:flex;justify-content:space-between;color:#8b949e;font-size:12px}
    #lms-auto .log{margin-top:10px;height:150px;overflow:auto;background:#0d1117;border:1px solid #30363d;border-radius:6px;
      padding:6px 8px;font:11px/1.5 ui-monospace,Consolas,monospace;white-space:pre-wrap}
    #lms-auto .OK{color:#3fb950}#lms-auto .SKIP{color:#d29922}#lms-auto .ERR{color:#f85149}#lms-auto .INFO{color:#58a6ff}
  `;
  const root = document.createElement('div');
  root.id = 'lms-auto';
  root.innerHTML = `
    <style>${css}</style>
    <header><span>BMSCE LMS Auto-Complete</span><button title="Close">✕</button></header>
    <div class="body">
      <label for="lms-target">Complete the course up to:</label>
      <div class="row">
        <input id="lms-target" type="number" min="1" max="100" value="80"> <span>%</span>
        <span class="presets row">
          <button data-v="50">50</button><button data-v="75">75</button><button data-v="80">80</button><button data-v="100">100</button>
        </span>
      </div>
      <div class="bar"><i></i><b></b></div>
      <div class="status"><span class="cur">Progress: –</span><span class="state">Idle</span></div>
      <div class="row actions">
        <button class="start">Start</button><button class="stop" disabled>Stop</button><button class="dl">Save log</button>
      </div>
      <div class="log"></div>
    </div>`;
  document.body.appendChild(root);

  const $ = (s) => root.querySelector(s);
  const input = $('#lms-target'), startB = $('.start'), stopB = $('.stop'), logBox = $('.log');
  const fill = $('.bar i'), marker = $('.bar b'), cur = $('.cur'), stateEl = $('.state');

  const log = [];
  function write(level, msg) {
    const p = progress();
    const entry = { time: new Date().toISOString(), level, msg, progress: p, url: location.pathname };
    log.push(entry);
    console.log(`%c[LMS] [${level}] ${msg}${p != null ? ` (${p}%)` : ''}`,
      { OK: 'color:#3fb950', SKIP: 'color:#d29922', ERR: 'color:#f85149', INFO: 'color:#58a6ff' }[level]);
    const line = document.createElement('div');
    line.className = level;
    line.textContent = `${new Date().toLocaleTimeString()} ${level.padEnd(4)} ${msg}`;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
  }

  function refresh() {
    const p = progress();
    const t = clampTarget();
    cur.textContent = `Progress: ${p ?? '–'}%  →  target ${t}%`;
    fill.style.width = `${p ?? 0}%`;
    marker.style.left = `calc(${t}% - 1px)`;
  }
  const clampTarget = () => Math.min(100, Math.max(1, Number(input.value) || 80));
  const refreshTimer = setInterval(refresh, 1000);

  function downloadLog() {
    const text = log.map((e) => `${e.time}\t${e.level}\t${e.progress ?? ''}%\t${e.msg}\t${e.url}`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text || 'No entries yet\n'], { type: 'text/plain' }));
    a.download = `lms-autocomplete-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`;
    a.click();
  }

  // ---------- walker ----------
  let running = false, stopRequested = false;

  async function goToFirstLesson() {
    if (onLessonPage()) {
      // Jump back to the start of the course so earlier lessons are not missed.
      const back = [...document.querySelectorAll('main a, main button')].find((el) => clean(el.innerText) === 'Back to Course');
      if (back) { back.click(); await waitFor(() => !onLessonPage()); await sleep(1500); }
    }
    // First real lesson link in the course outline (skip the "Content" tab and "Continue" shortcuts).
    const first = await waitFor(() => [...document.querySelectorAll('main a[href*="/lessons/"]')]
      .find((a) => /\/lessons\/[^/?#]+/.test(a.getAttribute('href')) && !/^continue/i.test(clean(a.innerText))));
    if (!first) return false;
    first.click(); // client-side navigation keeps this script alive
    return !!(await waitFor(onLessonPage));
  }

  async function run() {
    const target = clampTarget();
    running = true; stopRequested = false;
    startB.disabled = true; stopB.disabled = false; input.disabled = true;
    stateEl.textContent = 'Running…';
    write('INFO', `Started, target ${target}%`);

    const stats = { marked: 0, alreadyDone: 0, skipped: 0, errors: 0 };
    let reason = 'finished';
    try {
      if (!(await goToFirstLesson())) { write('ERR', 'Could not find a lesson link. Open a course page and try again.'); reason = 'error'; return; }

      const seen = new Set();
      for (let step = 0; step < MAX_STEPS; step++) {
        if (stopRequested) { reason = 'stopped'; write('INFO', 'Stopped by user'); break; }
        await waitFor(() => markBtn() || nextBtn() || doneBtn());
        await sleep(700); // let title / progress settle after navigation

        const p = progress();
        if (p != null && p >= target) { reason = 'target'; write('INFO', `Target reached: ${p}%`); break; }

        const path = location.pathname, name = title();
        if (seen.has(path)) { stats.errors++; write('ERR', `Visited "${name}" twice, stopping to avoid a loop`); break; }
        seen.add(path);

        const mb = markBtn();
        if (mb) {
          mb.click();
          // "Mark Complete" saves progress and usually opens the next lesson by itself.
          const changed = await waitFor(() => location.pathname !== path || doneBtn());
          if (changed) { stats.marked++; write('OK', `Marked complete: ${name}`); }
          else { stats.errors++; write('ERR', `Mark Complete had no effect: ${name}`); }
          await sleep(DELAY_MS);
          if (location.pathname !== path) continue;
        } else if (doneBtn()) {
          stats.alreadyDone++; write('SKIP', `Already complete: ${name}`);
        } else {
          stats.skipped++; write('SKIP', `No Mark Complete button (quiz?): ${name}`);
        }

        const nb = nextBtn();
        if (!nb) { write('INFO', 'Reached the last lesson of the course'); break; }
        nb.click();
        if (!(await waitFor(() => location.pathname !== path))) { stats.errors++; write('ERR', 'Next button did not open a new page, stopping'); break; }
        await sleep(DELAY_MS);
      }
    } catch (e) {
      stats.errors++; reason = 'error'; write('ERR', `Unexpected error: ${e.message}`);
    } finally {
      write('INFO', `Done. Marked ${stats.marked}, already complete ${stats.alreadyDone}, skipped ${stats.skipped}, errors ${stats.errors}`);
      running = false;
      startB.disabled = false; stopB.disabled = true; input.disabled = false;
      stateEl.textContent = { target: 'Target reached ✓', stopped: 'Stopped', error: 'Error', finished: 'Finished' }[reason];
      refresh();
    }
  }

  // ---------- wiring ----------
  root.querySelectorAll('.presets button').forEach((b) => b.addEventListener('click', () => { input.value = b.dataset.v; refresh(); }));
  input.addEventListener('input', refresh);
  startB.addEventListener('click', () => { if (!running) run(); });
  stopB.addEventListener('click', () => { stopRequested = true; stateEl.textContent = 'Stopping…'; });
  $('.dl').addEventListener('click', downloadLog);
  $('header button').addEventListener('click', () => {
    if (running) { stopRequested = true; }
    clearInterval(refreshTimer); root.remove(); delete window.__lmsAuto;
  });

  window.__lmsAuto = { show: () => root.scrollIntoView(), log, downloadLog };
  refresh();
  write('INFO', 'Ready. Choose a target % and press Start.');
})();
