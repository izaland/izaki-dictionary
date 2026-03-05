#!/usr/bin/env python3
"""Build complete dictionary.json from existing dictionary.json and compounds.csv"""

import csv
import json
import re
from pathlib import Path

# Izaki phonetic rules for IPA conversion
PHONETIC_RULES = [
    (r'ā', 'aː'), (r'ē', 'eː'), (r'ī', 'iː'), (r'ō', 'oː'), (r'ū', 'uː'),
    (r'ts', 'ts'), (r'ch', 'tɕ'), (r'sh', 'ʃ'), (r'zh', 'ʒ'),
    (r'ð', 'dz'), (r'j', 'dʒ'), (r'y', 'j'), (r'w', 'w'), (r'r', 'ɾ'),
]

def lemma_to_ipa(reading):
    """Convert Izaki reading to IPA transcription"""
    if not reading or not isinstance(reading, str):
        return ''
    
    ipa = reading.lower().strip()
    for pattern, replacement in PHONETIC_RULES:
        ipa = re.sub(pattern, replacement, ipa, flags=re.IGNORECASE)
    
    return f'/{ipa}/'

def should_generate_ipa(current_ipa):
    """Check if IPA needs to be generated (missing or placeholder)"""
    if not current_ipa or not isinstance(current_ipa, str):
        return True
    
    ipa = current_ipa.strip()
    
    # Placeholders that should be replaced
    placeholders = ['', '【—】', '—', '/', '//']
    
    if ipa in placeholders:
        return True
    
    # Check for Gujarati chars (askaoza leaking into IPA)
    if any('\u0a80' <= char <= '\u0aff' for char in ipa):
        return True
    
    return False

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
            
            # Generate IPA from reading
            ipa = lemma_to_ipa(izaki_reading)
            
            entry = {
                "lemma": izaki_reading,
                "ipa": ipa,  # ✨ NOW GENERATED!
                "pos": "n",
                "english": [english] if english else [],
                "italian": [],
                "byakuzhi": compound,
                "askaoza": "",
                "notes": "compound",
                "example": ""
            }
            entries.append(entry)
    return entries

def generate_missing_ipa_for_native_words(entries):
    """Generate IPA for native words that are missing it"""
    generated_count = 0
    
    for entry in entries:
        # Skip compounds (already have IPA from CSV)
        if entry.get('notes') == 'compound':
            continue
        
        current_ipa = entry.get('ipa', '')
        lemma = entry.get('lemma', '')
        
        # Generate IPA if missing and lemma exists
        if should_generate_ipa(current_ipa) and lemma:
            new_ipa = lemma_to_ipa(lemma)
            if new_ipa:
                entry['ipa'] = new_ipa
                generated_count += 1
    
    return generated_count

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
    
    # Generate IPA for native words
    print(f"\n✨ Generating IPA for native words...")
    native_ipa_count = generate_missing_ipa_for_native_words(native_words)
    print(f"  Generated IPA for {native_ipa_count} native words")
    
    # Merge
    all_entries = native_words + compounds
    print(f"\n📊 Total entries: {len(all_entries)}")
    print(f"  - Native words: {len(native_words)}")
    print(f"  - Compounds: {len(compounds)}")
    
    # Write JSON
    print(f"\n💾 Writing to {output_json}...")
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(all_entries, f, ensure_ascii=False, indent=2)
    
    print("✅ Done!")
    print(f"\n📊 Summary:")
    print(f"  - Total entries: {len(all_entries)}")
    print(f"  - IPA generated for compounds: {len(compounds)}")
    print(f"  - IPA generated for native words: {native_ipa_count}")

if __name__ == '__main__':
    main()
