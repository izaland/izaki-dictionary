let byakuzhi = {}; 

// ==============================
// Load JSON
// ==============================
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

// ==============================
// Base lookup (unchanged)
// ==============================
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

// ==============================
// Izaki Phonological Rules
// ==============================
function applySoundChanges(str) {

  let s = str;

  // --- Final n assimilations ---
  s = s.replace(/nr/g, "nl");      // n + r → l (nr → nl)
  s = s.replace(/n([kg])/g, "ŋ$1"); // n + velar
  s = s.replace(/n([pb])/g, "m$1"); // n + bilabial

  // --- l/r liquids ---
  s = s.replace(/lr/g, "ll");
  s = s.replace(/rl/g, "ll");

  // --- s assimilation ---
  s = s.replace(/s([bp])/g, "sp$1");
  s = s.replace(/s(ch|j)/g, "cch$1");
  s = s.replace(/s([dt])/g, "st$1");
  s = s.replace(/s([fv])/g, "sf$1");
  s = s.replace(/s([kg])/g, "sk$1");
  s = s.replace(/sh/g, "sh"); // unchanged but placeholder
  s = s.replace(/sl/g, "sl");
  s = s.replace(/sm/g, "sm");
  s = s.replace(/sn/g, "sn");
  s = s.replace(/ss/g, "ss");
  s = s.replace(/s(ts|dz|z)/g, "tts$1");
  s = s.replace(/szh/g, "ssh");
  s = s.replace(/sr/g, "sr");

  // --- h interactions ---
  s = s.replace(/h([bdg])/g, (m, c) => {
    return "h" + {b:"p", d:"t", g:"k"}[c];
  });
  s = s.replace(/hj/g, "hcch");
  s = s.replace(/hv/g, "hf");
  s = s.replace(/hh/g, "pp");

  // h + vowel → disappear + lengthen (we mark long vowels with :)
  s = s.replace(/h([aeiou])/g, "$1$1");

  // --- coda + vowel initial ---
  s = s.replace(/r([aeiou])/g, "t$1");
  s = s.replace(/n([aeiou])/g, "nn$1");
  s = s.replace(/l([aeiou])/g, "ll$1");

  s = s.replace(/s(i[aeiou])/g, "ʃʃ$1"); 
  s = s.replace(/s([aeou][aeiou]?)/g, "ss$1");

  // remove h before vowels (duplicate rule safeguard)
  s = s.replace(/h([aeiou])/g, "$1$1");

  // --- disallowed sequences ---
  s = s.replace(/wu/g, "");
  s = s.replace(/yi/g, "");

  return s;
}

// ==============================
// DOM logic (unchanged)
// ==============================
document.addEventListener('DOMContentLoaded', () => {
  loadJSON();

  const input = document.getElementById('input');
  const output = document.getElementById('output');

  input.addEventListener('input', () => {
    if (!byakuzhi || Object.keys(byakuzhi).length === 0) {
      output.textContent = 'Loading dictionary...';
      return;
    }

    let base = getOnnufuByCharacters(input.value);
    let final = applySoundChanges(base);

    output.textContent = final;
  });
});
