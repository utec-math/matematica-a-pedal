const practice = document.getElementById('practica-propiedades');
const navigation = practice.querySelector('.practice-nav');
const steps = navigation.querySelectorAll('[data-practice-go]');
const screens = practice.querySelectorAll('[data-practice-screen]');

function showScreen(id) {
  screens.forEach(screen => {
    screen.hidden = screen.id !== id;
  });
  steps.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.practiceGo === id));
  });
}

practice.querySelectorAll('[data-practice-go]').forEach(button => {
  button.addEventListener('click', () => {
    const id = button.dataset.practiceGo;
    showScreen(id);
    if (!navigation.contains(button)) {
      document.getElementById(id).querySelector('h3').focus();
    }
  });
  button.hidden = false;
});

function checkAnswer(form) {
  const strategy = form.querySelector('input[name="estrategia"]:checked');
  if (!strategy) return 'Elegí una reescritura para comprobarla.';
  if (strategy.value !== 'correcta') return strategy.dataset.feedback;

  const result = form.elements.namedItem('resultado').value.trim();
  if (!result) return 'La reescritura es correcta. Escribí el resultado para terminar.';
  if (Number(result) !== Number(form.dataset.result)) {
    return 'La reescritura es correcta. Revisá el cálculo e intentá otra vez.';
  }
  return `Correcto. ${form.dataset.explanation}`;
}

practice.querySelectorAll('[data-practice-form]').forEach(form => {
  const feedback = form.querySelector('output');
  form.addEventListener('submit', event => {
    event.preventDefault();
    feedback.textContent = checkAnswer(form);
  });
  form.addEventListener('input', () => {
    feedback.textContent = '';
  });
  form.hidden = false;
});

showScreen(steps[0].dataset.practiceGo);
navigation.hidden = false;
