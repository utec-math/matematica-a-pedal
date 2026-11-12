import { mountPractice } from './multiplication-practice.js?v=3';
import { fractionEquivalenceExercises } from './fraction-equivalence-exercises.js';

const practice = document.getElementById('practica-fracciones');
const fallback = document.getElementById('fraction-equivalence-practice-fallback');
mountPractice(practice, fractionEquivalenceExercises, fallback);
