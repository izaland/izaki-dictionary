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

const DIGRAPHS = ['cch', 'ssh', 'tts', 'ch', 'sh', 'ts', 'dz'];

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

// ritorna array di parole, ogni parola = array di sillabe {onset, nucleus, coda}
function latinToSyllables(text) {
  const words = text.trim().split(/\s+/);
  return words.map(parseWordToSyllables);
}

function parseWordToSyllables(word) {
  const res = [];
  const lower = word.toLowerCase();
  let i = 0;

  while (i < lower.length) {
    let onset = '';
    let nucleus = '';
    let coda = '';

    // 1) onset: prova trigrammi/digrammi (incluse doppie) poi singola
    if (i + 2 <= lower.length) {
      const three = lower.slice(i, i + 3);
      if (DIGRAPHS.includes(three)) {
        onset = three;
        i += 3;
      }
    }
    if (!onset && i + 1 < lower.length) {
      const two = lower.slice(i, i + 2);
      if (DIGRAPHS.includes(two) || ASKAOZA_CONS[two]) {
        onset = two;
        i += 2;
      }
    }
    if (!onset && /[kgpbsztdfvhnmlr]/.test(lower[i])) {
      onset = lower[i];
      i += 1;
    }

    // 2) nucleo vocalico o dittongo
    if (i < lower.length) {
      const next2 = lower.slice(i, i + 2);
      const next1 = lower[i];

      if (ASKAOZA_DIPH[next2] || ASKAOZA_COMPOUND[next2]) {
        nucleus = next2;
        i += 2;
      } else if (/[aeiouāēīōūü]/.test(next1)) {
        nucleus = next1;
        i += 1;
      } else {
        nucleus = ''; // possibile sillaba consonantica pura (solo finale)
      }
    }

    // 3) possibile coda consonantica (solo n,l,s,r,h,kk) se:
    // - c'è un nucleo
    // - dopo c'è una consonante (inizio sillaba successiva) o fine parola
    if (nucleus && i < lower.length) {
      // guarda avanti: consonante/i che seguono
      let look = '';
      if (i + 2 <= lower.length) {
        const three = lower.slice(i, i + 3);
        if (DIGRAPHS.includes(three) || ASKAOZA_CONS[three]) {
          look = three;
        }
      }
      if (!look && i + 1 <= lower.length) {
        const two = lower.slice(i, i + 2);
        if (DIGRAPHS.includes(two) || ASKAOZA_CONS[two]) {
          look = two;
        }
      }
      if (!look && /[kgpbsztdfvhnmlr]/.test(lower[i])) {
        look = lower[i];
      }

      // se la "look" inizia con finale ammessa, prendila come coda
      const finalCandidates = ['n', 'l', 's', 'r', 'h', 'kk'];
      const cand =
        finalCandidates.find(fc => look && look.startsWith(fc));

      if (cand) {
        coda = cand;
        i += cand.length;
      }
    } else if (!nucleus && onset) {
      // sillaba puramente consonantica in fine parola → coda senza nucleo
      const finalCandidates = ['n', 'l', 's', 'r', 'h', 'kk'];
      if (finalCandidates.includes(onset)) {
        coda = onset;
        onset = '';
      }
    }

    res.push({ onset, nucleus, coda });
  }

  return res;
}

// =========================
// Latin → askaoza (sillaba)
// =========================

function renderOnsetNucleus(onset, nucleus) {
  // nessun suono ⇒ niente glifo
  if (!onset && !nucleus) return '';

  // CASO SOLO VOCALE (V, VV, dittongo vocalico)
  if (!onset && nucleus) {
    // vocale composta pura (ai, ae, ei, eu, oe, oi, ou, ui)
    if (ASKAOZA_COMPOUND[nucleus]) {
      return ASKAOZA_CONS['*'] + ASKAOZA_COMPOUND[nucleus];
    }

    let V = nucleus;

    // vocali lunghe
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

    // dittonghi ya/ye/yo/yu/yü, wa/we/wi/wo scritti come solo vocali
    if (ASKAOZA_DIPH[V]) {
      return ASKAOZA_CONS['*'] + ASKAOZA_DIPH[V] + (isLong ? LONG_MARK : '');
    }

    const mark = ASKAOZA_V[V] ?? '';
    return ASKAOZA_CONS['*'] + mark + (isLong ? LONG_MARK : '');
  }

  // CASI CON ONSET CONSONANTICO (CV / CVC)
  let { C, V } = splitCV(onset + (nucleus || ''));
  const base = ASKAOZA_CONS[C] || ASKAOZA_CONS['*'];

  // dittonghi yV / wV
  if (ASKAOZA_DIPH[V]) {
    return base + ASKAOZA_DIPH[V];
  }

  // vocali composte dopo consonante (se vuoi abilitarle anche qui)
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
  const words = latinToSyllables(latinText);
  return words.map(toAskaozaWordFromSyllables).join(' ');
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
