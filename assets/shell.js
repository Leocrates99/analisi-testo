/* ============================================================
   ANALISI DEL TESTO — Shell condivisa
   Barra unica su tutte le fasi: cambio-fase che PORTA CON SÉ il
   passo (?passo=ID), tema chiaro/scuro globale, e menù Esporta
   unificato (il "documento" del passo, da AT_DOSSIER).
   Caricata su ogni pagina PRIMA della logica di pagina, così
   AT_SHELL.setPasso() è disponibile durante l'init.
   ============================================================ */
(function (global) {
  'use strict';

  const STORE_KEY = 'analisitesto.db.v1';
  const THEME_KEY = 'analisitesto.theme';
  const PHASES = [
    { id: 'analisi', file: 'analisi.html', nome: 'Analisi' },
    { id: 'commento', file: 'commento.html', nome: 'Commento' },
    { id: 'interpretazione', file: 'interpretazione.html', nome: 'Interpretazione' },
    { id: 'ricezione', file: 'ricezione.html', nome: 'Ricezione' },
  ];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function currentPhase() {
    const f = (location.pathname.split('/').pop() || '').toLowerCase();
    const ph = PHASES.find((p) => f.indexOf(p.id) >= 0);
    return ph ? ph.id : 'analisi';
  }
  function readDB() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { passi: [] }; } catch (e) { return { passi: [] }; } }
  function getPasso(id) { const db = readDB(); return (db.passi || []).find((p) => p.id === id) || null; }
  let passoId = new URLSearchParams(location.search).get('passo') || null;

  function toast(m) { const t = document.getElementById('toast'); if (!t) { alert(m); return; } t.textContent = m; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2000); }

  /* ── Tema chiaro/scuro globale ────────────────────────────── */
  function applyTheme(t) { document.documentElement.setAttribute('data-theme', t); }
  function initTheme() { let t = 'light'; try { t = localStorage.getItem(THEME_KEY) || 'light'; } catch (e) {} applyTheme(t); }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(cur); try { localStorage.setItem(THEME_KEY, cur); } catch (e) {}
    const b = document.getElementById('shellTheme'); if (b) b.textContent = cur === 'dark' ? '☀' : '◐';
  }

  /* ── Export (documento del passo) ─────────────────────────── */
  function withDossier(fn) { const p = getPasso(passoId); if (!p) { toast('Apri un passo per esportarlo'); return; } if (!global.AT_DOSSIER) { toast('Modulo dossier non caricato'); return; } fn(global.AT_DOSSIER, p); }
  function bindExportMenu(root) {
    root.querySelectorAll('[data-x]').forEach((b) => b.onclick = () => {
      const x = b.dataset.x;
      root.removeAttribute('open');
      withDossier((D, p) => {
        if (x === 'pdf') { D.openPrint(p); toast('Dossier: stampa o salva in PDF'); }
        else if (x === 'md') { D.downloadMd(p); toast('Dossier Markdown scaricato'); }
        else if (x === 'copy') { D.copyMarkdown(p).then(() => toast('Dossier copiato negli appunti')).catch(() => toast('Copia non riuscita')); }
        else if (x === 'json') { D.downloadJson(p); toast('Dati del passo scaricati'); }
      });
    });
  }

  /* ── Rendering della barra ────────────────────────────────── */
  function renderActions() {
    const actions = document.querySelector('.topbar .actions');
    if (!actions || document.getElementById('shellTheme')) return;
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const exp = document.createElement('details');
    exp.className = 'shell-export'; exp.id = 'shellExport';
    exp.innerHTML = '<summary class="btn ghost sm">Esporta ▾</summary>'
      + '<div class="shell-menu">'
      + '<button data-x="pdf">Dossier — stampa / PDF</button>'
      + '<button data-x="md">Dossier — Markdown (.md)</button>'
      + '<button data-x="copy">Copia dossier (Markdown)</button>'
      + '<hr><button data-x="json">Dati del passo (.json)</button>'
      + '</div>';
    const theme = document.createElement('button');
    theme.className = 'btn ghost sm'; theme.id = 'shellTheme'; theme.title = 'Tema chiaro/scuro'; theme.setAttribute('aria-label', 'Tema chiaro o scuro');
    theme.textContent = dark ? '☀' : '◐';
    theme.onclick = toggleTheme;
    actions.insertBefore(exp, actions.firstChild);
    actions.insertBefore(theme, actions.firstChild);
    bindExportMenu(exp);
    document.addEventListener('click', (e) => { if (!exp.contains(e.target)) exp.removeAttribute('open'); });
  }

  function renderPhasebar() {
    let bar = document.getElementById('shellPhasebar');
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    const p = passoId ? getPasso(passoId) : null;
    const exp = document.getElementById('shellExport');
    if (exp) exp.style.display = p ? '' : 'none';
    if (!p) { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement('div'); bar.id = 'shellPhasebar'; bar.className = 'shell-phasebar'; topbar.insertAdjacentElement('afterend', bar); }
    const cur = currentPhase();
    const titolo = (p.autore ? p.autore + ' · ' : '') + (p.titolo || p.opera || 'passo');
    bar.innerHTML = '<span class="sp-doc" title="' + esc(titolo) + '"><i>❦</i> ' + esc(titolo) + '</span>'
      + '<nav class="sp-tabs">' + PHASES.map((ph) =>
        ph.id === cur
          ? '<span class="sp-tab active">' + esc(ph.nome) + '</span>'
          : '<a class="sp-tab" href="' + ph.file + '?passo=' + encodeURIComponent(p.id) + '">' + esc(ph.nome) + '</a>'
      ).join('') + '</nav>';
  }

  /* ── API pubblica ─────────────────────────────────────────── */
  function setPasso(id) {
    passoId = id || null;
    const url = new URL(location.href);
    if (passoId) url.searchParams.set('passo', passoId); else url.searchParams.delete('passo');
    history.replaceState(null, '', url);
    renderPhasebar();
  }

  initTheme();
  function boot() { renderActions(); renderPhasebar(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  global.AT_SHELL = { setPasso: setPasso, toggleTheme: toggleTheme, currentPhase: currentPhase };

})(typeof window !== 'undefined' ? window : this);
