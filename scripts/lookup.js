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
