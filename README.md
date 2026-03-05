# izaki-dictionary

Izaki language dictionary with byakuzhi, verbs, and noun resources.

## 📖 Contents

- **byakuzhi.json** - Database of Izaki ideographs with readings (onnufu, kunnufu, askaоza)
- **compounds.csv** - Compound words made of byakuzhi
- **verbs.csv** - Izaki verb conjugations
- **nouns.csv** - Izaki nouns with translations

## 🔧 Tools

### Auto-generate Compound Readings

The `generate_compound_readings.py` script automatically generates missing Izaki pronunciations for compounds by combining the readings (onnufu) of individual byakuzhi.

#### Requirements

- Python 3.6+
- No external dependencies (uses only standard library)

#### Usage

```bash
# Run the script
python generate_compound_readings.py
```

#### What It Does

1. Reads `data/byakuzhi.json` for individual character readings
2. For each compound in `data/compounds.csv` without an Izaki Reading:
   - Checks if ALL byakuzhi have `onnufu` defined
   - If YES: applies phonetic rules to generate the reading
   - If NO: skips the compound (will be resolved after cataloging missing byakuzhi)
3. Outputs:
   - `data/compounds_updated.csv` - CSV with generated readings
   - `report.txt` - Statistics and processing log

#### Phonetic Rules

The script implements Izaki phonological rules:

- **Gemination**: `s/t/k/p + consonant → doubled consonant`
  - Example: `as + chaku → acchaku`

- **Nasal assimilation**: `n + p/b/m → m + p/b/m`
  - Example: `pan + pīn → pampīn`

- **Default**: Direct concatenation
  - Example: `ai + ma → aima`

#### Example Output

```
Caricamento database byakuzhi...
  Caricati 1247 byakuzhi

Lettura compounds.csv...
  Letti 500 composti

Processamento composti...
  ✓ 圧着 (pressure wear): acchaku
  ✓ 番兵 (guard soldier): pampīn
  ✗ 刀剣 (sword): SKIPPED (byakuzhi mancanti)

============================================================
REPORT FINALE
============================================================
Totale composti: 500
Già con pronuncia: 200
Nuove pronunce generate: 250
Saltati (byakuzhi mancanti): 50
============================================================
```

## 🚀 GitHub Actions

The repository includes an automated workflow that:
- Runs when `byakuzhi.json` or `compounds.csv` are updated
- Can be triggered manually from the Actions tab
- Generates readings and creates a Pull Request for review

## 📝 Development

### Workflow

1. Add/update byakuzhi in the Google Spreadsheet
2. Export to `byakuzhi.json`
3. Run the generation script (automatically via GitHub Actions or manually)
4. Review the generated readings in `compounds_updated.csv`
5. Commit the changes

### File Structure

```
izaki-dictionary/
├── data/
│   ├── byakuzhi.json       # Byakuzhi database
│   ├── compounds.csv       # Compound words
│   ├── verbs.csv           # Verb conjugations
│   └── nouns.csv           # Nouns
├── pages/                  # Dictionary web pages
├── generate_compound_readings.py
├── .github/workflows/      # GitHub Actions
├── .gitignore
└── README.md
```

## ⚖️ License

This dictionary is part of the Izaki conlang project.
