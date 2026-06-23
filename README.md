# Analisi del Testo · Officina critica

Strumento di **Digital Humanities** per l'analisi stratificata del testo
letterario — **poesia e prosa**, livello **liceale e universitario**.

Si lavora **con il testo davanti** (incollato ed evidenziabile) oppure
**con il libro a fianco** (annotazioni con riferimento manuale a versi,
righi, pagina). Le osservazioni si raccolgono come *evidenziature commentate*,
classificate per **livello di analisi**, **categoria** e **importanza** — niente
tokenizzazione, solo un apparato critico ordinato, sempre con te.

L'identità visiva (palette indaco, carta avorio, serif *Playfair / Source Serif*)
riprende quella di **Poetrify**.

---

## I quattro livelli di analisi

| Livello | Colore | Che cosa raccoglie |
|---|---|---|
| **Stilistico-retorica** | indaco | Repertorio di ~100 figure in 6 famiglie (suono, sintassi, significato, pensiero, amplificazione, metaplasmi) + stile e metrica. Ogni figura ha definizione + esempio mostrati come promemoria sfumato |
| **Semantico-lessicale** | verde | Campi e sfere semantiche, temi/motivi, scelta lessicale, sensi e connotazione |
| **Pragmatico-espressiva** | azzurro | Funzioni linguistiche, enunciazione e deissi, tono/modalità/intenzione, implicito |
| **Ipertestuale** | seppia | Le 5 relazioni di Genette (intertestualità, ipertestualità, architestualità, paratestualità, metatestualità) + compilazione riflessiva guidata |

Ogni livello ha un **repertorio di voci** (figure retoriche, sfere, funzioni…)
con definizione in tooltip — tutto definito in [`data/taxonomy.js`](data/taxonomy.js)
e pensato per essere **ampliato**.

Ogni annotazione porta:
- un **riferimento** (porzione di testo evidenziata *oppure* citazione manuale);
- **livello → categoria → voce/figura**;
- **tag liberi** (sfera semantica, tema, parola-chiave…);
- un **livello di importanza** (Chiave / Rilevante / Spunto);
- un **commento** critico;
- per l'ipertestuale, un **rimando** a un altro passo in archivio o libero.

Le note si possono raggruppare **per livello** (e categoria), **per importanza**
o **in sequenza** nel testo, e filtrare per livello, importanza o ricerca testuale.

### Il livello ipertestuale: compilazione riflessiva

Quando si annota un rimando, oltre a *categoria* e *voce* si compilano dimensioni
qualitative che traducono in pratica il quadro di Genette/Kristeva e guidano una
lettura non generica:

- **Ipotesto / modello** — il testo di riferimento (un passo in archivio o libero);
- **Ambito** — stessa opera · stesso autore · altro autore · tradizione/fortuna;
- **Pratica ipertestuale** — Parodia, Travestimento, Trasposizione, Pastiche, Charge,
  Continuazione: la scelta deriva automaticamente **operazione** (trasformazione/imitazione)
  e **tono** (ludico/satirico/serio);
- **Visibilità × Postura** — i due assi (implicito↔esplicito, assorbimento↔distanziamento)
  da cui lo strumento calcola la **lettura del rapporto** (citazione critica/parodia,
  allusione ironica, influenza inconscia, imitazione dichiarata);
- **Modo** — imitatio / aemulatio;
- **Bussola riflessiva** — cinque domande che orientano la compilazione esaustiva.

Tutte le voci e le dimensioni stanno in [`data/taxonomy.js`](data/taxonomy.js) (oggetto `IPERTESTO`)
e sono facilmente ampliabili.

---

## Come si usa

1. **Nuovo passo** → autore, opera, titolo, genere (poesia/prosa/teatro), lingua, modalità.
2. **Con testo**: incolla il passo → *Rendi analizzabile*. In poesia ogni riga è un
   verso numerato. **Seleziona** una porzione e premi *Annota selezione*.
   **Libro a fianco**: usa *＋ Annota* e indica il luogo a mano.
3. Le annotazioni compaiono nel pannello di destra, classificate e filtrabili.
4. **Esporta / Importa** in JSON per backup o per portare l'archivio su un altro dispositivo.

Tutto è salvato in `localStorage` del browser: nessun server, nessun account.

---

## Architettura

```
analisi-testo/
├─ index.html            ← hub (Analisi · Commento · Interpretazione guidata)
├─ analisi.html          ← lo strumento di analisi (Fase 1)
├─ commento.html         ← l'officina del commento (Fase 2)
├─ assets/
│   ├─ design.css        ← design system (token Poetrify + componenti)
│   ├─ app.js            ← logica Analisi: stato, evidenziatura, form, filtri, import/export
│   └─ commento.js       ← logica Commento: fasi, materiali, autosalvataggio, export
├─ data/
│   ├─ taxonomy.js       ← i 4 livelli, le categorie e il repertorio di voci
│   └─ commento.js       ← il protocollo di commento (moderno + filologico) e il vademecum
└─ .github/workflows/
    └─ deploy.yml        ← pubblicazione automatica su GitHub Pages
```

Sito statico puro (nessuna dipendenza, nessun build). Funziona anche aperto da
`file://`; i font sono Google Fonts con fallback serif di sistema.

## Commento (Fase 2)

L'officina del commento ([`commento.html`](commento.html)) trasforma il metodo di
analisi letteraria in una **composizione guidata per fasi**, alimentata dalle
annotazioni raccolte:

1. Inquadramento e contesto · 2. Parafrasi · 3. Livello formale e stilistico ·
   4. Livello retorico e semantico · 5. Interpretazione critica.

Per i testi **greci e latini** il protocollo diventa **commento filologico-letterario**
(critica del testo · morfosintassi e lessico · metrica e prosodia · intertestualità ·
contesto antropologico), con le **tre domande chiave** filologia → letteratura → storia.
Il protocollo giusto si attiva da solo in base alla lingua del passo.

Ogni fase mostra l'obiettivo, l'**errore da evitare**, e i **materiali raccolti**
(le annotazioni pertinenti a quel livello), inseribili nel commento con un clic.
Una barra di avanzamento misura i campi compilati; il commento si esporta in Markdown.
In testa, il **vademecum** e il principio *«la forma è contenuto»*.

## Fasi successive (previste)

- **Fase 3 — Interpretazione guidata**: percorso di domande dall'osservazione
  all'ipotesi interpretativa argomentata.

## Deploy

A ogni `git push` sul branch principale, GitHub Actions pubblica il sito su
GitHub Pages. Requisito una-tantum: **Settings ▸ Pages ▸ Source = "GitHub Actions"**.
