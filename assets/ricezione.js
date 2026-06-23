/* ============================================================
   ANALISI DEL TESTO — Ricezione (Fase 4)
   La ruota delle emozioni (input accessibile) + il tracciato a
   ragno con la banda di DISPERSIONE. I lettori vivono in
   passo.ricezione.letture, nello stesso archivio localStorage.
   ============================================================ */
(function () {
  'use strict';

  const T = window.AT_TASSONOMIA;
  const R = window.AT_RICEZIONE;
  const EMO = R.EMO, FAM = R.FAM, FAMILIES = R.FAMILIES, LEVELS = R.LEVELS, N = R.N;
  const STORE_KEY = 'analisitesto.db.v1';
  const AULA_KEY = 'analisitesto.aula';

  let DB = { passi: [], currentId: null };
  let current = new Array(N).fill(0);   // lettore corrente (volatile)
  let activeEmo = null;
  let saveTimer = null;

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const now = () => new Date().toISOString();

  function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2000); }
  function load() { try { const raw = localStorage.getItem(STORE_KEY); if (raw) DB = JSON.parse(raw); } catch (e) { console.warn(e); } if (!DB.passi) DB.passi = []; }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); setSaved(true); } catch (e) { console.error(e); toast('⚠ Salvataggio non riuscito'); } }
  function setSaved(ok) { const d = $('#saveDot'); if (d) { d.classList.toggle('dirty', !ok); d.textContent = ok ? 'Salvato' : 'Salvataggio…'; } }
  function queueSave() { setSaved(false); clearTimeout(saveTimer); saveTimer = setTimeout(save, 500); }
  function passo() { return DB.passi.find((p) => p.id === DB.currentId) || null; }
  function letture() { const p = passo(); return (p && p.ricezione && p.ricezione.letture) || []; }

  function go(toWork) {
    $('#view-chooser').style.display = toWork ? 'none' : '';
    $('#view-workspace').style.display = toWork ? '' : 'none';
    $('#crumbWrap').style.display = toWork ? '' : 'none';
    $('#btnAula').style.display = toWork ? '' : 'none';
    if (toWork) renderWorkspace(); else renderChooser();
  }

  /* ── Geometria condivisa ruota/radar ──────────────────────── */
  const CX = 210, CY = 210, BASE = 58, MAXR = 150, STEPR = (MAXR - BASE) / 4, LBLR = 178, STEP = 360 / N;
  function pol(r, deg) { const a = (deg - 90) * Math.PI / 180; return [CX + r * Math.cos(a), CY + r * Math.sin(a)]; }
  function sector(r0, r1, a0, a1) {
    const [x0, y0] = pol(r1, a0), [x1, y1] = pol(r1, a1), [x2, y2] = pol(r0, a1), [x3, y3] = pol(r0, a0);
    const large = (a1 - a0) > 180 ? 1 : 0;
    return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r1},${r1} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)} L${x2.toFixed(2)},${y2.toFixed(2)} A${r0},${r0} 0 ${large} 0 ${x3.toFixed(2)},${y3.toFixed(2)} Z`;
  }
  // Palette per i due temi (chiaro = design system; aula = rosone scuro)
  function theme() {
    const aula = document.body.classList.contains('aula');
    return aula
      ? { off: '#262134', ring: '#2f2a3e', spoke: '#2a2538', stroke: '#14121C', center: '#1A1726', centerStroke: '#352F45', centerText: '#6f667e', label: '#9a92a8', mean: '#F4C84A', meanFill: 'rgba(244,200,74,.14)', cur: '#ECE5D5', curFill: 'rgba(236,229,213,.10)', band: 'rgba(244,200,74,.14)' }
      : { off: '#e7e3da', ring: '#d9d4c8', spoke: '#e2ddd2', stroke: '#fcfbf8', center: '#f5f4f0', centerStroke: '#d5d2cb', centerText: '#a8a39b', label: '#6b6660', mean: '#1800AC', meanFill: 'rgba(24,0,172,.10)', cur: '#2c3539', curFill: 'rgba(44,53,57,.06)', band: 'rgba(24,0,172,.12)' };
  }

  /* ── Chooser ──────────────────────────────────────────────── */
  function renderChooser() {
    const grid = $('#passiGrid');
    if (!DB.passi.length) {
      grid.innerHTML = '<div class="empty-state"><p>Nessun passo in archivio.<br>Crea e annota un testo in <a href="analisi.html">Analisi</a>, poi torna qui per raccoglierne la ricezione in aula.</p></div>';
      return;
    }
    grid.innerHTML = DB.passi.map((p) => {
      const nl = (p.ricezione && p.ricezione.letture || []).length;
      const gen = (T.GENERI.find((g) => g.id === p.genere) || {}).nome || '';
      const lin = (T.LINGUE.find((g) => g.id === p.lingua) || {}).nome || '';
      return `<div class="passo-card" data-id="${p.id}">
        <span class="pc-genere">${esc(gen)}${lin ? ' · ' + esc(lin) : ''}</span>
        <span class="pc-titolo">${esc(p.titolo || 'Senza titolo')}</span>
        <span class="pc-meta">${esc(p.autore || '—')}${p.opera ? ', ' + esc(p.opera) : ''}</span>
        <div class="pc-stats"><span class="nc-tag">${nl} letture</span></div>
      </div>`;
    }).join('');
  }

  /* ── Workspace ────────────────────────────────────────────── */
  function renderWorkspace() {
    const p = passo();
    if (!p) { go(false); return; }
    if (!p.ricezione) p.ricezione = { letture: [] };
    if (!p.ricezione.letture) p.ricezione.letture = [];
    $('#crumb').innerHTML = `<b>${esc(p.autore || '—')}</b>${p.opera ? ' · ' + esc(p.opera) : ''}${p.titolo ? ' · ' + esc(p.titolo) : ''}`;
    $('#wmAuthor').textContent = p.autore || '—';
    $('#wmTitle').textContent = p.titolo || 'Senza titolo';
    const gen = (T.GENERI.find((g) => g.id === p.genere) || {}).nome || '';
    const lin = (T.LINGUE.find((g) => g.id === p.lingua) || {}).nome || '';
    $('#wmSub').textContent = [p.opera, gen, lin].filter(Boolean).join(' · ');
    renderLegend(); renderAll();
  }

  function renderAll() { renderWheel(); renderRadar(); renderReadout(); renderChips(); }

  /* ── Ruota (input, accessibile da tastiera) ───────────────── */
  function renderWheel() {
    const th = theme(), gap = STEP * 0.10;
    let s = `<circle cx="${CX}" cy="${CY}" r="${BASE - 4}" fill="${th.center}" stroke="${th.centerStroke}"/>`;
    s += `<text x="${CX}" y="${CY - 2}" text-anchor="middle" font-size="9" fill="${th.centerText}" letter-spacing="2">LA RUOTA</text>`;
    s += `<text x="${CX}" y="${CY + 11}" text-anchor="middle" font-size="9" fill="${th.centerText}" letter-spacing="2">DELLE EMOZIONI</text>`;
    EMO.forEach((e, i) => {
      const c0 = i * STEP - STEP / 2 + gap, c1 = i * STEP + STEP / 2 - gap;
      s += `<path class="ric-seg" data-emo="${i}" data-level="0" d="${sector(BASE - 3, BASE + 1, c0, c1)}" fill="${th.ring}"><title>${esc(e.n)} — azzera</title></path>`;
      for (let k = 1; k <= 4; k++) {
        const on = current[i] >= k;
        const r0 = BASE + (k - 1) * STEPR + 1.4, r1 = BASE + k * STEPR - 1.4;
        const op = on ? (0.5 + 0.5 * (k / 4)) : 1;
        s += `<path class="ric-seg" data-emo="${i}" data-level="${k}" d="${sector(r0, r1, c0, c1)}" fill="${on ? e.c : th.off}" fill-opacity="${op}" stroke="${th.stroke}" stroke-width="1"><title>${esc(e.n)} — ${k} ${LEVELS[k]}</title></path>`;
      }
      const mid = i * STEP, [lx, ly] = pol(LBLR, mid);
      const right = Math.cos((mid - 90) * Math.PI / 180) >= -0.01;
      const anchor = Math.abs(Math.sin(mid * Math.PI / 180)) < 0.0001 ? 'middle' : (right ? 'start' : 'end');
      const cur = current[i];
      s += `<path class="ric-hit" data-emo="${i}" tabindex="0" role="slider" aria-label="${esc(e.n)}" aria-valuemin="0" aria-valuemax="4" aria-valuenow="${cur}" aria-valuetext="${cur} ${LEVELS[cur]}" d="${sector(MAXR + 2, LBLR - 2, c0, c1)}" fill="transparent"></path>`;
      s += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle" font-size="11.5" fill="${cur > 0 ? e.c : th.label}" font-family="'Source Serif 4',Georgia,serif" style="pointer-events:none">${esc(e.n)}</text>`;
    });
    $('#wheel').innerHTML = s;
  }

  /* ── Radar con banda di dispersione (media ± scarto) ──────── */
  function polyPts(vals) { return vals.map((v, i) => { const [x, y] = pol(v / 4 * MAXR, i * STEP); return `${x.toFixed(1)},${y.toFixed(1)}`; }).join(' '); }
  function ringBand(outer, inner) {
    const o = outer.map((v, i) => pol(v / 4 * MAXR, i * STEP));
    const n2 = inner.map((v, i) => pol(v / 4 * MAXR, i * STEP)).reverse();
    return 'M' + o.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L') + ' Z M' + n2.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L') + ' Z';
  }
  function renderRadar() {
    const th = theme(); let s = '';
    for (let k = 1; k <= 4; k++) s += `<polygon points="${EMO.map((e, i) => { const [x, y] = pol(k / 4 * MAXR, i * STEP); return `${x.toFixed(1)},${y.toFixed(1)}`; }).join(' ')}" fill="none" stroke="${th.ring}" stroke-width="1"/>`;
    EMO.forEach((e, i) => {
      const [x, y] = pol(MAXR, i * STEP);
      s += `<line x1="${CX}" y1="${CY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${th.spoke}" stroke-width="1"/>`;
      const [lx, ly] = pol(LBLR, i * STEP), mid = i * STEP, right = Math.cos((mid - 90) * Math.PI / 180) >= -0.01;
      const anchor = Math.abs(Math.sin(mid * Math.PI / 180)) < 0.0001 ? 'middle' : (right ? 'start' : 'end');
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4" fill="${e.c}"/>`;
      s += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle" font-size="11" fill="${th.label}" font-family="'Source Serif 4',Georgia,serif">${esc(e.n)}</text>`;
    });
    const rip = R.riepilogo(letture());
    if (rip) {
      // banda di dispersione: media−scarto … media+scarto
      const outer = rip.mean.map((m, i) => Math.min(4, m + rip.sd[i]));
      const inner = rip.mean.map((m, i) => Math.max(0, m - rip.sd[i]));
      s += `<path d="${ringBand(outer, inner)}" fill="${th.band}" fill-rule="evenodd" stroke="none"/>`;
      s += `<polygon points="${polyPts(rip.mean)}" fill="none" stroke="${th.mean}" stroke-width="2"/>`;
      rip.mean.forEach((v, i) => { if (v > 0) { const [x, y] = pol(v / 4 * MAXR, i * STEP); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="${th.mean}"/>`; } });
    }
    if (current.some((v) => v > 0)) s += `<polygon points="${polyPts(current)}" fill="${th.curFill}" stroke="${th.cur}" stroke-width="1.5" stroke-dasharray="${rip ? '5 4' : ''}"/>`;
    $('#radar').innerHTML = s;
  }

  /* ── Lettura / predominanti / dispersione ─────────────────── */
  function renderReadout() {
    const rip = R.riepilogo(letture());
    const src = rip ? rip.mean : current;
    $('#readSrc').textContent = (rip ? `media di ${rip.n} letture` : 'lettore corrente (nessuno ancora registrato)');
    const dom = $('#dom');
    const ranked = rip ? rip.dominant : src.map((v, i) => ({ v: v, i: i })).filter((o) => o.v > 0.001).sort((a, b) => b.v - a.v).slice(0, 3);
    if (!ranked.length) {
      dom.innerHTML = '<p class="empty-state" style="padding:8px 0">Nessuna emozione ancora accesa. Accendi i petali della ruota.</p>';
    } else {
      dom.innerHTML = ranked.map((o) => {
        const e = EMO[o.i];
        return `<div class="ric-row"><div class="ric-nm">${esc(e.n)}<small>${esc(e.f)}</small></div><div class="ric-bar"><i style="width:${(o.v / 4 * 100).toFixed(0)}%;background:${e.c}"></i></div><div class="ric-val">${o.v.toFixed(o.v % 1 ? 1 : 0)}/4</div></div>`;
      }).join('');
    }
    if (rip) {
      $('#summary').innerHTML =
        `<div>Densità emotiva<b>${rip.density.toFixed(2)} / 4</b></div>`
        + `<div>Famiglia dominante<b>${esc(rip.famDom)}</b></div>`
        + `<div>Tono complessivo<b>${esc(rip.toneLbl)}</b></div>`
        + `<div>Concordanza<b>${esc(rip.concordanzaLbl)}</b><span class="ric-sd">scarto medio ${rip.avgSd.toFixed(2)}</span></div>`;
    } else {
      $('#summary').innerHTML = '<div>Registra i lettori per vedere il profilo aggregato e la sua dispersione.</div>';
    }
  }

  function renderChips() {
    const ls = letture();
    $('#nReaders').textContent = ls.length;
    $('#chips').innerHTML = ls.map((r, idx) => `<span class="ric-chip">${esc(r.nome)}<button data-idx="${idx}" aria-label="Rimuovi ${esc(r.nome)}">×</button></span>`).join('');
  }
  function renderLegend() {
    $('#legend').innerHTML = FAMILIES.map((f) => `<span><i style="background:${FAM[f]}"></i>${f}</span>`).join('');
  }

  /* ── Interazioni ──────────────────────────────────────────── */
  function setLevel(i, k) {
    current[i] = k;
    const e = EMO[i];
    $('#capWheel').innerHTML = k > 0 ? `<b>${esc(e.n)}</b> · ${k} ${LEVELS[k]}` : `<b>${esc(e.n)}</b> · azzerata`;
    renderAll();
    if (activeEmo === i) { const h = $(`.ric-hit[data-emo="${i}"]`); if (h) h.focus(); }
  }
  function bindWheel() {
    const wheel = $('#wheel');
    wheel.addEventListener('click', (ev) => {
      const t = ev.target.closest('.ric-seg, .ric-hit'); if (!t) return;
      const i = +t.getAttribute('data-emo'); activeEmo = i;
      if (t.classList.contains('ric-seg')) setLevel(i, +t.getAttribute('data-level'));
    });
    wheel.addEventListener('keydown', (ev) => {
      const t = ev.target.closest('.ric-hit'); if (!t) return;
      const i = +t.getAttribute('data-emo'); activeEmo = i;
      let k = current[i], handled = true;
      if (ev.key >= '0' && ev.key <= '4') k = +ev.key;
      else if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') k = Math.min(4, k + 1);
      else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') k = Math.max(0, k - 1);
      else handled = false;
      if (handled) { ev.preventDefault(); setLevel(i, k); }
    });
  }

  function registra() {
    if (!current.some((v) => v > 0)) { $('#capWheel').innerHTML = "<b>Accendi almeno un'emozione</b> prima di registrare il lettore."; return; }
    const inp = $('#lettore');
    const p = passo();
    const nome = inp.value.trim() || ('Lettore ' + (p.ricezione.letture.length + 1));
    p.ricezione.letture.push({ id: uid(), nome: nome, vals: current.slice(), creato: now() });
    p.modificato = now();
    current = new Array(N).fill(0); inp.value = '';
    queueSave(); renderAll(); inp.focus();
    toast('Lettore registrato (' + p.ricezione.letture.length + ')');
  }

  /* ── Bindings ─────────────────────────────────────────────── */
  function bind() {
    $('#btnChooser').onclick = () => { DB.currentId = null; go(false); };
    $('#passiGrid').addEventListener('click', (e) => { const c = e.target.closest('.passo-card'); if (c) { DB.currentId = c.dataset.id; go(true); } });
    $('#btnReg').onclick = registra;
    $('#btnClearOne').onclick = () => { current = new Array(N).fill(0); renderAll(); $('#capWheel').textContent = "Tocca un anello del petalo per fissare l'intensità (0–4)."; };
    $('#btnPrint').onclick = () => window.print();
    $('#chips').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-idx]'); if (!b) return;
      const p = passo(); p.ricezione.letture.splice(+b.dataset.idx, 1); p.modificato = now(); queueSave(); renderAll();
    });
    $('#lettore').addEventListener('keydown', (e) => { if (e.key === 'Enter') registra(); });
    $('#btnAula').onclick = () => {
      document.body.classList.toggle('aula');
      try { localStorage.setItem(AULA_KEY, document.body.classList.contains('aula') ? '1' : '0'); } catch (e) {}
      $('#btnAula').textContent = document.body.classList.contains('aula') ? '☀ Modalità chiara' : '◐ Modalità aula';
      renderAll();
    };
    bindWheel();
  }

  load(); bind();
  if (localStorage.getItem(AULA_KEY) === '1') { document.body.classList.add('aula'); $('#btnAula').textContent = '☀ Modalità chiara'; }
  setSaved(true);
  const pid = new URLSearchParams(location.search).get('passo');
  if (pid && DB.passi.some((x) => x.id === pid)) { DB.currentId = pid; go(true); } else go(false);

})();
