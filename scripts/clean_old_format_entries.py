#!/usr/bin/env python3
"""
Rimuove le voci nel vecchio formato da dictionary.json.

Il problema: dopo unify-dictionary, il dizionario contiene coppie duplicate:
- Voce vecchio formato: pos del tipo ": adj =" o ": n =", lemma ASCII-based
- Voce nuovo formato: pos pulito ("adj", "n", ecc.), lemma con caratteri IPA

Strategia:
1. Per ogni voce con pos nel vecchio formato (": X ="), cercare se esiste
   una voce con lo stesso IPA nel nuovo formato.
2. Se esiste, eliminare la vecchia.
3. Se non esiste, convertire la voce nel nuovo formato (pulire il pos).
"""

import json
import sys
from pathlib import Path
from collections import defaultdict


def is_old_format(entry):
    """True se la voce ha pos nel vecchio formato (': X =' o ': pref  =')"""
    pos = entry.get("pos", "")
    return pos.startswith(": ") or pos.endswith(" =")


def clean_pos(pos):
    """Converte ': adj =' -> 'adj'"""
    pos = pos.strip()
    if pos.startswith(": "):
        pos = pos[2:]
    if pos.endswith(" ="):
        pos = pos[:-2]
    return pos.strip()


def main():
    data_dir = Path("data")
    dictionary_json = data_dir / "dictionary.json"
    backup_json = data_dir / "dictionary_pre_clean.json"

    if not dictionary_json.exists():
        print(f"ERRORE: {dictionary_json} non trovato!")
        sys.exit(1)

    print(f"Caricamento {dictionary_json}...")
    with open(dictionary_json, "r", encoding="utf-8") as f:
        entries = json.load(f)
    print(f"  {len(entries)} voci caricate")

    # Backup
    print(f"Backup in {backup_json}...")
    with open(backup_json, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

    # Separa vecchio e nuovo formato
    old_format = [e for e in entries if is_old_format(e)]
    new_format = [e for e in entries if not is_old_format(e)]

    print(f"  Voci vecchio formato: {len(old_format)}")
    print(f"  Voci nuovo formato:   {len(new_format)}")

    # Indice: ipa -> lista di voci nuovo formato
    ipa_index = defaultdict(list)
    for e in new_format:
        ipa = e.get("ipa", "").strip()
        if ipa:
            ipa_index[ipa].append(e)

    kept = []      # vecchie voci da tenere (convertite)
    dropped = 0    # vecchie voci eliminate
    converted = 0  # vecchie voci convertite (senza corrispondente nuovo)

    for entry in old_format:
        ipa = entry.get("ipa", "").strip()
        if ipa and ipa in ipa_index:
            # Esiste una voce nuovo formato con stesso IPA -> elimina vecchia
            dropped += 1
        else:
            # Non esiste -> converti pos e tieni
            entry["pos"] = clean_pos(entry.get("pos", ""))
            kept.append(entry)
            converted += 1

    final = new_format + kept
    # Ordina per lemma
    final.sort(key=lambda e: e.get("lemma", "").lower())

    print(f"\nRisultato:")
    print(f"  Voci vecchio formato eliminate:  {dropped}")
    print(f"  Voci vecchio formato convertite: {converted}")
    print(f"  Totale voci finale:              {len(final)}")

    with open(dictionary_json, "w", encoding="utf-8") as f:
        json.dump(final, f, ensure_ascii=False, indent=2)

    print(f"\nDizionario salvato in {dictionary_json}")
    print(f"Backup disponibile in {backup_json}")


if __name__ == "__main__":
    main()
