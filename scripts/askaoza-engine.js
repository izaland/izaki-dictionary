// =========================
// Askaoza Engine v2.0 - UNIFIED & CORRECTED
// =========================
// Unified Askaoza conversion engine for Izaki Dictionary
// Fixes: BUG-001 (consonante virtuale ૮), BUG-002 (f → ળ), BUG-003 (v → ળૃ)
// Date: 2026-03-06

// =========================
// Tabelle di mappatura CORRETTE
// =========================

// Consonanti base (valore inerente = /a/)
const ASKAOZA_CONS = {
  k:  'ડ',
  g:  'ડૃ',
  p:  'ર',
  b:  'રૃ',
  s:  'ટ',
  z:  'ટૃ',
  t:  'ઠ',
  d:  'ઠૃ',
  f:  'ળ',      // ✅ CORRETTO (era ન)
  v:  'ળૃ',     // ✅ CORRETTO (era નૃ)
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
  // doppie consonanti
  kk:  'ડ્ડ',
  pp:  'ર્ર',
  tt:  'ઠ્ઠ',
  cch: 'મ્મ',
  ss:  'ટ્ટ',
  ssh: 'ય્ય',
  tts: 'ઢ્ઢ',
  ll:  'ધ્ધ',
  nn:  'પ્પ',
  '*': '૮'      // ✅ CORRETTO (era સ) - consonante virtuale per vocali
};

// Consonanti finali ufficiali (con virama)
const ASKAOZA_FINALS = {
  n:  'પ્',
  l:  'ધ્',
  s:  'ટ્',
  r:  'દ્',
  h:  'ત્',
  kk: 'ડ્ડ્'
};

// Diacritici vocalici semplici
const ASKAOZA_V = {
  'a': '',    // inerente
  'e': 'ૅ',
  'i': 'ા',
  'o': '૾',
  'u': 'ે',
  'ü': 'ૈ'
};

// Dittonghi (y- / w-)
const ASKAOZA_DIPH = {
  // yV
  'ya': 'ો',
  'ye': 'ૅો',
  'yo': 'ાો',
  'yu': 'ેો',
  'yü': 'ૈો',
  // wV
  'wa': 'િ',
  'we': 'િૅ',
  'wi': 'િા',
  'wo': 'સિા'
};

// Vocali composte (ai, ae, ecc.) — usano il placeholder ઩
const ASKAOZA_COMPOUND = {
  'ai': '઩',
  'ae': '઩ૅ',
  'ei': 'ૅ઩',
  'eu': 'ૅ઩ે',
  'oe': 'ા઩ૅ',
  'oi': 'ા઩',
  'ou': 'ા઩ે',
  'ui': 'ે઩'
};

// Diacritico di lunghezza
const LONG_MARK = 'ઃ';

// =========================
// Funzioni di supporto
// =========================

const DIGRAPHS = ['cch', 'ssh', 'tts', 'ch', 'sh', 'ts', 'dz', 'zh'];

/**
 * Apply complete Izaki phonetic sandhi rules
 */
function applySandhi(text) {
  let result = text;
  
  // ===== FINAL -S + CONSONANT =====
  result = result
    .replace(/s([bpfv])/gi, (m, c) => 's' + (c.toLowerCase() === 'b' ? 'p' : c.toLowerCase() === 'v' ? 'f' : c))
    .replace(/s(ch|j)/gi, 'cch')
    .replace(/sd/gi, 'st')
    .replace(/sg/gi, 'sk')
    .replace(/sh(?=[aeiouāēīōūü])/gi, 'sh')
    .replace(/sh(?=[^aeiouāēīōūü])/gi, 'sh')
    .replace(/s([klmnr])/gi, (m, c) => 's' + c)
    .replace(/ss/gi, 'ss')
    .replace(/st/gi, 'st')
    .replace(/s(ts|z|dz)/gi, 'tts')
    .replace(/szh/gi, 'ssh');
  
  // ===== LIQUID ASSIMILATION =====
  result = result.replace(/nr/gi, 'nl');
  result = result.replace(/lr/gi, 'll');
  result = result.replace(/rl/gi, 'll');
  
  // ===== FINAL -H + CONSONANT (devoicing) =====
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
  
  // ===== FINAL CONSONANTS + VOWEL =====
  result = result
    .replace(/n([aeiouāēīōūü])/gi, (m, v) => 'nn' + v)
    .replace(/l([aeiouāēīōūü])/gi, (m, v) => 'll' + v)
    .replace(/s([aeiouāēīōūü])/gi, (m, v) => 'ss' + v);
  
  result = result.replace(/r([aeiouāēīōūü])/gi, (m, v) => 't' + v);
  
  return result;
}

/**
 * Revert phonetic sandhi for askaoza orthography
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
  
  if (/^[kgpbsztdfvhnmlrj]/i.test(syl[0])) {
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

  lower = lower
    .replace(/aa/g, 'ā')
    .replace(/ee/g, 'ē')
    .replace(/ii/g, 'ī')
    .replace(/oo/g, 'ō')
    .replace(/uu/g, 'ū');

  const syllableGroups = lower.split("'");
  
  for (let groupIdx = 0; groupIdx < syllableGroups.length; groupIdx++) {
    const group = syllableGroups[groupIdx];
    if (!group) continue;
    
    let i = 0;
    while (i < group.length) {
      let onset = '';
      let nucleus = '';
      let coda = '';

      if (i + 3 <= group.length) {
        const three = group.slice(i, i + 3);
        if (DIGRAPHS.includes(three)) {
          onset = three;
          i += 3;
        }
      }
      
      if (!onset && i + 2 <= group.length) {
        const two = group.slice(i, i + 2);
        if (ASKAOZA_CONS[two]) {
          onset = two;
          i += 2;
        }
      }
      
      if (!onset && i + 2 <= group.length) {
        const two = group.slice(i, i + 2);
        if (DIGRAPHS.includes(two)) {
          onset = two;
          i += 2;
        }
      }
      
      if (!onset && i < group.length && /[kgpbsztdfvhnmlrj]/.test(group[i])) {
        onset = group[i];
        i += 1;
      }

      if (i < group.length) {
        const next2 = group.slice(i, i + 2);
        const next1 = group[i];

        if (ASKAOZA_DIPH[next2] || ASKAOZA_COMPOUND[next2]) {
          nucleus = next2;
          i += 2;
        } else if (/[aeiouāēīōūü]/.test(next1)) {
          nucleus = next1;
          i += 1;
        } else {
          nucleus = '';
        }
      }

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
          if (DIGRAPHS.includes(two)) {
            look = two;
          }
        }
        if (!look && i + 1 <= group.length) {
          const two = group.slice(i, i + 2);
          if (ASKAOZA_CONS[two]) {
            look = two;
          }
        }
        if (!look && /[kgpbsztdfvhnmlrj]/.test(group[i])) {
          look = group[i];
        }

        const finalCandidates = ['n', 'l', 's', 'r', 'h', 'kk'];
        const cand = finalCandidates.find(fc => look && look.startsWith(fc));

        if (cand) {
          const afterCodaIndex = i + cand.length;
          
          if (afterCodaIndex < group.length) {
            const wouldFormDigraph = DIGRAPHS.some(dg => dg.startsWith(cand) && group.slice(i, i + dg.length) === dg);
            
            if (wouldFormDigraph) {
            } else if (/[aeiouāēīōūü]/.test(group[afterCodaIndex])) {
            } else {
              coda = cand;
              i = afterCodaIndex;
            }
          } else {
            coda = cand;
            i = afterCodaIndex;
          }
        }
      } else if (!nucleus && onset) {
        const finalCandidates = ['n', 'l', 's', 'r', 'h', 'kk'];
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
  }

  return res;
}

// =========================
// Latin → askaoza (sillaba)
// =========================

function renderOnsetNucleus(onset, nucleus) {
  if (!onset && !nucleus) return '';

  if (!onset && nucleus) {
    if (ASKAOZA_COMPOUND[nucleus]) {
      return ASKAOZA_CONS['*'] + ASKAOZA_COMPOUND[nucleus];
    }

    let V = nucleus;
    let isLong = false;
    if (/[āēīōū]/.test(V)) {
      isLong = true;
      V = V
        .replace('ā','a')
        .replace('ē','e')
        .replace('ī','i')
        .replace('ō','o')
        .replace('ū','u');
    }

    if (ASKAOZA_DIPH[V]) {
      return ASKAOZA_CONS['*'] + ASKAOZA_DIPH[V] + (isLong ? LONG_MARK : '');
    }

    const mark = ASKAOZA_V[V] ?? '';
    return ASKAOZA_CONS['*'] + mark + (isLong ? LONG_MARK : '');
  }

  let { C, V } = splitCV(onset + (nucleus || ''));
  const base = ASKAOZA_CONS[C] || ASKAOZA_CONS['*'];

  if (ASKAOZA_DIPH[V]) {
    return base + ASKAOZA_DIPH[V];
  }

  if (C !== '*' && ASKAOZA_COMPOUND[V]) {
    return base + ASKAOZA_COMPOUND[V];
  }

  let isLong = false;
  if (/[āēīōū]/.test(V)) {
    isLong = true;
    V = V
      .replace('ā','a')
      .replace('ē','e')
      .replace('ī','i')
      .replace('ō','o')
      .replace('ū','u');
  }

  const mark = ASKAOZA_V[V] ?? '';
  return base + mark + (isLong ? LONG_MARK : '');
}

function renderCoda(coda) {
  if (!coda) return '';
  return ASKAOZA_FINALS[coda] || (ASKAOZA_CONS[coda] || '');
}

function toAskaozaWordFromSyllables(sylls) {
  return sylls
    .map(s => renderOnsetNucleus(s.onset, s.nucleus) + renderCoda(s.coda))
    .join('');
}

function toAskaozaText(latinText) {
  if (!latinText.trim()) return '';
  
  let processed = applySandhi(latinText);
  processed = revertSandhiForAskaoza(processed);
  
  const words = latinToSyllables(processed);
  return words.map(toAskaozaWordFromSyllables).join(' ');
}

// =========================
// Askaoza → Latin (completa)
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

  if (j < text.length && text[j] === LONG_MARK) {
    j++;
    vowel = vowel
      .replace('a', 'ā')
      .replace('e', 'ē')
      .replace('i', 'ī')
      .replace('o', 'ō')
      .replace('u', 'ū');
  }

  if (j + 1 < text.length) {
    const finalCandidate = text.slice(j, j + 2);
    if (FINALS_REV[finalCandidate]) {
      coda = FINALS_REV[finalCandidate];
      j += 2;
    }
  }

  return [vowel, coda, j];
}

function askaozaToLatinText(askText) {
  let result = '';
  let i = 0;

  while (i < askText.length) {
    if (/\s/.test(askText[i])) {
      result += ' ';
      i++;
      continue;
    }

    let matched = false;

    if (i + 1 < askText.length) {
      const twoChars = askText.slice(i, i + 2);
      if (FINALS_REV[twoChars]) {
        result += FINALS_REV[twoChars];
        i += 2;
        matched = true;
        continue;
      }
    }

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
