let byakuzhi = {};

async function loadJSON() {
  const url = '/izaki-dictionary/data/byakuzhi.json';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    byakuzhi = await res.json();
    console.log('Byakuzhi JSON loaded');
  } catch (err) {
    console.error('Failed to load JSON:', err);
  }
}

// Regole fonetiche base (N davanti a vocale/semi-vocale, N+R)
function applyPhoneticRules(prev, next) {
  if (!prev || !next) return next;

  let modified = next;

  if (prev.endsWith('n') && /^[aeiouwy]/i.test(next)) {
    modified = 'n' + next;
  }

  if (prev.endsWith('n') && next.startsWith('r')) {
    modified = 'l' + next.slice(1);
  }

  return modified;
}

// Regole per -s finale
function applySRules(prev, next) {
  if (!prev || !next) return next;

  if (!prev.endsWith('s')) return next;

  const first = next.slice(0,2).toLowerCase(); // per ch, ts, dz, zh
  let rest = next.slice(first.length);

  switch(first) {
    case 'b': return 'sp' + rest;
    case 'd': return 'st' + rest;
    case 'g': return 'sk' + rest;
    case 'j': return 'cch' + rest;
    case 'ch': return 'cch' + rest;
    case 'r': return 'l' + rest;
    case 'ts': return 'tts' + rest;
    case 'v': return 'sf' + rest;
    case 'z': return 'tts' + rest;
    case 'dz': return 'tts' + rest;
    case 'zh': return 'ssh' + rest;
    default: return next;
  }
}

// Fusione -ku/-ki + K/H per letture lunghe (>=3 sillabe)
function applyKuRules(prev, next) {
  if (!prev || !next) return next;

  // Controllo lunghezza: almeno 3 sillabe prima di applicare
  if (prev.length < 3) return next;

  // Regola solo per prev che termina in 'ku' o 'ki'
  if (/k[ui]$/i.test(prev) && /^[kh]/i.test(next)) {
    let base = prev.slice(0, -1); // tolgo u o i finale
    // Se next inizia con h → diventa k
    if (/^h/i.test(next)) {
      next = 'k' + next.slice(1);
    }
    // Combino senza duplicare prev
    return base + next;
  }

  return next;
}

function getOnnufuByCharacters(input) {
  if (!input) return '';

  let out = '';
  let prev = '';

  for (const char of input) {
    if (char === ' ') {
      out += ' ';
      prev = '';
      continue;
    }

    let current = '?';
    if (byakuzhi[char] && byakuzhi[char].onnufu) {
      current = byakuzhi[char].onnufu;
    }

    // Applica regole fonetiche
    current = applyPhoneticRules(prev, current);
    current = applySRules(prev, current);
    current = applyKuRules(prev, current);

    out += current;
    prev = current;
  }

  return out;
}

document.addEventListener('DOMContentLoaded', () => {
  loadJSON();

  const input = document.getElementById('input');
  const output = document.getElementById('output');

  input.addEventListener('input', () => {
    if (!byakuzhi || Object.keys(byakuzhi).length === 0) {
      output.textContent = 'Loading dictionary...';
      return;
    }

    output.textContent = getOnnufuByCharacters(input.value);
  });
});
