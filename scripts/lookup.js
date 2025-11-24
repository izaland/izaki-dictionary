let byakuzhi = {};

// ---------------------------
// Caricamento JSON
// ---------------------------
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

// ---------------------------
// Regole fonetiche base
// ---------------------------
function applyPhoneticRules(prevChar, nextChar) {
  if (!prevChar || !nextChar) return nextChar;
  let modified = nextChar;

  // N finale raddoppia se la prossima lettura inizia con vocale o semivocale (w, y)
  if (prevChar.endsWith('n') && /^[aeiouwy]/i.test(nextChar)) {
    modified = 'n' + nextChar;
  }

  // N finale davanti a R → L
  if (prevChar.endsWith('n') && nextChar.startsWith('r')) {
    modified = 'l' + nextChar.slice(1);
  }

  return modified;
}

// ---------------------------
// Regole S finale
// ---------------------------
function applySRules(prev, next) {
  if (!prev || !next) return next;
  if (!prev.endsWith('s')) return next;

  const firstNext = next.slice(0, 2); // controllo affricate di 2 lettere
  const firstNext1 = next.charAt(0);

  switch (firstNext) {
    case 'ch': return 'cch' + next.slice(2);
    case 'ts': return 'tts' + next.slice(2);
    case 'dz': return 'tts' + next.slice(2);
    case 'zh': return 'ssh' + next.slice(2);
  }

  switch (firstNext1) {
    case 'b': return 'sp' + next.slice(1);
    case 'd': return 'st' + next.slice(1);
    case 'g': return 'sk' + next.slice(1);
    case 'j': return 'cch' + next.slice(1);
    case 'r': return 'sl' + next.slice(1);
    case 'v': return 'sf' + next.slice(1);
    case 'z': return 'tts' + next.slice(1);
  }

  return next;
}

// ---------------------------
// Fusione -ku/-ki + K/H
// ---------------------------
function applyKuRules(prev, next) {
  if (!prev || !next) return next;
  // solo se prev >= 3 sillabe
  if (prev.length < 3) return next;

  if ((prev.endsWith('ku') || prev.endsWith('ki')) && /^[kh]/i.test(next)) {
    let base = prev.slice(0, -1); // tolgo u o i finale
    if (/^h/i.test(next)) {
      next = 'k' + next.slice(1);
    }
    return base + next;
  }

  return next;
}

// ---------------------------
// Funzione principale
// ---------------------------
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

    // Regole fonetiche base
    if (prev) {
      current = applyPhoneticRules(prev, current);
      current = applySRules(prev, current);
      const fused = applyKuRules(prev, current);

      if (fused !== current) {
        // rimuovo la lettura precedente dal risultato parziale
        out = out.slice(0, -prev.length) + fused;
        current = fused;
      } else {
        out += current;
      }
    } else {
      out += current;
    }

    prev = current;
  }

  return out;
}

// ---------------------------
// Event listener
// ---------------------------
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
