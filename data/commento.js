/* ============================================================
   ANALISI DEL TESTO — Protocollo di Commento (Fase 2)
   Traduce in struttura operativa il metodo di analisi
   letteraria (5 macro-fasi) con la variante del commento
   filologico-letterario per i testi greci e latini.

   Ogni fase dichiara `fonti`: i livelli/categorie di
   annotazione che la alimentano (vedi data/taxonomy.js).
   Formato fonte: 'livello' (tutto il livello) oppure
   'livello:categoria' (categoria specifica).
   Caricato come script globale → window.AT_COMMENTO.
   ============================================================ */
(function (global) {
  'use strict';

  /* Protocollo per il testo italiano / moderno */
  const MODERNO = {
    id: 'moderno',
    nome: 'Testo italiano / moderno',
    fasi: [
      {
        id: 'inquadramento', n: 1, nome: 'Inquadramento e contesto',
        obiettivo: 'Stabilire le coordinate prima di toccare il testo.',
        errore: "Sostituire l'analisi con una scheda biografica.",
        fonti: [],
        campi: [
          { id: 'autore', label: 'Autore e opera', prompt: 'Chi scrive, in quale fase della produzione (giovinezza vs maturità).' },
          { id: 'genere', label: 'Genere letterario', prompt: "Costanti del genere: l'autore le rispetta o le scardina?" },
          { id: 'contesto', label: 'Contesto storico-culturale', prompt: 'Movimento letterario (Umanesimo, Romanticismo, Decadentismo…) ed eventi coevi.' },
        ],
      },
      {
        id: 'letterale', n: 2, nome: 'Livello letterale: parafrasi',
        obiettivo: 'Che cosa dice il testo. Il livello zero, da non saltare.',
        errore: 'Fermarsi al riassunto.',
        fonti: ['semantica:tema'],
        campi: [
          { id: 'parafrasi', label: 'Parafrasi', prompt: 'Sciogli inversioni (anastrofi, iperbati) e costrutti complessi in italiano corrente.', big: true },
          { id: 'contenuto', label: 'Enucleazione del contenuto', prompt: 'Il nucleo tematico, la "trama" concettuale o narrativa del passo.' },
        ],
      },
      {
        id: 'formale', n: 3, nome: 'Livello formale e stilistico',
        obiettivo: 'Come lo dice: metro, suono, lessico, sintassi.',
        errore: 'Trattare la metrica come un guscio vuoto.',
        fonti: ['retorica:metrica', 'retorica:suono', 'retorica:stile', 'retorica:sintassi', 'retorica:metaplasmi', 'semantica:scelta'],
        campi: [
          { id: 'metrico', label: 'Metrico-ritmico', prompt: 'Metro, schema delle rime, ritmo, enjambement che spezzano il ritmo logico.' },
          { id: 'fonico', label: 'Fonico-timbrico', prompt: 'Figure di suono; i suoni sono aspri o dolci, in armonia col tema?' },
          { id: 'lessico', label: 'Lessicale e sintattico', prompt: 'Iuncturae, arcaismi, neologismi, registro; ipotassi complessa vs paratassi.' },
        ],
      },
      {
        id: 'retorico', n: 4, nome: 'Livello retorico e semantico',
        obiettivo: 'I meccanismi del significato.',
        errore: 'Fare l\'"elenco della spesa" di figure senza spiegarle.',
        fonti: ['retorica:significato', 'retorica:pensiero', 'retorica:amplificazione', 'semantica:senso'],
        campi: [
          { id: 'figure', label: 'Figure e tropi', prompt: 'Non elencare: spiega perché quella figura e quale cortocircuito mentale provoca nel lettore.', big: true },
        ],
      },
      {
        id: 'interpretazione', n: 5, nome: 'Interpretazione critica ed ermeneutica',
        obiettivo: 'Che cosa significa in profondità. Il culmine dell\'analisi.',
        errore: 'Esprimere pareri soggettivi ("mi piace perché…").',
        fonti: ['ipertesto', 'pragmatica', 'semantica:tema', 'semantica:campo'],
        campi: [
          { id: 'temi', label: 'Sintesi dei temi', prompt: 'Motivi profondi e fili conduttori (esilio, amore/morte, natura matrigna…).' },
          { id: 'confronto', label: 'Attualizzazione e confronto', prompt: 'Intertestualità interna (stesso autore) ed esterna (fonti, modelli).' },
          { id: 'modelli', label: 'Modelli critici', prompt: 'Lettura alla luce delle scuole critiche (filologica, strutturalismo, psicanalisi, storicismo).' },
        ],
      },
    ],
  };

  /* Protocollo per il testo greco / latino — commento filologico */
  const CLASSICO = {
    id: 'classico',
    nome: 'Testo greco / latino (commento filologico)',
    domande: [
      'Filologia / lingua — cosa c\'è scritto esattamente e com\'è costruito?',
      'Letteratura / metrica — a quale genere appartiene e con quali modelli dialoga?',
      'Storia / antropologia — quale valore culturale greco o romano esprime?',
    ],
    fasi: [
      {
        id: 'critica', n: 1, nome: 'Critica del testo e tradizione',
        obiettivo: 'Fissare la pagina: il testo non è un dato immutabile.',
        errore: 'Trattare il testo come dato immutabile.',
        fonti: [],
        campi: [
          { id: 'apparato', label: 'Apparato critico e varianti', prompt: 'Varianti tra i manoscritti; perché l\'editore (OCT, Teubner) sceglie una lezione.' },
          { id: 'problemi', label: 'Problemi testuali', prompt: 'Cruces desperationis, congetture dei filologi, lacune.' },
        ],
      },
      {
        id: 'morfosintassi', n: 2, nome: 'Morfosintassi e lessico',
        obiettivo: 'Oltre la traduzione: giustificare l\'architettura della lingua.',
        errore: 'Tradurre senza giustificare le scelte linguistiche.',
        fonti: ['semantica', 'retorica:stile', 'retorica:sintassi', 'retorica:metaplasmi'],
        campi: [
          { id: 'costrutti', label: 'Costrutti e modi', prompt: 'Perché un ottativo qui? Obliquo o desiderativo? Participio futuro vs subordinata?' },
          { id: 'lessico', label: 'Lessico e parole-chiave', prompt: 'Termini tecnici (politici, sacrali, medici); parole esclusive (es. μῆνις = ira divina e distruttiva).', big: true },
        ],
      },
      {
        id: 'metrica', n: 3, nome: 'Metrica e prosodia',
        obiettivo: 'La musica della lingua: quantità (lunghe/brevi), non solo ritmo.',
        errore: 'Ignorare il legame tra metro e pathos.',
        fonti: ['retorica:metrica', 'retorica:suono'],
        campi: [
          { id: 'scansione', label: 'Lettura metrica', prompt: 'Scansione dell\'esametro, del distico elegiaco, dei metri eolici o oraziani.' },
          { id: 'fonica', label: 'Fenomeni fonici', prompt: 'Cesure (pentemimere), dieresi, elisioni, sinizesi, nessi allitteranti. Spondei rallentano, dattili accelerano: quale pathos?' },
        ],
      },
      {
        id: 'intertesto', n: 4, nome: 'Intertestualità e allusività',
        obiettivo: 'Il gioco dei modelli: la letteratura classica vive di riscritture.',
        errore: 'Vedere il testo come creazione dal nulla.',
        fonti: ['ipertesto'],
        campi: [
          { id: 'modello', label: 'Identificazione del modello', prompt: 'Dove Virgilio imita Omero o Apollonio; dove Catullo riprende Saffo.' },
          { id: 'variatio', label: 'Variatio / aemulatio', prompt: 'Come modifica il modello: lo condensa, lo capovolge, lo integra con la filosofia del tempo?', big: true },
        ],
      },
      {
        id: 'antropologia', n: 5, nome: 'Contesto antropologico e storico',
        obiettivo: 'L\'orizzonte culturale: evitare l\'anacronismo.',
        errore: 'Anacronismo culturale.',
        fonti: ['pragmatica', 'semantica:campo'],
        campi: [
          { id: 'concetti', label: 'Concetti del mondo antico', prompt: 'kalokagathía, pietas, fides, hybris (tracotanza), sistema di clientela…' },
          { id: 'performativo', label: 'Contesto performativo', prompt: 'Lirica cantata, tragedia agita nella pòlis davanti ai cittadini, oratoria pronunciata nel foro.' },
        ],
      },
    ],
  };

  /* Griglia di controllo rapido (vademecum) */
  const VADEMECUM = [
    { area: 'Sintattico / lessicale', cerca: 'Campi semantici dominanti, parole-chiave, costrutti rari o arcaici.', errore: 'Trattare il lessico poetico come prosa comune.' },
    { area: 'Metrico / fonico', cerca: 'Cesure, sinalefi/dialefi, giochi di specchi sonori, rime interne.', errore: 'Considerare la metrica come un guscio vuoto.' },
    { area: 'Retorico', cerca: 'Spostamenti di significato, accostamenti insoliti, figure di ripetizione.', errore: 'Elenco della spesa di figure senza spiegarle.' },
    { area: 'Ermeneutico', cerca: 'Ideologia dell\'autore, dialogo coi modelli antichi, messaggio profondo.', errore: 'Pareri personali soggettivi ("mi piace perché…").' },
  ];

  const PRINCIPIO = 'La forma è contenuto. Un autore non sceglie mai un metro, una parola o una metafora per caso: l\'analisi riesce quando dimostri il legame indissolubile tra la struttura e il significato profondo.';

  function protocolloPerLingua(lingua) {
    return (lingua === 'la' || lingua === 'gr') ? 'classico' : 'moderno';
  }
  function getProtocollo(id) { return id === 'classico' ? CLASSICO : MODERNO; }

  global.AT_COMMENTO = {
    PROTOCOLLI: { moderno: MODERNO, classico: CLASSICO },
    VADEMECUM: VADEMECUM,
    PRINCIPIO: PRINCIPIO,
    protocolloPerLingua: protocolloPerLingua,
    getProtocollo: getProtocollo,
    versione: '1.0',
  };

})(typeof window !== 'undefined' ? window : this);
