/* ============================================================
   ANALISI DEL TESTO — Ricezione (Fase 4)
   Spettro emotivo del testo: ogni lettore accende le emozioni
   suscitate dal brano (intensità 0–4); dalla somma emerge il
   profilo affettivo dell'opera — con la sua DISPERSIONE.

   Tassonomia tarata sulla ricezione estetica (14 emozioni in
   4 famiglie, con valenza). `riepilogo()` calcola media, scarto,
   densità, tono e concordanza: lo usano la pagina Ricezione,
   il Dossier e l'Interpretazione.
   ============================================================ */
(function (global) {
  'use strict';

  // 14 emozioni in cerchio. v = valenza (luminoso ↔ cupo).
  // Le "Velate" hanno valenza lievemente negativa (rispetto allo
  // 0 originario) perché malinconia/nostalgia/spaesamento non sono neutre.
  const EMO = [
    { n: 'Gioia',        f: 'Luminose',  c: '#E0A21A', v: 1 },
    { n: 'Slancio',      f: 'Luminose',  c: '#EF9A3C', v: 1 },
    { n: 'Meraviglia',   f: 'Luminose',  c: '#E86F4E', v: 1 },
    { n: 'Fascino',      f: 'Estetiche', c: '#DE5C7C', v: 1 },
    { n: 'Tenerezza',    f: 'Estetiche', c: '#C76BB4', v: 1 },
    { n: 'Commozione',   f: 'Estetiche', c: '#9A6FD0', v: 1 },
    { n: 'Sublime',      f: 'Estetiche', c: '#7A6FD6', v: 1 },
    { n: 'Nostalgia',    f: 'Velate',    c: '#5E80CF', v: -0.5 },
    { n: 'Malinconia',   f: 'Velate',    c: '#4F93C4', v: -0.5 },
    { n: 'Spaesamento',  f: 'Velate',    c: '#8FA0AE', v: -0.5 },
    { n: 'Inquietudine', f: 'Oscure',    c: '#3E9D9B', v: -1 },
    { n: 'Sgomento',     f: 'Oscure',    c: '#2E7E78', v: -1 },
    { n: 'Sdegno',       f: 'Oscure',    c: '#C0492F', v: -1 },
    { n: 'Repulsione',   f: 'Oscure',    c: '#6E7C4A', v: -1 },
  ];
  const FAMILIES = ['Luminose', 'Estetiche', 'Velate', 'Oscure'];
  const FAM = { Luminose: '#EF9A3C', Estetiche: '#9A6FD0', Velate: '#5E80CF', Oscure: '#2E7E78' };
  const LEVELS = ['assente', 'accenno', 'presente', 'forte', 'travolgente'];
  const N = EMO.length;

  // Sintesi statistica di un insieme di letture (array di {vals:[14]}).
  function riepilogo(letture) {
    const n = letture ? letture.length : 0;
    if (!n) return null;
    const mean = new Array(N).fill(0), sd = new Array(N).fill(0);
    letture.forEach((l) => l.vals.forEach((x, i) => { mean[i] += x; }));
    for (let i = 0; i < N; i++) mean[i] /= n;
    letture.forEach((l) => l.vals.forEach((x, i) => { sd[i] += (x - mean[i]) * (x - mean[i]); }));
    for (let i = 0; i < N; i++) sd[i] = Math.sqrt(sd[i] / n);

    const density = mean.reduce((a, b) => a + b, 0) / N;
    const famSum = {}; FAMILIES.forEach((f) => { famSum[f] = 0; });
    mean.forEach((v, i) => { famSum[EMO[i].f] += v; });
    let famDom = '—', best = -1;
    FAMILIES.forEach((f) => { if (famSum[f] > best) { best = famSum[f]; famDom = f; } });
    if (best <= 0) famDom = '—';

    const tone = mean.reduce((a, v, i) => a + v * EMO[i].v, 0);
    let toneLbl = '—';
    if (best > 0) toneLbl = tone > 1.2 ? 'luminoso' : (tone < -1.2 ? 'cupo' : 'in chiaroscuro');

    const dominant = mean.map((v, i) => ({ v: v, i: i })).filter((o) => o.v > 0.001).sort((a, b) => b.v - a.v).slice(0, 3);

    // scarto medio sulle sole emozioni attive (altrimenti i molti zeri
    // unanimi diluiscono il disaccordo su ciò che conta)
    const attive = mean.map((m, i) => ({ m: m, i: i })).filter((o) => o.m > 0.25);
    const avgSd = attive.length ? attive.reduce((a, o) => a + sd[o.i], 0) / attive.length : 0;
    let concordanzaLbl;
    if (avgSd < 0.55) concordanzaLbl = 'la classe converge';
    else if (avgSd < 1.05) concordanzaLbl = 'sfumature diverse';
    else concordanzaLbl = 'letture divise';

    return { n: n, mean: mean, sd: sd, density: density, famDom: famDom, tone: tone, toneLbl: toneLbl, dominant: dominant, avgSd: avgSd, concordanzaLbl: concordanzaLbl };
  }

  global.AT_RICEZIONE = {
    EMO: EMO, FAMILIES: FAMILIES, FAM: FAM, LEVELS: LEVELS, N: N,
    riepilogo: riepilogo,
    versione: '1.0',
  };

})(typeof window !== 'undefined' ? window : this);
