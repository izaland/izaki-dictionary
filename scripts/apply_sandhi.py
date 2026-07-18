#!/usr/bin/env python3
"""Apply sandhi rules to Izaki dictionary entries.

This script applies phonological sandhi rules to both compounds.csv and dictionary.json
"""

import csv
import json
import re
import sys
from pathlib import Path

def apply_sandhi_alphabet_ipa(reading: str) -> str:
    """Apply ALL sandhi rules for alphabet/IPA romanization."""
    if not reading or reading.strip() == '':
        return reading
    
    # Apply patterns from longest to shortest
    reading = re.sub(r'szh', r'ssh', reading)
    reading = re.sub(r'sts', r'tts', reading)
    reading = re.sub(r'sð', r'tts', reading)
    reading = re.sub(r'sdz', r'tts', reading)
    reading = re.sub(r'sz', r'tts', reading)
    reading = re.sub(r'sch', r'cch', reading)
    reading = re.sub(r'sj', r'cch', reading)
    reading = re.sub(r'sd', r'st', reading)
    reading = re.sub(r'sg', r'sk', reading)
    reading = re.sub(r'sb', r'sp', reading)
    reading = re.sub(r'sv', r'sf', reading)
    
    reading = re.sub(r'ksh', r'ssh', reading)
    reading = re.sub(r'kts', r'tts', reading)
    reading = re.sub(r'kch', r'cch', reading)
    reading = re.sub(r'ks', r'ss', reading)
    
    reading = re.sub(r'n([pb])', r'm\\1', reading)
    reading = re.sub(r'nr', r'nl', reading)
    
    return reading

def apply_sandhi_askaoza(reading: str) -> str:
    """Apply ONLY n+r→nl rule for askaoza script."""
    if not reading or reading.strip() == '':
        return reading
    
    reading = re.sub(r'nr', r'nl', reading)
    return reading

def process_compounds(input_path: Path, output_path: Path) -> int:
    """Process compounds.csv file."""
    changes = 0
    
    with open(input_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    for row in rows:
        original = row['Izaki Reading']
        corrected = apply_sandhi_alphabet_ipa(original)
        
        if corrected != original:
            row['Izaki Reading'] = corrected
            changes += 1
    
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['English', 'Compound', 'Izaki Reading'])
        writer.writeheader()
        writer.writerows(rows)
    
    return changes

def process_dictionary(input_path: Path, output_path: Path) -> int:
    """Process dictionary.json file."""
    changes = 0
    
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for entry in data:
        if 'izaki_reading' in entry:
            original = entry['izaki_reading']
            corrected = apply_sandhi_alphabet_ipa(original)
            
            if corrected != original:
                entry['izaki_reading'] = corrected
                changes += 1
        
        if 'askaoza_reading' in entry:
            original = entry['askaoza_reading']
            corrected = apply_sandhi_askaoza(original)
            
            if corrected != original:
                entry['askaoza_reading'] = corrected
                changes += 1
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    return changes

def main():
    base_dir = Path(__file__).parent.parent
    data_dir = base_dir / 'data'
    
    print("Applying sandhi rules to Izaki dictionary...")
    print()
    
    # Process compounds.csv
    compounds_in = data_dir / 'compounds.csv'
    compounds_out = data_dir / 'compounds.csv'
    
    if compounds_in.exists():
        print(f"Processing {compounds_in}...")
        changes = process_compounds(compounds_in, compounds_out)
        print(f"  ✓ {changes} entries corrected")
    
    # Process dictionary.json
    dict_in = data_dir / 'dictionary.json'
    dict_out = data_dir / 'dictionary.json'
    
    if dict_in.exists():
        print(f"Processing {dict_in}...")
        changes = process_dictionary(dict_in, dict_out)
        print(f"  ✓ {changes} entries corrected")
    
    print()
    print("Done!")

if __name__ == '__main__':
    main()
