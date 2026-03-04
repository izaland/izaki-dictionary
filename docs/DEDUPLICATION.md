# 🔧 Dictionary Maintenance Guide

Questo documento spiega come usare il sistema automatico di manutenzione del dizionario.

## 🐛 Problemi Risolti

Il workflow automatico risolve questi problemi comuni:

### 1. 🏷️ Lemma Errati nei Composti
**Problema**: I composti mostrano l'inglese invece della lettura Izaki
```
entertainment 遊學 【—】 <compound>
EN: entertainment
```

**Dovrebbe essere**:
```
yūgaku 遊學 【/yūgaku/】 <compound>
EN: entertainment
```

### 2. 🔄 Duplicati
**Problema**: Stessa entry appare più volte con tag diversi
```
ankuku 安國 【—】 <n>
ankuku 安國 【/ankuku/】 <compound>
```

### 3. ❌ IPA Mancanti
**Problema**: Entry senza trascrizione IPA (`【—】`)

---

## 🚀 Esecuzione Manuale (Consigliata)

### Via GitHub Actions (Web Interface)

1. **Vai alla tab Actions**
   - Apri: https://github.com/izaland/izaki-dictionary/actions

2. **Seleziona il workflow**
   - Nella sidebar sinistra: "**Deduplicate Dictionary**"

3. **Clicca "Run workflow"**
   - Pulsante in alto a destra (dropdown grigio)
   - Assicurati branch: **`main`**
   
4. **Opzioni disponibili**:
   - ☑️ **Create Pull Request**: Crea PR per revisione (consigliato prima volta)
   - ☑️ **Fix compound lemmas**: Corregge i lemma errati (default: abilitato)

5. **Clicca il pulsante verde "Run workflow"**

6. **Aspetta (~30-60 secondi)**

7. **Controlla i risultati**
   - Clicca sul workflow completato
   - Tab **"Summary"** mostra:
     - Quanti lemma corretti
     - Quanti duplicati rimossi
     - Quanti IPA generati

---

## 📊 Report di Esempio

```
## Compound Lemma Fix
📖 Reading data/dictionary.json...
   Loaded 5234 entries

📋 Reading data/compounds.csv...
   Loaded 3847 compound mappings

🔧 Fixing entries...
   ✓ Fixing: entertainment → yūgaku (遊學)
   ✓ Fixing: erudition → hakugaku (博學)
   ✓ Fixing: ethics → ryongaku (倫理學)

📊 Summary:
   Fixed entries: 1247
   Errors found: 0

## Deduplication Results
🔄 Merging 2 entries for 'ankuku' (安國)
  ✓ Generated IPA for 'ankuku': /ankuku/

📊 Summary:
   Total entries processed: 5234
   Duplicate groups found: 147
   Final entries: 5087
   Entries removed: 147
```

---

## 🤖 Esecuzione Automatica (Opzionale)

Per abilitare l'esecuzione automatica ad ogni modifica:

1. **Apri il file workflow**:
   ```
   .github/workflows/deduplicate-dictionary.yml
   ```

2. **Decommenta le righe** (circa linea 16-21):
   ```yaml
   push:
     branches:
       - main
     paths:
       - 'data/dictionary.json'
       - 'data/compounds.csv'
   ```

3. **Commit e push**

Da quel momento, ogni modifica a `dictionary.json` o `compounds.csv` attiverà automaticamente il workflow.

⚠️ **Attenzione**: Con auto-trigger attivo, le modifiche avvengono senza revisione manuale.

---

## 🛠️ Esecuzione Locale (Avanzato)

Se preferisci eseguire gli script localmente:

### Riparare Lemma Errati
```bash
python scripts/fix_compound_lemmas.py
```

### Rimuovere Duplicati
```bash
python scripts/check_duplicates.py  # Diagnostica
python scripts/deduplicate_dictionary.py  # Riparazione
```

### Workflow Completo
```bash
# 1. Ripara lemma
python scripts/fix_compound_lemmas.py

# 2. Rimuovi duplicati e genera IPA
python scripts/deduplicate_dictionary.py

# 3. Commit
git add data/dictionary.json
git commit -m "Fix dictionary issues"
git push
```

---

## 📋 Opzioni del Workflow

| Parametro | Tipo | Default | Descrizione |
|-----------|------|---------|-------------|
| `create_pr` | boolean | `false` | Crea Pull Request invece di commit diretto |
| `fix_lemmas` | boolean | `true` | Corregge lemma errati prima della deduplicazione |

### Quando Usare PR vs Commit Diretto

**Commit Diretto** (`create_pr: false`):
- ✅ Modifiche automatiche e veloci
- ✅ Dizionario si aggiorna immediatamente
- ❌ Nessuna revisione manuale

**Pull Request** (`create_pr: true`):
- ✅ Revisione manuale delle modifiche
- ✅ Vedere il diff prima del merge
- ✅ Più sicuro per grandi cambiamenti
- ❌ Richiede approvazione manuale

---

## 🔍 Cosa Fanno Gli Script

### 1. `fix_compound_lemmas.py`

**Identifica**:
- Entry compound con lemma che contiene solo caratteri ASCII
- Lemma che sembrano essere inglese invece di lettura Izaki

**Ripara**:
- Legge `compounds.csv` per trovare la lettura corretta
- Sostituisce il lemma con la lettura Izaki appropriata
- Mantiene tutte le altre informazioni intatte

**Esempio**:
```python
# Prima
{
  "lemma": "entertainment",  # ❌ ERRORE
  "byakuzhi": "遊學",
  "english": ["entertainment"]
}

# Dopo
{
  "lemma": "yūgaku",  # ✅ CORRETTO
  "byakuzhi": "遊學",
  "english": ["entertainment"]
}
```

### 2. `deduplicate_dictionary.py`

**Identifica**:
- Duplicati per chiave `(lemma, byakuzhi)`

**Unisce**:
1. Preferisce entry con IPA già generato
2. Combina tutte le traduzioni (EN + IT)
3. Mantiene il tag più appropriato
4. Genera IPA mancanti

**Backup**:
- Crea `dictionary_backup.json` prima di modificare

---

## 🐛 Troubleshooting

### Workflow Fallisce

**Errore: "Permission denied"**
- Settings → Actions → General → Workflow permissions
- Seleziona "Read and write permissions"

**Errore: "Python module not found"**
- Verifica che gli script esistano in `scripts/`
- Controlla syntax errors negli script

**Errore: "No mapping found for ..."**
- Verifica che `compounds.csv` contenga quella entry
- Controlla che la colonna "Izaki Reading" non sia vuota

### Rollback Modifiche

**Da backup**:
```bash
mv data/dictionary_backup.json data/dictionary.json
# oppure
mv data/dictionary_backup_lemma.json data/dictionary.json

git add data/dictionary.json
git commit -m "Rollback dictionary changes"
git push
```

**Da Git history**:
```bash
git log --oneline  # Trova commit precedente
git checkout <commit-hash> -- data/dictionary.json
git commit -m "Rollback to previous dictionary"
git push
```

---

## 💡 Best Practices

1. **Prima esecuzione**: Usa **PR mode** per vedere cosa succede
2. **Verifica compounds.csv**: Assicurati che tutti i composti abbiano "Izaki Reading"
3. **Controlla i report**: Leggi sempre il workflow summary
4. **Backup automatici**: Gli script creano sempre backup prima di modificare
5. **Esecuzione regolare**: Esegui dopo grandi modifiche al dizionario

---

## 🔗 Link Utili

- [Actions Dashboard](https://github.com/izaland/izaki-dictionary/actions)
- [Workflow File](https://github.com/izaland/izaki-dictionary/blob/main/.github/workflows/deduplicate-dictionary.yml)
- [Scripts README](https://github.com/izaland/izaki-dictionary/blob/main/scripts/README.md)
- [fix_compound_lemmas.py](https://github.com/izaland/izaki-dictionary/blob/main/scripts/fix_compound_lemmas.py)
- [deduplicate_dictionary.py](https://github.com/izaland/izaki-dictionary/blob/main/scripts/deduplicate_dictionary.py)
