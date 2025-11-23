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
  const text = input.trim();
  if (!text) return '';

  let out = [];

  for (const char of text) {
    if (byakuzhi[char] && byakuzhi[char].onnufu) {
      out.push(byakuzhi[char].onnufu);
    } else {
      out.push('?');
    }
  }

  return out.join(' ');
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

    const result = getOnnufuByCharacters(input.value);
    output.textContent = result || 'No matches found';
  });
});
