// =========================
// Askaoza Engine v3.2
// =========================
// Fix history:
// v3.1 - Fixed missing closing braces in parseWordToSyllables
// v3.2 - Fixed duplicate `let isLong` in renderOnsetNucleus (SyntaxError)

// =========================
// MAPPING TABLES
// =========================

const ASKAOZA_CONS = {
  k:   'ડ',
  g:   'ડૃ',
  p:   'ર',
  b:   'રૃ',
  s:   'ટ',
  z:   'ટૃ',
  t:   'ઠ',
  d:   'ઠૃ',
  f:   'ળ',
  v:   'ળૃ',
  ch:  'મ',
  j:   'મૃ',
  sh:  'ય',
  zh:  'યૃ',
  ts:  'ઢ',
  dz:  'ઢૃ',
  h:   'ત',
  n:   'પ',
  m:   'ઇ',
  l:   'ધ',
  r:   'દ',
  kk:  'ડ્ડ',
  pp:  'ર્ર',
  tt:  'ઠ્ઠ',
  cch: 'મ્મ',
  ss:  'ટ્ટ',
  ssh: 'ય્ય',
  tts: 'ઢ્ઢ',
  ll:  'ધ્ધ',
  nn:  'પ્પ',
  '*': '૮'
};

const ASKAOZA_FINALS = {
  n:  'પ્',
  l:  'ધ્',
  s:  'ટ્',
  r:  'દ્',
  h:  'ત્',
  kk: 'ડ્ડ્'
};

const ASKAOZA_V = {
  'a': '',
  'e': 'ૅ',
  'i': 'ા',
  'o': '૾',
  'u': 'ે',
  'ü': 'ૈ'
};

const ASKAOZA_DIPH = {
  'ya': 'ો',
  'ye': 'ૅો',
  'yo': '૾ો',
  'yu': 'ે\u200Dો',
  'yü': 'ૈો',
  'wa': 'િ',
  'we': 'િૅ',
  'wi': 'િા',
  'wo': 'િ\u200D૾'
};

const ASKAOZA_COMPOUND = {
  'ai': '૩',
  'ae': '૩ૅ',
  'ei': 'ૅ૩',
  'eu': 'ૅ૩\u200Dે',
  'oe': '૾૩ૅ',
  'oi': '૾૩',
  'ou': '૾૩\u200Dે',
  'ui': 'ે૩'
};

const LONG_MARK = 'ઃ';
const ZWNJ = '\u200C';

// =========================
// HELPER FUNCTIONS
// =========================

const DIGRAPHS = ['cch', 'ssh', 'tts', 'ch', 'sh', 'ts', 'dz', 'zh'];
const GEMINATES = ['cch', 'ssh', 'tts', 'ss', 'nn', 'll', 'kk', 'pp', 'tt'];
const VOWEL_RE = /[aeiouyü\u0101\u0113\u012b\u014d\u016b]/;
const LONG_VOWELS = { '\u0101': 'a', '\u0113': 'e', '\u012b': 'i', '\u014d': 'o', '\u016b': 'u' };
const SHORT_TO_LONG  = { 'a': '\u0101', 'e': '\u0113', 'i': '\u012b', 'o': '\u014d', 'u': '\u016b' };

// ---- Sandhi ----

function applySandhi(text) {
  const words = text.trim().split(/\s+/);
  const result = [];

  for (let i = 0; i < words.length; i++) {
    let word = words[i];
    const nextWord = words[i + 1] || '';

    if (nextWord && VOWEL_RE.test(nextWord[0])) {
      if      (word.endsWith('n')) word = word.slice(0, -1) + 'nn';
      else if (word.endsWith('l')) word = word.slice(0, -1) + 'll';
      else if (word.endsWith('s')) word = word.slice(0, -1) + 'ss';
    }
    result.push(word);
  }

  return result.map(applyInternalSandhi).join(' ');
}

function applyInternalSandhi(word) {
  return word
    .replace(/s([bpfv])/gi, (_, c) => {
      const lc = c.toLowerCase();
      return 's' + (lc === 'b' ? 'p' : lc === 'v' ? 'f' : lc);
    })
    .replace(/s(ch|j)/gi,  'cch')
    .replace(/sd/gi,        'st')
    .replace(/sg/gi,        'sk')
    .replace(/s(ts|z|dz)/gi,'tts')
    .replace(/szh/gi,       'ssh')
    .replace(/nr/gi,        'nl')
    .replace(/l[r]/gi,      'll')
    .replace(/rl/gi,        'll')
    .replace(/hb/gi,  'hp').replace(/hd/gi,  'ht').replace(/hg/gi,  'hk')
    .replace(/hv/gi,  'hf').replace(/hj/gi,  'hch').replace(/hz/gi, 'hs')
    .replace(/hdz/gi, 'hts').replace(/hzh/gi,'hsh').replace(/hh/gi, 'pp');
}

function revertSandhiForAskaoza(text) {
  return text.replace(/mp/gi, 'np').replace(/mb/gi, 'nb');
}

// ---- CV splitter ----

function splitCV(syl) {
  syl = syl.toLowerCase();
  for (const dg of DIGRAPHS) {
    if (syl.startsWith(dg)) return { C: dg, V: syl.slice(dg.length) || 'a' };
  }
  if (syl.length >= 2 && ASKAOZA_CONS[syl.slice(0, 2)]) {
    return { C: syl.slice(0, 2), V: syl.slice(2) || 'a' };
  }
  if (/^[kgpbsztdfvhnmlrjw]/i.test(syl[0])) {
    return { C: syl[0], V: syl.slice(1) || 'a' };
  }
  return { C: '*', V: syl };
}

// ---- Syllable parser ----

function latinToSyllables(text) {
  return text.trim().split(/\s+/).map(parseWordToSyllables);
}

function parseWordToSyllables(word) {
  const res = [];
  let lower = word.toLowerCase()
    .replace(/aa/g, '\u0101')
    .replace(/ee/g, '\u0113')
    .replace(/ii/g, '\u012b')
    .replace(/oo/g, '\u014d')
    .replace(/uu/g, '\u016b');

  const syllableGroups = lower.split("'");

  for (const group of syllableGroups) {
    if (!group) continue;
    let i = 0;

    while (i < group.length) {
      let onset = '', nucleus = '', coda = '';

      // Pass-through non-Askaoza characters
      if (!/[kgpbsztdfvhnmlrjwaeiouyü\u0101\u0113\u012b\u014d\u016b']/.test(group[i])) {
        res.push({ onset: '', nucleus: group[i], coda: '', passthrough: true });
        i++;
        continue;
      }

      // Onset: 3-char digraph
      if (!onset && i + 3 <= group.length && DIGRAPHS.includes(group.slice(i, i + 3))) {
        onset = group.slice(i, i + 3); i += 3;
      }
      // Onset: 2-char cluster or digraph
      if (!onset && i + 2 <= group.length) {
        const two = group.slice(i, i + 2);
        if (ASKAOZA_CONS[two] || DIGRAPHS.includes(two)) { onset = two; i += 2; }
      }
      // Onset: single consonant
      if (!onset && i < group.length && /[kgpbsztdfvhnmlrjw]/.test(group[i])) {
        onset = group[i]; i++;
      }

      // Nucleus
      if (i < group.length) {
        const n2 = group.slice(i, i + 2);
        const n1 = group[i];
        if (ASKAOZA_DIPH[n2] || ASKAOZA_COMPOUND[n2]) { nucleus = n2; i += 2; }
        else if (VOWEL_RE.test(n1))                    { nucleus = n1; i++; }
      }

      // Coda
      if (nucleus && i < group.length) {
        let look = '';
        if (!look && i + 3 <= group.length && DIGRAPHS.includes(group.slice(i, i + 3))) look = group.slice(i, i + 3);
        if (!look && i + 2 <= group.length) {
          const two = group.slice(i, i + 2);
          if (DIGRAPHS.includes(two) || ASKAOZA_CONS[two]) look = two;
        }
        if (!look && /[kgpbsztdfvhnmlr]/.test(group[i])) look = group[i];

        const cand = ['kk','n','l','s','r','h'].find(fc => look && look.startsWith(fc));
        if (cand) {
          const after = i + cand.length;
          const isLastChar = after >= group.length;
          if (isLastChar) {
            coda = cand; i = after;
          } else {
            const nextCh = group[after];
            const wouldFormDigraph  = DIGRAPHS.some(dg => dg.startsWith(cand) && group.slice(i, i + dg.length) === dg);
            const wouldFormGeminate = GEMINATES.includes(group.slice(i, i + cand.length * 2));
            if (!wouldFormDigraph && !wouldFormGeminate && !VOWEL_RE.test(nextCh)) {
              coda = cand; i = after;
            }
          }
        }
      }

      // Safety: avoid infinite loop
      if (!onset && !nucleus && !coda) {
        res.push({ onset: '', nucleus: group[i] || '', coda: '' });
        i++;
        continue;
      }

      res.push({ onset, nucleus, coda });
    } // end while
  } // end for

  return res;
}

// =========================
// Latin → Askaoza
// =========================

function normaliseV(V) {
  // Returns { short, isLong }
  if (LONG_VOWELS[V] !== undefined) return { short: LONG_VOWELS[V], isLong: true };
  return { short: V, isLong: false };
}

function renderOnsetNucleus(onset, nucleus) {
  if (!onset && !nucleus) return '';

  const base = onset ? (ASKAOZA_CONS[onset] || ASKAOZA_CONS['*']) : ASKAOZA_CONS['*'];
  const V    = nucleus || 'a';

  // Diphthong
  if (ASKAOZA_DIPH[V])     return base + ASKAOZA_DIPH[V];
  // Compound vowel
  if (ASKAOZA_COMPOUND[V]) return base + ASKAOZA_COMPOUND[V];

  // Simple vowel (possibly long)
  const { short, isLong } = normaliseV(V);
  const mark = ASKAOZA_V[short] ?? '';
  return base + mark + (isLong ? LONG_MARK : '');
}

function renderCoda(coda) {
  if (!coda) return '';
  return ASKAOZA_FINALS[coda] || ASKAOZA_CONS[coda] || '';
}

function toAskaozaWordFromSyllables(sylls) {
  return sylls.map((s, i) => {
    const rendered = renderOnsetNucleus(s.onset, s.nucleus) + renderCoda(s.coda);
    return (s.coda && i < sylls.length - 1) ? rendered + ZWNJ : rendered;
  }).join('');
}

function toAskaozaText(latinText) {
  if (!latinText.trim()) return '';
  const processed = revertSandhiForAskaoza(applySandhi(latinText));
  return latinToSyllables(processed).map(toAskaozaWordFromSyllables).join(' ');
}

// =========================
// Askaoza → Latin
// =========================

const CONS_REV     = Object.fromEntries(Object.entries(ASKAOZA_CONS).map(([k,v])     => [v, k]));
const V_REV        = Object.fromEntries(Object.entries(ASKAOZA_V).filter(([,v]) => v).map(([k,v]) => [v, k]));
const DIPH_REV     = Object.fromEntries(Object.entries(ASKAOZA_DIPH).map(([k,v])    => [v, k]));
const COMPOUND_REV = Object.fromEntries(Object.entries(ASKAOZA_COMPOUND).map(([k,v])=> [v, k]));
const FINALS_REV   = Object.fromEntries(Object.entries(ASKAOZA_FINALS).map(([k,v])  => [v, k]));

function parseVowelMarks(text, startIdx) {
  let vowel = 'a', coda = '', j = startIdx;

  // Try compound / diphthong / simple vowel mark (longest first)
  outer:
  for (let len = 4; len >= 1; len--) {
    if (j + len > text.length) continue;
    const mark = text.slice(j, j + len);
    if (COMPOUND_REV[mark]) { vowel = COMPOUND_REV[mark]; j += len; break outer; }
    if (DIPH_REV[mark])     { vowel = DIPH_REV[mark];     j += len; break outer; }
    if (len === 1 && V_REV[mark]) { vowel = V_REV[mark];  j += len; break outer; }
  }

  // Long mark
  if (j < text.length && text[j] === LONG_MARK) {
    j++;
    vowel = SHORT_TO_LONG[vowel] || vowel;
  }

  // Final consonant (2-char then 1-char)
  for (const len of [2, 1]) {
    if (!coda && j + len <= text.length) {
      const fc = text.slice(j, j + len);
      if (FINALS_REV[fc]) { coda = FINALS_REV[fc]; j += len; }
    }
  }

  return [vowel, coda, j];
}

function askaozaToLatinText(askText) {
  let result = '', i = 0;

  while (i < askText.length) {
    const ch = askText[i];

    // Whitespace / ZWNJ
    if (/\s/.test(ch) || ch === ZWNJ) {
      if (/\s/.test(ch)) result += ' ';
      i++; continue;
    }

    let matched = false;

    // 2-char final consonant first
    if (i + 2 <= askText.length) {
      const two = askText.slice(i, i + 2);
      if (FINALS_REV[two]) { result += FINALS_REV[two]; i += 2; matched = true; continue; }
    }

    // 3-char consonant glyph (geminated)
    if (!matched && i + 3 <= askText.length) {
      const three = askText.slice(i, i + 3);
      if (CONS_REV[three]) {
        let cons = CONS_REV[three]; if (cons === '*') cons = '';
        let j = i + 3;
        const [vowel, codaL, jNew] = parseVowelMarks(askText, j);
        result += cons + vowel + codaL;
        i = jNew; matched = true; continue;
      }
    }

    // Base consonant (1 char + optional ૃ voiced mark)
    if (!matched) {
      let consGlyph = ch, j = i + 1;
      if (j < askText.length && askText[j] === 'ૃ') { consGlyph += 'ૃ'; j++; }
      if (CONS_REV[consGlyph]) {
        let cons = CONS_REV[consGlyph]; if (cons === '*') cons = '';
        const [vowel, codaL, jNew] = parseVowelMarks(askText, j);
        result += cons + vowel + codaL;
        i = jNew; matched = true; continue;
      }
    }

    // Fallback
    result += ch; i++;
  }

  return result.trim().replace(/\s+/g, ' ');
}

// =========================
// Module export
// =========================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    toAskaozaText, askaozaToLatinText,
    ASKAOZA_CONS, ASKAOZA_V, ASKAOZA_DIPH, ASKAOZA_COMPOUND, ASKAOZA_FINALS
  };
}
