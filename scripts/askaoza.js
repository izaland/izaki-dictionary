// =========================
// Tabelle di mappatura
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
  f:  '૨',
  v:  '૨ૃ',
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
  '*': '૮'
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
  'yo': '૾ો',
  'yu': 'ેો',
  'yü': 'ૈો',
  // wV
  'wa': 'િ',
  'we': 'િૅ',
  'wi': 'િા',
  'wo': '૮િ૾'
};

// Vocali composte (ai, ae, ecc.) — usano il placeholder ૮
const ASKAOZA_COMPOUND = {
  'ai': '૩',
  'ae': '૩ૅ',
  'ei': 'ૅ૩',
  'eu': 'ૅ૩ે',
  'oe': '૾૩ૅ',
  'oi': '૾૩',
  'ou': '૾૩ે',
  'ui': 'ે૩'
};

// Diacritico di lunghezza
const LONG_MARK = 'ઃ';

// =========================
// Funzioni di supporto
// =========================

const DIGRAPHS = ['ch', 'sh', 'ts', 'dz'];

function splitCV(syl) {
  syl = syl.toLowerCase();

  for (const dg of DIGRAPHS) {
    if (syl.startsWith(dg)) {
      return { C: dg, V: syl.slice(dg.length) || 'a' };
    }
  }
  if (/^[kgpbsztdfvhnmlr]/i.test(syl[0])) {
    return { C: syl[0], V: syl.slice(1) || 'a' };
  }
  // solo vocale / dittongo
  return { C: '*', V: syl };
}

// NUOVA segmentazione: parola → lista di sillabe
function latinToSyllables(text) {
  const words = text.trim().split(/\s+/);
  return words.map(word => splitWordToSyllables(word));
}

function splitWordToSyllables(word) {
  const res = [];
  let i = 0;
  const lower = word.toLowerCase();

  while (i < lower.length) {
    // prova prima i digrammi consonantici
    let C = '';
    let V = '';

    if (i + 1 < lower.length) {
      const two = lower.slice(i, i + 2);
      if (DIGRAPHS.includes(two)) {
        C = two;
        i += 2;
      }
    }

    if (!C && /[kgpbsztdfvhnmlr]/.test(lower[i])) {
      C = lower[i];
      i += 1;
    }

    // vocale o dittongo dopo la consonante (o solo vocale se C è vuota)
    if (i < lower.length) {
      const next2 = lower.slice(i, i + 2);
      const next1 = lower[i];

      if (ASKAOZA_DIPH[next2] || ASKAOZA_COMPOUND[next2]) {
        V = next2;
        i += 2;
      } else if (/[aeiouāēīōūü]/.test(next1)) {
        V = next1;
        i += 1;
      } else {
        V = '';
      }
    }

    const syl = (C || '') + (V || '');
    if (syl) {
      res.push(syl);
    } else {
      // carattere isolato (punteggiatura, ecc.)
      res.push(lower[i]);
      i += 1;
    }
  }

  return res;
}

// =========================
// Latin → askaoza (sillaba)
// =========================

function toAskaozaSyllable(romanSyl) {
  let { C, V } = splitCV(romanSyl);

  const base = ASKAOZA_CONS[C] || ASKAOZA_CONS['*'];

  // dittonghi yV / wV
  if (ASKAOZA_DIPH[V]) {
    return base + ASKAOZA_DIPH[V];
  }

  // vocali composte pure (ai, ae, ecc.)
  if (C === '*' && ASKAOZA_COMPOUND[V]) {
    return ASKAOZA_CONS['*'] + ASKAOZA_COMPOUND[V];
  }

  // vocali lunghe con macron (ā, ē, ī, ō, ū)
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

function toAskaozaText(latinText) {
  if (!latinText.trim()) return '';

  const words = latinToSyllables(latinText); // array di array di sillabe
  const converted = words.map(sylls => sylls.map(toAskaozaSyllable).join(''));
  return converted.join(' ');
}

// =========================
// Askaoza → Latin (grezza)
// =========================

const CONS_REV = {};
for (const [lat, glyph] of Object.entries(ASKAOZA_CONS)) {
  CONS_REV[glyph] = lat;
}

const V_REV = {};
for (const [v, mark] of Object.entries(ASKAOZA_V)) {
  if (mark) V_REV[mark] = v;
}

function askaozaToLatinText(askText) {
  const chars = Array.from(askText);
  let result = '';
  let i = 0;

  while (i < chars.length) {
    const ch = chars[i];

    if (/\s/.test(ch)) {
      result += ' ';
      i++;
      continue;
    }

    if (CONS_REV[ch]) {
      let cons = CONS_REV[ch];
      let vowel = 'a';
      let j = i + 1;

      if (j < chars.length && V_REV[chars[j]]) {
        vowel = V_REV[chars[j]];
        j++;
      }

      if (j < chars.length && chars[j] === LONG_MARK) {
        j++;
      }

      if (cons === '*') cons = '';
      result += cons + vowel;
      i = j;
      continue;
    }

    result += ch;
    i++;
  }

  return result.trim().replace(/\s+/g, ' ');
}

// =========================
// Hook con la UI
// =========================

document.addEventListener('DOMContentLoaded', () => {
  const latinInput   = document.getElementById('latinInput');
  const askOut       = document.getElementById('askaozaOutput');
  const toAskBtn     = document.getElementById('toAskaozaBtn');

  const askInput     = document.getElementById('askaozaInput');
  const latOut       = document.getElementById('latinOutput');
  const toLatBtn     = document.getElementById('toLatinBtn');

  toAskBtn.addEventListener('click', () => {
    askOut.textContent = toAskaozaText(latinInput.value);
  });

  toLatBtn.addEventListener('click', () => {
    latOut.textContent = askaozaToLatinText(askInput.value);
  });
});
