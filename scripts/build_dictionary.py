#!/usr/bin/env python3
"""
Build complete dictionary.json from three sources (in order of priority):

  1. data/izaki_words.csv   ← Google Sheets export (parole native izaki)
  2. data/dictionary.json   ← voci native già presenti
  3. data/compounds.csv     ← byakuzhi / composti
"""

import csv
import json
import re
import sys
import urllib.request
from pathlib import Path

SHEET_CSV_URL = (
    "https://docs.google.com/spreadsheets/d/"
    "16X5QlpYoW5aToM6LoJlEZ8K0XvmlasJArD0vYzFOZ3Y"
    "/export?format=csv&gid=966419572"
)

# ---------------------------------------------------------------------------
# IPA
# ---------------------------------------------------------------------------

PHONETIC_RULES = [
    (r'ā', 'aː'), (r'ē', 'eː'), (r'ī', 'iː'), (r'ō', 'oː'), (r'ū', 'uː'),
    (r'ts', 'ts'), (r'ch', 'tɕ'), (r'sh', 'ʃ'), (r'zh', 'ʒ'),
    (r'ð', 'dz'), (r'j', 'dʒ'), (r'y', 'j'), (r'w', 'w'), (r'r', 'ɾ'),
]

def lemma_to_ipa(reading):
    if not reading or not isinstance(reading, str):
        return ''
    ipa = reading.lower().strip()
    for pattern, replacement in PHONETIC_RULES:
        ipa = re.sub(pattern, replacement, ipa, flags=re.IGNORECASE)
    return f'/{ipa}/'

def should_generate_ipa(current_ipa):
    if not current_ipa or not isinstance(current_ipa, str):
        return True
    ipa = current_ipa.strip()
    if ipa in ['', '【—】', '—', '/', '//']:
        return True
    if any('\u0a80' <= c <= '\u0aff' for c in ipa):
        return True
    return False

# ---------------------------------------------------------------------------
# Normalizzazione POS
# ---------------------------------------------------------------------------

def normalize_pos(raw):
    """
    Pulisce il tag POS dal formato del foglio Google.
    Es: ': n =' -> 'n'  |  ': adj =' -> 'adj'  |  'n' -> 'n'
    """
    if not raw:
        return ''
    pos = raw.strip()
    # Rimuove ': ' iniziale e ' =' finale (con eventuali spazi extra)
    pos = re.sub(r'^:\s*', '', pos)
    pos = re.sub(r'\s*=$', '', pos)
    return pos.strip()

# ---------------------------------------------------------------------------
# Helper: rilevamento celle con errore da Google Sheets
# ---------------------------------------------------------------------------

def is_error_cell(value):
    """Restituisce True se il valore è un errore di formula di Google Sheets."""
    if not value:
        return False
    v = value.strip()
    return v.startswith('#') and (v.endswith('!') or '/' in v)
    # Copre: #ERROR!, #REF!, #N/A, #VALUE!, #DIV/0!, ecc.

# ---------------------------------------------------------------------------
# Lettura sorgenti
# ---------------------------------------------------------------------------

def read_dictionary_json(filepath):
    if not filepath.exists():
        print(f"  ℹ️  {filepath} non trovato — si parte da zero.")
        return []
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def _split_translations(raw):
    if not raw or not raw.strip():
        return []
    return [p.strip() for p in raw.split(';') if p.strip()]

def read_izaki_sheet_csv(filepath):
    entries = {}
    if not filepath.exists():
        print(f"  ⚠️  {filepath} non trovato — saltato.")
        return entries

    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=2):
            lemma = row.get('lemma', '').strip()
            if not lemma or is_error_cell(lemma):
                continue

            ipa_raw = row.get('ipa', '').strip()
            ipa = ipa_raw if not should_generate_ipa(ipa_raw) else lemma_to_ipa(lemma)

            entry = {
                "lemma":    lemma,
                "ipa":      ipa,
                "pos":      normalize_pos(row.get('POS', '')),
                "english":  _split_translations(row.get('english', '').strip()),
                "italian":  _split_translations(row.get('italian', '').strip()),
                "byakuzhi": row.get('byakuzhi', '').strip(),
                "askaoza":  row.get('askaoza', '').strip(),
                "notes":    row.get('notes', '').strip(),
                "example":  row.get('example', '').strip(),
            }
            key = lemma.lower()
            if key not in entries:
                entries[key] = entry
            else:
                print(f"  ⚠️  Riga {i}: lemma duplicato '{lemma}' — tenuto il primo.")

    return entries

def read_compounds_csv(filepath):
    entries = []
    skipped = 0
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            english       = row.get('English', '').strip()
            compound      = row.get('Compound', '').strip()
            izaki_reading = row.get('Izaki Reading\n(sandhi applied)', '').strip()

            # Salta righe vuote o con errori di formula Google Sheets
            if not compound or not izaki_reading:
                continue
            if is_error_cell(izaki_reading) or is_error_cell(english) or is_error_cell(compound):
                skipped += 1
                continue

            entries.append({
                "lemma":    izaki_reading,
                "ipa":      lemma_to_ipa(izaki_reading),
                "pos":      "n",
                "english":  [english] if english else [],
                "italian":  [],
                "byakuzhi": compound,
                "askaoza":  "",
                "notes":    "compound",
                "example":  "",
            })
    if skipped:
        print(f"  ⚠️  {skipped} compound saltati per celle #ERROR! nel CSV")
    return entries

# ---------------------------------------------------------------------------
# Merge
# ---------------------------------------------------------------------------

def merge_entries(json_entries, sheet_entries, compounds):
    base = {}
    for entry in json_entries:
        if entry.get('notes') == 'compound':
            continue
        key = entry.get('lemma', '').lower()
        if key:
            # Normalizza anche le voci già nel JSON
            entry['pos'] = normalize_pos(entry.get('pos', ''))
            base[key] = entry

    for key, entry in sheet_entries.items():
        if key in base:
            print(f"  🔄 Override: '{entry['lemma']}' (foglio > JSON)")
        else:
            print(f"  ➕ Nuovo: '{entry['lemma']}' (dal foglio)")
        base[key] = entry

    native = sorted(base.values(), key=lambda e: e.get('lemma', '').lower())
    return native + compounds

def generate_missing_ipa(entries):
    count = 0
    for entry in entries:
        if entry.get('notes') == 'compound':
            continue
        if should_generate_ipa(entry.get('ipa', '')) and entry.get('lemma'):
            entry['ipa'] = lemma_to_ipa(entry['lemma'])
            count += 1
    return count

# ---------------------------------------------------------------------------
# Download opzionale
# ---------------------------------------------------------------------------

def download_sheet_csv(dest_path):
    print(f"  🌐 Download da Google Sheets...")
    try:
        urllib.request.urlretrieve(SHEET_CSV_URL, dest_path)
        print(f"  ✅ Salvato in {dest_path}")
        return True
    except Exception as e:
        print(f"  ❌ Download fallito: {e}")
        return False

# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main():
    data_dir        = Path('data')
    dictionary_json = data_dir / 'dictionary.json'
    izaki_csv       = data_dir / 'izaki_words.csv'
    compounds_csv   = data_dir / 'compounds.csv'
    output_json     = data_dir / 'dictionary.json'

    if '--download' in sys.argv:
        print("📥 Modalità --download attiva")
        if not download_sheet_csv(izaki_csv):
            sys.exit(1)

    print(f"\n📖 Leggo {dictionary_json}...")
    json_entries = read_dictionary_json(dictionary_json)
    json_native  = [e for e in json_entries if e.get('notes') != 'compound']
    print(f"   {len(json_native)} voci native nel JSON")

    print(f"\n📋 Leggo {izaki_csv}...")
    sheet_entries = read_izaki_sheet_csv(izaki_csv)
    print(f"   {len(sheet_entries)} voci dal foglio Google")

    print(f"\n📋 Leggo {compounds_csv}...")
    compounds = read_compounds_csv(compounds_csv)
    print(f"   {len(compounds)} compound (byakuzhi)")

    print(f"\n🔀 Merge in corso...")
    all_entries = merge_entries(json_native, sheet_entries, compounds)

    ipa_count = generate_missing_ipa(all_entries)
    if ipa_count:
        print(f"\n✨ IPA generata per {ipa_count} voci")

    print(f"\n💾 Scrivo {output_json}...")
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(all_entries, f, ensure_ascii=False, indent=2)

    native_count   = sum(1 for e in all_entries if e.get('notes') != 'compound')
    compound_count = sum(1 for e in all_entries if e.get('notes') == 'compound')
    print(f"\n✅ Fatto!")
    print(f"   Voci native:   {native_count}")
    print(f"   Compound:      {compound_count}")
    print(f"   TOTALE:        {len(all_entries)}")

if __name__ == '__main__':
    main()
