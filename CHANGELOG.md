# Changelog — Izaki Dictionary

Tutte le modifiche significative al progetto sono documentate in questo file.

---

## [2026-03-12]

### 🔧 Fix
- **Normalizzazione tag POS** nel `dictionary.json`: il formato `: n =` (ereditato dal foglio Google) è stato pulito in `n`, `v`, `adj`, ecc., rendendo i tag compatibili con il declinatore/coniugatore.
- Applicato via workflow one-shot `fix-pos-tags.yml` (eseguito manualmente).

### ✨ Miglioramenti
- **`scripts/build_dictionary.py`**: aggiunta la funzione `normalize_pos()` che pulisce automaticamente i tag POS ad ogni build futura, sia per le nuove voci provenienti dal CSV che per quelle già presenti nel JSON.
- **`.github/workflows/fix-pos-tags.yml`**: aggiunto workflow `workflow_dispatch` per applicare la pulizia POS direttamente sul `dictionary.json` senza dover rigenerare l’intero dizionario.
