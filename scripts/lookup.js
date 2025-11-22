let byakuzhi = {};

async function loadJSON() {
  const url = '/data/byakuzhi.json';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    byakuzhi = await res.json();
    console.log('Byakuzhi JSON loaded');
  } catch (err) {
    console.error('Failed to load JSON:', err);
  }
}

function squashDiacritics(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0304]/g, '')
    .normalize('NFC');
}

function getCharactersByOnnufu(input) {
  input = squashDiacritics(input.trim().toLowerCase());
  if (!input) return '';

  const matches = [];
  for (const [char, info] of Object.entries(byakuzhi)) {
    const reading = squashDiacritics(info.onnufu.toLowerCase());
    if (reading === input) {
      matches.push(`${char}(${info.onnufu})`);
    }
  }
  return matches.join(', ');
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
    output.textContent = getCharactersByOnnufu(input.value) || 'No matches found';
  });
});
