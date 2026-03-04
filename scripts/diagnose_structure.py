#!/usr/bin/env python3
"""Diagnose dictionary.json structure to understand the actual format"""

import json
from pathlib import Path
from collections import Counter

def main():
    dictionary_json = Path('data/dictionary.json')
    
    print("🔍 Analyzing dictionary.json structure...\n")
    
    with open(dictionary_json, 'r', encoding='utf-8') as f:
        entries = json.load(f)
    
    print(f"📊 Total entries: {len(entries)}")
    print()
    
    # Count by notes field
    notes_counter = Counter(entry.get('notes', 'NO_NOTES') for entry in entries)
    print("📋 Entries by 'notes' field:")
    for note, count in notes_counter.most_common():
        print(f"   {note or 'empty'}: {count}")
    print()
    
    # Check entries with byakuzhi but no IPA
    no_ipa_with_byakuzhi = [
        entry for entry in entries 
        if entry.get('byakuzhi') and (not entry.get('ipa') or entry.get('ipa') == '—')
    ]
    print(f"⚠️  Entries with byakuzhi but no IPA: {len(no_ipa_with_byakuzhi)}")
    
    # Show first 10 examples
    if no_ipa_with_byakuzhi:
        print("\n📝 First 10 examples (entries needing IPA):")
        for i, entry in enumerate(no_ipa_with_byakuzhi[:10], 1):
            lemma = entry.get('lemma', '???')
            byakuzhi = entry.get('byakuzhi', '???')
            askaoza = entry.get('askaoza', '???')
            ipa = entry.get('ipa', '???')
            notes = entry.get('notes', 'NO_TAG')
            english = entry.get('english', [])
            en_text = english[0] if english else 'NO_EN'
            
            print(f"\n   {i}. {lemma} {byakuzhi} {askaoza}")
            print(f"      IPA: [{ipa}]")
            print(f"      notes: '{notes}'")
            print(f"      EN: {en_text}")
    
    # Check if there are entries where lemma looks like English
    print("\n🔍 Checking for English in lemma field...")
    english_lemmas = []
    
    for entry in entries:
        lemma = entry.get('lemma', '')
        byakuzhi = entry.get('byakuzhi', '')
        
        # Skip if no byakuzhi (native words)
        if not byakuzhi:
            continue
        
        # Check if lemma contains only ASCII and looks like English
        # (no Izaki diacritics: ā, ī, ū, ē, ō, ð)
        if lemma and lemma.isascii():
            has_diacritics = any(char in lemma for char in ['ā', 'ī', 'ū', 'ē', 'ō', 'ð'])
            if not has_diacritics:
                english_lemmas.append(entry)
    
    print(f"   Found {len(english_lemmas)} entries with ASCII-only lemmas")
    
    if english_lemmas:
        print("\n📝 First 10 examples (potential English in lemma):")
        for i, entry in enumerate(english_lemmas[:10], 1):
            lemma = entry.get('lemma', '???')
            byakuzhi = entry.get('byakuzhi', '???')
            notes = entry.get('notes', 'NO_TAG')
            english = entry.get('english', [])
            en_text = english[0] if english else 'NO_EN'
            
            print(f"   {i}. lemma='{lemma}' byakuzhi='{byakuzhi}'")
            print(f"      notes='{notes}' EN='{en_text}'")
    
    print("\n" + "="*60)
    print("\n💡 Key Findings:")
    print(f"   • Total entries: {len(entries)}")
    print(f"   • Entries with 'compound' notes: {notes_counter.get('compound', 0)}")
    print(f"   • Entries with empty notes: {notes_counter.get('', 0)}")
    print(f"   • Entries needing IPA: {len(no_ipa_with_byakuzhi)}")
    print(f"   • Entries with ASCII-only lemma: {len(english_lemmas)}")
    print()
    
    if len(english_lemmas) > 0 and notes_counter.get('compound', 0) == 0:
        print("⚠️  PROBLEM IDENTIFIED:")
        print("   The entries with byakuzhi don't have 'notes: compound'")
        print("   This is why fix_compound_lemmas.py found 0 entries to fix!")
        print()
        print("💡 SOLUTION:")
        print("   We need to update the scripts to also check entries with empty notes field")
        print("   or to set 'notes: compound' during initial import.")

if __name__ == '__main__':
    main()
