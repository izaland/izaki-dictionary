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

function getOnnufuByCharacter(input) {
  const char = input.trim();
  if (!char) return '';
  if (!byakuzhi[char]) return '';
  return byakuzhi[char].onnufu;
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
    output.textContent = getOnnufuByCharacter(input.value) || 'No matches found';
  });
});
