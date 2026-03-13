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

  // Sonorisation map (R1) — keys sorted length-desc at build time
  const SONOR = { k:'g', t:'d', p:'b', s:'z', ch:'j', ts:'dz', f:'v', sh:'zh' };
  const SONOR_KEYS = Object.keys(SONOR).sort((a,b) => b.length - a.length);

  // Degemination map (R2) — keys sorted length-desc
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

  // ── Kango / Byakuzhi detection ──────────────────────────────
  function isKango(entry) {
    if (!entry) return false;
    if (entry.origin === 'byakuzhi') return true;
    if (entry.kango === true || entry.kango === 'true') return true;
    if (entry.lemma && entry.lemma.includes('\u200C')) return true;
    return false;
  }

  // ── Strong stem (R4 → R2 → R3 → R1) ───────────────────────
  function buildStrongStem(word) {
    let stem = word;
    let rule1Blocked = false;

    // R4: -ae / -oe → insert evanescent -k-
    if (stem.endsWith('ae') || stem.endsWith('oe')) {
      stem = stem.slice(0, -1) + 'ke';
    }

    // R2: degemination
    let degApplied = false;
    for (const gem of DEGEM_KEYS) {
      if (stem.endsWith(gem)) {
        stem = stem.slice(0, -gem.length) + DEGEM[gem];
        degApplied = true;
        break;
      }
    }

    // R3: i→e lowering (bisyllabic, final -i)
    if (syllableCount(stem) === 2 && stem.endsWith('i')) {
      stem = stem.slice(0, -1) + 'e';
      if (degApplied) rule1Blocked = true;
    }

    // R1: sonorisation (blocked if R2+R3 chain fired)
    if (!rule1Blocked && syllableCount(stem) > 1) {
      for (const key of SONOR_KEYS) {
        if (stem.endsWith(key)) {
          const pre = stem.slice(0, -key.length);
          const lastPre = pre.slice(-1);
          if (isVowel(lastPre) || lastPre === 'n' || lastPre === 'l') {
            stem = pre + SONOR[key];
            break;
          }
        }
      }
    }

    return { stem, rule1Blocked };
  }

  // ── Instrumental (vowel progression on weak stem) ───────────
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
    if (isVowel(lc)) return word + LENGTHEN[lc] + 'nba';
    const lv = lastVowelInfo(word);
    const v = lv ? VOW_PROG[lv.char] : 'u';
    return word + v + v + 'ba';
  }

  // ── Plural thematic stem (always ends in a vowel) ────────────
  function pluralTheme(word) {
    const lc = word.slice(-1);
    if (isVowel(lc)) {
      return isLongVowel(lc) ? word + 'hi' : word + LENGTHEN[lc] + 'n';
    }
    let theme = word;
    if (lc === 's') theme = word.slice(0,-1) + 'sh';
    return theme + 'i';
  }

  // ── Main declension function ─────────────────────────────────
  function declineNoun(lemma, entry) {
    const word = (lemma || '')
      .replace(/[^a-z\u0101\u0113\u012b\u014d\u016b]/gi, '')
      .toLowerCase().trim();
    const forms = { singular: {}, plural: {}, isKango: false };
    if (!word) return forms;

    // ── Byakuzhi / Kango: analytic, no mutations
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

    // ── Native word
    const lc   = word.slice(-1);
    const isV  = isVowel(lc);
    const isLV = isLongVowel(lc);

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

    // Plural nominative
    if (isV) {
      forms.plural.nom = isLV ? word + 'hin' : word + LENGTHEN[lc] + 'n';
    } else {
      forms.plural.nom = pluralTheme(word) + 'n';
    }

    // Plural oblique (theme always ends in vowel)
    const plT  = pluralTheme(word);
    const plTC = plT.slice(-1);

    forms.plural.gen = plT + 'in';
    forms.plural.acc = forms.plural.nom + 'ita';
    forms.plural.dat = plT + 'hi';
    forms.plural.ess = plT + 'is';
    forms.plural.all = plT + 'ir';
    forms.plural.abl = plT + 'il';
    forms.plural.ins = forms.singular.ins + 'i';
    forms.plural.pro = plT + 'de';
    forms.plural.ter = plT + 'rai';
    forms.plural.ben = plT + LENGTHEN[plTC] + 'nba';

    return forms;
  }

  function declineNounSimple(lemma) {
    return declineNoun(lemma, null);
  }

  // ── Export to global scope ───────────────────────────────────
  window.declineNoun       = declineNoun;
  window.declineNounSimple = declineNounSimple;
  window.isKango           = isKango;

})();
