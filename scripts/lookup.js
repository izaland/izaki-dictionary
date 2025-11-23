let byakuzhi = {};

// -----------------------------
// Carica JSON con le letture
// -----------------------------
async function loadJSON() {
  const url = '/izaki-dictionary/data/byakuzhi.json'; // assicurati che il percorso sia corretto
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    byakuzhi = await res.json();
    console.log('Byakuzhi JSON loaded');
  } catch (err) {
    console.error('Failed to load JSON:', err);
  }
}

// -----------------------------
// Restituisce la stringa di letture raw
// -----------------------------
function getOnnufuByCharacters(input) {
  if (!input) return '';

  let out = '';

  for (const char of input) {
    if (char === ' ') {
      out += ' ';
    } else if (byakuzhi[char] && byakuzhi[char].onnufu) {
      out += byakuzhi[char].onnufu;
    } else {
      out += '?';
    }
  }

  return out;
}

// -----------------------------
// Applica le regole fonetiche
// -----------------------------
function applyPhoneticRules(str) {
  // -----------------------------
  // Final n assimilations
  str = str.replace(/n(?=r)/g, 'l');   // n + r → l
  str = str.replace(/n(?=[kg])/g, 'ŋ'); // n + k/g → ŋ
  str = str.replace(/n(?=[pb])/g, 'm'); // n + p/b → m

  // Final l and r liquids
  str = str.replace(/r(?=l)/g, 'l');
  str = str.replace(/l(?=r)/g, 'l');

  // Final s assimilation
  str = str.replace(/s(?=[bp])/g, 'sp');
  str = str.replace(/s(?=[chj])/g, 'cch');
  str = str.replace(/s(?=[dt])/g, 'st');
  str = str.replace(/s(?=[fv])/g, 'sf');
  str = str.replace(/s(?=[kg])/g, 'sk');
  str = str.replace(/s(?=h)/g, 'sh');
  str = str.replace(/s(?=l)/g, 'sl');
  str = str.replace(/s(?=m)/g, 'sm');
  str = str.replace(/s(?=n)/g, 'sn');
  str = str.replace(/s(?=s)/g, 'ss');
  str = str.replace(/s(?=[tsdz])/g, 'tts');
  str = str.replace(/s(?=zh)/g, 'ssh');
  str = str.replace(/s(?=r)/g, 'sr');

  // Final h interactions
  str = str.replace(/b(?=h)/g, 'p');
  str = str.replace(/d(?=h)/g, 't');
  str = str.replace(/g(?=h)/g, 'k');
  str = str.replace(/j(?=h)/g, 'cch');
  str = str.replace(/v(?=h)/g, 'f');
  str = str.replace(/h(?=h)/g, 'pp');
  str = str.replace(/h(?=[aeiou])/g, '');

  // Final consonant + vowel-initial syllables
  str = str.replace(/r(?=[aeiou])/g, 't');
  str = str.replace(/n(?=[aeiou])/g, 'nn');
  str = str.replace(/l(?=[aeiou])/g, 'll');
  str = str.replace(/s(?=[aeiou])/g, 'ss');
  str = str.replace(/h(?=[aeiou])/g, '');

  // Cleanups
  str = str.replace(/wu/g, '');
  str = str.replace(/yi/g, '');

  // Contextual raddoppiamenti (semplice)
  str = str.replace(/n/g, 'nn');
  str = str.replace(/l/g, 'll');
  str = str.replace(/s/g, 'ss');
  str = str.replace(/h/g, '');

  return str;
}

// -----------------------------
// Inizializzazione
// -----------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadJSON();

  const input = document.getElementById('lookup-input');
  const button = document.getElementById('lookup-button');
  const output = document.getElementById('result');

  function updateOutput() {
    if (!byakuzhi || Object.keys(byakuzhi).length === 0) {
      output.textContent = 'Loading dictionary...';
      return;
    }

    const raw = getOnnufuByCharacters(input.value);
    const finalResult = applyPhoneticRules(raw);
    output.textContent = finalResult;
  }

  button.addEventListener('click', updateOutput);
  input.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') updateOutput();
  });
});
