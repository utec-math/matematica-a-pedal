function withSignChoice({ operation, answer, reason, ...exercise }) {
  const correctSign = answer > 0 ? 'Positivo' : 'Negativo';
  return {
    ...exercise,
    question: 'Elegí el signo del ' + operation + '.',
    choices: ['Positivo', 'Negativo'].map(label => ({
      label,
      correct: label === correctSign,
      feedback: label === correctSign ? reason : exercise.hint + ' Volvé a elegir.'
    })),
    resultPrompt: 'Escribí el resultado con su signo.',
    fields: [{ label: 'Resultado', expected: String(answer), integer: true }]
  };
}

export const multiplicationExercises = {
  signos: [
    withSignChoice({
      expression: '(−7) · 5', operation: 'producto', answer: -35,
      hint: 'Compará el signo del −7 con el del 5.',
      reason: 'Bien. Un factor negativo y uno positivo dan un producto negativo.',
      retry: 'Multiplicá los valores absolutos 7 y 5 y aplicá el signo que elegiste.',
      solution: '(−7) · 5 = −(7 · 5) = −35.'
    }),
    withSignChoice({
      expression: '(−12) ÷ (−3)', operation: 'cociente', answer: 4,
      hint: 'Fijate si el dividendo y el divisor tienen el mismo signo.',
      reason: 'Bien. El cociente de dos números negativos es positivo.',
      retry: 'Dividí 12 entre 3 y aplicá el signo que elegiste.',
      solution: '(−12) ÷ (−3) = 12 ÷ 3 = 4.'
    }),
    withSignChoice({
      expression: '8 ÷ (−2)', operation: 'cociente', answer: -4,
      hint: 'El 8 es positivo. Compará su signo con el del divisor.',
      reason: 'Bien. Al dividir un positivo entre un negativo, el cociente es negativo.',
      retry: 'Dividí 8 entre 2 y aplicá el signo que elegiste.',
      solution: '8 ÷ (−2) = −(8 ÷ 2) = −4.'
    }),
    withSignChoice({
      expression: '(−4) · (−3) · (−2)', operation: 'producto', answer: -24,
      hint: 'Agrupá los dos primeros factores y aplicá la regla de signos dos veces.',
      reason: 'Bien. Los dos primeros negativos dan positivo y el tercer negativo cambia el signo.',
      retry: 'Calculá 4 · 3 · 2 y aplicá el signo que elegiste.',
      solution: '(−4) · (−3) = 12 y 12 · (−2) = −24.'
    }),
    withSignChoice({
      expression: ['(−15) ÷ ', ['1', '3']], operation: 'cociente', answer: -45,
      hint: 'Compará el signo de −15 con el de la fracción 1/3.',
      reason: 'Bien. Dividís un número negativo entre una fracción positiva.',
      retry: 'Dividir entre 1/3 equivale a multiplicar por 3.',
      solution: '(−15) ÷ (1/3) = (−15) · 3 = −45.'
    })
  ],
  fracciones: [
    {
      expression: [['4', '9'], ' × ', ['27', '8']],
      question: '¿Qué producto queda después de simplificar 4 con 8 y 27 con 9?',
      choices: [
        { label: '(1/9) × (27/2)', feedback: 'Simplificaste 4 con 8. Ahora dividí también 27 y 9 entre 9.' },
        { label: '(1/1) × (3/2)', correct: true, feedback: 'Bien. Dividiste 4 y 8 entre 4, y 27 y 9 entre 9.' },
        { label: '(1/1) × (3/8)', feedback: 'Si dividís el 4 entre 4, dividí también el 8 entre 4.' }
      ],
      hint: 'Reducí un factor del numerador y otro del denominador por el mismo número.',
      resultPrompt: 'Calculá y escribí el resultado como fracción.',
      fields: [{ label: 'Resultado', expected: '3/2' }],
      retry: 'Multiplicá los numeradores entre sí y los denominadores entre sí.',
      solution: '(4/9) × (27/8) = (1/1) × (3/2) = 3/2.'
    },
    {
      expression: [['5', '12'], ' ÷ ', ['25', '18']],
      question: 'Convertí la división en una multiplicación.',
      choices: [
        { label: '(5/12) × (25/18)', feedback: 'Falta invertir la segunda fracción. Buscá la que multiplicada por 25/18 da 1.' },
        { label: '(5/12) × (18/25)', correct: true, feedback: 'Bien. Conservaste 5/12 y multiplicaste por la inversa de 25/18.' },
        { label: '(12/5) × (25/18)', feedback: 'Conservá el dividendo 5/12. La inversa que necesitás es la del divisor.' }
      ],
      hint: 'Buscá la inversa multiplicativa de la fracción que está después del signo ÷.',
      resultPrompt: 'Calculá y escribí el resultado como fracción.',
      fields: [{ label: 'Resultado', expected: '3/10' }],
      retry: 'Podés simplificar 5 con 25 y 18 con 12 antes de multiplicar.',
      solution: '(5/12) ÷ (25/18) = (5/12) × (18/25) = (1/2) × (3/5) = 3/10.'
    },
    {
      expression: [['14', '15'], ' × ', ['9', '7']],
      question: '¿Qué producto queda al simplificar 14 con 7 y 9 con 15?',
      choices: [
        { label: '(2/15) × (9/1)', feedback: 'Reduciste 14 con 7. Falta dividir 9 y 15 entre 3.' },
        { label: '(2/15) × (3/1)', feedback: 'Si dividís 9 entre 3, también hay que dividir 15 entre 3.' },
        { label: '(2/5) × (3/1)', correct: true, feedback: 'Bien. 14 y 7 se reducen por 7, y 9 y 15 se reducen por 3.' }
      ],
      hint: 'Buscá un divisor común para 14 y 7, y otro para 9 y 15.',
      resultPrompt: 'Calculá y escribí el resultado como fracción.',
      fields: [{ label: 'Resultado', expected: '6/5' }],
      retry: 'Multiplicá 2 por 3 en el numerador y 5 por 1 en el denominador.',
      solution: '(14/15) × (9/7) = (2/5) × (3/1) = 6/5.'
    },
    {
      expression: [['3x', '10'], ' ÷ ', ['9', '5']],
      question: '¿Qué producto es equivalente a esta división?',
      choices: [
        { label: '(3x/10) × (5/9)', correct: true, feedback: 'Bien. Conservaste 3x/10 y usaste la inversa de 9/5.' },
        { label: '(3x/10) × (9/5)', feedback: 'Buscá la inversa de 9/5. Su producto con 9/5 tiene que dar 1.' },
        { label: '(3x/5) × (5/9)', feedback: 'La primera fracción queda igual, con denominador 10.' }
      ],
      hint: 'Conservá el dividendo e invertí solo el divisor.',
      resultPrompt: 'El resultado tiene la forma kx. ¿Cuánto vale k?',
      fields: [{ label: 'Coeficiente de x', expected: '1/6' }],
      retry: 'Multiplicá 3 por 5 y 10 por 9. Después simplificá esa fracción.',
      solution: '(3x/10) ÷ (9/5) = (3x/10) × (5/9) = 15x/90 = (1/6)x.'
    },
    {
      expression: [['2a − 6', '8'], ' × 12'],
      question: '¿Cómo escribís el numerador 2a − 6 sacando factor común 2?',
      choices: [
        { label: '2(a − 6)', feedback: 'Si distribuís el 2, aparece −12. Dividí también −6 entre 2 antes de ponerlo entre paréntesis.' },
        { label: '2(a − 3)', correct: true, feedback: 'Bien. 2 multiplica a a y a −3. Al distribuir, recuperás 2a − 6.' },
        { label: '2(a + 3)', feedback: 'El término constante del numerador es −6, así que dentro del paréntesis queda −3.' }
      ],
      hint: 'Dividí 2a y −6 entre 2 para saber qué queda dentro del paréntesis.',
      resultPrompt: 'Simplificá y escribí el resultado en la forma ka + c.',
      fields: [
        { label: 'Coeficiente de a (k)', expected: '3' },
        { label: 'Término constante con su signo (c)', expected: '-9' }
      ],
      retry: 'Reducí 2 con 8, dividí 12 entre 4 y distribuí ese resultado en (a − 3).',
      solution: '[(2a − 6)/8] × 12 = [(a − 3)/4] × 12 = 3(a − 3) = 3a − 9.'
    }
  ],
  distributiva: [
    {
      expression: '−3(2x − 5) + 6x',
      question: 'Distribuí el −3.',
      choices: [
        { label: '−6x − 15 + 6x', feedback: 'Revisá el término constante. El producto (−3) · (−5) tiene signo positivo.' },
        { label: '−6x − 5 + 6x', feedback: 'El −3 multiplica a los dos términos que están dentro del paréntesis, incluido el −5.' },
        { label: '−6x + 15 + 6x', correct: true, feedback: 'Bien. (−3) · 2x = −6x y (−3) · (−5) = 15. El +6x de afuera se conserva.' }
      ],
      hint: 'Multiplicá −3 por 2x y después por −5. Mirá los signos de cada producto.',
      resultPrompt: 'Reducí los términos semejantes y escribí el resultado.',
      fields: [{ label: 'Resultado', expected: '15', integer: true }],
      retry: 'Agrupá los términos con x. ¿Cuánto da −6x + 6x?',
      solution: '−3(2x − 5) + 6x = −6x + 15 + 6x = 15.'
    },
    {
      expression: [['5', '6'], '(3y − 9)'],
      question: '¿Qué expresión obtenés al distribuir 5/6?',
      choices: [
        { label: '(5/6) · 3y − (5/6) · 9', correct: true, feedback: 'Bien. La fracción multiplica a 3y y a 9, con el signo de la resta entre los productos.' },
        { label: '(5/6) · 3y − 9', feedback: 'El segundo término del paréntesis también se multiplica por 5/6.' },
        { label: '(5/6) · 3y + (5/6) · 9', feedback: 'Conservá la resta al distribuir.' }
      ],
      hint: 'Multiplicá el factor de afuera por cada término del paréntesis.',
      resultPrompt: 'Simplificá los productos y escribí el resultado en la forma ky + c.',
      fields: [
        { label: 'Coeficiente de y (k)', expected: '5/2' },
        { label: 'Término constante con su signo (c)', expected: '-15/2' }
      ],
      retry: 'Simplificá 15/6 en el coeficiente de y y −45/6 en el término constante.',
      solution: '(5/6)(3y − 9) = (15/6)y − 45/6 = (5/2)y − 15/2.'
    },
    {
      expression: [['7a − 21', '14']],
      question: '¿Cómo factorizás el numerador 7a − 21?',
      choices: [
        { label: '7(a − 21)', feedback: 'Al sacar 7 como factor común, dividí también −21 entre 7.' },
        { label: '7(a − 3)', correct: true, feedback: 'Bien. Al distribuir 7 volvés a obtener 7a − 21.' },
        { label: '7(a + 3)', feedback: 'Conservá el signo de −21 cuando lo dividas entre 7.' }
      ],
      hint: 'Ambos términos del numerador tienen 7 como factor.',
      resultPrompt: 'La expresión simplificada tiene la forma k(a − 3). ¿Cuánto vale k?',
      fields: [{ label: 'Factor delante del paréntesis', expected: '1/2' }],
      retry: 'Reducí la fracción 7/14 que multiplica a (a − 3).',
      solution: '(7a − 21)/14 = [7(a − 3)]/14 = (1/2)(a − 3).'
    },
    {
      expression: [['2', '3'], 'x − ', ['5', '6'], 'x'],
      question: 'Reescribí ambos coeficientes con denominador 6.',
      choices: [
        { label: '(2/6)x − (5/6)x', feedback: 'Para que 2/3 conserve su valor, multiplicá el numerador y el denominador por 2.' },
        { label: '(4/6)x + (5/6)x', feedback: 'Los denominadores coinciden. Revisá el signo de la operación entre los términos.' },
        { label: '(4/6)x − (5/6)x', correct: true, feedback: 'Bien. 2/3 = 4/6 y la resta se conserva.' }
      ],
      hint: 'El 6 es el doble de 3. Hacé el mismo cambio en el numerador de 2/3.',
      resultPrompt: 'Reducí los términos semejantes. ¿Qué coeficiente queda delante de x?',
      fields: [{ label: 'Coeficiente de x', expected: '-1/6' }],
      retry: 'Calculá 4 − 5 en el numerador y conservá el denominador 6.',
      solution: '(2/3)x − (5/6)x = (4/6)x − (5/6)x = (−1/6)x.'
    },
    {
      expression: ['4 · ', ['x + 2', '8'], ' + ', ['x + 2', '4']],
      question: 'Simplificá el factor 4/8 del primer término.',
      choices: [
        { label: '(1/2)(x + 2) + (1/4)(x + 2)', correct: true, feedback: 'Bien. 4/8 se reduce a 1/2 y el segundo término se conserva.' },
        { label: '(1/8)(x + 2) + (1/4)(x + 2)', feedback: 'Para reducir 4/8, dividí tanto 4 como 8 entre 4.' },
        { label: '(1/2)(x + 2) + (1/8)(x + 2)', feedback: 'Reducí 4/8 en el primer término. El segundo término ya tiene coeficiente 1/4.' }
      ],
      hint: 'Escribí el primer término como (4/8)(x + 2) y reducí la fracción.',
      resultPrompt: 'Sacá (x + 2) como factor común. ¿Qué coeficiente queda delante?',
      fields: [{ label: 'Factor delante del paréntesis', expected: '3/4' }],
      retry: 'Sumá 1/2 y 1/4. Podés escribir 1/2 como 2/4.',
      solution: '(4/8)(x + 2) + (1/4)(x + 2) = (1/2 + 1/4)(x + 2) = (3/4)(x + 2).'
    }
  ]
};
