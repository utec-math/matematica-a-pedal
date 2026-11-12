import { multiplicationExercises } from './multiplication-exercises.js?v=2';

export function compareNumericAnswer(raw, expected, integer = false) {
  const value = raw.trim().replaceAll('−', '-').replaceAll('⁄', '/');
  if (!value) return 'empty';
  const fraction = /^([+-]?\d+)(?:\s*\/\s*([+-]?\d+))?$/.exec(value);
  if (!fraction || (integer && fraction[2] !== undefined)) return 'format';

  const numerator = BigInt(fraction[1]);
  const denominator = BigInt(fraction[2] ?? '1');
  if (denominator === 0n) return 'zero-denominator';
  const [targetNumerator, targetDenominator = 1n] = expected.split('/').map(part => BigInt(part));
  return numerator * targetDenominator === targetNumerator * denominator ? 'correct' : 'incorrect';
}

function describeAnswer(exercise, values) {
  for (const [index, field] of exercise.fields.entries()) {
    const result = compareNumericAnswer(values[index] ?? '', field.expected, field.integer);
    if (result === 'empty') {
      return { message: 'Completá «' + field.label + '» para comprobar.' };
    }
    if (result === 'format') {
      const format = field.integer ? 'un número entero' : 'un entero o una fracción como 2/3';
      return { message: 'Escribí ' + format + ' en «' + field.label + '».' };
    }
    if (result === 'zero-denominator') {
      return { message: 'En «' + field.label + '», el denominador tiene que ser distinto de cero.' };
    }
    if (result === 'incorrect') {
      return { message: 'Revisá «' + field.label + '». ' + exercise.retry };
    }
  }
  return { correct: true, message: 'Correcto. ' + exercise.solution };
}

function renderExpression(target, expression) {
  if (typeof expression === 'string') {
    target.textContent = expression;
    return;
  }
  const mathElement = tag => document.createElementNS('http://www.w3.org/1998/Math/MathML', tag);
  const math = mathElement('math');
  const spoken = [];
  for (const part of expression) {
    if (typeof part === 'string') {
      const value = part.trim();
      const token = mathElement(/^[×÷·−+]$/.test(value) ? 'mo' : 'mtext');
      token.textContent = value;
      math.append(token);
      spoken.push(value);
      continue;
    }
    const fraction = mathElement('mfrac');
    for (const value of part) {
      const text = mathElement('mtext');
      text.textContent = value;
      fraction.append(text);
    }
    spoken.push('(' + part[0] + ') sobre (' + part[1] + ')');
    math.append(fraction);
  }
  math.setAttribute('aria-label', spoken.join(' '));
  target.replaceChildren(math);
}

function showFeedback(target, result) {
  target.textContent = result?.message ?? '';
  if (result) target.dataset.state = result.correct ? 'correct' : 'retry';
  else delete target.dataset.state;
}

function mountPractice(root) {
  const find = name => root.querySelector('[data-' + name + ']');
  const buttons = [...root.querySelectorAll('[data-topic]')];
  const stepForm = find('step-form');
  const answerForm = find('answer-form');
  const stepFeedback = find('step-feedback');
  const answerFeedback = find('answer-feedback');
  const position = find('position');
  const previous = find('previous');
  const next = find('next');

  const progress = Object.fromEntries(Object.entries(multiplicationExercises).map(([topic, exercises]) => [
    topic, {
      index: 0,
      attempts: exercises.map(() => ({ choice: null, stepChecked: false, values: [], answerChecked: false }))
    }
  ]));
  let topic = 'signos';

  function current() {
    const { index, attempts } = progress[topic];
    return { exercise: multiplicationExercises[topic][index], attempt: attempts[index], index };
  }

  function updateFeedback() {
    const { exercise, attempt } = current();
    const choice = exercise.choices[attempt.choice];
    const correctStep = Boolean(attempt.stepChecked && choice?.correct);
    const stepResult = attempt.stepChecked
      ? { correct: correctStep, message: choice?.feedback ?? 'Elegí una opción para comprobar este paso.' }
      : null;
    showFeedback(stepFeedback, stepResult);
    answerForm.hidden = !correctStep;
    const answerResult = correctStep && attempt.answerChecked ? describeAnswer(exercise, attempt.values) : null;
    showFeedback(answerFeedback, answerResult);
  }

  function render() {
    const { exercise, attempt, index } = current();
    const total = multiplicationExercises[topic].length;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.topic === topic)));
    position.textContent = 'Ejercicio ' + (index + 1) + ' de ' + total;
    renderExpression(find('expression'), exercise.expression);
    find('question').textContent = '1. ' + exercise.question;
    find('step-submit').textContent = topic === 'signos' ? 'Comprobar el signo' : 'Comprobar el paso';
    find('hint').textContent = exercise.hint;
    find('hint-details').open = false;
    find('solution').textContent = exercise.solution;
    find('solution-details').open = false;

    const choices = exercise.choices.map((choice, choiceIndex) => {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'primer-paso';
      radio.value = String(choiceIndex);
      radio.checked = choiceIndex === attempt.choice;
      label.append(radio, choice.label);
      return label;
    });
    find('options').replaceChildren(...choices);

    find('result-prompt').textContent = '2. ' + exercise.resultPrompt;
    const fields = exercise.fields.map((field, fieldIndex) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'text';
      input.name = 'resultado';
      input.autocomplete = 'off';
      input.maxLength = 24;
      input.spellcheck = false;
      input.placeholder = field.integer ? '' : 'a/b';
      input.value = attempt.values[fieldIndex] ?? '';
      label.append(field.label, input);
      return label;
    });
    find('fields').replaceChildren(...fields);

    previous.disabled = index === 0;
    next.disabled = index === total - 1;
    updateFeedback();
  }

  buttons.forEach(button => button.addEventListener('click', () => {
    if (topic === button.dataset.topic) return;
    topic = button.dataset.topic;
    render();
  }));

  stepForm.addEventListener('change', event => {
    const { attempt } = current();
    attempt.choice = Number(event.target.value);
    attempt.stepChecked = false;
    attempt.answerChecked = false;
    updateFeedback();
  });

  stepForm.addEventListener('submit', event => {
    event.preventDefault();
    current().attempt.stepChecked = true;
    updateFeedback();
  });

  function collectAnswers() {
    return [...answerForm.querySelectorAll('input')].map(input => input.value);
  }

  answerForm.addEventListener('input', () => {
    const { attempt } = current();
    attempt.values = collectAnswers();
    attempt.answerChecked = false;
    showFeedback(answerFeedback, null);
  });

  answerForm.addEventListener('submit', event => {
    event.preventDefault();
    const { attempt } = current();
    attempt.values = collectAnswers();
    attempt.answerChecked = true;
    updateFeedback();
  });

  function move(delta) {
    progress[topic].index += delta;
    render();
    position.focus();
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  render();
}

if (typeof document !== 'undefined') {
  const practice = document.getElementById('practica-multiplicacion');
  if (practice) {
    mountPractice(practice);
    practice.hidden = false;
    document.getElementById('multiplication-practice-fallback').hidden = true;
  }
}
