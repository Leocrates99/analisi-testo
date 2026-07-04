/* ============================================================
   ANALISI DEL TESTO — Dossier condiviso (gestione del documento)
   Fonde testo + annotazioni + commento + interpretazione +
   ricezione di un passo in un unico documento, in tre formati:
     · HTML stampabile → PDF dal browser
     · Markdown (download o copia negli appunti)
     · JSON (dati grezzi del passo)
   Usato dalla barra di export condivisa (shell) e dall'Analisi.
   ============================================================ */
(function (global) {
  'use strict';

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function T() { return global.AT_TASSONOMIA; }

  /* ── HTML stampabile ─────────────────────────────────────── */
  function html(p) {
    const Tx = T(), C = global.AT_COMMENTO, I = global.AT_INTERPRETAZIONE, RIC = global.AT_RICEZIONE;
    const lin = (Tx.LINGUE.find((g) => g.id === p.lingua) || {}).nome || '';
    const gen = (Tx.GENERI.find((g) => g.id === p.genere) || {}).nome || '';
    let testoHtml = '';
    if (p.testo) {
      const lines = p.testo.split('\n');
      testoHtml = `<div class="d-testo${p.genere === 'poesia' ? ' poesia' : ''}">`
        + lines.map((l) => `<div class="d-verso">${esc(l) || '&nbsp;'}</div>`).join('') + '</div>';
    }
    let annHtml = '';
    Tx.LIVELLI.forEach((lv) => {
      const sub = (p.annotazioni || []).filter((a) => a.livello === lv.id);
      if (!sub.length) return;
      annHtml += `<h3 class="d-lv lv-${lv.colore}">${esc(lv.nome)}</h3>`;
      const byCat = {}; sub.forEach((a) => { (byCat[a.categoria] = byCat[a.categoria] || []).push(a); });
      Object.keys(byCat).forEach((catId) => {
        const cat = Tx.getCategoria(lv.id, catId);
        annHtml += `<div class="d-cat">${esc(cat ? cat.nome : catId)}</div>`;
        byCat[catId].forEach((a) => {
          const imp = (Tx.getImportanza(a.importanza) || {}).nome || '';
          const ref = a.refType === 'span' && a.quote ? '«' + a.quote.replace(/\s+/g, ' ').trim() + '»' : (a.refManuale || '');
          let extra = '';
          if (a.livello === 'ipertesto') {
            const bits = [];
            if (a.rimando && a.rimando.libero) bits.push('↪ ' + a.rimando.libero);
            const lett = Tx.letturaRapporto((a.ipertesto || {}).visibilita, (a.ipertesto || {}).postura);
            if (lett) bits.push(lett);
            if (bits.length) extra = ' — ' + bits.join(' · ');
          }
          const tags = (a.tags || []).length ? ' [' + a.tags.join(', ') + ']' : '';
          annHtml += `<p class="d-ann"><span class="d-imp imp-${a.importanza}">${esc(imp)}</span> ${ref ? '<i>' + esc(ref) + '</i> — ' : ''}${a.voce ? '<b>' + esc(a.voce) + '</b>: ' : ''}${esc((a.commento || '') + extra + tags)}</p>`;
        });
      });
    });
    let comHtml = '';
    if (C && p.commento && p.commento.campi) {
      C.getProtocollo(p.commento.modo).fasi.forEach((f) => {
        const bl = f.campi.map((cmp) => { const v = (p.commento.campi[f.id + '.' + cmp.id] || '').trim(); return v ? `<p class="d-field"><b>${esc(cmp.label)}.</b> ${esc(v)}</p>` : ''; }).filter(Boolean);
        if (bl.length) comHtml += `<h3>${f.n}. ${esc(f.nome)}</h3>` + bl.join('');
      });
    }
    let intHtml = '';
    if (I && p.interpretazione && p.interpretazione.dati) {
      const d = p.interpretazione.dati;
      I.SEZIONI.forEach((sez) => {
        const bl = [];
        sez.campi.forEach((c) => {
          const v = d[sez.id + '.' + c.id];
          if (c.type === 'text') { if (v && v.trim()) bl.push(`<p class="d-field"><b>${esc(c.label)}.</b> ${esc(v.trim())}</p>`); }
          else if (c.type === 'choice') { if (v && (v.scelta || (v.nota || '').trim())) { const o = c.options.find((x) => x.id === v.scelta); bl.push(`<p class="d-field"><b>${esc(c.label)}:</b> ${esc([(o ? o.nome : ''), (v.nota || '').trim()].filter(Boolean).join(' — '))}</p>`); } }
          else if (c.type === 'tags') { if (v && v.length) bl.push(`<p class="d-field"><b>${esc(c.label)}:</b> ${esc(v.join(' · '))}</p>`); }
          else if (c.type === 'list') { const rows = (v || []).filter((r) => Object.keys(r).some((k) => r[k] && String(r[k]).trim())); if (rows.length) { const items = rows.map((r) => { const vals = c.cols.map((col) => { if (col.type === 'choice') { const o = col.options.find((x) => x.id === r[col.id]); return o ? o.nome : ''; } return r[col.id] || ''; }); return '<li>' + esc(vals.filter(Boolean).join(' → ')) + '</li>'; }); bl.push(`<p class="d-field"><b>${esc(c.label)}:</b></p><ul>${items.join('')}</ul>`); } }
        });
        if (bl.length) intHtml += `<h3>${sez.icona || ''} ${esc(sez.nome)}</h3>` + bl.join('');
      });
    }
    let ricHtml = '';
    if (RIC && p.ricezione && p.ricezione.letture && p.ricezione.letture.length) {
      const rip = RIC.riepilogo(p.ricezione.letture);
      ricHtml += `<p class="d-field">Profilo affettivo da <b>${rip.n}</b> letture · densità <b>${rip.density.toFixed(2)}/4</b> · famiglia dominante <b>${esc(rip.famDom)}</b> · tono <b>${esc(rip.toneLbl)}</b> · ${esc(rip.concordanzaLbl)} (scarto medio ${rip.avgSd.toFixed(2)}).</p>`;
      ricHtml += '<p class="d-field"><b>Emozioni predominanti:</b></p><ul>'
        + rip.dominant.map((o) => `<li>${esc(RIC.EMO[o.i].n)} — ${o.v.toFixed(o.v % 1 ? 1 : 0)}/4 <span style="color:#888">(±${rip.sd[o.i].toFixed(1)})</span></li>`).join('') + '</ul>';
    }
    const css = ':root{--retorica:#1800AC;--semantica:#2f855a;--pragmatica:#2b6cb0;--ipertesto:#9c6b3c;--ink:#2c3539;--sepia:#6b6660;--rule:#d5d2cb;}'
      + '*{box-sizing:border-box}body{font-family:Georgia,"Times New Roman",serif;color:var(--ink);line-height:1.6;margin:0;background:#f5f4f0}'
      + 'article{max-width:760px;margin:0 auto;background:#fff;padding:48px 56px}'
      + 'header{border-bottom:2px solid var(--rule);padding-bottom:16px;margin-bottom:24px}'
      + '.d-author{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--sepia)}'
      + 'h1{font-size:30px;color:#1800AC;margin:6px 0}.d-sub{font-style:italic;color:var(--sepia)}'
      + 'h2{font-size:20px;color:#1800AC;border-bottom:1px solid var(--rule);padding-bottom:4px;margin:28px 0 12px}'
      + 'h3{font-size:15px;margin:16px 0 6px}.d-lv{font-variant:small-caps;letter-spacing:.03em}'
      + '.d-lv.lv-retorica{color:var(--retorica)}.d-lv.lv-semantica{color:var(--semantica)}.d-lv.lv-pragmatica{color:var(--pragmatica)}.d-lv.lv-ipertesto{color:var(--ipertesto)}'
      + '.d-cat{font-size:12px;font-weight:bold;color:var(--sepia);text-transform:uppercase;letter-spacing:.04em;margin:10px 0 2px}'
      + '.d-ann{margin:4px 0 4px 0;font-size:15px}.d-imp{font-size:10px;font-weight:bold;color:#fff;padding:1px 6px;border-radius:3px;vertical-align:middle}'
      + '.imp-chiave{background:#c53030}.imp-rilevante{background:#d69e2e}.imp-accessoria{background:#8a857d}'
      + '.d-testo{white-space:pre-wrap;background:#fcfbf8;border:1px solid var(--rule);border-radius:6px;padding:18px 22px;font-size:16px}'
      + '.d-testo.poesia{counter-reset:v}.d-testo.poesia .d-verso{position:relative;padding-left:2.4em}'
      + '.d-testo.poesia .d-verso:before{counter-increment:v;content:counter(v);position:absolute;left:0;width:1.8em;text-align:right;font-size:11px;color:#bbb}'
      + '.d-field{margin:4px 0;font-size:15px}ul{margin:2px 0 8px;padding-left:22px}'
      + '.d-bar{position:sticky;top:0;background:#1800AC;padding:10px;text-align:center;display:flex;gap:8px;justify-content:center}'
      + '.d-bar button{font:600 14px sans-serif;padding:8px 18px;border:none;border-radius:5px;background:#fff;color:#1800AC;cursor:pointer}'
      + '@media print{.d-bar{display:none}body{background:#fff}article{padding:0;max-width:none}}';
    return '<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><title>Dossier — ' + esc(p.titolo || 'passo') + '</title><style>' + css + '</style></head><body>'
      + '<div class="d-bar"><button onclick="window.print()">Stampa / Salva come PDF</button></div>'
      + '<article><header><div class="d-author">' + esc(p.autore || '') + '</div><h1>' + esc(p.titolo || 'Senza titolo') + '</h1><div class="d-sub">' + esc([p.opera, gen, lin].filter(Boolean).join(' · ')) + '</div></header>'
      + (testoHtml ? '<section><h2>Il testo</h2>' + testoHtml + '</section>' : '')
      + (annHtml ? '<section><h2>Annotazioni</h2>' + annHtml + '</section>' : '')
      + (comHtml ? '<section><h2>Commento</h2>' + comHtml + '</section>' : '')
      + (intHtml ? '<section><h2>Interpretazione</h2>' + intHtml + '</section>' : '')
      + (ricHtml ? '<section><h2>Ricezione</h2>' + ricHtml + '</section>' : '')
      + '</article></body></html>';
  }

  /* ── Markdown (per saggio universitario, copia/incolla) ──── */
  function markdown(p) {
    const Tx = T(), C = global.AT_COMMENTO, I = global.AT_INTERPRETAZIONE, RIC = global.AT_RICEZIONE;
    const gen = (Tx.GENERI.find((g) => g.id === p.genere) || {}).nome || '';
    const lin = (Tx.LINGUE.find((g) => g.id === p.lingua) || {}).nome || '';
    let md = '# ' + (p.titolo || 'Passo') + '\n_' + [p.autore, p.opera, gen, lin].filter(Boolean).join(' · ') + '_\n\n';
    if (p.testo) md += '## Il testo\n\n> ' + p.testo.split('\n').join('\n> ') + '\n\n';
    let ann = '';
    Tx.LIVELLI.forEach((lv) => {
      const sub = (p.annotazioni || []).filter((a) => a.livello === lv.id);
      if (!sub.length) return;
      ann += '### ' + lv.nome + '\n\n';
      sub.forEach((a) => {
        const cat = Tx.getCategoria(lv.id, a.categoria);
        const ref = a.refType === 'span' && a.quote ? '«' + a.quote.replace(/\s+/g, ' ').trim() + '»' : (a.refManuale || '');
        const parts = [(Tx.getImportanza(a.importanza) || {}).nome, cat ? cat.nome : '', a.voce, ref].filter(Boolean);
        let extra = '';
        if (a.livello === 'ipertesto' && a.rimando && a.rimando.libero) extra = ' ↪ ' + a.rimando.libero;
        ann += '- **' + parts.join(' · ') + '** — ' + (a.commento || '') + extra + '\n';
      });
      ann += '\n';
    });
    if (ann) md += '## Annotazioni\n\n' + ann;
    if (C && p.commento && p.commento.campi) {
      let com = '';
      C.getProtocollo(p.commento.modo).fasi.forEach((f) => {
        const bl = f.campi.map((cmp) => { const v = (p.commento.campi[f.id + '.' + cmp.id] || '').trim(); return v ? '**' + cmp.label + '.** ' + v : ''; }).filter(Boolean);
        if (bl.length) com += '### ' + f.n + '. ' + f.nome + '\n\n' + bl.join('\n\n') + '\n\n';
      });
      if (com) md += '## Commento\n\n' + com;
    }
    if (I && p.interpretazione && p.interpretazione.dati) {
      const d = p.interpretazione.dati; let int = '';
      I.SEZIONI.forEach((sez) => {
        const bl = [];
        sez.campi.forEach((c) => {
          const v = d[sez.id + '.' + c.id];
          if (c.type === 'text') { if (v && v.trim()) bl.push('**' + c.label + '.** ' + v.trim()); }
          else if (c.type === 'choice') { if (v && (v.scelta || (v.nota || '').trim())) { const o = c.options.find((x) => x.id === v.scelta); bl.push('**' + c.label + ':** ' + [(o ? o.nome : ''), (v.nota || '').trim()].filter(Boolean).join(' — ')); } }
          else if (c.type === 'tags') { if (v && v.length) bl.push('**' + c.label + ':** ' + v.join(' · ')); }
          else if (c.type === 'list') { const rows = (v || []).filter((r) => Object.keys(r).some((k) => r[k] && String(r[k]).trim())); if (rows.length) bl.push('**' + c.label + ':**\n' + rows.map((r) => '- ' + c.cols.map((col) => { if (col.type === 'choice') { const o = col.options.find((x) => x.id === r[col.id]); return o ? o.nome : ''; } return r[col.id] || ''; }).filter(Boolean).join(' → ')).join('\n')); }
        });
        if (bl.length) int += '### ' + sez.nome + '\n\n' + bl.join('\n\n') + '\n\n';
      });
      if (int) md += '## Interpretazione\n\n' + int;
    }
    if (RIC && p.ricezione && p.ricezione.letture && p.ricezione.letture.length) {
      const rip = RIC.riepilogo(p.ricezione.letture);
      md += '## Ricezione\n\nProfilo da ' + rip.n + ' letture · densità ' + rip.density.toFixed(2) + '/4 · famiglia ' + rip.famDom + ' · tono ' + rip.toneLbl + ' · ' + rip.concordanzaLbl + '.\n\n'
        + 'Emozioni predominanti: ' + rip.dominant.map((o) => RIC.EMO[o.i].n + ' ' + o.v.toFixed(o.v % 1 ? 1 : 0) + '/4').join(' · ') + '.\n\n';
    }
    return md.trim() + '\n';
  }

  function slug(p) { return (p.titolo || 'passo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function dl(text, mime, name) {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function openPrint(p) {
    const blob = new Blob([html(p)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = global.open(url, '_blank');
    if (!w) dl(html(p), 'text/html', 'dossier-' + slug(p) + '.html');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  function downloadMd(p) { dl(markdown(p), 'text/markdown', 'dossier-' + slug(p) + '.md'); }
  function downloadJson(p) { dl(JSON.stringify({ passi: [p], _single: true }, null, 2), 'application/json', 'analisi-' + slug(p) + '.json'); }
  function copyMarkdown(p) {
    const t = markdown(p);
    if (global.navigator && navigator.clipboard) return navigator.clipboard.writeText(t);
    return Promise.reject();
  }

  global.AT_DOSSIER = { html: html, markdown: markdown, openPrint: openPrint, downloadMd: downloadMd, downloadJson: downloadJson, copyMarkdown: copyMarkdown };

})(typeof window !== 'undefined' ? window : this);
