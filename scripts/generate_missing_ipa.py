#!/usr/bin/env python3
"""
Generate missing IPA transcriptions for dictionary entries.

This script:
- Scans all dictionary entries
- Identifies entries with missing or placeholder IPA
- Generates IPA based on the lemma field
- Updates dictionary.json with generated IPA
"""

import json
import re
from pathlib import Path

# Izaki phonetic rules for IPA conversion
PHONETIC_RULES = [
    (r'ā', 'aː'), (r'ē', 'eː'), (r'ī', 'iː'), (r'ō', 'oː'), (r'ū', 'uː'),
    (r'ts', 'ts'), (r'ch', 'tɕ'), (r'sh', 'ʃ'), (r'zh', 'ʒ'),
    (r'ð', 'dz'), (r'j', 'dʒ'), (r'y', 'j'), (r'w', 'w'), (r'r', 'ɾ'),
]

def latin_to_ipa(reading: str) -> str:
    """Convert Izaki reading to IPA transcription"""
    if not reading or not isinstance(reading, str):
        return ''
    
    ipa = reading.lower().strip()
    for pattern, replacement in PHONETIC_RULES:
        ipa = re.sub(pattern, replacement, ipa, flags=re.IGNORECASE)
    
    return ipa

def is_ipa_missing(ipa: str) -> bool:
    """Check if IPA field is missing or contains placeholder"""
    if not ipa or not isinstance(ipa, str):
        return True
    
    ipa = ipa.strip()
    
    # Common placeholders
    placeholders = [
        '',           # Empty
        '【—】',      # Japanese placeholder
        '—',          # Em dash
        '/',          # Just slash
        '//',         # Double slash
        '૮',          # Gujarati chars (your askaoza)
        'ૃ',
    ]
    
    # Check if it's a placeholder
    if ipa in placeholders:
        return True
    
    # Check if it contains Gujarati script (askaoza leaking into IPA)
    if any('\u0a80' <= char <= '\u0aff' for char in ipa):
        return True
    
    return False

def generate_ipa_for_entry(entry: dict) -> tuple[dict, bool]:
    """Generate IPA for a single entry if missing
    
    Returns:
        tuple: (updated_entry, was_generated)
    """
    lemma = entry.get('lemma', '').strip()
    current_ipa = entry.get('ipa', '')
    
    if not lemma:
        return entry, False
    
    if not is_ipa_missing(current_ipa):
        return entry, False
    
    try:
        generated_ipa = latin_to_ipa(lemma)
        if generated_ipa:
            entry['ipa'] = f"/{generated_ipa}/"
            return entry, True
    except Exception as e:
        print(f"  ✗ Failed to generate IPA for '{lemma}': {e}")
    
    return entry, False

def main():
    # Paths
    data_dir = Path('data')
    dictionary_json = data_dir / 'dictionary.json'
    backup_json = data_dir / 'dictionary_backup_ipa.json'
    
    if not dictionary_json.exists():
        print(f"❌ Error: {dictionary_json} not found!")
        return 1
    
    print(f"📖 Reading {dictionary_json}...")
    with open(dictionary_json, 'r', encoding='utf-8') as f:
        entries = json.load(f)
    print(f"   Loaded {len(entries)} entries\n")
    
    # Scan for missing IPA
    print(f"🔍 Scanning for missing IPA...")
    missing_ipa = []
    
    for entry in entries:
        ipa = entry.get('ipa', '')
        if is_ipa_missing(ipa):
            lemma = entry.get('lemma', '???')
            missing_ipa.append(lemma)
    
    print(f"   Found {len(missing_ipa)} entries with missing IPA\n")
    
    if len(missing_ipa) == 0:
        print("✅ All entries already have IPA!")
        return 0
    
    # Show examples
    if len(missing_ipa) <= 10:
        print(f"📝 Entries needing IPA:")
        for lemma in missing_ipa:
            print(f"   - {lemma}")
    else:
        print(f"📝 First 10 entries needing IPA:")
        for lemma in missing_ipa[:10]:
            print(f"   - {lemma}")
        print(f"   ... and {len(missing_ipa) - 10} more")
    
    print(f"\n🔧 Generating IPA...\n")
    
    # Backup
    print(f"💾 Creating backup at {backup_json}...")
    with open(backup_json, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)
    
    # Generate IPA
    generated_count = 0
    failed_count = 0
    
    for i, entry in enumerate(entries):
        updated_entry, was_generated = generate_ipa_for_entry(entry)
        entries[i] = updated_entry
        
        if was_generated:
            generated_count += 1
            lemma = entry.get('lemma')
            ipa = entry.get('ipa')
            if generated_count <= 10:  # Show first 10
                print(f"  ✓ {lemma} → {ipa}")
            elif generated_count == 11:
                print(f"  ... (showing first 10, generating {len(missing_ipa)} total)")
    
    failed_count = len(missing_ipa) - generated_count
    
    print(f"\n📊 Summary:")
    print(f"   Total entries: {len(entries)}")
    print(f"   IPA generated: {generated_count}")
    print(f"   Failed: {failed_count}")
    
    if generated_count > 0:
        # Save updated dictionary
        print(f"\n✍️  Writing updated dictionary to {dictionary_json}...")
        with open(dictionary_json, 'w', encoding='utf-8') as f:
            json.dump(entries, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ Done! Generated IPA for {generated_count} entries.")
        print(f"   Backup saved at: {backup_json}")
    else:
        print(f"\n⚠️  No IPA was generated. Check errors above.")
    
    return 0

if __name__ == '__main__':
    exit(main())
