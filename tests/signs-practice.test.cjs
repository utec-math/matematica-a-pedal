const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const modulePromise = import(pathToFileURL(path.join(__dirname, '../assets/signs-practice.js')).href);

test('acepta enteros con signo, espacios exteriores y el signo menos matemático', async () => {
  const { parseInteger } = await modulePromise;
  for (const [text, value] of [['−2', -2], ['-9', -9], [' +7 ', 7], ['0', 0], ['  12  ', 12]]) {
    assert.equal(parseInteger(text), value);
  }
});

test('no confunde entradas vacías, expresiones o texto parcial con una respuesta entera', async () => {
  const { parseInteger } = await modulePromise;
  for (const text of ['', ' ', '2abc', '2.5', '2,5', '-6+4', '3/1', '0x10', '1e3', 'Infinity', '++2', '9007199254740992']) {
    assert.equal(parseInteger(text), null, text);
  }
});

test('cada ejercicio tiene una sola transformación válida y un resultado matemático correcto', async () => {
  const { exercises } = await modulePromise;
  const values = [
    [-6 + 4, -6 - 4, 6 + 4],
    [-7 + 2, 7 + (-2), -7 + (-2)],
    [5 + 5, -5 + 5, -5 - 5],
    [5 - 2 + 4, 5 - 2 - 4, -5 - 2 + 4]
  ];
  const answers = [-6 - (-4), -7 - 2, -5 - (-5), 5 - (2 - 4)];
  assert.equal(exercises.length, 4);
  exercises.forEach((exercise, i) => {
    assert.equal(exercise.answer, answers[i]);
    assert.equal(exercise.choices.filter(c => c.correct).length, 1);
    exercise.choices.forEach((choice, j) => {
      assert.equal(Boolean(choice.correct), values[i][j] === answers[i]);
      if (!choice.correct) assert.ok(choice.feedback.length > 40);
    });
  });
});

test('exige resolver la transformación antes de comprobar el resultado o avanzar', async () => {
  const { createSession } = await modulePromise;
  const session = createSession();
  assert.equal(session.submitAnswer('-2').ignored, true);
  assert.equal(session.next(), false);
  assert.equal(session.submitTransformation(-1).correct, false);
  assert.equal(session.submitTransformation(1).correct, false);
  assert.equal(session.getState().phase, 'transform');
  assert.equal(session.getState().completed, 0);
  assert.equal(session.submitTransformation(0).correct, true);
  assert.equal(session.getState().phase, 'answer');
  assert.equal(session.next(), false);
});

test('permite reintentar y explica el error de signo sin completar el ejercicio', async () => {
  const { createSession } = await modulePromise;
  const session = createSession();
  session.submitTransformation(0);
  assert.equal(session.submitAnswer(' ').invalid, true);
  const wrong = session.submitAnswer('2');
  assert.equal(wrong.correct, false);
  assert.match(wrong.feedback, /negativo/);
  assert.equal(session.getState().completed, 0);
  assert.equal(session.submitAnswer('−2').correct, true);
  assert.equal(session.getState().completed, 1);
});

test('un doble envío no duplica completados y no permite saltar ejercicios', async () => {
  const { createSession } = await modulePromise;
  const session = createSession();
  session.submitTransformation(0);
  assert.equal(session.submitTransformation(2).ignored, true);
  session.submitAnswer('-2');
  assert.equal(session.submitAnswer('-2').ignored, true);
  assert.equal(session.getState().completed, 1);
  assert.equal(session.next(), true);
  assert.equal(session.next(), false);
  assert.equal(session.getState().index, 1);
});

test('completa los cuatro ejercicios y vuelve a empezar sin conservar respuestas anteriores', async () => {
  const { createSession, exercises } = await modulePromise;
  const session = createSession();
  exercises.forEach((exercise, i) => {
    session.submitTransformation(exercise.choices.findIndex(c => c.correct));
    assert.equal(session.submitAnswer(String(exercise.answer)).correct, true);
    assert.equal(session.getState().completed, i + 1);
    assert.equal(session.next(), i < exercises.length - 1);
  });
  assert.deepEqual(session.getState(), { index: 3, phase: 'complete', completed: 4, total: 4 });
  session.reset();
  assert.deepEqual(session.getState(), { index: 0, phase: 'transform', completed: 0, total: 4 });
});
