import json, re

IPA_CHARS = set('ʤʧʦʣʃʒʨɟɲŋβðθ')

def is_ipa_lemma(lemma):
    return any(c in IPA_CHARS for c in lemma)

def normalize_pos(pos):
    pos = pos.strip()
    m = re.match(r'^:\s*(.+?)\s*=$', pos)
    return m.group(1).strip() if m else pos

with open('data/dictionary.json', encoding='utf-8') as f:
    entries = json.load(f)

# Raggruppa per IPA: tieni la voce con lemma ASCII (non-IPA)
groups = {}
for e in entries:
    key = e['ipa']
    if key not in groups:
        groups[key] = []
    groups[key].append(e)

cleaned = []
for key, group in groups.items():
    ascii_entries = [e for e in group if not is_ipa_lemma(e['lemma'])]
    chosen = ascii_entries[0] if ascii_entries else group[0]
    chosen['pos'] = normalize_pos(chosen['pos'])
    cleaned.append(chosen)

cleaned.sort(key=lambda e: e['lemma'].lower())

with open('data/dictionary_clean.json', 'w', encoding='utf-8') as f:
    json.dump(cleaned, f, ensure_ascii=False, indent=2)

print(f"Originale: {len(entries)} voci → Pulito: {len(cleaned)} voci")
