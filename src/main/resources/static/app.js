const API_BASE = 'https://recproyect.onrender.com';

const state = {
  reservations: [],
  spaces: [],
  submitting: false,
};

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const form = $('#reservationForm');
const feedback = $('#feedback');
const feedbackMessage = $('#feedbackMessage');
const tbody = $('#reservationsBody');
const emptyState = $('#emptyState');
const spaceSelect = $('#spaceId');

const fields = {
  spaceId: spaceSelect,
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

function showFeedback(message, type) {
  feedbackMessage.textContent = message;
  feedback.className = 'feedback feedback--visible';
  feedback.classList.add(`feedback--${type}`);
  feedback.hidden = false;
  setTimeout(() => {
    feedback.hidden = true;
    feedback.className = 'feedback';
  }, 5000);
}

function clearErrors() {
  Object.values(errors).forEach((el) => { el.textContent = ''; });
  Object.values(fields).forEach((el) => { el.classList.remove('form__input--error'); });
}

function validateForm() {
  clearErrors();
  let valid = true;

  if (!fields.spaceId.value) {
    errors.spaceId.textContent = 'Selecciona un espacio.';
    fields.spaceId.classList.add('form__input--error');
    valid = false;
  }

  if (!fields.startDate.value) {
    errors.startDate.textContent = 'La fecha de inicio es obligatoria.';
    fields.startDate.classList.add('form__input--error');
    valid = false;
  }

  if (!fields.endDate.value) {
    errors.endDate.textContent = 'La fecha de fin es obligatoria.';
    fields.endDate.classList.add('form__input--error');
    valid = false;
  }

  if (fields.startDate.value && fields.endDate.value) {
    if (new Date(fields.endDate.value) < new Date(fields.startDate.value)) {
      errors.endDate.textContent = 'La fecha de fin debe ser posterior a la de inicio.';
      fields.endDate.classList.add('form__input--error');
      valid = false;
    }
  }

  if (!fields.email.value) {
    errors.email.textContent = 'El correo electrónico es obligatorio.';
    fields.email.classList.add('form__input--error');
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value)) {
    errors.email.textContent = 'Ingresa un correo válido.';
    fields.email.classList.add('form__input--error');
    valid = false;
  }

  return valid;
}

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
        <td>${r.spaceName}</td>
        <td>${formatDate(r.startDate)}</td>
        <td>${formatDate(r.endDate)}</td>
        <td>${r.userEmail}</td>
        <td>
          <button class="table__delete-btn" data-index="${i}" type="button">
            Eliminar
          </button>
        </td>
      </tr>`
    )
    .join('');
}

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function populateSpaces(spaces) {
  spaceSelect.innerHTML = '<option value="">— Selecciona un espacio —</option>';
  spaces.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.name} — ${s.type} (${s.location})`;
    spaceSelect.appendChild(opt);
  });
}

async function fetchSpaces() {
  try {
    const res = await fetch(`${API_BASE}/spaces/all`);
    if (!res.ok) throw new Error(`Error ${res.status}`);
    state.spaces = await res.json();
    populateSpaces(state.spaces);
  } catch (err) {
    showFeedback('No se pudieron cargar los espacios. ' + err.message, 'error');
  }
}

async function fetchReservations() {
  try {
    const res = await fetch(`${API_BASE}/reservation/all`);
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const data = await res.json();
    state.reservations = data.map((r) => ({
      id: r.id,
      spaceName: r.space?.name || `Espacio #${r.space?.id}`,
      startDate: r.startDate,
      endDate: r.endDate,
      userEmail: r.user?.email || r.userEmail || '-',
      status: r.status,
    }));
    renderReservations();
  } catch (err) {
    showFeedback('No se pudieron cargar las reservas. ' + err.message, 'error');
  }
}

async function submitReservation(data) {
  const response = await fetch(`${API_BASE}/reservation/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Error del servidor: ${response.status}`);
  }
  return response.json();
}

function buildPayload() {
  const start = `${fields.startDate.value}T00:00:00`;
  const end = `${fields.endDate.value}T00:00:00`;
  return {
    spaceId: parseInt(fields.spaceId.value, 10),
    startDate: start,
    endDate: end,
    userEmail: fields.email.value,
  };
}

async function handleSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;
  if (state.submitting) return;

  state.submitting = true;
  form.querySelector('.form__btn').disabled = true;

  try {
    const created = await submitReservation(buildPayload());
    state.reservations.push({
      id: created.id,
      spaceName: created.space?.name || `Espacio #${created.space?.id}`,
      startDate: created.startDate,
      endDate: created.endDate,
      userEmail: created.user?.email || fields.email.value,
      status: created.status,
    });
    renderReservations();
    form.reset();
    clearErrors();
    showFeedback('Reserva creada con éxito.', 'success');
  } catch (err) {
    showFeedback(err.message || 'Ocurrió un error al crear la reserva.', 'error');
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
  showFeedback('Reserva eliminada (solo de la vista).', 'success');
}

function init() {
  fetchSpaces();
  fetchReservations();
  form.addEventListener('submit', handleSubmit);
  tbody.addEventListener('click', handleDelete);
}

init();
