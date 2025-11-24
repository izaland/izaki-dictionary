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

// Funzione che applica le due regole fonetiche iniziali
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

    // Applica le regole fonetiche
    if (prev) {
      current = applyPhoneticRules(prev, current);
    }

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
