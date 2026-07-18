# Regole di Sandhi per Izaki

Questo documento descrive le regole fonetiche (sandhi) applicate alla lingua Izaki.

## Panoramica

Le regole di sandhi sono modifiche fonetiche che avvengono quando morfemi o parole si combinano. In Izaki, queste regole si applicano principalmente nei composti.

## Regole per Alfabeto/IPA

### 1. Assimilazione di /s/ + consonante

Quando /s/ precede determinate consonanti, si assimila:

- `szh` → `ssh` (s + zh diventa ssh)
- `sts` → `tts` (s + ts diventa tts)
- `sð` → `tts` (s + ð diventa tts)
- `sdz` → `tts` (s + dz diventa tts)
- `sz` → `tts` (s + z diventa tts)
- `sch` → `cch` (s + ch diventa cch)
- `sj` → `cch` (s + j diventa cch)
- `sd` → `st` (s + d diventa st)
- `sg` → `sk` (s + g diventa sk)
- `sb` → `sp` (s + b diventa sp)
- `sv` → `sf` (s + v diventa sf)

### 2. Assimilazione di /k/ + sibilante

Quando /k/ precede sibilanti:

- `ksh` → `ssh` (k + sh diventa ssh)
- `kts` → `tts` (k + ts diventa tts)
- `kch` → `cch` (k + ch diventa cch)
- `ks` → `ss` (k + s diventa ss)

### 3. Assimilazione nasale

La nasale /n/ si assimila al punto di articolazione delle labiali:

- `np` → `mp` (n + p diventa mp)
- `nb` → `mb` (n + b diventa mb)

### 4. Dissimilazione liquida

La sequenza /nr/ diventa /nl/ per evitare la ripetizione di rotiche:

- `nr` → `nl`

## Regole per Askaoza

Per la scrittura askaoza (ideogrammi), si applica **solo** la regola di dissimilazione liquida:

- `nr` → `nl`

Le altre regole di assimilazione **non si applicano** in askaoza perché:
1. Gli ideogrammi rappresentano unità morfemiche, non fonetiche
2. La pronuncia effettiva avviene naturalmente senza bisogno di indicarla graficamente

## Esempi

### Alfabeto/IPA

| Forma base | Dopo sandhi | Glossa |
|------------|-------------|--------|
| ansan | ansan | 安山 "Ansan" (nessun cambiamento) |
| kanri | kanni | 管理 "gestione" (nr → nl) |

### Askaoza

| Ideogramma | Lettura corretta | Nota |
|------------|------------------|------|
| 安山 | ansan | Nessun sandhi applicato |
| 管理 | kanni | Solo nr → nl |

## Implementazione

Queste regole sono implementate nello script `scripts/apply_sandhi.py`:

```bash
# Applicare le regole a tutti i file
python scripts/apply_sandhi.py
```

## Riferimenti

Per maggiori dettagli sulla fonologia di Izaki, vedere:
- [izaland.github.io/izaki-dictionary](https://izaland.github.io/izaki-dictionary)
- Documentazione linguistica completa (TBD)
