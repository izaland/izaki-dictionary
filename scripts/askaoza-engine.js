// =========================
// Askaoza Engine v3.1
// Clean stable rebuild
// =========================

// =========================
// CONSTANTS
// =========================

const LONG_MARK = 'ઃ'
const ZWNJ = '\u200C'

const DIGRAPHS = ['cch','ssh','tts','ch','sh','ts','dz','zh']
const GEMINATES = ['ss','nn','ll','kk','pp','tt','cch','ssh','tts']

// =========================
// BASE CONSONANTS
// =========================

const ASKAOZA_CONS = {

k:'ડ', g:'ડૃ',
p:'ર', b:'રૃ',
s:'ટ', z:'ટૃ',
t:'ઠ', d:'ઠૃ',

f:'ળ', v:'ળૃ',

ch:'મ', j:'મૃ',
sh:'ય', zh:'યૃ',

ts:'ઢ', dz:'ઢૃ',

h:'ત',
n:'પ',
m:'ઇ',
l:'ધ',
r:'દ',

kk:'ડ્ડ',
pp:'ર્ર',
tt:'ઠ્ઠ',
cch:'મ્મ',
ss:'ટ્ટ',
ssh:'ય્ય',
tts:'ઢ્ઢ',
ll:'ધ્ધ',
nn:'પ્પ',

'*':'૮'

}

// =========================
// FINALS
// =========================

const ASKAOZA_FINALS = {

n:'પ્',
l:'ધ્',
s:'ટ્',
r:'દ્',
h:'ત્',
kk:'ડ્ડ્'

}

// =========================
// VOWELS
// =========================

const ASKAOZA_V = {

a:'',
e:'ૅ',
i:'ા',
o:'૾',
u:'ે',
ü:'ૈ'

}

// =========================
// DIPHTHONGS
// =========================

const ASKAOZA_DIPH = {

ya:'ો',
ye:'ૅો',
yo:'૾ો',
yu:'ે\u200Dો',
yü:'ૈો',

wa:'િ',
we:'િૅ',
wi:'િા',
wo:'િ\u200D૾'

}

// =========================
// COMPOUND VOWELS
// =========================

const ASKAOZA_COMPOUND = {

ai:'૩',
ae:'૩ૅ',
ei:'ૅ૩',

eu:'ૅ૩\u200Dે',

oe:'૾૩ૅ',
oi:'૾૩',
ou:'૾૩\u200Dે',

ui:'ે૩'

}

// =========================
// SANDHI
// =========================

function applySandhi(text){

const words = text.trim().split(/\s+/)
const result=[]

for(let i=0;i<words.length;i++){

let w=words[i]
const next=words[i+1]||''

if(next && /^[aeiouyü\u0101\u0113\u012b\u014d\u016b]/i.test(next)){

if(w.endsWith('n')) w=w.slice(0,-1)+'nn'
else if(w.endsWith('l')) w=w.slice(0,-1)+'ll'
else if(w.endsWith('s')) w=w.slice(0,-1)+'ss'

}

result.push(applyInternalSandhi(w))

}

return result.join(' ')

}

function applyInternalSandhi(word){

let r=word

r=r
.replace(/s([bpfv])/gi,(m,c)=>'s'+(c==='b'?'p':c==='v'?'f':c))
.replace(/s(ch|j)/gi,'cch')
.replace(/sd/gi,'st')
.replace(/sg/gi,'sk')
.replace(/s(ts|z|dz)/gi,'tts')
.replace(/szh/gi,'ssh')

r=r
.replace(/nr/gi,'nl')
.replace(/lr/gi,'ll')
.replace(/rl/gi,'ll')

r=r
.replace(/hb/gi,'hp')
.replace(/hd/gi,'ht')
.replace(/hg/gi,'hk')
.replace(/hv/gi,'hf')
.replace(/hj/gi,'hch')
.replace(/hz/gi,'hs')
.replace(/hdz/gi,'hts')
.replace(/hzh/gi,'hsh')
.replace(/hh/gi,'pp')

return r

}

function revertSandhiForAskaoza(text){

return text
.replace(/mp/gi,'np')
.replace(/mb/gi,'nb')

}

// =========================
// SYLLABLE PARSER
// =========================

function parseWordToSyllables(word){

const res=[]
let lower=word.toLowerCase()

lower=lower
.replace(/aa/g,'ā')
.replace(/ee/g,'ē')
.replace(/ii/g,'ī')
.replace(/oo/g,'ō')
.replace(/uu/g,'ū')

const groups=lower.split("'")

for(const group of groups){

if(!group) continue

let i=0

while(i<group.length){

let onset=''
let nucleus=''
let coda=''

const char=group[i]

// passthrough
if(!/[kgpbsztdfvhnmlrjwaeiouyüāēīōū]/.test(char)){

res.push({onset:'',nucleus:char,coda:'',passthrough:true})
i++
continue

}

// onset

const s3=group.slice(i,i+3)
const s2=group.slice(i,i+2)

if(DIGRAPHS.includes(s3)){

onset=s3
i+=3

}
else if(ASKAOZA_CONS[s2]){

onset=s2
i+=2

}
else if(DIGRAPHS.includes(s2)){

onset=s2
i+=2

}
else if(/[kgpbsztdfvhnmlrjw]/.test(char)){

onset=char
i++

}

// nucleus

if(i<group.length){

const n2=group.slice(i,i+2)
const n1=group[i]

if(ASKAOZA_DIPH[n2] || ASKAOZA_COMPOUND[n2]){

nucleus=n2
i+=2

}
else if(/[aeiouyüāēīōū]/.test(n1)){

nucleus=n1
i++

}

}

// coda

if(nucleus && i<group.length){

const finals=['kk','n','l','s','r','h']

for(const fc of finals){

if(group.slice(i).startsWith(fc)){

const after=i+fc.length
const next=group[after]

const gem=group.slice(i,i+fc.length*2)===fc+fc
const dig=DIGRAPHS.some(d=>group.slice(i,i+d.length)===d)

if(!gem && !dig && !/[aeiouyüāēīōū]/.test(next)){

coda=fc
i=after

}

break

}

}

}

// coda-only

if(!nucleus && onset){

const finals=['kk','n','l','s','r','h']

if(finals.includes(onset)){

coda=onset
onset=''

}

}

if(!onset && !nucleus && !coda){

res.push({onset:'',nucleus:group[i],coda:''})
i++
continue

}

res.push({onset,nucleus,coda})

}

}

return res

}

// =========================
// RENDERING
// =========================

function splitCV(syl){

syl=syl.toLowerCase()

for(const dg of DIGRAPHS){

if(syl.startsWith(dg))
return {C:dg,V:syl.slice(dg.length)||'a'}

}

if(syl.length>=2){

const two=syl.slice(0,2)

if(ASKAOZA_CONS[two])
return {C:two,V:syl.slice(2)||'a'}

}

if(/^[kgpbsztdfvhnmlrjw]/.test(syl[0]))
return {C:syl[0],V:syl.slice(1)||'a'}

return {C:'*',V:syl}

}

function renderOnsetNucleus(onset,nucleus){

if(!onset && !nucleus) return ''

if(!onset && nucleus){

if(ASKAOZA_COMPOUND[nucleus])
return ASKAOZA_CONS['*']+ASKAOZA_COMPOUND[nucleus]

let V=nucleus
let long=false

if(/[āēīōū]/.test(V)){

long=true
V=V.replace('ā','a').replace('ē','e').replace('ī','i').replace('ō','o').replace('ū','u')

}

if(ASKAOZA_DIPH[V])
return ASKAOZA_CONS['*']+ASKAOZA_DIPH[V]+(long?LONG_MARK:'')

const mark=ASKAOZA_V[V]??''
return ASKAOZA_CONS['*']+mark+(long?LONG_MARK:'')

}

let {C,V}=splitCV(onset+(nucleus||''))

const base=ASKAOZA_CONS[C]||ASKAOZA_CONS['*']

if(ASKAOZA_DIPH[V])
return base+ASKAOZA_DIPH[V]

if(ASKAOZA_COMPOUND[V])
return base+ASKAOZA_COMPOUND[V]

let long=false

if(/[āēīōū]/.test(V)){

long=true
V=V.replace('ā','a').replace('ē','e').replace('ī','i').replace('ō','o').replace('ū','u')

}

const mark=ASKAOZA_V[V]??''

return base+mark+(long?LONG_MARK:'')

}

function renderCoda(coda){

if(!coda) return ''

return ASKAOZA_FINALS[coda] || ASKAOZA_CONS[coda] || ''

}

function toAskaozaWordFromSyllables(sylls){

return sylls.map((s,i)=>{

if(s.passthrough) return s.nucleus

const r=renderOnsetNucleus(s.onset,s.nucleus)+renderCoda(s.coda)

if(s.coda && i<sylls.length-1)
return r+ZWNJ

return r

}).join('')

}

// =========================
// LATIN → ASKAOZA
// =========================

function latinToSyllables(text){

return text.trim().split(/\s+/).map(parseWordToSyllables)

}

function toAskaozaText(latinText){

if(!latinText.trim()) return ''

let processed=applySandhi(latinText)
processed=revertSandhiForAskaoza(processed)

const words=latinToSyllables(processed)

return words.map(toAskaozaWordFromSyllables).join(' ')

}

// =========================
// EXPORT
// =========================

if(typeof module!=='undefined' && module.exports){

module.exports={

toAskaozaText,

ASKAOZA_CONS,
ASKAOZA_V,
ASKAOZA_DIPH,
ASKAOZA_COMPOUND,
ASKAOZA_FINALS

}

}
