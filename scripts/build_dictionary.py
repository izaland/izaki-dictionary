#!/usr/bin/env python3
"""
Build complete dictionary.json from three sources (in order of priority):

  1. data/izaki_words.csv   ← Google Sheets export (parole native izaki)
                              FONTE DI VERITA' per le parole native.
                              Sovrascrive le voci omonime già nel JSON.

  2. data/dictionary.json   ← voci native già presenti (usate solo se NON
                              presenti nel foglio Google)

  3. data/compounds.csv     ← byakuzhi / composti
                              SEMPRE priorità assoluta sulle voci con byakuzhi.

Usage:
  # Sincronizzazione manuale: scarica prima il CSV dal foglio Google, poi:
  python scripts/build_dictionary.py

  # Per scaricare il CSV direttamente (richiede curl o wget):
  curl -L "https://docs.google.com/spreadsheets/d/16X5QlpYoW5aToM6LoJlEZ8K0XvmlasJArD0vYzFOZ3Y/export?format=csv&gid=966419572" \
       -o data/izaki_words.csv
"""

import csv
import json
import re
import sys
import urllib.request
from pathlib import Path

# ---------------------------------------------------------------------------
# Costanti
# ---------------------------------------------------------------------------

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
    """Converte una lettura izaki in trascrizione IPA approssimata."""
    if not reading or not isinstance(reading, str):
        return ''
    ipa = reading.lower().strip()
    for pattern, replacement in PHONETIC_RULES:
        ipa = re.sub(pattern, replacement, ipa, flags=re.IGNORECASE)
    return f'/{ipa}/'

def should_generate_ipa(current_ipa):
    """True se l'IPA è assente o è un segnaposto da rimpiazzare."""
    if not current_ipa or not isinstance(current_ipa, str):
        return True
    ipa = current_ipa.strip()
    placeholders = ['', '【—】', '—', '/', '//']
    if ipa in placeholders:
        return True
    # Caratteri gujarati che a volte finivano nell'IPA per errore
    if any('\u0a80' <= c <= '\u0aff' for c in ipa):
        return True
    return False

# ---------------------------------------------------------------------------
# Lettura sorgenti
# ---------------------------------------------------------------------------

def read_dictionary_json(filepath):
    """Legge il dictionary.json esistente. Restituisce lista vuota se non esiste."""
    if not filepath.exists():
        print(f"  ℹ️  {filepath} non trovato — si parte da zero.")
        return []
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def _split_translations(raw):
    """
    Converte una stringa di traduzioni in lista.

    Regola: splitta su ';' (separatore principale tra significati distinti).
    Le virgole rimangono DENTRO la stringa perché fanno parte del significato
    (es. "abundant, rich" è un unico senso, non due voci separate).

    Se la cella è vuota restituisce lista vuota.
    """
    if not raw or not raw.strip():
        return []
    parts = [p.strip() for p in raw.split(';') if p.strip()]
    return parts


def read_izaki_sheet_csv(filepath):
    """
    Legge data/izaki_words.csv (export dal foglio Google).

    Intestazione attesa (colonne A-I):
        lemma, ipa, POS, english, italian, byakuzhi, askaoza, notes, example

    Restituisce un dict  lemma (lowercase) -> entry_dict
    in modo da facilitare il merge per chiave.
    """
    entries = {}
    if not filepath.exists():
        print(f"  ⚠️  {filepath} non trovato — saltato.")
        print("      Esegui prima:")
        print(f"      curl -L '{SHEET_CSV_URL}' -o {filepath}")
        return entries

    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=2):  # riga 1 = intestazione
            lemma = row.get('lemma', '').strip()
            if not lemma:
                print(f"  ⚠️  Riga {i}: lemma vuoto, saltata.")
                continue

            ipa_raw = row.get('ipa', '').strip()
            ipa = ipa_raw if not should_generate_ipa(ipa_raw) else lemma_to_ipa(lemma)

            english_raw  = row.get('english', '').strip()
            italian_raw  = row.get('italian', '').strip()

            entry = {
                "lemma":    lemma,
                "ipa":      ipa,
                "pos":      row.get('POS', '').strip().lower(),
                "english":  _split_translations(english_raw),
                "italian":  _split_translations(italian_raw),
                "byakuzhi": row.get('byakuzhi', '').strip(),
                "askaoza":  row.get('askaoza', '').strip(),
                "notes":    row.get('notes', '').strip(),
                "example":  row.get('example', '').strip(),
            }
            key = lemma.lower()
            if key in entries:
                print(f"  ⚠️  Riga {i}: lemma duplicato '{lemma}' nel CSV — tenuto il primo.")
            else:
                entries[key] = entry

    return entries


def read_compounds_csv(filepath):
    """Legge compounds.csv (byakuzhi). Invariato rispetto alla versione precedente."""
    entries = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            english      = row.get('English', '').strip()
            compound     = row.get('Compound', '').strip()
            izaki_reading = row.get('Izaki Reading', '').strip()

            if not compound or not izaki_reading:
                print(f"  ⚠️  Riga compounds senza dati: {row}")
                continue

            entry = {
                "lemma":    izaki_reading,
                "ipa":      lemma_to_ipa(izaki_reading),
                "pos":      "n",
                "english":  [english] if english else [],
                "italian":  [],
                "byakuzhi": compound,
                "askaoza":  "",
                "notes":    "compound",
                "example":  "",
            }
            entries.append(entry)
    return entries

# ---------------------------------------------------------------------------
# Merge
# ---------------------------------------------------------------------------

def merge_entries(json_entries, sheet_entries, compounds):
    """
    Strategia di merge:

    1. Parte dalla base di voci nel JSON esistente (filtrando i compound).
    2. Le voci del foglio Google SOVRASCRIVONO quelle omonime nel JSON.
    3. Le voci del foglio Google non presenti nel JSON vengono AGGIUNTE.
    4. I compound (byakuzhi) vengono aggiunti in coda; se una voce nativa
       ha già un campo byakuzhi non vuoto (dal foglio) NON viene sostituita
       dal compound — il foglio Google rimane fonte di verità anche per byakuzhi
       nelle parole native. I compound puri (notes=compound) vengono sempre
       aggiunti come voci separate.

    Ordine finale: parole native (A-Z per lemma) + compounds.
    """
    # Costruisci dizionario base dal JSON (senza compound precedenti)
    base = {}
    for entry in json_entries:
        if entry.get('notes') == 'compound':
            continue
        key = entry.get('lemma', '').lower()
        if key:
            base[key] = entry

    # Sovrascrivi/aggiungi con voci dal foglio Google
    for key, entry in sheet_entries.items():
        if key in base:
            print(f"  🔄 Override: '{entry['lemma']}' (foglio > JSON)")
        else:
            print(f"  ➕ Nuovo: '{entry['lemma']}' (dal foglio)")
        base[key] = entry

    # Ordina per lemma (case-insensitive)
    native = sorted(base.values(), key=lambda e: e.get('lemma', '').lower())

    return native + compounds


def generate_missing_ipa(entries):
    """Genera IPA per le voci native che non ce l'hanno ancora."""
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
    """Scarica il CSV dal foglio Google. Richiede connessione internet."""
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
    data_dir      = Path('data')
    dictionary_json = data_dir / 'dictionary.json'
    izaki_csv     = data_dir / 'izaki_words.csv'
    compounds_csv = data_dir / 'compounds.csv'
    output_json   = data_dir / 'dictionary.json'

    # --- Opzione --download: scarica il CSV al volo ---
    if '--download' in sys.argv:
        print("📥 Modalità --download attiva")
        if not download_sheet_csv(izaki_csv):
            sys.exit(1)

    # --- Lettura sorgenti ---
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

    # --- Merge ---
    print(f"\n🔀 Merge in corso...")
    all_entries = merge_entries(json_native, sheet_entries, compounds)

    # --- IPA mancante ---
    ipa_count = generate_missing_ipa(all_entries)
    if ipa_count:
        print(f"\n✨ IPA generata per {ipa_count} voci")

    # --- Scrittura ---
    print(f"\n💾 Scrivo {output_json}...")
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(all_entries, f, ensure_ascii=False, indent=2)

    # --- Riepilogo ---
    native_count   = sum(1 for e in all_entries if e.get('notes') != 'compound')
    compound_count = sum(1 for e in all_entries if e.get('notes') == 'compound')
    print(f"\n✅ Fatto!")
    print(f"   Voci native:   {native_count}")
    print(f"   Compound:      {compound_count}")
    print(f"   TOTALE:        {len(all_entries)}")

if __name__ == '__main__':
    main()
