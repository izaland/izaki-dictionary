#!/usr/bin/env python3
"""Build dictionary.json from dictionary.csv and compounds.csv"""

import csv
import json
from pathlib import Path

def read_dictionary_csv(filepath):
    """Read dictionary.csv and convert to list of dicts"""
    entries = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            entry = {
                "lemma": row.get('lemma', ''),
                "ipa": row.get('ipa', ''),
                "pos": row.get('pos', ''),
                "english": [e.strip() for e in row.get('english', '').split(',') if e.strip()],
                "italian": [i.strip() for i in row.get('italian', '').split(',') if i.strip()],
                "byakuzhi": row.get('byakuzhi', ''),
                "askaoza": row.get('askaoza', ''),
                "notes": row.get('notes', ''),
                "example": row.get('example', '')
            }
            entries.append(entry)
    return entries

def read_compounds_csv(filepath):
    """Read compounds.csv and convert to list of dicts"""
    entries = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            english = row.get('English', '').strip()
            compound = row.get('Compound', '').strip()
            izaki_reading = row.get('Izaki Reading', '').strip()
            
            if not compound or not izaki_reading:
                continue
                
            entry = {
                "lemma": izaki_reading,
                "ipa": "",  # IPA will be added by separate workflow
                "pos": "n",  # Most compounds are nouns
                "english": [english] if english else [],
                "italian": [],
                "byakuzhi": compound,
                "askaoza": "",
                "notes": "compound",
                "example": ""
            }
            entries.append(entry)
    return entries

def main():
    # Paths
    data_dir = Path('data')
    dictionary_csv = data_dir / 'dictionary.csv'
    compounds_csv = data_dir / 'compounds.csv'
    output_json = data_dir / 'dictionary.json'
    
    print(f"Reading {dictionary_csv}...")
    native_words = read_dictionary_csv(dictionary_csv)
    print(f"  Found {len(native_words)} native words")
    
    print(f"Reading {compounds_csv}...")
    compounds = read_compounds_csv(compounds_csv)
    print(f"  Found {len(compounds)} compounds")
    
    # Merge
    all_entries = native_words + compounds
    print(f"\nTotal entries: {len(all_entries)}")
    
    # Write JSON
    print(f"Writing to {output_json}...")
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(all_entries, f, ensure_ascii=False, indent=2)
    
    print("Done!")

if __name__ == '__main__':
    main()
