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

  const SONOR = { k:'g', t:'d', p:'b', s:'z', ch:'j', ts:'dz', f:'v', sh:'zh' };
  const SONOR_KEYS = Object.keys(SONOR).sort((a,b) => b.length - a.length);

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
  //  Priority order:
  //  1. entry.origin === 'byakuzhi'           (build_dictionary.py output)
  //  2. entry.notes  === 'compound'           (static dictionary.json fallback)
  //  3. entry.kango  === true / 'true'        (legacy field)
  //  4. ZWNJ (\u200C) in lemma               (encoding signal)
  function isKango(entry) {
    if (!entry) return false;
    if (entry.origin === 'byakuzhi') return true;
    if (entry.notes  === 'compound') return true;
    if (entry.kango  === true || entry.kango === 'true') return true;
    if (entry.lemma  && entry.lemma.includes('\u200C')) return true;
    return false;
  }

  // ── Strong stem (R4 → R2 → R3 → R1) ──────────────────
  function buildStrongStem(word) {
    const lc = word.slice(-1);
    const vowelFinal = isVowel(lc);
    let workStr    = vowelFinal ? word.slice(0, -1) : word;
    let finalVowel = vowelFinal ? lc : '';
    let rule1Blocked = false;

    if (word.endsWith('ae') || word.endsWith('oe')) {
      return { stem: workStr + 'k' + finalVowel, rule1Blocked: false };
    }

    let degApplied = false;
    for (const gem of DEGEM_KEYS) {
      if (workStr.endsWith(gem)) {
        workStr = workStr.slice(0, -gem.length) + DEGEM[gem];
        degApplied = true;
        break;
      }
    }

    const bisyllabic = syllableCount(word) === 2;
    if (bisyllabic && finalVowel === 'i') {
      finalVowel = 'e';
      if (degApplied) rule1Blocked = true;
    } else if (bisyllabic && workStr.endsWith('i')) {
      workStr = workStr.slice(0, -1) + 'e';
      if (degApplied) rule1Blocked = true;
    }

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

  // ── Instrumental (native) ────────────────────────────
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

  // ── New cases ─ native, singular weak stem ────────────────
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

  function buildBenefactiveSg(word) {
    const lc = word.slice(-1);
    if (isVowel(lc)) return word + (LENGTHEN[lc] || lc) + 'nba';
    const lv = lastVowelInfo(word);
    const v = lv ? VOW_PROG[lv.char] : 'u';
    return word + v + v + 'ba';
  }

  function buildBenefactivePl(word) {
    const lc = word.slice(-1);
    if (isVowel(lc)) {
      return word.slice(0, -1) + (LENGTHEN[lc] || lc) + 'inba';
    }
    const lv = lastVowelInfo(word);
    const v = lv ? VOW_PROG[lv.char] : 'u';
    return word + v + 'inba';
  }

  // ── Plural nominative (native) ────────────────────────
  function buildPluralNom(word) {
    const lc = word.slice(-1);
    if (isVowel(lc)) {
      if (isLongVowel(lc)) return word + 'hin';
      return word.slice(0, -1) + LENGTHEN[lc] + 'n';
    }
    let base = word;
    if (lc === 's') base = word.slice(0,-1) + 'sh';
    return base + 'in';
  }

  // ============================================================
  //  BYAKUZHI helpers
  // ============================================================

  // Last vowel char (short or long) in the word for INS epenthesis
  function lastVowelChar(word) {
    const info = lastVowelInfo(word);
    return info ? info.char : 'u';
  }

  // Byakuzhi INS singular:
  //   vowel-final  → word + i
  //   cons-final   → word + lastVowel + i
  function byakInsSg(word) {
    const lc = word.slice(-1);
    if (isVowel(lc)) return word + 'i';
    return word + lastVowelChar(word) + 'i';
  }

  // Byakuzhi INS plural: word + ei
  function byakInsPl(word) {
    return word + 'ei';
  }

  // Byakuzhi PRO: word + ide (both endings)
  //   exception: -s final → ede
  function byakPro(word) {
    const lc = word.slice(-1);
    return word + (lc === 's' ? 'ede' : 'ide');
  }

  // Byakuzhi BEN:
  //   vowel-final  → word + nba
  //   cons-final   → word + inba (exception: -s → enba)
  function byakBenSg(word) {
    const lc = word.slice(-1);
    if (isVowel(lc)) return word + 'nba';
    return word + (lc === 's' ? 'enba' : 'inba');
  }

  // Byakuzhi BEN plural: same rule as singular
  function byakBenPl(word) {
    return byakBenSg(word);
  }

  // ── Main declension function ────────────────────────────
  function declineNoun(lemma, entry) {
    const word = (lemma || '')
      .replace(/[^a-z\u0101\u0113\u012b\u014d\u016b]/gi, '')
      .toLowerCase().trim();
    const forms = { singular: {}, plural: {}, isKango: false };
    if (!word) return forms;

    // ── BYAKUZHI ────────────────────────────────────
    if (isKango(entry)) {
      forms.isKango = true;
      const lc  = word.slice(-1);
      const isV = isVowel(lc);
      const ep  = isV ? '' : 'u';           // epenthetic vowel for cons-final
      // ki-base: insert k before oblique -i suffix when root ends in -i
      const ki  = (lc === 'i') ? word + 'k' : word;

      // ── Singular
      forms.singular.nom = word;
      forms.singular.gen = word + ep + 'n';
      forms.singular.acc = isV ? word : word + 'u';
      forms.singular.dat = word + ep + (isV ? 'i' : 'ni');
      forms.singular.ess = word + ep + 's';
      forms.singular.all = word + ep + 'r';
      forms.singular.abl = word + ep + 'l';
      forms.singular.ins = byakInsSg(word);
      forms.singular.pro = byakPro(word);
      forms.singular.ter = word + ep + 'rai';
      forms.singular.ben = byakBenSg(word);

      // ── Plural
      forms.plural.nom = word + 'ta';
      forms.plural.gen = ki + 'in';
      forms.plural.acc = word + 'ta';
      forms.plural.dat = word + 'hi';
      forms.plural.ess = ki + 'is';
      forms.plural.all = ki + 'ir';
      forms.plural.abl = ki + 'il';
      forms.plural.ins = byakInsPl(word);
      forms.plural.pro = byakPro(word);     // same as singular
      forms.plural.ter = word + ep + 'rai'; // same as singular
      forms.plural.ben = byakBenPl(word);

      return forms;
    }

    // ── NATIVE ──────────────────────────────────────
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
    forms.singular.ben = buildBenefactiveSg(word);

    forms.plural.nom = buildPluralNom(word);

    forms.plural.gen = word + (isV ? 'in'  : 'en');
    forms.plural.acc = word + (isV ? 'ita' : 'eta');
    forms.plural.dat = word + (isV ? 'hi'  : 'ehi');
    forms.plural.ess = word + (isV ? 'is'  : 'es');
    forms.plural.all = word + (isV ? 'ir'  : 'er');
    forms.plural.abl = word + (isV ? 'il'  : 'el');
    forms.plural.ins = forms.singular.ins + 'i';
    forms.plural.pro = word + (isV ? 'de'  : 'ede');
    forms.plural.ter = word + (isV ? 'rai' : 'erai');
    forms.plural.ben = buildBenefactivePl(word);

    return forms;
  }

  function declineNounSimple(lemma) {
    return declineNoun(lemma, null);
  }

  // ── Export
  window.declineNoun       = declineNoun;
  window.declineNounSimple = declineNounSimple;
  window.isKango           = isKango;

})();
