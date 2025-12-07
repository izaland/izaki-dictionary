// Funzioni di declinazione semplificate per il dizionario

function analyzeEnding(lemma) {
  const clean = lemma.replace(/[^a-zāēīōū]/gi, '').toLowerCase();
  const lastChar = clean.slice(-1);
  const vowels = 'aeiouāēīōū';
  const isVowelEnd = vowels.includes(lastChar);
  const isLongVowelEnd = 'āēīōū'.includes(lastChar);
  
  return {
    clean,
    isVowelEnd,
    isLongVowelEnd,
    isConsonantEnd: !isVowelEnd,
    lastVowel: isVowelEnd ? lastChar : null
  };
}

function declineNounSimple(lemma) {
  const a = analyzeEnding(lemma);
  const forms = { singular: {}, plural: {} };
  
  // Singolare
  forms.singular.nom = a.clean;
  forms.singular.gen = a.clean + (a.isVowelEnd ? (a.isLongVowelEnd ? 'hun' : 'n') : 'un');
  forms.singular.acc = a.isVowelEnd && !a.isLongVowelEnd ? 
    a.clean.slice(0, -1) + { a:'ā', e:'ē', i:'ī', o:'ō', u:'ū' }[a.lastVowel] : a.clean;
  forms.singular.dat = a.clean + 'i';
  forms.singular.ess = a.clean + (a.isVowelEnd ? (a.isLongVowelEnd ? 'hus' : 's') : 'us');
  forms.singular.all = a.clean + (a.isVowelEnd ? (a.isLongVowelEnd ? 'hur' : 'r') : 'ur');
  forms.singular.abl = a.clean + (a.isVowelEnd ? (a.isLongVowelEnd ? 'hul' : 'l') : 'ul');
  forms.singular.ins = a.clean + 'e';
  
  // Plurale (semplificato)
  const stem = forms.singular.nom;
  forms.plural.nom = stem + (a.isVowelEnd ? 'n' : 'a');
  forms.plural.gen = stem + 'in';
  forms.plural.acc = stem + 'ita';
  forms.plural.dat = stem + 'hi';
  forms.plural.ess = stem + 'is';
  forms.plural.all = stem + 'ir';
  forms.plural.abl = stem + 'il';
  forms.plural.ins = forms.singular.ins + 'i';
  
  return forms;
}