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

### 2. `deduplicate_dictionary.py` ✨ NUOVO
**Scopo**: Rimuove duplicati e risolve problemi di IPA mancanti

```bash
python scripts/deduplicate_dictionary.py
```

**Cosa fa:**
- Identifica entry duplicate per stessa combinazione (lemma, byakuzhi)
- Unisce intelligentemente i duplicati:
  - Preferisce entry con IPA già generato
  - Combina tutte le traduzioni (inglese e italiano)
  - Gestisce tag `<n>` vs `<compound>` in modo appropriato
- Auto-genera IPA mancanti (se `generate_ipa.py` è disponibile)
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
   Final entries: 5087
   Entries removed: 147
```

---

### 3. `generate_ipa.py`
**Scopo**: Genera trascrizioni IPA dalla lettura latina

```bash
python scripts/generate_ipa.py
```

**Cosa fa:**
- Legge `data/dictionary.json`
- Per ogni entry senza IPA, genera la trascrizione fonetica
- Aggiorna il file con le nuove trascrizioni

**Funzione importabile:**
```python
from generate_ipa import latin_to_ipa

ipa = latin_to_ipa("ankuku")
print(ipa)  # Output: /ɑnkuku/
```

---

### 4. JavaScript Scripts

#### `lookup.js`
Script per la pagina di ricerca byakuzhi:
- Conversione byakuzhi → latino/IPA/Askaoza (forward)
- Ricerca inversa: latino → byakuzhi (reverse)
- Applicazione regole fonetiche contestuali

#### `reconstruction.js` ✨ NUOVO
Sistema di ricostruzione lettura da byakuzhi:
- Applica regole fonetiche da `lookup.js`
- Ricostruisce lettura completa con trasformazioni contestuali
- Output in 3 formati: Latino, IPA, Askaoza

**Uso nel codice:**
```javascript
const readings = reconstructReading('日本');
console.log(readings.latin);    // "nispon"
console.log(readings.ipa);      // "[nispon]"
console.log(readings.askaoza);  // "સિસ્પોસ"
```

#### `askaoza.js`
Conversione alfabeto latino → Askaoza (sistema di scrittura izaki)

#### `script.js`
Script generale per navbar, theme toggle, ecc.

---

## 📈 Workflow Consigliato

### Aggiornamento Dizionario

1. **Modifica i dati sorgente**
   - Aggiungi/modifica entries in `data/dictionary.json` (parole native)
   - Aggiungi nuovi composti in `data/compounds.csv`

2. **Build dizionario completo**
   ```bash
   python scripts/build_dictionary.py
   ```

3. **Rimuovi duplicati e genera IPA**
   ```bash
   python scripts/deduplicate_dictionary.py
   ```

4. **Verifica risultati**
   - Controlla `data/dictionary.json`
   - Se qualcosa va storto, ripristina da `data/dictionary_backup.json`

5. **Commit e push**
   ```bash
   git add data/dictionary.json
   git commit -m "Update dictionary: add new entries and deduplicate"
   git push
   ```

---

## 🐛 Troubleshooting

### Problema: Duplicati dopo build
**Soluzione**: Esegui `deduplicate_dictionary.py`

### Problema: IPA mancanti (【—】)
**Soluzione**: 
1. Assicurati che `generate_ipa.py` sia funzionante
2. Esegui `deduplicate_dictionary.py` che auto-genera IPA

### Problema: Tag errati (<n> vs <compound>)
**Soluzione**: Lo script di deduplicazione risolve automaticamente questi conflitti

### Problema: Script fallisce
**Verifica**:
- Python 3.7+ installato
- File JSON valido (controlla con un JSON validator)
- Permessi di scrittura sulla directory `data/`

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
  "askaoza": "સ્પશુ",
  "notes": "compound",
  "example": ""
}
```

### Chiave di Deduplicazione
Gli entry vengono considerati duplicati se hanno:
- Stesso `lemma` (lettura latina)
- Stesso `byakuzhi` (caratteri)

Quindi `ankuku 安國` è diverso da `ankuku 安国` anche se hanno stesso lemma.

---

## ℹ️ Maggiori Informazioni

Per dettagli sul formato dati e sulla struttura del dizionario, vedi:
- [Documentazione principale](../README.md)
- [Pagina dizionario](https://izaland.github.io/izaki-dictionary/)
