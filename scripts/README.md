# Scripts Documentation

Questa directory contiene gli script per la gestione e manutenzione del dizionario Izaki.

## 🛠️ Script Disponibili

### 1. `build_dictionary.py`
**Scopo**: Costruisce il dizionario completo unendo parole native e composti

```bash
python scripts/build_dictionary.py
```

**Cosa fa:**
- Legge `data/dictionary.json` (parole native)
- Legge `data/compounds.csv` (composti)
- Filtra i composti già esistenti per evitare duplicati
- Unisce tutto in un nuovo `data/dictionary.json`

**Quando usarlo**: Dopo aver aggiornato il file `compounds.csv`

---

### 2. `fix_compound_lemmas.py` ✨ NUOVO
**Scopo**: Corregge entry compound con lemma errato (inglese invece di lettura Izaki)

```bash
python scripts/fix_compound_lemmas.py
```

**Cosa fa:**
- Scansiona tutte le entry con `byakuzhi`
- Identifica lemma contenenti solo ASCII (probabilmente inglese)
- Sostituisce con la lettura corretta da `compounds.csv`
- Aggiunge tag `compound` alle entry che ne sono prive
- Crea backup in `data/dictionary_backup_lemma.json`

**Quando usarlo**:
- Dopo import iniziale da CSV
- Se noti entry come `entertainment 遊學` invece di `yūgaku 遊學`

**Output di esempio:**
```
🔧 Fixing entries...
   ✓ Fixing: entertainment → yūgaku (遊學)
   ✓ Fixing: erudition → hakugaku (博學)

📊 Summary:
   Fixed lemma entries: 1247
   Added 'compound' tags: 10838
```

---

### 3. `deduplicate_dictionary.py`
**Scopo**: Rimuove duplicati e genera IPA mancanti

```bash
python scripts/deduplicate_dictionary.py
```

**Cosa fa:**
- Identifica entry duplicate per stessa combinazione (lemma, byakuzhi)
- Unisce intelligentemente i duplicati:
  - Preferisce entry con IPA già generato
  - Combina tutte le traduzioni (inglese e italiano)
  - Gestisce tag `<n>` vs `<compound>` in modo appropriato
- Auto-genera IPA mancanti usando regole fonetiche integrate
- Crea backup automatico in `data/dictionary_backup.json`

**Quando usarlo**: 
- Dopo aver fatto build con `build_dictionary.py`
- Quando noti duplicati nel dizionario
- Prima di pubblicare una nuova versione

**Output di esempio:**
```
🔄 Merging 2 entries for 'ankuku' (安國)
   [1] IPA: 【—】, Notes: 
   [2] IPA: /ankuku/, Notes: compound
  ✓ Generated IPA for 'ankuku': /ankuku/

📊 Summary:
   Total entries processed: 5234
   Duplicate groups found: 147
   IPA generated: 2341
   Final entries: 5087
   Entries removed: 147
```

---

### 4. `generate_missing_ipa.py` ✨ NUOVO
**Scopo**: Genera IPA per tutte le entry che ne sono prive

```bash
python scripts/generate_missing_ipa.py
```

**Cosa fa:**
- Scansiona tutte le entry del dizionario
- Identifica IPA mancanti o placeholder (【—】, caratteri Gujarati, etc.)
- Genera IPA basandosi sul campo `lemma`
- Applica regole fonetiche Izaki
- Crea backup in `data/dictionary_backup_ipa.json`

**Quando usarlo**:
- Dopo `fix_compound_lemmas.py` se molte entry hanno lemma corretto ma IPA mancante
- Se vedi 【—】 o caratteri strani al posto dell'IPA
- Come step finale di pulizia dizionario

**Output di esempio:**
```
🔍 Scanning for missing IPA...
   Found 10838 entries with missing IPA

🔧 Generating IPA...
  ✓ ampo → /ampo/
  ✓ anda → /anda/
  ✓ anhwi → /anhwi/
  ... (showing first 10, generating 10838 total)

📊 Summary:
   Total entries: 14804
   IPA generated: 10838
   Failed: 0
```

---

### 5. `check_duplicates.py`
**Scopo**: Diagnostica problemi nel dizionario senza modificarlo

```bash
python scripts/check_duplicates.py
```

**Cosa fa:**
- Scansiona il dizionario per duplicati
- Mostra statistiche dettagliate
- NON modifica il dizionario

**Quando usarlo**: Per controllare lo stato prima di eseguire correzioni

---

### 6. `diagnose_structure.py` ✨ NUOVO
**Scopo**: Analizza la struttura del dizionario per identificare problemi

```bash
python scripts/diagnose_structure.py
```

**Cosa fa:**
- Conta entry per tipo (notes field)
- Identifica entry con IPA mancanti
- Trova lemma contenenti solo ASCII (potenzialmente errati)
- Mostra esempi di problemi trovati

**Quando usarlo**: Prima di decidere quali script eseguire

---

### 7. `generate_ipa.py`
**Scopo**: Script originale per generazione IPA (deprecato, usare `generate_missing_ipa.py`)

---

### 8. JavaScript Scripts

#### `lookup.js`
Script per la pagina di ricerca byakuzhi:
- Conversione byakuzhi → latino/IPA/Askaoza (forward)
- Ricerca inversa: latino → byakuzhi (reverse)
- Applicazione regole fonetiche contestuali

#### `reconstruction.js`
Sistema di ricostruzione lettura da byakuzhi:
- Applica regole fonetiche da `lookup.js`
- Ricostruisce lettura completa con trasformazioni contestuali
- Output in 3 formati: Latino, IPA, Askaoza

#### `askaoza.js`
Conversione alfabeto latino → Askaoza (sistema di scrittura izaki)

#### `script.js`
Script generale per navbar, theme toggle, ecc.

---

## 📈 Workflow Completo (da CSV a Dizionario Pulito)

### Scenario: Hai appena importato compounds.csv

1. **Fix lemma errati**
   ```bash
   python scripts/fix_compound_lemmas.py
   ```
   → Corregge lemma inglesi e aggiunge tag compound

2. **Genera IPA mancanti**
   ```bash
   python scripts/generate_missing_ipa.py
   ```
   → Popola tutti i campi IPA vuoti

3. **Rimuovi duplicati** (se necessario)
   ```bash
   python scripts/check_duplicates.py  # Prima controlla
   python scripts/deduplicate_dictionary.py  # Poi rimuovi
   ```

4. **Verifica risultati**
   ```bash
   python scripts/diagnose_structure.py
   ```

5. **Commit**
   ```bash
   git add data/dictionary.json
   git commit -m "Fix dictionary: correct lemmas and generate IPA"
   git push
   ```

---

## 🚀 GitHub Actions Workflows

### Workflow: "Deduplicate Dictionary"
**File**: `.github/workflows/deduplicate-dictionary.yml`

**Cosa fa**:
1. Esegue `fix_compound_lemmas.py`
2. Esegue `check_duplicates.py`
3. Esegue `deduplicate_dictionary.py` (se ci sono duplicati)
4. Commit automatico o crea PR

**Come usarlo**:
- Vai su Actions → Deduplicate Dictionary → Run workflow
- Opzioni:
  - `fix_lemmas`: Corregge lemma prima (default: true)
  - `create_pr`: Crea PR invece di commit diretto (default: false)

---

### Workflow: "Generate Missing IPA" ✨ NUOVO
**File**: `.github/workflows/generate-ipa.yml`

**Cosa fa**:
1. Esegue `generate_missing_ipa.py`
2. Genera IPA per tutte le entry che ne sono prive
3. Commit automatico o crea PR

**Come usarlo**:
- Vai su Actions → Generate Missing IPA → Run workflow
- Opzioni:
  - `create_pr`: Crea PR invece di commit diretto (default: false)

**Quando usarlo**:
- Dopo aver eseguito fix_compound_lemmas
- Se il dizionario ha lemma corretti ma IPA mancanti
- Come step finale di pulizia

---

## 🐛 Troubleshooting

### Problema: Entry con lemma inglese invece di lettura Izaki
```
entertainment 遊學 【—】
```
**Soluzione**: `python scripts/fix_compound_lemmas.py`

### Problema: IPA mancanti (【—】 o caratteri strani)
```
anda 安打 ૮પ્ઠૃ 【—】
```
**Soluzione**: `python scripts/generate_missing_ipa.py`

### Problema: Duplicati
```
ankuku 安國 【—】 <n>
ankuku 安國 【/ankuku/】 <compound>
```
**Soluzione**: `python scripts/deduplicate_dictionary.py`

### Problema: Non so quale script usare
**Soluzione**: `python scripts/diagnose_structure.py`

### Problema: Script fallisce
**Verifica**:
- Python 3.7+ installato
- File JSON valido (controlla con un JSON validator)
- Permessi di scrittura sulla directory `data/`
- Se errore import: verifica che gli script siano nella directory `scripts/`

---

## 📝 Note Tecniche

### Formato Entry Dizionario
```json
{
  "lemma": "ankuku",
  "ipa": "/ankuku/",
  "pos": "n",
  "english": ["Ankuni"],
  "italian": [],
  "byakuzhi": "安國",
  "askaoza": "અંકુકુ",
  "notes": "compound",
  "example": ""
}
```

### Chiave di Deduplicazione
Gli entry vengono considerati duplicati se hanno:
- Stesso `lemma` (lettura latina)
- Stesso `byakuzhi` (caratteri)

Quindi `ankuku 安國` è diverso da `ankuku 安国` anche se hanno stesso lemma.

### Regole Fonetiche IPA
```python
ā → aː    # Vocali lunghe
ē → eː
ts → ts   # Affricati
ch → tɕ
sh → ʃ
ð → dz    # Speciale Izaki
```

---

## ℹ️ Maggiori Informazioni

Per dettagli sul formato dati e sulla struttura del dizionario, vedi:
- [Documentazione principale](../README.md)
- [Guida manutenzione completa](../docs/DEDUPLICATION.md)
- [Pagina dizionario](https://izaland.github.io/izaki-dictionary/)
