/* ============================================================
   ANALISI DEL TESTO — Interpretazione guidata (Fase 3)
   Traduce in foglio di lavoro la "Scheda analitica per
   l'interpretazione guidata": 5 sezioni di campi mirati, alcuni
   a righe dinamiche, che culminano nella TESI dell'analisi.

   Tipi di campo (`type`):
     text   → area di testo (big? = alta)
     choice → opzioni a pulsanti + nota (scelta secca + commento)
     tags   → fino a `max` parole-chiave
     list   → righe dinamiche con colonne (`cols`), importabili
              dalle annotazioni (`importa`)
   `auto:'meta'` precompila dai metadati del passo.
   Caricato come script globale → window.AT_INTERPRETAZIONE.
   ============================================================ */
(function (global) {
  'use strict';

  const SEZIONI = [
    {
      id: 'identikit', n: 1, icona: '📋',
      nome: 'Identikit e costituzione del testo',
      sotto: 'Livello 0',
      intro: 'Prima di leggere, colloca: chi scrive, quando, in che forma. Sono le coordinate che impediscono di smarrirsi nel testo.',
      fonti: [],
      campi: [
        { id: 'autoreOpera', type: 'text', label: 'Autore, opera, luogo', auto: 'meta', prompt: 'Autore, titolo, libro/carme/canto, versi o paragrafi.' },
        { id: 'datazione', type: 'text', label: 'Datazione e fase biografica', prompt: "Opera della giovinezza, dell'esilio, post-trauma storico…" },
        { id: 'genere', type: 'text', label: "Genere e orizzonte d'attesa", prompt: 'Quali regole del genere sono qui rispettate o violate?' },
        { id: 'filologia', type: 'text', label: 'Nota filologica / stato del testo', prompt: "Classici: varianti in apparato, congetture famose. Moderni: varianti d'autore tra le edizioni." },
      ],
    },
    {
      id: 'letterale', n: 2, icona: '✍️',
      nome: 'Decodifica letterale e architettura sintattica',
      intro: 'Assicurati di aver capito alla lettera, prima di interpretare: sciogli i nodi della sintassi e di\' in prosa piana ciò che il verso dice per vie traverse.',
      fonti: ['semantica'],
      campi: [
        { id: 'parafrasi', type: 'text', big: true, label: "Parafrasi / traduzione d'autore", prompt: "Ripristina l'ordine logico Soggetto-Verbo-Oggetto; sciogli le metafore solo a livello letterale." },
        {
          id: 'costruzione', type: 'choice', label: 'Architettura sintattica', nota: true,
          prompt: 'Prevale la subordinazione o la coordinazione?',
          options: [
            { id: 'ipotassi', nome: 'Ipotassi', descr: 'Subordinate complesse, stile solenne/riflessivo.' },
            { id: 'paratassi', nome: 'Paratassi', descr: 'Frasi brevi e coordinate, stile concitato/frammentato.' },
            { id: 'mista', nome: 'Mista', descr: 'Alternanza significativa dei due regimi.' },
          ],
        },
        { id: 'anomalie', type: 'text', label: 'Anomalie della parola', prompt: 'Iperbati, anastrofi, enallagi; usi particolari di modi e tempi (presente storico, ottativo obliquo, infinito narrativo).' },
      ],
    },
    {
      id: 'formale', n: 3, icona: '🎧',
      nome: 'Involucro formale: metrica, fonica e ritmo',
      intro: 'Ascolta l\'involucro — metro, suono, ritmo. È la cassa armonica in cui il significato risuona, e spesso lo tradisce prima ancora delle parole.',
      fonti: ['retorica:metrica', 'retorica:suono', 'retorica:sintassi'],
      campi: [
        { id: 'metrica', type: 'text', label: 'Struttura metrica', prompt: 'Es. esametri dattilici, endecasillabi sciolti, strofa saffica.' },
        {
          id: 'enjambement', type: 'list', label: 'Mappatura degli enjambement',
          prompt: 'Dove la frase scavalca il verso: quali parole restano isolate e in evidenza?',
          importa: { fonte: 'retorica:sintassi', voci: ['Enjambement'] },
          cols: [
            { id: 'verso', label: 'Verso X / Verso Y', type: 'text' },
            { id: 'parole', label: 'Parole isolate / effetto', type: 'text' },
          ],
        },
        { id: 'cesure', type: 'text', label: 'Cesure e ritmo', prompt: 'Dove cadono le pause principali? Il ritmo è fluido o spezzato?' },
        { id: 'fonica', type: 'text', label: 'Tessuto fonico ed effetto', prompt: 'Quali suoni dominano (consonanti aspre, vocalismo cupo, liquide)? Che rapporto tra suono e sentimento?' },
      ],
    },
    {
      id: 'retorico', n: 4, icona: '🎭',
      nome: 'Smontaggio retorico e rete intertestuale',
      intro: 'Smonta i meccanismi e segui i fili che legano il passo ad altri testi: qui la forma confessa la sua intenzione.',
      fonti: ['retorica:significato', 'retorica:pensiero', 'ipertesto'],
      campi: [
        { id: 'posizione', type: 'text', label: 'Figure di posizione', prompt: 'Chiasmi, parallelismi, climax: individua le simmetrie geometriche del testo.' },
        {
          id: 'tropi', type: 'list', label: 'Tropi — Veicolo → Tenore',
          prompt: "Per ogni figura di significato: l'immagine usata (veicolo) e il concetto reale (tenore).",
          importa: { fonte: 'retorica:significato' },
          cols: [
            { id: 'veicolo', label: 'Veicolo (immagine)', type: 'text' },
            { id: 'tenore', label: 'Tenore (concetto)', type: 'text' },
          ],
        },
        {
          id: 'intertesti', type: 'list', label: 'La memoria del testo (intertestualità)',
          prompt: 'Quali testi archetipici riecheggiano? Con quale strategia di ripresa?',
          importa: { fonte: 'ipertesto' },
          cols: [
            { id: 'testo', label: 'Testo / modello', type: 'text' },
            { id: 'strategia', label: 'Strategia', type: 'choice', options: [
              { id: 'imitazione', nome: 'Imitazione' },
              { id: 'variatio', nome: 'Variatio' },
              { id: 'oppositio', nome: 'Oppositio' },
            ] },
          ],
        },
      ],
    },
    {
      id: 'ermeneutica', n: 5, icona: '🧠',
      nome: 'Ermeneutica, antropologia e sintesi critica',
      intro: 'Tira le fila, dai dati raccolti alla tesi: dimostra che quella forma era l\'unica veste possibile per quel contenuto.',
      fonti: ['semantica:tema', 'semantica:campo', 'pragmatica', 'ipertesto'],
      campi: [
        { id: 'paroleChiave', type: 'tags', max: 3, label: 'Le 3 parole-chiave concettuali', prompt: 'I tre concetti portanti del passo. Premi Invio.' },
        { id: 'nucleo', type: 'text', label: 'Nucleo filosofico/ideologico (Weltanschauung)', prompt: 'La visione del mondo che il brano esprime o presuppone.' },
        { id: 'antropologia', type: 'text', label: 'Filtro antropologico', prompt: "Quali categorie mentali dell'epoca servono per capire il testo? (pietas, hybris, vergogna arcaica, angoscia novecentesca…). Evita l'anacronismo." },
        { id: 'sintesi', type: 'text', big: true, tesi: true, label: 'Sintesi critica — la tesi dell\'analisi', prompt: 'Collega i dati formali (sez. 2-3-4) al significato profondo (sez. 5): dimostra come la forma sia l\'unica veste possibile di quel preciso contenuto.' },
      ],
    },
  ];

  const CONSIGLIO = 'Usa la scheda per raccogliere i dati, poi esponi seguendo il testo linearmente — un blocco di versi o di capitolo alla volta — inserendo le osservazioni metriche, filologiche e retoriche nel momento esatto in cui servono a spiegare il significato di quella riga. Non procedere "a compartimenti stagni".';

  /* Deduce la strategia di ripresa da un'annotazione ipertestuale */
  function strategiaDaIpertesto(ann) {
    const ip = ann.ipertesto || {};
    if (ip.postura === 'distanziamento' || ['parodia', 'travestimento'].indexOf(ip.pratica) >= 0) return 'oppositio';
    if (ip.modo === 'imitatio' || ['pastiche', 'continuazione'].indexOf(ip.pratica) >= 0) return 'imitazione';
    if (ip.modo === 'aemulatio' || ip.pratica === 'trasposizione' || ip.pratica === 'charge') return 'variatio';
    return '';
  }

  /* Mappa un'annotazione su una riga di lista, per l'import */
  function rigaDaAnnotazione(campoId, ann) {
    const quote = ann.refType === 'span' && ann.quote ? ann.quote.replace(/\s+/g, ' ').trim() : '';
    if (campoId === 'enjambement') return { verso: ann.refManuale || '', parole: quote || ann.commento || '' };
    if (campoId === 'tropi') return { veicolo: quote || ann.voce || '', tenore: ann.commento || '' };
    if (campoId === 'intertesti') {
      let testo = '';
      if (ann.rimando) testo = ann.rimando.libero || '';
      return { testo: testo, strategia: strategiaDaIpertesto(ann) };
    }
    return {};
  }

  global.AT_INTERPRETAZIONE = {
    SEZIONI: SEZIONI,
    CONSIGLIO: CONSIGLIO,
    strategiaDaIpertesto: strategiaDaIpertesto,
    rigaDaAnnotazione: rigaDaAnnotazione,
    versione: '1.0',
  };

})(typeof window !== 'undefined' ? window : this);
