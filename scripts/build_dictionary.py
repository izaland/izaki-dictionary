#!/usr/bin/env python3
"""Build complete dictionary.json from existing dictionary.json and compounds.csv"""

import csv
import json
from pathlib import Path

def read_dictionary_json(filepath):
    """Read existing dictionary.json"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

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
                print(f"  ⚠️  Skipping row with missing data: {row}")
                continue
            
            # CRITICAL: Use Izaki Reading as lemma, NOT English!
            entry = {
                "lemma": izaki_reading,  # ← FIX: Was using English before
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
    dictionary_json = data_dir / 'dictionary.json'
    compounds_csv = data_dir / 'compounds.csv'
    output_json = data_dir / 'dictionary.json'
    
    print(f"📖 Reading {dictionary_json}...")
    native_words = read_dictionary_json(dictionary_json)
    # Filter out existing compounds to avoid duplicates
    native_words = [w for w in native_words if w.get('notes') != 'compound']
    print(f"  Found {len(native_words)} native words")
    
    print(f"📋 Reading {compounds_csv}...")
    compounds = read_compounds_csv(compounds_csv)
    print(f"  Found {len(compounds)} compounds")
    
    # Merge
    all_entries = native_words + compounds
    print(f"\n📊 Total entries: {len(all_entries)}")
    
    # Write JSON
    print(f"💾 Writing to {output_json}...")
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(all_entries, f, ensure_ascii=False, indent=2)
    
    print("✅ Done!")
    print("\n💡 Next steps:")
    print("   1. Run: python scripts/fix_compound_lemmas.py (to fix any existing bad entries)")
    print("   2. Run: python scripts/deduplicate_dictionary.py (to remove duplicates and generate IPA)")

if __name__ == '__main__':
    main()
