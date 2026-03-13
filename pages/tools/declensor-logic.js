// ============================================================
//  IZAKI DECLENSOR LOGIC  —  full implementation
//  Wrapped in IIFE to avoid const collisions with other scripts.
//  Exports to window: declineNoun, declineNounSimple, isKango
// ============================================================
(function () {
  'use strict';

  const VOWELS      = 'aeiou\u0101\u0113\u012b\u014d\u016b';
  const LONG_VOWELS = '\u0101\u0113\u012b\u014d\u016b';

  const VOW_PROG = {
    a:'e', e:'i', i:'o', o:'u', u:'a',
    '\u0101':'e', '\u0113':'i', '\u012b':'o', '\u014d':'u', '\u016b':'a'
  };

  // R1 sonorisation map — keys sorted length-desc for multi-char matching
  const SONOR = { k:'g', t:'d', p:'b', s:'z', ch:'j', ts:'dz', f:'v', sh:'zh' };
  const SONOR_KEYS = Object.keys(SONOR).sort((a,b) => b.length - a.length);

  // R2 degemination map — keys sorted length-desc
  const DEGEM = { kk:'k', tt:'t', pp:'p', ss:'s', cch:'ch', tts:'ts', ssh:'sh', ll:'l', nn:'n' };
  const DEGEM_KEYS = Object.keys(DEGEM).sort((a,b) => b.length - a.length);

  const LENGTHEN = {
    a:'\u0101', e:'\u0113', i:'\u012b', o:'\u014d', u:'\u016b',
    '\u0101':'\u0101', '\u0113':'\u0113', '\u012b':'\u012b', '\u014d':'\u014d', '\u016b':'\u016b'
  };

  function isVowel(c)     { return VOWELS.includes(c); }
  function isLongVowel(c) { return LONG_VOWELS.includes(c); }

  function syllableCount(word) {
    return (word.match(/[aeiou\u0101\u0113\u012b\u014d\u016b]+/gi) || []).length;
  }

  function lastVowelInfo(word) {
    for (let i = word.length - 1; i >= 0; i--) {
      if (isVowel(word[i])) return { char: word[i], idx: i };
    }
    return null;
  }

  // Returns the final consonant cluster (everything after the last vowel)
  // e.g. "kato" → "t" (consonant before final vowel... no, the stem for R1
  // is built differently for vowel-final words: strip final vowel, then apply
  // rules on the resulting consonant-final string, then re-attach the vowel.
  // For consonant-final words the stem IS the word.

  // ── Kango / Byakuzhi detection ──────────────────────────────
  function isKango(entry) {
    if (!entry) return false;
    if (entry.origin === 'byakuzhi') return true;
    if (entry.kango === true || entry.kango === 'true') return true;
    if (entry.lemma && entry.lemma.includes('\u200C')) return true;
    return false;
  }

  // ── Strong stem (R4 → R2 → R3 → R1) ────────────────────────
  //
  // For vowel-final words (e.g. kato):
  //   1. Strip final vowel → "kat"
  //   2. Apply R4/R2/R3 on the consonant-final substring
  //   3. Apply R1 on the consonant-final substring
  //   4. Re-attach the (possibly modified) final vowel
  //
  // For consonant-final words the logic is the same but no stripping needed.

  function buildStrongStem(word) {
    const lc = word.slice(-1);
    const vowelFinal = isVowel(lc);

    // Split: base = everything up to (and including) the vowel-before-last-consonant(s)
    // For vowel-final: workStr = word without final vowel, suffix = final vowel
    // For consonant-final: workStr = word, suffix = ''
    let workStr = vowelFinal ? word.slice(0, -1) : word;
    const finalVowel = vowelFinal ? lc : '';

    let rule1Blocked = false;

    // R4: workStr ends in -ae or -oe (rare, but apply before stripping)
    // Actually R4 targets the full form — recheck on full word
    if (word.endsWith('ae') || word.endsWith('oe')) {
      // insert k before final e: koe → koke, tae → take
      // workStr here already has final vowel stripped if vowelFinal
      // so workStr ends in 'a' or 'o', finalVowel = 'e'
      // Insert 'k' between workStr and finalVowel
      return { stem: workStr + 'k' + finalVowel, rule1Blocked: false };
    }

    // R2: degemination on workStr
    let degApplied = false;
    for (const gem of DEGEM_KEYS) {
      if (workStr.endsWith(gem)) {
        workStr = workStr.slice(0, -gem.length) + DEGEM[gem];
        degApplied = true;
        break;
      }
    }

    // R3: i→e lowering — applies when workStr (vowel-final stripped) ends in 'i'
    // and the full word is bisyllabic
    if (syllableCount(word) === 2 && workStr.endsWith('i')) {
      workStr = workStr.slice(0, -1) + 'e';
      if (degApplied) rule1Blocked = true;
    }

    // R1: sonorisation on the final consonant(s) of workStr
    if (!rule1Blocked && syllableCount(word) > 1) {
      for (const key of SONOR_KEYS) {
        if (workStr.endsWith(key)) {
          const pre = workStr.slice(0, -key.length);
          const lastPre = pre.slice(-1);
          if (isVowel(lastPre) || lastPre === 'n' || lastPre === 'l') {
            workStr = pre + SONOR[key];
            break;
          }
        }
      }
    }

    return { stem: workStr + finalVowel, rule1Blocked };
  }

  // ── Instrumental (vowel progression on weak stem) ────────────
  function buildInstrumental(word) {
    const lc = word.slice(-1);
    if (isVowel(lc)) {
      if (lc === 'i' || lc === '\u012b') return word.slice(0,-1) + 'yo';
      if (lc === 'u' || lc === '\u016b') return word.slice(0,-1) + 'wa';
      return word.slice(0,-1) + VOW_PROG[lc];
    }
    const lv = lastVowelInfo(word);
    if (!lv) return word + 'e';
    const next = VOW_PROG[lv.char] || 'e';
    return next === 'a' ? word + 'wa' : word + next;
  }

  // ── New cases (weak stem) ────────────────────────────────────
  function buildProlative(word) {
    const lc = word.slice(-1);
    if (isVowel(lc)) return word + 'de';
    const lv = lastVowelInfo(word);
    return word + (lv ? VOW_PROG[lv.char] : 'u') + 'de';
  }

  function buildTerminative(word) {
    const lc = word.slice(-1);
    if (isVowel(lc)) return word + 'rai';
    const lv = lastVowelInfo(word);
    return word + (lv ? VOW_PROG[lv.char] : 'u') + 'rai';
  }

  function buildBenefactive(word) {
    const lc = word.slice(-1);
    if (isVowel(lc)) {
      const longV = LENGTHEN[lc];
      if (!longV) return word + lc + 'nba'; // fallback
      return word + longV + 'nba';
    }
    const lv = lastVowelInfo(word);
    const v = lv ? VOW_PROG[lv.char] : 'u';
    return word + v + v + 'ba';
  }

  // ── Plural nominative ────────────────────────────────────────
  // Vowel-final: replace final vowel with its long form + n
  //   kato → kat + ō + n = katōn  (NOT kato + ō + n)
  // Long-vowel-final: + hin
  // Consonant-final: palatalise if needed + i + n
  function buildPluralNom(word) {
    const lc = word.slice(-1);
    if (isVowel(lc)) {
      if (isLongVowel(lc)) return word + 'hin';
      // replace final short vowel with long version
      return word.slice(0, -1) + LENGTHEN[lc] + 'n';
    }
    // consonant-final: palatalise s→sh, then +in
    let base = word;
    if (lc === 's') base = word.slice(0,-1) + 'sh';
    return base + 'in';
  }

  // ── Main declension function ─────────────────────────────────
  function declineNoun(lemma, entry) {
    const word = (lemma || '')
      .replace(/[^a-z\u0101\u0113\u012b\u014d\u016b]/gi, '')
      .toLowerCase().trim();
    const forms = { singular: {}, plural: {}, isKango: false };
    if (!word) return forms;

    // ── Byakuzhi: analytic, no mutations ──
    if (isKango(entry)) {
      forms.isKango = true;
      const lc  = word.slice(-1);
      const isV = isVowel(lc);
      const app = isV ? '' : 'u';
      const ki  = (lc === 'i') ? word + 'k' : word;

      forms.singular.nom = word;
      forms.singular.gen = word + app + 'n';
      forms.singular.acc = word + app;
      forms.singular.dat = word + app + (isV ? 'i' : 'ni');
      forms.singular.ess = word + app + 's';
      forms.singular.all = word + app + 'r';
      forms.singular.abl = word + app + 'l';
      forms.singular.ins = '\u2014';
      forms.singular.pro = word + (isV ? '' : app) + 'de';
      forms.singular.ter = word + (isV ? '' : app) + 'rai';
      forms.singular.ben = '\u2014';

      forms.plural.nom = word + 'ta';
      forms.plural.gen = ki + 'in';
      forms.plural.acc = word + 'ta';
      forms.plural.dat = '\u2014';
      forms.plural.ess = ki + 'is';
      forms.plural.all = ki + 'ir';
      forms.plural.abl = ki + 'il';
      forms.plural.ins = '\u2014';
      forms.plural.pro = '\u2014';
      forms.plural.ter = '\u2014';
      forms.plural.ben = '\u2014';

      return forms;
    }

    // ── Native word ──
    const lc   = word.slice(-1);
    const isV  = isVowel(lc);
    const isLV = isLongVowel(lc);

    // Singular
    forms.singular.nom = word;

    const { stem: strong } = buildStrongStem(word);
    const strongIsV = isVowel(strong.slice(-1));

    forms.singular.gen = strong + (strongIsV ? 'n'  : 'un');
    forms.singular.acc = (isV && !isLV) ? word.slice(0,-1) + LENGTHEN[lc] : word;
    forms.singular.dat = word + 'i';
    forms.singular.ess = strong + (strongIsV ? 's'  : 'us');
    forms.singular.all = strong + (strongIsV ? 'r'  : 'ur');
    forms.singular.abl = strong + (strongIsV ? 'l'  : 'ul');
    forms.singular.ins = buildInstrumental(word);
    forms.singular.pro = buildProlative(word);
    forms.singular.ter = buildTerminative(word);
    forms.singular.ben = buildBenefactive(word);

    // Plural nominative (special construction)
    forms.plural.nom = buildPluralNom(word);

    // Plural oblique: all built on the SINGULAR nominative stem (= word)
    // (not on the plural nominative)
    forms.plural.gen = word + (isV ? 'in' : 'en');
    forms.plural.acc = word + (isV ? 'ita' : 'eta');
    forms.plural.dat = word + (isV ? 'hi' : 'ehi');
    forms.plural.ess = word + (isV ? 'is' : 'es');
    forms.plural.all = word + (isV ? 'ir' : 'er');
    forms.plural.abl = word + (isV ? 'il' : 'el');
    forms.plural.ins = forms.singular.ins + 'i';
    forms.plural.pro = word + (isV ? 'de' : 'ede');
    forms.plural.ter = word + (isV ? 'rai' : 'erai');
    // Benefactive plural: lengthen final vowel of word + nba
    // (consonant-final: add epenthetic vowel first)
    if (isV) {
      const longV = LENGTHEN[lc] || lc;
      forms.plural.ben = word + longV + 'nba';
    } else {
      const lv = lastVowelInfo(word);
      const v  = lv ? VOW_PROG[lv.char] : 'u';
      forms.plural.ben = word + v + v + 'ba';
    }

    return forms;
  }

  function declineNounSimple(lemma) {
    return declineNoun(lemma, null);
  }

  // ── Export ───────────────────────────────────────────────────
  window.declineNoun       = declineNoun;
  window.declineNounSimple = declineNounSimple;
  window.isKango           = isKango;

})();
