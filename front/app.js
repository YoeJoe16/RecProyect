/* ===== Estado ===== */
const state = {
  reservations: [],
  submitting: false,
};

/* ===== Referencias DOM ===== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const form = $('#reservationForm');
const feedback = $('#feedback');
const feedbackMessage = $('#feedbackMessage');
const tbody = $('#reservationsBody');
const emptyState = $('#emptyState');

const fields = {
  spaceId: $('#spaceId'),
  startDate: $('#startDate'),
  endDate: $('#endDate'),
  email: $('#email'),
};

const errors = {
  spaceId: $('#spaceIdError'),
  startDate: $('#startDateError'),
  endDate: $('#endDateError'),
  email: $('#emailError'),
};

/* ===== Feedback ===== */
function showFeedback(message, type) {
  feedbackMessage.textContent = message;
  feedback.className = 'feedback';
  feedback.classList.add(`feedback--${type}`, 'feedback--visible');
  feedback.hidden = false;

  setTimeout(() => {
    feedback.hidden = true;
    feedback.className = 'feedback';
  }, 5000);
}

/* ===== Validación ===== */
function clearErrors() {
  Object.values(errors).forEach((el) => { el.textContent = ''; });
  Object.values(fields).forEach((el) => { el.classList.remove('form__input--error'); });
}

function setError(field, message) {
  field.classList.add('form__input--error');
}

function validateForm() {
  clearErrors();
  let valid = true;

  if (!fields.spaceId.value) {
    errors.spaceId.textContent = 'Selecciona un espacio.';
    setError(fields.spaceId);
    valid = false;
  }

  if (!fields.startDate.value) {
    errors.startDate.textContent = 'La fecha de inicio es obligatoria.';
    setError(fields.startDate);
    valid = false;
  }

  if (!fields.endDate.value) {
    errors.endDate.textContent = 'La fecha de fin es obligatoria.';
    setError(fields.endDate);
    valid = false;
  }

  if (fields.startDate.value && fields.endDate.value) {
    if (new Date(fields.endDate.value) < new Date(fields.startDate.value)) {
      errors.endDate.textContent = 'La fecha de fin debe ser posterior a la de inicio.';
      setError(fields.endDate);
      valid = false;
    }
  }

  if (!fields.email.value) {
    errors.email.textContent = 'El correo electrónico es obligatorio.';
    setError(fields.email);
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value)) {
    errors.email.textContent = 'Ingresa un correo válido.';
    setError(fields.email);
    valid = false;
  }

  return valid;
}

/* ===== Renderizar tabla ===== */
function renderReservations() {
  if (state.reservations.length === 0) {
    tbody.innerHTML = '';
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  tbody.innerHTML = state.reservations
    .map(
      (r, i) => `
      <tr>
        <td>${r.spaceId}</td>
        <td>${r.startDate}</td>
        <td>${r.endDate}</td>
        <td>${r.email}</td>
        <td>
          <button class="table__delete-btn" data-index="${i}" type="button">
            Eliminar
          </button>
        </td>
      </tr>`
    )
    .join('');
}

/* ===== Enviar reserva (simulado) ===== */
async function submitReservation(data) {
  const body = JSON.stringify(data);

  // Simulación: reemplaza esta URL con tu endpoint real
  const response = await fetch(
    'https://api.example.com/reservations',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }
  );

  if (!response.ok) {
    throw new Error(`Error del servidor: ${response.status}`);
  }

  return response.json();
}

/* ===== Handlers ===== */
async function handleSubmit(e) {
  e.preventDefault();

  if (!validateForm()) return;
  if (state.submitting) return;

  state.submitting = true;
  form.querySelector('.form__btn').disabled = true;

  const payload = {
    spaceId: fields.spaceId.value,
    startDate: fields.startDate.value,
    endDate: fields.endDate.value,
    email: fields.email.value,
  };

  try {
    await submitReservation(payload);

    state.reservations.push(payload);
    renderReservations();
    form.reset();
    clearErrors();
    showFeedback('Reserva creada con éxito.', 'success');
  } catch (err) {
    showFeedback(
      err.message || 'Ocurrió un error al crear la reserva. Intenta de nuevo.',
      'error'
    );
  } finally {
    state.submitting = false;
    form.querySelector('.form__btn').disabled = false;
  }
}

function handleDelete(e) {
  const btn = e.target.closest('.table__delete-btn');
  if (!btn) return;

  const index = Number(btn.dataset.index);
  state.reservations.splice(index, 1);
  renderReservations();
  showFeedback('Reserva eliminada.', 'success');
}

/* ===== Inicialización ===== */
function init() {
  // Reservas de ejemplo
  state.reservations.push(
    { spaceId: 'SALA-A', startDate: '2026-06-20', endDate: '2026-06-21', email: 'ana@ejemplo.com' },
    { spaceId: 'MESA-01', startDate: '2026-06-22', endDate: '2026-06-23', email: 'luis@ejemplo.com' },
  );

  renderReservations();
  form.addEventListener('submit', handleSubmit);
  tbody.addEventListener('click', handleDelete);
}

init();
