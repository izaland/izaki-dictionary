#!/usr/bin/env python3
"""
Unifica le voci duplicate del dizionario Izaki.

Per ogni coppia di voci con lo stesso IPA e stesso significato:
- Mantiene come lemma principale la forma standardizzata (formato pos pulito)
- Aggiunge campo "alt_lemma" con la forma ortografica alternativa (se diversa)
- Normalizza il campo "pos" rimuovendo i delimitatori ": x ="
- Elimina la voce duplicata

Uso:
    python scripts/unify_dictionary.py
    python scripts/unify_dictionary.py data/dictionary.json data/dictionary_unified.json
"""
import json
import re
import sys
from collections import defaultdict


def normalize_pos(pos: str) -> str:
    """Trasforma ': adv =' -> 'adv', lascia invariato il resto."""
    m = re.match(r'^:\s*(.+?)\s*=$', pos.strip())
    if m:
        return m.group(1).strip()
    return pos.strip()


def is_old_format(pos: str) -> bool:
    """Restituisce True se il pos ha il vecchio formato ': x ='"""
    return bool(re.match(r'^:\s*.+\s*=$', pos.strip()))


def unify(entries: list) -> list:
    """
    Unifica voci duplicate raggruppando per (ipa, english, italian).
    """
    groups = defaultdict(list)
    for e in entries:
        key = (e["ipa"], tuple(e["english"]), tuple(e["italian"]))
        groups[key].append(e)

    result = []
    seen_keys = set()

    for e in entries:
        key = (e["ipa"], tuple(e["english"]), tuple(e["italian"]))
        if key in seen_keys:
            continue
        seen_keys.add(key)

        group = groups[key]

        if len(group) == 1:
            # Voce unica: normalizza solo il pos
            entry = dict(group[0])
            entry["pos"] = normalize_pos(entry["pos"])
            result.append(entry)
        else:
            # Coppia/gruppo: identifica vecchie e nuove
            new_entries = [x for x in group if not is_old_format(x["pos"])]
            old_entries = [x for x in group if is_old_format(x["pos"])]

            # La voce con pos pulito diventa la base
            base = new_entries[0] if new_entries else old_entries[0]
            alts = old_entries if new_entries else old_entries[1:]

            entry = dict(base)
            entry["pos"] = normalize_pos(entry["pos"])

            # Raccoglie lemmi alternativi distinti dal lemma principale
            alt_lemmas = [
                a["lemma"] for a in alts
                if a["lemma"] != entry["lemma"]
            ]
            # Rimuovi duplicati preservando l'ordine
            alt_lemmas = list(dict.fromkeys(alt_lemmas))

            if alt_lemmas:
                entry["alt_lemma"] = alt_lemmas[0] if len(alt_lemmas) == 1 else alt_lemmas

            result.append(entry)

    return result


if __name__ == "__main__":
    infile = sys.argv[1] if len(sys.argv) > 1 else "data/dictionary.json"
    outfile = sys.argv[2] if len(sys.argv) > 2 else infile

    with open(infile, encoding="utf-8") as f:
        data = json.load(f)

    unified = unify(data)

    with open(outfile, "w", encoding="utf-8") as f:
        json.dump(unified, f, ensure_ascii=False, indent=2)

    n_removed = len(data) - len(unified)
    print(f"Input:   {len(data):4d} voci")
    print(f"Output:  {len(unified):4d} voci")
    print(f"Rimosse: {n_removed:4d} voci duplicate")
