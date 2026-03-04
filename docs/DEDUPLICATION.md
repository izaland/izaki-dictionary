# 🔧 Dictionary Deduplication Guide

Questo documento spiega come usare il sistema automatico di deduplicazione del dizionario.

## 🚀 Esecuzione Manuale (Consigliata)

### Tramite GitHub Actions (Web Interface)

1. **Vai alla tab Actions**
   - Apri: https://github.com/izaland/izaki-dictionary/actions

2. **Seleziona il workflow "Deduplicate Dictionary"**
   - Nella sidebar sinistra, clicca su "Deduplicate Dictionary"

3. **Clicca "Run workflow"**
   - Pulsante in alto a destra (dropdown grigio)
   - Scegli il branch: `main`
   - **Opzione "Create Pull Request"**:
     - ☐ **Disabilitato** (default): Commit diretto su main
     - ☑️ **Abilitato**: Crea una PR per revisione manuale

4. **Clicca il pulsante verde "Run workflow"**

5. **Attendi il completamento** (~30 secondi)
   - Verde ✅ = Successo
   - Rosso ❌ = Errore (controlla i log)

6. **Verifica i risultati**
   - Clicca sul workflow completato
   - Vai alla tab "Summary"
   - Vedrai il report completo con statistiche

### Report di Esempio

```
## Duplicate Check Report
🔍 Found 147 duplicate groups:

1. ankuku 安國
   [1] 【—】              <n>             EN: Ankuni
   [2] /ankuku/          <compound>      EN: Ankuni

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

Per abilitare l'esecuzione automatica ad ogni modifica dei dati:

1. **Apri il file workflow**
   ```
   .github/workflows/deduplicate-dictionary.yml
   ```

2. **Decommenta le righe dell'auto-trigger**
   
   Trova queste righe (circa linea 13-17):
   ```yaml
   # push:
   #   branches:
   #     - main
   #   paths:
   #     - 'data/dictionary.json'
   #     - 'data/compounds.csv'
   ```
   
   Rimuovi i `#` per attivarle:
   ```yaml
   push:
     branches:
       - main
     paths:
       - 'data/dictionary.json'
       - 'data/compounds.csv'
   ```

3. **Commit e push** la modifica

4. **Da quel momento**, ogni volta che modifichi `dictionary.json` o `compounds.csv`, il workflow si attiverà automaticamente

⚠️ **Attenzione**: Con auto-trigger attivo, i duplicati vengono rimossi automaticamente senza revisione manuale. Considera di abilitare l'opzione PR.

---

## 🛠️ Esecuzione Locale (Avanzato)

Se preferisci eseguire lo script in locale:

```bash
# Clone repository
git clone https://github.com/izaland/izaki-dictionary.git
cd izaki-dictionary

# Controlla duplicati
python scripts/check_duplicates.py

# Esegui deduplicazione
python scripts/deduplicate_dictionary.py

# Commit e push
git add data/dictionary.json
git commit -m "Remove duplicates"
git push
```

---

## 📋 Opzioni del Workflow

### Input Parametri

| Parametro | Tipo | Default | Descrizione |
|-----------|------|---------|-------------|
| `create_pr` | boolean | `false` | Se `true`, crea una Pull Request invece di commit diretto |

### Quando Usare PR vs Commit Diretto

**Commit Diretto** (`create_pr: false`):
- ✅ Modifiche automatiche e veloci
- ✅ Fiducia completa nello script
- ✅ Dizionario si aggiorna immediatamente
- ❌ Nessuna revisione manuale

**Pull Request** (`create_pr: true`):
- ✅ Revisione manuale delle modifiche
- ✅ Possibilità di vedere il diff prima del merge
- ✅ Più sicuro per modifiche complesse
- ❌ Richiede approvazione manuale
- ❌ Dizionario non si aggiorna subito

---

## 🔍 Cosa Fa lo Script

### 1. Identificazione Duplicati
Ragruppa entry per chiave `(lemma, byakuzhi)`:
- `ankuku` + `安國` = duplicate
- `ankuku` + `安国` = NON duplicate (caratteri diversi)

### 2. Merge Intelligente
Quando trova duplicati:
1. **Preferisce** l'entry con IPA già generato
2. **Combina** tutte le traduzioni (EN + IT)
3. **Mantiene** il tag più appropriato
4. **Genera IPA** per entry che non lo hanno

### 3. Backup
Prima di modificare:
- Salva `data/dictionary_backup.json`
- Permette rollback in caso di problemi

---

## 🐛 Troubleshooting

### Workflow Fallisce

**Errore: "Permission denied"**
- Verifica che il workflow abbia permessi di scrittura
- Settings → Actions → General → Workflow permissions
- Seleziona "Read and write permissions"

**Errore: "Python module not found"**
- Controlla che `scripts/deduplicate_dictionary.py` esista
- Verifica syntax errors nello script Python

**Errore: "No changes to commit"**
- ✅ Questo è OK! Significa che non c'erano duplicati

### Rollback Modifiche

Se qualcosa va storto:

```bash
# Ripristina da backup
mv data/dictionary_backup.json data/dictionary.json
git add data/dictionary.json
git commit -m "Rollback deduplication"
git push
```

O tramite Git history:

```bash
# Trova commit precedente
git log --oneline

# Ripristina file specifico
git checkout <commit-hash> -- data/dictionary.json
git commit -m "Rollback to previous dictionary"
git push
```

---

## 📊 Statistiche e Report

Dopo ogni esecuzione, il workflow genera:

1. **Summary Report** nella tab Actions
   - Numero duplicati trovati
   - Entry rimosse
   - IPA generati

2. **Commit Message** dettagliato
   - Include statistiche
   - Timestamp esecuzione

3. **Backup File** (`dictionary_backup.json`)
   - Versione pre-deduplicazione
   - Per sicurezza e rollback

---

## 💡 Best Practices

1. **Esegui manualmente** dopo grandi modifiche al dizionario
2. **Usa PR mode** la prima volta per verificare i risultati
3. **Controlla il report** nel workflow summary
4. **Tieni il backup** per almeno un commit
5. **Non editare manualmente** `dictionary_backup.json`

---

## 🔗 Link Utili

- [Actions Dashboard](https://github.com/izaland/izaki-dictionary/actions)
- [Workflow File](https://github.com/izaland/izaki-dictionary/blob/main/.github/workflows/deduplicate-dictionary.yml)
- [Script Source](https://github.com/izaland/izaki-dictionary/blob/main/scripts/deduplicate_dictionary.py)
- [Scripts README](https://github.com/izaland/izaki-dictionary/blob/main/scripts/README.md)
