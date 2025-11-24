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

    // --- Regole per la S finale ---
if (prevChar.endsWith('s')) {
    // Prima consonante del prossimo segmento
    const firstNext = nextChar.charAt(0);

    // Regole di assimilazione
    switch (firstNext) {
        case 'b': nextChar = 'p' + nextChar.slice(1); break;  // s + b → sp
        case 'd': nextChar = 't' + nextChar.slice(1); break;  // s + d → st
        case 'g': nextChar = 'k' + nextChar.slice(1); break;  // s + g → sk
        case 'j': nextChar = 'cch' + nextChar.slice(1); break; // s + j → cch
        case 'ch': nextChar = 'cch' + nextChar.slice(2); break; // s + ch → cch
        case 'r': nextChar = 'l' + nextChar.slice(1); break;  // s + r → sl
        case 'ts': nextChar = 'tts' + nextChar.slice(2); break; // s + ts → tts
        case 'v': nextChar = 'f' + nextChar.slice(1); break;  // s + v → sf
        case 'z': nextChar = 'tts' + nextChar.slice(1); break; // s + z → tts
        case 'dz': nextChar = 'tts' + nextChar.slice(2); break; // s + dz → tts
        case 'zh': nextChar = 'ssh' + nextChar.slice(2); break; // s + zh → ssh
    }
}

    // --- Fusione di -ku finale + K/H iniziale ---
if (prevChar.endsWith('ku') && /^[k|h]/i.test(nextChar)) {
    // Rimuovo la U finale di "ku"
    prevChar = prevChar.slice(0, -1);
    // Se la prossima lettura inizia con h → diventa K
    if (/^h/i.test(nextChar)) {
        nextChar = 'k' + nextChar.slice(1);
    }
    // Combino
    nextChar = prevChar + nextChar;
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
