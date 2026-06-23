/* ============================================================
   ANALISI DEL TESTO — Interpretazione guidata (Fase 3)
   Foglio di lavoro a sezioni con campi tipizzati (text, choice,
   tags, list). Le liste si importano dalle annotazioni. Tutto
   vive in passo.interpretazione.dati, autosalvato in localStorage.
   ============================================================ */
(function () {
  'use strict';

  const T = window.AT_TASSONOMIA;
  const I = window.AT_INTERPRETAZIONE;
  const STORE_KEY = 'analisitesto.db.v1';

  let DB = { passi: [], currentId: null };
  let saveTimer = null;

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const now = () => new Date().toISOString();
  function impRank(id) { return { chiave: 3, rilevante: 2, accessoria: 1 }[id] || 0; }

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2000);
  }
  function load() {
    try { const raw = localStorage.getItem(STORE_KEY); if (raw) DB = JSON.parse(raw); }
    catch (e) { console.warn(e); }
    if (!DB.passi) DB.passi = [];
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); setSaved(true); }
    catch (e) { console.error(e); toast('⚠ Salvataggio non riuscito'); }
  }
  function setSaved(ok) { const d = $('#saveDot'); if (d) { d.classList.toggle('dirty', !ok); d.textContent = ok ? 'Salvato' : 'Salvataggio…'; } }
  function queueSave() { setSaved(false); clearTimeout(saveTimer); saveTimer = setTimeout(save, 600); }
  function currentPasso() { return DB.passi.find((p) => p.id === DB.currentId) || null; }

  function go(toWorkspace) {
    $('#view-chooser').style.display = toWorkspace ? 'none' : '';
    $('#view-workspace').style.display = toWorkspace ? '' : 'none';
    $('#crumbWrap').style.display = toWorkspace ? '' : 'none';
    $('#btnExport').style.display = toWorkspace ? '' : 'none';
    if (toWorkspace) renderWorkspace(); else renderChooser();
  }

  /* ── Annotazioni pertinenti ───────────────────────────────── */
  function matchFonte(ann, fonte) {
    const parts = fonte.split(':');
    if (ann.livello !== parts[0]) return false;
    return parts.length === 1 || ann.categoria === parts[1];
  }
  function annPerFonti(p, fonti, voci) {
    if (!fonti || !fonti.length) return [];
    return (p.annotazioni || []).filter((a) => fonti.some((f) => matchFonte(a, f))
      && (!voci || !voci.length || voci.indexOf(a.voce) >= 0))
      .sort((x, y) => impRank(y.importanza) - impRank(x.importanza));
  }

  /* ── Inizializza la struttura dati ────────────────────────── */
  function initData(p) {
    if (!p.interpretazione) p.interpretazione = { dati: {} };
    if (!p.interpretazione.dati) p.interpretazione.dati = {};
    const d = p.interpretazione.dati;
    I.SEZIONI.forEach((sez) => sez.campi.forEach((c) => {
      const key = sez.id + '.' + c.id;
      if (d[key] === undefined) {
        if (c.type === 'choice') d[key] = { scelta: '', nota: '' };
        else if (c.type === 'tags' || c.type === 'list') d[key] = [];
        else d[key] = '';
      }
      if (c.auto === 'meta' && !d[key]) {
        d[key] = [p.autore, p.opera].filter(Boolean).join(', ') + (p.titolo ? ' — ' + p.titolo : '');
      }
    }));
  }

  /* ── Chooser ──────────────────────────────────────────────── */
  function renderChooser() {
    const grid = $('#passiGrid');
    if (!DB.passi.length) {
      grid.innerHTML = '<div class="empty-state"><p>Nessun passo in archivio.<br>'
        + 'Crea e annota un testo in <a href="analisi.html">Analisi</a>, poi torna qui per l\'interpretazione.</p></div>';
      return;
    }
    grid.innerHTML = DB.passi.map((p) => {
      initData(p);
      const gen = (T.GENERI.find((g) => g.id === p.genere) || {}).nome || '';
      const lin = (T.LINGUE.find((g) => g.id === p.lingua) || {}).nome || '';
      return `<div class="passo-card" data-id="${p.id}">
        <span class="pc-genere">${esc(gen)}${lin ? ' · ' + esc(lin) : ''}</span>
        <span class="pc-titolo">${esc(p.titolo || 'Senza titolo')}</span>
        <span class="pc-meta">${esc(p.autore || '—')}${p.opera ? ', ' + esc(p.opera) : ''}</span>
        <div class="pc-stats"><span class="nc-tag">scheda ${completezza(p)}%</span></div>
      </div>`;
    }).join('');
  }
  function completezza(p) {
    const d = p.interpretazione.dati; let tot = 0, fatti = 0;
    I.SEZIONI.forEach((s) => s.campi.forEach((c) => { tot++; if (fieldDone(c, d[s.id + '.' + c.id])) fatti++; }));
    return tot ? Math.round((fatti / tot) * 100) : 0;
  }
  function fieldDone(c, v) {
    if (c.type === 'choice') return !!(v && (v.scelta || (v.nota && v.nota.trim())));
    if (c.type === 'tags') return !!(v && v.length);
    if (c.type === 'list') return !!(v && v.some((r) => Object.keys(r).some((k) => r[k] && String(r[k]).trim())));
    return !!(v && String(v).trim());
  }

  /* ── Workspace ────────────────────────────────────────────── */
  function renderWorkspace() {
    const p = currentPasso();
    if (!p) { go(false); return; }
    initData(p);
    $('#crumb').innerHTML = `<b>${esc(p.autore || '—')}</b>${p.opera ? ' · ' + esc(p.opera) : ''}${p.titolo ? ' · ' + esc(p.titolo) : ''}`;
    $('#wmAuthor').textContent = p.autore || '—';
    $('#wmTitle').textContent = p.titolo || 'Senza titolo';
    const gen = (T.GENERI.find((g) => g.id === p.genere) || {}).nome || '';
    const lin = (T.LINGUE.find((g) => g.id === p.lingua) || {}).nome || '';
    $('#wmSub').textContent = [p.opera, gen, lin].filter(Boolean).join(' · ');
    $('#consiglio').textContent = I.CONSIGLIO;

    const d = p.interpretazione.dati;
    $('#sezioniHost').innerHTML = I.SEZIONI.map((sez) => {
      const campi = sez.campi.map((c) => renderField(sez, c, d[sez.id + '.' + c.id])).join('');
      const mat = annPerFonti(p, sez.fonti);
      const materiali = mat.length ? `<details class="materiali"><summary>Materiali raccolti — ${mat.length}</summary><div class="mat-list">${mat.map((a) => matCardHTML(a)).join('')}</div></details>` : '';
      return `<section class="fase isez" data-sez="${sez.id}">
        <div class="fase-head"><span class="fase-n">${sez.icona || sez.n}</span>
          <div><h2>${esc(sez.nome)}${sez.sotto ? ` <span class="sez-tag">${esc(sez.sotto)}</span>` : ''}</h2>${sez.intro ? `<p class="fase-ob">${esc(sez.intro)}</p>` : ''}</div></div>
        ${campi}
        ${materiali}
      </section>`;
    }).join('');

    bindWorkspace();
    updateProgress(p);
  }

  function renderField(sez, c, v) {
    const key = sez.id + '.' + c.id;
    if (c.type === 'text') {
      return `<div class="cmp-field${c.tesi ? ' tesi-field' : ''}">
        <label>${esc(c.label)}</label>
        <textarea class="itext cmp-ta${c.big ? ' big' : ''}" data-key="${key}" placeholder="${esc(c.prompt)}">${esc(v || '')}</textarea>
      </div>`;
    }
    if (c.type === 'choice') {
      const val = v || { scelta: '', nota: '' };
      return `<div class="cmp-field">
        <label>${esc(c.label)}</label>
        <div class="seg ichoice" data-key="${key}">
          ${c.options.map((o) => `<button type="button" data-v="${o.id}" class="${val.scelta === o.id ? 'on' : ''}"${o.descr ? ` title="${esc(o.descr)}"` : ''}>${esc(o.nome)}</button>`).join('')}
        </div>
        <textarea class="inota cmp-ta" data-key="${key}" placeholder="${esc(c.prompt)}">${esc(val.nota || '')}</textarea>
      </div>`;
    }
    if (c.type === 'tags') {
      const arr = v || [];
      return `<div class="cmp-field">
        <label>${esc(c.label)}${c.max ? ` <span class="tag-max">(max ${c.max})</span>` : ''}</label>
        <div class="tag-input-wrap itags" data-key="${key}" data-max="${c.max || 99}">
          ${arr.map((t, i) => `<span class="tag-pill">${esc(t)}<button data-i="${i}">×</button></span>`).join('')}
          <input type="text" class="itag-input" placeholder="${esc(c.prompt)}">
        </div>
      </div>`;
    }
    if (c.type === 'list') {
      return `<div class="cmp-field">
        <label>${esc(c.label)}</label>
        <p class="hint" style="margin:-2px 0 8px">${esc(c.prompt)}</p>
        <div class="ilist" id="ilist-${key}" data-key="${key}">${renderListRows(c, v || [])}</div>
        <div class="ilist-ctrl">
          <button class="btn sm ilist-add" data-key="${key}">＋ Aggiungi riga</button>
          ${c.importa ? `<button class="btn ghost sm ilist-importa" data-key="${key}">↓ Importa dalle annotazioni</button>` : ''}
        </div>
      </div>`;
    }
    return '';
  }

  function fieldByKey(key) {
    const [sid, cid] = key.split('.');
    const sez = I.SEZIONI.find((s) => s.id === sid);
    return { sez, c: sez.campi.find((x) => x.id === cid) };
  }

  function renderListRows(c, rows) {
    if (!rows.length) return '<p class="ilist-empty">Nessuna riga. Aggiungine una o importa dalle annotazioni.</p>';
    return rows.map((row, i) => '<div class="ilist-row" data-i="' + i + '">'
      + c.cols.map((col) => {
        if (col.type === 'choice') {
          return `<div class="ilist-cellwrap"><span class="ilist-collabel">${esc(col.label)}</span><div class="seg sm ilist-choice" data-col="${col.id}">`
            + col.options.map((o) => `<button type="button" data-v="${o.id}" class="${row[col.id] === o.id ? 'on' : ''}">${esc(o.nome)}</button>`).join('')
            + '</div></div>';
        }
        return `<div class="ilist-cellwrap"><input type="text" class="ilist-cell" data-col="${col.id}" placeholder="${esc(col.label)}" value="${esc(row[col.id] || '')}"></div>`;
      }).join('')
      + '<button class="ilist-del" data-i="' + i + '" title="Rimuovi riga">✕</button></div>').join('');
  }

  function renderList(key) {
    const { c } = fieldByKey(key);
    const rows = currentPasso().interpretazione.dati[key] || [];
    const el = document.getElementById('ilist-' + key);
    if (el) el.innerHTML = renderListRows(c, rows);
  }

  function matCardHTML(a) {
    const l = T.getLivello(a.livello) || {};
    const cat = T.getCategoria(a.livello, a.categoria);
    let ref = a.refType === 'span' && a.quote ? '«' + a.quote.replace(/\s+/g, ' ').trim() + '»' : (a.refManuale || '');
    return `<div class="mat-card lv-${a.livello}">
      <div class="mat-top"><span class="mat-cat" style="color:var(--${l.colore})">${esc(cat ? cat.nome : '')}</span>${a.voce ? `<span class="mat-voce">${esc(a.voce)}</span>` : ''}</div>
      ${ref ? `<div class="mat-ref">${esc(ref)}</div>` : ''}
      ${a.commento ? `<div class="mat-com">${esc(a.commento)}</div>` : ''}
    </div>`;
  }

  /* ── Binding (delega su sezioniHost) ──────────────────────── */
  function bindWorkspace() {
    const host = $('#sezioniHost');

    host.addEventListener('input', (e) => {
      const t = e.target, p = currentPasso(), d = p.interpretazione.dati;
      if (t.classList.contains('itext')) { d[t.dataset.key] = t.value; touched(p); }
      else if (t.classList.contains('inota')) { d[t.dataset.key].nota = t.value; touched(p); }
      else if (t.classList.contains('ilist-cell')) {
        const key = t.closest('.ilist').dataset.key;
        const i = +t.closest('.ilist-row').dataset.i;
        d[key][i][t.dataset.col] = t.value; touched(p);
      }
    });

    host.addEventListener('keydown', (e) => {
      const t = e.target;
      if (t.classList.contains('itag-input') && (e.key === 'Enter' || e.key === ',')) {
        e.preventDefault();
        const wrap = t.closest('.itags'); const key = wrap.dataset.key; const max = +wrap.dataset.max;
        const p = currentPasso(), arr = p.interpretazione.dati[key];
        const v = t.value.trim().replace(/,$/, '');
        if (v && arr.length < max) { arr.push(v); renderTags(key); touched(p); }
        else if (arr.length >= max) toast('Massimo ' + max + ' voci');
      }
    });

    host.addEventListener('click', (e) => {
      const t = e.target, p = currentPasso(), d = p.interpretazione.dati;
      // choice top-level
      const choiceBtn = t.closest('.ichoice button');
      if (choiceBtn) {
        const key = choiceBtn.closest('.ichoice').dataset.key;
        d[key].scelta = d[key].scelta === choiceBtn.dataset.v ? '' : choiceBtn.dataset.v;
        $$('button', choiceBtn.closest('.ichoice')).forEach((b) => b.classList.toggle('on', b.dataset.v === d[key].scelta));
        touched(p); return;
      }
      // choice dentro lista
      const listChoice = t.closest('.ilist-choice button');
      if (listChoice) {
        const key = listChoice.closest('.ilist').dataset.key;
        const i = +listChoice.closest('.ilist-row').dataset.i;
        const col = listChoice.closest('.ilist-choice').dataset.col;
        d[key][i][col] = d[key][i][col] === listChoice.dataset.v ? '' : listChoice.dataset.v;
        $$('button', listChoice.closest('.ilist-choice')).forEach((b) => b.classList.toggle('on', b.dataset.v === d[key][i][col]));
        touched(p); return;
      }
      // tag remove
      const tagDel = t.closest('.itags .tag-pill button');
      if (tagDel) {
        const key = tagDel.closest('.itags').dataset.key;
        d[key].splice(+tagDel.dataset.i, 1); renderTags(key); touched(p); return;
      }
      // aggiungi riga
      const add = t.closest('.ilist-add');
      if (add) { d[add.dataset.key].push({}); renderList(add.dataset.key); touched(p); return; }
      // importa
      const imp = t.closest('.ilist-importa');
      if (imp) { importaLista(imp.dataset.key); return; }
      // rimuovi riga
      const del = t.closest('.ilist-del');
      if (del) {
        const key = del.closest('.ilist').dataset.key;
        d[key].splice(+del.dataset.i, 1); renderList(key); touched(p); return;
      }
    });
  }

  function touched(p) { p.interpretazione.aggiornato = now(); queueSave(); updateProgress(p); }

  function renderTags(key) {
    const p = currentPasso(), arr = p.interpretazione.dati[key];
    const wrap = $('.itags[data-key="' + key + '"]');
    if (!wrap) return;
    const input = wrap.querySelector('.itag-input');
    wrap.querySelectorAll('.tag-pill').forEach((x) => x.remove());
    arr.forEach((t, i) => {
      const span = document.createElement('span');
      span.className = 'tag-pill';
      span.innerHTML = esc(t) + '<button data-i="' + i + '">×</button>';
      wrap.insertBefore(span, input);
    });
    input.value = ''; input.focus();
  }

  function importaLista(key) {
    const { c } = fieldByKey(key);
    const p = currentPasso();
    const anns = annPerFonti(p, [c.importa.fonte], c.importa.voci);
    if (!anns.length) { toast('Nessuna annotazione da importare per questo campo'); return; }
    const arr = p.interpretazione.dati[key];
    let added = 0;
    anns.forEach((a) => {
      const row = I.rigaDaAnnotazione(c.id, a);
      const sign = JSON.stringify(row);
      if (Object.values(row).some((x) => x && String(x).trim()) && !arr.some((r) => JSON.stringify(r) === sign)) { arr.push(row); added++; }
    });
    renderList(key); touched(p);
    toast(added ? added + ' rig' + (added === 1 ? 'a importata' : 'he importate') : 'Nessuna nuova riga');
  }

  /* ── Progresso ────────────────────────────────────────────── */
  function updateProgress(p) {
    const d = p.interpretazione.dati; let tot = 0, fatti = 0;
    I.SEZIONI.forEach((s) => s.campi.forEach((c) => { tot++; if (fieldDone(c, d[s.id + '.' + c.id])) fatti++; }));
    const pct = tot ? Math.round((fatti / tot) * 100) : 0;
    $('#progressBar').style.width = pct + '%';
    $('#progressLabel').textContent = fatti + '/' + tot + ' campi · ' + pct + '%';
  }

  /* ── Export ───────────────────────────────────────────────── */
  function buildMarkdown(p) {
    const d = p.interpretazione.dati;
    let md = '# Interpretazione — ' + (p.titolo || 'passo') + '\n';
    md += '_' + [p.autore, p.opera].filter(Boolean).join(', ') + '_\n\n';
    I.SEZIONI.forEach((sez) => {
      const blocchi = [];
      sez.campi.forEach((c) => {
        const v = d[sez.id + '.' + c.id];
        if (!fieldDone(c, v)) return;
        if (c.type === 'text') blocchi.push('**' + c.label + '.** ' + v.trim());
        else if (c.type === 'choice') {
          const opt = c.options.find((o) => o.id === v.scelta);
          blocchi.push('**' + c.label + ':** ' + [(opt ? opt.nome : ''), (v.nota || '').trim()].filter(Boolean).join(' — '));
        } else if (c.type === 'tags') blocchi.push('**' + c.label + ':** ' + v.join(' · '));
        else if (c.type === 'list') {
          const righe = v.filter((r) => Object.keys(r).some((k) => r[k] && String(r[k]).trim())).map((r) => {
            const vals = c.cols.map((col) => {
              if (col.type === 'choice') { const o = col.options.find((x) => x.id === r[col.id]); return o ? o.nome : ''; }
              return r[col.id] || '';
            });
            return '- ' + vals.filter(Boolean).join(c.cols.some((x) => x.id === 'tenore' || x.id === 'parole') ? ' → ' : ' · ');
          });
          if (righe.length) blocchi.push('**' + c.label + ':**\n' + righe.join('\n'));
        }
      });
      if (blocchi.length) md += '## ' + sez.n + '. ' + sez.nome + '\n\n' + blocchi.join('\n\n') + '\n\n';
    });
    return md.trim() + '\n';
  }
  function exportMd() {
    const p = currentPasso();
    const blob = new Blob([buildMarkdown(p)], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'interpretazione-' + (p.titolo || 'passo').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.md';
    a.click(); URL.revokeObjectURL(a.href);
    toast('Interpretazione esportata (Markdown)');
  }

  /* ── Bindings globali ─────────────────────────────────────── */
  function bind() {
    $('#btnChooser').onclick = () => { DB.currentId = null; go(false); };
    $('#btnExport').onclick = exportMd;
    $('#passiGrid').addEventListener('click', (e) => {
      const card = e.target.closest('.passo-card');
      if (card) { DB.currentId = card.dataset.id; go(true); }
    });
  }

  load(); bind(); setSaved(true);
  const pid = new URLSearchParams(location.search).get('passo');
  if (pid && DB.passi.some((x) => x.id === pid)) { DB.currentId = pid; go(true); } else go(false);

})();
