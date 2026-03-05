# 🚨 EMERGENCY ROLLBACK INSTRUCTIONS

## Il Problema

Lo script `deduplicate_dictionary.py` ha **rimosso 10,844 entries** invece di rimuovere solo i veri duplicati!

**Cause**:
- Lo script raggruppa per `(lemma, byakuzhi)`
- Le entry **native** (parole Izaki originali) hanno `byakuzhi` **vuoto** ("") 
- Quindi tutte le ~10000 parole native sono state considerate come **UN UNICO GRUPPO DI DUPLICATI**
- Solo la prima entry di ogni gruppo è stata mantenuta

**Risultato**: Dizionario ridotto da 14,804 → 3,960 entries ❌

**Status**: ✅ **BUG RISOLTO** nel commit `f44de1904bd513a24ba1620970692b0d3e687992`

---

## ✅ SOLUZIONE: Rollback Automatico via GitHub Actions

### 🚀 Metodo Consigliato (Nessun Git Locale Richiesto!)

1. **Vai su GitHub Actions**:
   https://github.com/izaland/izaki-dictionary/actions/workflows/rollback-dictionary.yml

2. **Clicca "Run workflow"** (pulsante in alto a destra)

3. **Compila i parametri**:
   - **Branch**: `main` (lascia default)
   - **commit_sha**: `1d69383d8f006de84c5461f6be21e4d9b6985d00`
   - **create_pr**: ☑️ `true` (consigliato per revisione)

4. **Clicca "Run workflow"** (pulsante verde)

5. **Aspetta ~30 secondi**

6. **Controlla il workflow summary**:
   - Vedi quante entries sono state ripristinate
   - Verifica che il count passi da 3,960 → 14,804

7. **Se create_pr = true**:
   - Vai su Pull Requests
   - Troverai una PR "🚑 Emergency Rollback"
   - Controlla le statistiche
   - Merge quando sei sicuro

8. **Se create_pr = false**:
   - Il rollback è già su `main`
   - Controlla che il dizionario sia tornato a 14,804 entries

---

## 💻 Alternative (Se hai Git Locale)

### Opzione A: Script Python Automatico

```bash
cd /path/to/izaki-dictionary

# Scarica e applica il rollback
python scripts/rollback_to_commit.py 1d69383d8f006de84c5461f6be21e4d9b6985d00

# Lo script:
# - Scarica il file dal commit
# - Valida il JSON
# - Crea backup automatico
# - Scrive il file ripristinato

# Verifica
python scripts/diagnose_structure.py

# Commit
git add data/dictionary.json
git commit -m "🚑 ROLLBACK: Restore dictionary before bad deduplication"
git push
```

### Opzione B: Git Checkout Manuale

```bash
cd /path/to/izaki-dictionary

# Ripristina dictionary.json dal commit precedente
git checkout 1d69383d8f006de84c5461f6be21e4d9b6985d00 -- data/dictionary.json

# Verifica
git diff HEAD data/dictionary.json | head -20

# Commit
git add data/dictionary.json
git commit -m "🚑 ROLLBACK: Restore 14,804 entries

Reverts dictionary.json to commit 1d69383d8f006de84c5461f6be21e4d9b6985d00
before the problematic deduplication that removed 10,844 valid entries.

The deduplication script had a critical bug where it treated all native
words (with empty byakuzhi) as a single duplicate group.

Restores: 14,804 entries (from broken 3,960)"

git push
```

### Opzione C: GitHub CLI

```bash
# Clona repository
gh repo clone izaland/izaki-dictionary
cd izaki-dictionary

# Rollback
git checkout 1d69383d8f006de84c5461f6be21e4d9b6985d00 -- data/dictionary.json

# Commit e push
git add data/dictionary.json
git commit -m "🚑 ROLLBACK: Restore dictionary before bad deduplication"
git push
```

---

## 📊 Verifica Post-Rollback

Dopo il rollback, verifica che il dizionario sia corretto:

```bash
python scripts/diagnose_structure.py
```

**Aspettati**:
```
📊 Total entries: 14804
📝 Entries by 'notes' field:
   compound: 10838
   (native words): 3966
```

**O cerca nel dizionario**:
- Vai su: https://izaland.github.io/izaki-dictionary/
- Cerca una parola comune
- Verifica che ci siano ~14k entries invece di ~4k

---

## 🔧 Dopo il Rollback: Cosa Fare

### ✅ Il Bug È GIÀ STATO RISOLTO!

Commit fix: `f44de1904bd513a24ba1620970692b0d3e687992`

**Cambiamenti**:
- ✅ Native words (senza byakuzhi) **NON vengono più raggruppate**
- ✅ Solo compounds (con byakuzhi) possono essere deduplicate
- ✅ Lo script mostra: "Native words: X | Compounds: Y"
- ✅ Impossibile cancellare accidentalmente parole native

### Workflow Sicuri da Eseguire

**1. Genera IPA mancanti** (SICURO - non rimuove nulla):
```bash
python scripts/generate_missing_ipa.py
```

Oppure via Actions:
- Actions → "Generate Missing IPA" → Run workflow

**2. Deduplica compounds** (ORA SICURO - il bug è risolto!):
```bash
python scripts/check_duplicates.py  # Prima verifica
python scripts/deduplicate_dictionary.py  # Solo se ci sono VERI duplicati
```

Oppure via Actions:
- Actions → "Deduplicate Dictionary" → Run workflow

---

## ⚠️ IMPORTANTE: Verifiche Prima di Eseguire Script

Prima di eseguire `deduplicate_dictionary.py`, verifica che contenga:

```python
# Cerca questa sezione nel file:
for entry in entries:
    byakuzhi = entry.get('byakuzhi', '').strip()
    
    if not byakuzhi:
        # Native word - always unique, just generate IPA
        native_words.append(generate_ipa_if_missing(entry))
    else:
        # Compound - may need deduplication
        compounds.append(entry)
```

Se **NON** vedi questa separazione → **NON ESEGUIRE** lo script!

---

## 🐛 Troubleshooting

### Workflow "Rollback Dictionary" non appare
- Aspetta 30-60 secondi dopo il commit del workflow
- Refresh la pagina Actions
- Verifica che il file `.github/workflows/rollback-dictionary.yml` esista

### Script Python fallisce con "Module not found"
- Assicurati di essere nella root del repository
- Usa Python 3.7+
- Gli script usano solo librerie standard (json, urllib)

### Rollback non cambia il dizionario
- Verifica il commit SHA sia corretto
- Controlla il workflow summary per errori
- Il commit potrebbe già avere la versione corretta

### Dopo rollback, count è ancora 3,960
- Verifica che il rollback sia stato pushato
- Pulisci cache browser (Ctrl+Shift+R)
- Controlla che il file su GitHub sia effettivamente cambiato

---

## 📝 Commit di Riferimento

- **Commit BUONO** (prima della cancellazione): `1d69383d8f006de84c5461f6be21e4d9b6985d00`
- **Commit CATTIVO** (dopo cancellazione): `222d704702d0627aea2a0110cb7ec57b2387c8c4`
- **Commit FIX** (bug risolto): `f44de1904bd513a24ba1620970692b0d3e687992`

---

## 📞 Contatti

Se hai problemi con il rollback, apri un issue su GitHub con:
- Log del workflow (se usi Actions)
- Output dello script (se usi Python locale)
- Numero di entries prima/dopo
