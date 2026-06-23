/* ============================================================
   ANALISI DEL TESTO — Commento (Fase 2)
   Officina di composizione guidata: il protocollo di analisi
   in 5 fasi (con variante filologica per greco/latino), che
   attinge alle annotazioni raccolte nella Fase 1.
   Stesso DB localStorage; il commento vive in passo.commento.
   ============================================================ */
(function () {
  'use strict';

  const T = window.AT_TASSONOMIA;
  const C = window.AT_COMMENTO;
  const STORE_KEY = 'analisitesto.db.v1';

  let DB = { passi: [], currentId: null };
  let saveTimer = null;

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const now = () => new Date().toISOString();

  const LV_RGBA = {
    retorica: 'rgba(24,0,172,0.18)', semantica: 'rgba(47,133,90,0.20)',
    pragmatica: 'rgba(43,108,176,0.18)', ipertesto: 'rgba(156,107,60,0.22)',
  };
  function impRank(id) { return { chiave: 3, rilevante: 2, accessoria: 1 }[id] || 0; }

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2000);
  }

  function load() {
    try { const raw = localStorage.getItem(STORE_KEY); if (raw) DB = JSON.parse(raw); }
    catch (e) { console.warn('Lettura DB fallita', e); }
    if (!DB.passi) DB.passi = [];
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); setSaved(true); }
    catch (e) { console.error(e); toast('⚠ Salvataggio non riuscito'); }
  }
  function setSaved(ok) {
    const d = $('#saveDot'); if (!d) return;
    d.classList.toggle('dirty', !ok);
    d.textContent = ok ? 'Salvato' : 'Salvataggio…';
  }
  function queueSave() {
    setSaved(false);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 600);
  }

  function currentPasso() { return DB.passi.find((p) => p.id === DB.currentId) || null; }

  function go(toWorkspace) {
    $('#view-chooser').style.display = toWorkspace ? 'none' : '';
    $('#view-workspace').style.display = toWorkspace ? '' : 'none';
    $('#crumbWrap').style.display = toWorkspace ? '' : 'none';
    $('#btnExport').style.display = toWorkspace ? '' : 'none';
    if (toWorkspace) renderWorkspace(); else renderChooser();
  }

  /* ── Scelta del passo ─────────────────────────────────────── */
  function renderChooser() {
    const grid = $('#passiGrid');
    if (!DB.passi.length) {
      grid.innerHTML = '<div class="empty-state"><p>Nessun passo in archivio.<br>'
        + 'Crea e annota un testo nella sezione <a href="analisi.html">Analisi</a>, poi torna qui per comporne il commento.</p></div>';
      return;
    }
    grid.innerHTML = DB.passi.map((p) => {
      const nAnn = (p.annotazioni || []).length;
      const comp = commentoCompletezza(p);
      const gen = (T.GENERI.find((g) => g.id === p.genere) || {}).nome || '';
      const lin = (T.LINGUE.find((g) => g.id === p.lingua) || {}).nome || '';
      return `<div class="passo-card" data-id="${p.id}">
        <span class="pc-genere">${esc(gen)}${lin ? ' · ' + esc(lin) : ''}</span>
        <span class="pc-titolo">${esc(p.titolo || 'Senza titolo')}</span>
        <span class="pc-meta">${esc(p.autore || '—')}${p.opera ? ', ' + esc(p.opera) : ''}</span>
        <div class="pc-stats">
          <span class="nc-tag">${nAnn} annotazion${nAnn === 1 ? 'e' : 'i'}</span>
          <span class="nc-tag">commento ${comp}%</span>
        </div>
      </div>`;
    }).join('');
  }

  function commentoCompletezza(p) {
    const modo = (p.commento && p.commento.modo) || C.protocolloPerLingua(p.lingua);
    const proto = C.getProtocollo(modo);
    let tot = 0, fatti = 0;
    proto.fasi.forEach((f) => f.campi.forEach((cmp) => {
      tot++;
      const v = p.commento && p.commento.campi && p.commento.campi[f.id + '.' + cmp.id];
      if (v && v.trim()) fatti++;
    }));
    return tot ? Math.round((fatti / tot) * 100) : 0;
  }

  /* ── Annotazioni pertinenti a una fase ────────────────────── */
  function matchFonte(ann, fonte) {
    const parts = fonte.split(':');
    if (ann.livello !== parts[0]) return false;
    return parts.length === 1 || ann.categoria === parts[1];
  }
  function annPerFase(p, fase) {
    if (!fase.fonti.length) return [];
    return (p.annotazioni || []).filter((a) => fase.fonti.some((f) => matchFonte(a, f)))
      .sort((x, y) => impRank(y.importanza) - impRank(x.importanza));
  }

  /* ── Workspace di commento ────────────────────────────────── */
  function renderWorkspace() {
    const p = currentPasso();
    if (!p) { go(false); return; }
    if (!p.commento) p.commento = { modo: C.protocolloPerLingua(p.lingua), campi: {} };
    if (!p.commento.campi) p.commento.campi = {};

    $('#crumb').innerHTML = `<b>${esc(p.autore || '—')}</b>${p.opera ? ' · ' + esc(p.opera) : ''}${p.titolo ? ' · ' + esc(p.titolo) : ''}`;
    $('#wmAuthor').textContent = p.autore || '—';
    $('#wmTitle').textContent = p.titolo || 'Senza titolo';
    const gen = (T.GENERI.find((g) => g.id === p.genere) || {}).nome || '';
    const lin = (T.LINGUE.find((g) => g.id === p.lingua) || {}).nome || '';
    $('#wmSub').textContent = [p.opera, gen, lin].filter(Boolean).join(' · ');

    // testo a fronte (read-only)
    $('#textHost').innerHTML = p.testo
      ? renderTextRO(p)
      : '<div class="text-empty-hint">Nessun testo digitato per questo passo: lavoro «libro a fianco». Componi il commento usando i materiali raccolti qui sotto.</div>';

    // protocollo
    $$('#protoToggle button').forEach((b) => b.classList.toggle('active', b.dataset.modo === p.commento.modo));
    const proto = C.getProtocollo(p.commento.modo);

    // tre domande (solo classico)
    const dom = $('#domandeChiave');
    if (proto.domande) {
      dom.style.display = '';
      dom.innerHTML = '<h3>Le tre domande del commento classico</h3><ol>'
        + proto.domande.map((q) => `<li>${esc(q)}</li>`).join('') + '</ol>';
    } else dom.style.display = 'none';

    renderFasi(p, proto);
    $('#principio').textContent = C.PRINCIPIO;
    renderVademecum();
    updateProgress(p, proto);
  }

  function renderFasi(p, proto) {
    const host = $('#fasiHost');
    host.innerHTML = proto.fasi.map((f) => {
      const mat = annPerFase(p, f);
      const campi = f.campi.map((cmp) => {
        const key = f.id + '.' + cmp.id;
        const val = p.commento.campi[key] || '';
        return `<div class="cmp-field">
          <label>${esc(cmp.label)}</label>
          <textarea class="cmp-ta${cmp.big ? ' big' : ''}" data-key="${key}" placeholder="${esc(cmp.prompt)}">${esc(val)}</textarea>
        </div>`;
      }).join('');
      const materiali = mat.length ? `<details class="materiali"${mat.length ? '' : ''}>
          <summary>Materiali raccolti — ${mat.length} annotazion${mat.length === 1 ? 'e' : 'i'}</summary>
          <div class="mat-list">${mat.map((a) => matCardHTML(a)).join('')}</div>
        </details>` : '<p class="mat-empty">Nessuna annotazione di questo livello: aggiungine in <a href="analisi.html">Analisi</a>.</p>';
      return `<section class="fase" data-fase="${f.id}">
        <div class="fase-head"><span class="fase-n">${f.n}</span>
          <div><h2>${esc(f.nome)}</h2><p class="fase-ob">${esc(f.obiettivo)}</p></div>
        </div>
        ${campi}
        <p class="fase-errore">⚠ Errore da evitare: ${esc(f.errore)}</p>
        ${materiali}
      </section>`;
    }).join('');

    $$('#fasiHost .cmp-ta').forEach((ta) => {
      ta.addEventListener('input', () => {
        currentPasso().commento.campi[ta.dataset.key] = ta.value;
        currentPasso().commento.aggiornato = now();
        queueSave();
        updateProgress(currentPasso(), C.getProtocollo(currentPasso().commento.modo));
      });
    });
    // inserisci citazione del materiale nel campo precedente
    $$('#fasiHost .mat-cite').forEach((b) => b.addEventListener('click', () => {
      const fase = b.closest('.fase');
      const ta = fase.querySelector('.cmp-ta');
      if (!ta) return;
      const txt = b.dataset.cite;
      ta.value = (ta.value ? ta.value.replace(/\s*$/, '') + ' ' : '') + txt;
      ta.dispatchEvent(new Event('input'));
      ta.focus();
      toast('Materiale inserito nel commento');
    }));
  }

  function matCardHTML(a) {
    const l = T.getLivello(a.livello) || {};
    const cat = T.getCategoria(a.livello, a.categoria);
    let ref = '';
    if (a.refType === 'span' && a.quote) ref = '«' + a.quote.replace(/\s+/g, ' ').trim() + '»';
    else if (a.refManuale) ref = a.refManuale;
    const cite = [ref, a.voce, a.commento].filter(Boolean).join(' — ');
    return `<div class="mat-card lv-${a.livello}">
      <div class="mat-top"><span class="mat-cat" style="color:var(--${l.colore})">${esc(cat ? cat.nome : '')}</span>
        ${a.voce ? `<span class="mat-voce">${esc(a.voce)}</span>` : ''}</div>
      ${ref ? `<div class="mat-ref">${esc(ref)}</div>` : ''}
      ${a.commento ? `<div class="mat-com">${esc(a.commento)}</div>` : ''}
      <button class="mat-cite" data-cite="${esc(cite)}" title="Inserisci nel campo di questa fase">↳ usa nel commento</button>
    </div>`;
  }

  /* ── Testo a fronte (read-only, con evidenziature) ────────── */
  function renderTextRO(p) {
    const lines = p.testo.split('\n');
    const starts = []; let acc = 0;
    lines.forEach((ln) => { starts.push(acc); acc += ln.length + 1; });
    const spanAnns = (p.annotazioni || []).filter((a) => a.refType === 'span' && a.span);
    const cls = p.genere === 'poesia' ? 'poesia' : '';
    const html = lines.map((ln, i) => {
      const inner = buildLineRO(ln, starts[i], starts[i] + ln.length, spanAnns);
      const tag = p.genere === 'poesia' ? 'verso' : 'ln';
      return `<span class="${tag}${ln.length ? '' : ' empty'}">${inner || '​'}</span>`;
    }).join('');
    return `<details class="text-ro" open><summary>Il testo</summary><div class="text-render ${cls}">${html}</div></details>`;
  }
  function buildLineRO(ln, lineStart, lineEnd, anns) {
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
      out += `<mark style="--hl:${LV_RGBA[top.livello] || 'rgba(24,0,172,0.16)'}">${seg}</mark>`;
    }
    return out;
  }

  /* ── Vademecum, progresso ─────────────────────────────────── */
  function renderVademecum() {
    $('#vademecumBody').innerHTML = C.VADEMECUM.map((v) =>
      `<div class="vade-row"><div class="vade-area">${esc(v.area)}</div>
        <div class="vade-cerca">${esc(v.cerca)}</div>
        <div class="vade-errore">✗ ${esc(v.errore)}</div></div>`).join('');
  }
  function updateProgress(p, proto) {
    let tot = 0, fatti = 0;
    proto.fasi.forEach((f) => f.campi.forEach((cmp) => {
      tot++; const v = p.commento.campi[f.id + '.' + cmp.id]; if (v && v.trim()) fatti++;
    }));
    const pct = tot ? Math.round((fatti / tot) * 100) : 0;
    $('#progressBar').style.width = pct + '%';
    $('#progressLabel').textContent = fatti + '/' + tot + ' campi · ' + pct + '%';
  }

  /* ── Export Markdown ──────────────────────────────────────── */
  function buildMarkdown(p) {
    const proto = C.getProtocollo(p.commento.modo);
    let md = '# ' + (p.titolo || 'Commento') + '\n';
    md += '_' + [p.autore, p.opera].filter(Boolean).join(', ') + '_\n\n';
    if (proto.domande) md += '> Commento filologico-letterario\n\n';
    proto.fasi.forEach((f) => {
      const blocchi = f.campi.map((cmp) => {
        const v = (p.commento.campi[f.id + '.' + cmp.id] || '').trim();
        return v ? '**' + cmp.label + '.** ' + v : '';
      }).filter(Boolean);
      if (!blocchi.length) return;
      md += '## ' + f.n + '. ' + f.nome + '\n\n' + blocchi.join('\n\n') + '\n\n';
    });
    return md.trim() + '\n';
  }
  function exportMd() {
    const p = currentPasso();
    const blob = new Blob([buildMarkdown(p)], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'commento-' + (p.titolo || 'passo').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.md';
    a.click(); URL.revokeObjectURL(a.href);
    toast('Commento esportato (Markdown)');
  }

  /* ── Bindings ─────────────────────────────────────────────── */
  function bind() {
    $('#btnChooser').onclick = () => { DB.currentId = null; go(false); };
    $('#btnExport').onclick = exportMd;
    $('#passiGrid').addEventListener('click', (e) => {
      const card = e.target.closest('.passo-card');
      if (card) { DB.currentId = card.dataset.id; go(true); }
    });
    $('#protoToggle').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const p = currentPasso(); p.commento.modo = b.dataset.modo; p.commento.aggiornato = now();
      save(); renderWorkspace();
    });
    $('#btnVademecum').onclick = () => $('#vademecum').classList.toggle('open');
  }

  load(); bind(); setSaved(true);
  // se si arriva con ?passo=ID si apre direttamente
  const pid = new URLSearchParams(location.search).get('passo');
  if (pid && DB.passi.some((x) => x.id === pid)) { DB.currentId = pid; go(true); } else go(false);

})();
