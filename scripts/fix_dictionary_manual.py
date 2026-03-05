#!/usr/bin/env python3
"""Manual dictionary fix script.

Fixes:
1. Generate IPA ONLY for compounds (preserves native words)
2. Remove duplicates while ALWAYS preserving native words
"""

import json
import re
from collections import defaultdict

try:
    import epitran
    epi = epitran.Epitran('eng-Latn')
except ImportError:
    print("Warning: epitran not available, using fallback")
    epi = None

# Load dictionary (it's a direct array)
with open('data/dictionary.json', 'r', encoding='utf-8') as f:
    entries = json.load(f)

print(f"📊 Initial State:")
print(f"Total entries: {len(entries)}")

initial_native = sum(1 for e in entries if not e.get('is_compound', False))
initial_compound = sum(1 for e in entries if e.get('is_compound', False))

print(f"Native words: {initial_native}")
print(f"Compounds: {initial_compound}")

# FIX 1: Generate IPA for compounds only
ipa_generated = 0
for entry in entries:
    # Skip native words
    if not entry.get('is_compound', False):
        continue
    
    ipa = entry.get('ipa', '')
    
    # Check if IPA is missing or placeholder
    if not ipa or ipa in ['【—】', '/', '—', ''] or any(ord(c) >= 0x0A80 and ord(c) <= 0x0AFF for c in ipa):
        lemma = entry.get('lemma', '')
        if lemma and not any(ord(c) >= 0x0A80 and ord(c) <= 0x0AFF for c in lemma):
            # Generate from lemma
            clean = re.sub(r'[^a-zA-Z\s]', '', lemma).lower().strip()
            if clean and epi:
                new_ipa = epi.transliterate(clean)
                if new_ipa and new_ipa.strip():
                    entry['ipa'] = f"/{new_ipa}/"
                    ipa_generated += 1

print(f"\n🔤 IPA generated for {ipa_generated} compound entries")

# FIX 2: Remove duplicates (preserving native words)
seen = {}
unique_entries = []
duplicates_removed = 0

for entry in entries:
    lemma = entry.get('lemma', '')
    byakuzhi = entry.get('byakuzhi', '')
    is_compound = entry.get('is_compound', False)
    
    key = (lemma, byakuzhi)
    
    if key in seen:
        # Duplicate found
        existing = seen[key]
        
        # ALWAYS preserve native words over compounds
        if not is_compound and existing.get('is_compound', False):
            # Replace compound with native
            idx = unique_entries.index(existing)
            unique_entries[idx] = entry
            seen[key] = entry
            duplicates_removed += 1
        elif is_compound and not existing.get('is_compound', False):
            # Keep native, skip compound
            duplicates_removed += 1
            continue
        else:
            # Both same type - merge translations
            existing_trans = set(existing.get('translations', []))
            new_trans = set(entry.get('translations', []))
            merged = sorted(existing_trans | new_trans)
            existing['translations'] = merged
            duplicates_removed += 1
            continue
    else:
        # New entry
        seen[key] = entry
        unique_entries.append(entry)

print(f"\n🗑️  Removed {duplicates_removed} duplicate entries")

# Final stats
final_native = sum(1 for e in unique_entries if not e.get('is_compound', False))
final_compound = sum(1 for e in unique_entries if e.get('is_compound', False))

print(f"\n✅ Final State:")
print(f"Total entries: {len(unique_entries)}")
print(f"Native words: {final_native}")
print(f"Compounds: {final_compound}")

# Save (as direct array)
with open('data/dictionary.json', 'w', encoding='utf-8') as f:
    json.dump(unique_entries, f, ensure_ascii=False, indent=2)

print(f"\n💾 Dictionary saved!")
