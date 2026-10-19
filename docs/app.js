import { DEFAULTS, LIMITS, normalize, calculate, stressScenarios } from './model.js';

const ICONS = {
  book: '<path d="M3 4h7a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H3Zm18 0h-5a3 3 0 0 0-3 3v14a4 4 0 0 1 4-2h4Z"/>',
  sliders: '<path d="M5 3v7m0 5v6M12 3v12m0 4v2M19 3v2m0 4v12M2 10h6m1 5h6m1-10h6"/>',
  spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
  home: '<path d="m3 11 9-8 9 8v10H3Zm6 10v-8h6v8"/>',
  tools: '<path d="m14 5 5 5M3 21l7-7m4-9 4-3 4 4-3 4-5-5Zm-4 9 4-4 3 3-4 4-3-3ZM4 3l5 5-2 3-5-5Z"/>',
  key: '<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-5-5 3-3m0 6 3-3"/>',
  bank: '<path d="m2 8 10-6 10 6ZM4 21h16M6 11v7m6-7v7m6-7v7M2 21h20"/>',
  repeat: '<path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5m-4 8a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  bulb: '<path d="M9 17v-1a7 7 0 1 1 6 0v1Zm0 3h6m-5 3h4M12 2V0M3 7 1 6m20 1 2-1"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  chart: '<path d="M3 3v18h18M6 15l5-5 4 3 6-8"/>',
  shield: '<path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6Zm-4 10 3 3 5-6"/>',
  search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
};
const icon = name => `<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[name] || ICONS.home}</svg></span>`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const STORAGE_KEY = 'brrrr-lab-v1';
const currencies = { EUR: '€', USD: '$', RON: 'lei' };
const pages = { invata: 'Învață BRRRR', simulator: 'Simulator', provocari: 'Provocări', glosar: 'Glosar' };
let storageAvailable = true;
let loaded = {};
try { loaded = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch { storageAvailable = false; }
const state = {
  page: 'invata', lesson: Number.isInteger(loaded.lesson) && loaded.lesson >= 0 && loaded.lesson < 5 ? loaded.lesson : 0,
  completed: Array.isArray(loaded.completed) ? [...new Set(loaded.completed.filter(n => Number.isInteger(n) && n >= 0 && n < 5))] : [],
  currency: currencies[loaded.currency] ? loaded.currency : 'EUR',
  values: normalize(loaded.values),
  saved: Array.isArray(loaded.saved) ? loaded.saved.filter(s => s && typeof s.name === 'string' && s.values).slice(0, 12).map(s => ({ name: s.name.slice(0, 60), currency: currencies[s.currency] ? s.currency : 'EUR', values: normalize(s.values) })) : [],
  quiz: {}, challenges: {}, search: '',
};
const main = document.querySelector('main');
const currency = () => currencies[state.currency];
const number = (value, digits = 0) => new Intl.NumberFormat('ro-RO', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
const money = (value, digits = 0) => `${number(value, digits)} ${currency()}`;
const persist = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ lesson: state.lesson, completed: state.completed, currency: state.currency, values: state.values, saved: state.saved })); }
  catch { storageAvailable = false; }
  document.querySelector('.local-status').innerHTML = `<i></i> ${storageAvailable ? 'Progres pe dispozitiv' : 'Salvare indisponibilă'}`;
};
let toastTimer;
function toast(message) {
  const el = document.querySelector('#toast'); el.textContent = message; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 4000);
}

const lessons = [
  { english: 'Buy', title: 'Cumperi', icon: 'home', heading: 'Prețul mic este doar începutul.', time: '3 min',
    body: 'Începi cu o proprietate pe care o poți îmbunătăți. Înainte să faci o ofertă, aduni toate costurile: cumpărare, renovare, rezervă pentru lucrări neprevăzute și cheltuieli până la închiriere. Compari rezultatul cu o valoare după renovare susținută de proprietăți similare.',
    takeaway: '<strong>Exersează cu cifre complete.</strong> În exemplul nostru: 60.000 € cumpărare + 15.000 € renovare + 1.500 € rezervă + 3.500 € alte costuri = 80.000 €.',
    question: 'Cât ai investit înainte de refinanțare în exemplul de mai sus?', answers: ['60.000 € — prețul apartamentului', '80.000 € — toate costurile proiectului', '75.000 € — valoarea noului credit'], correct: 1,
    explanation: 'Costul proiectului include toate cele patru sume. Prețul din anunț acoperă doar o parte din banii necesari.', task: 'Notează separat fiecare cost, chiar dacă încă ai doar o estimare.' },
  { english: 'Rehab', title: 'Renovezi', icon: 'tools', heading: 'Un plan de lucrări, nu o surpriză.', time: '3 min',
    body: 'Renovarea pregătește locuința pentru închiriere și poate crește valoarea ei. Separă reparațiile necesare de îmbunătățirile opționale. Cere devize, estimează durata și include cheltuielile din lunile în care nu încasezi chirie. Costul lucrărilor și creșterea valorii sunt două estimări diferite.',
    takeaway: '<strong>Rezerva este parte din buget.</strong> La lucrări de 15.000 €, o rezervă ipotetică de 10% adaugă 1.500 €. Procentul este un exercițiu, nu o garanție că ajunge.',
    question: 'Lucrările costă 15.000 €, iar rezerva este 10%. Ce buget aloci în total lucrărilor?', answers: ['15.000 €', '16.500 €', '25.000 €'], correct: 1,
    explanation: '10% × 15.000 € = 1.500 €. Împreună, lucrările și rezerva înseamnă 16.500 €.', task: 'În simulator, mărește renovarea cu 20% și observă capitalul rămas.' },
  { english: 'Rent', title: 'Închiriezi', icon: 'key', heading: 'Chiria încasată nu este profitul.', time: '4 min',
    body: 'După renovare, închiriezi proprietatea. O lună bună nu descrie întregul an: bugetează perioade fără chiriaș, întreținere, reparații mari, administrare, taxe și asigurare. Din ce rămâne plătești rata. În calculator, rezultatul este fluxul lunar estimat înainte de impozitul pe venit.',
    takeaway: '<strong>Gândește în medii lunare.</strong> Banii puși deoparte pentru reparații pot rămâne în cont o vreme, dar sunt deja alocați întreținerii proprietății.',
    question: 'Încasezi 850 €, ai cheltuieli și rezerve de 250 €, iar rata este 500 €. Cât rămâne înainte de impozitul pe venit?', answers: ['350 €', '850 €', '100 €'], correct: 2,
    explanation: '850 € − 250 € − 500 € = 100 €. Scăderea exclusiv a ratei ar ascunde alte cheltuieli ale proprietății.', task: 'Micșorează chiria cu 10%. Mai acoperă toate ieșirile de bani?' },
  { english: 'Refinance', title: 'Refinanțezi', icon: 'bank', heading: 'Recuperezi bani. Preiei o datorie.', time: '4 min',
    body: 'Refinanțarea înlocuiește creditul existent cu unul nou, dacă sunt îndeplinite condițiile creditorului. O parte din noul împrumut achită datoria veche și costurile, iar diferența poate reveni în contul tău. Evaluarea și procentul finanțat influențează suma disponibilă.',
    takeaway: '<strong>Banii împrumutați trebuie rambursați.</strong> La evaluare de 100.000 € și finanțare ipotetică de 75%, noul credit este 75.000 €. Datoria veche și costurile se scad din el.',
    question: 'Credit nou 75.000 €, datorie veche 40.000 €, costuri 2.000 €. Ce sumă îți revine?', answers: ['75.000 €', '33.000 €', '35.000 €'], correct: 1,
    explanation: '75.000 € − 40.000 € − 2.000 € = 33.000 €. Rămâi cu noua datorie de 75.000 €, chiar dacă în cont primești doar diferența.', task: 'În simulator, completează datoria veche și urmărește cum se schimbă suma recuperată.' },
  { english: 'Repeat', title: 'Repeți', icon: 'repeat', heading: 'Următoarea investiție începe cu o verificare.', time: '3 min',
    body: 'Poți analiza un nou proiect folosind capitalul recuperat. Mai întâi verifici dacă proprietatea existentă își susține cheltuielile, ce rezerve păstrezi și ce se întâmplă într-un scenariu dificil. Recuperarea banilor inițiali și un flux lunar sănătos sunt două obiective separate.',
    takeaway: '<strong>Încearcă și varianta dificilă.</strong> Combină o evaluare cu 10% mai mică, o renovare cu 20% mai scumpă, o chirie cu 10% mai mică și o dobândă cu 2 puncte mai mare.',
    question: 'Ai recuperat aproape toți banii, dar chiria nu acoperă cheltuielile și rata. Ce ai aflat?', answers: ['Ai o problemă de flux lunar care trebuie analizată.', 'Investiția este automat bună pentru că ai recuperat banii.', 'Rata nu mai contează după refinanțare.'], correct: 0,
    explanation: 'Poți recupera capital și totuși să aduci bani de acasă lunar. De aceea, verifici atât capitalul, cât și fluxul de numerar.', task: 'Rulează toate scenariile de risc înainte să consideri că ai terminat analiza.' },
];

const houseArt = `<div class="hero-art" aria-hidden="true"><svg viewBox="0 0 440 265" fill="none"><defs><pattern id="dot-grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#b3c29c" opacity=".5"/></pattern><linearGradient id="ground" x1="160" y1="220" x2="350" y2="200"><stop stop-color="#d1dbbf"/><stop offset="1" stop-color="#e5eadb"/></linearGradient></defs><rect width="440" height="265" fill="url(#dot-grid)"/><ellipse cx="255" cy="226" rx="160" ry="24" fill="url(#ground)"/><path d="m104 204 150 43 137-43-144-43Z" fill="#d9e1cd"/><path d="m151 115 100-48 101 46v99l-100 36-101-36Z" fill="#edf0e3" stroke="#b2c09b"/><path d="m251 67 101 46v99l-100 36Z" fill="#dce4ce"/><path d="m139 116 106-73 118 72-17 8-99-57-93 58Z" fill="#274d3a"/><path d="m245 43 118 72-17 8-99-57Z" fill="#45674b"/><path d="m178 158 39-14v53l-39 13Z" fill="#b4c8a1" stroke="#8da37a"/><path d="m184 164 27-10v35l-27 9Z" fill="#eff1d5"/><path d="m197 160 0 33m-13-12 27-10" stroke="#7d9770"/><path d="m272 148 33 11v39l-33-10Z" fill="#b4c8a1" stroke="#91a77b"/><path d="m277 155 23 7v28l-23-7Z" fill="#f2efcb"/><path d="m288 159 0 27m-11-17 23 8" stroke="#8da47a"/><path d="m320 166 20 7v35l-20 7Z" fill="#7c9472"/><path d="m322 168 16 6v33l-16 6Z" fill="#527050"/><circle cx="333" cy="192" r="1.6" fill="#d8dfad"/><path d="m326 215 26-9 21 7-27 10Z" fill="#b6c6a5"/><path d="m338 221 15-5 34 13-16 5Z" fill="#c4cfb4"/><path d="M118 204v-34m0 14c-23-7-20-31-11-32-4-29 17-29 19-9 18-3 23 24 1 34" fill="#7e9d68"/><path d="M118 205v-43m0 23-9-10m9 1 9-12" stroke="#4c734a" stroke-width="2"/><path d="M387 209v-30m0 14c-16-5-17-24-6-28-2-17 15-20 18-3 16 4 11 23-6 26" fill="#a2b37f"/><path d="M387 211v-36" stroke="#6b875a" stroke-width="2"/><path d="M174 108h32v-7h-20" stroke="#91a67d" stroke-dasharray="3 4"/><g transform="translate(51 58)"><rect width="105" height="40" rx="9" fill="#fafcf5" stroke="#cedabc"/><circle cx="19" cy="20" r="10" fill="#edf3df"/><path d="m14 20 4 4 7-8" stroke="#6f8f47" stroke-width="1.6"/><text x="36" y="17" fill="#7f8d70" font-size="6.5" font-family="Segoe UI,sans-serif">PRIMUL TĂU PROIECT</text><text x="36" y="29" fill="#344c32" font-size="10" font-family="Segoe UI,sans-serif">Începe cu un plan.</text></g><g transform="translate(307 42)"><rect width="90" height="38" rx="8" fill="#193e35"/><path d="M13 27V17m7 10V12m7 15V8" stroke="#d6e99c" stroke-width="2"/><text x="37" y="18" fill="#e5eed9" font-size="8" font-family="Segoe UI,sans-serif">5 pași.</text><text x="37" y="29" fill="#b6c7ac" font-size="7" font-family="Segoe UI,sans-serif">O strategie.</text></g></svg><span class="art-caption"><i></i> IDEI CLARE. DECIZII CALCULATE.</span></div>`;

function heading(eyebrow, title, description, side = `<span class="pill">${icon('book')} Mod de învățare</span>`) {
  return `<div class="page-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${description}</p></div>${side}</div>`;
}

function quizHtml(id, quiz, selected) {
  const hasAnswer = Number.isInteger(selected);
  return `<div class="quiz"><span class="quiz-label">${iconLabel(id)}</span><h3>${quiz.question}</h3><div class="answers" role="group" aria-label="${escapeHtml(quiz.question)}">${quiz.answers.map((answer, i) => `<button class="answer ${hasAnswer && i === selected ? (i === quiz.correct ? 'correct' : 'wrong') : ''}" data-quiz="${id}" data-answer="${i}" aria-pressed="${selected === i}"><span>${String.fromCharCode(65 + i)}</span><span>${answer}</span></button>`).join('')}</div>${hasAnswer ? `<p class="feedback ${selected === quiz.correct ? '' : 'wrong'}" role="status">${selected === quiz.correct ? 'Corect. ' + quiz.explanation : 'Mai încearcă. ' + (quiz.hint || 'Reia cifrele și explicația de mai sus; urmărește toate costurile și datoriile.')}</p>` : ''}</div>`;
}
function iconLabel(id) { return id.startsWith('lesson') ? 'Verifică dacă ai înțeles' : 'Tu ce ai alege?'; }

function renderLearning() {
  const l = lessons[state.lesson];
  const correct = state.quiz[state.lesson] === l.correct || state.completed.includes(state.lesson);
  main.innerHTML = heading('BAZELE INVESTIȚIILOR IMOBILIARE', 'Mai întâi înțelegi. Apoi investești.', 'Un proiect fictiv, cinci pași și loc pentru toate întrebările tale.') +
    `<section class="hero" aria-label="Introducere în strategie"><div class="hero-copy"><span class="eyebrow">DE LA IDEE LA UN PLAN CLAR</span><h2>Un apartament.<br>Cinci decizii. <em>Tu la cârmă.</em></h2><p>Descoperă cum funcționează BRRRR și ce trebuie să calculezi la fiecare pas.</p><div class="hero-bottom"><a class="btn primary" href="#simulator">Explorează simulatorul ${icon('arrow')}</a><span class="subtle">În ritmul tău.</span></div></div>${houseArt}</section>` +
    `<div class="section-heading"><h2>Drumul tău prin BRRRR</h2><span><strong>${state.completed.length} din 5</strong> lecții parcurse</span></div><div class="steps" aria-label="Alege o lecție">${lessons.map((lesson, i) => `<button class="step ${state.lesson === i ? 'active' : ''} ${state.completed.includes(i) ? 'done' : ''}" data-lesson="${i}" aria-pressed="${state.lesson === i}" aria-label="Lecția ${i + 1}: ${lesson.title}${state.completed.includes(i) ? ', parcursă' : ''}"><div class="step-top"><span class="step-number">${state.completed.includes(i) ? '✓' : '0' + (i + 1)}</span><span class="step-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[lesson.icon]}</svg></span></div><strong>${lesson.english}</strong><small>${lesson.title}</small></button>`).join('')}</div>` +
    `<div class="learning-grid"><section class="card lesson-card"><div class="lesson-meta"><span class="tag">LECȚIA 0${state.lesson + 1} · ${l.title.toLocaleUpperCase('ro')}</span><span>Lectură + exercițiu · ${l.time}</span></div><h2>${l.heading}</h2><p>${l.body}</p><div class="takeaway">${icon('bulb')}<p>${l.takeaway}</p></div>${quizHtml('lesson-' + state.lesson, l, state.quiz[state.lesson])}<div class="lesson-footer"><small>${correct ? 'Ai înțeles ideea. Poți continua.' : 'Răspunde corect pentru a încheia lecția.'}</small><button class="btn primary" id="continue-lesson" ${correct ? '' : 'disabled'}>${state.lesson === 4 ? 'Aplică în simulator' : 'Lecția următoare'} ${icon('arrow')}</button></div></section><aside class="learning-aside"><div class="card study-card"><div class="study-top"><span class="eyebrow">CAZUL NOSTRU DE STUDIU</span><h3>Primul meu apartament</h3><p>Exemplu fictiv · cumpărat din bani proprii</p><div class="progress-track"><span style="width:${state.completed.length * 20}%"></span></div></div><div class="study-stats"><div class="stat-line"><span>Cumpărare</span><strong>60.000 €</strong></div><div class="stat-line"><span>Renovare + rezervă</span><strong>16.500 €</strong></div><div class="stat-line"><span>Alte costuri</span><strong>3.500 €</strong></div><div class="stat-line"><span>Investiție inițială</span><strong>80.000 €</strong></div><div class="stat-line"><span>Evaluare estimată după lucrări</span><strong>100.000 €</strong></div></div><div class="study-bottom"><span>La o finanțare ipotetică de 75%</span><strong>73.000 €</strong><small>Recuperați după costuri de refinanțare de 2.000 €. Rămâne o datorie de 75.000 €.</small><a href="#simulator" id="load-study">Deschide acest exemplu ${icon('arrow')}</a></div></div><div class="tip-card">${icon('shield')}<p><strong>Încearcă și tu</strong>${l.task}</p></div></aside></div>`;
}

const groups = [
  { title: 'Achiziție și renovare', fields: [
    ['purchase', 'Preț de cumpărare', 'money'], ['renovation', 'Buget de renovare', 'money'],
    ['contingency', 'Rezervă pentru lucrări', '%', 'Procent din bugetul renovării.'],
    ['otherCosts', 'Alte costuri ale proiectului', 'money', 'Achiziție, dobânzi și deținere până la refinanțare.'],
    ['initialDebt', 'Datoria înainte de refinanțare', 'money', 'Folosește 0 dacă ai plătit integral din bani proprii.', true],
  ] },
  { title: 'Evaluare și credit nou', fields: [
    ['arv', 'Valoare după renovare (ARV)', 'money'], ['ltv', 'Procent finanțat (LTV)', '%', 'Ipoteză de lucru; condițiile creditorului pot diferi.'],
    ['refiCosts', 'Costuri de refinanțare', 'money'], ['rate', 'Dobândă anuală fixă', '%'], ['years', 'Durata noului credit', 'ani'],
  ] },
  { title: 'Chirie și cheltuieli lunare', fields: [
    ['rent', 'Chirie lunară', 'money'], ['vacancy', 'Perioade fără chiriaș', '%', 'Pierdere medie din chiria potențială.'],
    ['maintenance', 'Rezervă pentru întreținere', '%', 'Din chiria potențială.'], ['capex', 'Rezervă pentru reparații mari', '%', 'Din chiria potențială.'],
    ['management', 'Administrare', '%', 'Din chiria rămasă după neocupare.'], ['taxes', 'Taxe pe proprietate / lună', 'money'], ['insurance', 'Asigurare / lună', 'money'],
  ] },
];
function fieldHtml([key, label, unit, hint, wide]) {
  const [min, max] = LIMITS[key];
  return `<div class="field ${wide ? 'wide' : ''}"><label for="input-${key}">${label}</label><div class="input-wrap"><input id="input-${key}" name="${key}" data-field="${key}" type="number" inputmode="decimal" min="${min}" max="${max}" step="any" value="${state.values[key]}" required ${hint ? `aria-describedby="hint-${key}"` : ''}><span class="input-unit">${unit === 'money' ? currency() : unit}</span></div>${hint ? `<small id="hint-${key}">${hint}</small>` : ''}</div>`;
}
function renderSimulator() {
  main.innerHTML = heading('LABORATORUL TĂU DE DECIZII', 'Cifrele îți spun o poveste.', 'Modifică ipotezele. Urmărește banii, datoria și rezultatul lunar.', `<div class="controls"><label class="sr-label" for="currency">Monedă</label><select id="currency" class="currency-select" aria-label="Monedă, fără conversie valutară">${Object.keys(currencies).map(c => `<option ${state.currency === c ? 'selected' : ''} value="${c}">${c} ${currencies[c]}</option>`).join('')}</select><button class="btn secondary" id="reset-simulator">Exemplul inițial</button><button class="btn secondary" id="export-scenario">${icon('download')} Export</button></div>`) +
    `<div class="sim-layout"><section class="card form-card"><h2>Construiește scenariul</h2><p class="form-caption">Valorile de pornire sunt fictive. Sumele folosesc aceeași monedă; schimbarea unității nu le convertește.</p><form id="calculator" novalidate>${groups.map((group, i) => `<fieldset class="field-group"><legend><span class="group-number">0${i + 1}</span>${group.title}</legend><div class="fields">${group.fields.map(fieldHtml).join('')}</div></fieldset>`).join('')}</form><div id="form-error" role="alert" class="form-error" hidden></div><div class="save-row"><input id="scenario-name" type="text" maxlength="60" placeholder="Numele scenariului" value="Primul meu apartament" aria-label="Numele scenariului"><button class="btn primary" id="save-scenario">Salvează scenariul</button></div><div id="saved-scenarios"></div></section><div class="results-column" id="results" aria-label="Rezultatele simulării"></div></div><section class="card stress-card"><div class="stress-header"><h2>Dacă lucrurile nu merg conform planului?</h2><p>Compară aceleași ipoteze cu câteva schimbări. Procentele sunt exerciții; nu reprezintă prognoze.</p></div><div class="table-scroll" id="stress-results"></div></section><p class="model-note">Flux estimat înainte de impozitul pe venit. Rata include principalul și dobânda. Rezervele de întreținere și reparații se calculează din chiria potențială, iar administrarea din chiria ajustată pentru neocupare. Taxele sunt introduse lunar. <button class="text-button" data-open-info>Vezi toate ipotezele ↗</button></p>`;
  renderSaved(); updateResults();
}

function stat(label, value, extraClass = '') { return `<div class="stat-line ${extraClass}"><span>${label}</span><strong>${value}</strong></div>`; }
function updateResults() {
  const r = calculate(state.values);
  const recoveredLabel = r.cashRecovered < 0 ? 'Aport necesar la refinanțare' : 'Bani recuperați în cont';
  const leftLabel = r.cashLeft < 0 ? 'Excedent față de banii inițiali' : 'Capital propriu nerecuperat';
  const warning = r.cashRecovered < 0 ? 'Creditul nou nu acoperă datoria veche și costurile. Ai nevoie de un aport suplimentar pentru închiderea refinanțării.' : r.cashflow < 0 ? 'În acest scenariu, chiria nu acoperă ieșirile medii lunare. Diferența trebuie plătită din alte venituri sau rezerve.' : 'Rezultatul depinde de chirie și de costurile introduse. Verifică și scenariile de mai jos înainte să tragi o concluzie.';
  document.querySelector('#results').innerHTML = `<section class="result-hero"><span class="eyebrow">REZULTATUL SIMULĂRII</span><h2>Flux lunar estimat</h2><div class="cashflow ${r.cashflow < 0 ? 'negative' : ''}">${r.cashflow > 0 ? '+' : ''}${money(r.cashflow)} <small>/ lună</small></div><p class="result-status"><i></i>${r.cashflow >= 0 ? 'După rată, cheltuieli și rezerve.' : 'Aport lunar necesar din alte surse.'}</p><div class="result-mini-grid"><div><span>${recoveredLabel}</span><strong>${money(Math.abs(r.cashRecovered))}</strong><small>După datoria veche și costuri</small></div><div><span>${leftLabel}</span><strong>${money(Math.abs(r.cashLeft))}</strong><small>${r.cashLeft < 0 ? 'Excedent finanțat prin credit' : 'Din capitalul inițial al proiectului'}</small></div><div><span>Datoria după refinanțare</span><strong>${money(r.newLoan)}</strong><small>Credit de rambursat</small></div><div><span>Valoare proprie în imobil</span><strong>${money(r.equity)}</strong><small>Valoare evaluată minus datorie</small></div></div></section><section class="card breakdown"><h3>Unde se duc banii lunar</h3>${stat('Chirie potențială', money(r.rent, 2))}${stat('Neocupare estimată', '−' + money(r.vacancyCost, 2))}${stat('Întreținere + reparații', '−' + money(r.maintenanceCost + r.capexCost, 2))}${stat('Administrare', '−' + money(r.managementCost, 2))}${stat('Taxe + asigurare', '−' + money(r.taxes + r.insurance, 2))}${stat('Rata noului credit', '−' + money(r.monthlyPayment, 2))}${stat('Rămâne înainte de impozit', money(r.cashflow, 2), 'total')}<div class="important-note" style="margin-top:15px">Chiria de echilibru în acest model: <strong>${r.breakEvenRent === null ? 'nu poate fi atinsă cu aceste procente' : money(r.breakEvenRent) + ' / lună'}</strong>.</div></section><section class="card breakdown"><h3>De la investiție la refinanțare</h3>${stat('Cost total al proiectului', money(r.totalCost))}${stat('Din care rezervă pentru lucrări', money(r.renovationReserve))}${stat('Bani proprii inițiali', money(r.initialCash))}${stat('Credit nou', money(r.newLoan))}${stat('Datorie veche de achitat', '−' + money(r.initialDebt))}${stat('Costuri de refinanțare', '−' + money(r.refiCosts))}${stat(r.cashRecovered < 0 ? 'Aport suplimentar necesar' : 'Disponibil în cont', money(Math.abs(r.cashRecovered)), 'total')}</section><div class="important-note ${r.cashflow < 0 || r.cashRecovered < 0 ? 'warning' : ''}"><strong>Ce îți arată calculul?</strong> ${warning}<br><br>Banii retrași prin refinanțare provin dintr-un credit. Valoarea proprie din imobil nu este numerar disponibil.</div>`;
  document.querySelector('#stress-results').innerHTML = `<table><thead><tr><th scope="col">Ce se schimbă</th><th scope="col">Capital nerecuperat*</th><th scope="col">Datorie nouă</th><th scope="col">Flux lunar</th></tr></thead><tbody>${stressScenarios(state.values).map(({ name, result: s }) => `<tr><td>${name}</td><td>${money(s.cashLeft)}</td><td>${money(s.newLoan)}</td><td class="${s.cashflow >= 0 ? 'positive' : 'negative'}">${s.cashflow >= 0 ? '+' : ''}${money(s.cashflow)}</td></tr>`).join('')}</tbody></table><p class="model-note" style="margin:12px 23px 18px">* O valoare negativă indică un excedent finanțat prin credit. La evaluare mai mică, noul credit și rata sunt recalculate; capitalul nerecuperat poate crește chiar dacă rata scade.</p>`;
}
function renderSaved() {
  document.querySelector('#saved-scenarios').innerHTML = state.saved.length ? `<div class="saved-row"><select id="saved-select" aria-label="Scenarii salvate"><option value="">Alege un scenariu salvat (${state.saved.length}/12)</option>${state.saved.map((s, i) => `<option value="${i}">${escapeHtml(s.name)} · ${s.currency}</option>`).join('')}</select><button class="text-button" id="load-saved">Încarcă</button><button class="text-button" id="delete-saved">Șterge</button></div>` : '<p class="form-caption">Scenariile salvate rămân în acest browser.</p>';
}

const challenges = [
  { icon: 'bank', title: 'Banii din cont', body: 'Ai investit 80.000 € din bani proprii. Noul credit este 75.000 €, iar refinanțarea costă 2.000 €.', question: 'Ce datorie ai după refinanțare?', answers: ['7.000 €', '73.000 €', '75.000 €'], correct: 2, explanation: 'Datoria este întregul credit nou: 75.000 €. Cei 73.000 € primiți și cei 7.000 € nerecuperați descriu altceva.', hint: 'Separă valoarea împrumutului de numerarul primit după costuri.' },
  { icon: 'chart', title: 'Chiria care păcălește', body: 'Chirie: 900 €. Pierdere medie din neocupare: 45 €. Alte cheltuieli și rezerve: 220 €. Rată: 570 €.', question: 'Cât rămâne lunar înainte de impozit?', answers: ['65 €', '330 €', '110 €'], correct: 0, explanation: '900 − 45 − 220 − 570 = 65 €. Chiria minus rata ar fi ascuns 265 € în alte ieșiri medii.', hint: 'Scade din chirie toate cele trei sume: neocuparea, cheltuielile și rata.' },
  { icon: 'shield', title: 'O evaluare mai mică', body: 'Te așteptai la o evaluare de 100.000 €. Evaluatorul stabilește 90.000 €. Finanțarea ipotetică rămâne 75%.', question: 'Care este noul împrumut?', answers: ['75.000 €', '67.500 €', '90.000 €'], correct: 1, explanation: '90.000 × 75% = 67.500 €. Diferența de 7.500 € față de plan lasă mai mult capital în proprietate.', hint: 'Aplică procentul de 75% asupra evaluării efective de 90.000 €.' },
];
function renderChallenges() {
  const score = challenges.filter((c, i) => state.challenges[i] === c.correct).length;
  main.innerHTML = heading('DIN TEORIE ÎN PRACTICĂ', 'Trei decizii. Ce ai învățat?', 'Exerciții scurte pentru greșelile care se ascund în spatele unor cifre frumoase.', `<span class="pill">${icon('spark')} ${score} / 3 rezolvate</span>`) +
    `<div class="challenges-grid">${challenges.map((c, i) => `<section class="card challenge-card"><span class="eyebrow">PROVOCAREA 0${i + 1}</span><div class="challenge-icon">${icon(c.icon)}</div><h2>${c.title}</h2><p>${c.body}</p>${quizHtml('challenge-' + i, c, state.challenges[i])}</section>`).join('')}</div><div class="challenge-banner"><div><strong>${score === 3 ? 'Ai separat corect costul, datoria și venitul.' : 'O greșeală aici este un pas înainte.'}</strong><p>${score === 3 ? 'Acum modifică un scenariu și explică-ți fiecare rezultat.' : 'Poți încerca din nou oricând. Explicația te ajută să vezi de ce.'}</p></div><a class="btn primary" href="#simulator">Aplică în simulator ${icon('arrow')}</a></div>`;
}

const glossary = [
  ['BRRRR', 'Strategia în cinci pași', 'Buy, Rehab, Rent, Refinance, Repeat: cumperi, renovezi, închiriezi, refinanțezi și analizezi dacă poți repeta.', 'Înțelege separat investiția, creditul și fluxul lunar.'],
  ['ARV', 'After-repair value', 'Valoarea estimată a proprietății după renovare. O estimare trebuie susținută de comparații relevante; nu este suma cheltuită pe proprietate.', 'În exemplul nostru: 100.000 €.'],
  ['LTV', 'Loan-to-value', 'Raportul dintre valoarea creditului și valoarea evaluată a imobilului. Procentul acceptat depinde de creditor, produs și situația ta.', 'Credit ipotetic = valoare evaluată × LTV.'],
  ['Capital propriu în imobil', 'Equity', 'Diferența dintre valoarea proprietății și datoria garantată cu ea. Este o valoare estimată, care nu se află automat în contul tău.', '100.000 € valoare − 75.000 € credit = 25.000 €.'],
  ['Bani recuperați', 'Numerar după refinanțare', 'Partea din noul credit rămasă după achitarea datoriei vechi și a costurilor de refinanțare. O valoare negativă indică un aport suplimentar necesar.', 'Credit nou − datorie veche − costuri de refinanțare.'],
  ['Capital nerecuperat', 'Bani proprii rămași în proiect', 'Partea din banii tăi inițiali pe care refinanțarea nu a adus-o înapoi în cont. Diferă de capitalul propriu din imobil.', 'Bani proprii inițiali − numerar din refinanțare.'],
  ['Flux de numerar', 'Cash flow', 'Banii rămași într-o perioadă după încasări, cheltuieli, rezerve și rate. În acest model rezultatul este calculat înainte de impozitul pe venit.', 'Chirie ajustată − cheltuieli și rezerve − rată.'],
  ['Neocupare', 'Vacancy', 'Perioadele fără chiriaș reduc chiria efectivă. În model folosim un procent din chiria potențială ca pierdere medie lunară.', 'La 850 € și 5%: pierdere medie 42,50 € / lună.'],
  ['Reparații mari', 'Rezervă pentru înlocuiri', 'O sumă pusă deoparte pentru lucrări sau înlocuiri costisitoare. În simulator este separată de întreținerea curentă și de rezerva renovării inițiale.', 'Acoperiș, instalații sau echipamente, în funcție de imobil.'],
  ['Chirie de echilibru', 'Pragul calculat de model', 'Chiria potențială la care fluxul lunar este zero, păstrând celelalte ipoteze. Dacă procentele consumă integral chiria, modelul nu are un prag realizabil.', 'Ține cont de neocupare, administrare, rezerve, taxe, asigurare și rată.'],
];
function stripAccents(text) { return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function glossaryEntries() {
  const filtered = glossary.filter(entry => stripAccents(entry.join(' ')).includes(stripAccents(state.search)));
  return filtered.length ? filtered.map(([term, english, definition, formula]) => `<article class="card glossary-entry"><h2>${term}<small>${english}</small></h2><p>${definition}</p><div class="formula">${formula}</div></article>`).join('') : '<p class="empty" role="status">Nu am găsit termenul. Încearcă „credit”, „chirie” sau „capital”.</p>';
}
function renderGlossary() {
  main.innerHTML = heading('CUVINTE CLARE, IDEI CLARE', 'Micul tău dicționar imobiliar.', 'Întoarce-te aici ori de câte ori un termen nou îți întrerupe firul gândului.', `<span class="pill">${icon('layers')} 10 concepte esențiale</span>`) + `<div class="glossary-intro"><label class="search">${icon('search')}<input id="glossary-search" type="search" placeholder="Caută un termen sau o explicație…" aria-label="Caută în glosar" value="${escapeHtml(state.search)}"></label><p>Poți căuta și fără diacritice.<br>De exemplu: „chirie” sau „refinantare”.</p></div><div class="glossary-grid" id="glossary-results">${glossaryEntries()}</div>`;
}

function route(focus = false) {
  const page = location.hash.slice(1);
  state.page = Object.hasOwn(pages, page) ? page : 'invata';
  document.querySelector('#breadcrumb-current').textContent = pages[state.page];
  document.title = `${pages[state.page]} — BRRRR Lab`;
  document.querySelectorAll('[data-page]').forEach(link => {
    const active = link.dataset.page === state.page;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  ({ invata: renderLearning, simulator: renderSimulator, provocari: renderChallenges, glosar: renderGlossary })[state.page]();
  if (focus) { main.focus({ preventScroll: true }); window.scrollTo({ top: 0 }); }
}

function validateForm() {
  const inputs = [...document.querySelectorAll('[data-field]')];
  let error = '';
  const values = {};
  for (const input of inputs) {
    const key = input.dataset.field;
    const n = input.valueAsNumber;
    const valid = Number.isFinite(n) && n >= LIMITS[key][0] && n <= LIMITS[key][1];
    input.setAttribute('aria-invalid', String(!valid));
    if (!valid && !error) error = `Completează „${document.querySelector(`label[for="${input.id}"]`).textContent}” cu o valoare între ${number(LIMITS[key][0])} și ${number(LIMITS[key][1])}. Rezultatele afișate păstrează ultimele valori valide.`;
    values[key] = n;
  }
  if (!error && calculate(values).invalidDebt) {
    error = 'Datoria veche depășește costul proiectului. Acest model simplificat presupune o datorie de cel mult costul total. Rezultatele păstrează ultimele valori valide.';
    document.querySelector('#input-initialDebt').setAttribute('aria-invalid', 'true');
  }
  const el = document.querySelector('#form-error'); el.hidden = !error; el.textContent = error;
  document.querySelector('#save-scenario').disabled = !!error;
  document.querySelector('#export-scenario').disabled = !!error;
  document.querySelector('#results').setAttribute('aria-label', error ? 'Rezultate pentru ultimele valori valide; corectează câmpurile marcate' : 'Rezultatele simulării');
  if (error) return false;
  state.values = values; persist(); return true;
}

main.addEventListener('input', event => {
  if (event.target.matches('[data-field]')) { if (validateForm()) updateResults(); }
  if (event.target.id === 'glossary-search') { state.search = event.target.value; document.querySelector('#glossary-results').innerHTML = glossaryEntries(); }
});
main.addEventListener('change', event => {
  if (event.target.id === 'currency') { state.currency = event.target.value; persist(); renderSimulator(); toast('Unitatea afișată a fost schimbată. Sumele nu au fost convertite.'); }
});
main.addEventListener('submit', event => event.preventDefault());
main.addEventListener('click', event => {
  const target = event.target.closest('button,a'); if (!target) return;
  if (target.hasAttribute('data-lesson')) { state.lesson = Number(target.dataset.lesson); persist(); renderLearning(); }
  if (target.hasAttribute('data-quiz')) {
    const [type, raw] = target.dataset.quiz.split('-'); const index = Number(raw); const answer = Number(target.dataset.answer);
    if (type === 'lesson') { state.quiz[index] = answer; renderLearning(); } else { state.challenges[index] = answer; renderChallenges(); }
    const selectedButton = document.querySelector(`[data-quiz="${target.dataset.quiz}"][data-answer="${answer}"]`);
    selectedButton?.focus({ preventScroll: true });
  }
  if (target.id === 'continue-lesson') {
    if (!state.completed.includes(state.lesson)) state.completed.push(state.lesson);
    if (state.lesson < 4) { state.lesson++; persist(); renderLearning(); document.querySelector('.lesson-card h2')?.scrollIntoView({ block: 'nearest' }); }
    else { persist(); location.hash = 'simulator'; toast('Cele cinci lecții sunt parcurse. Acum încearcă propriile cifre.'); }
  }
  if (target.id === 'load-study' || target.id === 'reset-simulator') { state.values = { ...DEFAULTS }; state.currency = 'EUR'; persist(); if (state.page === 'simulator') renderSimulator(); }
  if (target.id === 'save-scenario' && validateForm()) {
    const name = document.querySelector('#scenario-name').value.trim() || `Scenariul ${state.saved.length + 1}`;
    if (state.saved.length >= 12) { toast('Ai 12 scenarii salvate. Șterge unul înainte să adaugi altul.'); return; }
    state.saved.push({ name, currency: state.currency, values: { ...state.values } }); persist(); renderSaved();
    toast(storageAvailable ? 'Scenariul a fost salvat în acest browser.' : 'Scenariul este păstrat doar în această sesiune. Exportă-l pentru a păstra cifrele.');
  }
  if (target.id === 'load-saved' || target.id === 'delete-saved') {
    const raw = document.querySelector('#saved-select').value;
    if (raw === '') { toast('Alege întâi un scenariu din listă.'); return; }
    const index = Number(raw);
    if (target.id === 'delete-saved') { state.saved.splice(index, 1); persist(); renderSaved(); toast('Scenariul a fost șters.'); }
    else { const saved = state.saved[index]; state.values = { ...saved.values }; state.currency = saved.currency; persist(); renderSimulator(); document.querySelector('#scenario-name').value = saved.name; toast('Scenariul a fost încărcat.'); }
  }
  if (target.id === 'export-scenario' && validateForm()) {
    const blob = new Blob([JSON.stringify({ application: 'BRRRR Lab', version: 1, currency: state.currency, assumptions: state.values, results: calculate(state.values), note: 'Exemplu educativ, flux înainte de impozitul pe venit. Unitatea monetară nu implică o conversie valutară.' }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'brrrr-scenariu.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Scenariul a fost exportat ca fișier JSON.');
  }
  if (target.hasAttribute('data-open-info')) openInfo();
});
function openInfo() { document.querySelector('#info-dialog').showModal(); }
document.querySelector('#help-button').addEventListener('click', openInfo);
document.querySelector('#sources-button').addEventListener('click', openInfo);
document.querySelector('#close-dialog').addEventListener('click', () => document.querySelector('#info-dialog').close());
document.querySelector('#info-dialog').addEventListener('click', event => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) event.currentTarget.close(); } });
document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[el.dataset.icon]}</svg>`; });
window.addEventListener('hashchange', () => route(true));
persist(); route();
