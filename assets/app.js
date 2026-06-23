/* ============================================================
   ANALISI DEL TESTO — Logica applicativa
   SPA local-first: archivio di passi + workspace di analisi a
   layer. Persistenza su localStorage; import/export JSON.
   Evidenziatura su selezione nativa (niente tokenizzazione).
   ============================================================ */
(function () {
  'use strict';

  const T = window.AT_TASSONOMIA;
  const STORE_KEY = 'analisitesto.db.v1';

  /* ── Stato ────────────────────────────────────────────────── */
  let DB = { passi: [], currentId: null };
  let view = { mode: 'livello', filtriLivello: new Set(), filtriImp: new Set(), search: '' };
  let pendingSel = null;     // { start, end, quote }
  let editingId = null;      // annotazione in modifica
  let formState = null;      // stato volatile del form
  let dirty = false;
  let batch = { on: false, livello: '', categoria: '', voce: '', importanza: 'rilevante', count: 0 }; // analisi rapida

  /* ── Utility ──────────────────────────────────────────────── */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const now = () => new Date().toISOString();

  const LV_RGBA = {
    retorica: 'rgba(24,0,172,0.18)',
    semantica: 'rgba(47,133,90,0.20)',
    pragmatica: 'rgba(43,108,176,0.18)',
    ipertesto: 'rgba(156,107,60,0.22)',
  };

  // Prefissi per il costruttore rapido del riferimento (modalità senza testo)
  const REF_PREFIXES = [
    { v: 'v.', label: 'v.' }, { v: 'vv.', label: 'vv.' },
    { v: 'r.', label: 'r.' }, { v: 'rr.', label: 'rr.' },
    { v: 'p.', label: 'p.' }, { v: '§', label: '§' },
    { v: '«»', label: '« cit. »' },
  ];
  function composeRef(px, loc) {
    loc = (loc || '').trim();
    if (px === '«»') return loc ? '«' + loc + '»' : '';
    if (!loc) return px || '';
    return (px ? px + ' ' : '') + loc;
  }

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ── Persistenza ──────────────────────────────────────────── */
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) DB = JSON.parse(raw);
    } catch (e) { console.warn('Lettura DB fallita', e); }
    if (!DB.passi) DB.passi = [];
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); setDirty(false); }
    catch (e) { console.error('Salvataggio fallito', e); toast('⚠ Salvataggio non riuscito'); }
  }
  function setDirty(v) {
    dirty = v;
    const d = $('#saveDot');
    if (!d) return;
    d.classList.toggle('dirty', v);
    d.textContent = v ? 'Modifiche da salvare' : 'Salvato';
  }

  function currentPasso() { return DB.passi.find((p) => p.id === DB.currentId) || null; }

  /* ============================================================
     ROUTING DI VISTA
     ============================================================ */
  function go(toWorkspace) {
    $('#view-archive').style.display = toWorkspace ? 'none' : '';
    $('#view-workspace').style.display = toWorkspace ? '' : 'none';
    $('#crumbWrap').style.display = toWorkspace ? '' : 'none';
    if (toWorkspace) renderWorkspace(); else renderArchive();
  }

  /* ============================================================
     ARCHIVIO
     ============================================================ */
  function renderArchive() {
    const grid = $('#passiGrid');
    if (!DB.passi.length) {
      grid.innerHTML = '<div class="empty-state">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'
        + '<p>Nessun passo in archivio.<br>Crea il primo testo da analizzare.</p></div>';
      return;
    }
    grid.innerHTML = DB.passi.map((p) => {
      const counts = {};
      (p.annotazioni || []).forEach((a) => { counts[a.livello] = (counts[a.livello] || 0) + 1; });
      const dots = T.LIVELLI.filter((l) => counts[l.id]).map((l) =>
        `<span class="dot-livello" style="background:var(--${l.colore})" title="${esc(l.nome)}: ${counts[l.id]}">${counts[l.id]}</span>`
      ).join('');
      const gen = (T.GENERI.find((g) => g.id === p.genere) || {}).nome || p.genere || '';
      const lin = (T.LINGUE.find((g) => g.id === p.lingua) || {}).nome || '';
      return `<div class="passo-card" data-id="${p.id}">
        <span class="pc-genere">${esc(gen)}${lin ? ' · ' + esc(lin) : ''}</span>
        <span class="pc-titolo">${esc(p.titolo || 'Senza titolo')}</span>
        <span class="pc-meta">${esc(p.autore || '—')}${p.opera ? ', ' + esc(p.opera) : ''}</span>
        <div class="pc-stats">${dots || '<span class="nc-tag">nessuna nota</span>'}</div>
        <button class="btn ghost sm pc-del danger" data-del="${p.id}">Elimina</button>
      </div>`;
    }).join('');
  }

  /* ============================================================
     WORKSPACE
     ============================================================ */
  function renderWorkspace() {
    const p = currentPasso();
    if (!p) { go(false); return; }
    // crumb
    $('#crumb').innerHTML = `<b>${esc(p.autore || '—')}</b>${p.opera ? ' · ' + esc(p.opera) : ''}${p.titolo ? ' · ' + esc(p.titolo) : ''}`;
    // meta header
    $('#wmAuthor').textContent = p.autore || '—';
    $('#wmTitle').textContent = p.titolo || 'Senza titolo';
    const gen = (T.GENERI.find((g) => g.id === p.genere) || {}).nome || '';
    $('#wmSub').textContent = [p.opera, gen].filter(Boolean).join(' · ');
    // mode toggle
    $$('#modeToggle button').forEach((b) => b.classList.toggle('active', b.dataset.mode === (p.mode || 'con')));
    renderTextPanel(p);
    renderNotes(p);
    renderBatchBar();
  }

  /* ── Analisi rapida (batch): bersaglio fisso, taggi sweeping il testo ── */
  function renderBatchBar() {
    const bar = $('#batchBar'); if (!bar) return;
    const btn = $('#btnBatch');
    if (!batch.on) { bar.innerHTML = ''; bar.classList.remove('on'); if (btn) btn.classList.remove('active'); return; }
    bar.classList.add('on'); if (btn) btn.classList.add('active');
    const p = currentPasso();
    const liv = T.getLivello(batch.livello);
    let html = '<div class="batch-row">'
      + T.LIVELLI.map((l) => `<button class="chip lv-${l.colore} ${batch.livello === l.id ? 'active' : ''}" data-blv="${l.id}"><span class="swatch" style="background:var(--${l.colore})"></span>${esc(l.breve)}</button>`).join('')
      + '</div>';
    if (liv) {
      html += '<div class="batch-row"><select id="batchCat" class="batch-sel"><option value="">— categoria —</option>'
        + liv.categorie.map((c) => `<option value="${c.id}" ${batch.categoria === c.id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('') + '</select>';
      const cat = T.getCategoria(batch.livello, batch.categoria);
      if (cat) html += '<select id="batchVoce" class="batch-sel"><option value="">tutta la categoria</option>'
        + cat.voci.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'it')).map((v) => `<option value="${esc(v.nome)}" ${batch.voce === v.nome ? 'selected' : ''}>${esc(v.nome)}</option>`).join('') + '</select>';
      html += '</div>';
      html += '<div class="batch-row">' + T.IMPORTANZE.map((i) => `<button class="chip imp ${batch.importanza === i.id ? 'active' : ''}" data-bimp="${i.id}">${esc(i.nome)}</button>`).join('') + '</div>';
    }
    const ready = batch.livello && batch.categoria;
    const etich = ready ? (batch.voce || (T.getCategoria(batch.livello, batch.categoria) || {}).nome || '') : '';
    let status;
    if (!ready) status = 'Scegli livello e categoria da taggare.';
    else if ((p.mode || 'con') === 'senza' || !p.testo) status = 'Per l\'analisi rapida serve il testo: passa a «Con testo».';
    else status = 'Seleziona nel testo per taggare → <b>' + esc(etich) + '</b>';
    html += `<div class="batch-status"><span>${status}</span><span class="batch-count">${batch.count} taggate</span><button class="btn ghost sm" id="btnBatchExit">Esci</button></div>`;
    bar.innerHTML = html;

    $$('#batchBar [data-blv]').forEach((b) => b.onclick = () => { batch.livello = b.dataset.blv; batch.categoria = ''; batch.voce = ''; renderBatchBar(); });
    const bc = $('#batchCat'); if (bc) bc.onchange = () => { batch.categoria = bc.value; batch.voce = ''; renderBatchBar(); };
    const bv = $('#batchVoce'); if (bv) bv.onchange = () => { batch.voce = bv.value; renderBatchBar(); };
    $$('#batchBar [data-bimp]').forEach((b) => b.onclick = () => { batch.importanza = b.dataset.bimp; renderBatchBar(); });
    $('#btnBatchExit').onclick = () => { batch.on = false; renderBatchBar(); renderTextPanel(currentPasso()); };
  }
  function toggleBatch() {
    batch.on = !batch.on;
    if (batch.on) batch.count = 0;
    renderBatchBar(); renderTextPanel(currentPasso());
  }

  function renderTextPanel(p) {
    const host = $('#textHost');
    if ((p.mode || 'con') === 'senza') {
      host.innerHTML = '<div class="text-empty-hint">Modalità <b>libro a fianco</b>: stai lavorando senza testo digitato. '
        + 'Le annotazioni useranno un riferimento manuale (versi, righi, pagina). '
        + 'Puoi passare a «Con testo» in qualsiasi momento per incollare il passo ed evidenziarlo.</div>';
      return;
    }
    if (!p.testo) {
      host.innerHTML = `<div class="field">
          <label>Incolla qui il testo da analizzare</label>
          <textarea class="text-input" id="textInput" placeholder="Incolla o digita il passo…\nVa a capo per separare i versi (poesia) o i capoversi (prosa)."></textarea>
          <p class="hint">Per la poesia, ogni riga = un verso (numerati automaticamente).</p>
        </div>
        <button class="btn primary" id="saveText">Rendi analizzabile →</button>`;
      $('#saveText').onclick = () => {
        const v = $('#textInput').value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        if (!v.trim()) { toast('Inserisci del testo'); return; }
        p.testo = v; p.modificato = now(); setDirty(true); save(); renderTextPanel(p); renderNotes(p);
      };
      return;
    }
    // testo presente → rendering con evidenziature
    host.innerHTML = renderTextHTML(p)
      + '<div class="sel-hint" id="selHint" style="display:none">'
      + '<span id="selQuote"></span>'
      + '<button class="btn primary sm" id="selAnnotate">Annota selezione</button></div>'
      + '<div style="margin-top:14px"><button class="btn ghost sm" id="editText">✎ Modifica testo</button></div>';

    const container = $('#textRender');
    container.addEventListener('mouseup', onTextSelect);
    container.querySelectorAll('mark').forEach((m) => {
      m.addEventListener('click', (e) => {
        e.stopPropagation();
        const ids = (m.dataset.anns || '').split(',').filter(Boolean);
        if (ids.length) openModal(ids[0]);
      });
    });
    $('#editText').onclick = () => {
      if (!confirm('Modificare il testo? Le evidenziature restano legate alle posizioni: se cambi molto il testo, alcune potrebbero non combaciare più.')) return;
      const t = p.testo; p.testo = '';
      renderTextPanel(p);
      $('#textInput').value = t;
    };
    $('#selAnnotate').onclick = () => { if (pendingSel) openModal(null, pendingSel); };
  }

  // Costruisce l'HTML del testo con i <mark> per le annotazioni "span"
  function renderTextHTML(p) {
    const lines = p.testo.split('\n');
    const starts = []; let acc = 0;
    lines.forEach((ln) => { starts.push(acc); acc += ln.length + 1; });
    const spanAnns = (p.annotazioni || []).filter((a) => a.refType === 'span' && a.span);
    const cls = (p.genere === 'poesia' ? 'poesia' : '') + (batch.on ? ' batch-on' : '');
    const html = lines.map((ln, i) => {
      const lineStart = starts[i];
      const lineEnd = lineStart + ln.length;
      const inner = buildLineHTML(ln, lineStart, lineEnd, spanAnns);
      const tag = p.genere === 'poesia' ? 'verso' : 'ln';
      return `<span class="${tag}${ln.length ? '' : ' empty'}" data-line="${i}" data-start="${lineStart}">${inner || '​'}</span>`;
    }).join('');
    return `<div class="text-render ${cls}" id="textRender">${html}</div>`;
  }

  function buildLineHTML(ln, lineStart, lineEnd, anns) {
    // boundaries locali alla riga
    const pts = new Set([0, ln.length]);
    const cover = anns.map((a) => {
      const s = Math.max(a.span.start, lineStart) - lineStart;
      const e = Math.min(a.span.end, lineEnd) - lineStart;
      if (e > s && e > 0 && s < ln.length) { pts.add(s); pts.add(e); return { a, s, e }; }
      return null;
    }).filter(Boolean);
    if (!cover.length) return esc(ln);
    const sorted = Array.from(pts).sort((x, y) => x - y);
    let out = '';
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i], b = sorted[i + 1];
      if (b <= a) continue;
      const seg = esc(ln.slice(a, b));
      const cov = cover.filter((c) => c.s <= a && c.e >= b);
      if (!cov.length) { out += seg; continue; }
      const top = cov.sort((x, y) => impRank(y.a.importanza) - impRank(x.a.importanza))[0].a;
      const ids = cov.map((c) => c.a.id).join(',');
      out += `<mark class="hl" data-anns="${ids}" style="--hl:${LV_RGBA[top.livello] || 'rgba(24,0,172,0.16)'}" title="${cov.length} annotazion${cov.length > 1 ? 'i' : 'e'}">${seg}</mark>`;
    }
    return out;
  }
  function impRank(id) { return { chiave: 3, rilevante: 2, accessoria: 1 }[id] || 0; }

  /* ── Cattura della selezione → offset globali ─────────────── */
  function onTextSelect() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) { hideSelHint(); return; }
    const a = endpointOffset(sel.anchorNode, sel.anchorOffset);
    const b = endpointOffset(sel.focusNode, sel.focusOffset);
    if (a == null || b == null) { hideSelHint(); return; }
    const start = Math.min(a, b), end = Math.max(a, b);
    if (end - start < 1) { hideSelHint(); return; }
    const p = currentPasso();
    // ── Analisi rapida (batch): la selezione crea subito l'annotazione ──
    if (batch.on && batch.livello && batch.categoria) {
      const ann = {
        id: uid(), livello: batch.livello, categoria: batch.categoria, voce: batch.voce || '',
        importanza: batch.importanza, refType: 'span', span: { start, end },
        quote: p.testo.slice(start, end), refManuale: '', tags: [], commento: '',
        rimando: { passoId: '', libero: '' },
        ipertesto: { ambito: '', pratica: '', visibilita: '', postura: '', modo: '' },
        creato: now(), modificato: now(),
      };
      if (!p.annotazioni) p.annotazioni = [];
      p.annotazioni.push(ann); p.modificato = now(); save();
      batch.count++;
      window.getSelection().removeAllRanges();
      renderTextPanel(p); renderNotes(p); renderBatchBar();
      const etich = batch.voce || (T.getCategoria(batch.livello, batch.categoria) || {}).nome || '';
      toast('Annotato: ' + etich + ' (' + batch.count + ')');
      return;
    }
    pendingSel = { start, end, quote: p.testo.slice(start, end) };
    const hint = $('#selHint');
    const q = pendingSel.quote.replace(/\s+/g, ' ').trim();
    $('#selQuote').innerHTML = 'Selezione: «<i>' + esc(q.length > 60 ? q.slice(0, 60) + '…' : q) + '</i>»';
    hint.style.display = '';
  }
  function endpointOffset(node, offset) {
    const lineEl = node.nodeType === 1 ? node.closest('[data-line]') : (node.parentElement && node.parentElement.closest('[data-line]'));
    if (!lineEl) return null;
    const base = parseInt(lineEl.dataset.start, 10);
    const r = document.createRange();
    r.setStart(lineEl, 0);
    try { r.setEnd(node, offset); } catch (e) { return null; }
    return base + r.toString().length;
  }
  function hideSelHint() { pendingSel = null; const h = $('#selHint'); if (h) h.style.display = 'none'; }

  /* ============================================================
     PANNELLO NOTE: filtri, raggruppamento, render
     ============================================================ */
  function renderFilters() {
    const lv = $('#filterLivelli');
    lv.innerHTML = T.LIVELLI.map((l) =>
      `<button class="chip lv-${l.colore} ${view.filtriLivello.has(l.id) ? 'active' : ''}" data-lv="${l.id}" title="${esc(l.consegna || l.domanda || l.descr)}">
         <span class="swatch" style="background:var(--${l.colore})"></span>${esc(l.breve)}</button>`
    ).join('');
    const imp = $('#filterImp');
    imp.innerHTML = T.IMPORTANZE.map((i) =>
      `<button class="chip imp ${view.filtriImp.has(i.id) ? 'active' : ''}" data-imp="${i.id}">${esc(i.nome)}</button>`
    ).join('');
    $$('#viewToggle button').forEach((b) => b.classList.toggle('active', b.dataset.view === view.mode));
  }

  function filteredAnns(p) {
    let arr = (p.annotazioni || []).slice();
    if (view.filtriLivello.size) arr = arr.filter((a) => view.filtriLivello.has(a.livello));
    if (view.filtriImp.size) arr = arr.filter((a) => view.filtriImp.has(a.importanza));
    if (view.search) {
      const q = view.search.toLowerCase();
      arr = arr.filter((a) => [a.voce, a.commento, a.quote, a.refManuale, (a.tags || []).join(' ')]
        .filter(Boolean).join(' ').toLowerCase().includes(q));
    }
    return arr;
  }

  function renderNotes(p) {
    renderFilters();
    const list = $('#notesList');
    const all = p.annotazioni || [];
    const arr = filteredAnns(p);
    $('#notesCount').textContent = arr.length + (arr.length === all.length ? '' : '/' + all.length) + (all.length === 1 ? ' nota' : ' note');

    if (!arr.length) {
      list.innerHTML = '<div class="empty-state" style="padding:40px 10px">'
        + (all.length ? '<p>Nessuna nota con questi filtri.</p>' : '<p>Ancora nessuna annotazione.<br>Seleziona del testo o usa <b>+ Annota</b>.</p>')
        + '</div>';
      return;
    }

    let groups = [];
    if (view.mode === 'livello') {
      T.LIVELLI.forEach((l) => {
        const sub = arr.filter((a) => a.livello === l.id);
        if (!sub.length) return;
        // sotto-raggruppamento per categoria
        const byCat = {};
        sub.forEach((a) => { (byCat[a.categoria] = byCat[a.categoria] || []).push(a); });
        const cards = Object.keys(byCat).map((catId) => {
          const cat = T.getCategoria(l.id, catId);
          const head = `<div class="note-group-title" style="color:var(--${l.colore})">${esc(cat ? cat.nome : catId)}<span class="gt-line"></span></div>`;
          return head + byCat[catId].map((a) => noteCardHTML(a, true)).join('');
        }).join('');
        groups.push({ title: l.nome, color: l.colore, html: cards });
      });
    } else if (view.mode === 'importanza') {
      T.IMPORTANZE.forEach((imp) => {
        const sub = arr.filter((a) => a.importanza === imp.id)
          .sort((x, y) => impRank(y.importanza) - impRank(x.importanza));
        if (!sub.length) return;
        groups.push({ title: imp.nome, html: sub.map((a) => noteCardHTML(a)).join('') });
      });
    } else { // sequenza
      const seq = arr.slice().sort((x, y) => {
        const sx = x.refType === 'span' && x.span ? x.span.start : Number.MAX_SAFE_INTEGER;
        const sy = y.refType === 'span' && y.span ? y.span.start : Number.MAX_SAFE_INTEGER;
        if (sx !== sy) return sx - sy;
        return (x.creato || '').localeCompare(y.creato || '');
      });
      groups.push({ title: 'In sequenza nel testo', html: seq.map((a) => noteCardHTML(a)).join('') });
    }

    list.innerHTML = groups.map((g) =>
      `<div class="note-group"><div class="note-group-title"${g.color ? ` style="color:var(--${g.color})"` : ''}>${esc(g.title)}<span class="gt-line"></span></div>${g.html}</div>`
    ).join('');
  }

  function noteCardHTML(a, hideCat) {
    const l = T.getLivello(a.livello) || {};
    const cat = T.getCategoria(a.livello, a.categoria);
    const impCls = a.importanza || 'accessoria';
    const impNome = (T.getImportanza(a.importanza) || {}).nome || '';
    let ref = '';
    if (a.refType === 'span' && a.quote) {
      const q = a.quote.replace(/\s+/g, ' ').trim();
      ref = `<div class="nc-quote">${esc(q.length > 140 ? q.slice(0, 140) + '…' : q)}</div>`;
    } else if (a.refManuale) {
      ref = `<div class="nc-ref">${esc(a.refManuale)}</div>`;
    }
    let rimando = '';
    let iperMeta = '';
    if (a.livello === 'ipertesto') {
      if (a.rimando) {
        let txt = '';
        if (a.rimando.passoId) {
          const tp = DB.passi.find((x) => x.id === a.rimando.passoId);
          txt = tp ? '↪ ' + (tp.autore ? tp.autore + ', ' : '') + (tp.titolo || tp.opera || 'passo in archivio') : '';
        } else if (a.rimando.libero) txt = '↪ ' + a.rimando.libero;
        if (txt) rimando = `<div class="nc-link" style="color:var(--${l.colore})">${esc(txt)}</div>`;
      }
      const ip = a.ipertesto || {};
      const pills = [];
      const amb = (T.IPERTESTO.ambiti.find((x) => x.id === ip.ambito) || {}).nome;
      if (amb) pills.push(esc(amb));
      const pr = T.getPratica(ip.pratica);
      if (pr) pills.push(esc(pr.nome) + ' · ' + esc(pr.tono));
      const lett = T.letturaRapporto(ip.visibilita, ip.postura);
      if (lett) pills.push(esc(lett));
      const md = (T.IPERTESTO.modo.find((x) => x.id === ip.modo) || {}).nome;
      if (md) pills.push(esc(md));
      if (pills.length) iperMeta = `<div class="nc-iper">${pills.map((t) => `<span>${t}</span>`).join('')}</div>`;
    }
    const tags = (a.tags || []).length ? `<div class="nc-tags">${a.tags.map((t) => `<span class="nc-tag">${esc(t)}</span>`).join('')}</div>` : '';
    let voceTip = '';
    if (a.voce && cat) {
      const vd = cat.voci.find((v) => v.nome === a.voce);
      if (vd) voceTip = vd.def + (vd.es ? ' — es.: ' + vd.es : '');
    }
    return `<div class="note-card lv-${a.livello}" data-id="${a.id}">
      <div class="nc-top">
        ${hideCat ? '' : `<span class="nc-cat">${esc(cat ? cat.nome : '')}</span>`}
        ${a.voce ? `<span class="nc-voce"${voceTip ? ` title="${esc(voceTip)}"` : ''}>${esc(a.voce)}</span>` : ''}
        <span class="nc-imp ${impCls}" title="Importanza: ${esc(impNome)}">${esc(impNome)}</span>
      </div>
      ${ref}
      ${a.commento ? `<div class="nc-comment">${esc(a.commento)}</div>` : ''}
      ${rimando}
      ${iperMeta}
      ${tags}
    </div>`;
  }

  /* ============================================================
     MODALE ANNOTAZIONE
     ============================================================ */
  function openModal(annId, sel) {
    const p = currentPasso();
    editingId = annId || null;
    const existing = annId ? (p.annotazioni || []).find((a) => a.id === annId) : null;
    formState = existing ? JSON.parse(JSON.stringify(existing)) : {
      id: uid(), livello: '', categoria: '', voce: '', importanza: 'rilevante',
      refType: sel ? 'span' : 'manuale',
      span: sel ? { start: sel.start, end: sel.end } : null,
      quote: sel ? sel.quote : '', refManuale: '', refPrefix: '', refLocus: '', tags: [], commento: '',
      rimando: { passoId: '', libero: '' },
      ipertesto: { ambito: '', pratica: '', visibilita: '', postura: '', modo: '' },
    };
    if (!formState.ipertesto) formState.ipertesto = { ambito: '', pratica: '', visibilita: '', postura: '', modo: '' };
    // costruttore rapido del riferimento: precarica dal refManuale esistente
    if (formState.refType !== 'span' && formState.refLocus === undefined) {
      formState.refLocus = formState.refManuale || ''; formState.refPrefix = '';
    }
    if (formState.refPrefix === undefined) formState.refPrefix = '';
    if (sel) { formState.refType = 'span'; formState.span = { start: sel.start, end: sel.end }; formState.quote = sel.quote; }
    $('#modalTitle').textContent = existing ? 'Modifica annotazione' : 'Nuova annotazione';
    $('#btnDelete').style.display = existing ? '' : 'none';
    $('#btnDelete').onclick = deleteAnnotation;
    $('#btnSave').textContent = 'Salva annotazione';
    $('#btnSave').onclick = saveAnnotation;
    renderModalBody();
    $('#modal').classList.add('open');
  }
  function closeModal() { $('#modal').classList.remove('open'); editingId = null; formState = null; }

  function renderModalBody() {
    const fs = formState;
    const p = currentPasso();
    const body = $('#modalBody');
    const liv = T.getLivello(fs.livello);

    // ── 1. Riferimento nel testo ──────────────────────────────
    let refHtml = '<div class="field"><label>Riferimento nel testo</label>';
    if (fs.refType === 'span' && fs.quote) {
      const q = fs.quote.replace(/\s+/g, ' ').trim();
      refHtml += `<div class="nc-quote" style="margin:0 0 8px">${esc(q.length > 160 ? q.slice(0, 160) + '…' : q)}</div>`;
      refHtml += `<input type="text" id="fRefMan" placeholder="Precisazione (es. v. 3) — facoltativa" value="${esc(fs.refManuale)}">`;
    } else {
      // costruttore rapido: pulsanti del tipo + campo del luogo
      refHtml += '<div class="ref-chips">'
        + REF_PREFIXES.map((px) => `<button type="button" class="ref-chip ${fs.refPrefix === px.v ? 'on' : ''}" data-px="${px.v}">${esc(px.label)}</button>`).join('')
        + '</div>';
      refHtml += `<input type="text" id="fRefLocus" placeholder="${fs.refPrefix === '«»' ? 'scrivi la citazione' : 'numero o intervallo, es. 1-4'}" value="${esc(fs.refLocus || '')}">`;
      const preview = composeRef(fs.refPrefix, fs.refLocus);
      refHtml += `<p class="hint">${preview ? 'Riferimento: <b>' + esc(preview) + '</b>' : 'Scegli un tipo e scrivi il luogo (oppure lascia vuoto).'}</p>`;
    }
    refHtml += '</div>';

    // ── 2. Che cosa vuoi osservare? ───────────────────────────
    // Nessun livello scelto → mostra solo le 4 scelte e fermati qui.
    if (!liv) {
      body.innerHTML = refHtml
        + '<div class="field"><label>Che cosa vuoi osservare?</label><div class="livello-picker">'
        + T.LIVELLI.map((l) =>
          `<div class="lv-opt" data-lv="${l.id}" style="--c:var(--${l.colore});--cbg:var(--${l.colore}-bg)">
             <span class="lo-name">${esc(l.nome)}</span><span class="lo-desc">${esc(l.consegna || l.domanda || l.descr)}</span></div>`).join('')
        + '</div></div>';
      bindModalEvents();
      return;
    }

    // Livello scelto → barra compatta (le altre 3 scompaiono) + espansione
    const selHtml = `<div class="field"><label>Che cosa vuoi osservare?</label>
        <div class="lv-selected" style="--c:var(--${liv.colore})">
          <span class="lv-sel-name">${esc(liv.nome)}</span>
          <button type="button" class="lv-change" id="btnChangeLv">↺ cambia</button>
        </div></div>`;

    const guidaHtml = `<div class="guida-livello" style="border-left-color:var(--${liv.colore})">
        <span class="glc-label" style="color:var(--${liv.colore})">La tua consegna</span>
        <div class="gl-domanda" style="color:var(--${liv.colore})">${esc(liv.consegna || liv.domanda || '')}</div>
        ${liv.intento ? `<p class="gl-intento">${esc(liv.intento)}</p>` : ''}
        ${liv.esempio ? `<p class="gl-es">${esc(liv.esempio)}</p>` : ''}
        ${liv.checklist && liv.checklist.length ? `<div class="gl-check"><span class="glc-label">In questo livello cerca</span><ul>${liv.checklist.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      </div>`;

    // Menù unico categoria+voce: gruppi per categoria, alfabetico interno,
    // micro-descrizione sotto ogni voce.
    const groupsHtml = liv.categorie.map((c) => {
      const voci = c.voci.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
      return `<div class="combo-group"><div class="combo-group-label">${esc(c.nome)}</div>`
        + voci.map((v) => `<button type="button" class="combo-item ${fs.voce === v.nome ? 'on' : ''}" data-cat="${c.id}" data-voce="${esc(v.nome)}">
            <span class="ci-name">${esc(v.nome)}</span><span class="ci-def">${esc(v.def)}</span></button>`).join('')
        + '</div>';
    }).join('');
    const catObj = T.getCategoria(fs.livello, fs.categoria);
    const voceKnown = catObj && catObj.voci.some((v) => v.nome === fs.voce);
    const freeVal = (fs.voce && !voceKnown) ? fs.voce : '';
    const comboHtml = `<div class="field"><label>Figura / voce</label>
        <div class="combo" id="voceCombo">
          <button type="button" class="combo-btn ${fs.voce ? 'has' : ''}" id="comboBtn"><span>${esc(fs.voce || '— scegli la figura o la voce —')}</span><span class="combo-caret">▾</span></button>
          <div class="combo-panel" id="comboPanel" hidden>
            <input type="text" class="combo-search" id="comboSearch" placeholder="filtra per nome o descrizione…">
            <div class="combo-list">${groupsHtml}</div>
          </div>
        </div>
        <input type="text" id="fVoceLibera" class="combo-free" placeholder="oppure scrivi una voce non in elenco" value="${esc(freeVal)}">
      </div>`;

    // guida d'autore della categoria + promemoria della voce
    let voceExtraHtml = '';
    if (fs.voce) {
      const guidaCat = T.getGuidaCategoria(fs.livello, fs.categoria);
      if (guidaCat) voceExtraHtml += `<p class="guida-cat" style="--c:var(--${liv.colore})">${esc(guidaCat)}</p>`;
      const vdef = catObj ? catObj.voci.find((v) => v.nome === fs.voce) : null;
      if (vdef) voceExtraHtml += `<p class="voce-def">${esc(vdef.def)}${vdef.es ? ` <span class="voce-es">es.: «${esc(vdef.es)}»</span>` : ''}</p>`;
    }

    // Blocco ipertestuale: ipotesto, ambito, pratica, assi, modo, bussola
    let rimHtml = '';
    if (fs.livello === 'ipertesto') {
      const ip = fs.ipertesto || (fs.ipertesto = { ambito: '', pratica: '', visibilita: '', postura: '', modo: '' });
      const IP = T.IPERTESTO;
      const seg = (label, field, opts, hint) =>
        `<div class="field"><label>${esc(label)}</label><div class="seg" data-field="${field}">`
        + opts.map((o) => `<button type="button" data-v="${o.id}" class="${ip[field] === o.id ? 'on' : ''}"${o.descr ? ` title="${esc(o.descr)}"` : ''}>${esc(o.nome)}</button>`).join('')
        + `</div>${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;

      rimHtml = '<div class="iper-block">';
      // Ipotesto / modello
      rimHtml += '<div class="field"><label>Ipotesto · modello di riferimento</label>'
        + '<select id="fRimPasso"><option value="">— passo in archivio (facolt.) —</option>'
        + DB.passi.filter((x) => x.id !== p.id).map((x) =>
          `<option value="${x.id}" ${fs.rimando && fs.rimando.passoId === x.id ? 'selected' : ''}>${esc((x.autore ? x.autore + ', ' : '') + (x.titolo || x.opera || 'passo'))}</option>`).join('')
        + '</select>'
        + `<input type="text" id="fRimLibero" style="margin-top:8px" placeholder="oppure: autore, opera, luogo del modello" value="${esc(fs.rimando ? fs.rimando.libero : '')}">`
        + '</div>';
      // Ambito (dove sta il testo collegato)
      rimHtml += seg('Ambito del rimando', 'ambito', IP.ambiti);
      // Pratica ipertestuale (deriva operazione + tono)
      rimHtml += '<div class="field"><label>Pratica ipertestuale</label>'
        + '<select id="fPratica"><option value="">— non pertinente / da definire —</option>'
        + IP.pratiche.map((pr) => `<option value="${pr.id}" ${ip.pratica === pr.id ? 'selected' : ''}>${esc(pr.nome)}</option>`).join('')
        + '</select>';
      const pr = T.getPratica(ip.pratica);
      if (pr) rimHtml += `<p class="hint">${esc(pr.def)} → operazione: <b>${esc(pr.operazione)}</b> · tono: <b>${esc(pr.tono)}</b></p>`;
      rimHtml += '</div>';
      // Assi: visibilità × postura → lettura del rapporto
      rimHtml += seg('Visibilità del rimando', 'visibilita', IP.visibilita);
      rimHtml += seg('Postura verso il modello', 'postura', IP.postura);
      const lettura = T.letturaRapporto(ip.visibilita, ip.postura);
      if (lettura) rimHtml += `<div class="lettura">Lettura del rapporto: <b>${esc(lettura)}</b></div>`;
      // Modo
      rimHtml += seg('Modo', 'modo', IP.modo);
      // Bussola riflessiva
      rimHtml += '<details class="bussola"><summary>Bussola riflessiva — domande per compilare</summary><ol>'
        + IP.bussola.map((q) => `<li>${esc(q)}</li>`).join('') + '</ol></details>';
      rimHtml += '</div>';
    }

    // Tag liberi
    let tagHtml = '<div class="field"><label>Tag liberi (sfera semantica, tema, parola-chiave…)</label>'
      + '<div class="tag-input-wrap" id="tagWrap">'
      + fs.tags.map((t, i) => `<span class="tag-pill">${esc(t)}<button data-tagi="${i}">×</button></span>`).join('')
      + '<input type="text" id="fTagInput" placeholder="scrivi e premi Invio"></div></div>';

    // Importanza
    let impHtml = '<div class="field"><label>Importanza</label><div class="imp-picker">'
      + T.IMPORTANZE.map((i) =>
        `<div class="imp-opt ${i.id} ${fs.importanza === i.id ? 'sel' : ''}" data-imp="${i.id}" title="${esc(i.descr)}">${esc(i.nome)}</div>`).join('')
      + '</div></div>';

    // Commento
    let comHtml = `<div class="field"><label>Commento</label><textarea id="fCommento" placeholder="Annotazione critica: che cosa noti e perché conta.">${esc(fs.commento)}</textarea></div>`;

    body.innerHTML = refHtml + selHtml + guidaHtml + comboHtml + voceExtraHtml + rimHtml + tagHtml + impHtml + comHtml;
    bindModalEvents();
  }

  function syncFormFromInputs() {
    const fs = formState; if (!fs) return;
    if (fs.refType === 'span') { const man = $('#fRefMan'); if (man) fs.refManuale = man.value.trim(); }
    else {
      const loc = $('#fRefLocus');
      if (loc) { fs.refLocus = loc.value.trim(); fs.refManuale = composeRef(fs.refPrefix, fs.refLocus); }
    }
    const com = $('#fCommento'); if (com) fs.commento = com.value;
    const vl = $('#fVoceLibera'); if (vl && vl.value.trim()) fs.voce = vl.value.trim();
    if (fs.livello === 'ipertesto') {
      const rp = $('#fRimPasso'); const rl = $('#fRimLibero');
      fs.rimando = { passoId: rp ? rp.value : '', libero: rl ? rl.value.trim() : '' };
    }
  }

  function bindModalEvents() {
    const fs = formState;
    // riferimento rapido: pulsanti del tipo
    $$('#modalBody .ref-chip').forEach((b) => b.onclick = () => {
      syncFormFromInputs();
      fs.refPrefix = fs.refPrefix === b.dataset.px ? '' : b.dataset.px;
      renderModalBody(); const loc = $('#fRefLocus'); if (loc) loc.focus();
    });
    // scelta del livello (presente solo quando nessun livello è scelto)
    $$('#modalBody .lv-opt').forEach((o) => o.onclick = () => {
      syncFormFromInputs();
      fs.livello = o.dataset.lv; fs.categoria = ''; fs.voce = ''; renderModalBody();
    });
    const change = $('#btnChangeLv');
    if (change) change.onclick = () => { syncFormFromInputs(); fs.livello = ''; fs.categoria = ''; fs.voce = ''; renderModalBody(); };
    // menù unico categoria+voce
    const comboBtn = $('#comboBtn');
    if (comboBtn) {
      const panel = $('#comboPanel');
      comboBtn.onclick = (e) => { e.stopPropagation(); panel.hidden = !panel.hidden; if (!panel.hidden) { const s = $('#comboSearch'); if (s) s.focus(); } };
      const search = $('#comboSearch');
      if (search) search.oninput = () => {
        const q = search.value.toLowerCase();
        $$('#modalBody .combo-item').forEach((it) => {
          const t = (it.dataset.voce + ' ' + (it.querySelector('.ci-def') || {}).textContent).toLowerCase();
          it.style.display = t.indexOf(q) >= 0 ? '' : 'none';
        });
        $$('#modalBody .combo-group').forEach((g) => { g.style.display = $$('.combo-item', g).some((it) => it.style.display !== 'none') ? '' : 'none'; });
      };
      $$('#modalBody .combo-item').forEach((it) => it.onclick = () => {
        syncFormFromInputs(); fs.categoria = it.dataset.cat; fs.voce = it.dataset.voce; renderModalBody();
      });
    }
    // chiudi il menù cliccando fuori
    body_onmousedown_closeCombo();
    // importanza
    $$('#modalBody .imp-opt').forEach((o) => o.onclick = () => { fs.importanza = o.dataset.imp; $$('#modalBody .imp-opt').forEach((x) => x.classList.toggle('sel', x === o)); });
    // tag liberi
    const ti = $('#fTagInput');
    if (ti) {
      ti.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault(); const v = ti.value.trim().replace(/,$/, '');
          if (v) { fs.tags.push(v); renderModalBody(); $('#fTagInput').focus(); }
        } else if (e.key === 'Backspace' && !ti.value && fs.tags.length) {
          fs.tags.pop(); renderModalBody(); $('#fTagInput').focus();
        }
      };
    }
    $$('#tagWrap [data-tagi]').forEach((b) => b.onclick = () => { fs.tags.splice(+b.dataset.tagi, 1); renderModalBody(); });
    // blocco ipertestuale
    const pratSel = $('#fPratica');
    if (pratSel) pratSel.onchange = () => { syncFormFromInputs(); fs.ipertesto.pratica = pratSel.value; renderModalBody(); };
    $$('#modalBody .seg').forEach((seg) => {
      const field = seg.dataset.field;
      $$('button', seg).forEach((b) => b.onclick = () => {
        syncFormFromInputs();
        fs.ipertesto[field] = fs.ipertesto[field] === b.dataset.v ? '' : b.dataset.v;
        renderModalBody();
      });
    });
  }
  function body_onmousedown_closeCombo() {
    $('#modalBody').onmousedown = (e) => {
      const panel = $('#comboPanel');
      if (panel && !panel.hidden && !e.target.closest('#voceCombo')) panel.hidden = true;
    };
  }

  function saveAnnotation() {
    syncFormFromInputs();
    const fs = formState, p = currentPasso();
    if (!fs.livello) { toast('Scegli un livello di analisi'); return; }
    if (fs.voce === ' ') fs.voce = '';
    if (!fs.commento.trim() && !fs.voce) { toast('Aggiungi un commento o una voce'); return; }
    fs.modificato = now();
    if (!p.annotazioni) p.annotazioni = [];
    const idx = p.annotazioni.findIndex((a) => a.id === fs.id);
    if (idx >= 0) p.annotazioni[idx] = fs;
    else { fs.creato = now(); p.annotazioni.push(fs); }
    p.modificato = now();
    save(); closeModal(); renderWorkspace();
    toast('Annotazione salvata');
  }

  function deleteAnnotation() {
    const p = currentPasso();
    if (!confirm('Eliminare questa annotazione?')) return;
    p.annotazioni = (p.annotazioni || []).filter((a) => a.id !== formState.id);
    save(); closeModal(); renderWorkspace(); toast('Annotazione eliminata');
  }

  /* ============================================================
     MODALE NUOVO PASSO
     ============================================================ */
  function openPassoModal(passo) {
    const editing = !!passo;
    const fs = passo ? JSON.parse(JSON.stringify(passo)) : { id: uid(), autore: '', opera: '', titolo: '', genere: 'poesia', lingua: 'it', mode: 'con', testo: '', annotazioni: [] };
    const body = $('#modalBody');
    $('#modalTitle').textContent = editing ? 'Dati del passo' : 'Nuovo passo';
    $('#btnDelete').style.display = 'none';
    body.innerHTML = `
      <div class="field-row">
        <div class="field"><label>Autore</label><input type="text" id="pAutore" value="${esc(fs.autore)}" placeholder="es. Catullo"></div>
        <div class="field"><label>Opera</label><input type="text" id="pOpera" value="${esc(fs.opera)}" placeholder="es. Liber, carme 5"></div>
      </div>
      <div class="field"><label>Titolo del passo</label><input type="text" id="pTitolo" value="${esc(fs.titolo)}" placeholder="es. Vivamus, mea Lesbia"></div>
      <div class="field-row">
        <div class="field"><label>Genere</label><select id="pGenere">${T.GENERI.map((g) => `<option value="${g.id}" ${fs.genere === g.id ? 'selected' : ''}>${esc(g.nome)}</option>`).join('')}</select></div>
        <div class="field"><label>Lingua</label><select id="pLingua">${T.LINGUE.map((g) => `<option value="${g.id}" ${fs.lingua === g.id ? 'selected' : ''}>${esc(g.nome)}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label>Modalità di lavoro</label>
        <select id="pMode">
          <option value="con" ${fs.mode !== 'senza' ? 'selected' : ''}>Con testo (incollo il passo ed evidenzio)</option>
          <option value="senza" ${fs.mode === 'senza' ? 'selected' : ''}>Libro a fianco (annoto con riferimenti manuali)</option>
        </select>
      </div>`;
    $('#btnSave').textContent = editing ? 'Salva dati' : 'Crea passo';
    $('#btnSave').onclick = () => {
      fs.autore = $('#pAutore').value.trim();
      fs.opera = $('#pOpera').value.trim();
      fs.titolo = $('#pTitolo').value.trim();
      fs.genere = $('#pGenere').value;
      fs.lingua = $('#pLingua').value;
      fs.mode = $('#pMode').value;
      if (!fs.titolo && !fs.autore) { toast('Indica almeno autore o titolo'); return; }
      fs.modificato = now();
      const idx = DB.passi.findIndex((x) => x.id === fs.id);
      if (idx >= 0) DB.passi[idx] = fs; else { fs.creato = now(); DB.passi.push(fs); }
      DB.currentId = fs.id; save(); closeModal(); go(true);
    };
    $('#modal').classList.add('open');
  }

  /* ============================================================
     IMPORT / EXPORT
     ============================================================ */
  function exportData(onlyCurrent) {
    const data = onlyCurrent ? { passi: [currentPasso()], _single: true } : DB;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const name = onlyCurrent ? (currentPasso().titolo || 'passo') : 'archivio';
    a.href = URL.createObjectURL(blob);
    a.download = 'analisi-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json';
    a.click(); URL.revokeObjectURL(a.href);
    toast('Esportato');
  }
  function importData(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        const incoming = data.passi || (Array.isArray(data) ? data : []);
        if (!incoming.length) { toast('Nessun passo nel file'); return; }
        incoming.forEach((p) => {
          if (!p.id || DB.passi.some((x) => x.id === p.id)) p.id = uid();
          if (!p.annotazioni) p.annotazioni = [];
          DB.passi.push(p);
        });
        save(); renderArchive();
        toast(incoming.length + ' passo/i importati');
      } catch (e) { console.error(e); toast('⚠ File non valido'); }
    };
    r.readAsText(file);
  }

  /* ============================================================
     BINDINGS GLOBALI
     ============================================================ */
  function bind() {
    $('#btnNuovoPasso').onclick = () => openPassoModal(null);
    $('#btnArchivio').onclick = () => { DB.currentId = null; go(false); };
    $('#btnExport').onclick = () => exportData(false);
    $('#btnExportPasso') && ($('#btnExportPasso').onclick = () => exportData(true));
    $('#btnImport').onclick = () => $('#fileImport').click();
    $('#btnImportArch').onclick = () => $('#fileImport').click();
    $('#fileImport').onchange = (e) => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ''; };

    // archivio: apri / elimina
    $('#passiGrid').addEventListener('click', (e) => {
      const del = e.target.closest('[data-del]');
      if (del) {
        e.stopPropagation();
        if (confirm('Eliminare questo passo e tutte le sue annotazioni?')) {
          DB.passi = DB.passi.filter((x) => x.id !== del.dataset.del); save(); renderArchive();
        }
        return;
      }
      const card = e.target.closest('.passo-card');
      if (card) { DB.currentId = card.dataset.id; go(true); }
    });

    // workspace
    $('#btnAddNote').onclick = () => openModal(null, pendingSel);
    $('#btnBatch') && ($('#btnBatch').onclick = toggleBatch);
    $('#btnEditPasso').onclick = () => openPassoModal(currentPasso());
    $('#modeToggle').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const p = currentPasso(); p.mode = b.dataset.mode; p.modificato = now(); save(); renderWorkspace();
    });
    $('#notesList').addEventListener('click', (e) => {
      const card = e.target.closest('.note-card'); if (card) openModal(card.dataset.id);
    });
    $('#filterLivelli').addEventListener('click', (e) => {
      const b = e.target.closest('[data-lv]'); if (!b) return;
      const id = b.dataset.lv; view.filtriLivello.has(id) ? view.filtriLivello.delete(id) : view.filtriLivello.add(id);
      renderNotes(currentPasso());
    });
    $('#filterImp').addEventListener('click', (e) => {
      const b = e.target.closest('[data-imp]'); if (!b) return;
      const id = b.dataset.imp; view.filtriImp.has(id) ? view.filtriImp.delete(id) : view.filtriImp.add(id);
      renderNotes(currentPasso());
    });
    $('#viewToggle').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      view.mode = b.dataset.view; renderNotes(currentPasso());
    });
    $('#notesSearch').addEventListener('input', (e) => { view.search = e.target.value; renderNotes(currentPasso()); });

    // modale (save/delete vengono ricollegati ad ogni apertura)
    $('#btnCancel').onclick = closeModal;
    $('#modalClose').onclick = closeModal;
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  }

  /* ── Avvio ────────────────────────────────────────────────── */
  load(); bind(); setDirty(false);
  go(false);

})();
