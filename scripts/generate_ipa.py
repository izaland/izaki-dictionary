#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Izaki Dictionary Updater
Integrates byakuzhi compounds from Sheets into dictionary.json
"""

import csv
import json
from pathlib import Path

# Regole fonetiche IPA
PHONETIC_RULES = [
    (r'ā', 'aː'), (r'ē', 'eː'), (r'ī', 'iː'), (r'ō', 'oː'), (r'ū', 'uː'),
    (r'ts', 'ts'), (r'ch', 'tɕ'), (r'sh', 'ʃ'), (r'zh', 'ʒ'),
    (r'ð', 'dz'), (r'j', 'dʒ'), (r'y', 'j'), (r'w', 'w'), (r'r', 'ɾ'),
]

def lemma_to_ipa(reading):
    """Converte lettura Izaki in IPA"""
    if not reading or not isinstance(reading, str):
        return ''
    
    import re
    ipa = reading.lower().strip()
    for pattern, replacement in PHONETIC_RULES:
        ipa = re.sub(pattern, replacement, ipa, flags=re.IGNORECASE)
    
    return f'/{ipa}/'

def load_compounds_from_csv(csv_path):
    """
    Carica compounds da CSV (english, compound, izaki_reading)
    
    Returns:
        list: Lista di dict con structure:
        {
            'word': 'rolling',
            'byakuzhi': '圧延',
            'reading': 'asshyen',
            'ipa': '/aʃʃjen/',
            'type': 'compound'
        }
    """
    compounds = []
    
    print(f'📖 Lettura compounds da: {csv_path}')
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        
        for i, row in enumerate(reader, 1):
            if len(row) < 3:
                continue
            
            english = row[0].strip()
            compound = row[1].strip()
            izaki_reading = row[2].strip()
            
            # Skip righe vuote o header
            if not english or english.lower() == 'english':
                continue
            
            # Genera IPA
            ipa = lemma_to_ipa(izaki_reading)
            
            entry = {
                'word': english,
                'byakuzhi': compound,
                'reading': izaki_reading,
                'ipa': ipa,
                'type': 'compound',
                'source': 'sheets_sync'  # Tag per identificare origine
            }
            
            compounds.append(entry)
    
    print(f'✅ Caricati {len(compounds)} compounds')
    return compounds

def load_existing_dictionary(dict_path):
    """Carica dictionary.json esistente"""
    if not dict_path.exists():
        print(f'ℹ️  Dictionary.json non trovato, verrà creato')
        return []
    
    print(f'📖 Lettura dizionario esistente: {dict_path}')
    
    with open(dict_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Se dictionary.json ha struttura diversa, adatta qui
    if isinstance(data, dict):
        # Es. {'entries': [...]}
        entries = data.get('entries', [])
    else:
        # Array diretto
        entries = data
    
    print(f'✅ Dizionario esistente: {len(entries)} entries')
    return entries

def merge_dictionaries(existing_entries, new_compounds):
    """
    Merge dizionario esistente + nuovi compounds
    
    Logica:
    - Rimuovi vecchi compounds da Sheets (source='sheets_sync')
    - Aggiungi nuovi compounds
    - Mantieni altre entries (verbs, nouns, etc.)
    """
    print(f'\n🔄 Merge dizionari...')
    
    # Filtra entries non-compounds o compounds non da Sheets
    filtered_entries = [
        e for e in existing_entries 
        if e.get('source') != 'sheets_sync'
    ]
    
    removed_count = len(existing_entries) - len(filtered_entries)
    print(f'   Rimossi {removed_count} vecchi compounds da Sheets')
    
    # Aggiungi nuovi compounds
    merged = filtered_entries + new_compounds
    
    print(f'✅ Merge completato: {len(merged)} totali entries')
    print(f'   - Compounds da Sheets: {len(new_compounds)}')
    print(f'   - Altre entries: {len(filtered_entries)}')
    
    return merged

def save_dictionary(entries, dict_path):
    """Salva dictionary.json aggiornato"""
    print(f'\n💾 Salvataggio: {dict_path}')
    
    # Ordina alfabeticamente per 'word' (opzionale)
    entries_sorted = sorted(entries, key=lambda x: x.get('word', '').lower())
    
    with open(dict_path, 'w', encoding='utf-8') as f:
        json.dump(entries_sorted, f, ensure_ascii=False, indent=2)
    
    print(f'✅ Dizionario salvato!')

def show_examples(entries, n=10):
    """Mostra esempi entries nel log"""
    print(f'\n📝 Esempi entries (prime {n}):')
    print(f'{"Word":<20} {"Byakuzhi":<12} {"Reading":<15} {"IPA":<20} {"Type":<10}')
    print('-' * 80)
    
    for entry in entries[:n]:
        word = entry.get('word', '')[:18]
        byakuzhi = entry.get('byakuzhi', '')[:10]
        reading = entry.get('reading', '')[:13]
        ipa = entry.get('ipa', '')[:18]
        etype = entry.get('type', '')[:8]
        
        print(f'{word:<20} {byakuzhi:<12} {reading:<15} {ipa:<20} {etype:<10}')

if __name__ == '__main__':
    # Paths
    base_dir = Path(__file__).parent.parent
    csv_path = base_dir / 'data' / 'compounds.csv'
    dict_path = base_dir / 'data' / 'dictionary.json'
    
    # Verifica CSV esiste
    if not csv_path.exists():
        print(f'❌ File non trovato: {csv_path}')
        exit(1)
    
    # 1. Carica compounds da CSV
    new_compounds = load_compounds_from_csv(csv_path)
    
    # 2. Carica dizionario esistente
    existing_entries = load_existing_dictionary(dict_path)
    
    # 3. Merge
    merged_entries = merge_dictionaries(existing_entries, new_compounds)
    
    # 4. Salva dictionary.json aggiornato
    save_dictionary(merged_entries, dict_path)
    
    # 5. Mostra esempi
    show_examples(merged_entries)
    
    print(f'\n✅ COMPLETATO!')
    print(f'   File aggiornato: {dict_path}')
    print(f'   Totale entries: {len(merged_entries)}')
