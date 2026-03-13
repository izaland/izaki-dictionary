// ============================================================
//  IZAKI DECLENSOR LOGIC  —  full implementation
//  Cases: NOM GEN ACC DAT ESS ALL ABL INS  +  PRO TER BEN
//  Strong-stem rules (native words only):
//    R4 → R2 → R3 (inhibits R1 when triggered by R2) → R1
// ============================================================

// ── Helpers ─────────────────────────────────────────────────

const VOWELS      = 'aeiouāēīōū';
const LONG_VOWELS = 'āēīōū';
const SHORT_VOWELS = 'aeiou';

// Vowel progression: a→e→i→o→u→a (for plural theme and new cases)
const VOW_PROG = { a:'e', e:'i', i:'o', o:'u', u:'a', ā:'e', ē:'i', ī:'o', ō:'u', ū:'a' };

// Sonorisation map (R1)
const SONOR = { k:'g', t:'d', p:'b', s:'z', ch:'j', ts:'dz', f:'v', sh:'zh' };

// Geminate → single map (R2)
const DEGEM = { kk:'k', tt:'t', pp:'p', ss:'s', cch:'ch', tts:'ts', ssh:'sh', ll:'l', nn:'n' };

// Long vowel map
const LENGTHEN = { a:'ā', e:'ē', i:'ī', o:'ō', u:'ū', ā:'ā', ē:'ē', ī:'ī', ō:'ō', ū:'ū' };

function isVowel(c)     { return VOWELS.includes(c); }
function isLongVowel(c) { return LONG_VOWELS.includes(c); }
function isShortVowel(c){ return SHORT_VOWELS.includes(c); }

// Count syllables (rough: number of vowel clusters)
function syllableCount(word) {
  return (word.match(/[aeiouāēīōū]+/gi) || []).length;
}

// Find the last vowel character and its index in the string
function lastVowelInfo(word) {
  for (let i = word.length - 1; i >= 0; i--) {
    if (isVowel(word[i])) return { char: word[i], idx: i };
  }
  return null;
}

// Shorten a long vowel to its short version
function shorten(v) {
  const map = { ā:'a', ē:'e', ī:'i', ō:'o', ū:'u' };
  return map[v] || v;
}

// ── Kango detection ─────────────────────────────────────────
// dictionary.json marks kango entries with a zero-width non-joiner U+200C
// embedded in the lemma or a dedicated field. We check both conventions.
function isKango(entry) {
  if (!entry) return false;
  // Convention 1: lemma contains U+200C
  if (entry.lemma && entry.lemma.includes('\u200C')) return true;
  // Convention 2: explicit boolean/string field
  if (entry.kango === true || entry.kango === 'true' || entry.origin === 'kango') return true;
  return false;
}

// ── Strong stem builder (native words only) ─────────────────
// Returns { stem, rule1Blocked }
function buildStrongStem(word) {
  let stem = word;
  let rule1Blocked = false;
  const sylCount = syllableCount(word);

  // ── R4: -ae / -oe endings → insert evanescent -k-
  if (stem.endsWith('ae') || stem.endsWith('oe')) {
    // Insert k before final e
    stem = stem.slice(0, -1) + 'k' + 'e'; // e.g. tae → take, koe → koke
    // recompute sylCount after R4 for R3
  }

  const sylCountAfterR4 = syllableCount(stem);

  // ── R2: degemination
  let degeminationApplied = false;
  for (const [gem, single] of Object.entries(DEGEM)) {
    if (stem.endsWith(gem)) {
      stem = stem.slice(0, -gem.length) + single;
      degeminationApplied = true;
      break;
    }
  }

  // ── R3: i→e lowering (bisyllabic, native, final -i)
  //   Triggered independently OR after R2.
  //   When triggered AFTER R2 → R1 is blocked.
  const stemSylCount = syllableCount(stem);
  let rule3Applied = false;

  if (stemSylCount === 2 && stem.endsWith('i')) {
    stem = stem.slice(0, -1) + 'e';
    rule3Applied = true;
    if (degeminationApplied) {
      rule1Blocked = true; // R2→R3 chain inhibits R1
    }
  }

  // ── R1: sonorisation (only if not blocked)
  if (!rule1Blocked && stemSylCount > 1) {
    // Try multi-char finals first (ch, ts, sh)
    let sonorised = false;
    for (const [voiceless, voiced] of Object.entries(SONOR)) {
      if (stem.endsWith(voiceless)) {
        const preceding = stem.slice(0, -voiceless.length);
        const lastPrecChar = preceding.slice(-1);
        if (isVowel(lastPrecChar) || lastPrecChar === 'n' || lastPrecChar === 'l') {
          stem = preceding + voiced;
          sonorised = true;
          break;
        }
      }
    }
  }

  return { stem, rule1Blocked };
}

// ── Plural nominative stem ───────────────────────────────────
function buildPluralNomStem(word) {
  const lv = lastVowelInfo(word);
  if (!lv) return word + 'a'; // fallback for all-consonant (shouldn't happen)

  const lastChar = word.slice(-1);

  if (isVowel(lastChar)) {
    // Vowel-final: lengthen + n  (miwā → miwaan)
    // If already long vowel, add hin
    if (isLongVowel(lastChar)) {
      return word + 'hin';
    }
    return word + LENGTHEN[lastChar] + 'n'; // miwa → miwāān  (simplified: miwa+ān)
    // Actually per grammar: prolong last vowel + n
    // miwa → miwaan  we store as miwa + ān shorthand
  } else {
    // Consonant-final: double last consonant + repeat preceding vowel
    // e.g. tsaikis → tsaikisshi, moigon → moigonno
    // We implement the -i thematic plural stem for case suffixes
    return word; // handled case-by-case below
  }
}

// ── Instrumental (vowel progression) ────────────────────────
function buildInstrumental(word) {
  const lastChar = word.slice(-1);
  if (isVowel(lastChar)) {
    const next = VOW_PROG[lastChar];
    // Special diphthong contractions per grammar:
    // -i → -yo, -u → -wa
    if (lastChar === 'i' || lastChar === 'ī') return word.slice(0,-1) + 'yo';
    if (lastChar === 'u' || lastChar === 'ū') return word.slice(0,-1) + 'wa';
    return word.slice(0,-1) + next;
  } else {
    // consonant-final: double consonant + vowel progression of last vowel
    const lv = lastVowelInfo(word);
    if (!lv) return word + 'e';
    const next = VOW_PROG[lv.char] || 'e';
    if (next === 'o') return word + next; // i→o
    if (next === 'a') return word + 'wa'; // u→a diphthong
    return word + next;
  }
}

// ── New-case suffixes (weak stem = nominative form) ──────────

// Prolativo (経格): -de (vowel-final) | -[V*]de (consonant-final)
function buildProlative(word) {
  const lastChar = word.slice(-1);
  if (isVowel(lastChar)) return word + 'de';
  const lv = lastVowelInfo(word);
  const v = lv ? VOW_PROG[lv.char] : 'u';
  return word + v + 'de';
}

// Terminativo (止格): -rai (vowel-final) | -[V*]rai (consonant-final)
function buildTerminative(word) {
  const lastChar = word.slice(-1);
  if (isVowel(lastChar)) return word + 'rai';
  const lv = lastVowelInfo(word);
  const v = lv ? VOW_PROG[lv.char] : 'u';
  return word + v + 'rai';
}

// Benefattivo (為格): -Vnba / -[VV]ba
// vowel-final: lengthen vowel + nba  (miwa → miwaanba)
// consonant-final: [V*][V*]ba  (tsaikis → tsaikisooba)
function buildBenefactive(word) {
  const lastChar = word.slice(-1);
  if (isVowel(lastChar)) {
    return word + LENGTHEN[lastChar] + 'nba';
  }
  const lv = lastVowelInfo(word);
  const v = lv ? VOW_PROG[lv.char] : 'u';
  return word + v + v + 'ba'; // double = long vowel representation
}

// ── Plural case suffix helper ────────────────────────────────
// Plural weak theme: consonant-final words use -i- thematic
// (with palatalisation s+i → shi, ch+i → chi etc.)
function pluralTheme(word) {
  const lastChar = word.slice(-1);
  if (isVowel(lastChar)) {
    // vowel-final plural nom stem (e.g. miwaan)
    // for oblique cases add -i- after the -n
    const nom = isLongVowel(lastChar)
      ? word + 'hin'
      : word + LENGTHEN[lastChar] + 'n';
    return nom; // oblique adds -i directly on this
  } else {
    // consonant + i thematic
    let theme = word;
    // Palatalisation: s/sh/ch/ts + i → shi / chi / etc.
    if (lastChar === 's') theme = word.slice(0,-1) + 'sh';
    else if (lastChar === 'n') theme = word; // n+i stays ni
    return theme + 'i';
  }
}

// ── Main declension function ─────────────────────────────────
function declineNoun(lemma, entry) {
  const word = lemma.replace(/[^a-zāēīōū]/gi, '').toLowerCase().trim();
  const forms = { singular: {}, plural: {}, isKango: false };

  // ── KANGO: return stub, no mutation
  if (isKango(entry)) {
    forms.isKango = true;
    const lastChar = word.slice(-1);
    const isVC = isVowel(lastChar);
    const app = isVC ? '' : 'u'; // appoggio vowel for consonant-final

    forms.singular.nom = word;
    forms.singular.gen = word + app + 'n';
    forms.singular.acc = word + app + (isVC ? '' : '') + (isVC ? word.slice(-1) === 'i' ? 'k' : '' : '') ; // simplified
    forms.singular.dat = word + app + (isVC ? 'i' : 'ni');
    forms.singular.ess = word + app + 's';
    forms.singular.all = word + app + 'r';
    forms.singular.abl = word + app + 'l';
    forms.singular.ins = '—'; // not applicable to kango
    forms.singular.pro = word + 'de';
    forms.singular.ter = word + 'rai';
    forms.singular.ben = '—';

    const ki = word.endsWith('i') ? word + 'k' : word;
    forms.plural.nom  = word + 'ta';
    forms.plural.gen  = ki + 'in';
    forms.plural.ess  = ki + 'is';
    forms.plural.all  = ki + 'ir';
    forms.plural.abl  = ki + 'il';
    forms.plural.ins  = '—';
    forms.plural.pro  = '—';
    forms.plural.ter  = '—';
    forms.plural.ben  = '—';

    return forms;
  }

  // ── NATIVE WORD ──────────────────────────────────────────

  const lastChar = word.slice(-1);
  const isVC = isVowel(lastChar);
  const isLV = isLongVowel(lastChar);

  // Weak stem = nominative base
  forms.singular.nom = word;

  // Strong stem (for GEN, ESS, ALL, ABL)
  const { stem: strong } = buildStrongStem(word);
  const strongLastChar = strong.slice(-1);
  const strongIsVowel  = isVowel(strongLastChar);

  // ── Singular cases ──────────────────────────────────────

  // GEN: strong stem + -n / -un
  forms.singular.gen = strong + (strongIsVowel ? 'n' : 'un');

  // ACC: weak stem, lengthen last vowel (if already long or consonant-final → unchanged)
  if (isVC && !isLV) {
    forms.singular.acc = word.slice(0,-1) + LENGTHEN[lastChar];
  } else {
    forms.singular.acc = word; // long vowel or consonant-final: unchanged
  }

  // DAT: weak stem + -i
  forms.singular.dat = word + (isVC ? 'i' : 'i');

  // ESS: strong stem + -s / -us
  forms.singular.ess = strong + (strongIsVowel ? 's' : 'us');

  // ALL: strong stem + -r / -ur
  forms.singular.all = strong + (strongIsVowel ? 'r' : 'ur');

  // ABL: strong stem + -l / -ul
  forms.singular.abl = strong + (strongIsVowel ? 'l' : 'ul');

  // INS: vowel progression on weak stem
  forms.singular.ins = buildInstrumental(word);

  // New cases (weak stem):
  forms.singular.pro = buildProlative(word);
  forms.singular.ter = buildTerminative(word);
  forms.singular.ben = buildBenefactive(word);

  // ── Plural cases ─────────────────────────────────────────

  // Plural nominative
  if (isVC) {
    if (isLV) {
      forms.plural.nom = word + 'hin';
    } else {
      forms.plural.nom = word + LENGTHEN[lastChar] + 'n';
    }
  } else {
    // consonant-final: double last consonant + repeat preceding vowel
    // Simplified: use thematic -i stem for display of nom
    const lv = lastVowelInfo(word);
    const prevVow = lv ? lv.char : 'a';
    // geminate: we just write lastChar twice + prevVow
    const gem = lastChar + lastChar; // e.g. ss, nn
    forms.plural.nom = word + gem.slice(lastChar.length) + prevVow + 'n';
    // Actually per grammar: double last consonant, repeat vowel:
    // tsaikis → tsaikisshi  (s→ss + i from preceding vowel? no: repeat preceding vowel)
    // Let's use the thematic -i palatal approach for consonant-final:
    forms.plural.nom = pluralTheme(word) + 'n'; // tsaikishi+n → tsaikishin
  }

  // Plural oblique: built on plural weak theme
  const plTheme = pluralTheme(word); // ends in vowel

  // GEN pl: theme + -in
  forms.plural.gen = plTheme + (isVC ? 'in' : 'in');

  // ACC pl: theme + -ita (vowel-final base) or -ta (consonant)
  forms.plural.acc = isVC ? word + LENGTHEN[lastChar] + 'n' + 'ita' : plTheme + 'ta';
  // Per grammar: nom-pl + -ita
  forms.plural.acc = forms.plural.nom + 'ita'; // simplified: nom+ita

  // DAT pl: theme + -hi
  forms.plural.dat = plTheme + 'hi';

  // ESS pl: theme + -is
  forms.plural.ess = plTheme + 'is';

  // ALL pl: theme + -ir
  forms.plural.all = plTheme + 'ir';

  // ABL pl: theme + -il
  forms.plural.abl = plTheme + 'il';

  // INS pl: singular instrumental + -i
  forms.plural.ins = forms.singular.ins + 'i';

  // New cases plural (on plural weak theme, which ends in vowel):
  forms.plural.pro = plTheme + 'de';      // -de (vowel-final rule)
  forms.plural.ter = plTheme + 'rai';     // -rai
  // BEN pl: lengthen theme vowel + nba
  const plThemeLast = plTheme.slice(-1);
  forms.plural.ben = plTheme + LENGTHEN[plThemeLast] + 'nba';

  return forms;
}

// ── Backwards-compatible wrapper (used by declensor.html) ────
function declineNounSimple(lemma) {
  return declineNoun(lemma, null);
}
