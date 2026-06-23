/* ============================================================
   ANALISI DEL TESTO — Tassonomia dei livelli di analisi
   Strumento di Digital Humanities per il testo letterario
   (poesia e prosa), livello liceale e universitario.

   Questo file è il "cuore intellettuale" dello strumento:
   definisce i quattro layer di analisi, le loro categorie e
   il repertorio di voci (figure retoriche, sfere semantiche,
   funzioni comunicative, tipi di rimando ipertestuale) con
   brevi definizioni usate nei tooltip.

   È pensato per essere ESPANSO: basta aggiungere voci agli
   array `voci` o nuove categorie. Caricato come script globale
   (niente ES-module) per funzionare anche da file:// offline.
   ============================================================ */
(function (global) {
  'use strict';

  /* ── Livelli di importanza (per il raggruppamento) ─────────── */
  const IMPORTANZE = [
    { id: 'chiave',     nome: 'Chiave',     sigla: 'I', descr: 'Evidenza essenziale, snodo interpretativo del passo.' },
    { id: 'rilevante',  nome: 'Rilevante',  sigla: 'II', descr: 'Tratto significativo, da tenere presente nel commento.' },
    { id: 'accessoria', nome: 'Spunto',     sigla: 'III', descr: 'Osservazione accessoria o pista da verificare.' },
  ];

  /* ── Generi e lingue ──────────────────────────────────────── */
  const GENERI = [
    { id: 'poesia', nome: 'Poesia',  descr: 'Testo in versi: si numera per versi.' },
    { id: 'prosa',  nome: 'Prosa',   descr: 'Testo in prosa: si segmenta per righi/capoversi.' },
    { id: 'teatro', nome: 'Teatro',  descr: 'Testo drammatico: battute e didascalie.' },
  ];

  const LINGUE = [
    { id: 'it', nome: 'Italiano' },
    { id: 'la', nome: 'Latino' },
    { id: 'gr', nome: 'Greco antico' },
    { id: 'altro', nome: 'Altra lingua' },
  ];

  /* ── I QUATTRO LIVELLI DI ANALISI ─────────────────────────── */
  const LIVELLI = [

    /* ===== 1. STILISTICO-RETORICA ============================ */
    {
      id: 'retorica',
      nome: 'Stilistico-retorica',
      breve: 'Stile e figure',
      colore: 'retorica',
      descr: 'Come è costruito il testo: figure retoriche, stile, sintassi, ritmo e metrica.',
      categorie: [
        {
          id: 'suono', nome: 'Figure di suono',
          descr: 'Effetti fonici e ripetizioni di suoni.',
          voci: [
            { nome: 'Allitterazione', def: 'Ripetizione degli stessi suoni (spec. consonantici) a inizio o interno di parole vicine.' },
            { nome: 'Assonanza', def: 'Identità delle vocali a partire dalla tonica, con consonanti diverse.' },
            { nome: 'Consonanza', def: 'Identità delle consonanti finali con vocali diverse.' },
            { nome: 'Onomatopea', def: 'Parola o nesso che riproduce un suono reale.' },
            { nome: 'Paronomasia', def: 'Accostamento di parole foneticamente simili ma di senso diverso.' },
            { nome: 'Figura etimologica', def: 'Accostamento di parole della stessa radice (es. vivere la vita).' },
          ],
        },
        {
          id: 'ordine', nome: "Figure d'ordine e posizione",
          descr: 'Disposizione e ripetizione degli elementi nella frase e nel verso.',
          voci: [
            { nome: 'Anafora', def: 'Ripetizione di una o più parole a inizio di versi/frasi successive.' },
            { nome: 'Epifora', def: 'Ripetizione di parole alla fine di versi/frasi successive.' },
            { nome: 'Anastrofe', def: "Inversione dell'ordine consueto di due elementi contigui." },
            { nome: 'Iperbato', def: 'Separazione di parole sintatticamente unite mediante altri elementi.' },
            { nome: 'Chiasmo', def: 'Disposizione incrociata (ABBA) di elementi corrispondenti.' },
            { nome: 'Parallelismo', def: 'Disposizione simmetrica (ABAB) di elementi corrispondenti.' },
            { nome: 'Climax / Gradazione', def: 'Successione ascendente (o discendente) di termini per intensità.' },
            { nome: 'Asindeto', def: 'Accostamento senza congiunzioni.' },
            { nome: 'Polisindeto', def: 'Ripetizione insistita della congiunzione.' },
            { nome: 'Enjambement', def: 'Inarcatura: la frase prosegue oltre la fine del verso.' },
            { nome: 'Anadiplosi', def: "Ripresa a inizio frase dell'ultima parola della frase precedente." },
            { nome: 'Iterazione / Geminatio', def: 'Ripetizione ravvicinata della stessa parola.' },
          ],
        },
        {
          id: 'tropi', nome: 'Tropi e figure di significato',
          descr: 'Slittamenti e trasferimenti di senso.',
          voci: [
            { nome: 'Metafora', def: 'Trasferimento di significato per analogia, senza il "come".' },
            { nome: 'Similitudine', def: 'Paragone esplicito introdotto da come, quale, simile a.' },
            { nome: 'Metonimia', def: 'Sostituzione per contiguità (causa/effetto, contenente/contenuto…).' },
            { nome: 'Sineddoche', def: 'Sostituzione per quantità (parte per il tutto e viceversa).' },
            { nome: 'Allegoria', def: 'Metafora continuata: dietro il senso letterale un significato altro.' },
            { nome: 'Personificazione / Prosopopea', def: 'Attribuzione di tratti umani a cose o astratti.' },
            { nome: 'Antitesi', def: 'Accostamento di termini o concetti opposti.' },
            { nome: 'Ossimoro', def: 'Unione di due termini contraddittori (es. ghiaccio bollente).' },
            { nome: 'Sinestesia', def: 'Accostamento di sensazioni di sfere sensoriali diverse.' },
            { nome: 'Iperbole', def: 'Esagerazione per eccesso o difetto.' },
            { nome: 'Litote', def: "Affermazione tramite negazione del contrario (non pochi)." },
            { nome: 'Ironia', def: 'Si dice il contrario di ciò che si intende.' },
            { nome: 'Perifrasi', def: 'Giro di parole che sostituisce un termine proprio.' },
            { nome: 'Antonomasia', def: 'Nome proprio per comune (o viceversa) per eccellenza del tratto.' },
          ],
        },
        {
          id: 'pensiero', nome: 'Figure di pensiero',
          descr: 'Movimenti del discorso e rapporto con il destinatario.',
          voci: [
            { nome: 'Apostrofe', def: 'Rivolgersi direttamente a persona, cosa o astratto.' },
            { nome: 'Interrogazione retorica', def: 'Domanda che non attende risposta ma afferma.' },
            { nome: 'Esclamazione', def: 'Espressione enfatica di un moto affettivo.' },
            { nome: 'Reticenza / Aposiopesi', def: 'Interruzione brusca del discorso.' },
            { nome: 'Preterizione', def: 'Dichiarare di non voler dire ciò che si dice.' },
            { nome: 'Adynaton', def: "Iperbole dell'impossibile, immagine irrealizzabile." },
            { nome: 'Ipotiposi / Enargeia', def: 'Descrizione così vivida da rendere presente la scena.' },
            { nome: 'Sentenza / Gnome', def: 'Massima di valore generale.' },
          ],
        },
        {
          id: 'stile', nome: 'Stile, registro, sintassi',
          descr: "Tratti generali dell'elocuzione.",
          voci: [
            { nome: 'Registro alto / sublime', def: 'Lessico e sintassi solenni, elevati.' },
            { nome: 'Registro medio', def: 'Tono piano, equilibrato.' },
            { nome: 'Registro basso / colloquiale', def: 'Lessico quotidiano, familiare o comico.' },
            { nome: 'Paratassi', def: 'Coordinazione: frasi giustapposte sullo stesso piano.' },
            { nome: 'Ipotassi', def: 'Subordinazione: gerarchia di proposizioni.' },
            { nome: 'Brachilogia / Concisione', def: "Economia espressiva, essenzialità." },
            { nome: 'Amplificatio', def: 'Dilatazione retorica del discorso.' },
            { nome: 'Variatio', def: "Variazione voluta di forme o costrutti per evitare la monotonia." },
          ],
        },
        {
          id: 'metrica', nome: 'Metrica e prosodia',
          descr: 'Struttura del verso e organizzazione ritmica (poesia).',
          voci: [
            { nome: 'Verso / metro', def: 'Misura del verso (endecasillabo, esametro, trimetro…).' },
            { nome: 'Cesura', def: 'Pausa interna al verso.' },
            { nome: 'Rima', def: 'Identità di suono dalla tonica in fine di verso.' },
            { nome: 'Strofe', def: 'Raggruppamento regolare di versi.' },
            { nome: 'Ritmo / accenti', def: 'Distribuzione degli ictus e degli accenti.' },
            { nome: 'Dieresi / Sineresi', def: 'Scioglimento o fusione di vocali contigue.' },
          ],
        },
      ],
    },

    /* ===== 2. SEMANTICO-LESSICALE ============================ */
    {
      id: 'semantica',
      nome: 'Semantico-lessicale',
      breve: 'Lessico e sensi',
      colore: 'semantica',
      descr: 'Le scelte di parola e i loro significati: temi, campi semantici, connotazioni.',
      categorie: [
        {
          id: 'campo', nome: 'Campo / sfera semantica',
          descr: 'Insieme di parole legate a una stessa area di significato.',
          voci: [
            { nome: 'Sfera della natura', def: 'Lessico di paesaggio, elementi, stagioni.' },
            { nome: 'Sfera della luce / buio', def: 'Lessico luminoso od oscuro.' },
            { nome: 'Sfera amorosa', def: 'Lessico del sentimento e del desiderio.' },
            { nome: 'Sfera della guerra', def: 'Lessico bellico e militare.' },
            { nome: 'Sfera della morte', def: 'Lessico funebre e della fine.' },
            { nome: 'Sfera religiosa / sacra', def: 'Lessico del divino e del rito.' },
            { nome: 'Sfera del tempo', def: 'Lessico della durata, della memoria, della fugacità.' },
            { nome: 'Campo semantico (altro)', def: 'Definisci tu il campo nei tag liberi.' },
          ],
        },
        {
          id: 'tema', nome: 'Tema / motivo',
          descr: 'Nuclei concettuali e immagini ricorrenti.',
          voci: [
            { nome: 'Tema centrale', def: 'Il nucleo concettuale del passo.' },
            { nome: 'Motivo ricorrente', def: 'Immagine o idea che torna nel testo.' },
            { nome: 'Topos letterario', def: 'Luogo comune codificato dalla tradizione.' },
            { nome: 'Simbolo', def: 'Elemento che rinvia stabilmente a un significato altro.' },
            { nome: 'Antitesi tematica', def: 'Opposizione concettuale strutturante.' },
          ],
        },
        {
          id: 'scelta', nome: 'Scelta lessicale',
          descr: 'Marche e provenienza delle parole.',
          voci: [
            { nome: 'Parola-chiave', def: 'Termine portante del senso del passo.' },
            { nome: 'Latinismo', def: 'Termine o costrutto di derivazione latina.' },
            { nome: 'Grecismo', def: 'Termine o costrutto di derivazione greca.' },
            { nome: 'Arcaismo', def: 'Forma antica o desueta.' },
            { nome: 'Neologismo', def: 'Conio nuovo o uso innovativo.' },
            { nome: 'Tecnicismo', def: 'Termine settoriale o specialistico.' },
            { nome: 'Dialettalismo / regionalismo', def: 'Forma di area geografica.' },
            { nome: 'Hapax', def: 'Termine attestato una sola volta nel corpus.' },
          ],
        },
        {
          id: 'senso', nome: 'Sensi e connotazione',
          descr: 'Stratificazione e sfumature di significato.',
          voci: [
            { nome: 'Polisemia / ambiguità', def: 'Compresenza di più significati.' },
            { nome: 'Connotazione', def: 'Significato affettivo o evocativo oltre il denotativo.' },
            { nome: 'Denotazione', def: 'Significato letterale, oggettivo.' },
            { nome: 'Etimologia', def: 'Origine e storia della parola, attivata nel testo.' },
            { nome: 'Doppio senso / calembour', def: 'Gioco di parole su più significati.' },
            { nome: 'Iperonimo / iponimo', def: 'Rapporto di genere/specie tra termini.' },
          ],
        },
      ],
    },

    /* ===== 3. PRAGMATICO-ESPRESSIVA (comunicativa) =========== */
    {
      id: 'pragmatica',
      nome: 'Pragmatico-espressiva',
      breve: 'Comunicazione',
      colore: 'pragmatica',
      descr: 'Il testo come atto comunicativo: chi parla, a chi, con quale funzione e intenzione.',
      categorie: [
        {
          id: 'funzioni', nome: 'Funzioni linguistiche',
          descr: 'Funzioni della comunicazione (modello di Jakobson).',
          voci: [
            { nome: 'Funzione emotiva / espressiva', def: "Centrata sull'emittente e i suoi affetti." },
            { nome: 'Funzione conativa', def: 'Centrata sul destinatario (ordini, appelli).' },
            { nome: 'Funzione referenziale', def: 'Centrata sul contesto e i contenuti.' },
            { nome: 'Funzione fàtica', def: 'Centrata sul canale e sul contatto.' },
            { nome: 'Funzione metalinguistica', def: 'Centrata sul codice, sulla lingua stessa.' },
            { nome: 'Funzione poetica', def: 'Centrata sul messaggio e sulla sua forma.' },
          ],
        },
        {
          id: 'enunciazione', nome: 'Enunciazione e deissi',
          descr: 'Tracce dell\'atto del dire nel testo.',
          voci: [
            { nome: 'Deissi personale (io/tu)', def: 'Marche di persona che ancorano emittente e destinatario.' },
            { nome: 'Deissi spaziale (qui/là)', def: 'Marche di luogo relative alla scena enunciativa.' },
            { nome: 'Deissi temporale (ora/allora)', def: 'Marche di tempo relative al momento del dire.' },
            { nome: 'Voce / istanza narrante', def: 'Chi assume la parola nel testo.' },
            { nome: 'Destinatario / pubblico', def: 'A chi il testo si rivolge, esplicito o implicito.' },
            { nome: 'Discorso diretto / indiretto', def: 'Modalità di riferire le parole.' },
          ],
        },
        {
          id: 'tono', nome: 'Tono, modalità, intenzione',
          descr: "L'atteggiamento dell'emittente e l'effetto cercato.",
          voci: [
            { nome: 'Modalità assertiva', def: 'Affermazione di un dato di fatto.' },
            { nome: 'Modalità dubitativa', def: 'Incertezza, ipotesi, possibilità.' },
            { nome: 'Modalità esortativa / ottativa', def: 'Esortazione, desiderio, augurio.' },
            { nome: 'Tono ironico / sarcastico', def: 'Distanza critica o derisoria.' },
            { nome: 'Tono patetico / elegiaco', def: 'Coinvolgimento affettivo, lamento.' },
            { nome: 'Tono solenne / celebrativo', def: 'Elevazione e gravità.' },
            { nome: 'Atto performativo', def: 'Dire che equivale a fare (giuro, prometto, maledico).' },
          ],
        },
        {
          id: 'implicito', nome: 'Implicito e presupposizione',
          descr: 'Ciò che il testo lascia intendere senza dire.',
          voci: [
            { nome: 'Presupposizione', def: 'Contenuto dato per acquisito dall\'enunciato.' },
            { nome: 'Implicatura / sottinteso', def: 'Senso inferito oltre il detto.' },
            { nome: 'Reticenza comunicativa', def: 'Ciò che è taciuto in modo significativo.' },
            { nome: 'Ironia situazionale', def: 'Scarto tra detto e contesto.' },
          ],
        },
      ],
    },

    /* ===== 4. IPERTESTUALE =================================== */
    {
      id: 'ipertesto',
      nome: 'Ipertestuale',
      breve: 'Rimandi e confronti',
      colore: 'ipertesto',
      descr: 'Confronto con altri luoghi: stessa opera, stesso autore, altri autori, fortuna del passo.',
      categorie: [
        {
          id: 'interna', nome: 'Eco interna (stessa opera)',
          descr: "Rimandi entro la stessa opera.",
          voci: [
            { nome: 'Ripresa lessicale interna', def: 'Stessa parola/immagine altrove nell\'opera.' },
            { nome: 'Eco strutturale', def: 'Corrispondenza di posizione o struttura.' },
            { nome: 'Anticipazione / richiamo', def: 'Prolessi o analessi tematica interna.' },
            { nome: 'Leitmotiv', def: 'Motivo che attraversa l\'intera opera.' },
          ],
        },
        {
          id: 'autore', nome: 'Stesso autore (altra opera)',
          descr: 'Rimandi ad altre opere dello stesso autore.',
          voci: [
            { nome: 'Autocitazione', def: 'Ripresa di un proprio luogo.' },
            { nome: 'Costante tematica d\'autore', def: 'Tema ricorrente nella sua produzione.' },
            { nome: 'Evoluzione stilistica', def: 'Differenza rispetto ad altra fase dell\'autore.' },
          ],
        },
        {
          id: 'inter', nome: 'Intertestualità (altri autori)',
          descr: 'Rapporti con testi di autori diversi.',
          voci: [
            { nome: 'Fonte / modello', def: 'Testo da cui deriva o a cui si ispira.' },
            { nome: 'Allusione', def: 'Richiamo implicito riconoscibile.' },
            { nome: 'Citazione esplicita', def: 'Ripresa dichiarata e letterale.' },
            { nome: 'Imitatio / aemulatio', def: 'Imitazione o gara con il modello.' },
            { nome: 'Parodia / travestimento', def: 'Ripresa rovesciata o comica.' },
            { nome: 'Traduzione / volgarizzamento', def: 'Resa in altra lingua di un modello.' },
          ],
        },
        {
          id: 'tradizione', nome: 'Topos e fortuna',
          descr: 'Inserimento nella tradizione e ripresa posteriore.',
          voci: [
            { nome: 'Topos / luogo comune', def: 'Schema codificato dalla tradizione.' },
            { nome: 'Genere e modello', def: 'Rapporto con le convenzioni del genere.' },
            { nome: 'Fortuna / ripresa posteriore', def: 'Riusi del passo in autori successivi.' },
            { nome: 'Mito di riferimento', def: 'Materiale mitologico richiamato.' },
          ],
        },
      ],
    },
  ];

  /* ── Helper di accesso ────────────────────────────────────── */
  function getLivello(id) { return LIVELLI.find(function (l) { return l.id === id; }); }
  function getCategoria(livelloId, catId) {
    const l = getLivello(livelloId);
    return l ? l.categorie.find(function (c) { return c.id === catId; }) : null;
  }
  function getImportanza(id) { return IMPORTANZE.find(function (i) { return i.id === id; }); }

  global.AT_TASSONOMIA = {
    LIVELLI: LIVELLI,
    IMPORTANZE: IMPORTANZE,
    GENERI: GENERI,
    LINGUE: LINGUE,
    getLivello: getLivello,
    getCategoria: getCategoria,
    getImportanza: getImportanza,
    versione: '1.0',
  };

})(typeof window !== 'undefined' ? window : this);
