// =========================
// Askaoza Engine v3.0 - FINAL CORRECTED
// =========================
// Complete Askaoza conversion engine for Izaki Dictionary
// Corrections:
// - Vowel compounds as diacritics (ai = ળ, not ૮ળ)
// - Diphthongs corrected (wo = િા, yo = ાો)
// - F = ળ, V = ળૃ
// - Geminated consonants (kk, pp, etc.)
// - ZWNJ separator for CVC syllables
// Date: 2026-03-06

// =========================
// MAPPING TABLES - FINAL CORRECTED
// =========================

// Base consonants (inherent /a/ value)
const ASKAOZA_CONS = {
  k:  'ડ',
  g:  'ડૃ',
  p:  'ર',
  b:  'રૃ',
  s:  'ટ',
  z:  'ટૃ',
  t:  'ઠ',
  d:  'ઠૃ',
  f:  'ળ',      // ✅ CORRECTED
  v:  'ળૃ',     // ✅ CORRECTED
  ch: 'મ',
  j:  'મૃ',
  sh: 'ય',
  zh: 'યૃ',
  ts: 'ઢ',
  dz: 'ઢૃ',
  h:  'ત',
  n:  'પ',
  m:  'ઇ',
  l:  'ધ',
  r:  'દ',
  // Geminated consonants (only voiceless)
  kk:  'ડ્ડ',
  pp:  'ર્ર',
  tt:  'ઠ્ઠ',
  cch: 'મ્મ',
  ss:  'ટ્ટ',
  ssh: 'ય્ય',
  tts: 'ઢ્ઢ',
  ll:  'ધ્ધ',
  nn:  'પ્પ',
  '*': '૮'      // Virtual consonant for vowel-initial syllables
};

// Final consonants (official with virama)
const ASKAOZA_FINALS = {
  n:  'પ્',
  l:  'ધ્',
  s:  'ટ્',
  r:  'દ્',
  h:  'ત્',
  kk: 'ડ્ડ્'
};

// Simple vowel diacritics
const ASKAOZA_V = {
  'a': '',    // inherent
  'e': 'ૅ',
  'i': 'ા',
  'o': '૾',
  'u': 'ે',
  'ü': 'ૈ'
};

// Diphthongs (y- / w-) - AS DIACRITICS
const ASKAOZA_DIPH = {
  // yV
  'ya': 'ો',
  'ye': 'ૅો',
  'yo': '૾ો',     // ✅ NOT ા૾ો
  'yu': 'ે\u200Dો',
  'yü': 'ૈો',
  // wV
  'wa': 'િ',
  'we': 'િૅ',
  'wi': 'િા',
  'wo': 'િ\u200D૾' 
};

// Compound vowels (hiatus) - AS DIACRITICS
const ASKAOZA_COMPOUND = {
  'ai': '૩',       // ◌૩
  'ae': '૩ૅ',      // ◌૩ૅ
  'ei': 'ૅ૩',      // ◌ૅ૩
  'eu': 'ૅ૩\u200Dે',   // ← ZWJ forza ે a combinarsi con ૩
  'oe': '૾૩ૅ',     // ◌૾૩ૅ
  'oi': '૾૩',      // ◌૾૩
  'ou': '૾૩\u200Dે',   // ← stesso fix per ou
  'ui': 'ે૩'       // ◌ે૩
};

// Length mark
const LONG_MARK = 'ઃ';

// Zero Width Non-Joiner for CVC separation
const ZWNJ = '\u200C';

// =========================
// HELPER FUNCTIONS
// =========================

const DIGRAPHS = ['cch', 'ssh', 'tts', 'ch', 'sh', 'ts', 'dz', 'zh'];

/**
 * Apply Izaki phonetic sandhi rules
 */
function applySandhi(text) {
  const words = text.trim().split(/\s+/);
  
  let result = [];
  
  for (let i = 0; i < words.length; i++) {
    let word = words[i];
    let nextWord = words[i + 1] || '';
    
    // Applica sandhi solo se la parola FINISCE con n/l/s
    // e la parola SUCCESSIVA inizia con vocale
    if (nextWord && /^[aeiouyü\u0101\u0113\u012b\u014d\u016b]/i.test(nextWord)) {
      
      if (word.endsWith('n')) {
        word = word.slice(0, -1) + 'nn';
      } else if (word.endsWith('l')) {
        word = word.slice(0, -1) + 'll';
      } else if (word.endsWith('s')) {
        word = word.slice(0, -1) + 'ss';
      }
    }
    
    result.push(word);
  }
  
  // Ora applica le altre regole (consonanti interne) a ogni parola singola
  return result.map(word => applyInternalSandhi(word)).join(' ');
}

function applyInternalSandhi(word) {
  let result = word;
  
  // Final -S + consonant
  result = result
    .replace(/s([bpfv])/gi, (m, c) => 's' + (c.toLowerCase() === 'b' ? 'p' : c.toLowerCase() === 'v' ? 'f' : c))
    .replace(/s(ch|j)/gi, 'cch')
    .replace(/sd/gi, 'st')
    .replace(/sg/gi, 'sk')
    .replace(/s([klmnr])/gi, (m, c) => 's' + c)
    .replace(/ss/gi, 'ss')
    .replace(/st/gi, 'st')
    .replace(/s(ts|z|dz)/gi, 'tts')
    .replace(/szh/gi, 'ssh');
  
  // Liquid assimilation
  result = result.replace(/nr/gi, 'nl');
  result = result.replace(/lr/gi, 'll');
  result = result.replace(/rl/gi, 'll');
  
  // Final -H + consonant (devoicing)
  result = result
    .replace(/hb/gi, 'hp')
    .replace(/hd/gi, 'ht')
    .replace(/hg/gi, 'hk')
    .replace(/hv/gi, 'hf')
    .replace(/hj/gi, 'hch')
    .replace(/hz/gi, 'hs')
    .replace(/hdz/gi, 'hts')
    .replace(/hzh/gi, 'hsh')
    .replace(/hh/gi, 'pp');
    
  return result;
}

/**
 * Revert sandhi for askaoza orthography
 */
function revertSandhiForAskaoza(text) {
  return text
    .replace(/mp/gi, 'np')
    .replace(/mb/gi, 'nb');
}

function splitCV(syl) {
  syl = syl.toLowerCase();

  for (const dg of DIGRAPHS) {
    if (syl.startsWith(dg)) {
      return { C: dg, V: syl.slice(dg.length) || 'a' };
    }
  }
  
  if (syl.length >= 2) {
    const two = syl.slice(0, 2);
    if (ASKAOZA_CONS[two]) {
      return { C: two, V: syl.slice(2) || 'a' };
    }
  }
  
  if (/^[kgpbsztdfvhnmlrjw]/i.test(syl[0])) {
    return { C: syl[0], V: syl.slice(1) || 'a' };
  }
  
  return { C: '*', V: syl };
}

function latinToSyllables(text) {
  const words = text.trim().split(/\s+/);
  return words.map(parseWordToSyllables);
}

function parseWordToSyllables(word) {
  const res = [];
  let lower = word.toLowerCase();

  // Normalize long vowels
  lower = lower
    .replace(/aa/g, '\u0101')
    .replace(/ee/g, '\u0113')
    .replace(/ii/g, '\u012b')
    .replace(/oo/g, '\u014d')
    .replace(/uu/g, '\u016b');

  const syllableGroups = lower.split("'");
  
  for (let groupIdx = 0; groupIdx < syllableGroups.length; groupIdx++) {
    const group = syllableGroups[groupIdx];
    if (!group) continue;
    
    let i = 0;
while (i < group.length) {
  let onset = '';
  let nucleus = '';
  let coda = '';

  // ✅ NUOVO: passa direttamente i caratteri non-Askaoza (punteggiatura, numeri, ecc.)
  if (!/[kgpbsztdfvhnmlrjwaeiouyü\u0101\u0113\u012b\u014d\u016b']/.test(group[i])) {
    res.push({ onset: '', nucleus: group[i], coda: '', passthrough: true });
    i += 1;
    continue;
  }

      // Check for 3-char digraphs
      if (i + 3 <= group.length) {
        const three = group.slice(i, i + 3);
        if (DIGRAPHS.includes(three)) {
          onset = three;
          i += 3;
        }
      }
      
      // Check for 2-char consonant clusters
      if (!onset && i + 2 <= group.length) {
        const two = group.slice(i, i + 2);
        if (ASKAOZA_CONS[two]) {
          onset = two;
          i += 2;
        }
      }
      
      // Check for 2-char digraphs
      if (!onset && i + 2 <= group.length) {
        const two = group.slice(i, i + 2);
        if (DIGRAPHS.includes(two)) {
          onset = two;
          i += 2;
        }
      }
      
      // Single consonant
      if (!onset && i < group.length && /[kgpbsztdfvhnmlrjw]/.test(group[i])) {
        onset = group[i];
        i += 1;
      }

      // Parse nucleus (vowel or diphthong/compound)
      if (i < group.length) {
        const next2 = group.slice(i, i + 2);
        const next1 = group[i];

        if (ASKAOZA_DIPH[next2] || ASKAOZA_COMPOUND[next2]) {
          nucleus = next2;
          i += 2;
        } else if (/[aeiouyü\u0101\u0113\u012b\u014d\u016b]/.test(next1)) {
          nucleus = next1;
          i += 1;
        }
      }

      // Parse coda (final consonant)
      if (nucleus && i < group.length) {
        let look = '';
        
        if (i + 3 <= group.length) {
          const three = group.slice(i, i + 3);
          if (DIGRAPHS.includes(three)) {
            look = three;
          }
        }
        if (!look && i + 2 <= group.length) {
          const two = group.slice(i, i + 2);
          if (DIGRAPHS.includes(two) || ASKAOZA_CONS[two]) {
            look = two;
          }
        }
        if (!look && /[kgpbsztdfvhnmlr]/.test(group[i])) {
          look = group[i];
        }

        const finalCandidates = ['kk', 'n', 'l', 's', 'r', 'h'];
        const cand = finalCandidates.find(fc => look && look.startsWith(fc));

     if (cand) {
  const afterCodaIndex = i + cand.length;
  
  if (afterCodaIndex < group.length) {
    const nextChar = group[afterCodaIndex];
    const wouldFormDigraph = DIGRAPHS.some(dg => dg.startsWith(cand) && group.slice(i, i + dg.length) === dg);
    
    // ✅ NUOVO: controlla se forma una geminata
    const GEMINATES = ['ss', 'nn', 'll', 'kk', 'pp', 'tt', 'cch', 'ssh', 'tts'];
    const doubleCandidate = group.slice(i, i + cand.length * 2);
    const wouldFormGeminate = GEMINATES.includes(doubleCandidate);
    
    if (!wouldFormDigraph && !wouldFormGeminate && !/[aeiouyü\u0101\u0113\u012b\u014d\u016b]/.test(nextChar)) {
      coda = cand;
      i = afterCodaIndex;
    }
  } else {
    coda = cand;
    i = afterCodaIndex;
  }
} else if (!nucleus && onset) {
  const finalCandidates = ['kk', 'n', 'l', 's', 'r', 'h'];
  if (finalCandidates.includes(onset)) {
    coda = onset;
    onset = '';
  }
}

if (!onset && !nucleus && !coda) {
  res.push({ onset: '', nucleus: group[i], coda: '' });
  i += 1;
  continue;
}

res.push({ onset, nucleus, coda });

}

  return res;
}

// =========================
// Latin → Askaoza (syllable)
// =========================

function renderOnsetNucleus(onset, nucleus) {
  if (!onset && !nucleus) return '';

  // Vowel-initial: use virtual consonant
  if (!onset && nucleus) {
    if (ASKAOZA_COMPOUND[nucleus]) {
      return ASKAOZA_CONS['*'] + ASKAOZA_COMPOUND[nucleus];
    }

    let V = nucleus;
    let isLong = false;
    if (/[\u0101\u0113\u012b\u014d\u016b]/.test(V)) {
      isLong = true;
      V = V
        .replace('\u0101','a')
        .replace('\u0113','e')
        .replace('\u012b','i')
        .replace('\u014d','o')
        .replace('\u016b','u');
    }

    if (ASKAOZA_DIPH[V]) {
      return ASKAOZA_CONS['*'] + ASKAOZA_DIPH[V] + (isLong ? LONG_MARK : '');
    }

    const mark = ASKAOZA_V[V] ?? '';
    return ASKAOZA_CONS['*'] + mark + (isLong ? LONG_MARK : '');
  }

  // Consonant + vowel
  let { C, V } = splitCV(onset + (nucleus || ''));
  const base = ASKAOZA_CONS[C] || ASKAOZA_CONS['*'];

  // Check for diphthongs
  if (ASKAOZA_DIPH[V]) {
    return base + ASKAOZA_DIPH[V];
  }

  // Check for compound vowels
  if (C !== '*' && ASKAOZA_COMPOUND[V]) {
    return base + ASKAOZA_COMPOUND[V];
  }

  // Handle long vowels
  let isLong = false;
  if (/[\u0101\u0113\u012b\u014d\u016b]/.test(V)) {
    isLong = true;
    V = V
      .replace('\u0101','a')
      .replace('\u0113','e')
      .replace('\u012b','i')
      .replace('\u014d','o')
      .replace('\u016b','u');
  }

  const mark = ASKAOZA_V[V] ?? '';
  return base + mark + (isLong ? LONG_MARK : '');
}

function renderCoda(coda) {
  if (!coda) return '';
  return ASKAOZA_FINALS[coda] || (ASKAOZA_CONS[coda] || '');
}

function toAskaozaWordFromSyllables(sylls) {
  return sylls.map((s, i) => {
    const rendered = renderOnsetNucleus(s.onset, s.nucleus) + renderCoda(s.coda);
    
    // ✅ Add ZWNJ after CVC syllables (except last)
    if (s.coda && i < sylls.length - 1) {
      return rendered + ZWNJ;
    }
    return rendered;
  }).join('');
}

function toAskaozaText(latinText) {
  if (!latinText.trim()) return '';
  
  let processed = applySandhi(latinText);
  processed = revertSandhiForAskaoza(processed);
  
  const words = latinToSyllables(processed);
  return words.map(toAskaozaWordFromSyllables).join(' ');
}

// =========================
// Askaoza → Latin (complete)
// =========================

const CONS_REV = {};
for (const [lat, glyph] of Object.entries(ASKAOZA_CONS)) {
  CONS_REV[glyph] = lat;
}

const V_REV = {};
for (const [v, mark] of Object.entries(ASKAOZA_V)) {
  if (mark) V_REV[mark] = v;
}

const DIPH_REV = {};
for (const [diph, mark] of Object.entries(ASKAOZA_DIPH)) {
  DIPH_REV[mark] = diph;
}

const COMPOUND_REV = {};
for (const [comp, mark] of Object.entries(ASKAOZA_COMPOUND)) {
  COMPOUND_REV[mark] = comp;
}

const FINALS_REV = {};
for (const [lat, glyph] of Object.entries(ASKAOZA_FINALS)) {
  FINALS_REV[glyph] = lat;
}

function parseVowelMarks(text, startIdx) {
  let vowel = 'a';
  let coda = '';
  let j = startIdx;

  // Try to match compound vowels or diphthongs (longest first)
  for (let len = 3; len >= 1; len--) {
    if (j + len <= text.length) {
      const mark = text.slice(j, j + len);
      
      if (COMPOUND_REV[mark]) {
        vowel = COMPOUND_REV[mark];
        j += len;
        break;
      }
      if (DIPH_REV[mark]) {
        vowel = DIPH_REV[mark];
        j += len;
        break;
      }
      if (len === 1 && V_REV[mark]) {
        vowel = V_REV[mark];
        j += len;
        break;
      }
    }
  }

  // Check for long mark
  if (j < text.length && text[j] === LONG_MARK) {
    j++;
    vowel = vowel
      .replace('a', '\u0101')
      .replace('e', '\u0113')
      .replace('i', '\u012b')
      .replace('o', '\u014d')
      .replace('u', '\u016b');
  }

  // Check for final consonant (2-char first, then 1-char)
  if (j + 2 <= text.length) {
    const finalCandidate = text.slice(j, j + 2);
    if (FINALS_REV[finalCandidate]) {
      coda = FINALS_REV[finalCandidate];
      j += 2;
    }
  }
  if (!coda && j + 1 <= text.length) {
    const finalCandidate = text.slice(j, j + 1);
    if (FINALS_REV[finalCandidate]) {
      coda = FINALS_REV[finalCandidate];
      j += 1;
    }
  }

  return [vowel, coda, j];
}

function askaozaToLatinText(askText) {
  let result = '';
  let i = 0;

  while (i < askText.length) {
    // Skip whitespace and ZWNJ
    if (/\s/.test(askText[i]) || askText[i] === ZWNJ) {
      if (/\s/.test(askText[i])) result += ' ';
      i++;
      continue;
    }

    let matched = false;

    // Try 2-char final consonant
    if (i + 1 < askText.length) {
      const twoChars = askText.slice(i, i + 2);
      if (FINALS_REV[twoChars]) {
        result += FINALS_REV[twoChars];
        i += 2;
        matched = true;
        continue;
      }
    }

    // Try 3-char consonant (geminated with diacritic)
    if (!matched && i + 2 < askText.length) {
      const threeChars = askText.slice(i, i + 3);
      if (CONS_REV[threeChars]) {
        let cons = CONS_REV[threeChars];
        let vowel = 'a';
        let coda = '';
        let j = i + 3;

        [vowel, coda, j] = parseVowelMarks(askText, j);

        if (cons === '*') cons = '';
        result += cons + vowel + coda;
        i = j;
        matched = true;
        continue;
      }
    }

    // Try base consonant + possible diacritic
    if (!matched) {
      let baseChar = askText[i];
      let consCandidate = baseChar;
      let j = i + 1;

      if (j < askText.length && askText[j] === 'ૃ') {
        consCandidate = baseChar + 'ૃ';
        j++;
      }

      if (CONS_REV[consCandidate]) {
        let cons = CONS_REV[consCandidate];
        let vowel = 'a';
        let coda = '';

        [vowel, coda, j] = parseVowelMarks(askText, j);

        if (cons === '*') cons = '';
        result += cons + vowel + coda;
        i = j;
        matched = true;
        continue;
      }
    }

    // Fallback: copy character as-is
    if (!matched) {
      result += askText[i];
      i++;
    }
  }

  return result.trim().replace(/\s+/g, ' ');
}

// =========================
// Export for module usage
// =========================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    toAskaozaText,
    askaozaToLatinText,
    ASKAOZA_CONS,
    ASKAOZA_V,
    ASKAOZA_DIPH,
    ASKAOZA_COMPOUND,
    ASKAOZA_FINALS
  };
}
