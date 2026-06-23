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
          id: 'suono', nome: 'Figure di suono (fonetiche)',
          descr: 'Lavorano sul suono e sul significante: ritmo, musicalità, effetti acustici.',
          voci: [
            { nome: 'Allitterazione', def: 'Ripetizione dello stesso suono a inizio o interno di parole vicine.', es: "E mi mess'in la mia mente il mio maestro (Dante)" },
            { nome: 'Assonanza', def: "Uguaglianza delle sole vocali dall'ultima tonica in poi.", es: 'fame / face' },
            { nome: 'Cacofonia', def: 'Successione voluta di suoni aspri o sgradevoli, per mimare disagio o violenza.', es: 'Asperge di grave gragnola il greto' },
            { nome: 'Consonanza', def: "Uguaglianza delle sole consonanti dall'ultima tonica in poi.", es: 'partire / morte' },
            { nome: 'Eufonia', def: 'Ricerca sistematica di suoni caldi, fluidi e armoniosi (opposto della cacofonia).' },
            { nome: 'Omoteleuto', def: 'Identità di suono nella terminazione di parole vicine (rima tra parole contigue).', es: 'andato, consumato, dimenticato' },
            { nome: 'Onomatopea', def: 'Parola che riproduce un suono reale (primaria: tic-tac; secondaria: parole che lo evocano).', es: 'il fru fru tra le fratte (Pascoli)' },
            { nome: 'Paronomasia (bisticcio)', def: 'Accostamento di parole dal suono simile ma significato diverso.', es: 'tradotto / tradito' },
            { nome: 'Poliptoto', def: 'Ripetizione ravvicinata della stessa parola con funzioni, flessioni o casi diversi.', es: "Cred'io ch'ei credette ch'io credesse (Dante)" },
          ],
        },
        {
          id: 'sintassi', nome: 'Figure di sintassi e costruzione',
          descr: "Regolano l'architettura della frase e la disposizione dei termini.",
          voci: [
            { nome: 'Anacoluto', def: 'Rottura della coerenza sintattica: un primo elemento resta senza legame grammaticale (soggetto pendente).', es: 'Quelli che muoiono, bisogna pregare Dio per loro (Manzoni)' },
            { nome: 'Anadiplosi', def: "L'ultima parola di un verso/frase si ripete all'inizio del successivo.", es: '...il mio pensiero a lei; / lei che mi muove il cuore' },
            { nome: 'Anafora', def: 'Ripetizione di parole a inizio di versi o frasi consecutive.', es: 'Per me si va ne la città dolente, / Per me si va... (Dante)' },
            { nome: 'Anastrofe', def: "Inversione dell'ordine abituale di due parole consecutive.", es: 'di foglie un cader lento' },
            { nome: 'Anticlimax', def: 'Successione di termini di intensità decrescente.', es: 'Urlo, pianto, sospiro' },
            { nome: 'Asindeto', def: 'Elencazione senza congiunzioni, con sola punteggiatura.', es: 'Veni, vidi, vici' },
            { nome: 'Chiasmo', def: 'Disposizione incrociata di quattro elementi (A-B-B-A).', es: "Le donne, i cavalier, l'arme, gli amori (Ariosto)" },
            { nome: 'Climax (gradazione)', def: 'Successione di termini di intensità crescente.', es: 'Sospira, piange, urla' },
            { nome: 'Ellissi', def: 'Omissione volontaria di elementi (spesso il verbo) ricostruibili dal contesto.', es: 'A me la patria, a te la gloria' },
            { nome: 'Enallage', def: "Scambio funzionale di una parte del discorso con un'altra (es. aggettivo per avverbio).", es: 'parlare chiaro per chiaramente' },
            { nome: 'Endiadi', def: 'Sdoppiamento di un concetto unitario in due termini coordinati.', es: "nella strada e nella polvere per 'strada polverosa'" },
            { nome: 'Enjambement', def: 'Inarcatura: la frase prosegue oltre la fine del verso.' },
            { nome: 'Epanadiplosi', def: 'Una parola apre e chiude lo stesso verso/frase (X...X).', es: "Piace alla luna il canto dell'usignolo, piace" },
            { nome: 'Epanalessi (geminazione)', def: 'Raddoppiamento immediato e ravvicinato di una parola.', es: 'vola, vola' },
            { nome: 'Epifora', def: "Ripetizione di parole alla fine di versi/frasi consecutive (opposto dell'anafora)." },
            { nome: 'Epifrasi', def: 'Aggiunta di un elemento alla fine di un enunciato già concluso.', es: 'Dolce e chiara è la notte, e senza vento (Leopardi)' },
            { nome: 'Hysteron proteron', def: 'Inversione dell’ordine logico/cronologico di due azioni.', es: 'Moriamo e precipitiamo nelle armi' },
            { nome: 'Ipallage', def: 'Una qualità (spesso un aggettivo) è riferita a parola diversa da quella cui logicamente spetta.', es: 'Il divino del pian silenzio verde (Carducci)' },
            { nome: 'Iperbato', def: 'Inserimento di elementi tra due parole logicamente unite.', es: 'O tardo nel venir, salute a noi / mille volte cercata (Foscolo)' },
            { nome: 'Isocolo (parison)', def: 'Membri della frase di uguale lunghezza, struttura e ritmo.' },
            { nome: 'Parallelismo', def: 'Disposizione simmetrica di strutture sintattiche ripetute (A-B-A-B).', es: 'Mandò il fumo nei cieli, spinse le radici nella terra' },
            { nome: 'Pleonasmo', def: "Parole superflue aggiunte per intensificare l'espressione.", es: 'A me mi piace' },
            { nome: 'Polisindeto', def: 'Elencazione legata dalla ripetizione insistita della congiunzione.', es: 'E mangia, e bee, e dorme... (Dante)' },
            { nome: 'Sillepsi', def: 'Accordo grammaticale violato a favore del senso logico.', es: 'Una folla di persone gridavano' },
            { nome: 'Simploce', def: 'Anafora ed epifora insieme: stessa apertura e stessa chiusura (X...Y / X...Y).' },
            { nome: 'Zeugma', def: 'Più termini dipendono da un solo verbo che si adatterebbe a uno solo.', es: 'Parlare e lagrimar vedrai insieme (Dante)' },
          ],
        },
        {
          id: 'significato', nome: 'Figure di significato (tropi)',
          descr: 'Operano sul contenuto: trasferiscono il senso per legami logici, analogici o quantitativi.',
          voci: [
            { nome: 'Analogia', def: "Metafora condensata che collega d'intuito realtà lontanissime, senza passaggi logici.", es: 'Le mani della sera (Montale)' },
            { nome: 'Antifrasi', def: 'Si dice il contrario di ciò che si intende, affidando il senso al tono o al contesto.', es: 'Che bella giornata! (sotto un nubifragio)' },
            { nome: 'Antitesi', def: 'Contrapposizione di idee o parole opposte poste in stretta vicinanza.', es: 'Pace non trovo, et non ho da far guerra (Petrarca)' },
            { nome: 'Antonomasia', def: 'Nome proprio per una qualità universale, o epiteto per un individuo.', es: 'Il Filosofo per Aristotele' },
            { nome: 'Catacresi', def: 'Metafora ormai lessicalizzata che supplisce a un termine mancante.', es: 'il collo della bottiglia' },
            { nome: 'Disfemismo', def: 'Sostituzione di un termine neutro con uno volutamente sgradevole o spregiativo.' },
            { nome: 'Eufemismo', def: "Sostituzione di un'espressione cruda con una attenuata e accettabile.", es: "Passare a miglior vita per 'morire'" },
            { nome: 'Iperbole', def: 'Esagerazione per eccesso o difetto, oltre il verosimile.', es: "Te l'ho detto un milione di volte" },
            { nome: 'Litote', def: 'Affermazione attenuata tramite negazione del contrario.', es: 'non era nato con un cuore di leone (Manzoni)' },
            { nome: 'Metalessi', def: 'Sostituzione tramite una catena di tropi sovrapposti.', es: "molte mietiture per 'molti anni'" },
            { nome: 'Metafora', def: "Sostituzione di un termine con uno figurato per somiglianza (similitudine senza 'come').", es: "Capelli d'oro" },
            { nome: 'Metonimia', def: 'Sostituzione per contiguità (causa/effetto, contenitore/contenuto, autore/opera...).', es: 'Bere un bicchiere; leggere Leopardi' },
            { nome: 'Ossimoro', def: 'Accostamento nello stesso sintagma di due termini contraddittori.', es: 'Ghiaccio bollente; silenzio assordante' },
            { nome: 'Perifrasi', def: 'Giro di parole per designare qualcosa senza nominarlo.', es: 'Colui che tutto move (Dante = Dio)' },
            { nome: 'Similitudine', def: 'Paragone esplicito introdotto da come, quale, simile a.' },
            { nome: 'Sineddoche', def: 'Sostituzione per quantità/inclusione (parte-tutto, genere-specie, singolare-plurale).', es: 'Una vela all’orizzonte (= la nave)' },
            { nome: 'Sinestesia', def: 'Accostamento di termini di sfere sensoriali diverse.', es: 'Un urlo nero (Quasimodo)' },
          ],
        },
        {
          id: 'pensiero', nome: 'Figure di pensiero, logica e argomentazione',
          descr: "Coinvolgono l'andamento del pensiero, l'argomentazione e la postura dell'io lirico.",
          voci: [
            { nome: 'Adynaton', def: 'Evento impossibile usato come paragone per negare assolutamente un fatto.', es: 'Si vedranno i pesci volare prima che io ti dimentichi' },
            { nome: 'Allegoria', def: "Sistema concettuale prolungato dietro il velo letterale di immagini; richiede decodifica.", es: "la Divina Commedia come viaggio dell'anima" },
            { nome: 'Anacenosi (comunicazione)', def: "Il poeta chiede il parere del pubblico o dell'avversario, simulando deliberazione comune." },
            { nome: 'Aporia (dubitazione)', def: "Simulazione di un'incertezza insolubile su cosa dire o da dove iniziare." },
            { nome: 'Apostrofe', def: "Rivolgersi direttamente (tu/voi) a qualcuno o a un'entità astratta.", es: 'Ahi serva Italia, di dolore ostello (Dante)' },
            { nome: 'Commoratio', def: 'Indugiare insistito sullo stesso nucleo concettuale con minime variazioni.' },
            { nome: 'Concessione (epitrope)', def: "Ammettere un punto dell'avversario per ritorcerglielo contro.", es: 'È vero, hai studiato molto; ma hai capito pochissimo' },
            { nome: 'Dilemma', def: 'Porre di fronte a due sole opzioni, entrambe sfavorevoli.' },
            { nome: 'Entimema', def: 'Sillogismo retorico abbreviato: una premessa è omessa perché ovvia.' },
            { nome: 'Epanortosi (correzione)', def: "Smentire un'affermazione appena fatta per sostituirla con una più forte.", es: 'intelligente; che dico? un genio' },
            { nome: 'Exemplum', def: 'Caso storico, mitico o biblico citato come prova di una tesi morale.' },
            { nome: 'Interrogazione retorica', def: 'Domanda che non cerca informazione ma riafferma una tesi già ovvia.' },
            { nome: 'Ipotiposi', def: "Descrizione così vivida da dare l'illusione di assistere alla scena." },
            { nome: 'Ironia', def: 'Dire il contrario di ciò che si intende, lasciando trasparire la verità.' },
            { nome: 'Paradosso', def: 'Affermazione che contrasta col senso comune ma nasconde una verità.' },
            { nome: 'Personificazione (prosopopea)', def: 'Attribuire tratti umani a cose, animali o astratti.' },
            { nome: 'Preterizione', def: 'Dichiarare di non voler dire ciò che intanto si dice.', es: 'Non ti starò a ricordare quanti sacrifici...' },
            { nome: 'Prolessi (anticipazione)', def: 'Anticipare le obiezioni per confutarle preventivamente.' },
            { nome: 'Reticenza (aposiopesi)', def: 'Interruzione brusca del discorso, lasciando intendere il seguito.', es: 'altrimenti...' },
            { nome: 'Sentenza (epifonema)', def: 'Massima solenne e perentoria posta a suggello del testo.' },
            { nome: 'Simbolo', def: 'Elemento concreto che si carica di un valore ideale ulteriore.', es: 'la siepe in Leopardi' },
            { nome: 'Subiectio (percontatio)', def: 'Porre una domanda e darsi subito la risposta, simulando un dialogo.' },
          ],
        },
        {
          id: 'amplificazione', nome: 'Amplificazione, accumulazione e pathos',
          descr: "Espandono il discorso o trasmettono l'urgenza del sentimento.",
          voci: [
            { nome: 'Congerie (coacervazione)', def: 'Accumulo di parole sinonimiche o correlate, per saturazione.', es: 'Sassi, fango, sterpi, spine, macerie' },
            { nome: 'Deprecazione (obsecratio)', def: 'Preghiera accorata per stornare un male o impetrare misericordia.' },
            { nome: 'Distributio', def: 'Dividere un concetto generale nelle sue parti, assegnando a ciascuna un ruolo.', es: 'Ai giovani il coraggio, ai vecchi la saggezza...' },
            { nome: 'Esclamazione (ecfonesi)', def: 'Esclamazione appassionata che dà voce al sentimento puro.', es: 'Oh lassa me!' },
            { nome: 'Enumerazione', def: 'Elenco coordinato di parti o dettagli (orizzontale o verticale).' },
            { nome: 'Expolitio', def: 'Tornare sullo stesso concetto variando parole e struttura per imprimerlo.' },
            { nome: 'Imprecazione (esecrazione)', def: "Augurio violento di male o dichiarazione d'odio focalizzata." },
            { nome: 'Incrementum', def: 'Climax in cui ogni segmento aggiunge informazione oggettiva (amplificazione quantitativa).' },
            { nome: 'Optazione (desiderio)', def: 'Espressione di un desiderio ardente, spesso utopico o irraggiungibile.' },
            { nome: 'Perissologia', def: 'Parole superflue che rallentano il ritmo o danno tono solenne.' },
          ],
        },
        {
          id: 'metaplasmi', nome: 'Metaplasmi e mutazioni morfologiche',
          descr: 'Alterano la forma fonetica o morfologica della singola parola (spesso per metrica).',
          voci: [
            { nome: 'Aferesi', def: 'Caduta di vocale o sillaba a inizio parola.', es: "'vangelio per evangelo" },
            { nome: 'Antanaclasi', def: 'Stessa parola ripetuta con significato ogni volta diverso.', es: 'la morte del cuore' },
            { nome: 'Apocope (troncamento)', def: 'Caduta di vocale o sillaba a fine parola.', es: "fra' per frate; andar per andare" },
            { nome: 'Diafora', def: 'Ripetizione di una parola in cui la seconda indica la qualità intrinseca.', es: 'Il re è re' },
            { nome: 'Epentesi', def: 'Aggiunta di un suono o di una lettera all’interno della parola.' },
            { nome: 'Metatesi', def: 'Inversione dell’ordine di suoni o lettere nella parola.', es: 'spandere per espandere' },
            { nome: 'Paragoge (epitesi)', def: "Aggiunta di una vocale d'appoggio a fine parola.", es: 'fue per fu' },
            { nome: 'Paragramma', def: 'Lettere del nome amato o di un concetto nascoste nei versi (criptografia poetica).' },
            { nome: 'Protesi', def: 'Aggiunta di lettera o sillaba a inizio parola.', es: 'in iscena per in scena' },
            { nome: 'Sincope', def: 'Caduta di lettera o sillaba all’interno della parola.', es: 'spirto per spirito' },
            { nome: 'Tmesi', def: 'Spezzare una parola inserendovi in mezzo altri elementi.', es: 'Le tue non mai abbastanza lodate virtù' },
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
    /* Categorie = le cinque relazioni transtestuali di Genette.
       Per la compilazione riflessiva (ambito, pratiche, assi,
       bussola) vedi l'oggetto IPERTESTO più sotto. */
    {
      id: 'ipertesto',
      nome: 'Ipertestuale',
      breve: 'Rimandi e confronti',
      colore: 'ipertesto',
      descr: 'Come il passo dialoga con altri testi: citazione, derivazione, genere, cornice, commento.',
      categorie: [
        {
          id: 'intertesto', nome: 'Intertestualità (citazione, allusione)',
          descr: 'Presenza effettiva di un testo dentro un altro.',
          voci: [
            { nome: 'Citazione esplicita', def: 'Ripresa dichiarata e letterale di un luogo altrui.' },
            { nome: 'Allusione', def: 'Richiamo non dichiarato ma riconoscibile a un lettore competente.' },
            { nome: 'Reminiscenza / eco verbale', def: 'Ripresa di parole o iuncturae sedimentate dalla tradizione.' },
            { nome: 'Ripresa non dichiarata', def: 'Riuso di un testo-fonte senza segnalazione.' },
            { nome: 'Autocitazione', def: 'Ripresa di un proprio luogo (stesso autore).' },
          ],
        },
        {
          id: 'ipertestoderiv', nome: 'Ipertestualità (derivazione)',
          descr: 'Il passo deriva da un modello per trasformazione o imitazione.',
          voci: [
            { nome: 'Parodia', def: 'Trasformazione ludica di un testo specifico (abbassa l\'eroico al comico).' },
            { nome: 'Travestimento', def: 'Stessa storia, stile abbassato o burlesco.' },
            { nome: 'Trasposizione', def: 'Trasformazione seria: cambia contesto/epoca, resta la struttura.' },
            { nome: 'Pastiche', def: 'Imitazione ludica dello stile di un autore o di un\'epoca.' },
            { nome: 'Charge', def: 'Imitazione satirica e deformante dello stile di un autore.' },
            { nome: 'Continuazione / completamento', def: 'Imitazione seria: prosegue o completa il modello.' },
          ],
        },
        {
          id: 'architesto', nome: 'Architestualità (genere e modello)',
          descr: 'Rapporto con le categorie generali: genere, forma, modo.',
          voci: [
            { nome: 'Adesione al genere', def: 'Rispetto delle convenzioni del genere.' },
            { nome: 'Scarto / sovversione del genere', def: 'Deformazione o rottura delle convenzioni.' },
            { nome: 'Contaminazione di generi', def: 'Innesto di generi diversi.' },
            { nome: 'Topos di genere', def: 'Luogo comune codificato dal genere.' },
            { nome: 'Codice metrico-formale', def: 'Adesione a una forma metrica o strutturale codificata.' },
          ],
        },
        {
          id: 'paratesto', nome: 'Paratestualità (cornice del testo)',
          descr: 'Relazione con titolo, dediche, prefazioni, note, epigrafi.',
          voci: [
            { nome: 'Titolo allusivo', def: 'Il titolo rinvia a un altro testo.' },
            { nome: 'Epigrafe / esergo', def: 'Citazione in apertura che orienta la lettura.' },
            { nome: 'Dedica', def: 'Indirizzo a un destinatario che colloca il testo.' },
            { nome: 'Prefazione / nota d\'autore', def: 'Cornice autoriale che dialoga con altri testi.' },
            { nome: 'Glossa / postilla', def: 'Annotazione a margine che richiama una fonte.' },
          ],
        },
        {
          id: 'metatesto', nome: 'Metatestualità (commento, critica)',
          descr: 'Il passo commenta, valuta o discute un altro testo.',
          voci: [
            { nome: 'Commento / esegesi', def: 'Spiegazione di un altro testo.' },
            { nome: 'Polemica / dialogo critico', def: 'Presa di posizione verso un altro autore.' },
            { nome: 'Autocommento', def: 'L\'autore commenta la propria opera.' },
            { nome: 'Giudizio / valutazione', def: 'Citazione per approvare o condannare.' },
            { nome: 'Allegoria interpretativa', def: 'Rilettura di un testo in chiave altra.' },
          ],
        },
      ],
    },
  ];

  /* ── Struttura operativa del livello IPERTESTUALE ─────────────
     Tradotta dal quadro Genette/Kristeva: dimensioni qualitative
     che guidano la compilazione riflessiva di un rimando. ── */
  const IPERTESTO = {
    // Dove si trova il testo collegato (richiesta originaria: stessa
    // opera / stesso autore / altri autori / tradizione).
    ambiti: [
      { id: 'interna', nome: 'Stessa opera', descr: 'Eco entro la stessa opera (ripresa, leitmotiv, struttura).' },
      { id: 'autore', nome: 'Stesso autore', descr: 'Altra opera dello stesso autore.' },
      { id: 'altro', nome: 'Altro autore', descr: 'Testo di un autore diverso: fonte o modello.' },
      { id: 'tradizione', nome: 'Tradizione / fortuna', descr: 'Canone, topos condiviso o ripresa posteriore.' },
    ],
    // Le sei pratiche ipertestuali = operazione × tono (matrice di Genette).
    pratiche: [
      { id: 'parodia',       nome: 'Parodia',        operazione: 'trasformazione', tono: 'ludico',   def: 'Trasformazione ludica di un testo specifico.' },
      { id: 'travestimento', nome: 'Travestimento',  operazione: 'trasformazione', tono: 'satirico', def: 'Stessa storia, stile abbassato.' },
      { id: 'trasposizione', nome: 'Trasposizione',  operazione: 'trasformazione', tono: 'serio',    def: 'Trasformazione seria: cambia contesto, resta la struttura.' },
      { id: 'pastiche',      nome: 'Pastiche',        operazione: 'imitazione',     tono: 'ludico',   def: 'Imitazione ludica di uno stile.' },
      { id: 'charge',        nome: 'Charge',          operazione: 'imitazione',     tono: 'satirico', def: 'Imitazione satirica e deformante di uno stile.' },
      { id: 'continuazione', nome: 'Continuazione / Forger', operazione: 'imitazione', tono: 'serio', def: 'Imitazione seria: prosegue o completa il modello.' },
    ],
    operazioni: [
      { id: 'trasformazione', nome: 'Trasformazione', descr: 'Si agisce sul contenuto o sulla struttura del modello.' },
      { id: 'imitazione',     nome: 'Imitazione',     descr: 'Si riproduce lo stile o la maniera del modello.' },
    ],
    toni: [
      { id: 'ludico', nome: 'Ludico' }, { id: 'satirico', nome: 'Satirico' }, { id: 'serio', nome: 'Serio' },
    ],
    // Asse 1: quanto è visibile il rimando.
    visibilita: [
      { id: 'implicito', nome: 'Implicito' }, { id: 'mediano', nome: 'Mediano' }, { id: 'esplicito', nome: 'Esplicito' },
    ],
    // Asse 2: che cosa fa il testo del modello.
    postura: [
      { id: 'assorbimento', nome: 'Assorbimento' }, { id: 'mediano', nome: 'Mediano' }, { id: 'distanziamento', nome: 'Distanziamento critico' },
    ],
    modo: [
      { id: 'imitatio',  nome: 'Imitatio',  descr: 'Emulazione fedele del modello.' },
      { id: 'aemulatio', nome: 'Aemulatio', descr: 'Gara con il modello per superarlo.' },
    ],
    // Lettura del rapporto intertestuale data da visibilità × postura.
    quadranti: {
      'esplicito|distanziamento': 'Citazione critica / parodia',
      'implicito|distanziamento': 'Allusione ironica',
      'implicito|assorbimento': 'Influenza inconscia',
      'esplicito|assorbimento': 'Imitazione dichiarata',
    },
    // Domande che orientano la compilazione (non griglia rigida).
    bussola: [
      'C’è un ipotesto (modello) riconoscibile alla base del passo? Quale?',
      'Il rapporto col modello è trasformazione o imitazione?',
      'Il tono verso il modello è serio, satirico o ludico?',
      'Quanto è visibile il rimando? Il passo funziona anche senza riconoscerlo?',
      'Che cosa fa l’autore del modello: lo continua, lo supera (aemulatio), lo rovescia?',
    ],
  };
  function getPratica(id) { return IPERTESTO.pratiche.find(function (p) { return p.id === id; }); }
  function letturaRapporto(vis, post) {
    if (!vis || !post || vis === 'mediano' || post === 'mediano') return '';
    return IPERTESTO.quadranti[vis + '|' + post] || '';
  }

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
    IPERTESTO: IPERTESTO,
    getLivello: getLivello,
    getCategoria: getCategoria,
    getImportanza: getImportanza,
    getPratica: getPratica,
    letturaRapporto: letturaRapporto,
    versione: '1.1',
  };

})(typeof window !== 'undefined' ? window : this);
