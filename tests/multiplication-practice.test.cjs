const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

const practice = import(pathToFileURL(path.join(__dirname, '../assets/multiplication-practice.js')).href);

test('acepta fracciones equivalentes exactas y el signo menos matemático', async () => {
  const { compareNumericAnswer } = await practice;
  assert.equal(compareNumericAnswer('18/60', '3/10'), 'correct');
  assert.equal(compareNumericAnswer(' −2 / 12 ', '-1/6'), 'correct');
  assert.equal(compareNumericAnswer('15/-6', '-5/2'), 'correct');
  assert.equal(compareNumericAnswer('6/2', '3'), 'correct');
  assert.equal(compareNumericAnswer('+4', '4', true), 'correct');
  assert.equal(compareNumericAnswer('−24', '-24', true), 'correct');
});

test('distingue un cálculo incorrecto de una entrada inválida', async () => {
  const { compareNumericAnswer } = await practice;
  assert.equal(compareNumericAnswer('3/5', '3/10'), 'incorrect');
  assert.equal(compareNumericAnswer('3/0', '3/10'), 'zero-denominator');
  assert.equal(compareNumericAnswer('3/10 + 0', '3/10'), 'format');
  assert.equal(compareNumericAnswer('8/2', '4', true), 'format');
  assert.equal(compareNumericAnswer(' ', '3/10'), 'empty');
});
