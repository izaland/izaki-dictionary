// ============================================================
//  IZAKI DECLENSOR LOGIC  —  full implementation
//  Cases: NOM GEN ACC DAT ESS ALL ABL INS  +  PRO TER BEN
//  Strong-stem rules (native words only):
//    R4 → R2 → R3 (inhibits R1 when triggered by R2) → R1
// ============================================================

const VOWELS      = 'aeiouāēīōū';
const LONG_VOWELS = 'āēīōū';
const SHORT_VOWELS = 'aeiou';

// Vowel progression: a→e→i→o→u→a
const VOW_PROG = { a:'e', e:'i', i:'o', o:'u', u:'a', ā:'e', ē:'i', ī:'o', ō:'u', ū:'a' };

// Sonorisation map (R1)
const SONOR = { k:'g', t:'d', p:'b', s:'z', ch:'j', ts:'dz', f:'v', sh:'zh' };
// Multi-char keys must be tried before single-char ones — sorted by length desc
const SONOR_KEYS = Object.keys(SONOR).sort((a,b) => b.length - a.length);

// Geminate → single map (R2)
const DEGEM = { kk:'k', tt:'t', pp:'p', ss:'s', cch:'ch', tts:'ts', ssh:'sh', ll:'l', nn:'n' };
const DEGEM_KEYS = Object.keys(DEGEM).sort((a,b) => b.length - a.length);

// Long vowel map
const LENGTHEN = { a:'ā', e:'ē', i:'ī', o:'ō', u:'ū', ā:'ā', ē:'ē', ī:'ī', ō:'ō', ū:'ū' };

function isVowel(c)     { return VOWELS.includes(c); }
function isLongVowel(c) { return LONG_VOWELS.includes(c); }

// Count syllable nuclei
function syllableCount(word) {
  return (word.match(/[aeiouāēīōū]+/gi) || []).length;
}

// Last vowel character and its index
function lastVowelInfo(word) {
  for (let i = word.length - 1; i >= 0; i--) {
    if (isVowel(word[i])) return { char: word[i], idx: i };
  }
  return null;
}

// ── Kango detection ─────────────────────────────────────────
// Marked in dictionary.json as { "origin": "byakuzhi" }
function isKango(entry) {
  if (!entry) return false;
  if (entry.origin === 'byakuzhi') return true;
  // legacy fallbacks
  if (entry.kango === true || entry.kango === 'true') return true;
  if (entry.lemma && entry.lemma.includes('\u200C')) return true;
  return false;
}

// ── Strong stem builder (native words only) ─────────────────
// Returns { stem, rule1Blocked }
function buildStrongStem(word) {
  let stem = word;
  let rule1Blocked = false;

  // ── R4: -ae / -oe endings → insert evanescent -k-
  if (stem.endsWith('ae') || stem.endsWith('oe')) {
    stem = stem.slice(0, -1) + 'k' + 'e'; // tae→take, koe→koke
  }

  // ── R2: degemination (try longest key first)
  let degeminationApplied = false;
  for (const gem of DEGEM_KEYS) {
    if (stem.endsWith(gem)) {
      stem = stem.slice(0, -gem.length) + DEGEM[gem];
      degeminationApplied = true;
      break;
    }
  }

  // ── R3: i→e lowering (bisyllabic native, final -i)
  //   When triggered AFTER R2 → blocks R1.
  const stemSyl = syllableCount(stem);
  let rule3Applied = false;
  if (stemSyl === 2 && stem.endsWith('i')) {
    stem = stem.slice(0, -1) + 'e';
    rule3Applied = true;
    if (degeminationApplied) rule1Blocked = true;
  }

  // ── R1: sonorisation (only if not blocked)
  if (!rule1Blocked && syllableCount(stem) > 1) {
    for (const key of SONOR_KEYS) {
      if (stem.endsWith(key)) {
        const preceding = stem.slice(0, -key.length);
        const lastPre = preceding.slice(-1);
        if (isVowel(lastPre) || lastPre === 'n' || lastPre === 'l') {
          stem = preceding + SONOR[key];
          break;
        }
      }
    }
  }

  return { stem, rule1Blocked };
}

// ── Instrumental (vowel progression on weak stem) ─────────────
function buildInstrumental(word) {
  const lastChar = word.slice(-1);
  if (isVowel(lastChar)) {
    if (lastChar === 'i' || lastChar === 'ī') return word.slice(0,-1) + 'yo';
    if (lastChar === 'u' || lastChar === 'ū') return word.slice(0,-1) + 'wa';
    const next = VOW_PROG[lastChar];
    return word.slice(0,-1) + next;
  } else {
    const lv = lastVowelInfo(word);
    if (!lv) return word + 'e';
    const next = VOW_PROG[lv.char] || 'e';
    if (next === 'a') return word + 'wa'; // u→a diphthong
    return word + next;
  }
}

// ── New cases: Prolative, Terminative, Benefactive (weak stem) ───

function buildProlative(word) {
  const lc = word.slice(-1);
  if (isVowel(lc)) return word + 'de';
  const lv = lastVowelInfo(word);
  const v = lv ? VOW_PROG[lv.char] : 'u';
  return word + v + 'de';
}

function buildTerminative(word) {
  const lc = word.slice(-1);
  if (isVowel(lc)) return word + 'rai';
  const lv = lastVowelInfo(word);
  const v = lv ? VOW_PROG[lv.char] : 'u';
  return word + v + 'rai';
}

function buildBenefactive(word) {
  const lc = word.slice(-1);
  if (isVowel(lc)) {
    return word + LENGTHEN[lc] + 'nba';
  }
  const lv = lastVowelInfo(word);
  const v = lv ? VOW_PROG[lv.char] : 'u';
  return word + v + v + 'ba';
}

// ── Plural thematic stem (ends in vowel for oblique suffixes) ───
// Consonant-final: add -i (with palatalisation s→sh, ch stays, n stays)
function pluralTheme(word) {
  const lc = word.slice(-1);
  if (isVowel(lc)) {
    // vowel-final: nominative plural is word + long(lc) + n
    // theme for oblique = nominative plural base
    return isLongVowel(lc) ? word + 'hi' : word + LENGTHEN[lc] + 'n';
  } else {
    let theme = word;
    if (lc === 's') theme = word.slice(0,-1) + 'sh';
    return theme + 'i';
  }
}

// ── Main declension function ─────────────────────────────────
function declineNoun(lemma, entry) {
  const word = (lemma || '').replace(/[^a-zāēīōū]/gi, '').toLowerCase().trim();
  const forms = { singular: {}, plural: {}, isKango: false };
  if (!word) return forms;

  // ── KANGO: analytic forms, no internal mutations
  if (isKango(entry)) {
    forms.isKango = true;
    const lc = word.slice(-1);
    const isV = isVowel(lc);
    const app = isV ? '' : 'u';
    const ki  = (lc === 'i') ? word + 'k' : word; // k-epenthetic for -i finals

    forms.singular.nom = word;
    forms.singular.gen = word + app + 'n';
    forms.singular.acc = word + app; // simplified: no lengthening
    forms.singular.dat = word + app + (isV ? 'i' : 'ni');
    forms.singular.ess = word + app + 's';
    forms.singular.all = word + app + 'r';
    forms.singular.abl = word + app + 'l';
    forms.singular.ins = '—';
    forms.singular.pro = word + (isV ? '' : app) + 'de';
    forms.singular.ter = word + (isV ? '' : app) + 'rai';
    forms.singular.ben = '—';

    forms.plural.nom = word + 'ta';
    forms.plural.gen = ki + 'in';
    forms.plural.acc = word + 'ta'; // same as nom pl for kango
    forms.plural.dat = '—';
    forms.plural.ess = ki + 'is';
    forms.plural.all = ki + 'ir';
    forms.plural.abl = ki + 'il';
    forms.plural.ins = '—';
    forms.plural.pro = '—';
    forms.plural.ter = '—';
    forms.plural.ben = '—';

    return forms;
  }

  // ── NATIVE WORD ──────────────────────────────────────────
  const lc   = word.slice(-1);
  const isV  = isVowel(lc);
  const isLV = isLongVowel(lc);

  // Weak stem = nominative base (no mutations)
  forms.singular.nom = word;

  // Strong stem (for GEN ESS ALL ABL)
  const { stem: strong } = buildStrongStem(word);
  const strongLC = strong.slice(-1);
  const strongIsV = isVowel(strongLC);

  // ── SINGULAR ──
  forms.singular.gen = strong + (strongIsV ? 'n'  : 'un');

  // ACC: lengthen final vowel on weak stem; if long or consonant-final → unchanged
  if (isV && !isLV) {
    forms.singular.acc = word.slice(0,-1) + LENGTHEN[lc];
  } else {
    forms.singular.acc = word;
  }

  forms.singular.dat = word + 'i';
  forms.singular.ess = strong + (strongIsV ? 's'  : 'us');
  forms.singular.all = strong + (strongIsV ? 'r'  : 'ur');
  forms.singular.abl = strong + (strongIsV ? 'l'  : 'ul');
  forms.singular.ins = buildInstrumental(word);
  forms.singular.pro = buildProlative(word);
  forms.singular.ter = buildTerminative(word);
  forms.singular.ben = buildBenefactive(word);

  // ── PLURAL ──
  // Nominative plural
  if (isV) {
    forms.plural.nom = isLV ? word + 'hin' : word + LENGTHEN[lc] + 'n';
  } else {
    // consonant-final: use plural theme + n
    forms.plural.nom = pluralTheme(word) + 'n';
  }

  // Oblique plural: built on plural weak theme (always vowel-final)
  const plT = pluralTheme(word);
  const plTC = plT.slice(-1); // always a vowel

  forms.plural.gen = plT + 'in';
  forms.plural.acc = forms.plural.nom + 'ita'; // nom-pl + ita
  forms.plural.dat = plT + 'hi';
  forms.plural.ess = plT + 'is';
  forms.plural.all = plT + 'ir';
  forms.plural.abl = plT + 'il';
  forms.plural.ins = forms.singular.ins + 'i';

  // New cases plural (plural theme always ends in vowel → vowel rules apply)
  forms.plural.pro = plT + 'de';
  forms.plural.ter = plT + 'rai';
  forms.plural.ben = plT + LENGTHEN[plTC] + 'nba';

  return forms;
}

// Backwards-compatible wrapper
function declineNounSimple(lemma) {
  return declineNoun(lemma, null);
}
