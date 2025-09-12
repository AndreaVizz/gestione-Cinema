// ====== CONFIG ======
const BASE_URL = 'http://localhost:5074'; // <-- cambia porta se serve

// ====== UTILS ======
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const toastBox = $('#toast');
function toast(msg, type = 'ok', ms = 3000) {
  const div = document.createElement('div');
  div.className = `toast ${type === 'err' ? 'err' : ''}`;
  div.textContent = msg;
  toastBox.appendChild(div);
  setTimeout(() => div.remove(), ms);
}

const fmtMoney = n => (n ?? 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
const fmtDate = iso => iso ? new Date(iso).toLocaleString('it-IT') : '—';

// ====== API ======
async function api(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

const ProiezioniApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params);
    return api(`/proiezioni${q.toString() ? '?' + q.toString() : ''}`);
  },
  get: id => api(`/proiezioni/${id}`),
  create: dto => api('/proiezioni', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id, dto) => api(`/proiezioni/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  remove: id => api(`/proiezioni/${id}`, { method: 'DELETE' })
};

const BigliettiApi = {
  list: () => api('/biglietti'),
  get: id => api(`/biglietti/${id}`),
  acquista: dto => api('/biglietti/acquista', { method: 'POST', body: JSON.stringify(dto) }),
  remove: id => api(`/biglietti/${id}`, { method: 'DELETE' })
};

// ====== UI: PROIEZIONI ======
const tbodyP = $('#tab-proiezioni tbody');
async function loadProiezioni(params) {
  try {
    const data = await ProiezioniApi.list(params);
    renderProiezioni(data);
  } catch (e) {
    toast(`Errore proiezioni: ${e.message}`, 'err');
  }
}

function renderProiezioni(list) {
  tbodyP.innerHTML = '';
  list.forEach(p => {
    const disp = (p.postiTotali ?? 0) - (p.postiOccupati ?? 0);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.titolo}</td>
      <td><span class="badge">${p.genere || '—'}</span></td>
      <td><span class="badge">${p.lingua || '—'}</span></td>
      <td>${p.sala}</td>
      <td>${fmtDate(p.orarioInizio)}</td>
      <td>${p.durataMin || '—'}</td>
      <td>${fmtMoney(p.prezzo)}</td>
      <td>${disp}</td>
      <td>
        <button class="btn primary" data-act="acquista" data-id="${p.id}">Acquista</button>
        <button class="btn" data-act="modifica" data-id="${p.id}">Modifica</button>
        <button class="btn danger" data-act="elimina" data-id="${p.id}">Elimina</button>
      </td>
    `;
    tbodyP.appendChild(tr);
  });
}

// Delega azioni proiezioni
tbodyP.addEventListener('click', async (ev) => {
  const btn = ev.target.closest('button[data-act]');
  if (!btn) return;
  const id = +btn.dataset.id;
  const act = btn.dataset.act;

  if (act === 'acquista') {
    $('#a-proiezioneId').value = id;
    $('#a-fila').value = '';
    $('#a-numero').value = '';
    $('#dlg-acquisto').showModal();
    return;
  }

  if (act === 'modifica') {
    try {
      const p = await ProiezioniApi.get(id);
      fillFormProiezione(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      toast(`Impossibile caricare proiezione: ${e.message}`, 'err');
    }
    return;
  }

  if (act === 'elimina') {
    if (!confirm('Eliminare questa proiezione?')) return;
    try {
      await ProiezioniApi.remove(id);
      toast('Proiezione eliminata');
      await refreshAll();
    } catch (e) {
      toast(e.message || 'Errore eliminazione (se esistono biglietti ricevi 409)', 'err');
    }
  }
});

// ====== FORM PROIEZIONE ======
const formP = $('#form-proiezione');
$('#btn-reset-form').addEventListener('click', resetFormProiezione);

function resetFormProiezione() {
  formP.reset();
  $('#proiezione-id').value = '';
  $('#form-title').textContent = 'Inserisci/Modifica Proiezione';
}

function fillFormProiezione(p) {
  $('#proiezione-id').value = p.id;
  $('#titolo').value = p.titolo || '';
  $('#durataMin').value = p.durataMin ?? '';
  $('#genere').value = p.genere || '';
  $('#nazionalita').value = p.nazionalita || '';
  $('#lingua').value = p.lingua || '';
  $('#descrizione').value = p.descrizione || '';
  $('#sala').value = p.sala || '';
  // convert ISO -> datetime-local
  $('#orarioInizio').value = p.orarioInizio ? toLocalInputValue(p.orarioInizio) : '';
  $('#postiTotali').value = p.postiTotali ?? 100;
  $('#prezzo').value = p.prezzo ?? 8.5;
}

function toLocalInputValue(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

formP.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const id = $('#proiezione-id').value;

  // Validazioni minime lato client
  const titolo = $('#titolo').value.trim();
  const genere = $('#genere').value.trim();
  const nazionalita = $('#nazionalita').value.trim();
  const lingua = $('#lingua').value.trim();
  const descrizione = $('#descrizione').value.trim();
  const sala = $('#sala').value.trim();
  const orarioInizio = $('#orarioInizio').value;

  if (!titolo || !genere || !nazionalita || !lingua || !descrizione || !sala || !orarioInizio) {
    toast('Compila tutti i campi obbligatori (*)', 'err');
    return;
  }

  const dto = {
    titolo,
    durataMin: parseInt($('#durataMin').value || '0', 10),
    genere,
    nazionalita,
    lingua,
    descrizione,
    sala,
    orarioInizio: new Date(orarioInizio).toISOString(),
    postiTotali: parseInt($('#postiTotali').value || '100', 10),
    prezzo: parseFloat($('#prezzo').value || '8.50')
  };

  try {
    if (id) {
      await ProiezioniApi.update(id, dto);
      toast('Proiezione aggiornata');
    } else {
      await ProiezioniApi.create(dto);
      toast('Proiezione creata');
    }
    resetFormProiezione();
    await refreshAll();
  } catch (e) {
    toast(`Errore salvataggio: ${e.message}`, 'err');
  }
});

// Filtri
$('#btn-filtra').addEventListener('click', () => {
  const genere = $('#f-genere').value.trim();
  const lingua = $('#f-lingua').value.trim();
  const params = {};
  if (genere) params.genere = genere;
  if (lingua) params.lingua = lingua;
  loadProiezioni(params);
});
$('#btn-reset-filtri').addEventListener('click', () => {
  $('#f-genere').value = '';
  $('#f-lingua').value = '';
  loadProiezioni();
});

// ====== UI: BIGLIETTI ======
const tbodyB = $('#tab-biglietti tbody');

async function loadBiglietti() {
  try {
    const data = await BigliettiApi.list();
    renderBiglietti(data);
  } catch (e) {
    toast(`Errore biglietti: ${e.message}`, 'err');
  }
}

function renderBiglietti(list) {
  tbodyB.innerHTML = '';
  list.forEach(b => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code>${b.codice}</code></td>
      <td>${b.proiezioneTitolo || b.titoloProiezione || '(eliminata)'}</td>
      <td>${b.sala || '-'}</td>
      <td>${fmtDate(b.orarioInizio)}</td>
      <td>Fila ${b.fila} • ${b.numero}</td>
      <td>${fmtMoney(b.costo)}</td>
      <td>${fmtDate(b.orarioAcquisto)}</td>
      <td>
        <button class="btn danger" data-bid="${b.id}" data-act="del-b">Cancella</button>
      </td>
    `;
    tbodyB.appendChild(tr);
  });
}

tbodyB.addEventListener('click', async (ev) => {
  const btn = ev.target.closest('button[data-act="del-b"]');
  if (!btn) return;
  const id = +btn.dataset.bid;
  if (!confirm('Cancellare questo biglietto?')) return;
  try {
    await BigliettiApi.remove(id);
    toast('Biglietto cancellato');
    await refreshAll();
  } catch (e) {
    toast(`Errore cancellazione: ${e.message}`, 'err');
  }
});

$('#btn-aggiorna-biglietti').addEventListener('click', loadBiglietti);

// ====== DIALOG ACQUISTO ======
const dlg = $('#dlg-acquisto');
$('#form-acquisto').addEventListener('close', () => {
  // noop, <dialog> usa value in submit
});
$('#form-acquisto').addEventListener('submit', async (ev) => {
  // l’evento submit parte prima di chiudere il dialog se value="ok"
  // usiamo preventDefault e chiudiamo noi per sicurezza
  ev.preventDefault();
  const form = ev.target;
  // se è stato premuto "Annulla", non fare nulla
  const submitter = ev.submitter;
  if (submitter && submitter.value === 'cancel') {
    dlg.close();
    return;
  }

  const proiezioneId = +$('#a-proiezioneId').value;
  const fila = $('#a-fila').value.trim();
  const numero = parseInt($('#a-numero').value || '0', 10);

  if (!fila || numero <= 0) {
    toast('Inserisci fila e numero validi', 'err');
    return;
  }

  try {
    await BigliettiApi.acquista({ proiezioneId, fila, numero });
    dlg.close();
    toast('Acquisto completato');
    await refreshAll();
  } catch (e) {
    dlg.close();
    toast(e.message || 'Acquisto non riuscito (409 in caso di posto occupato o sold-out)', 'err');
  }
});

// ====== BOOT ======
async function refreshAll() {
  await Promise.all([loadProiezioni(), loadBiglietti()]);
}

// primo caricamento
refreshAll();
