export const exercises = [
  {
    title: 'Restar un número negativo', expression: '−6 − (−4)',
    question: '1. Transformá la resta en suma del opuesto.',
    choices: [
      { text: '−6 + 4', correct: true },
      { text: '−6 − 4', feedback: 'Revisá el segundo número: estás restando −4. Su opuesto es +4, así que la transformación es −6 + 4. Volvé a elegir.' },
      { text: '6 + 4', feedback: 'El primer número sigue siendo −6. Solo reemplazamos la resta de −4 por la suma de su opuesto, +4. Volvé a elegir.' }
    ],
    transformHint: 'Identificá el número que se resta, −4, y buscá su opuesto. El primer número no cambia.',
    answerHint: 'En −6 + 4 los signos son distintos. Compará los valores absolutos 6 y 4 para decidir el signo.',
    answer: -2,
    answerFeedback: { '2': 'La diferencia entre los valores absolutos es 6 − 4 = 2. El mayor valor absoluto corresponde a −6: el resultado lleva signo negativo. Revisá tu respuesta.' },
    retry: 'En −6 + 4 los signos son distintos: restá los valores absolutos, 6 − 4, y conservá el signo de −6, que tiene mayor valor absoluto.',
    solution: '−6 − (−4) = −6 + 4 = −2. Restamos 6 − 4 = 2 y conservamos el signo negativo.'
  },
  {
    title: 'Sumar dos números negativos', expression: '−7 − 2',
    question: '1. Transformá la resta en suma del opuesto.',
    choices: [
      { text: '−7 + 2', feedback: 'Estás restando +2, cuyo opuesto es −2. Sumá −2 y conservá el primer número, −7.' },
      { text: '7 + (−2)', feedback: 'El −7 inicial no cambia de signo. La resta de 2 se transforma en suma de −2.' },
      { text: '−7 + (−2)', correct: true }
    ],
    transformHint: 'Restar 2 equivale a sumar −2. Escribí esa suma sin cambiar el −7 inicial.',
    answerHint: 'Ahora los dos sumandos son negativos. Sumá sus valores absolutos y conservá el signo negativo.',
    answer: -9,
    answerFeedback: { '-5': 'En −7 + (−2) los signos son iguales: los valores absolutos se suman, no se restan. Calculá 7 + 2 y conservá el signo negativo.', '9': '7 + 2 = 9, pero ambos sumandos son negativos. El resultado también debe llevar signo negativo.' },
    retry: 'Tenés una suma de dos negativos: sumá 7 + 2 y conservá el signo negativo. Probá otra vez.',
    solution: '−7 − 2 = −7 + (−2) = −9. Sumamos 7 + 2 = 9 y conservamos el signo negativo.'
  },
  {
    title: 'Reconocer números opuestos', expression: '−5 − (−5)',
    question: '1. Transformá la resta en suma del opuesto.',
    choices: [
      { text: '5 + 5', feedback: 'El primer −5 no cambia. Solo el segundo −5, que es el número que restamos, se reemplaza por su opuesto al transformar la resta en suma.' },
      { text: '−5 + 5', correct: true },
      { text: '−5 − 5', feedback: 'Restar −5 equivale a sumar +5. La transformación correcta conserva el primer −5 y suma el opuesto del segundo.' }
    ],
    transformHint: 'Restar −5 es sumar +5. ¿Qué ocurre al sumar un número y su opuesto?',
    answerHint: '−5 y +5 tienen el mismo valor absoluto y signos opuestos: se anulan entre sí.',
    answer: 0, answerFeedback: {},
    retry: 'En −5 + 5 los valores absolutos son iguales y los signos opuestos. Un número más su opuesto da cero.',
    solution: '−5 − (−5) = −5 + 5 = 0. La suma de un número y su opuesto es cero.'
  },
  {
    title: 'Cambiar todos los signos del paréntesis', expression: '5 − (2 − 4)',
    question: '1. Elegí la expresión equivalente sin paréntesis.',
    choices: [
      { text: '5 − 2 + 4', correct: true },
      { text: '5 − 2 − 4', feedback: 'El signo − delante del paréntesis cambia los dos signos internos: +2 pasa a −2 y −4 pasa a +4. Revisá especialmente el último término.' },
      { text: '−5 − 2 + 4', feedback: 'El 5 está fuera del paréntesis y no cambia. El signo − modifica solo los signos de los términos que estaban dentro.' }
    ],
    transformHint: 'El 5 inicial queda igual. Dentro del paréntesis, +2 pasa a −2 y −4 pasa a +4.',
    answerHint: 'Calculá de izquierda a derecha: primero 5 − 2. Al resultado sumale 4.',
    answer: 7,
    answerFeedback: { '-1': 'Ese resultado aparece al calcular 5 − 2 − 4. El último término es +4. Calculá 5 − 2 = 3 y después sumá 4.' },
    retry: 'La expresión correcta es 5 − 2 + 4. Primero 5 − 2 = 3; luego sumá 4 a ese resultado.',
    solution: '5 − (2 − 4) = 5 − 2 + 4 = 3 + 4 = 7. Cambiamos todos los signos internos y después calculamos.'
  }
];

// No usamos parseInt ni evaluamos expresiones: una respuesta debe ser un entero completo.
export function parseInteger(raw) {
  const value = String(raw).trim().replace(/−/g, '-');
  if (!/^[+-]?\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

export function createSession() {
  let index = 0;
  let phase = 'transform';
  let completed = 0;
  return {
    getState: () => ({ index, phase, completed, total: exercises.length }),
    submitTransformation(choiceIndex) {
      if (phase !== 'transform') return { ignored: true };
      const choice = exercises[index].choices[choiceIndex];
      if (!choice) return { correct: false, feedback: 'Elegí una transformación antes de comprobar.' };
      if (!choice.correct) return { correct: false, feedback: choice.feedback };
      phase = 'answer';
      return { correct: true, feedback: `✓ Transformación correcta: ${choice.text}. Ahora calculá el resultado.` };
    },
    submitAnswer(raw) {
      if (phase !== 'answer') return { ignored: true };
      const answer = parseInteger(raw);
      if (answer === null) return { correct: false, invalid: true, feedback: 'Escribí un número entero, por ejemplo −3, 0 o 4. Después volvé a comprobar.' };
      const exercise = exercises[index];
      if (answer !== exercise.answer) return { correct: false, feedback: exercise.answerFeedback[answer] || exercise.retry };
      completed += 1;
      phase = 'complete';
      return { correct: true, feedback: '✓ Resultado correcto. Revisá cómo queda la cuenta completa.' };
    },
    next() {
      if (phase !== 'complete' || index === exercises.length - 1) return false;
      index += 1;
      phase = 'transform';
      return true;
    },
    reset() { index = 0; phase = 'transform'; completed = 0; }
  };
}

export function mountPractice(root) {
  const session = createSession();
  const find = name => root.querySelector(`[data-signs-${name}]`);
  const form = find('transform-form');
  const answerForm = find('answer-form');
  const resultInput = answerForm.querySelector('input');
  const options = find('options');
  const nextButton = find('next');
  const hint = find('hint');
  const feedback = (name, result) => {
    const area = find(name);
    area.textContent = result.feedback;
    area.dataset.state = result.correct ? 'correct' : 'retry';
    area.hidden = false;
  };
  const updateProgress = () => {
    const state = session.getState();
    find('progress').textContent = `Ejercicio ${state.index + 1} de ${state.total} · Completados: ${state.completed} de ${state.total}`;
  };
  function render() {
    const exercise = exercises[session.getState().index];
    find('title').textContent = exercise.title;
    find('expression').textContent = exercise.expression;
    find('question').textContent = exercise.question;
    options.replaceChildren();
    exercise.choices.forEach((choice, index) => {
      const label = document.createElement('label');
      label.className = 'map-signs-option';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'signs-transform';
      radio.value = String(index);
      const text = document.createElement('span');
      text.textContent = choice.text;
      label.append(radio, text);
      options.append(label);
    });
    find('check-transform').disabled = false;
    find('check-answer').disabled = false;
    resultInput.disabled = false;
    resultInput.value = '';
    resultInput.removeAttribute('aria-invalid');
    for (const name of ['transform-feedback', 'answer-feedback', 'solution', 'summary']) {
      find(name).hidden = true;
      if (name !== 'summary') find(name).textContent = '';
    }
    answerForm.hidden = true;
    nextButton.hidden = true;
    hint.hidden = false;
    hint.open = false;
    find('hint-text').textContent = exercise.transformHint;
    updateProgress();
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const checked = options.querySelector('input:checked');
    const result = session.submitTransformation(checked ? Number(checked.value) : -1);
    if (result.ignored) return;
    feedback('transform-feedback', result);
    if (!result.correct) return;
    for (const radio of options.querySelectorAll('input')) radio.disabled = true;
    find('check-transform').disabled = true;
    const exercise = exercises[session.getState().index];
    find('equivalent').textContent = exercise.choices.find(choice => choice.correct).text;
    answerForm.hidden = false;
    hint.open = false;
    find('hint-text').textContent = exercise.answerHint;
    resultInput.focus();
  });
  answerForm.addEventListener('submit', event => {
    event.preventDefault();
    const result = session.submitAnswer(resultInput.value);
    if (result.ignored) return;
    feedback('answer-feedback', result);
    resultInput.setAttribute('aria-invalid', result.correct ? 'false' : 'true');
    if (!result.correct) return;
    resultInput.disabled = true;
    find('check-answer').disabled = true;
    find('solution').textContent = exercises[session.getState().index].solution;
    find('solution').hidden = false;
    hint.hidden = true;
    updateProgress();
    const state = session.getState();
    if (state.completed === state.total) find('summary').hidden = false;
    else nextButton.hidden = false;
  });
  nextButton.addEventListener('click', () => {
    if (!session.next()) return;
    render();
    options.querySelector('input').focus();
  });
  find('restart').addEventListener('click', () => {
    session.reset();
    render();
    options.querySelector('input').focus();
  });
  render();
  find('interactive').hidden = false;
}

if (typeof document !== 'undefined') {
  const root = document.getElementById('practica-signos');
  if (root) mountPractice(root);
}
