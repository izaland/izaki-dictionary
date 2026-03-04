#!/usr/bin/env python3
"""Quick script to check for and display duplicate entries in dictionary.json"""

import json
from pathlib import Path
from collections import defaultdict

def main():
    dictionary_path = Path('data/dictionary.json')
    
    if not dictionary_path.exists():
        print(f"❌ {dictionary_path} not found!")
        return
    
    print(f"📖 Reading {dictionary_path}...")
    with open(dictionary_path, 'r', encoding='utf-8') as f:
        entries = json.load(f)
    
    print(f"   Total entries: {len(entries)}\n")
    
    # Group by (lemma, byakuzhi)
    groups = defaultdict(list)
    for entry in entries:
        lemma = entry.get('lemma', '').strip()
        byakuzhi = entry.get('byakuzhi', '').strip()
        if lemma:
            groups[(lemma, byakuzhi)].append(entry)
    
    # Find duplicates
    duplicates = {k: v for k, v in groups.items() if len(v) > 1}
    
    if not duplicates:
        print("✅ No duplicates found!")
        return
    
    print(f"🔍 Found {len(duplicates)} duplicate groups:\n")
    print("="*80)
    
    # Show first 10 examples
    for i, ((lemma, byakuzhi), entries_list) in enumerate(sorted(duplicates.items())[:10], 1):
        print(f"\n{i}. {lemma} {byakuzhi}")
        for j, entry in enumerate(entries_list, 1):
            ipa = entry.get('ipa', '—')
            pos = entry.get('pos', '—')
            notes = entry.get('notes', '')
            english = entry.get('english', [])
            if isinstance(english, list):
                eng_str = ', '.join(english[:2])
            else:
                eng_str = str(english)[:30]
            
            tag = f"<{notes}>" if notes else f"<{pos}>"
            print(f"   [{j}] {ipa:20} {tag:15} EN: {eng_str}")
    
    if len(duplicates) > 10:
        print(f"\n... and {len(duplicates) - 10} more duplicate groups.")
    
    print("\n" + "="*80)
    print(f"\n📊 Summary:")
    print(f"   Total duplicate groups: {len(duplicates)}")
    total_dupes = sum(len(v) - 1 for v in duplicates.values())
    print(f"   Extra entries (removable): {total_dupes}")
    print(f"\n💡 Run 'python scripts/deduplicate_dictionary.py' to fix these.")

if __name__ == '__main__':
    main()
