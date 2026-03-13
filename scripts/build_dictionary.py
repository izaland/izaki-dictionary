#!/usr/bin/env python3
"""
Build complete dictionary.json from two authoritative CSV sources:

  1. data/izaki_words.csv   ← Google Sheets export (parole native izaki)
  2. data/compounds.csv     ← byakuzhi / composti

⚠️  dictionary.json è SOLO output — non viene mai usato come fonte.
    Ogni build riparte dai CSV. Questo evita duplicazioni e inquinamento
    da dati storici corrotti.
"""

import csv
import json
import re
import sys
from pathlib import Path

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
    if not raw:
        return ''
    pos = raw.strip()
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
    return v.startswith('#') and (v.endswith('!') or '/' in v or v == '#N/A')

# ---------------------------------------------------------------------------
# Lettura sorgenti
# ---------------------------------------------------------------------------

def _split_translations(raw):
    if not raw or not raw.strip():
        return []
    return [p.strip() for p in raw.split(';') if p.strip()]

def read_izaki_sheet_csv(filepath):
    """Legge le parole native izaki dal CSV. Fonte autoritativa."""
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
    """Legge i compounds byakuzhi dal CSV. Fonte autoritativa."""
    entries = []
    skipped = 0
    if not filepath.exists():
        print(f"  ⚠️  {filepath} non trovato — saltato.")
        return entries

    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            english       = row.get('English', '').strip()
            compound      = row.get('Compound', '').strip()
            izaki_reading = row.get('Izaki Reading\n(sandhi applied)', '').strip()

            # Salta righe senza kanji
            if not compound:
                continue
            # Salta righe con errori di formula
            if is_error_cell(izaki_reading) or is_error_cell(compound):
                skipped += 1
                continue
            # Salta righe senza lettura izaki
            if not izaki_reading:
                skipped += 1
                continue
            # La traduzione inglese può mancare o avere #ERROR! — la trattiamo come stringa vuota
            if is_error_cell(english):
                english = ''

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
        print(f"  ⚠️  {skipped} compound saltati (cella vuota o #ERROR!)")
    return entries

# ---------------------------------------------------------------------------
# Merge: CSV nativi + compounds — senza toccare dictionary.json come fonte
# ---------------------------------------------------------------------------

def build_all_entries(sheet_entries, compounds):
    """
    Combina voci native (dal CSV) e compounds (dal CSV).
    Il dictionary.json NON viene letto come fonte — è solo output.
    """
    native = sorted(sheet_entries.values(), key=lambda e: e.get('lemma', '').lower())
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
# main
# ---------------------------------------------------------------------------

def main():
    data_dir      = Path('data')
    izaki_csv     = data_dir / 'izaki_words.csv'
    compounds_csv = data_dir / 'compounds.csv'
    output_json   = data_dir / 'dictionary.json'

    print(f"\n📋 Leggo {izaki_csv}...")
    sheet_entries = read_izaki_sheet_csv(izaki_csv)
    print(f"   {len(sheet_entries)} voci native dal CSV")

    print(f"\n📋 Leggo {compounds_csv}...")
    compounds = read_compounds_csv(compounds_csv)
    print(f"   {len(compounds)} compound (byakuzhi)")

    print(f"\n🔀 Costruzione dizionario...")
    all_entries = build_all_entries(sheet_entries, compounds)

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
