#!/usr/bin/env python3
"""
Genera automaticamente le pronunce mancanti nei composti usando il database byakuzhi.
Le regole fonetiche sono prese da reconstruction.js

Uso:
  python generate_compound_readings.py

Output:
  - compounds_updated.csv (con le nuove pronunce generate)
  - report.txt (statistiche e log)
"""

import json
import csv
import re
from pathlib import Path

# Carica database byakuzhi
def load_byakuzhi():
    with open('data/byakuzhi.json', 'r', encoding='utf-8') as f:
        return json.load(f)

# Ricostruisce la pronuncia applicando le regole fonetiche
def reconstruct_reading(chars, byakuzhi_db):
    """
    Ricostruisce la pronuncia Izaki di un composto di byakuzhi.
    
    Args:
        chars: stringa con i caratteri del composto (es. "圧着")
        byakuzhi_db: dizionario con i dati dei byakuzhi
    
    Returns:
        str: pronuncia ricostruita o None se mancano dati
    """
    readings = []
    
    # Verifica che tutti i byakuzhi abbiano onnufu
    for char in chars:
        if char not in byakuzhi_db:
            return None  # Byakuzhi non nel database
        
        onnufu = byakuzhi_db[char].get("onnufu", "")
        if not onnufu:
            return None  # Byakuzhi senza onnufu
        
        # Prendi solo la prima lettura se ci sono alternative
        if "/" in onnufu:
            onnufu = onnufu.split("/")[0]
        
        readings.append(onnufu)
    
    if not readings:
        return None
    
    # Applica regole fonetiche di assimilazione
    # Basate su reconstruction.js
    result = readings[0]
    
    for i in range(1, len(readings)):
        prev_reading = result
        curr_reading = readings[i]
        
        # Regole di assimilazione consonantica
        last_char = prev_reading[-1] if prev_reading else ""
        first_char = curr_reading[0] if curr_reading else ""
        
        # Regola 1: Geminazione consonante dopo s, t, k, p
        # Es: as + chaku -> acchaku, ban + tan -> bantan
        if last_char in "stkp" and first_char in "chkpstbdgzmnrlyw":
            # Raddoppia la prima consonante del secondo elemento
            if len(curr_reading) > 1:
                result += first_char + curr_reading
            else:
                result += curr_reading
        
        # Regola 2: n + consonante labiale (p, b, m) -> m + consonante
        # Es: ban + pān -> bampān, pan + pīn -> pampīn
        elif last_char == "n" and first_char in "pbm":
            result = result[:-1] + "m" + curr_reading
        
        # Regola 3: n + consonante velare (k, g) -> ng
        # (implementazione opzionale, da verificare con i dati)
        
        # Default: concatena senza modifiche
        else:
            result += curr_reading
    
    return result

def main():
    # Carica database
    print("Caricamento database byakuzhi...")
    byakuzhi_db = load_byakuzhi()
    print(f"  Caricati {len(byakuzhi_db)} byakuzhi")
    
    # Leggi compounds.csv
    print("\nLettura compounds.csv...")
    compounds = []
    with open('data/compounds.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            compounds.append(row)
    print(f"  Letti {len(compounds)} composti")
    
    # Processa composti
    print("\nProcessamento composti...")
    stats = {
        'total': len(compounds),
        'already_has_reading': 0,
        'generated': 0,
        'skipped_missing_byakuzhi': 0
    }
    
    updated_compounds = []
    
    for compound in compounds:
        english = compound['English']
        chars = compound['Compound']
        existing_reading = compound['Izaki Reading']
        
        # Se ha già una pronuncia, mantienila
        if existing_reading and existing_reading.strip():
            stats['already_has_reading'] += 1
            updated_compounds.append(compound)
            continue
        
        # Prova a generare la pronuncia
        generated = reconstruct_reading(chars, byakuzhi_db)
        
        if generated:
            compound['Izaki Reading'] = generated
            stats['generated'] += 1
            print(f"  ✓ {chars} ({english}): {generated}")
            updated_compounds.append(compound)
        else:
            stats['skipped_missing_byakuzhi'] += 1
            print(f"  ✗ {chars} ({english}): SKIPPED (byakuzhi mancanti)")
            updated_compounds.append(compound)
    
    # Salva il file aggiornato
    print("\nSalvataggio compounds_updated.csv...")
    with open('data/compounds_updated.csv', 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['English', 'Compound', 'Izaki Reading']
        writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        writer.writeheader()
        writer.writerows(updated_compounds)
    
    # Report finale
    print("\n" + "=" * 60)
    print("REPORT FINALE")
    print("=" * 60)
    print(f"Totale composti: {stats['total']}")
    print(f"Già con pronuncia: {stats['already_has_reading']}")
    print(f"Nuove pronunce generate: {stats['generated']}")
    print(f"Saltati (byakuzhi mancanti): {stats['skipped_missing_byakuzhi']}")
    print("=" * 60)
    
    # Salva report
    with open('report.txt', 'w', encoding='utf-8') as f:
        f.write("REPORT GENERAZIONE PRONUNCE COMPOSTI\n")
        f.write("=" * 60 + "\n")
        f.write(f"Totale composti: {stats['total']}\n")
        f.write(f"Già con pronuncia: {stats['already_has_reading']}\n")
        f.write(f"Nuove pronunce generate: {stats['generated']}\n")
        f.write(f"Saltati (byakuzhi mancanti): {stats['skipped_missing_byakuzhi']}\n")
    
    print("\nFile salvati:")
    print("  - data/compounds_updated.csv")
    print("  - report.txt")

if __name__ == "__main__":
    main()
