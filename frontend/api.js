/* api.js - util condivise + wrapper API */
'use strict';

// ====== CONFIG ======
const BASE_URL = 'http://localhost:5074'; // <-- aggiorna porta se serve

// ====== UTILS DOM ======
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function ready(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn, { once: true });
}

// Toast robusto
function ensureToastContainer() {
  let box = $('#toast');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toast';
    document.body.appendChild(box);
  }
  return box;
}
function toast(msg, type = 'ok', ms = 3000) {
  const box = ensureToastContainer();
  const el = document.createElement('div');
  el.className = `toast ${type === 'err' ? 'err' : ''}`;
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

// Formattazioni
const fmtMoney = n => (n ?? 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
const fmtDate  = iso => iso ? new Date(iso).toLocaleString('it-IT') : '—';

function toLocalInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = x => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Popola <select>
function populateSelect(selector, items, { includeBlank = false, blankLabel = '— Seleziona —' } = {}) {
  const el = $(selector);
  if (!el) return;
  el.innerHTML = '';
  if (includeBlank) {
    const o = document.createElement('option');
    o.value = ''; o.textContent = blankLabel; el.appendChild(o);
  }
  items.forEach(it => {
    const [value, label] = typeof it === 'string' ? [it, it] : [it.value, it.label];
    const o = document.createElement('option');
    o.value = value; o.textContent = label;
    el.appendChild(o);
  });
}

// ====== ELENCHI PREDEFINITI ======
const GENERI = [
  'Azione','Avventura','Animazione','Commedia','Crime','Documentario',
  'Drammatico','Fantasy','Storico','Horror','Mistero','Romantico','Thriller',
  'Western','Guerra','Musicale',{ value: 'Sci-Fi', label: 'Fantascienza (Sci-Fi)' }
];
const LINGUE = [
  { value:'IT', label:'Italiano' }, { value:'EN', label:'Inglese' }, { value:'ES', label:'Spagnolo' },
  { value:'FR', label:'Francese' }, { value:'DE', label:'Tedesco'  }, { value:'JA', label:'Giapponese' },
  { value:'ZH', label:'Cinese'   }, { value:'KO', label:'Coreano'  }
];
const NAZIONALITA = [
  { value:'ITA', label:'Italia' }, { value:'USA', label:'USA' }, { value:'FRA', label:'Francia' },
  { value:'GBR', label:'Regno Unito' }, { value:'DEU', label:'Germania' }, { value:'ESP', label:'Spagna' },
  { value:'JPN', label:'Giappone' }, { value:'KOR', label:'Corea del Sud' }, { value:'CAN', label:'Canada' }, { value:'IND', label:'India' }
];
const SALE = ['Sala 1','Sala 2','Sala 3','Sala 4'];

// ====== API WRAPPER ======
async function api(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => null);
    throw new Error(msg || `${res.status} ${res.statusText}`);
  }
  return res.status === 204 ? null : res.json();
}

const ProiezioniApi = {
  list: (p = {}) => api(`/proiezioni${Object.keys(p).length ? `?${new URLSearchParams(p)}` : ''}`),
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

// Esporta
window.CinemaApi = {
  ProiezioniApi, BigliettiApi,
  utils: { $, $$, ready, toast, fmtMoney, fmtDate, toLocalInputValue, populateSelect,
           GENERI, LINGUE, NAZIONALITA, SALE }
};
