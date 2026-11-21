import {topics,unitBase,reviewTopics,questionReviewTopics,questions} from './autodiagnostico-catalog.mjs';
import {createReportStore,waitForMAP} from './report-account-store.mjs';
(function () {
const byId = id => document.getElementById(id);
const letters = 'abcd';
const answers = Array(questions.length).fill(null);
const routeButtons = [];
let position = 0;
let owner=null,epoch=0,map=null,store=null,ready=false,saveVersion=0;
const saveStatus=document.createElement('p');saveStatus.setAttribute('role','status');saveStatus.id='diagnostic-save-status';
byId('autodiag-home').querySelector('.hero').after(saveStatus);
function enableQuiz(value){ready=value;byId('autodiag-home').querySelectorAll('button,input').forEach(el=>el.disabled=!value);if(value)byId('previous').disabled=position===0}
function persist(){
  const uid=owner,version=epoch,request=++saveVersion;
  if(!uid||!ready)return;
  if(map.auth.currentUser?.uid!==uid){bindAccount(map.auth.currentUser,true);return}
  saveStatus.textContent='Guardando tu autodiagnóstico…';
  store.save('diagnostic',{answers:[...answers]},uid).then(()=>{
    if(version===epoch&&request===saveVersion)saveStatus.textContent='Autodiagnóstico guardado en tu cuenta.';
  }).catch(()=>{if(version===epoch&&request===saveVersion)saveStatus.textContent='No se pudo confirmar el guardado. Podés seguir; volvé a intentarlo cuando tengas conexión.'});
}
async function bindAccount(user,force=false){
  if(!force&&ready&&owner===user?.uid)return;
  const version=++epoch;owner=user?.uid||null;enableQuiz(false);answers.fill(null);showQuestion(0,false);
  if(!owner){enableQuiz(true);saveStatus.textContent='Podés resolver el autodiagnóstico. Sin una sesión activa no se guardan los resultados.';return}
  saveStatus.textContent='Cargando el autodiagnóstico de esta cuenta…';
  try{
    const state=await store.load('diagnostic',owner);
    if(version!==epoch)return;
    if(state.record)answers.splice(0,answers.length,...state.record.answers);
    showQuestion(0,false);enableQuiz(true);
    saveStatus.textContent=state.offline?'Mostrando el registro de esta cuenta en este navegador. Falta confirmar la sincronización.':state.record?'Retomaste el autodiagnóstico guardado en esta cuenta.':'Tus respuestas se guardarán en esta cuenta.';
  }catch(error){if(version===epoch){enableQuiz(true);saveStatus.textContent=error.message}}
}

function answerStatus(question, answer) {
  if (answer === null) return 'pending';
  if (answer === 'unknown') return 'unknown';
  return answer === question.answer ? 'correct' : 'incorrect';
}

function summarize(currentAnswers) {
  const totals = {correct: 0, incorrect: 0, unknown: 0, pending: 0};
  const blocks = topics.map(() => ({correct: 0, incorrect: 0, unknown: 0, pending: 0}));
  questions.forEach((question, index) => {
    const status = answerStatus(question, currentAnswers[index]);
    totals[status]++;
    blocks[Math.floor(index / 4)][status]++;
  });
  return {totals, blocks};
}

function suggestReviews(currentAnswers) {
  const review = new Map();
  currentAnswers.forEach((answer, index) => {
    const status = answerStatus(questions[index], answer);
    if (status !== 'incorrect' && status !== 'unknown') return;
    const topic = questionReviewTopics[index];
    if (!review.has(topic)) review.set(topic, {incorrect: 0, unknown: 0});
    review.get(topic)[status]++;
  });
  return [...review].sort(([, a], [, b]) => (b.incorrect + b.unknown) - (a.incorrect + a.unknown));
}

function reviewLinks(entries) {
  return '<ul class="reco-list">' + entries.map(([key, signals]) => {
    const [name, path, tip] = reviewTopics[key];
    const reasons = [];
    if (signals.incorrect) reasons.push(signals.incorrect === 1 ? '1 respuesta para revisar' : signals.incorrect + ' respuestas para revisar');
    if (signals.unknown) reasons.push(signals.unknown + ' «No sé»');
    return '<li><a href="' + unitBase + path + '" target="_blank" rel="noopener">' + name +
      '</a><p>' + reasons.join(' · ') + '</p>' + (tip ? '<p>' + tip + '</p>' : '') + '</li>';
  }).join('') + '</ul>';
}

function refreshProgress() {
  const count = answers.filter(answer => answer !== null).length;
  byId('progress-bar').value = count;
  byId('progress-text').textContent = count + ' de ' + questions.length;
  routeButtons.forEach((button, index) => {
    const status = answers[index] === null ? 'pendiente' : answers[index] === 'unknown' ? 'no-sabe' : 'respondida';
    button.dataset.status = status;
    button.setAttribute('aria-label', 'Pregunta ' + (index + 1) + ', ' + (status === 'no-sabe' ? 'No sé' : status));
    if (index === position && !byId('quiz-panel').hidden) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
}

function showQuestion(index, focus = true) {
  index=Math.max(0,Math.min(questions.length-1,index));position = index;
  byId('results-panel').hidden = true;
  byId('quiz-panel').hidden = false;
  byId('finish-notice').hidden = true;
  const question = questions[index];
  byId('topic').textContent = topics[Math.floor(index / 4)];
  byId('position').textContent = 'Pregunta ' + (index + 1) + ' de ' + questions.length;
  byId('question-title').innerHTML = question.prompt;
  byId('options').innerHTML = '';
  const values = [...letters, 'unknown'];
  values.forEach((value, choice) => {
    const label = document.createElement('label');
    label.className = value === 'unknown' ? 'option skip' : 'option';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'answer';
    radio.value = value;
    radio.checked = answers[index] === value;
    radio.addEventListener('change', () => {
      answers[index] = value;
      persist();
      byId('finish-notice').hidden = true;
      refreshProgress();
    });
    const text = document.createElement('span');
    text.innerHTML = value === 'unknown' ? 'No sé' : question.options[choice];
    label.append(radio, text);
    byId('options').append(label);
  });
  byId('previous').disabled = index === 0;
  byId('next').textContent = index === questions.length - 1 ? 'Ver resultados' : 'Siguiente →';
  byId('results-early').hidden = index === questions.length - 1;
  refreshProgress();
  if (focus) byId('question-title').focus();
}

function requestResults() {
  const pending = answers.filter(answer => answer === null).length;
  if (!pending) {
    showResults();
    return;
  }
  byId('pending-text').textContent = pending === 1 ? 'Queda una pregunta pendiente.' : 'Quedan ' + pending + ' preguntas pendientes.';
  byId('finish-notice').hidden = false;
  byId('pending-text').focus();
}

function showResults() {
  byId('quiz-panel').hidden = true;
  byId('results-panel').hidden = false;
  byId('review').hidden = true;
  byId('review-button').setAttribute('aria-expanded', 'false');
  const {totals, blocks} = summarize(answers);
  const labels = {correct: 'Correctas', incorrect: 'Para revisar', unknown: 'No sé', pending: 'Sin responder'};
  byId('stats').innerHTML = Object.keys(labels).map(status =>
    '<div class="stat"><b>' + totals[status] + '</b><span>' + labels[status] + '</span></div>'
  ).join('');

  const suggestions = suggestReviews(answers);
  const recommendation = byId('recommendation');

  if (suggestions.length) {
    const remaining = suggestions.slice(3);
    recommendation.innerHTML = '<h3>Por dónde seguir</h3>' + reviewLinks(suggestions.slice(0, 3)) +
      (remaining.length ? '<details><summary>Otros temas para repasar</summary>' + reviewLinks(remaining) + '</details>' : '');
  } else {
    recommendation.textContent = totals.pending === questions.length ? 'Respondé algunas preguntas para recibir una sugerencia.' :
      totals.pending > 0 ? 'Podés completar las preguntas pendientes para revisar los otros temas.' :
      'Resolviste las 20 preguntas. Podés seguir con tu ruta de Matemática a Pedal.';
  }

  byId('topics-result').innerHTML = topics.map((topic, index) => {
    const block = blocks[index];
    return '<div class="topic-result"><h3>' + topic + '</h3><p>' + block.correct +
      ' de 4 correctas · ' + block.incorrect + ' para revisar · ' + block.unknown +
      ' «No sé» · ' + block.pending + ' sin responder</p></div>';
  }).join('');

  byId('review').innerHTML = questions.map((question, index) => {
    const answer = answers[index];
    const status = answerStatus(question, answer);
    const statusText = {correct: 'Correcta', incorrect: 'Para revisar', unknown: 'No sé', pending: 'Sin responder'};
    const chosen = letters.includes(answer ?? 'unknown') ? question.options[letters.indexOf(answer)] : '';
    return '<details><summary>Pregunta ' + (index + 1) + ' · ' + statusText[status] +
      '</summary><p>' + question.prompt + '</p>' +
      (chosen && status === 'incorrect' ? '<p class="incorrect">Tu respuesta ' + chosen + '</p>' : '') +
      '<p class="correct">Respuesta correcta ' + question.options[letters.indexOf(question.answer)] + '</p></details>';
  }).join('');
  refreshProgress();
  byId('results-title').focus();
}

topics.forEach((topic, blockIndex) => {
  const group = document.createElement('div');
  group.className = 'group';
  const name = document.createElement('span');
  name.className = 'group-name';
  name.textContent = topic;
  const stops = document.createElement('div');
  stops.className = 'stops';
  questions.slice(blockIndex * 4, blockIndex * 4 + 4).forEach((_, item) => {
    const index = blockIndex * 4 + item;
    const button = document.createElement('button');
    button.className = 'stop';
    button.textContent = index + 1;
    button.addEventListener('click', () => showQuestion(index));
    stops.append(button);
    routeButtons.push(button);
  });
  group.append(name, stops);
  byId('groups').append(group);
});

byId('previous').addEventListener('click', () => showQuestion(position - 1));
byId('next').addEventListener('click', () => position === questions.length - 1 ? requestResults() : showQuestion(position + 1));
byId('results-early').addEventListener('click', requestResults);
byId('go-pending').addEventListener('click', () => showQuestion(answers.indexOf(null)));
byId('finish-anyway').addEventListener('click', showResults);
byId('resume').addEventListener('click', () => showQuestion(position));
byId('print').addEventListener('click', () => window.print());
byId('reset').addEventListener('click', () => {
  if (!window.confirm('¿Empezar de nuevo y borrar tus respuestas de esta prueba?')) return;
  answers.fill(null);
  persist();
  showQuestion(0);
});
byId('review-button').addEventListener('click', () => {
  const review = byId('review');
  review.hidden = !review.hidden;
  byId('review-button').setAttribute('aria-expanded', String(!review.hidden));
  if (!review.hidden) review.querySelector('summary')?.focus();
});

showQuestion(0, false);enableQuiz(false);
waitForMAP().then(value=>{
  map=value;store=createReportStore(map);map.onAuthStateChanged(map.auth,user=>bindAccount(user));
  window.addEventListener('map:account-ready',()=>bindAccount(map.auth.currentUser,true));
}).catch(()=>{enableQuiz(true);saveStatus.textContent='Podés resolver el autodiagnóstico, pero ahora no se pudo preparar el guardado de resultados.'});
})();
