# Byakuzhi Lookup

Type a Byakuzhi character, a word, or a compound:

<input type="text" id="search" placeholder="Enter a character or word">

<div id="results"></div>

<script>
async function loadData() {
    const response = await fetch('/data/byakuzhi.json');
    return await response.json();
}

async function main() {
    const data = await loadData();
    const searchInput = document.getElementById('search');
    const resultsDiv = document.getElementById('results');

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        resultsDiv.innerHTML = '';

        if (!query) return;

        // Splitta in caratteri singoli
        const chars = Array.from(query);
        chars.forEach(ch => {
            if (data[ch]) {
                const entry = data[ch];
                resultsDiv.innerHTML += `
                    <p><strong>${ch}</strong>: Onnufu: ${entry.onnufu || 'N/A'}, Kunnufu: ${entry.kunnufu || 'N/A'}, Askaoza: ${entry.aska || 'N/A'}</p>
                `;
            } else {
                resultsDiv.innerHTML += `<p><strong>${ch}</strong>: Not found</p>`;
            }
        });
    });
}

main();
</script>
