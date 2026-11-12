function equivalence({ fractions, choices, hint, reduced, retry, solution }) {
  return {
    expression: [fractions[0], ',', fractions[1], ',', fractions[2]],
    question: '¿Qué grupo de fracciones representa la misma cantidad?',
    choices,
    hint,
    resultPrompt: 'Escribí ese valor común como fracción irreducible.',
    fields: [{ label: 'Fracción irreducible', expected: reduced, irreducible: true }],
    retry,
    solution
  };
}

function simplify({ numerator, denominator, choices, divisor, reduced, byMcd = false, hint, solution }) {
  return {
    expression: [[String(numerator), String(denominator)]],
    question: byMcd
      ? '¿Cuál es el máximo común divisor de ' + numerator + ' y ' + denominator + '?'
      : '¿Con cuál de estos divisores podés empezar a simplificar?',
    choices: choices.map(value => {
      if (value === divisor) {
        return {
          label: String(value),
          correct: true,
          feedback: byMcd
            ? 'Bien. ' + value + ' es el mayor divisor común. Dividí ambos términos de la fracción entre ' + value + '.'
            : 'Bien. ' + value + ' divide exactamente al numerador y al denominador. Después revisá si se puede seguir simplificando.'
        };
      }
      const dividesBoth = numerator % value === 0 && denominator % value === 0;
      return {
        label: String(value),
        feedback: dividesBoth
          ? value + ' divide a los dos. Buscá el mayor divisor común.'
          : value + ' tiene que dividir a ambos números sin dejar resto. Probá con otra opción.'
      };
    }),
    hint,
    resultPrompt: 'Escribí la fracción en su forma más simple.',
    fields: [{ label: 'Fracción irreducible', expected: reduced, irreducible: true }],
    retry: 'Dividí el numerador y el denominador por el mismo número y comprobá que la fracción conserve su valor.',
    solution
  };
}

export const fractionEquivalenceExercises = {
  equivalencias: [
    equivalence({
      fractions: [['3', '4'], ['6', '8'], ['9', '12']],
      choices: [
        { label: 'Solo 3/4 y 6/8', feedback: 'Ese par coincide. También podés dividir 9 y 12 entre 3 para comprobar la tercera.' },
        { label: 'Las tres fracciones', correct: true, feedback: 'Bien. Dividí 6 y 8 entre 2, y 9 y 12 entre 3. Las tres se reducen a la misma fracción.' },
        { label: 'Solo 6/8 y 9/12', feedback: 'Ese par coincide. Compará las dos fracciones reducidas con 3/4.' }
      ],
      hint: 'Probá reducir 6/8 y 9/12 para compararlas con 3/4.',
      reduced: '3/4',
      retry: 'Dividí el numerador y el denominador de 6/8 entre 2.',
      solution: '6/8 = (6 ÷ 2)/(8 ÷ 2) = 3/4. También 9/12 = (9 ÷ 3)/(12 ÷ 3) = 3/4.'
    }),
    equivalence({
      fractions: [['5', '10'], ['1', '2'], ['4', '6']],
      choices: [
        { label: '5/10 y 1/2', correct: true, feedback: 'Bien. Dividí 5 y 10 entre 5 para ver la equivalencia.' },
        { label: '5/10 y 4/6', feedback: 'Reducí 5/10 por 5 y 4/6 por 2. Compará los resultados.' },
        { label: 'Las tres fracciones', feedback: 'Revisá 4/6. Al dividir sus dos términos entre 2, queda 2/3.' }
      ],
      hint: 'Buscá la forma más simple de 5/10 y de 4/6.',
      reduced: '1/2',
      retry: 'Dividí 5 y 10 entre 5.',
      solution: '5/10 = (5 ÷ 5)/(10 ÷ 5) = 1/2. En cambio, 4/6 = 2/3.'
    }),
    equivalence({
      fractions: [['7', '9'], ['14', '18'], ['21', '30']],
      choices: [
        { label: 'Las tres fracciones', feedback: 'Si multiplicás 7 y 9 por 3, obtenés 21/27. Comparala con 21/30.' },
        { label: '14/18 y 21/30', feedback: 'Reducí 14/18 entre 2 y 21/30 entre 3. Compará los denominadores que quedan.' },
        { label: '7/9 y 14/18', correct: true, feedback: 'Bien. 14 y 18 son el doble de 7 y 9, respectivamente.' }
      ],
      hint: 'Multiplicá el numerador y el denominador de 7/9 por 2 y compará.',
      reduced: '7/9',
      retry: 'Dividí 14 y 18 entre 2.',
      solution: '14/18 = (14 ÷ 2)/(18 ÷ 2) = 7/9. En cambio, 21/30 = 7/10.'
    })
  ],
  simplificacion: [
    simplify({
      numerator: 36, denominator: 54, choices: [4, 6, 8], divisor: 6, reduced: '2/3',
      hint: 'Los dos números son múltiplos de 2 y de 3.',
      solution: 'Dividimos 36 y 54 entre 6 para obtener 6/9. Después dividimos 6 y 9 entre 3 y queda 2/3.'
    }),
    simplify({
      numerator: 120, denominator: 400, choices: [3, 9, 10], divisor: 10, reduced: '3/10',
      hint: 'Los dos números terminan en cero.',
      solution: 'Dividimos 120 y 400 entre 10 para obtener 12/40. Después dividimos 12 y 40 entre 4 y queda 3/10.'
    }),
    simplify({
      numerator: 42, denominator: 70, choices: [7, 3, 5], divisor: 7, reduced: '3/5',
      hint: 'Pensá en la tabla del 7. ¿Aparecen 42 y 70?',
      solution: 'Dividimos 42 y 70 entre 7 para obtener 6/10. Después dividimos 6 y 10 entre 2 y queda 3/5.'
    }),
    simplify({
      numerator: 81, denominator: 108, choices: [4, 9, 8], divisor: 9, reduced: '3/4',
      hint: 'La suma de las cifras de 81 es 9. ¿Cuánto suman las de 108?',
      solution: 'Dividimos 81 y 108 entre 9 para obtener 9/12. Después dividimos 9 y 12 entre 3 y queda 3/4.'
    }),
    simplify({
      numerator: 75, denominator: 45, choices: [2, 9, 5], divisor: 5, reduced: '5/3',
      hint: 'Buscá un divisor que tengan en común dos números que terminan en 5.',
      solution: 'Dividimos 75 y 45 entre 5 para obtener 15/9. Después dividimos 15 y 9 entre 3 y queda 5/3.'
    })
  ],
  mcd: [
    simplify({
      numerator: 72, denominator: 96, choices: [12, 24, 48], divisor: 24, reduced: '3/4', byMcd: true,
      hint: 'Podés usar las descomposiciones 72 = 2³ · 3² y 96 = 2⁵ · 3. Tomá cada primo común con el menor exponente.',
      solution: 'MCD(72, 96) = 2³ · 3 = 24. Dividimos 72 y 96 entre 24 y queda 3/4.'
    }),
    simplify({
      numerator: 45, denominator: 60, choices: [15, 5, 30], divisor: 15, reduced: '3/4', byMcd: true,
      hint: '45 = 3² · 5 y 60 = 2² · 3 · 5. ¿Qué factores primos tienen en común?',
      solution: 'MCD(45, 60) = 3 · 5 = 15. Dividimos 45 y 60 entre 15 y queda 3/4.'
    }),
    simplify({
      numerator: 63, denominator: 84, choices: [7, 42, 21], divisor: 21, reduced: '3/4', byMcd: true,
      hint: '63 = 3² · 7 y 84 = 2² · 3 · 7. Tomá cada primo común con el menor exponente.',
      solution: 'MCD(63, 84) = 3 · 7 = 21. Dividimos 63 y 84 entre 21 y queda 3/4.'
    })
  ]
};
