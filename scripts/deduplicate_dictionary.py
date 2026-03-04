#!/usr/bin/env python3
"""
Deduplicate dictionary entries and ensure IPA generation.

Handles cases where:
- Same lemma exists as both native word (<n>) and compound (<compound>)
- Entries are missing IPA transcription
- Multiple entries have the same lemma+byakuzhi combination
"""

import json
import sys
import re
from pathlib import Path
from collections import defaultdict
from typing import Dict, List

# Embedded IPA generation (based on generate_ipa.py)
PHONETIC_RULES = [
    (r'ā', 'aː'), (r'ē', 'eː'), (r'ī', 'iː'), (r'ō', 'oː'), (r'ū', 'uː'),
    (r'ts', 'ts'), (r'ch', 'tɕ'), (r'sh', 'ʃ'), (r'zh', 'ʒ'),
    (r'ð', 'dz'), (r'j', 'dʒ'), (r'y', 'j'), (r'w', 'w'), (r'r', 'ɾ'),
]

def latin_to_ipa(reading: str) -> str:
    """Convert Izaki reading to IPA"""
    if not reading or not isinstance(reading, str):
        return ''
    
    ipa = reading.lower().strip()
    for pattern, replacement in PHONETIC_RULES:
        ipa = re.sub(pattern, replacement, ipa, flags=re.IGNORECASE)
    
    return ipa

def read_dictionary(filepath: Path) -> List[Dict]:
    """Read dictionary.json"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_ipa_if_missing(entry: Dict) -> Dict:
    """Generate IPA for entry if missing"""
    lemma = entry.get('lemma', '').strip()
    current_ipa = entry.get('ipa', '').strip()
    
    # Generate IPA if missing or placeholder
    if lemma and (not current_ipa or current_ipa in ['', '【—】', '—', '૮', 'ૃ']):
        try:
            generated_ipa = latin_to_ipa(lemma)
            if generated_ipa:
                entry['ipa'] = f"/{generated_ipa}/"
                print(f"  ✓ Generated IPA for '{lemma}': {entry['ipa']}")
        except Exception as e:
            print(f"  ✗ Failed to generate IPA for '{lemma}': {e}")
    
    return entry

def merge_entries(entries: List[Dict]) -> Dict:
    """
    Merge duplicate entries, preferring:
    - Entries with IPA over those without
    - Compound entries over native when both have same info
    - Combining translations from both
    """
    lemma = entries[0]['lemma']
    byakuzhi = entries[0].get('byakuzhi', '')
    
    # Separate by type
    native_entries = [e for e in entries if e.get('notes') != 'compound']
    compound_entries = [e for e in entries if e.get('notes') == 'compound']
    
    # Find best entry with IPA
    best_entry = None
    for e in entries:
        ipa = e.get('ipa', '').strip()
        if ipa and ipa not in ['', '【—】', '—', '/', '//', '૮', 'ૃ']:
            best_entry = e.copy()
            break
    
    # If no entry has IPA, take first and try to generate
    if not best_entry:
        best_entry = entries[0].copy()
        best_entry = generate_ipa_if_missing(best_entry)
    
    # Merge translations
    all_english = set()
    all_italian = set()
    
    for e in entries:
        eng = e.get('english', [])
        if isinstance(eng, list):
            all_english.update(eng)
        elif isinstance(eng, str) and eng.strip():
            all_english.add(eng.strip())
        
        ita = e.get('italian', [])
        if isinstance(ita, list):
            all_italian.update(ita)
        elif isinstance(ita, str) and ita.strip():
            all_italian.add(ita.strip())
    
    best_entry['english'] = sorted(list(all_english))
    best_entry['italian'] = sorted(list(all_italian))
    
    # Decide on final tag
    if compound_entries and native_entries:
        # Both exist - mark as compound but keep native info
        best_entry['notes'] = 'compound'
        best_entry['pos'] = native_entries[0].get('pos', 'n')
    elif compound_entries:
        best_entry['notes'] = 'compound'
    else:
        # Keep original notes
        pass
    
    return best_entry

def deduplicate_dictionary(entries: List[Dict]) -> List[Dict]:
    """
    Remove duplicates from dictionary entries.
    Groups by (lemma, byakuzhi) and merges intelligently.
    Also generates missing IPA for all entries.
    """
    # Group by lemma + byakuzhi
    groups = defaultdict(list)
    
    for entry in entries:
        lemma = entry.get('lemma', '').strip()
        byakuzhi = entry.get('byakuzhi', '').strip()
        
        if not lemma:
            continue
        
        key = (lemma, byakuzhi)
        groups[key].append(entry)
    
    # Process groups
    deduplicated = []
    duplicates_found = 0
    ipa_generated = 0
    
    for key, group_entries in sorted(groups.items()):
        lemma, byakuzhi = key
        
        if len(group_entries) > 1:
            duplicates_found += 1
            print(f"\n🔄 Merging {len(group_entries)} entries for '{lemma}' ({byakuzhi})")
            for i, e in enumerate(group_entries, 1):
                ipa = e.get('ipa', '—')
                notes = e.get('notes', '')
                print(f"   [{i}] IPA: {ipa}, Notes: {notes}")
            
            merged = merge_entries(group_entries)
            deduplicated.append(merged)
        else:
            # Single entry - just ensure IPA is present
            before_ipa = group_entries[0].get('ipa', '')
            entry = generate_ipa_if_missing(group_entries[0])
            after_ipa = entry.get('ipa', '')
            
            if before_ipa != after_ipa and after_ipa:
                ipa_generated += 1
            
            deduplicated.append(entry)
    
    print(f"\n📊 Summary:")
    print(f"   Total entries processed: {len(entries)}")
    print(f"   Duplicate groups found: {duplicates_found}")
    print(f"   IPA generated: {ipa_generated}")
    print(f"   Final entries: {len(deduplicated)}")
    print(f"   Entries removed: {len(entries) - len(deduplicated)}")
    
    return deduplicated

def main():
    # Paths
    data_dir = Path('data')
    dictionary_json = data_dir / 'dictionary.json'
    backup_json = data_dir / 'dictionary_backup.json'
    
    if not dictionary_json.exists():
        print(f"❌ Error: {dictionary_json} not found!")
        sys.exit(1)
    
    print(f"📖 Reading {dictionary_json}...")
    entries = read_dictionary(dictionary_json)
    print(f"   Loaded {len(entries)} entries\n")
    
    # Backup original
    print(f"💾 Creating backup at {backup_json}...")
    with open(backup_json, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)
    
    # Deduplicate
    print(f"\n🔧 Deduplicating and generating IPA...")
    deduplicated = deduplicate_dictionary(entries)
    
    # Write result
    print(f"\n✍️  Writing deduplicated dictionary to {dictionary_json}...")
    with open(dictionary_json, 'w', encoding='utf-8') as f:
        json.dump(deduplicated, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Done! Dictionary has been deduplicated.")
    print(f"   Backup saved at: {backup_json}")

if __name__ == '__main__':
    main()
