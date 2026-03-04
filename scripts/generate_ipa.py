#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Izaki IPA Generator
Converts Izaki lemmas to IPA notation based on phonetic rules
"""

import csv
import json
import re
from pathlib import Path

# Regole fonetiche Izaki (dalla wikitable)
PHONETIC_RULES = [
    # Vocali lunghe (ordine importante: prima lunghe, poi brevi)
    (r'ā', 'aː'),
    (r'ē', 'eː'),
    (r'ī', 'iː'),
    (r'ō', 'oː'),
    (r'ū', 'uː'),
    
    # Digrafi consonantici (ordine: più lunghi prima)
    (r'ts', 'ts'),   # /ts/ in cats
    (r'ch', 'tɕ'),   # /tɕ/ giapponese cha
    (r'sh', 'ʃ'),    # /ʃ/ in she
    (r'zh', 'ʒ'),    # /ʒ/ in pleasure
    
    # Consonanti speciali
    (r'ð', 'dz'),    # /dz/ in adze
    (r'j', 'dʒ'),    # /dʒ/ in jam
    (r'y', 'j'),     # /j/ in yell
    (r'w', 'w'),     # /w/ in wing
    (r'r', 'ɾ'),     # /ɾ/ flap spagnolo
    
    # Consonanti base (rimangono invariate in IPA)
    # f, v, k, g, h, l, m, n, p, b, s, t, z, d
]

def lemma_to_ipa(lemma):
    """
    Converte un lemma Izaki in notazione IPA
    
    Args:
        lemma (str): Parola Izaki (es. 'tsukasu', 'chara')
    
    Returns:
        str: IPA con slash (es. '/tsukasu/', '/tɕaɾa/')
    """
    if not lemma or not isinstance(lemma, str):
        return ''
    
    ipa = lemma.lower().strip()
    
    # Applica regole in ordine (importante per precedenza)
    for pattern, replacement in PHONETIC_RULES:
        ipa = re.sub(pattern, replacement, ipa, flags=re.IGNORECASE)
    
    return f'/{ipa}/'

def process_csv(input_path, output_path):
    """
    Processa CSV compounds e genera JSON con IPA
    
    Args:
        input_path (str): Path al CSV input (es. 'data/compounds.csv')
        output_path (str): Path al JSON output (es. 'data/dictionary_with_ipa.json')
    """
    print(f'📖 Lettura CSV: {input_path}')
    
    entries = []
    with open(input_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames
        
        for row in reader:
            # Trova colonna lemma (potrebbe essere 'lemma', 'word', etc.)
            lemma = row.get('lemma') or row.get('word') or row.get('english') or ''
            
            if lemma:
                # Genera IPA
                ipa_generated = lemma_to_ipa(lemma)
                row['ipa_generated'] = ipa_generated
            
            entries.append(row)
    
    print(f'✅ Processate {len(entries)} entries')
    
    # Salva JSON
    print(f'💾 Salvataggio JSON: {output_path}')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)
    
    print(f'✅ IPA generato con successo!')
    print(f'   File output: {output_path}')
    
    # Mostra esempi
    print('\n📝 Esempi IPA generati:')
    for entry in entries[:5]:
        lemma = entry.get('lemma') or entry.get('word', '')
        ipa = entry.get('ipa_generated', '')
        if lemma and ipa:
            print(f'   {lemma:15} → {ipa}')

if __name__ == '__main__':
    # Paths relativi alla root del repo
    input_csv = Path(__file__).parent.parent / 'data' / 'compounds.csv'
    output_json = Path(__file__).parent.parent / 'data' / 'dictionary_with_ipa.json'
    
    # Crea cartella data se non esiste
    output_json.parent.mkdir(parents=True, exist_ok=True)
    
    process_csv(input_csv, output_json)
