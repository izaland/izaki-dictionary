/**
 * reconstruction.js
 * 
 * Sistema di ricostruzione a posteriori della lettura alfabetica (latino, IPA e Askaoza)
 * partendo da una sequenza di byakuzhi e applicando le regole fonetiche contestuali.
 */

// Importato dal contesto: 
// - byakuzhi (oggetto JSON caricato)
// - toAskaozaText (funzione per conversione alfabeto → Askaoza)
// - toIPAText (funzione per conversione alfabeto → IPA, se disponibile)

// ---------------------------
// Regole fonetiche base
// ---------------------------
function applyPhoneticRules(prevReading, nextReading) {
  if (!prevReading || !nextReading) return nextReading;
  let modified = nextReading;

  // N finale raddoppia se la prossima lettura inizia con vocale o semivocale (w, y)
  if (prevReading.endsWith('n') && /^[aeiouwy]/i.test(nextReading)) {
    modified = 'n' + nextReading;
  }

  // N finale davanti a R → L
  if (prevReading.endsWith('n') && nextReading.startsWith('r')) {
    modified = 'l' + nextReading.slice(1);
  }

  return modified;
}

// ---------------------------
// Regole S finale
// ---------------------------
function applySRules(prevReading, nextReading) {
  if (!prevReading || !nextReading) return nextReading;
  if (!prevReading.endsWith('s')) return nextReading;

  const firstTwo = nextReading.slice(0, 2);
  const firstOne = nextReading.charAt(0);

  // Regole per affricate di 2 lettere
  switch (firstTwo) {
    case 'ch': return 'cch' + nextReading.slice(2);
    case 'ts': return 'tts' + nextReading.slice(2);
    case 'dz': return 'tts' + nextReading.slice(2);
    case 'zh': return 'ssh' + nextReading.slice(2);
  }

  // Regole per consonanti singole
  switch (firstOne) {
    case 'b': return 'sp' + nextReading.slice(1);
    case 'd': return 'st' + nextReading.slice(1);
    case 'g': return 'sk' + nextReading.slice(1);
    case 'j': return 'cch' + nextReading.slice(1);
    case 'r': return 'sl' + nextReading.slice(1);
    case 'v': return 'sf' + nextReading.slice(1);
    case 'z': return 'tts' + nextReading.slice(1);
  }

  return nextReading;
}

// ---------------------------
// Fusione -ku/-ki + K/H
// ---------------------------
function applyKuRules(prevReading, nextReading) {
  if (!prevReading || !nextReading) return nextReading;
  
  // Applica solo se la lettura precedente ha almeno 3 caratteri
  if (prevReading.length < 3) return nextReading;

  // Se termina in -ku o -ki e il prossimo inizia con k o h
  if ((prevReading.endsWith('ku') || prevReading.endsWith('ki')) && /^[kh]/i.test(nextReading)) {
    let base = prevReading.slice(0, -1); // rimuove 'u' o 'i'
    
    // Se inizia con h, lo converte in k
    if (/^h/i.test(nextReading)) {
      nextReading = 'k' + nextReading.slice(1);
    }
    
    return base + nextReading;
  }

  return nextReading;
}

// ---------------------------
// FUNZIONE PRINCIPALE: Ricostruzione lettura
// ---------------------------
/**
 * Ricostruisce la lettura alfabetica completa da una stringa di byakuzhi
 * applicando tutte le regole fonetiche contestuali.
 * 
 * @param {string} byakuzhiText - Testo scritto in byakuzhi
 * @param {Object} byakuzhiDB - Database delle pronunce (default: byakuzhi globale)
 * @returns {Object} - { latin: string, ipa: string, askaoza: string }
 */
function reconstructReading(byakuzhiText, byakuzhiDB = byakuzhi) {
  if (!byakuzhiText) {
    return { latin: '', ipa: '', askaoza: '' };
  }

  if (!byakuzhiDB || Object.keys(byakuzhiDB).length === 0) {
    console.warn('Database byakuzhi non disponibile');
    return { latin: '?', ipa: '?', askaoza: '?' };
  }

  let latinReading = '';
  let prevReading = '';

  // Itera carattere per carattere
  for (const char of byakuzhiText) {
    // Gestione spazi
    if (char === ' ') {
      latinReading += ' ';
      prevReading = '';
      continue;
    }

    // Recupera la pronuncia base (onnufu) dal DB
    let currentReading = '?';
    if (byakuzhiDB[char] && byakuzhiDB[char].onnufu) {
      currentReading = byakuzhiDB[char].onnufu;
    }

    // Se c'è una lettura precedente, applica le regole fonetiche
    if (prevReading) {
      currentReading = applyPhoneticRules(prevReading, currentReading);
      currentReading = applySRules(prevReading, currentReading);
      
      // Gestione fusione -ku/-ki
      const fusedReading = applyKuRules(prevReading, currentReading);
      
      if (fusedReading !== currentReading) {
        // La fusione ha modificato la lettura: rimuove quella precedente
        latinReading = latinReading.slice(0, -prevReading.length) + fusedReading;
        currentReading = fusedReading;
      } else {
        latinReading += currentReading;
      }
    } else {
      latinReading += currentReading;
    }

    prevReading = currentReading;
  }

  // Conversione in IPA e Askaoza
  const ipaReading = typeof toIPAText === 'function' 
    ? toIPAText(latinReading) 
    : latinReading; // fallback se toIPAText non è definito
    
  const askaozaReading = typeof toAskaozaText === 'function' 
    ? toAskaozaText(latinReading) 
    : latinReading; // fallback se toAskaozaText non è definito

  return {
    latin: latinReading,
    ipa: ipaReading,
    askaoza: askaozaReading
  };
}

// ---------------------------
// Funzione helper per display HTML
// ---------------------------
/**
 * Formatta l'output della ricostruzione per visualizzazione HTML
 * @param {Object} readings - Oggetto con { latin, ipa, askaoza }
 * @returns {string} - HTML formattato
 */
function formatReadingsHTML(readings) {
  return `
    <div class="readings-output">
      <div class="reading-line">
        <span class="reading-label">Latino:</span> 
        <span class="reading-text latin">${readings.latin}</span>
      </div>
      <div class="reading-line">
        <span class="reading-label">IPA:</span> 
        <span class="reading-text ipa">${readings.ipa}</span>
      </div>
      <div class="reading-line">
        <span class="reading-label">Askaoza:</span> 
        <span class="reading-text askaoza">${readings.askaoza}</span>
      </div>
    </div>
  `;
}

// ---------------------------
// Integrazione con event listener (opzionale)
// ---------------------------
document.addEventListener('DOMContentLoaded', () => {
  const reconstructInput = document.getElementById('reconstructInput');
  const reconstructOutput = document.getElementById('reconstructOutput');
  
  if (reconstructInput && reconstructOutput) {
    reconstructInput.addEventListener('input', () => {
      if (!byakuzhi || Object.keys(byakuzhi).length === 0) {
        reconstructOutput.innerHTML = '<em>Caricamento dizionario...</em>';
        return;
      }
      
      const readings = reconstructReading(reconstructInput.value);
      reconstructOutput.innerHTML = formatReadingsHTML(readings);
    });
  }
});

// Esporta le funzioni principali (per uso modulare)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    reconstructReading,
    formatReadingsHTML,
    applyPhoneticRules,
    applySRules,
    applyKuRules
  };
}