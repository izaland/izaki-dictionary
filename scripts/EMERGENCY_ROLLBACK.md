# 🚨 EMERGENCY ROLLBACK INSTRUCTIONS

## Il Problema

Lo script `deduplicate_dictionary.py` ha **rimosso 10,844 entries** invece di rimuovere solo i veri duplicati!

**Cause**:
- Lo script raggruppa per `(lemma, byakuzhi)`
- Le entry **native** (parole Izaki originali) hanno `byakuzhi` **vuoto** ("") 
- Quindi tutte le ~10000 parole native sono state considerate come **UN UNICO GRUPPO DI DUPLICATI**
- Solo la prima entry di ogni gruppo è stata mantenuta

**Risultato**: Dizionario ridotto da 14,804 → 3,960 entries ❌

---

## ✅ SOLUZIONE IMMEDIATA: Rollback

### Opzione 1: Via Git Locale (SE hai una copia locale)

```bash
cd /path/to/izaki-dictionary

# Ripristina dictionary.json dal commit precedente
git checkout 1d69383d8f006de84c5461f6be21e4d9b6985d00 -- data/dictionary.json

# Verifica
git diff HEAD data/dictionary.json | head -20

# Commit
git add data/dictionary.json
git commit -m "🚑 ROLLBACK: Restore dictionary.json before bad deduplication

Reverts dictionary.json to commit 1d69383d8f006de84c5461f6be21e4d9b6985d00
before the problematic deduplication that removed 10,844 valid entries.

The deduplication script had a critical bug where it treated all native
words (with empty byakuzhi) as a single duplicate group.

Restores: 14,804 entries (from broken 3,960)"

git push
```

### Opzione 2: Via GitHub Web UI

1. **Vai al commit buono**:
   https://github.com/izaland/izaki-dictionary/commit/1d69383d8f006de84c5461f6be21e4d9b6985d00

2. **Clicca su "Browse files"** (in alto a destra)

3. **Naviga a** `data/dictionary.json`

4. **Clicca "Raw"** o **"Download"**

5. **Salva il file localmente**

6. **Vai a**: https://github.com/izaland/izaki-dictionary/blob/main/data/dictionary.json

7. **Clicca l'icona matita** (Edit this file)

8. **Cancella tutto** e **incolla il contenuto** del file salvato

9. **Commit message**:
   ```
   🚑 ROLLBACK: Restore dictionary.json before bad deduplication
   
   Restores 14,804 entries (from broken 3,960)
   ```

10. **Commit**!

### Opzione 3: Via GitHub CLI

```bash
gh repo clone izaland/izaki-dictionary
cd izaki-dictionary

git checkout 1d69383d8f006de84c5461f6be21e4d9b6985d00 -- data/dictionary.json
git add data/dictionary.json
git commit -m "🚑 ROLLBACK: Restore dictionary before bad deduplication"
git push
```

---

## 🔧 Dopo il Rollback: Fix dello Script

Lo script `deduplicate_dictionary.py` è stato **già corretto** nei commit successivi.

Il nuovo script:
- **Ignora** entry con `byakuzhi` vuoto quando raggruppa
- Tratta le entry native (senza byakuzhi) come **sempre uniche**
- Raggruppa solo entry con **stesso lemma E stesso byakuzhi non-vuoto**

---

## ⚠️ IMPORTANTE: NON eseguire il vecchio workflow

Se il workflow `deduplicate-dictionary.yml` era già stato eseguito:
1. ✅ Fai il ROLLBACK prima
2. ✅ Verifica che lo script sia aggiornato
3. ✅ Poi puoi eseguire di nuovo il workflow

---

## 📊 Verifica Post-Rollback

Dopo il rollback, verifica che il dizionario sia corretto:

```bash
python scripts/diagnose_structure.py
```

**Aspettati**:
```
📊 Total entries: ~14804
📝 Entries by 'notes' field:
   compound: ~10838
   (altre categorie): ~3966
```

---

## 🎯 Prossimi Step (DOPO il rollback)

1. **Verifica lo script è aggiornato**:
   - Controlla che `scripts/deduplicate_dictionary.py` abbia il fix
   - Cerca `if not byakuzhi:` nella sezione di raggruppamento

2. **Esegui generate_missing_ipa.py** (NON deduplicate!):
   ```bash
   python scripts/generate_missing_ipa.py
   ```

3. **Solo SE necessario**, esegui deduplicate (dopo aver verificato che funzioni):
   ```bash
   python scripts/check_duplicates.py  # Prima verifica
   python scripts/deduplicate_dictionary.py  # Solo se ci sono VERI duplicati
   ```

---

## 📞 Contatti

Se hai problemi con il rollback, apri un issue su GitHub.
