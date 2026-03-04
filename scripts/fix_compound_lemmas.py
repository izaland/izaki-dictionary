#!/usr/bin/env python3
"""
Fix compound entries where lemma field contains English instead of Izaki reading.

This happens when compounds.csv entries are imported incorrectly.
Works on ANY entry with byakuzhi field, regardless of 'notes' value.
"""

import json
import csv
from pathlib import Path

def read_compounds_csv(filepath):
    """Read compounds.csv with correct field mapping"""
    compounds = {}
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            english = row.get('English', '').strip()
            byakuzhi = row.get('Compound', '').strip()
            izaki_reading = row.get('Izaki Reading', '').strip()
            
            if byakuzhi and izaki_reading:
                # Key by byakuzhi to match compounds
                compounds[byakuzhi] = {
                    'english': english,
                    'izaki_reading': izaki_reading
                }
    return compounds

def fix_dictionary(dictionary_path, compounds_csv_path):
    """Fix dictionary entries where lemma is English"""
    
    print(f"📖 Reading {dictionary_path}...")
    with open(dictionary_path, 'r', encoding='utf-8') as f:
        entries = json.load(f)
    print(f"   Loaded {len(entries)} entries")
    
    print(f"\n📋 Reading {compounds_csv_path}...")
    compounds = read_compounds_csv(compounds_csv_path)
    print(f"   Loaded {len(compounds)} compound mappings")
    
    print(f"\n🔧 Fixing entries...")
    fixed_count = 0
    errors = []
    tagged_count = 0
    
    for entry in entries:
        byakuzhi = entry.get('byakuzhi', '').strip()
        
        # Skip entries without byakuzhi (native words)
        if not byakuzhi:
            continue
        
        lemma = entry.get('lemma', '').strip()
        
        # Check if this entry needs the 'compound' tag
        if entry.get('notes') != 'compound':
            entry['notes'] = 'compound'
            tagged_count += 1
        
        # Check if lemma looks like English (ASCII-only, no Izaki diacritics)
        has_diacritics = any(char in lemma for char in ['ā', 'ī', 'ū', 'ē', 'ō', 'ð'])
        
        if lemma and lemma.isascii() and not has_diacritics:
            # Lemma might be English - check if we have a mapping
            if byakuzhi in compounds:
                correct_reading = compounds[byakuzhi]['izaki_reading']
                
                if correct_reading and correct_reading != lemma:
                    print(f"   ✓ Fixing: {lemma} → {correct_reading} ({byakuzhi})")
                    entry['lemma'] = correct_reading
                    fixed_count += 1
                else:
                    if not correct_reading:
                        errors.append(f"Missing reading for {byakuzhi}: {lemma}")
            else:
                # Check if English matches - might be correct mapping
                expected_english = entry.get('english', [])
                if expected_english and expected_english[0].lower() == lemma.lower():
                    errors.append(f"No CSV mapping for {byakuzhi}: '{lemma}' (matches English, needs manual check)")
                else:
                    errors.append(f"No CSV mapping for {byakuzhi}: '{lemma}'")
    
    print(f"\n📊 Summary:")
    print(f"   Fixed lemma entries: {fixed_count}")
    print(f"   Added 'compound' tags: {tagged_count}")
    print(f"   Warnings: {len(errors)}")
    
    if errors and len(errors) <= 10:
        print(f"\n⚠️  Warning details:")
        for error in errors:
            print(f"   - {error}")
    elif errors:
        print(f"\n⚠️  {len(errors)} warnings (showing first 10):")
        for error in errors[:10]:
            print(f"   - {error}")
    
    changes_made = fixed_count > 0 or tagged_count > 0
    
    if changes_made:
        # Backup
        backup_path = dictionary_path.parent / 'dictionary_backup_lemma.json'
        print(f"\n💾 Creating backup at {backup_path}...")
        
        # Read original again for backup
        with open(dictionary_path, 'r', encoding='utf-8') as f:
            original = f.read()
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(original)
        
        # Save fixed version
        print(f"\n✍️  Writing fixed dictionary to {dictionary_path}...")
        with open(dictionary_path, 'w', encoding='utf-8') as f:
            json.dump(entries, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ Done! Dictionary has been fixed.")
        print(f"   • {fixed_count} lemma fields corrected")
        print(f"   • {tagged_count} entries tagged as 'compound'")
    else:
        print(f"\n✓ No fixes needed - dictionary lemmas are correct.")
    
    return changes_made

def main():
    data_dir = Path('data')
    dictionary_json = data_dir / 'dictionary.json'
    compounds_csv = data_dir / 'compounds.csv'
    
    if not dictionary_json.exists():
        print(f"❌ Error: {dictionary_json} not found!")
        return 1
    
    if not compounds_csv.exists():
        print(f"❌ Error: {compounds_csv} not found!")
        return 1
    
    fix_dictionary(dictionary_json, compounds_csv)
    return 0

if __name__ == '__main__':
    exit(main())
